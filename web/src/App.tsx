import { useEffect } from 'react';
import AppRouter from '@/router';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useAuthStore } from '@/store';

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // 应用启动时检查认证状态
    checkAuth();
  }, [checkAuth]);

  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
}

export default App;
