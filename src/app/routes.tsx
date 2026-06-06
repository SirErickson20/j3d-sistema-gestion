import { createBrowserRouter, Navigate } from 'react-router';
import { ClientLanding } from './pages/client/ClientLanding';
import { OrderTracking } from './pages/client/OrderTracking';
import { OperatorDashboard } from './pages/operator/OperatorDashboard';
import { ProductionBoard } from './pages/operator/ProductionBoard';
import { OrderManagement } from './pages/operator/OrderManagement';
import { QuotationBuilder } from './pages/operator/QuotationBuilder';
import { OperatorFinances } from './pages/operator/OperatorFinances';
import { Login } from './pages/Login';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ClientLanding />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/client',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/client/catalog',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/client/orders',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/client/orders/:id',
    element: <OrderTracking />,
  },
  {
    path: '/admin',
    element: <OperatorDashboard />,
  },
  {
    path: '/admin/orders',
    element: <OrderManagement />,
  },
  {
    path: '/admin/quotations',
    element: <QuotationBuilder />,
  },
  {
    path: '/admin/production',
    element: <ProductionBoard />,
  },
  {
    path: '/admin/reports',
    element: <OperatorDashboard />,
  },
  {
    path: '/admin/finances',
    element: <OperatorFinances />,
  },
  {
    path: '*',
    element: (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-[#FF1744] mb-4">404</h1>
          <p className="text-xl text-white mb-8">Página no encontrada</p>
          <a
            href="/"
            className="px-6 py-3 bg-[#FF1744] text-white rounded-xl hover:bg-[#D50032] transition-all"
          >
            Volver al Inicio
          </a>
        </div>
      </div>
    ),
  },
]);
