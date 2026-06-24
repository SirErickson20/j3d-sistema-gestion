import { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { OrderStatusBadge, PaymentStatusBadge, PaymentValidationStatusBadge } from '../../components/ui/Badge';
import {
  Search,
  Filter,
  Download,
  Eye,
  ChevronDown,
  DollarSign,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate, generatePlaceholderReceipt, getExtensionFromDataUrl } from '../../lib/utils';
import { OrderStatus, Order } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'sonner';

export function OrderManagement() {
  const { orders, payments, updateOrderStatus, verifyPayment, currentUser, dbLoaded, clearAllData } = useApp();

  if (!dbLoaded) {
    return (
      <DashboardLayout userName={currentUser?.name || 'Operador'} userRole="operator">
        <div className="text-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF1744] mx-auto mb-4" />
          <p className="text-[#A0A0A0]">Cargando gestión de pedidos...</p>
        </div>
      </DashboardLayout>
    );
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'customer'>('date');

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'seña' | 'saldo'>('seña');
  const [paymentMethod, setPaymentMethod] = useState('Transferencia');
  const [paymentReceiptName, setPaymentReceiptName] = useState('');
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rejectPaymentReason, setRejectPaymentReason] = useState('');
  const [isRejectPaymentOpen, setIsRejectPaymentOpen] = useState(false);

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

  const handleViewFullImage = (fileUrl: string) => {
    const newTab = window.open();
    if (newTab) {
      newTab.document.write(`
        <html>
          <head>
            <title>Imagen de Referencia</title>
            <style>
              body { margin: 0; background: #0B0B0B; display: flex; align-items: center; justify-content: center; height: 100vh; }
              img { max-width: 100%; max-height: 100%; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${fileUrl}" alt="Referencia" />
          </body>
        </html>
      `);
      newTab.document.close();
    }
  };

  const handleExportExcel = () => {
    if (orders.length === 0) {
      toast.error('No hay pedidos para exportar');
      return;
    }

    const headers = [
      'ID Pedido',
      'Cliente',
      'Email Cliente',
      'Producto',
      'Cantidad',
      'Estado',
      'Estado de Pago',
      'Total',
      'Seña Pagada',
      'Saldo Pendiente',
      'Entrega Estimada',
      'Fecha Creacion',
      'Prioridad',
      'Metodo Entrega',
      'Color'
    ];

    const rows = orders.map(order => [
      order.id,
      order.customerName,
      order.customerEmail,
      order.productName,
      order.quantity.toString(),
      order.status,
      order.paymentStatus,
      order.totalPrice.toString(),
      order.depositPaid.toString(),
      order.remainingBalance.toString(),
      order.estimatedDelivery || '',
      order.createdAt,
      order.priority,
      order.deliveryMethod,
      order.specifications?.color || ''
    ]);

    const CSV_SEPARATOR = ';';
    const csvContent = 
      'sep=' + CSV_SEPARATOR + '\r\n' +
      headers.join(CSV_SEPARATOR) + '\r\n' +
      rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(CSV_SEPARATOR)).join('\r\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pedidos_j3d_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Listado de pedidos exportado correctamente');
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    const matchesDate = !dateFilter || order.createdAt.startsWith(dateFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesDate;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'price') {
      return b.totalPrice - a.totalPrice;
    } else {
      return a.customerName.localeCompare(b.customerName);
    }
  });

  const handleOpenDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleStatusChange = (status: OrderStatus) => {
    if (!selectedOrder) return;
    const statusLabels: Record<OrderStatus, string> = {
      pending_quotation: 'Pendiente de Presupuesto',
      quotation_sent: 'Presupuesto Enviado',
      pending_approval: 'En Rediseño',
      pending_deposit: 'Pendiente de Seña',
      deposit_verification: 'Seña Pendiente de Verificación',
      in_production: 'En Producción',
      pending_balance: 'Pendiente de Saldo',
      finished: 'Finalizado',
      balance_verification: 'Saldo Pendiente de Verificación',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };
    triggerConfirm(
      'Cambiar Estado',
      `¿Desea confirmar el cambio de estado del pedido a "${statusLabels[status]}"?`,
      () => {
        updateOrderStatus(selectedOrder.id, status, 'operator');
        setSelectedOrder(prev => prev ? { ...prev, status } : null);
        toast.success(`Estado del pedido actualizado a "${statusLabels[status]}"`);
      }
    );
  };

  const handleApprovePayment = (type: 'seña' | 'saldo') => {
    if (!selectedOrder) return;
    triggerConfirm(
      'Aprobar Pago',
      `¿Desea confirmar la aprobación y validación del pago de la ${type === 'seña' ? 'Seña' : 'Saldo'}?`,
      () => {
        verifyPayment(selectedOrder.id, type, 'approve');
        setSelectedOrder(prev => {
          if (!prev) return null;
          const depositVal = type === 'seña' ? prev.totalPrice * 0.5 : prev.depositPaid;
          const remainVal = type === 'seña' ? prev.totalPrice * 0.5 : 0;
          const statusVal = type === 'seña' ? 'in_production' : 'finished';
          const payStatusVal = type === 'seña' ? 'partial' : 'completed';
          return {
            ...prev,
            status: statusVal,
            depositPaid: depositVal,
            remainingBalance: remainVal,
            paymentStatus: payStatusVal
          };
        });
        toast.success(`Pago de ${type === 'seña' ? 'Seña' : 'Saldo'} aprobado correctamente.`);
        setIsDetailOpen(false);
      }
    );
  };

  const handleRejectPaymentSubmit = (e: React.FormEvent, type: 'seña' | 'saldo') => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!rejectPaymentReason.trim()) {
      toast.error('Indique el motivo del rechazo');
      return;
    }
    triggerConfirm(
      'Rechazar Pago',
      `¿Desea confirmar el rechazo de este comprobante de pago de la ${type === 'seña' ? 'Seña' : 'Saldo'}?`,
      () => {
        verifyPayment(selectedOrder.id, type, 'reject', rejectPaymentReason);
        setSelectedOrder(prev => {
          if (!prev) return null;
          const statusVal = type === 'seña' ? 'pending_deposit' : 'pending_balance';
          return {
            ...prev,
            status: statusVal,
            paymentStatus: 'invalidated'
          };
        });
        toast.success(`Pago de ${type === 'seña' ? 'Seña' : 'Saldo'} rechazado correctamente.`);
        setIsRejectPaymentOpen(false);
        setRejectPaymentReason('');
        setIsDetailOpen(false);
      }
    );
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!cancelReason.trim()) {
      toast.error('Debe indicar el motivo de cancelación');
      return;
    }
    triggerConfirm(
      'Cancelar Pedido',
      '¿Desea confirmar la cancelación definitiva de este pedido?',
      () => {
        updateOrderStatus(selectedOrder.id, 'cancelled', 'operator', cancelReason);
        const now = new Date().toISOString();
        setSelectedOrder(prev => prev ? {
          ...prev,
          status: 'cancelled',
          cancellation: {
            reason: cancelReason,
            date: now,
            cancelledByRole: 'operator'
          }
        } : null);
        toast.success('Pedido cancelado correctamente');
        setIsCancelOpen(false);
        setIsDetailOpen(false);
        setCancelReason('');
      }
    );
  };

  return (
    <DashboardLayout userName={currentUser?.name || 'Operador'} userRole="operator">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2"><br></br>
              Listado de Pedidos
            </h1>
            <p className="text-[#A0A0A0]">
              {filteredOrders.length} pedido(s) encontrado(s)
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </div>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative md:col-span-2 lg:col-span-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A0A0A0]" />
              <input
                type="text"
                placeholder="Buscar ID, cliente o producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded-xl text-white placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF1744]/50 focus:border-[#FF1744] transition-all text-sm"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full appearance-none px-4 py-2.5 pr-10 bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF1744]/50 focus:border-[#FF1744] cursor-pointer"
              >
                <option value="all">Todos los Estados</option>
                <option value="pending_quotation">Pendiente Presupuesto</option>
                <option value="quotation_sent">Presupuesto Enviado</option>
                <option value="pending_approval">Pendiente Aprobación</option>
                <option value="pending_deposit">Pendiente Seña</option>
                <option value="in_production">En Producción</option>
                <option value="finished">Terminado</option>
                <option value="delivered">Entregado</option>
                <option value="cancelled">Cancelado</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A0A0] pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="w-full appearance-none px-4 py-2.5 pr-10 bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF1744]/50 focus:border-[#FF1744] cursor-pointer"
              >
                <option value="all">Prioridad: Todas</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A0A0] pointer-events-none" />
            </div>
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF1744]/50"
              />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full appearance-none px-4 py-2.5 pr-10 bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF1744]/50 focus:border-[#FF1744] cursor-pointer"
              >
                <option value="date">Ordenar: Más Reciente</option>
                <option value="price">Ordenar: Mayor Precio</option>
                <option value="customer">Ordenar: Cliente A-Z</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A0A0] pointer-events-none" />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.08)]">
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#A0A0A0]">ID Pedido</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#A0A0A0]">Cliente</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#A0A0A0]">Producto</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#A0A0A0]">Estado</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#A0A0A0]">Pago</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#A0A0A0]">Total</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#A0A0A0]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map((order) => (
                  <tr key={order.id} className="border-b border-[rgba(255,255,255,0.08)] hover:bg-[#151515] transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{order.id}</td>
                    <td className="px-6 py-4 text-white text-sm">{order.customerName}</td>
                    <td className="px-6 py-4 text-white text-sm">
                      {order.productName}
                      <p className="text-[#A0A0A0] text-xs">Prioridad: {order.priority === 'high' ? 'Alta' : order.priority === 'medium' ? 'Media' : 'Baja'}</p>
                    </td>
                    <td className="px-6 py-4"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-6 py-4"><PaymentStatusBadge status={order.paymentStatus} /></td>
                    <td className="px-6 py-4 text-white font-medium">{formatCurrency(order.totalPrice)}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleOpenDetails(order)} className="p-2 hover:bg-[#FF1744]/20 rounded-lg text-[#A0A0A0] hover:text-[#FF1744] transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sortedOrders.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-xl font-medium text-white mb-2">No se encontraron pedidos</h3>
              <p className="text-[#A0A0A0]">Intenta ajustar los filtros de búsqueda</p>
            </div>
          )}
        </Card>

        {selectedOrder && (
          <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`Detalles de Pedido #${selectedOrder.id}`}>
            <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 text-sm text-white">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 bg-[#151515] p-4 rounded-xl border border-[rgba(255,255,255,0.08)]">
                <div>
                  <p className="text-xs text-[#A0A0A0]">Cliente</p>
                  <p className="font-semibold">{selectedOrder.customerName}</p>
                  <p className="text-xs text-[#A0A0A0]">{selectedOrder.customerEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-[#A0A0A0]">Producto</p>
                  <p className="font-semibold">{selectedOrder.productName}</p>
                  <p className="text-xs text-[#A0A0A0]">Cantidad: {selectedOrder.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-[#A0A0A0]">Estado</p>
                  <OrderStatusBadge status={selectedOrder.status} />
                </div>
                <div>
                  <p className="text-xs text-[#A0A0A0]">Prioridad</p>
                  <span>{selectedOrder.priority === 'high' ? 'Alta' : selectedOrder.priority === 'medium' ? 'Media' : 'Baja'}</span>
                </div>
              </div>

              {/* Cancellation Info */}
              {selectedOrder.status === 'cancelled' && (
                <div className="p-4 bg-[rgba(255,23,68,0.08)] border border-[rgba(255,23,68,0.25)] rounded-xl space-y-2">
                  <p className="font-semibold text-[#FF1744] text-xs uppercase tracking-wider">Detalles de Cancelación</p>
                  {selectedOrder.cancellation ? (
                    <div className="space-y-1.5 text-xs text-[#A0A0A0]">
                      <p>Motivo: <span className="text-white font-medium">{selectedOrder.cancellation.reason}</span></p>
                      <p>Cancelado por: <span className="text-white capitalize">{selectedOrder.cancellation.cancelledByRole === 'client' ? 'Cliente' : 'Operador'}</span></p>
                      <p>Fecha: <span className="text-white">{formatDate(selectedOrder.cancellation.date)}</span></p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#A0A0A0]">No se especificó un motivo de cancelación.</p>
                  )}
                </div>
              )}

              {/* Specifications */}
              <div className="space-y-2">
                <h4 className="font-semibold text-white">Especificaciones técnicas:</h4>
                <div className="p-3 bg-[#151515] rounded-xl border border-[rgba(255,255,255,0.08)] space-y-1.5 text-xs text-[#A0A0A0]">
                  {selectedOrder.specifications?.color && <p>Color: <span className="text-white">{selectedOrder.specifications.color}</span></p>}
                  {selectedOrder.specifications?.notes && <p>Notas: <span className="text-white">{selectedOrder.specifications.notes}</span></p>}
                  {selectedOrder.specifications?.pieceType && <p>Tipo de Pieza: <span className="text-white">{selectedOrder.specifications.pieceType}</span></p>}
                  {selectedOrder.deliveryMethod && <p>Método de Entrega: <span className="text-white">{selectedOrder.deliveryMethod === 'pickup' ? 'Retiro en Local' : 'Envío a Domicilio'}</span></p>}
                  {selectedOrder.deliveryAddress && <p>Dirección de Envío: <span className="text-white">{selectedOrder.deliveryAddress}</span></p>}
                </div>
              </div>

              {/* Redesign Comments */}
              {selectedOrder.comments && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Detalles del Rediseño Solicitado:</h4>
                  <div className="p-4 bg-[rgba(251,191,36,0.05)] border border-[rgba(251,191,36,0.2)] rounded-xl space-y-1">
                    <p className="font-semibold text-[#FCD34D] text-xs uppercase tracking-wider mb-2">Comentarios del cliente:</p>
                    <p className="text-xs text-white bg-[#0B0B0B]/50 p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap leading-relaxed">
                      {selectedOrder.comments}
                    </p>
                  </div>
                </div>
              )}

              {/* Reference Files */}
              {selectedOrder.files && selectedOrder.files.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Archivos / Imágenes de Referencia:</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedOrder.files.map((file, idx) => {
                      const isImage = file.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file);
                      const isBase64 = file.startsWith('data:');
                      const fileUrl = isBase64 
                        ? file 
                        : (file.startsWith('http') ? file : `http://localhost:5000/uploads/${file}`);

                      return (
                        <div key={idx} className="bg-[#151515] p-3 rounded-xl border border-[rgba(255,255,255,0.08)] flex flex-col items-center justify-center space-y-2">
                          {isImage ? (
                            <div className="w-full h-32 rounded-lg overflow-hidden border border-white/5 bg-[#0B0B0B] flex items-center justify-center relative group">
                              <img 
                                src={fileUrl} 
                                alt={`Referencia ${idx + 1}`} 
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <button 
                                  type="button"
                                  onClick={() => handleViewFullImage(fileUrl)}
                                  className="px-3 py-1.5 bg-[#FF1744] text-white text-xs font-bold rounded-lg hover:bg-[#D50000] transition-colors cursor-pointer"
                                >
                                  Ver Completa
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-32 rounded-lg border border-white/5 bg-[#0B0B0B] flex flex-col items-center justify-center p-2 text-center text-xs">
                              <span className="text-[#A0A0A0] text-xl mb-1">📄</span>
                              <span className="text-white truncate w-full" title={file}>{isBase64 ? 'Archivo Base64' : file.split('/').pop()}</span>
                            </div>
                          )}
                          {isBase64 ? (
                            <a 
                              href={fileUrl} 
                              download={`referencia_${idx + 1}.png`}
                              className="text-xs text-[#FF1744] hover:underline truncate w-full text-center cursor-pointer"
                            >
                              Descargar
                            </a>
                          ) : (
                            <a 
                              href={fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs text-[#FF1744] hover:underline truncate w-full text-center cursor-pointer"
                            >
                              Descargar
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status History */}
              <div className="space-y-2">
                <h4 className="font-semibold text-white">Historial de Estados:</h4>
                <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                  {selectedOrder.statusHistory?.map((h, i) => (
                    <div key={i} className="flex justify-between text-xs text-[#A0A0A0] bg-[#151515] p-2 rounded border border-[rgba(255,255,255,0.04)]">
                      <span>{formatDate(h.timestamp)} - <span className="text-white capitalize">{h.status.replace('_', ' ')}</span></span>
                      <span>Por: {h.updatedByRole === 'operator' ? 'Operador' : 'Cliente'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Verification Panel */}
              {(() => {
                const pendingPayment = payments.find(p => p.orderId === selectedOrder.id && p.status === 'pending_validation');
                if (pendingPayment) {
                  return (
                    <div className="p-4 bg-[rgba(251,191,36,0.05)] border border-[rgba(251,191,36,0.2)] rounded-xl space-y-3">
                      <p className="font-semibold text-[#FCD34D] text-xs uppercase tracking-wider">Verificación de Pago Requerida</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <p className="text-[#A0A0A0]">Tipo de Pago: <span className="text-white font-medium">{pendingPayment.type === 'seña' ? 'Seña (50%)' : 'Saldo Restante'}</span></p>
                        <p className="text-[#A0A0A0]">Monto Cargado: <span className="text-white font-medium">{formatCurrency(pendingPayment.amount)}</span></p>
                        <p className="text-[#A0A0A0]">Método: <span className="text-white font-medium">{pendingPayment.method}</span></p>
                        <p className="text-[#A0A0A0]">Comprobante: 
                          <a
                            href={pendingPayment.receiptUrl.startsWith('data:') ? pendingPayment.receiptUrl : '#'}
                            download={pendingPayment.receiptUrl.startsWith('data:') ? `comprobante_${pendingPayment.type}_${selectedOrder.id}.${getExtensionFromDataUrl(pendingPayment.receiptUrl)}` : undefined}
                            onClick={(e) => {
                              if (!pendingPayment.receiptUrl.startsWith('data:')) {
                                e.preventDefault();
                                const dataUrl = generatePlaceholderReceipt(
                                  selectedOrder.id,
                                  pendingPayment.type,
                                  pendingPayment.amount,
                                  pendingPayment.method,
                                  pendingPayment.date,
                                  pendingPayment.receiptUrl
                                );
                                const element = document.createElement('a');
                                element.href = dataUrl;
                                element.download = `comprobante_${pendingPayment.type}_${selectedOrder.id}.png`;
                                document.body.appendChild(element);
                                element.click();
                                document.body.removeChild(element);
                              }
                            }}
                            className="text-[#FF1744] underline font-medium cursor-pointer ml-1"
                          >
                            {pendingPayment.receiptUrl.startsWith('data:') ? 'Descargar Archivo' : pendingPayment.receiptUrl}
                          </a>
                        </p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="primary" className="bg-[#4ADE80] hover:bg-[#22C55E]" onClick={() => handleApprovePayment(pendingPayment.type)}>Aprobar Pago</Button>
                        <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => { setIsRejectPaymentOpen(true); setIsDetailOpen(false); }}>Rechazar Pago</Button>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Sequential Status Transitions Row */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                {selectedOrder.status === 'in_production' && (
                  <Button size="sm" variant="primary" onClick={() => handleStatusChange('pending_balance')}>
                    Finalizar Producción (Pte. Saldo)
                  </Button>
                )}
                {selectedOrder.status === 'pending_balance' && (
                  <Button size="sm" variant="primary" className="bg-[#4ADE80] hover:bg-[#22C55E]" onClick={() => {
                    triggerConfirm(
                      'Aprobar Pago de Saldo',
                      '¿Desea confirmar la aprobación del pago de saldo y marcar el pedido como Finalizado?',
                      () => {
                        verifyPayment(selectedOrder.id, 'saldo', 'approve');
                        setSelectedOrder(prev => prev ? {
                          ...prev,
                          status: 'finished',
                          depositPaid: prev.totalPrice,
                          remainingBalance: 0,
                          paymentStatus: 'completed'
                        } : null);
                        toast.success('Pago de saldo aprobado. Pedido Finalizado.');
                      }
                    );
                  }}>
                    Aprobar Pago de Saldo (Finalizado)
                  </Button>
                )}
                {selectedOrder.status === 'finished' && (
                  <Button size="sm" variant="primary" className="bg-[#3b82f6] hover:bg-[#2563eb]" onClick={() => {
                    handleStatusChange('delivered');
                  }}>
                    Registrar Entrega Física (Entregado)
                  </Button>
                )}
                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 ml-auto" onClick={() => { setIsCancelOpen(true); setIsDetailOpen(false); }}>
                    Cancelar Pedido
                  </Button>
                )}
              </div>
            </div>
          </Modal>
        )}

        {selectedOrder && (
          <Modal isOpen={isRejectPaymentOpen} onClose={() => setIsRejectPaymentOpen(false)} title="Rechazar Pago">
            <form onSubmit={(e) => {
              const pendingPayment = payments.find(p => p.orderId === selectedOrder.id && p.status === 'pending_validation');
              if (pendingPayment) {
                handleRejectPaymentSubmit(e, pendingPayment.type);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Indique el motivo del rechazo del comprobante *
                </label>
                <textarea
                  onChange={(e) => setRejectPaymentReason(e.target.value)}
                  value={rejectPaymentReason}
                  className="w-full p-2 bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded text-white h-24"
                  placeholder="Ej: El monto transferido es incorrecto o el comprobante no es válido..."
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsRejectPaymentOpen(false)}>Cancelar</Button>
                <Button type="submit" variant="primary">Confirmar Rechazo</Button>
              </div>
            </form>
          </Modal>
        )}

        {selectedOrder && (
          <Modal isOpen={isCancelOpen} onClose={() => setIsCancelOpen(false)} title="Cancelar Pedido">
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              {selectedOrder.depositPaid > 0 && (
                <div className="p-3 bg-[rgba(255,23,68,0.1)] border border-[rgba(255,23,68,0.2)] rounded-xl text-center">
                  <p className="text-sm text-[#FF1744] font-semibold">
                    La seña no posee devolución.
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Motivo de cancelación *</label>
                <textarea onChange={(e) => setCancelReason(e.target.value)} className="w-full p-2 bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded text-white h-24" placeholder="Indique el motivo..." required />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCancelOpen(false)}>Atrás</Button>
                <Button type="submit" variant="primary">Confirmar Cancelación</Button>
              </div>
            </form>
          </Modal>
        )}

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
      </div>
    </DashboardLayout>
  );
}
