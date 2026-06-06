import { ReactNode } from 'react';
import { Card } from './Card';
import { cn } from '../../lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'primary';
}

export function KPICard({ title, value, icon, trend, variant = 'default' }: KPICardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden',
        variant === 'primary' && 'bg-gradient-to-br from-[#FF1744] to-[#D50032] border-transparent'
      )}
      glow={variant === 'primary'}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn(
            'text-sm mb-2',
            variant === 'primary' ? 'text-white/80' : 'text-[#A0A0A0]'
          )}>
            {title}
          </p>
          <p className={cn(
            'text-3xl font-medium mb-2',
            variant === 'primary' ? 'text-white' : 'text-white'
          )}>
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.value >= 0 ? 'text-[#4ADE80]' : 'text-[#FF1744]'
                )}
              >
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className={cn(
                'text-sm',
                variant === 'primary' ? 'text-white/70' : 'text-[#A0A0A0]'
              )}>
                {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          variant === 'primary'
            ? 'bg-white/10'
            : 'bg-[rgba(255,23,68,0.1)]'
        )}>
          <div className={cn(
            'w-6 h-6',
            variant === 'primary' ? 'text-white' : 'text-[#FF1744]'
          )}>
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
}
