import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  FiUpload, 
  FiDownload, 
  FiTrash2, 
  FiFile, 
  FiImage, 
  FiFileText,
  FiRefreshCw,
  FiInfo,
  FiFilter,
  FiSearch
} from 'react-icons/fi';
import { adminAPI } from '@/api/admin';
import { showSuccess, showError, showInfo } from '@/utils/toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { TOKEN_KEY } from '@/utils/constants';

interface FileInfo {
  id: string;
  name: string;
  original_name: string;
  // path: string; // 严格禁止这种用法 ！！！
  size: number;
  type: string;
  mime_type: string;
  user_id: string;
  user_name: string;
  created_at: string;
  updated_at: string;
}

interface FileStats {
  total_files: number;
  total_resumes: number;
  total_avatars: number;
  total_size: number;
  storage_path: string;
  storage_used: number;
}

const FileManagement: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [stats, setStats] = useState<FileStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [fileType, setFileType] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载文件列表
  const loadFiles = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        page_size: pageSize,
        ...(fileType !== 'all' && { type: fileType })
      };
      
      const response = await adminAPI.getFiles(params);
      if (response.code === 0) {
        setFiles(response.data.list || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '加载文件列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载文件统计
  const loadStats = async () => {
    try {
      const response = await adminAPI.getFileStats();
      if (response.code === 0) {
        setStats(response.data);
      }
    } catch (error) {
      showError('加载文件统计失败');
    }
  };

  // 上传文件
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const response = await adminAPI.uploadFile(files[0]);
      
      if (response.code === 0) {
        showSuccess('文件上传成功');
        loadFiles();
        loadStats();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '文件上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 删除文件
  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('确定要删除这个文件吗？')) return;

    try {
      await adminAPI.deleteFile(fileId);
      showSuccess('文件删除成功');
      loadFiles();
      loadStats();
    } catch (error) {
      showError(error instanceof Error ? error.message : '删除文件失败');
    }
  };

  // 批量删除文件
  const handleBatchDelete = async () => {
    if (selectedFiles.length === 0) {
      showInfo('请选择要删除的文件');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedFiles.length} 个文件吗？`)) return;

    try {
      await adminAPI.batchDeleteFiles(selectedFiles);
      showSuccess(`成功删除 ${selectedFiles.length} 个文件`);
      setSelectedFiles([]);
      loadFiles();
      loadStats();
    } catch (error) {
      showError(error instanceof Error ? error.message : '批量删除失败');
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取文件图标
  const getFileIcon = (type: string, mimeType: string) => {
    if (type === 'image' || mimeType.startsWith('image/')) {
      return <FiImage className="w-5 h-5 text-green-500" />;
    }
    if (type === 'document' || mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('text')) {
      return <FiFileText className="w-5 h-5 text-blue-500" />;
    }
    return <FiFile className="w-5 h-5 text-gray-500" />;
  };

  // 切换文件选择
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map(file => file.id));
    }
  };

  // 迁移文件数据
  const handleMigrateFiles = async () => {
    if (!confirm('确定要迁移文件数据吗？这将把旧的文件数据迁移到新的文件管理系统中。')) return;

    try {
      setMigrating(true);
      await adminAPI.migrateFileData();
      showSuccess('文件数据迁移成功');
      loadFiles();
      loadStats();
    } catch (error) {
      showError(error instanceof Error ? error.message : '文件数据迁移失败');
    } finally {
      setMigrating(false);
    }
  };

  useEffect(() => {
    loadFiles();
    loadStats();
  }, [currentPage, fileType, searchKeyword]);

  const totalPages = Math.ceil(total / pageSize);

  const downloadFile = async (file: FileInfo) => {
    try {
      // 下载文件需要鉴权，所以先下载到浏览器，再下给用户
      // 使用 axios 直接请求，指定 responseType 为 blob 来正确处理二进制数据
      const response = await axios.get(`/api/files/${file.id}/preview?as_attachment=true`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`
        }
      });
      
      // 创建 blob 对象
      const blob = new Blob([response.data], { type: file.mime_type });
      const url = URL.createObjectURL(blob);
      
      // 创建下载链接并触发下载
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSuccess('文件下载成功');
    } catch (error) {
      console.error('文件下载失败:', error);
      showError('文件下载失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">文件管理</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatsModal(true)}
            className="flex items-center gap-2"
          >
            <FiInfo className="w-4 h-4" />
            统计信息
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            <FiUpload className="w-4 h-4" />
            {uploading ? '上传中...' : '上传文件'}
          </Button>
          
          {selectedFiles.length > 0 && (
            <Button
              variant="danger"
              onClick={handleBatchDelete}
              className="flex items-center gap-2"
            >
              <FiTrash2 className="w-4 h-4" />
              批量删除 ({selectedFiles.length})
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={loadFiles}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          
          <Button
            variant="outline"
            onClick={handleMigrateFiles}
            disabled={migrating}
            className="flex items-center gap-2"
          >
            <FiRefreshCw className={`w-4 h-4 ${migrating ? 'animate-spin' : ''}`} />
            {migrating ? '迁移中...' : '迁移数据'}
          </Button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <FiFilter className="w-4 h-4 text-gray-500" />
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部文件</option>
            <option value="resume">简历文档</option>
            <option value="avatar">头像图片</option>
            <option value="image">图片文件</option>
          </select>
        </div>
        
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索文件名..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 文件列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={files.length > 0 && selectedFiles.length === files.length}
              onChange={toggleSelectAll}
              className="mr-3"
            />
            <span className="text-sm font-medium text-gray-700">
              共 {total} 个文件
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <FiRefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center">
            <FiFile className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">暂无文件</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {files.map((file) => (
              <div key={file.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                    />
                    {getFileIcon(file.type, file.mime_type)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {file.original_name} • {formatFileSize(file.size)} • {file.user_name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                      {file.type}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(file)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FiDownload className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            显示 {(currentPage - 1) * pageSize + 1} 到 {Math.min(currentPage * pageSize, total)} 条，共 {total} 条
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              上一页
            </Button>
            <span className="px-3 py-1 text-sm bg-gray-100 rounded">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* 统计信息模态框 */}
      <Modal
        open={showStatsModal}
        size="lg"
        onClose={() => setShowStatsModal(false)}
        title="文件统计信息"
      >
        {stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">总文件数</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total_files}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium">简历文档</p>
                <p className="text-2xl font-bold text-green-900">{stats.total_resumes}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">头像图片</p>
                <p className="text-2xl font-bold text-purple-900">{stats.total_avatars}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-600 font-medium">存储使用</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {formatFileSize(stats.storage_used)}
                </p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 font-medium">存储路径</p>
              <p className="text-sm text-gray-900 font-mono break-all">{stats.storage_path}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 font-medium">总存储大小</p>
              <p className="text-lg font-bold text-gray-900">
                {formatFileSize(stats.total_size)}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FileManagement;
