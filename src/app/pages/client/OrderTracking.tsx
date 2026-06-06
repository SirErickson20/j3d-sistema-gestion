import { useParams, Link } from 'react-router';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/ui/Badge';
import {
  Package,
  FileText,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  AlertTriangle,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { OrderStatus } from '../../types';
import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'sonner';
import { products } from '../../data/mockData';

const statusTimeline: { status: OrderStatus; label: string; icon: any }[] = [
  { status: 'pending_quotation', label: 'Pte. Presupuesto', icon: FileText },
  { status: 'quotation_sent', label: 'Presupuesto Enviado', icon: FileText },
  { status: 'pending_approval', label: 'En Rediseño', icon: Clock },
  { status: 'pending_deposit', label: 'Pendiente de Seña', icon: DollarSign },
  { status: 'in_production', label: 'En Producción', icon: Package },
  { status: 'finished', label: 'Finalizado', icon: CheckCircle },
  { status: 'delivered', label: 'Entregado', icon: CheckCircle },
];

export function OrderTracking() {
  const { id } = useParams();
  const {
    orders,
    quotations,
    acceptQuotation,
    rejectQuotation,
    requestQuotationModifications,
    updateOrderStatus,
    submitPaymentReceipt,
    currentUser,
  } = useApp();

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [isRedesignModalOpen, setIsRedesignModalOpen] = useState(false);
  const [redesignComments, setRedesignComments] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('Transferencia');
  const [receiptName, setReceiptName] = useState('');

  const [isFichaModalOpen, setIsFichaModalOpen] = useState(false);

  const order = orders.find((o) => o.id === id);
  if (!order) {
    return (
      <DashboardLayout userName={currentUser?.name || 'Cliente'} userRole="client">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-white mb-2">Pedido no encontrado</h2>
          <p className="text-[#A0A0A0] mb-6">El código de pedido #{id} no existe.</p>
          <Link to="/client">
            <Button variant="primary">Volver al Dashboard</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const quotation = quotations.find((q) => q.orderId === order.id);

  // Calculate estimated duration in days (assuming 8 hours print capacity per day with 80% margin)
  let estimatedDays = 5;
  if (order.productId) {
    const product = products.find(p => p.id === order.productId);
    if (product) {
      estimatedDays = Math.ceil((product.printTime * order.quantity * 1.8) / 8);
    }
  } else if (quotation) {
    estimatedDays = Math.ceil(quotation.printTime / 8);
  }

  // Find index in timeline (handling cancelled and verification states)
  let timelineStatus = order.status;
  if (order.status === 'deposit_verification') {
    timelineStatus = 'pending_deposit';
  } else if (order.status === 'balance_verification') {
    timelineStatus = 'finished';
  }

  let currentStatusIndex = statusTimeline.findIndex((s) => s.status === timelineStatus);
  if (order.status === 'cancelled') {
    currentStatusIndex = -1; // special case
  }

  const handleCancelOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      toast.error('Indique el motivo de cancelación');
      return;
    }
    updateOrderStatus(order.id, 'cancelled', 'client', cancelReason);
    toast.success('Pedido cancelado correctamente');
    setIsCancelModalOpen(false);
    setCancelReason('');
  };

  const handlePaymentSubmit = (e: React.FormEvent, type: 'deposit' | 'final') => {
    e.preventDefault();
    if (!receiptName.trim()) {
      toast.error('Por favor, ingrese el nombre o archivo del comprobante.');
      return;
    }
    submitPaymentReceipt(order.id, type, paymentMethod, receiptName);
    toast.success('Comprobante enviado correctamente. Pendiente de verificación.');
    setReceiptName('');
  };

  const handleAcceptQuote = () => {
    if (quotation) {
      const now = new Date();
      const validUntilDate = new Date(quotation.validUntil);
      if (now > validUntilDate) {
        toast.error('La cotización ha expirado (vigencia de 7 días). Solicite un nuevo presupuesto.');
        return;
      }
    }
    acceptQuotation(order.id);
    toast.success('Presupuesto aprobado. El pedido está ahora "Pendiente de Seña (50%)".');
  };

  const handleRejectQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.error('Indique el motivo del rechazo');
      return;
    }
    rejectQuotation(order.id, rejectReason);
    toast.success('Presupuesto rechazado. Pedido cancelado.');
    setIsRejectModalOpen(false);
    setRejectReason('');
  };

  const handleRedesignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!redesignComments.trim()) {
      toast.error('Indique los cambios requeridos');
      return;
    }
    requestQuotationModifications(order.id, redesignComments);
    toast.success('Solicitud de modificaciones enviada. El estado es "En Rediseño".');
    setIsRedesignModalOpen(false);
    setRedesignComments('');
  };

  const handleDownloadPDF = () => {
    toast.success(`Generando presupuesto oficial para el pedido ${order.id}...`);
    if (quotation) {
      const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Presupuesto #${quotation.id} - J3D Impresiones</title>
  <style>
    body {
      background: #050510;
      color: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
    }
    .budget-document-section {
      padding: 60px 20px;
    }
    .budget-container {
      max-width: 700px;
      margin: auto;
    }
    .budget-header {
      text-align: center;
      margin-bottom: 40px;
    }
    .budget-badge {
      display: inline-block;
      padding: 8px 18px;
      border-radius: 999px;
      background: rgba(255, 0, 80, .1);
      color: #ff3366;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1px;
    }
    .budget-header h1 {
      margin-top: 15px;
      font-size: 2.5rem;
      font-weight: 800;
      color: white;
      margin-bottom: 5px;
    }
    .budget-header h1 span {
      display: block;
      color: #ff1f4d;
    }
    .budget-header p {
      color: #8f94aa;
      max-width: 500px;
      margin: 15px auto 0;
      font-size: 0.95rem;
    }
    .budget-card {
      background: #10101d;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 24px;
      padding: 35px;
      box-shadow: 0 0 25px rgba(255,0,80,.1);
    }
    .budget-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 35px;
    }
    .info-item {
      background: #171727;
      padding: 18px;
      border-radius: 14px;
    }
    .info-item label {
      display: block;
      color: #8f94aa;
      font-size: .85rem;
      margin-bottom: 8px;
    }
    .info-item span {
      color: white;
      font-weight: 600;
    }
    .financial-breakdown {
      margin-top: 20px;
    }
    .financial-breakdown h3 {
      color: white;
      margin-bottom: 20px;
    }
    .cost-row {
      display: flex;
      justify-content: space-between;
      padding: 14px 0;
      border-bottom: 1px solid rgba(255,255,255,.05);
    }
    .cost-row span {
      color: #aeb3c7;
    }
    .cost-row strong {
      color: white;
    }
    .cost-row.total {
      margin-top: 10px;
      font-size: 1.2rem;
      font-weight: bold;
    }
    .cost-row.total strong {
      color: #ff3366;
    }
    .print-btn {
      display: block;
      width: 100%;
      background: linear-gradient(135deg, #ff004c, #8b3dff);
      color: white;
      border: none;
      padding: 14px 24px;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      text-align: center;
      margin-top: 35px;
      font-size: 1rem;
      transition: 0.3s;
    }
    .print-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(255,0,80,0.3);
    }
    @media print {
      .print-btn { display: none; }
      body { background: white; color: black; }
      .budget-card { border: 1px solid #ccc; box-shadow: none; background: white; }
      .info-item { background: #f0f0f0; border: 1px solid #ddd; }
      .info-item span, .cost-row strong, .financial-breakdown h3, .budget-header h1 { color: black !important; }
      .cost-row span, .info-item label, .budget-header p { color: #555 !important; }
    }
  </style>
</head>
<body>
  <section class="budget-document-section">
    <div class="budget-container">
      <div class="budget-header">
        <span class="budget-badge">📄 DOCUMENTO OFICIAL</span>
        <h1>PRESUPUESTO<span>J3D IMPRESIONES</span></h1>
        <p>Documento formal generado automáticamente con todos los datos técnicos y financieros del proyecto.</p>
      </div>

      <div class="budget-card">
        <div class="budget-info-grid">
          <div class="info-item">
            <label>ID Presupuesto</label>
            <span>#PR-${quotation.id}</span>
          </div>
          <div class="info-item">
            <label>ID Pedido</label>
            <span>#${order.id}</span>
          </div>
          <div class="info-item">
            <label>Fecha de emisión</label>
            <span>${new Date(quotation.createdAt).toLocaleDateString('es-AR')}</span>
          </div>
          <div class="info-item">
            <label>Válido hasta</label>
            <span>${new Date(quotation.validUntil).toLocaleDateString('es-AR')}</span>
          </div>
          <div class="info-item">
            <label>Peso estimado</label>
            <span>${quotation.weight} g</span>
          </div>
          <div class="info-item">
            <label>Plazo de producción</label>
            <span>${estimatedDays} días</span>
          </div>
        </div>

        <div class="financial-breakdown">
          <h3>Desglose Financiero</h3>
          
          <div class="cost-row">
            <span>Material (${order.specifications?.material || 'PLA'})</span>
            <strong>$${Math.round(quotation.materialCost).toLocaleString('es-AR')}</strong>
          </div>

          <div class="cost-row">
            <span>Tiempo de impresión y Energía</span>
            <strong>$${Math.round(quotation.electricityCost + quotation.machineWearCost).toLocaleString('es-AR')}</strong>
          </div>

          <div class="cost-row">
            <span>Mano de Obra</span>
            <strong>$${Math.round(quotation.laborCost).toLocaleString('es-AR')}</strong>
          </div>

          <div class="cost-row total">
            <span>Total</span>
            <strong>$${Math.round(quotation.finalPrice).toLocaleString('es-AR')}</strong>
          </div>
        </div>

        <button class="print-btn" onclick="window.print()">Imprimir / Guardar como PDF</button>
      </div>
    </div>
  </section>
</body>
</html>
      `;
      const element = document.createElement("a");
      const file = new Blob([htmlContent], { type: 'text/html' });
      element.href = URL.createObjectURL(file);
      element.download = `Presupuesto_${order.id}.html`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <DashboardLayout userName={currentUser?.name || 'Cliente'} userRole="client">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-white">Seguimiento de Pedido</h1>
              <span className="text-xs text-[#A0A0A0] bg-[#151515] px-2 py-1 rounded-md border border-[rgba(255,255,255,0.08)]">
                {order.specifications?.pieceType ? 'Personalizado' : 'Catálogo'}
              </span>
            </div>
            <p className="text-[#A0A0A0]">#{order.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>

        {/* Cancellation Alert */}
        {order.status === 'cancelled' && (
          <div className="p-4 bg-[rgba(255,23,68,0.1)] border border-[rgba(255,23,68,0.3)] rounded-xl flex items-start gap-4">
            <XCircle className="w-8 h-8 text-[#FF1744] shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-white mb-1">Pedido Cancelado</h3>
              <p className="text-sm text-[#A0A0A0] mb-2">
                Este pedido ha sido cancelado y no se realizarán más acciones.
              </p>
              {order.cancellation && (
                <div className="text-xs text-white bg-[#151515] p-3 rounded-lg border border-[rgba(255,23,68,0.2)]">
                  <span className="font-semibold text-[#FF1744]">Motivo:</span> {order.cancellation.reason}
                  <br />
                  <span className="font-semibold text-[#FF1744]">Cancelado por:</span>{' '}
                  {order.cancellation.cancelledByRole === 'client' ? 'Cliente' : 'Operador'} el{' '}
                  {formatDate(order.cancellation.date)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        {order.status !== 'cancelled' && (
          <Card glow>
            <CardHeader>
              <CardTitle>Progreso del Pedido (RF06)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 sm:pl-0 sm:flex sm:justify-between sm:gap-4 overflow-x-auto pb-4">
                {/* Mobile vertical progress bar */}
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-[#151515] sm:hidden">
                  <div
                    className="absolute top-0 left-0 w-full bg-[#FF1744] transition-all"
                    style={{ height: `${(currentStatusIndex / (statusTimeline.length - 1)) * 100}%` }}
                  />
                </div>

                {/* Timeline Items */}
                {statusTimeline.map((item, index) => {
                  const Icon = item.icon;
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;

                  return (
                    <div
                      key={item.status}
                      className="relative flex items-start sm:flex-col sm:items-center sm:text-center gap-4 sm:gap-2 mb-6 sm:mb-0 min-w-[100px] flex-1"
                    >
                      {/* Icon container */}
                      <div
                        className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-gradient-to-br from-[#FF1744] to-[#D50032] shadow-lg shadow-[#FF1744]/40'
                            : 'bg-[#151515] border border-[rgba(255,255,255,0.08)]'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isCompleted ? 'text-white' : 'text-[#A0A0A0]'}`} />
                        {isCurrent && (
                          <div className="absolute inset-0 rounded-xl bg-[#FF1744] animate-ping opacity-20" />
                        )}
                      </div>

                      {/* Text */}
                      <div className="pt-2 sm:pt-0">
                        <h4 className={`text-xs font-semibold whitespace-nowrap ${isCompleted ? 'text-white' : 'text-[#A0A0A0]'}`}>
                          {item.label}
                        </h4>
                        {isCurrent && <p className="text-[10px] text-[#FF1744] font-medium">Actual</p>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Estimated Delivery Banner (RF06) */}
              {order.estimatedDelivery && (
                <div className="mt-8 p-4 bg-[rgba(255,23,68,0.05)] border border-[rgba(255,23,68,0.2)] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[rgba(255,23,68,0.1)] flex items-center justify-center">
                      <Clock className="w-5 h-5 text-[#FF1744]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#A0A0A0]">Fecha Estimada de Entrega</p>
                      {order.status === 'pending_quotation' ||
                       order.status === 'quotation_sent' ||
                       order.status === 'pending_approval' ||
                       order.status === 'pending_deposit' ? (
                        <p className="text-base sm:text-lg font-medium text-white">
                          A confirmar ({estimatedDays} días desde el pago de la seña)
                        </p>
                      ) : (
                        <p className="text-lg font-medium text-white">{formatDate(order.estimatedDelivery)}</p>
                      )}
                    </div>
                  </div>

                  {order.status !== 'delivered' && (
                    <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => setIsCancelModalOpen(true)}>
                      Cancelar Pedido
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Budget Section (RF11 / RF12 / RF13) */}
        {quotation && (
          <Card hover glow={order.status === 'quotation_sent'}>
            <CardHeader className="flex flex-row items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
              <div>
                <CardTitle>Presupuesto del Pedido (RF11)</CardTitle>
                <p className="text-xs text-[#A0A0A0] mt-1">
                  Cotización emitida. Válido por 7 días hasta el: <span className="text-white font-semibold">{formatDate(quotation.validUntil)}</span>
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsFichaModalOpen(true)}>
                <FileText className="w-4 h-4 mr-1" />
                Ver Ficha Técnica
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-sm text-[#A0A0A0]">Monto Total Cotizado</p>
                  <p className="text-3xl font-bold text-white">{formatCurrency(quotation.finalPrice)}</p>
                  <p className="text-xs text-[#A0A0A0] mt-1">
                    Plazo de entrega estimado: {estimatedDays} días (a partir del pago de la seña)
                  </p>
                </div>

                {/* RF12 & RF13 Actions */}
                {order.status === 'quotation_sent' && (
                  (() => {
                    const isQuoteExpired = quotation ? new Date() > new Date(quotation.validUntil) : false;
                    if (isQuoteExpired) {
                      return (
                        <div className="p-3 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] rounded-xl flex items-center gap-2 text-xs text-red-400 font-medium">
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                          <span>Esta cotización ha expirado (vigencia de 7 días superada). Por favor, contacte al operador.</span>
                        </div>
                      );
                    }
                    return (
                      <div className="flex gap-3 w-full md:w-auto">
                        <Button variant="outline" className="flex-1 md:flex-none" onClick={() => setIsRedesignModalOpen(true)}>
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Pedir Modificaciones
                        </Button>
                        <Button variant="outline" className="flex-1 md:flex-none border-red-500/40 text-[#FF1744] hover:bg-red-500/10" onClick={() => setIsRejectModalOpen(true)}>
                          Rechazar
                        </Button>
                        <Button variant="primary" className="flex-1 md:flex-none" onClick={handleAcceptQuote}>
                          Aceptar Presupuesto
                        </Button>
                      </div>
                    );
                  })()
                )}

                {order.status === 'pending_approval' && (
                  <div className="p-3 bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.2)] rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#FCD34D]" />
                    <span className="text-xs text-white font-medium">
                      Presupuesto en Rediseño. Aceptación bloqueada hasta nueva versión.
                    </span>
                  </div>
                )}

                {order.status !== 'quotation_sent' && order.status !== 'pending_approval' && (
                  <div className="p-3 bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.2)] rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#4ADE80]" />
                    <span className="text-xs text-white font-medium">Presupuesto aceptado comercialmente</span>
                  </div>
                )}
              </div>

              {/* Render Preview RF10 */}
              {quotation.prototypeUrl && (
                <div className="pt-4">
                  <p className="text-sm text-[#A0A0A0] mb-2 font-medium">Prototipo 3D / Render Asociado (RF10)</p>
                  <div className="relative aspect-video max-h-80 rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[#151515]">
                    <img src={quotation.prototypeUrl} alt="Render de Prototipo" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                      <p className="text-xs text-white font-medium">Visualización de Render e Imagen del Prototipo 3D</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Order Details & specifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card hover>
            <CardHeader>
              <CardTitle>Detalles del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-[#A0A0A0] mb-0.5">Producto/Especificación</p>
                <p className="text-sm text-white font-medium">{order.productName}</p>
              </div>
              <div>
                <p className="text-xs text-[#A0A0A0] mb-0.5">Cantidad Solicitada</p>
                <p className="text-sm text-white font-medium">{order.quantity} unidades</p>
              </div>
              {order.specifications?.material && (
                <div>
                  <p className="text-xs text-[#A0A0A0] mb-0.5">Material Requerido</p>
                  <p className="text-sm text-white font-medium">{order.specifications.material}</p>
                </div>
              )}
              {order.specifications?.color && (
                <div>
                  <p className="text-xs text-[#A0A0A0] mb-0.5">Color</p>
                  <p className="text-sm text-white font-medium">{order.specifications.color}</p>
                </div>
              )}
              {order.specifications?.notes && (
                <div>
                  <p className="text-xs text-[#A0A0A0] mb-0.5">Detalles / Instrucciones</p>
                  <p className="text-sm text-white bg-[#151515] p-3 rounded-lg border border-[rgba(255,255,255,0.08)]">
                    {order.specifications.notes}
                  </p>
                </div>
              )}
              {order.comments && (
                <div className="p-3 bg-[rgba(251,191,36,0.05)] border border-[rgba(251,191,36,0.2)] rounded-lg">
                  <p className="text-xs text-[#FCD34D] font-medium mb-0.5">Comentarios de Rediseño (Cliente)</p>
                  <p className="text-sm text-white">{order.comments}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Status (RF14 & RF15) */}
          <Card hover>
            <CardHeader>
              <CardTitle>Estado Financiero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#A0A0A0]">Precio Acordado</span>
                <span className="text-white font-semibold">{formatCurrency(order.totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#A0A0A0]">Seña Registrada (50%)</span>
                <span className="text-[#4ADE80] font-medium">{formatCurrency(order.depositPaid)}</span>
              </div>
              <div className="flex justify-between text-sm pt-3 border-t border-[rgba(255,255,255,0.08)]">
                <span className="text-white font-medium">Saldo Restante</span>
                <span className={`text-lg font-bold ${order.remainingBalance > 0 ? "text-[#FF1744]" : "text-[#4ADE80]"}`}>
                  {formatCurrency(order.remainingBalance)}
                </span>
              </div>

              {/* Seña Payment Form */}
              {order.status === 'pending_deposit' && (
                <form onSubmit={(e) => handlePaymentSubmit(e, 'deposit')} className="pt-4 border-t border-[rgba(255,255,255,0.08)] space-y-3">
                  <div className="p-3 bg-[#151515] rounded-xl border border-[rgba(255,23,68,0.2)] text-xs space-y-1.5">
                    <p className="font-semibold text-white">Información de Transferencia para Seña (50%):</p>
                    <p className="text-[#A0A0A0]">Alias de Pago: <span className="text-white font-bold">j3d.impresiones.mp</span></p>
                    <p className="text-[#A0A0A0]">CBU: <span className="text-white">0000003100012345678901</span></p>
                    <p className="text-[#A0A0A0]">Banco: <span className="text-white">Mercado Pago</span></p>
                    <p className="text-[#A0A0A0] text-sm">Monto a Transferir: <span className="text-[#FF1744] font-bold">{formatCurrency(order.totalPrice * 0.5)}</span></p>
                  </div>
                  <div>
                    <label className="block text-xs text-[#A0A0A0] mb-1">Medio de Pago</label>
                    <div className="w-full text-xs bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded px-2.5 py-2 text-white">
                      Transferencia Bancaria
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[#A0A0A0] mb-1">Subir Comprobante</label>
                    <div className="relative border border-dashed border-[rgba(255,255,255,0.08)] hover:border-[#FF1744] p-3 text-center cursor-pointer rounded-lg text-xs">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => e.target.files && setReceiptName(e.target.files[0].name)}
                      />
                      <span>{receiptName ? `Seleccionado: ${receiptName}` : "Haga clic para seleccionar archivo..."}</span>
                    </div>
                  </div>
                  <Button type="submit" variant="primary" size="sm" className="w-full">
                    Enviar Comprobante de Seña
                  </Button>
                </form>
              )}

              {/* Saldo Payment Form */}
              {order.status === 'finished' && (
                <form onSubmit={(e) => handlePaymentSubmit(e, 'final')} className="pt-4 border-t border-[rgba(255,255,255,0.08)] space-y-3">
                  <div className="p-3 bg-[#151515] rounded-xl border border-[rgba(255,23,68,0.2)] text-xs space-y-1.5">
                    <p className="font-semibold text-white">Información de Transferencia para Saldo Restante (50%):</p>
                    <p className="text-[#A0A0A0]">Alias de Pago: <span className="text-white font-bold">j3d.impresiones.mp</span></p>
                    <p className="text-[#A0A0A0]">CBU: <span className="text-white">0000003100012345678901</span></p>
                    <p className="text-[#A0A0A0]">Banco: <span className="text-white">Mercado Pago</span></p>
                    <p className="text-[#A0A0A0] text-sm">Monto a Transferir: <span className="text-[#FF1744] font-bold">{formatCurrency(order.remainingBalance)}</span></p>
                  </div>
                  <div>
                    <label className="block text-xs text-[#A0A0A0] mb-1">Medio de Pago</label>
                    <div className="w-full text-xs bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded px-2.5 py-2 text-white">
                      Transferencia Bancaria
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[#A0A0A0] mb-1">Subir Comprobante</label>
                    <div className="relative border border-dashed border-[rgba(255,255,255,0.08)] hover:border-[#FF1744] p-3 text-center cursor-pointer rounded-lg text-xs">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => e.target.files && setReceiptName(e.target.files[0].name)}
                      />
                      <span>{receiptName ? `Seleccionado: ${receiptName}` : "Haga clic para seleccionar archivo..."}</span>
                    </div>
                  </div>
                  <Button type="submit" variant="primary" size="sm" className="w-full">
                    Enviar Comprobante de Saldo
                  </Button>
                </form>
              )}

              {/* Pending Verifications */}
              {order.status === 'deposit_verification' && (
                <div className="p-3 bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.2)] rounded-lg text-center">
                  <p className="text-xs text-[#FCD34D] font-medium">
                    Seña Pendiente de Verificación
                  </p>
                  <p className="text-[10px] text-[#A0A0A0] mt-1">
                    Comprobante de seña enviado. El operador lo verificará a la brevedad para dar inicio a la producción.
                  </p>
                </div>
              )}

              {order.status === 'balance_verification' && (
                <div className="p-3 bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.2)] rounded-lg text-center">
                  <p className="text-xs text-[#FCD34D] font-medium">
                    Saldo Pendiente de Verificación
                  </p>
                  <p className="text-[10px] text-[#A0A0A0] mt-1">
                    Comprobante de saldo enviado. El operador lo verificará a la brevedad para proceder con la entrega del pedido.
                  </p>
                </div>
              )}

              {order.paymentStatus === 'completed' && (
                <div className="p-3 bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.2)] rounded-lg text-center">
                  <p className="text-xs text-[#4ADE80] font-medium">
                    Pago Total Completado
                  </p>
                  <p className="text-[10px] text-[#A0A0A0] mt-1">
                    Todos los pagos de este pedido han sido verificados y aprobados.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal: Cancelación (RF07) */}
        <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="Cancelar Pedido">
          <form onSubmit={handleCancelOrder} className="space-y-4">
            {order.depositPaid > 0 && (
              <div className="p-3 bg-[rgba(255,23,68,0.1)] border border-[rgba(255,23,68,0.2)] rounded-xl text-center">
                <p className="text-sm text-[#FF1744] font-semibold">
                  La seña no posee devolución.
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Indique el motivo de la cancelación *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Escriba la razón de cancelación del pedido..."
                className="w-full px-4 py-2.5 bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#FF1744]/50 h-28"
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsCancelModalOpen(false)}>
                Atrás
              </Button>
              <Button type="submit" variant="primary" className="bg-[#FF1744] hover:bg-[#D50032]">
                Confirmar Cancelación
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Rechazar Cotización (RF13) */}
        <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Rechazar Presupuesto">
          <form onSubmit={handleRejectQuoteSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Indique el motivo del rechazo *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Escriba la razón para rechazar este presupuesto..."
                className="w-full px-4 py-2.5 bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#FF1744]/50 h-28"
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsRejectModalOpen(false)}>
                Atrás
              </Button>
              <Button type="submit" variant="primary" className="bg-[#FF1744] hover:bg-[#D50032]">
                Confirmar Rechazo (Cancelar)
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Pedir Rediseño (RF12) */}
        <Modal isOpen={isRedesignModalOpen} onClose={() => setIsRedesignModalOpen(false)} title="Solicitar Cambios en Presupuesto">
          <form onSubmit={handleRedesignSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Describa los cambios o ajustes solicitados *
              </label>
              <textarea
                value={redesignComments}
                onChange={(e) => setRedesignComments(e.target.value)}
                placeholder="Ejemplo: Cambiar material a ABS negro, aumentar espesor, etc."
                className="w-full px-4 py-2.5 bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#FF1744]/50 h-28"
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsRedesignModalOpen(false)}>
                Atrás
              </Button>
              <Button type="submit" variant="primary">
                Enviar Solicitud
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Ficha Técnica Exportable (PDF / Documento Oficial) */}
        {isFichaModalOpen && quotation && (
          <Modal isOpen={isFichaModalOpen} onClose={() => setIsFichaModalOpen(false)} title="Documento Oficial de Presupuesto">
            <style dangerouslySetInnerHTML={{__html: `
              .budget-document-section {
                padding: 40px 10px;
                background: #050510;
                border-radius: 16px;
                overflow: hidden;
              }
              .budget-container {
                max-width: 700px;
                margin: auto;
              }
              .budget-header {
                text-align: center;
                margin-bottom: 30px;
              }
              .budget-badge {
                display: inline-block;
                padding: 6px 14px;
                border-radius: 999px;
                background: rgba(255, 0, 80, .1);
                color: #ff3366;
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 1px;
                text-transform: uppercase;
              }
              .budget-header h1 {
                margin-top: 15px;
                font-size: 2.2rem;
                font-weight: 800;
                color: white;
                line-height: 1.2;
              }
              .budget-header h1 span {
                display: block;
                color: #ff1f4d;
              }
              .budget-header p {
                color: #8f94aa;
                max-width: 500px;
                margin: 10px auto 0;
                font-size: 0.85rem;
              }
              .budget-card {
                background: #10101d;
                border: 1px solid rgba(255,255,255,.08);
                border-radius: 20px;
                padding: 25px;
                box-shadow: 0 0 20px rgba(255,0,80,.1);
              }
              .budget-info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 25px;
              }
              .info-item {
                background: #171727;
                padding: 14px;
                border-radius: 10px;
              }
              .info-item label {
                display: block;
                color: #8f94aa;
                font-size: .75rem;
                margin-bottom: 4px;
              }
              .info-item span {
                color: white;
                font-weight: 600;
                font-size: 0.9rem;
              }
              .financial-breakdown {
                margin-top: 15px;
              }
              .financial-breakdown h3 {
                color: white;
                margin-bottom: 15px;
                font-size: 1.1rem;
              }
              .cost-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid rgba(255,255,255,.05);
                font-size: 0.85rem;
              }
              .cost-row span {
                color: #aeb3c7;
              }
              .cost-row strong {
                color: white;
              }
              .cost-row.total {
                margin-top: 10px;
                font-size: 1.1rem;
                font-weight: bold;
              }
              .cost-row.total strong {
                color: #ff3366;
              }
              .budget-actions {
                display: flex;
                gap: 10px;
                margin-top: 25px;
              }
              .btn-primary, .btn-secondary {
                flex: 1;
                border: none;
                padding: 12px 20px;
                border-radius: 10px;
                cursor: pointer;
                font-weight: 600;
                transition: .3s;
                font-size: 0.85rem;
                text-align: center;
              }
              .btn-primary {
                background: linear-gradient(135deg, #ff004c, #8b3dff);
                color: white;
              }
              .btn-primary:hover {
                transform: translateY(-2px);
              }
              .btn-secondary {
                background: #1b1b2e;
                color: white;
                border: 1px solid rgba(255,255,255,.1);
              }
              @media print {
                body * {
                  visibility: hidden;
                }
                .budget-print-area, .budget-print-area * {
                  visibility: visible;
                }
                .budget-print-area {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  background: white !important;
                  color: black !important;
                }
                .budget-print-area * {
                  color: black !important;
                }
                .budget-card {
                  border: 1px solid #ddd;
                  box-shadow: none;
                  background: white !important;
                }
                .info-item {
                  background: #f5f5f5 !important;
                  border: 1px solid #ddd;
                }
                .budget-badge {
                  border: 1px solid black;
                  background: none;
                }
                .budget-actions {
                  display: none;
                }
              }
            `}} />
            <div className="budget-print-area budget-document-section">
              <div className="budget-container">
                <div className="budget-header">
                  <span className="budget-badge">📄 DOCUMENTO OFICIAL</span>
                  <h1>PRESUPUESTO<span>J3D IMPRESIONES</span></h1>
                  <p>Documento formal generado automáticamente con todos los datos técnicos y financieros del proyecto.</p>
                </div>

                <div className="budget-card">
                  <div className="budget-info-grid">
                    <div className="info-item">
                      <label>ID Presupuesto</label>
                      <span>#PR-{quotation.id}</span>
                    </div>
                    <div className="info-item">
                      <label>ID Pedido</label>
                      <span>#{order.id}</span>
                    </div>
                    <div className="info-item">
                      <label>Fecha de emisión</label>
                      <span>{new Date(quotation.createdAt).toLocaleDateString('es-AR')}</span>
                    </div>
                    <div className="info-item">
                      <label>Válido hasta</label>
                      <span>{new Date(quotation.validUntil).toLocaleDateString('es-AR')}</span>
                    </div>
                    <div className="info-item">
                      <label>Peso estimado</label>
                      <span>{quotation.weight} g</span>
                    </div>
                    <div className="info-item">
                      <label>Plazo de producción</label>
                      <span>{estimatedDays} días</span>
                    </div>
                  </div>

                  <div className="financial-breakdown">
                    <h3>Desglose Financiero</h3>
                    
                    <div className="cost-row">
                      <span>Material ({order.specifications?.material || 'PLA'})</span>
                      <strong>{formatCurrency(quotation.materialCost)}</strong>
                    </div>

                    <div className="cost-row">
                      <span>Tiempo de impresión y Energía</span>
                      <strong>{formatCurrency(quotation.electricityCost + quotation.machineWearCost)}</strong>
                    </div>

                    <div className="cost-row">
                      <span>Mano de Obra</span>
                      <strong>{formatCurrency(quotation.laborCost)}</strong>
                    </div>

                    <div className="cost-row total">
                      <span>Total</span>
                      <strong>{formatCurrency(quotation.finalPrice)}</strong>
                    </div>
                  </div>

                  <div className="budget-actions">
                    <button className="btn-secondary" onClick={() => window.print()}>
                      👁️ Vista previa / Imprimir
                    </button>
                    <button className="btn-primary" onClick={handleDownloadPDF}>
                      ⬇ Descargar PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}

