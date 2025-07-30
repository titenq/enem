import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import Layout from './components/Layout';
import Home from './pages/Home';

const NotFound = lazy(() => import('./pages/NotFound'));

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Home />
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<div>Carregando...</div>}>
            <NotFound />
          </Suspense>
        )
      }
    ]
  }
]);

export default router;
