import { User } from 'lucide-react';

interface HeaderProps {
  userName: string;
  userRole: string;
}

export function Header({ userName, userRole }: HeaderProps) {
  return (
    <header className="h-20 bg-[#0B0B0B] border-b border-[rgba(255,255,255,0.08)] fixed top-0 right-0 left-64 z-10">
      <div className="h-full px-8 flex items-center justify-end">
        {/* Right Section */}
        <div className="flex items-center gap-4 ml-6">
          {/* User Menu */}
          <div className="flex items-center gap-3 pl-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{userName}</p>
              <p className="text-xs text-[#A0A0A0]">{userRole === 'client' ? 'Cliente' : 'Operador'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF1744] to-[#D50032] flex items-center justify-center shadow-lg shadow-[#FF1744]/30">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
