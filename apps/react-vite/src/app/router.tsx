import { createBrowserRouter } from 'react-router'

// react-router 7 route-level lazy: 라우트 파일이 Component / ErrorBoundary 등을 named export
// 라우트 진입 시 청크 fetch + 데이터 loader/action까지 한 번에 lazy 가능
// routes/<domain>/ 폴더 안의 파일을 직접 import (배럴 X)
export const router = createBrowserRouter([
  {
    path: '/',
    // root.tsx — Component (Outlet + Suspense 레이아웃) + ErrorBoundary (라우트 에러 캐치)
    lazy: () => import('./routes/root'),
    children: [
      { index: true, lazy: () => import('./routes/home') },
      { path: 'health', lazy: () => import('./routes/health/status/status') },
      { path: 'orders', lazy: () => import('./routes/order/list/list') },
      { path: 'orders/new', lazy: () => import('./routes/order/new/new') },
      { path: '*', lazy: () => import('./routes/not-found') },
    ],
  },
])
