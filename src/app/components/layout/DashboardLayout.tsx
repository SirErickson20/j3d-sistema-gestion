import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { UserRole } from '../../types';
import { Link } from 'react-router';

interface DashboardLayoutProps {
  children: ReactNode;
  userName: string;
  userRole: UserRole;
}

export function DashboardLayout({ children, userName, userRole }: DashboardLayoutProps) {
  if (userRole === 'client') {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-[#f0f0f5] flex flex-col font-['DM_Sans',_sans-serif]">
        {/* Simple top header for client tracking view */}
        <header className="sticky top-0 z-50 bg-[#0B0B0B]/92 backdrop-blur-md border-b border-[rgba(255,255,255,0.08)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 no-underline">
              <img src="/logo.png" alt="J3D Logo" className="w-10 h-10 object-contain rounded-lg" />
              <div>
                <h1 className="text-white font-semibold text-lg leading-none m-0 font-['Bebas_Neue',_sans-serif] tracking-wider">J3D</h1>
                <p className="text-[#A0A0A0] text-[10px] m-0">Impresiones</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm font-medium text-[#A0A0A0] hover:text-[#FF1744] transition-colors no-underline">
              Volver al Catálogo
            </Link>
            <Link to="/login" className="px-4 py-2 bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] text-white text-xs font-semibold rounded-lg transition-all border border-[rgba(255,255,255,0.1)] no-underline">
              Acceso Operador
            </Link>
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <Sidebar userRole={userRole} />
      <Header userName={userName} userRole={userRole} />
      <main className="ml-64 pt-20 p-8">
        {children}
      </main>
    </div>
  );
}
