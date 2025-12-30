import React, { useState } from 'react';
import {
  FiUpload,
  FiMic,
  FiRefreshCw,
  FiTrash2,
  FiList,
  FiCheck,
  FiX,
  FiClock,
} from 'react-icons/fi';
import { Button } from '@/components/ui';
import { asrAPI, tosAPI } from '@/api';
import type { ASRTask, ASRResult } from '@/api/asr';
import { showSuccess, showError, showWarning, showInfo } from '@/utils/toast';

const ASRTest: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [currentTask, setCurrentTask] = useState<ASRTask | null>(null);
  const [taskResult, setTaskResult] = useState<ASRResult | null>(null);
  const [taskList, setTaskList] = useState<ASRTask[]>([]);
  const [polling, setPolling] = useState(false);
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

    // 检查文件类型
    const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['mp3', 'wav', 'ogg'];

    if (!allowedTypes.includes(file.type) && !validExtensions.includes(extension || '')) {
      showWarning('请上传 MP3、WAV 或 OGG 格式的音频文件');
      addTestResult(`❌ 文件类型检查失败: ${file.type || extension}`);
      return;
    }

    // 检查文件大小 (100MB)
    if (file.size > 100 * 1024 * 1024) {
      showWarning('文件大小不能超过 100MB');
      addTestResult(`❌ 文件大小检查失败: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    setSelectedFile(file);
    addTestResult(
      `✅ 音频文件选择成功: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`
    );
  };

  // 上传音频文件到TOS
  const uploadAudioFile = async () => {
    if (!selectedFile) {
      showWarning('请先选择音频文件');
      return;
    }

    try {
      setUploading(true);
      addTestResult('📤 开始上传音频文件到TOS...');

      const upload = await tosAPI.uploadToTOS(selectedFile);
      
      // 生成下载URL
      const downloadResponse = await tosAPI.generateDownloadURL(upload.key);
      if (downloadResponse.code === 0 && downloadResponse.data) {
        const url = downloadResponse.data.url;
        setAudioUrl(url);
        showSuccess('音频文件上传成功');
        addTestResult(`✅ 音频文件上传成功`);
        addTestResult(`  - 文件Key: ${upload.key}`);
        addTestResult(`  - 下载URL已生成`);
      } else {
        throw new Error('生成下载URL失败');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '音频文件上传失败';
      showError(errorMsg);
      addTestResult(`❌ 音频文件上传失败: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  // 提交识别任务
  const submitTask = async () => {
    if (!audioUrl) {
      showWarning('请先上传音频文件');
      return;
    }

    try {
      addTestResult('🚀 开始提交ASR识别任务...');
      
      const audioFormat = selectedFile?.name.split('.').pop()?.toLowerCase() as
        | 'mp3'
        | 'wav'
        | 'ogg'
        | 'raw';

      const response = await asrAPI.submitTask({
        audio_url: audioUrl,
        audio_format: audioFormat || 'mp3',
        options: {
          enable_itn: true,
          enable_ddc: true,
          enable_speaker_diarization: false,
        },
      });

      if (response.code === 0 && response.data) {
        setCurrentTask(response.data);
        showSuccess('识别任务提交成功');
        addTestResult(`✅ 识别任务提交成功`);
        addTestResult(`  - 任务ID: ${response.data.id}`);
        addTestResult(`  - 状态: ${response.data.status}`);
        addTestResult(`  - 进度: ${response.data.progress}%`);
      } else {
        throw new Error(response.msg || '提交失败');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '提交识别任务失败';
      showError(errorMsg);
      addTestResult(`❌ 提交识别任务失败: ${errorMsg}`);
    }
  };

  // 轮询任务结果
  const pollTaskResult = async () => {
    if (!currentTask) {
      showWarning('请先提交识别任务');
      return;
    }

    try {
      setPolling(true);
      addTestResult('🔄 开始轮询任务结果...');

      const task = await asrAPI.pollUntilComplete(
        currentTask.id,
        (task) => {
          setCurrentTask(task);
          addTestResult(`  ⏳ 识别进度: ${task.progress}% (${task.status})`);
        },
        60, // 最多60次
        3000 // 每3秒轮询一次
      );

      setCurrentTask(task);

      if (task.status === 'completed') {
        const result = asrAPI.parseResult(task);
        setTaskResult(result);
        showSuccess('识别完成');
        addTestResult(`✅ 识别任务完成`);
        if (result) {
          addTestResult(`  - 识别文本长度: ${result.text.length}字符`);
          if (result.segments) {
            addTestResult(`  - 片段数量: ${result.segments.length}`);
          }
        }
      } else if (task.status === 'failed') {
        showError('识别失败');
        addTestResult(`❌ 识别任务失败: ${task.error_message}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '轮询任务失败';
      showError(errorMsg);
      addTestResult(`❌ 轮询任务失败: ${errorMsg}`);
    } finally {
      setPolling(false);
    }
  };

  // 查询任务详情
  const getTaskDetails = async () => {
    if (!currentTask) {
      showWarning('请先提交识别任务');
      return;
    }

    try {
      addTestResult('🔍 查询任务详情...');
      const response = await asrAPI.getTask(currentTask.id);

      if (response.code === 0 && response.data) {
        setCurrentTask(response.data);
        showInfo('任务详情已更新');
        addTestResult(`✅ 任务详情查询成功`);
        addTestResult(`  - 状态: ${response.data.status}`);
        addTestResult(`  - 进度: ${response.data.progress}%`);
      } else {
        throw new Error(response.msg || '查询失败');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '查询任务详情失败';
      showError(errorMsg);
      addTestResult(`❌ 查询任务详情失败: ${errorMsg}`);
    }
  };

  // 获取任务列表
  const getTaskList = async () => {
    try {
      addTestResult('📋 获取任务列表...');
      const response = await asrAPI.listTasks({ page: 1, page_size: 10 });

      if (response.code === 0 && response.data) {
        setTaskList(response.data.items);
        showSuccess('获取任务列表成功');
        addTestResult(`✅ 获取任务列表成功`);
        addTestResult(`  - 总记录数: ${response.data.total}`);
        addTestResult(`  - 本页记录: ${response.data.items.length}条`);
      } else {
        throw new Error(response.msg || '获取失败');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '获取任务列表失败';
      showError(errorMsg);
      addTestResult(`❌ 获取任务列表失败: ${errorMsg}`);
    }
  };

  // 删除任务
  const deleteTask = async (taskId: string) => {
    try {
      addTestResult(`🗑️ 删除任务 ${taskId}...`);
      const response = await asrAPI.deleteTask(taskId);

      if (response.code === 0) {
        showSuccess('任务删除成功');
        addTestResult(`✅ 任务删除成功`);
        // 刷新任务列表
        getTaskList();
      } else {
        throw new Error(response.msg || '删除失败');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '删除任务失败';
      showError(errorMsg);
      addTestResult(`❌ 删除任务失败: ${errorMsg}`);
    }
  };

  // 重试任务
  const retryTask = async (taskId: string) => {
    try {
      addTestResult(`🔄 重试任务 ${taskId}...`);
      const response = await asrAPI.retryTask(taskId);

      if (response.code === 0 && response.data) {
        setCurrentTask(response.data);
        showSuccess('任务重试成功');
        addTestResult(`✅ 任务重试成功`);
        addTestResult(`  - 状态: ${response.data.status}`);
      } else {
        throw new Error(response.msg || '重试失败');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '重试任务失败';
      showError(errorMsg);
      addTestResult(`❌ 重试任务失败: ${errorMsg}`);
    }
  };

  // 清除所有结果
  const clearAllResults = () => {
    setTestResults([]);
    setCurrentTask(null);
    setTaskResult(null);
    setSelectedFile(null);
    setAudioUrl('');
    setTaskList([]);
    const fileInput = document.getElementById('asr-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FiCheck className="text-green-600" />;
      case 'failed':
        return <FiX className="text-red-600" />;
      case 'processing':
        return <FiRefreshCw className="text-blue-600 animate-spin" />;
      default:
        return <FiClock className="text-gray-600" />;
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '等待中',
      processing: '识别中',
      completed: '已完成',
      failed: '失败',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ASR 语音识别服务测试</h1>
            <p className="text-gray-600">
              测试火山引擎 ASR 语音识别服务，支持音频文件上传、识别任务管理和结果查询
            </p>
          </div>

          {/* 文件上传区域 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiMic className="mr-2" />
              1. 选择音频文件
            </h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                id="asr-file-input"
                className="hidden"
                accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,.mp3,.wav,.ogg"
                onChange={handleFileSelect}
              />

              {selectedFile ? (
                <div className="flex items-center justify-center space-x-3">
                  <FiMic className="w-8 h-8 text-blue-600" />
                  <div>
                    <div className="text-lg font-medium">{selectedFile.name}</div>
                    <div className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setAudioUrl('');
                      addTestResult('🗑️ 清除已选音频文件');
                    }}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label htmlFor="asr-file-input" className="cursor-pointer flex flex-col items-center">
                  <FiUpload className="w-12 h-12 text-gray-400 mb-4" />
                  <span className="text-lg mb-2">点击选择音频文件</span>
                  <span className="text-sm text-gray-500">支持 MP3、WAV、OGG 格式，最大 100MB</span>
                </label>
              )}
            </div>

            {selectedFile && !audioUrl && (
              <div className="mt-4">
                <Button
                  onClick={uploadAudioFile}
                  disabled={uploading}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <FiUpload className="w-4 h-4" />
                  <span>{uploading ? '上传中...' : '上传音频文件到TOS'}</span>
                </Button>
              </div>
            )}
          </div>

          {/* 识别操作区域 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. 识别操作</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={submitTask}
                disabled={!audioUrl || !!currentTask}
                className="flex items-center justify-center space-x-2"
              >
                <FiMic className="w-4 h-4" />
                <span>提交任务</span>
              </Button>

              <Button
                onClick={getTaskDetails}
                disabled={!currentTask}
                variant="outline"
                className="flex items-center justify-center space-x-2"
              >
                <FiRefreshCw className="w-4 h-4" />
                <span>查询详情</span>
              </Button>

              <Button
                onClick={pollTaskResult}
                disabled={!currentTask || polling}
                variant="outline"
                className="flex items-center justify-center space-x-2"
              >
                <FiRefreshCw className={`w-4 h-4 ${polling ? 'animate-spin' : ''}`} />
                <span>{polling ? '轮询中...' : '轮询结果'}</span>
              </Button>

              <Button
                onClick={getTaskList}
                variant="outline"
                className="flex items-center justify-center space-x-2"
              >
                <FiList className="w-4 h-4" />
                <span>任务列表</span>
              </Button>
            </div>
          </div>

          {/* 当前任务状态 */}
          {currentTask && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. 当前任务状态</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <strong>任务ID:</strong>{' '}
                    <span className="font-mono text-xs">{currentTask.id}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <strong>状态:</strong>
                    {getStatusIcon(currentTask.status)}
                    <span className="font-semibold">{getStatusText(currentTask.status)}</span>
                  </div>
                  <div>
                    <strong>进度:</strong> {currentTask.progress}%
                  </div>
                  <div>
                    <strong>音频格式:</strong> {currentTask.audio_format.toUpperCase()}
                  </div>
                  <div className="md:col-span-2">
                    <strong>创建时间:</strong>{' '}
                    {new Date(currentTask.created_at).toLocaleString()}
                  </div>
                  {currentTask.error_message && (
                    <div className="md:col-span-2 text-red-600">
                      <strong>错误信息:</strong> {currentTask.error_message}
                    </div>
                  )}
                </div>

                {/* 进度条 */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      currentTask.status === 'completed'
                        ? 'bg-green-600'
                        : currentTask.status === 'failed'
                        ? 'bg-red-600'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${currentTask.progress}%` }}
                  ></div>
                </div>

                {/* 操作按钮 */}
                <div className="flex space-x-2">
                  {currentTask.status === 'failed' && (
                    <Button
                      onClick={() => retryTask(currentTask.id)}
                      size="sm"
                      variant="outline"
                      className="flex items-center space-x-1"
                    >
                      <FiRefreshCw className="w-3 h-3" />
                      <span>重试</span>
                    </Button>
                  )}
                  <Button
                    onClick={() => deleteTask(currentTask.id)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 flex items-center space-x-1"
                  >
                    <FiTrash2 className="w-3 h-3" />
                    <span>删除</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 识别结果 */}
          {taskResult && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. 识别结果</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="mb-4">
                  <strong className="text-lg">识别文本:</strong>
                  <div className="mt-2 p-4 bg-white rounded border text-gray-800 leading-relaxed">
                    {taskResult.text}
                  </div>
                </div>

                {taskResult.segments && taskResult.segments.length > 0 && (
                  <div>
                    <strong className="text-lg">片段详情:</strong>
                    <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                      {taskResult.segments.map((segment, index) => (
                        <div key={index} className="p-3 bg-white rounded border text-sm">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600">
                              #{index + 1}
                              {segment.speaker && ` - ${segment.speaker}`}
                            </span>
                            <span className="text-gray-500">
                              {segment.start_time.toFixed(2)}s - {segment.end_time.toFixed(2)}s
                            </span>
                          </div>
                          <div className="text-gray-800">{segment.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 任务列表 */}
          {taskList.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. 任务列表</h2>
              <div className="bg-gray-50 border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          任务ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          音频格式
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          状态
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          进度
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          创建时间
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {taskList.map((task) => (
                        <tr key={task.id}>
                          <td className="px-4 py-3 text-xs font-mono">
                            {task.id.substring(0, 8)}...
                          </td>
                          <td className="px-4 py-3 text-sm uppercase">{task.audio_format}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(task.status)}
                              <span>{getStatusText(task.status)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{task.progress}%</td>
                          <td className="px-4 py-3 text-sm">
                            {new Date(task.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex space-x-2">
                              {task.status === 'failed' && (
                                <button
                                  onClick={() => retryTask(task.id)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="重试"
                                >
                                  <FiRefreshCw className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="text-red-600 hover:text-red-800"
                                title="删除"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

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
            {testResults.length > 0 && (
              <div className="mt-4">
                <Button onClick={clearAllResults} variant="outline" className="w-full text-red-600">
                  清除所有结果
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ASRTest;

