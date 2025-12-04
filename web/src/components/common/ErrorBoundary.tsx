import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import {Button} from '@/components/ui';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorType: 'chunk' | 'network' | 'general';
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorType: 'general',
  };

  public static getDerivedStateFromError(error: Error): State {
    // 检测错误类型
    const errorMessage = error.message.toLowerCase();
    let errorType: 'chunk' | 'network' | 'general' = 'general';
    
    if (errorMessage.includes('failed to fetch') || 
        errorMessage.includes('dynamically imported module') ||
        errorMessage.includes('loading chunk') ||
        errorMessage.includes('loading css chunk')) {
      errorType = 'chunk';
    } else if (errorMessage.includes('network') || 
               errorMessage.includes('timeout') ||
               !navigator.onLine) {
      errorType = 'network';
    }
    
    return { hasError: true, error, errorType };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 记录到控制台以便调试
    console.group('🔴 Error Details');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Online Status:', navigator.onLine);
    console.groupEnd();
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const { error, errorType } = this.state;
      const isChunkError = errorType === 'chunk';
      const isNetworkError = errorType === 'network' || !navigator.onLine;
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <svg
                  className={`relative mx-auto h-20 w-20 ${isChunkError || isNetworkError ? 'text-blue-500' : 'text-red-500'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isChunkError || isNetworkError ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  )}
                </svg>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              {isChunkError ? '页面走丢了' : isNetworkError ? 'Oops! 网络似乎断开了' : '出了点小问题'}
            </h1>
            
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              {isChunkError 
                ? '📄 页面资源加载失败，刷新试试看吧' 
                : isNetworkError 
                ? '📡 网络信号中断，请检查您的网络连接'
                : '很抱歉，遇到了一些意外情况'
              }
            </p>
            
            {/* 网络状态提示 */}
            {!navigator.onLine && (
              <div className="mb-6 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-center justify-center text-orange-700">
                  <svg
                    className="h-5 w-5 mr-2 animate-bounce"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                    />
                  </svg>
                  <span className="text-sm font-medium">📵 离线模式</span>
                </div>
              </div>
            )}
            
            {error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-blue-600 mb-2 transition-colors">
                  🔍 查看技术细节
                </summary>
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-red-600 break-words font-mono">
                    {error.message}
                  </p>
                  {error.stack && import.meta.env.DEV && (
                    <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-32 font-mono">
                      {error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={this.handleReload} 
                variant="default"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0 shadow-md hover:shadow-lg transition-all"
              >
                🔄 刷新试试
              </Button>
              <Button 
                onClick={this.handleGoHome} 
                variant="outline"
                className="w-full sm:w-auto border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all"
              >
                🏠 回到首页
              </Button>
            </div>
            
            {/* 帮助提示 */}
            {(isChunkError || isNetworkError) && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-3">
                  💡 小贴士
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-600 border border-blue-100">
                    检查网络连接
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-50 text-purple-600 border border-purple-100">
                    清除浏览器缓存
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-50 text-green-600 border border-green-100">
                    换个浏览器试试
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
