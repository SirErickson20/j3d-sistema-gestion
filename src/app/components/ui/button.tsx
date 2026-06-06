import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-[#FF1744] text-white hover:bg-[#D50032] shadow-lg shadow-[#FF1744]/20 hover:shadow-[#FF1744]/40',
    secondary: 'bg-[#1C1C1C] text-white hover:bg-[#252525] border border-[rgba(255,255,255,0.08)]',
    outline: 'bg-transparent text-white border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,23,68,0.08)] hover:border-[#FF1744]',
    ghost: 'bg-transparent text-white hover:bg-[rgba(255,23,68,0.08)]',
    danger: 'bg-[#D50032] text-white hover:bg-[#B00028] shadow-lg shadow-[#D50032]/20',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5',
    lg: 'px-8 py-3 text-lg',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
