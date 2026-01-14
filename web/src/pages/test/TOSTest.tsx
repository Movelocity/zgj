import React, { useState } from 'react';
import { FiUpload, FiFileText, FiX, FiDownload, FiList, FiKey } from 'react-icons/fi';
import { Button } from '@/components/ui';
import { tosAPI } from '@/api/tos';
import type { STSCredentials, TOSUpload, UploadListResponse } from '@/api/tos';
import { showSuccess, showError, showWarning } from '@/utils/toast';

const TOSTest: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<TOSUpload | null>(null);
  const [stsCredentials, setSTSCredentials] = useState<STSCredentials | null>(null);
  const [uploadList, setUploadList] = useState<UploadListResponse | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  // 添加测试结果
  const addTestResult = (result: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // 文件选择处理
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // 检查文件大小 (100MB)
    if (file.size > 100 * 1024 * 1024) {
      showWarning('文件大小不能超过 100MB');
      addTestResult(`❌ 文件大小检查失败: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    setSelectedFile(file);
    addTestResult(`✅ 文件选择成功: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);
  };

  // 测试获取STS凭证
  const testGetSTSCredentials = async () => {
    try {
      addTestResult('🔑 开始测试获取STS凭证...');
      const response = await tosAPI.getSTSCredentials();

      if (response.code === 0 && response.data) {
        setSTSCredentials(response.data);
        showSuccess('获取STS凭证成功');
        addTestResult(`✅ 获取STS凭证成功`);
        addTestResult(`  - Region: ${response.data.region}`);
        addTestResult(`  - Bucket: ${response.data.bucket}`);
        addTestResult(`  - Endpoint: ${response.data.endpoint}`);
        addTestResult(`  - 过期时间: ${new Date(response.data.expiration).toLocaleString()}`);
      } else {
        throw new Error(response.msg || '获取失败');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '获取STS凭证失败';
      showError(errorMsg);
      addTestResult(`❌ 获取STS凭证失败: ${errorMsg}`);
    }
  };

  // 测试上传文件
  const testUploadFile = async () => {
    if (!selectedFile) {
      showWarning('请先选择文件');
      return;
    }

    try {
      setUploading(true);
      addTestResult('🚀 开始测试文件上传...');

      const result = await tosAPI.uploadToTOS(selectedFile);
      setUploadResult(result);
      showSuccess('文件上传成功');
      addTestResult(`✅ 文件上传成功: ID=${result.id}`);
      addTestResult(`  - 文件名: ${result.filename}`);
      addTestResult(`  - 文件Key: ${result.key}`);
      addTestResult(`  - 文件大小: ${(result.size / 1024).toFixed(2)}KB`);
      addTestResult(`  - Content-Type: ${result.content_type}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '文件上传失败';
      showError(errorMsg);
      addTestResult(`❌ 文件上传失败: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  // 测试生成预签名URL
  // const testGeneratePresignURL = async () => {
  //   if (!selectedFile) {
  //     showWarning('请先选择文件');
  //     return;
  //   }

  //   try {
  //     addTestResult('🔗 开始测试生成预签名URL...');
  //     const timestamp = Date.now();
  //     const randomStr = Math.random().toString(36).substring(7);
  //     const extension = selectedFile.name.split('.').pop();
  //     const key = `test_${timestamp}_${randomStr}.${extension}`;

  //     const response = await tosAPI.generatePresignURL({
  //       key,
  //       content_type: selectedFile.type,
  //     });

  //     if (response.code === 0 && response.data) {
  //       showSuccess('生成预签名URL成功');
  //       addTestResult(`✅ 生成预签名URL成功`);
  //       addTestResult(`  - Key: ${response.data.key}`);
  //       addTestResult(`  - URL长度: ${response.data.url.length}字符`);
  //       addTestResult(`  - 过期时间: ${response.data.expires_in}秒`);
  //     } else {
  //       throw new Error(response.msg || '生成失败');
  //     }
  //   } catch (error) {
  //     const errorMsg = error instanceof Error ? error.message : '生成预签名URL失败';
  //     showError(errorMsg);
  //     addTestResult(`❌ 生成预签名URL失败: ${errorMsg}`);
  //   }
  // };

  // 测试生成下载URL
  const testGenerateDownloadURL = async () => {
    if (!uploadResult) {
      showWarning('请先上传文件');
      return;
    }

    try {
      addTestResult('🔽 开始测试生成下载URL...');
      const response = await tosAPI.generateDownloadURL(uploadResult.key);

      if (response.code === 0 && response.data) {
        showSuccess('生成下载URL成功，写入剪贴板');
        addTestResult(`✅ 生成下载URL成功，即将`);
        addTestResult(`  - URL长度: ${response.data.url.length}字符`);
        addTestResult(`  - 过期时间: ${response.data.expires_in}秒`);
        
        // 在新窗口打开下载URL
        // window.open(response.data.url, '_blank');
        // 写入剪贴板
        navigator.clipboard.writeText(response.data.url);
        addTestResult(`  - 已写入剪贴板`);
      } else {
        throw new Error(response.msg || '生成失败');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '生成下载URL失败';
      showError(errorMsg);
      addTestResult(`❌ 生成下载URL失败: ${errorMsg}`);
    }
  };

  // 测试获取上传记录列表
  const testListUploads = async () => {
    try {
      addTestResult('📋 开始测试获取上传记录列表...');
      const response = await tosAPI.listUploads({ page: 1, page_size: 10 });

      if (response.code === 0 && response.data) {
        setUploadList(response.data);
        showSuccess('获取上传记录列表成功');
        addTestResult(`✅ 获取上传记录列表成功`);
        addTestResult(`  - 总记录数: ${response.data.total}`);
        addTestResult(`  - 当前页: ${response.data.page}`);
        addTestResult(`  - 每页数量: ${response.data.per_page}`);
        addTestResult(`  - 本页记录: ${response.data.items.length}条`);
      } else {
        throw new Error(response.msg || '获取失败');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '获取上传记录列表失败';
      showError(errorMsg);
      addTestResult(`❌ 获取上传记录列表失败: ${errorMsg}`);
    }
  };

  // 清除测试结果
  // const clearResults = () => {
  //   setTestResults([]);
  //   setUploadResult(null);
  //   setSelectedFile(null);
  //   setSTSCredentials(null);
  //   setUploadList(null);
  //   const fileInput = document.getElementById('tos-file-input') as HTMLInputElement;
  //   if (fileInput) {
  //     fileInput.value = '';
  //   }
  // };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              TOS 对象存储服务测试
            </h1>
            <p className="text-gray-600">
              测试火山引擎 TOS 对象存储服务的各项功能，包括 STS 凭证、文件上传、下载等
            </p>
          </div>

          {/* 文件选择区域 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiFileText className="mr-2" />
              1. 选择测试文件
            </h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                id="tos-file-input"
                className="hidden"
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
                <label htmlFor="tos-file-input" className="cursor-pointer flex flex-col items-center">
                  <FiUpload className="w-12 h-12 text-gray-400 mb-4" />
                  <span className="text-lg mb-2">点击选择测试文件</span>
                  <span className="text-sm text-gray-500">支持任意格式，最大 100MB</span>
                </label>
              )}
            </div>
          </div>

          {/* 测试按钮区域 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. API 功能测试</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Button
                onClick={testUploadFile}
                disabled={!selectedFile || uploading}
                className="flex items-center justify-center space-x-2"
              >
                <FiUpload className="w-4 h-4" />
                <span>{uploading ? '上传中...' : '上传文件'}</span>
              </Button>
              {/* <Button
                onClick={testGeneratePresignURL}
                disabled={!selectedFile}
                className="flex items-center justify-center space-x-2"
                variant="outline"
              >
                <FiUpload className="w-4 h-4" />
                <span>生成预签名URL</span>
              </Button> */}
              <Button
                onClick={testGenerateDownloadURL}
                disabled={!uploadResult}
                className="flex items-center justify-center space-x-2"
                variant="outline"
              >
                <FiDownload className="w-4 h-4" />
                <span>生成下载URL</span>
              </Button>
              <Button
                onClick={testGetSTSCredentials}
                className="flex items-center justify-center space-x-2"
                variant="outline"
              >
                <FiKey className="w-4 h-4" />
                <span>获取STS凭证</span>
              </Button>
              {/* <Button
                onClick={clearResults}
                variant="outline"
                className="text-red-600 hover:text-red-700"
              >
                重置状态
              </Button> */}
            </div>
          </div>

          {/* STS凭证显示 */}
          {stsCredentials && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. STS 临时凭证</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong>Region:</strong> {stsCredentials.region}
                  </div>
                  <div>
                    <strong>Bucket:</strong> {stsCredentials.bucket}
                  </div>
                  <div className="md:col-span-2">
                    <strong>Endpoint:</strong> {stsCredentials.endpoint}
                  </div>
                  <div className="md:col-span-2">
                    <strong>AccessKeyID:</strong>{' '}
                    <span className="font-mono text-xs">
                      {stsCredentials.access_key_id.substring(0, 20)}...
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <strong>过期时间:</strong>{' '}
                    {new Date(stsCredentials.expiration).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 上传结果显示 */}
          {uploadResult && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. 上传结果</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong>上传ID:</strong> {uploadResult.id}
                  </div>
                  <div>
                    <strong>用户ID:</strong> {uploadResult.user_id}
                  </div>
                  <div className="md:col-span-2">
                    <strong>文件名:</strong> {uploadResult.filename}
                  </div>
                  <div className="md:col-span-2">
                    <strong>文件Key:</strong>{' '}
                    <span className="font-mono text-xs">{uploadResult.key}</span>
                  </div>
                  <div>
                    <strong>Content-Type:</strong> {uploadResult.content_type}
                  </div>
                  <div>
                    <strong>文件大小:</strong> {(uploadResult.size / 1024).toFixed(2)} KB
                  </div>
                  <div>
                    <strong>状态:</strong>{' '}
                    <span className="text-green-600 font-semibold">{uploadResult.status}</span>
                  </div>
                  <div>
                    <strong>上传时间:</strong>{' '}
                    {new Date(uploadResult.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 上传记录列表 */}
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">
              5. 上传记录列表 (总数: {uploadList?.total || 0})
            </h2>
            <Button
              onClick={testListUploads}
              className="flex items-center justify-center space-x-2 mb-2"
              variant="outline"
            >
              <FiList className="w-4 h-4" />
              <span>查看上传列表</span>
            </Button>
            {uploadList && uploadList.items.length > 0 && (
            <div className="bg-gray-50 border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        文件名
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        大小
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        状态
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        上传时间
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {uploadList.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm">{item.id}</td>
                        <td className="px-4 py-3 text-sm">{item.filename}</td>
                        <td className="px-4 py-3 text-sm">
                          {(item.size / 1024).toFixed(2)} KB
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              item.status === 'success'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(item.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </div>
        

          {/* 测试日志 */}
          <div>
            <h2 className="text-xl font-semibold mb-4">6. 测试日志</h2>
            <div className="bg-gray-900 text-green-400 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
              {testResults.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无测试日志</p>
              ) : (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index}>{result}</div>
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

export default TOSTest;

