import { lazy } from 'react';
import type { ComponentType } from 'react';

interface RetryOptions {
  retries?: number;
  delay?: number;
}

/**
 * 带重试机制的懒加载
 * 当动态导入失败时（如网络问题），会自动重试
 * 
 * @param importFunc - 动态导入函数
 * @param options - 重试选项
 * @returns React 懒加载组件
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: RetryOptions = {}
) {
  const { retries = 3, delay = 1000 } = options;

  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptImport = async (attemptNumber: number) => {
        try {
          const module = await importFunc();
          resolve(module);
        } catch (error) {
          console.error(`Lazy load attempt ${attemptNumber} failed:`, error);
          
          // 检查是否是网络错误
          const isNetworkError = 
            error instanceof Error && 
            (error.message.includes('Failed to fetch') || 
             error.message.includes('dynamically imported module') ||
             error.message.includes('Loading chunk'));

          // 如果还有重试次数且是网络错误，则重试
          if (attemptNumber < retries && isNetworkError) {
            console.log(`Retrying in ${delay}ms... (${attemptNumber + 1}/${retries})`);
            setTimeout(() => {
              attemptImport(attemptNumber + 1);
            }, delay * attemptNumber); // 递增延迟
          } else {
            // 超过重试次数或非网络错误，拒绝Promise
            reject(error);
          }
        }
      };

      attemptImport(1);
    });
  });
}

/**
 * 预加载组件
 * 可以在需要之前预先加载组件，减少首次访问延迟
 * 
 * @param importFunc - 动态导入函数
 */
export function preloadComponent(importFunc: () => Promise<any>) {
  importFunc().catch(error => {
    console.error('Preload failed:', error);
  });
}

/**
 * 检查是否在线
 * 返回当前网络状态
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * 监听在线状态变化
 * 
 * @param callback - 状态变化时的回调函数
 * @returns 清理函数
 */
export function onlineStatusListener(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // 返回清理函数
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
