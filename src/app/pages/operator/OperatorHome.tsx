import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useApp } from '../../context/AppContext';
import { Link } from 'react-router';
import {
  ShoppingCart,
  Calculator,
  Boxes,
  TrendingUp,
  CreditCard
} from 'lucide-react';

export function OperatorHome() {
  const { currentUser } = useApp();

  const sections = [
    {
      label: 'Pedidos',
      path: '/admin/orders',
      icon: ShoppingCart,
      desc: 'Administrar pedidos de catálogo y solicitudes personalizadas.'
    },
    {
      label: 'Presupuestos',
      path: '/admin/quotations',
      icon: Calculator,
      desc: 'Crear y enviar presupuestos para productos a medida.'
    },
    {
      label: 'Producción',
      path: '/admin/production',
      icon: Boxes,
      desc: 'Visualizar cola de impresión y estados de fabricación.'
    },
    {
      label: 'Historial de Pagos',
      path: '/admin/finances',
      icon: CreditCard,
      desc: 'Historial financiero, cobros, señas y saldos.'
    },
    {
      label: 'Reportes',
      path: '/admin/reports',
      icon: TrendingUp,
      desc: 'Análisis de ventas, métricas e indicadores de rendimiento.'
    }
  ];

  return (
    <DashboardLayout userName={currentUser?.name || 'Iván'} userRole="operator">
      <div className="max-w-5xl mx-auto py-6 space-y-8">
        
        {/* Welcome Section */}
        <div className="space-y-1">
          <h2 className="text-white font-bold text-2xl">
            ¡Hola, {currentUser?.name || 'Iván'}!
          </h2>
          <p className="text-[#A0A0A0] text-sm">
            Seleccioná una sección para gestionar el taller de impresión 3D
          </p>
        </div>

        {/* 3x2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.path}
                to={section.path}
                className="bg-[#16161f] border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center group hover:border-[#FF1744]/40 hover:shadow-[0_0_30px_rgba(255,23,68,0.12)] hover:-translate-y-1 transition-all duration-300 no-underline"
              >
                <div className="w-20 h-20 rounded-2xl bg-[#1c1c28] flex items-center justify-center border border-white/5 group-hover:bg-[#FF1744]/10 group-hover:border-[#FF1744]/20 transition-all duration-300">
                  <Icon className="w-10 h-10 text-[#FF1744] group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(255,23,68,0.3)]" />
                </div>
                <h3 className="text-white font-extrabold text-2xl font-['Bebas_Neue',_sans-serif] tracking-wider mt-5 group-hover:text-[#FF1744] transition-colors">
                  {section.label}
                </h3>
                <p className="text-[#8888aa] text-xs leading-relaxed mt-2 max-w-[200px]">
                  {section.desc}
                </p>
              </Link>
            );
          })}

          {/* Branding Card */}
          <div className="bg-[#121217] border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#FF1744]/5 to-transparent pointer-events-none" />
            <img
              src="/logo.png"
              alt="J3D Logo"
              className="w-16 h-16 object-contain rounded-xl shadow-[0_0_20px_rgba(255,23,68,0.2)] animate-pulse"
              style={{ animationDuration: '4s' }}
            />
            <h3 className="text-white font-extrabold text-lg font-['Bebas_Neue',_sans-serif] tracking-widest mt-5 uppercase">
              Panel de <span className="text-[#FF1744]">Administración</span>
            </h3>
            <p className="text-[#666680] text-[10px] leading-relaxed mt-2">
              J3D Impresiones — Sistema de Gestión v1.0
            </p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
