import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/Button';
import { User, Lock, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Login() {
  const navigate = useNavigate();
  const { login, loginAttempts, lockoutUntil } = useApp();
  const [role] = useState<'client' | 'operator'>('operator');
  const [username, setUsername] = useState('Ivan');
  const [password, setPassword] = useState('123456');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  // Lockout countdown timer
  useEffect(() => {
    if (!lockoutUntil) {
      setSecondsLeft(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      if (now >= lockoutUntil) {
        setSecondsLeft(0);
      } else {
        setSecondsLeft(Math.ceil((lockoutUntil - now) / 1000));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = login(username, password, role);
    if (result.success) {
      if (role === 'client') {
        navigate('/');
      } else {
        navigate('/admin');
      }
    } else {
      setErrorMsg(result.error || 'Error de autenticación');
    }
  };

  const isLocked = secondsLeft > 0;

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex">
      {/* Left Side - Brand */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-[#151515] to-[#0B0B0B] border-r border-[rgba(255,255,255,0.08)] flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjM1LDIzOCwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-[#151515] border border-white/10 rounded-3xl mb-8 shadow-2xl shadow-[#FF1744]/20 overflow-hidden p-2">
            <img src="/logo.png" alt="J3D Logo" className="w-full h-full object-contain" />
          </div>

          <h1 className="text-5xl font-bold text-white mb-4">
            J3D
          </h1>
          <p className="text-xl text-[#A0A0A0] mb-8">
            Sistema de Gestión de Pedidos y Presupuestos
          </p>
          <p className="text-lg text-[#A0A0A0] max-w-md">
            Plataforma profesional para gestión de impresión 3D, cotizaciones y producción
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Bienvenido</h2>
            <p className="text-[#A0A0A0]">Ingresa tus credenciales para continuar</p>
          </div>



          {errorMsg && (
            <div className="mb-6 p-4 bg-[rgba(255,23,68,0.1)] border border-[rgba(255,23,68,0.2)] rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#FF1744] shrink-0 mt-0.5" />
              <p className="text-sm text-white">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A0A0A0]" />
                <input
                  type="text"
                  disabled={isLocked}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Usuario"
                  className="w-full pl-12 pr-4 py-3 bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded-xl text-white placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF1744]/50 focus:border-[#FF1744] transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A0A0A0]" />
                <input
                  type="password"
                  disabled={isLocked}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded-xl text-white placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF1744]/50 focus:border-[#FF1744] transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {isLocked ? (
              <div className="text-center py-2 bg-[rgba(255,191,36,0.1)] border border-[rgba(255,191,36,0.2)] rounded-lg">
                <p className="text-[#FCD34D] font-medium text-sm">
                  Inicio bloqueado. Espere {secondsLeft}s...
                </p>
              </div>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLocked}
            >
              Iniciar Sesión
            </Button>
          </form>


        </div>
      </div>
    </div>
  );
}

