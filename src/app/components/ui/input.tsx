import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-white mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded-xl',
            'text-white placeholder:text-[#A0A0A0]',
            'focus:outline-none focus:ring-2 focus:ring-[#FF1744]/50 focus:border-[#FF1744]',
            'transition-all duration-200',
            error && 'border-[#FF1744]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-[#FF1744]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export function Textarea({
  label,
  error,
  className,
  ...props
}: InputProps & { rows?: number }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          'w-full px-4 py-2.5 bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded-xl',
          'text-white placeholder:text-[#A0A0A0]',
          'focus:outline-none focus:ring-2 focus:ring-[#FF1744]/50 focus:border-[#FF1744]',
          'transition-all duration-200 resize-none',
          error && 'border-[#FF1744]',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-[#FF1744]">{error}</p>
      )}
    </div>
  );
}

export function Select({
  label,
  error,
  className,
  children,
  ...props
}: InputProps & { children: React.ReactNode }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label}
        </label>
      )}
      <select
        className={cn(
          'w-full px-4 py-2.5 bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded-xl',
          'text-white',
          'focus:outline-none focus:ring-2 focus:ring-[#FF1744]/50 focus:border-[#FF1744]',
          'transition-all duration-200',
          error && 'border-[#FF1744]',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-[#FF1744]">{error}</p>
      )}
    </div>
  );
}
