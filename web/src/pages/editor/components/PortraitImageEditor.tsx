import { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, UserRound } from 'lucide-react';
import { Modal } from '@/components/ui';
import { fileAPI } from '@/api/file';
import { showSuccess, showError } from '@/utils/toast';
import type { Area } from 'react-easy-crop';

interface PortraitImageEditorProps {
  /** 当前图片 URL */
  currentImageUrl?: string;
  /** 图片上传成功回调 */
  onImageChange: (imageUrl: string) => void;
  /** 图片尺寸（宽x高） */
  imageSize?: { width: number; height: number };
  /** 裁剪框宽高比 */
  aspect?: number;
  /** 唯一标识符（用于 input id） */
  id?: string;
}

/**
 * 证件照编辑器组件
 * 支持图片上传、替换和裁剪功能
 */
export default function PortraitImageEditor({
  currentImageUrl,
  onImageChange,
  aspect = 3 / 4, // 默认 3:4 比例（证件照常用比例）
  id = 'portrait-editor',
}: PortraitImageEditorProps) {
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      showError('请上传图片文件');
      return;
    }

    // 验证文件大小（max 5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showError('图片大小不能超过 5MB');
      return;
    }

    // 读取文件并显示裁剪界面
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setShowCropModal(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.onerror = () => {
      showError('图片读取失败');
    };
    reader.readAsDataURL(file);

    // 重置 input，以便可以再次选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // 裁剪完成回调
  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // 创建裁剪后的图片
  const createImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });
  };

  // 获取裁剪后的图片数据
  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('无法创建画布上下文');
    }

    // 设置画布尺寸为裁剪区域尺寸
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // 绘制裁剪后的图片
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // 转换为 Blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('图片转换失败'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.95 // 质量 95%
      );
    });
  };

  // 确认裁剪并上传
  const handleConfirmCrop = useCallback(async () => {
    if (!croppedAreaPixels || !imageSrc) {
      showError('请先选择图片');
      return;
    }

    try {
      setIsUploading(true);

      // 生成裁剪后的图片
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      // 创建 File 对象
      const croppedFile = new File([croppedImageBlob], 'portrait.jpg', {
        type: 'image/jpeg',
      });

      // 上传文件
      const response = await fileAPI.uploadFile(croppedFile);

      if (response.code === 0) {
        const fileId = response.data.id;
        const photoUrl = fileAPI.previewFile(fileId);
        onImageChange(photoUrl);
        setShowCropModal(false);
        setImageSrc('');
        showSuccess('证件照上传成功');
      } else {
        showError(response.msg || '上传失败');
      }
    } catch (error) {
      console.error('Crop and upload error:', error);
      showError(error instanceof Error ? error.message : '处理失败');
    } finally {
      setIsUploading(false);
    }
  }, [croppedAreaPixels, imageSrc, onImageChange]);

  // 取消裁剪
  const handleCancelCrop = useCallback(() => {
    setShowCropModal(false);
    setImageSrc('');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, []);

  // 触发文件选择
  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <>
      <div className="flex-shrink-0 relative">
        {currentImageUrl ? (
          <div className="relative">
            <img
              src={currentImageUrl}
              alt="证件照"
              className="w-[120px] h-[160px] object-cover rounded border-2 border-gray-300"
            />
            <div
              onClick={triggerFileSelect}
              className="absolute top-0 left-0 w-full h-full bg-gray-500/50 opacity-0 hover:opacity-100 flex flex-col items-center justify-center gap-1 text-white cursor-pointer transition-opacity rounded"
              title="替换证件照"
            >
              <Upload className="w-8 h-8" />
              <span className="text-sm">替换证件照</span>
            </div>
          </div>
        ) : (
          <div
            onClick={triggerFileSelect}
            className="w-32 h-40 bg-gray-50 rounded border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-gray-100 transition-colors"
            title="上传证件照"
          >
            <UserRound className="w-10 h-10 text-gray-300" />
            <span className="text-xs text-gray-400 mt-2">上传证件照</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id={`${id}-input`}
        />
      </div>

      {/* 裁剪模态框 */}
      <Modal
        open={showCropModal}
        onClose={handleCancelCrop}
        title="裁剪证件照"
        size="lg"
        maskClosable={false}
        showFooter={false}
        onConfirm={handleConfirmCrop}
        confirmText="确认裁剪"
        confirmLoading={isUploading}
        confirmDisabled={!croppedAreaPixels || isUploading}
        onCancel={handleCancelCrop}
        cancelText="取消"
        confirmVariant="primary"
      >
        <div className="relative p-4 w-full h-96 overflow-hidden border border-gray-200 rounded-lg">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape="rect"
              showGrid={true}
              style={{
                containerStyle: {
                  width: '100%',
                  height: '100%',
                },
              }}
            />
          )}
        </div>
      </Modal>
    </>
  );
}

