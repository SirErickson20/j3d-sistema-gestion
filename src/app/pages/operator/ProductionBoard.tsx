import { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Package, User, Calendar, DollarSign, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { OrderStatus } from '../../types';
import { toast } from 'sonner';

const getAllowedNextStatuses = (current: OrderStatus): { value: OrderStatus; label: string }[] => {
  switch (current) {
    case 'in_production':
      return [
        { value: 'in_production', label: 'En Producción' },
        { value: 'pending_balance', label: 'Listo (Pte. Saldo)' },
        { value: 'cancelled', label: 'Cancelar' }
      ];
    case 'pending_balance':
      return [
        { value: 'pending_balance', label: 'Pendiente de Saldo' },
        { value: 'finished', label: 'Aprobar Pago (Finalizado)' },
        { value: 'cancelled', label: 'Cancelar' }
      ];
    case 'finished':
      return [
        { value: 'finished', label: 'Finalizado' },
        { value: 'delivered', label: 'Entregado' },
        { value: 'cancelled', label: 'Cancelar' }
      ];
    case 'pending_deposit':
    case 'deposit_verification':
      return [
        { value: current, label: current === 'pending_deposit' ? 'Pendiente Seña' : 'Seña por Verificar' },
        { value: 'in_production', label: 'En Producción' },
        { value: 'cancelled', label: 'Cancelar' }
      ];
    case 'pending_quotation':
      return [
        { value: 'pending_quotation', label: 'Pendiente Presupuesto' },
        { value: 'cancelled', label: 'Cancelar' }
      ];
    case 'pending_approval':
      return [
        { value: 'pending_approval', label: 'En Rediseño' },
        { value: 'cancelled', label: 'Cancelar' }
      ];
    case 'quotation_sent':
      return [
        { value: 'quotation_sent', label: 'Presupuesto Enviado' },
        { value: 'cancelled', label: 'Cancelar' }
      ];
    case 'balance_verification':
      return [
        { value: 'balance_verification', label: 'Saldo por Verificar' },
        { value: 'finished', label: 'Aprobar Pago (Finalizado)' },
        { value: 'cancelled', label: 'Cancelar' }
      ];
    case 'delivered':
      return [{ value: 'delivered', label: 'Entregado' }];
    case 'cancelled':
      return [{ value: 'cancelled', label: 'Cancelado' }];
    default:
      return [];
  }
};

const columns: { id: OrderStatus; label: string; color: string }[] = [
  { id: 'pending_quotation', label: 'Pte. Presupuesto', color: '#A0A0A0' },
  { id: 'quotation_sent', label: 'Presupuesto Enviado', color: '#60A5FA' },
  { id: 'pending_approval', label: 'En Rediseño', color: '#FCD34D' },
  { id: 'pending_deposit', label: 'Pendiente Seña', color: '#F87171' },
  { id: 'in_production', label: 'Producción', color: '#FF1744' },
  { id: 'pending_balance', label: 'Pte. Saldo', color: '#FB923C' },
  { id: 'finished', label: 'Finalizado', color: '#4ADE80' },
  { id: 'delivered', label: 'Entregado', color: '#34D399' },
];

export function ProductionBoard() {
  const { orders, updateOrderStatus, currentUser } = useApp();

  // Confirmation state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter((order) => {
      if (status === 'pending_deposit') {
        return order.status === 'pending_deposit' || order.status === 'deposit_verification';
      }
      if (status === 'pending_balance') {
        return order.status === 'pending_balance' || order.status === 'balance_verification';
      }
      return order.status === status;
    });
  };

  const handleMoveStatus = (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === newStatus) return;

    const statusLabels: Record<OrderStatus, string> = {
      pending_quotation: 'Pendiente de Presupuesto',
      quotation_sent: 'Presupuesto Enviado',
      pending_approval: 'En Rediseño',
      pending_deposit: 'Pendiente de Seña',
      deposit_verification: 'Seña Pendiente de Verificación',
      in_production: 'En Producción',
      pending_balance: 'Listo (Pte. Saldo)',
      finished: 'Aprobar Pago (Finalizado)',
      balance_verification: 'Saldo Pendiente de Verificación',
      delivered: 'Entregado',
      cancelled: 'Cancelar'
    };

    triggerConfirm(
      'Mover Estado de Pedido',
      `¿Desea confirmar la actualización del estado del pedido #${orderId} a "${statusLabels[newStatus]}"?`,
      () => {
        updateOrderStatus(orderId, newStatus, 'operator');
        toast.success(`Pedido ${orderId} movido a "${statusLabels[newStatus]}"`);
      }
    );
  };

  return (
    <DashboardLayout userName={currentUser?.name || 'Operador'} userRole="operator">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2"><br />Tablero de Producción</h1>
          <p className="text-[#A0A0A0] text-sm">
            Gestiona el flujo de trabajo de todos los pedidos en tiempo real (RF05)
          </p>
        </div>

        {/* Kanban Board Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-2 pb-4">
          {columns.map((column) => {
            const columnOrders = getOrdersByStatus(column.id);

            return (
              <div key={column.id} className="w-full flex flex-col min-w-0">
                {/* Column Header */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5 px-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: column.color }}
                      />
                      <h3 className="font-bold text-white text-[11px] truncate uppercase tracking-wider" title={column.label}>
                        {column.label}
                      </h3>
                    </div>
                    <span className="px-1.5 py-0.5 bg-[#151515] rounded text-[10px] font-bold text-[#A0A0A0] border border-white/5">
                      {columnOrders.length}
                    </span>
                  </div>
                  <div className="h-1 bg-[#151515] rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${Math.min((columnOrders.length / 5) * 100, 100)}%`,
                        backgroundColor: column.color,
                      }}
                    />
                  </div>
                </div>

                {/* Cards Container */}
                <div className="space-y-2 flex-1 min-h-[300px]">
                  {columnOrders.map((order) => (
                    <Card
                      key={order.id}
                      className="p-2.5 border border-[rgba(255,255,255,0.06)] bg-[#1C1C1C] flex flex-col justify-between"
                      hover
                    >
                      {/* Order Header */}
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-white text-[10px] truncate">
                            {order.id}
                          </h4>
                          <PaymentStatusBadge status={order.paymentStatus} className="scale-75 origin-right shrink-0" />
                        </div>
                        <p className="text-[11px] text-white font-medium truncate" title={order.productName}>
                          {order.productName}
                        </p>
                        {(order.status === 'deposit_verification' || order.status === 'balance_verification' || order.status === 'pending_balance') && (
                          <div className={`mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider inline-block ${
                            order.status === 'pending_balance'
                              ? 'bg-[rgba(255,23,68,0.1)] border border-[rgba(255,23,68,0.2)] text-[#FF1744]'
                              : 'bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.2)] text-[#FCD34D]'
                          }`}>
                            {order.status === 'deposit_verification'
                              ? 'Verificar Seña'
                              : order.status === 'balance_verification'
                              ? 'Verificar Saldo'
                              : 'Esperando Saldo'}
                          </div>
                        )}
                      </div>

                      {/* Order Details (Stacked & Compact) */}
                      <div className="space-y-1 mb-3 text-[10px] text-[#A0A0A0]">
                        <div className="flex items-center gap-1.5 truncate">
                          <User className="w-3 h-3 text-[#FF1744] shrink-0" />
                          <span className="truncate">{order.customerName}</span>
                        </div>
                        {order.estimatedDelivery && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-[#FF1744] shrink-0" />
                            <span>{formatDate(order.estimatedDelivery)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <DollarSign className="w-3 h-3 text-[#FF1744] shrink-0" />
                          <span>{formatCurrency(order.totalPrice)}</span>
                          {order.quantity > 1 && (
                            <span className="text-[#A0A0A0] text-[9px] font-normal">(x{order.quantity})</span>
                          )}
                        </div>
                      </div>

                      {/* Status select dropdown */}
                      <div className="pt-2.5 border-t border-white/5 space-y-1">
                        <label className="block text-[8px] text-[#A0A0A0] font-bold uppercase tracking-wider">Mover a:</label>
                        <select
                          value={order.status}
                          onChange={(e) => handleMoveStatus(order.id, e.target.value as OrderStatus)}
                          className="w-full text-[10px] bg-[#151515] border border-white/10 rounded px-1.5 py-1 text-white focus:outline-none cursor-pointer"
                        >
                          {getAllowedNextStatuses(order.status).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </Card>
                  ))}

                  {columnOrders.length === 0 && (
                    <div className="flex items-center justify-center h-16 border border-dashed border-[rgba(255,255,255,0.06)] rounded-xl bg-[#151515]/30">
                      <p className="text-[10px] text-[#8888aa]">Sin pedidos</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        title={confirmDialog.title}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#A0A0A0]">{confirmDialog.message}</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-[#FF1744] hover:bg-[#D50032] font-bold"
              onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
              }}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

