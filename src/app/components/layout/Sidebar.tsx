import { Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  CreditCard,
  Settings,
  Boxes,
  Calculator,
  TrendingUp,
  LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserRole } from '../../types';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  userRole: UserRole;
}

export function Sidebar({ userRole }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useApp();

  const clientLinks = [
    { icon: LayoutDashboard, label: 'Inicio', path: '/' },
    { icon: Package, label: 'Catálogo', path: '/client/catalog' },
  ];

  const operatorLinks = [
    { icon: LayoutDashboard, label: 'Inicio', path: '/admin' },
    { icon: ShoppingCart, label: 'Pedidos', path: '/admin/orders' },
    { icon: Calculator, label: 'Presupuestos', path: '/admin/quotations' },
    { icon: Boxes, label: 'Producción', path: '/admin/production' },
    { icon: CreditCard, label: 'Historial de Pagos', path: '/admin/finances' },
    { icon: TrendingUp, label: 'Reportes', path: '/admin/reports' },
  ];

  const links = userRole === 'client' ? clientLinks : operatorLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-[#151515] border-r border-[rgba(255,255,255,0.08)] h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="J3D Logo" className="w-10 h-10 object-contain rounded-lg" />
          <div>
            <h1 className="text-white font-semibold text-lg">J3D</h1>
            <p className="text-[#A0A0A0] text-xs">Sistema de Gestión</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;

          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                isActive
                  ? 'bg-[rgba(255,23,68,0.1)] text-[#FF1744] shadow-lg shadow-[#FF1744]/5'
                  : 'text-[#A0A0A0] hover:bg-[#1C1C1C] hover:text-white'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-all',
                  isActive && 'drop-shadow-[0_0_8px_rgba(255,23,68,0.5)]'
                )}
              />
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-[rgba(255,255,255,0.08)]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#A0A0A0] hover:bg-[rgba(255,23,68,0.1)] hover:text-[#FF1744] transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

