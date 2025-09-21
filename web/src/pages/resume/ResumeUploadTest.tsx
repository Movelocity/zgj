import React, { useState } from 'react';
import { FiUpload, FiFileText, FiX, FiDownload } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { resumeAPI } from '@/api/resume';
import type { ResumeUploadData, ResumeUploadResponse } from '@/types/resume';
import { showSuccess, showError, showWarning } from '@/utils/toast';

const ResumeUploadTest: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ResumeUploadResponse | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  // 添加测试结果
  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // 文件选择处理
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // 检查文件类型
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      showWarning('请上传 PDF、DOC 或 DOCX 格式的简历文件');
      addTestResult(`❌ 文件类型检查失败: ${fileExtension}`);
      return;
    }

    // 检查文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showWarning('文件大小不能超过 10MB');
      addTestResult(`❌ 文件大小检查失败: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    setSelectedFile(file);
    addTestResult(`✅ 文件选择成功: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);
  };

  // 测试简历上传
  const testResumeUpload = async () => {
    if (!selectedFile) {
      showWarning('请先选择文件');
      return;
    }

    try {
      setUploading(true);
      addTestResult('🚀 开始测试简历上传...');

      const uploadData: ResumeUploadData = { file: selectedFile };
      const response = await resumeAPI.uploadResume(uploadData);

      if (response.code === 0 && response.data) {
        setUploadResult(response.data);
        showSuccess('简历上传成功');
        addTestResult(`✅ 简历上传成功: ID=${response.data.id}, 编号=${response.data.resume_number}`);
        addTestResult(`📄 文件信息: ${response.data.filename} (${(response.data.size / 1024).toFixed(2)}KB)`);
        addTestResult(`🔗 访问路径: ${response.data.url}`);
      } else {
        throw new Error(response.msg || '上传失败');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '简历上传失败';
      showError(errorMsg);
      addTestResult(`❌ 简历上传失败: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  // 测试文件下载
  const testFileDownload = () => {
    if (!uploadResult) {
      showWarning('请先上传文件');
      return;
    }

    try {
      addTestResult('🔽 开始测试文件下载...');
      const downloadUrl = `/api/files/${uploadResult.id}/preview?as_attachment=true`;
      window.open(downloadUrl, '_blank');
      addTestResult(`✅ 文件下载测试: ${downloadUrl}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '文件下载失败';
      addTestResult(`❌ 文件下载失败: ${errorMsg}`);
    }
  };

  // 测试文件预览
  const testFilePreview = () => {
    if (!uploadResult) {
      showWarning('请先上传文件');
      return;
    }

    try {
      addTestResult('👁️ 开始测试文件预览...');
      const previewUrl = `/api/files/${uploadResult.id}/preview`;
      window.open(previewUrl, '_blank');
      addTestResult(`✅ 文件预览测试: ${previewUrl}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '文件预览失败';
      addTestResult(`❌ 文件预览失败: ${errorMsg}`);
    }
  };

  // 清除测试结果
  const clearResults = () => {
    setTestResults([]);
    setUploadResult(null);
    setSelectedFile(null);
    if (document.getElementById('file-input')) {
      (document.getElementById('file-input') as HTMLInputElement).value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            简历上传功能测试
          </h1>

          {/* 文件选择区域 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. 选择简历文件</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                id="file-input"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
              />
              
              {selectedFile ? (
                <div className="flex items-center justify-center space-x-3">
                  <FiFileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <div className="text-lg font-medium">{selectedFile.name}</div>
                    <div className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      addTestResult('🗑️ 清除已选文件');
                    }}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="file-input"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FiUpload className="w-12 h-12 text-gray-400 mb-4" />
                  <span className="text-lg mb-2">点击选择简历文件</span>
                  <span className="text-sm text-gray-500">
                    支持 PDF、DOC、DOCX 格式，最大 10MB
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* 测试按钮区域 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. 功能测试</h2>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={testResumeUpload}
                disabled={!selectedFile || uploading}
                className="flex items-center space-x-2"
              >
                <FiUpload className="w-4 h-4" />
                <span>{uploading ? '上传中...' : '测试上传'}</span>
              </Button>

              <Button
                onClick={testFilePreview}
                disabled={!uploadResult}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <FiFileText className="w-4 h-4" />
                <span>测试预览</span>
              </Button>

              <Button
                onClick={testFileDownload}
                disabled={!uploadResult}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <FiDownload className="w-4 h-4" />
                <span>测试下载</span>
              </Button>

              <Button
                onClick={clearResults}
                variant="outline"
                className="text-red-600 hover:text-red-700"
              >
                清除结果
              </Button>
            </div>
          </div>

          {/* 上传结果显示 */}
          {uploadResult && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. 上传结果</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>简历ID:</strong> {uploadResult.id}
                  </div>
                  <div>
                    <strong>简历编号:</strong> {uploadResult.resume_number}
                  </div>
                  <div>
                    <strong>文件名:</strong> {uploadResult.filename}
                  </div>
                  <div>
                    <strong>文件大小:</strong> {(uploadResult.size / 1024).toFixed(2)} KB
                  </div>
                  <div className="col-span-2">
                    <strong>访问路径:</strong> {uploadResult.url}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 测试日志 */}
          <div>
            <h2 className="text-xl font-semibold mb-4">4. 测试日志</h2>
            <div className="bg-gray-50 border rounded-lg p-4 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无测试日志</p>
              ) : (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeUploadTest;
