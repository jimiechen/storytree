'use client';

import { useEffect, useState } from 'react';

/**
 * 检查是否启用 Mock API
 * 根据环境变量 NEXT_PUBLIC_USE_MOCK_API 决定
 */
function isMockApiEnabled(): boolean {
  // 在生产环境禁用 Mock
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  
  // 开发环境根据环境变量决定
  return process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
}

export default function MockServiceWorker({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!isMockApiEnabled());
  const [enabled, setEnabled] = useState(isMockApiEnabled());

  useEffect(() => {
    // 如果 Mock API 未启用，直接返回
    if (!isMockApiEnabled()) {
      if (typeof window !== 'undefined') {
        (window as any).__MSW_READY__ = false;
        (window as any).__MSW_ENABLED__ = false;
      }
      setReady(true);
      setEnabled(false);
      return;
    }

    // 仅在开发环境且启用了 Mock API 时启动 MSW
    if (process.env.NODE_ENV === 'development' && isMockApiEnabled()) {
      import('@/mocks/browser').then(({ worker }) => {
        worker.start({ 
          onUnhandledRequest: 'bypass',
          serviceWorker: {
            url: '/mockServiceWorker.js',
          },
        }).then(() => {
          if (typeof window !== 'undefined') {
            (window as any).__MSW_READY__ = true;
            (window as any).__MSW_ENABLED__ = true;
            console.log('[MSW] Mock Service Worker 已启动');
          }
          setReady(true);
          setEnabled(true);
        }).catch((error) => {
          console.error('[MSW] 启动失败:', error);
          setReady(true);
          setEnabled(false);
        });
      });
    }
  }, []);

  // 提供切换 Mock API 的方法（仅开发环境）
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).toggleMockApi = () => {
        const currentEnabled = (window as any).__MSW_ENABLED__;
        if (currentEnabled) {
          // 禁用 MSW
          import('@/mocks/browser').then(({ worker }) => {
            worker.stop();
            (window as any).__MSW_ENABLED__ = false;
            console.log('[MSW] Mock Service Worker 已禁用');
          });
        } else {
          // 启用 MSW
          import('@/mocks/browser').then(({ worker }) => {
            worker.start({ onUnhandledRequest: 'bypass' });
            (window as any).__MSW_ENABLED__ = true;
            console.log('[MSW] Mock Service Worker 已启用');
          });
        }
      };

      // 暴露检查方法
      (window as any).isMockApiEnabled = () => (window as any).__MSW_ENABLED__;
    }
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">正在初始化 Mock Service Worker...</p>
        </div>
      </div>
    );
  }

  // 如果启用了 Mock API，显示提示
  if (enabled && process.env.NODE_ENV === 'development') {
    return (
      <>
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded shadow-lg text-sm">
            <span className="font-semibold">🧪 Mock API 模式</span>
            <span className="ml-2 text-xs opacity-75">(开发环境)</span>
          </div>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
}
