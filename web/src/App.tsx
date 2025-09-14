import { useEffect } from 'react';
import AppRouter from '@/router';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { ToastContainer } from '@/components/ui';
import { useAuthStore } from '@/store';
import { initToast } from '@/utils/toast';

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // 初始化Toast工具函数
    initToast();
    // 应用启动时检查认证状态
    checkAuth();
  }, [checkAuth]);

  return (
    <ErrorBoundary>
      <AppRouter />
      <ToastContainer />
    </ErrorBoundary>
  );
}

export default App;
