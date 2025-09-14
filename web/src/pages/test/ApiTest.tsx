import React, { useState, useEffect } from 'react';
import { debugLogger } from '@/api/client';
import { authAPI } from '@/api/auth';
import { userAPI } from '@/api/user';
import { resumeAPI } from '@/api/resume';
import { workflowAPI } from '@/api/workflow';
import { adminAPI } from '@/api/admin';
import { conversationAPI } from '@/api/conversation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'success' | 'error';
  result?: any;
  error?: string;
  duration?: number;
}

const ApiTest: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [testPhone, setTestPhone] = useState('13800138000');
  const [testSmsCode, setTestSmsCode] = useState('1234');
  const [testFile, setTestFile] = useState<File | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('console_token');
    setIsLoggedIn(!!token);
    
    // 定期更新日志
    const interval = setInterval(() => {
      setLogs([...debugLogger.getLogs()]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev.slice(0, 19)]); // 保留最新20条
  };

  const runTest = async (name: string, testFn: () => Promise<any>) => {
    const testId = Math.random().toString(36).substring(7);
    const startTime = Date.now();
    
    addTestResult({
      id: testId,
      name,
      status: 'pending'
    });

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      addTestResult({
        id: testId,
        name,
        status: 'success',
        result: result.data || result,
        duration
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      addTestResult({
        id: testId,
        name,
        status: 'error',
        error: error.message,
        duration
      });
    }
  };

  // 认证相关测试
  const testSendSMS = () => runTest('发送短信验证码', () => authAPI.sendSMS(testPhone));
  const testVerifySMS = () => runTest('验证短信验证码', () => authAPI.verifySMS(testPhone, testSmsCode));
  const testAuth = () => runTest('统一认证', async () => {
    const result = await authAPI.auth({
      phone: testPhone,
      sms_code: testSmsCode,
      name: '测试用户'
    });
    if (result.data.token) {
      localStorage.setItem('console_token', result.data.token);
      setIsLoggedIn(true);
    }
    return result;
  });

  // 用户相关测试
  const testGetProfile = () => runTest('获取用户资料', () => userAPI.getProfile());
  const testUpdateProfile = () => runTest('更新用户资料', () => 
    userAPI.updateProfile({ real_name: '更新的用户名' + Date.now() })
  );
  const testUploadAvatar = () => {
    if (!testFile) {
      alert('请选择一个图片文件');
      return;
    }
    runTest('上传头像', () => userAPI.uploadAvatar(testFile));
  };

  // 简历相关测试
  const testGetResumes = () => runTest('获取简历列表', () => resumeAPI.getResumes({ page: 1, pageSize: 10 }));
  const testUploadResume = () => {
    if (!testFile) {
      alert('请选择一个简历文件');
      return;
    }
    runTest('上传简历', () => resumeAPI.uploadResume({ file: testFile, name: '测试简历' }));
  };

  // 工作流相关测试
  const testGetWorkflows = () => runTest('获取工作流列表', async () => {
    const result = await workflowAPI.getWorkflows();
    if (result.data && result.data.length > 0) {
      setSelectedWorkflowId(result.data[0].id);
    }
    return result;
  });
  const testExecuteWorkflow = () => {
    if (!selectedWorkflowId) {
      alert('请先获取工作流列表');
      return;
    }
    runTest('执行工作流', () => 
      workflowAPI.executeWorkflow(selectedWorkflowId, { test: 'data' })
    );
  };

  // 对话相关测试
  const testGetConversations = () => runTest('获取对话列表', () => conversationAPI.getConversations());
  const testCreateConversation = () => runTest('创建对话', () => 
    conversationAPI.createConversation({ title: '测试对话 ' + Date.now() })
  );

  // 管理员相关测试（需要管理员权限）
  const testGetUsers = () => runTest('获取用户列表', () => adminAPI.getUsers({ page: 1, pageSize: 10 }));
  const testGetFileStats = () => runTest('获取文件统计', () => adminAPI.getFileStats());
  const testGetSystemStats = () => runTest('获取系统统计', () => adminAPI.getSystemStats());

  const clearLogs = () => {
    debugLogger.clearLogs();
    setLogs([]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const logout = () => {
    localStorage.removeItem('console_token');
    setIsLoggedIn(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API 测试页面</h1>
        <p className="text-gray-600">测试前后端API对接功能，调试友好的界面</p>
        <div className="mt-4 flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm ${
            isLoggedIn ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isLoggedIn ? '✅ 已登录' : '❌ 未登录'}
          </span>
          {isLoggedIn && (
            <Button onClick={logout} variant="outline" size="sm">
              登出
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 测试控制面板 */}
        <div className="space-y-6">
          {/* 测试参数设置 */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold mb-4">测试参数</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  测试手机号
                </label>
                <Input
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="13800138000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  短信验证码
                </label>
                <Input
                  value={testSmsCode}
                  onChange={(e) => setTestSmsCode(e.target.value)}
                  placeholder="1234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  测试文件
                </label>
                <input
                  type="file"
                  onChange={(e) => setTestFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
          </div>

          {/* 认证测试 */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold mb-4">认证接口测试</h2>
            <div className="grid grid-cols-1 gap-2">
              <Button onClick={testSendSMS} variant="outline" size="sm">
                发送短信验证码
              </Button>
              <Button onClick={testVerifySMS} variant="outline" size="sm">
                验证短信验证码
              </Button>
              <Button onClick={testAuth} size="sm">
                统一认证登录
              </Button>
            </div>
          </div>

          {/* 用户接口测试 */}
          {isLoggedIn && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-lg font-semibold mb-4">用户接口测试</h2>
              <div className="grid grid-cols-1 gap-2">
                <Button onClick={testGetProfile} variant="outline" size="sm">
                  获取用户资料
                </Button>
                <Button onClick={testUpdateProfile} variant="outline" size="sm">
                  更新用户资料
                </Button>
                <Button onClick={testUploadAvatar} variant="outline" size="sm">
                  上传头像
                </Button>
              </div>
            </div>
          )}

          {/* 简历接口测试 */}
          {isLoggedIn && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-lg font-semibold mb-4">简历接口测试</h2>
              <div className="grid grid-cols-1 gap-2">
                <Button onClick={testGetResumes} variant="outline" size="sm">
                  获取简历列表
                </Button>
                <Button onClick={testUploadResume} variant="outline" size="sm">
                  上传简历
                </Button>
              </div>
            </div>
          )}

          {/* 工作流接口测试 */}
          {isLoggedIn && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-lg font-semibold mb-4">工作流接口测试</h2>
              <div className="grid grid-cols-1 gap-2">
                <Button onClick={testGetWorkflows} variant="outline" size="sm">
                  获取工作流列表
                </Button>
                <Button onClick={testExecuteWorkflow} variant="outline" size="sm">
                  执行工作流
                </Button>
              </div>
            </div>
          )}

          {/* 对话接口测试 */}
          {isLoggedIn && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-lg font-semibold mb-4">对话接口测试</h2>
              <div className="grid grid-cols-1 gap-2">
                <Button onClick={testGetConversations} variant="outline" size="sm">
                  获取对话列表
                </Button>
                <Button onClick={testCreateConversation} variant="outline" size="sm">
                  创建对话
                </Button>
              </div>
            </div>
          )}

          {/* 管理员接口测试 */}
          {isLoggedIn && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-lg font-semibold mb-4">管理员接口测试</h2>
              <div className="grid grid-cols-1 gap-2">
                <Button onClick={testGetUsers} variant="outline" size="sm">
                  获取用户列表
                </Button>
                <Button onClick={testGetFileStats} variant="outline" size="sm">
                  获取文件统计
                </Button>
                <Button onClick={testGetSystemStats} variant="outline" size="sm">
                  获取系统统计
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 结果显示面板 */}
        <div className="space-y-6">
          {/* 测试结果 */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">测试结果</h2>
              <Button onClick={clearResults} variant="outline" size="sm">
                清空结果
              </Button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result) => (
                <div
                  key={result.id}
                  className={`p-3 rounded border-l-4 ${
                    result.status === 'success'
                      ? 'border-green-400 bg-green-50'
                      : result.status === 'error'
                      ? 'border-red-400 bg-red-50'
                      : 'border-yellow-400 bg-yellow-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{result.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {result.status === 'pending' ? '执行中...' : 
                         result.duration ? `${result.duration}ms` : ''}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      result.status === 'success'
                        ? 'bg-green-100 text-green-800'
                        : result.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {result.status === 'success' ? '成功' : 
                       result.status === 'error' ? '失败' : '执行中'}
                    </div>
                  </div>
                  {result.error && (
                    <div className="mt-2 text-sm text-red-600">
                      错误: {result.error}
                    </div>
                  )}
                  {result.result && (
                    <details className="mt-2">
                      <summary className="text-sm text-gray-600 cursor-pointer">
                        查看结果
                      </summary>
                      <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
              {testResults.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  暂无测试结果
                </div>
              )}
            </div>
          </div>

          {/* 请求日志 */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">请求日志</h2>
              <Button onClick={clearLogs} variant="outline" size="sm">
                清空日志
              </Button>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded text-xs font-mono ${
                    log.type === 'request'
                      ? 'bg-blue-50 text-blue-800'
                      : log.type === 'response'
                      ? 'bg-green-50 text-green-800'
                      : 'bg-red-50 text-red-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div>
                        {log.type === 'request' ? '🚀' : log.type === 'response' ? '✅' : '❌'}{' '}
                        {log.method?.toUpperCase()} {log.url}
                        {log.status && ` (${log.status})`}
                      </div>
                      {log.duration && (
                        <div className="text-gray-500 mt-1">{log.duration}ms</div>
                      )}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  {log.error && (
                    <div className="mt-1 text-red-600">{log.error}</div>
                  )}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  暂无请求日志
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTest;
