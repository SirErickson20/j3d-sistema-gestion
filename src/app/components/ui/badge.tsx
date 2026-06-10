import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { OrderStatus, PaymentStatus, PaymentValidationStatus } from '../../types';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-[#1C1C1C] text-[#A0A0A0] border-[rgba(255,255,255,0.08)]',
    success: 'bg-[rgba(34,197,94,0.1)] text-[#4ADE80] border-[rgba(34,197,94,0.2)]',
    warning: 'bg-[rgba(251,191,36,0.1)] text-[#FCD34D] border-[rgba(251,191,36,0.2)]',
    danger: 'bg-[rgba(255,23,68,0.1)] text-[#FF1744] border-[rgba(255,23,68,0.2)]',
    info: 'bg-[rgba(59,130,246,0.1)] text-[#60A5FA] border-[rgba(59,130,246,0.2)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const statusConfig: Record<OrderStatus, { label: string; variant: BadgeProps['variant'] }> = {
    pending_quotation: { label: 'Pendiente de Presupuesto', variant: 'warning' },
    quotation_sent: { label: 'Presupuesto Enviado', variant: 'info' },
    pending_approval: { label: 'En Rediseño', variant: 'warning' },
    pending_deposit: { label: 'Pendiente de Seña', variant: 'warning' },
    deposit_verification: { label: 'Seña Pendiente de Verificación', variant: 'warning' },
    in_production: { label: 'En Producción', variant: 'info' },
    pending_balance: { label: 'Pendiente de Saldo', variant: 'warning' },
    finished: { label: 'Finalizado', variant: 'success' },
    balance_verification: { label: 'Saldo Pendiente de Verificación', variant: 'warning' },
    delivered: { label: 'Entregado', variant: 'success' },
    cancelled: { label: 'Cancelado', variant: 'danger' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const statusConfig: Record<PaymentStatus, { label: string; variant: BadgeProps['variant'] }> = {
    pending: { label: 'Pendiente', variant: 'warning' },
    partial: { label: 'Parcial', variant: 'info' },
    completed: { label: 'Pagado', variant: 'success' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}

export function PaymentValidationStatusBadge({ status }: { status: PaymentValidationStatus }) {
  const statusConfig: Record<PaymentValidationStatus, { label: string; variant: BadgeProps['variant'] }> = {
    pending_validation: { label: 'Pendiente de validación', variant: 'warning' },
    validated: { label: 'Validado', variant: 'success' },
    invalidated: { label: 'Invalidado', variant: 'danger' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </Badge>
  );
}
