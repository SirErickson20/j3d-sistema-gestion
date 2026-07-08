import { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  Calculator,
  Settings,
  FileText,
  Send,
  Upload,
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { toast } from 'sonner';

// ── Default cost rates ────────────────────────────────────────────────────────
const DEFAULT_RATES = {
  electricityPerHour: 250,
  laborPerHour: 1000,
  machineWearPerHour: 375,
  productionPerMinute: 5,
  materialPerGram: 0.05,
};

function loadRates() {
  try {
    const stored = localStorage.getItem('j3d_cost_rates');
    if (stored) return { ...DEFAULT_RATES, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return { ...DEFAULT_RATES };
}

export function QuotationBuilder() {
  const { orders, createQuotation, currentUser } = useApp();

  // Filter orders that need a quotation or are in redesign
  const pendingOrders = orders.filter(
    (o) => o.status === 'pending_quotation' || o.status === 'pending_approval'
  );

  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const selectedOrder = pendingOrders.find(o => o.id === selectedOrderId);
  const [weight, setWeight] = useState(150);
  const [inputHours, setInputHours] = useState(8);
  const [inputMinutes, setInputMinutes] = useState(0);
  const [material, setMaterial] = useState('PLA');
  const [margin, setMargin] = useState(40);

  // Manual Adjustments
  const [customPrice, setCustomPrice] = useState<string>('');
  const [customDate, setCustomDate] = useState<string>('');

  // Prototypes / Attachments
  const [attachments, setAttachments] = useState<{ name: string; dataUrl: string; type: string }[]>([]);

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

  // ── Configurable cost rates (persisted in localStorage) ──────────────────
  const [showRates, setShowRates] = useState(false);
  const saved = loadRates();
  const [rateElectricity, setRateElectricity] = useState(saved.electricityPerHour);
  const [rateLabor, setRateLabor] = useState(saved.laborPerHour);
  const [rateMachineWear, setRateMachineWear] = useState(saved.machineWearPerHour);
  const [rateProductionPerMinute, setRateProductionPerMinute] = useState(saved.productionPerMinute);
  const [materialPricePerGram, setMaterialPricePerGram] = useState(saved.materialPerGram);

  const handleSaveRates = () => {
    localStorage.setItem('j3d_cost_rates', JSON.stringify({
      electricityPerHour: rateElectricity,
      laborPerHour: rateLabor,
      machineWearPerHour: rateMachineWear,
      productionPerMinute: rateProductionPerMinute,
      materialPerGram: materialPricePerGram,
    }));
    toast.success('Tarifas y costos guardados correctamente.');
  };

  const handleResetRates = () => {
    setRateElectricity(DEFAULT_RATES.electricityPerHour);
    setRateLabor(DEFAULT_RATES.laborPerHour);
    setRateMachineWear(DEFAULT_RATES.machineWearPerHour);
    setRateProductionPerMinute(DEFAULT_RATES.productionPerMinute);
    setMaterialPricePerGram(DEFAULT_RATES.materialPerGram);
    localStorage.removeItem('j3d_cost_rates');
    toast.info('Tarifas restablecidas a valores por defecto.');
  };

  // Pre-fill parameters if an order is selected
  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = pendingOrders.find(o => o.id === orderId);
    if (order) {
      if (order.specifications?.material) {
        setMaterial(order.specifications.material);
      }
      setWeight(150);
      setInputHours(8);
      setInputMinutes(0);
      setCustomPrice('');
      setCustomDate('');
      setAttachments([]);
      toast.info(`Pedido ${orderId} seleccionado. Configure cotización.`);
    }
  };

  // Cost calculations — using configurable rates
  const printTime = inputHours + inputMinutes / 60;
  const estimatedHours = printTime * 1.8; // +80% margin
  const estimatedDays = Math.ceil(estimatedHours / 8);

  const getSuggestedDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + estimatedDays);
    return d.toISOString().split('T')[0];
  };

  const formatHoursAndMinutes = (totalHours: number) => {
    const h = Math.floor(totalHours);
    const m = Math.round((totalHours - h) * 60);
    return `${h}h ${m}min`;
  };

  const materialCost      = weight * materialPricePerGram;
  const electricityCost   = estimatedHours * rateElectricity;
  const laborCost         = estimatedHours * rateLabor;
  const machineWearCost   = estimatedHours * rateMachineWear;
  const productionCost    = estimatedHours * 60 * rateProductionPerMinute;
  const totalCost         = materialCost + electricityCost + laborCost + machineWearCost + productionCost;

  const calculatedPrice = totalCost * (1 + margin / 100);
  const finalPrice = customPrice !== '' ? Number(customPrice) : calculatedPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      toast.error('Por favor, selecciona un pedido para cotizar.');
      return;
    }
    if (weight <= 0 || printTime <= 0) {
      toast.error('El peso y tiempo de impresión deben ser mayores a 0.');
      return;
    }

    triggerConfirm(
      'Enviar Cotización',
      `¿Desea confirmar el envío del presupuesto de ${formatCurrency(finalPrice)} para el pedido ${selectedOrderId}?`,
      () => {
        createQuotation(
          selectedOrderId,
          weight,
          printTime,
          material,
          margin,
          customPrice !== '' ? Number(customPrice) : undefined,
          customDate || getSuggestedDate(),
          undefined,
          undefined,
          undefined,
          attachments
        );

        toast.success(`Cotización enviada correctamente para el pedido ${selectedOrderId}`);

        setSelectedOrderId('');
        setWeight(150);
        setInputHours(8);
        setInputMinutes(0);
        setCustomPrice('');
        setCustomDate('');
        setAttachments([]);
      }
    );
  };

  return (
    <DashboardLayout userName={currentUser?.name || 'Operador'} userRole="operator">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2"><br />Configurar Cotización</h1>
        </div>

        {/* ── Configuración de Costos Fijos ─────────────────────────────── */}
        <Card hover>
          <button
            type="button"
            className="w-full flex items-center justify-between px-6 py-4 text-left"
            onClick={() => setShowRates(v => !v)}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[rgba(255,23,68,0.12)] rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-[#FF1744]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Configuración de Tarifas de Costo</p>
                <p className="text-[11px] text-[#A0A0A0]">
                  Electricidad: {formatCurrency(rateElectricity)}/h · Mano de obra: {formatCurrency(rateLabor)}/h · Desgaste: {formatCurrency(rateMachineWear)}/h · Producción: {formatCurrency(rateProductionPerMinute)}/min · Material: {formatCurrency(materialPricePerGram)}/g
                </p>
              </div>
            </div>
            {showRates
              ? <ChevronUp className="w-4 h-4 text-[#A0A0A0]" />
              : <ChevronDown className="w-4 h-4 text-[#A0A0A0]" />}
          </button>

          {showRates && (
            <div className="px-6 pb-6 border-t border-[rgba(255,255,255,0.06)]">
              <p className="text-xs text-[#A0A0A0] mt-4 mb-5">
                Definí las tarifas que el sistema usará para calcular el costo de cada cotización. Se guardan en este dispositivo.
              </p>

              {/* ── 5 tariff cards ── */}
              <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-5">

                {/* Electricity */}
                <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#151515] overflow-hidden">
                  <div className="h-1 w-full bg-[#FCD34D]" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⚡</span>
                      <span className="text-[10px] font-bold text-[#FCD34D] uppercase tracking-widest">Electricidad</span>
                    </div>
                    <p className="text-2xl font-bold text-white leading-none">{formatCurrency(rateElectricity)}<span className="text-xs font-normal text-[#A0A0A0] ml-1">/h</span></p>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#666]">$</span>
                      <input type="number" min="0" value={rateElectricity} onChange={(e) => setRateElectricity(Number(e.target.value))}
                        className="w-full pl-6 pr-8 py-1.5 bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FCD34D]/40" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#666]">/h</span>
                    </div>
                    <p className="text-[9px] text-[#555] leading-tight">Energía por hora de impresión estimada</p>
                  </div>
                </div>

                {/* Labor */}
                <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#151515] overflow-hidden">
                  <div className="h-1 w-full bg-[#60A5FA]" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">👷</span>
                      <span className="text-[10px] font-bold text-[#60A5FA] uppercase tracking-widest">Mano de Obra</span>
                    </div>
                    <p className="text-2xl font-bold text-white leading-none">{formatCurrency(rateLabor)}<span className="text-xs font-normal text-[#A0A0A0] ml-1">/h</span></p>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#666]">$</span>
                      <input type="number" min="0" value={rateLabor} onChange={(e) => setRateLabor(Number(e.target.value))}
                        className="w-full pl-6 pr-8 py-1.5 bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#60A5FA]/40" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#666]">/h</span>
                    </div>
                    <p className="text-[9px] text-[#555] leading-tight">Mano de obra por hora estimada</p>
                  </div>
                </div>

                {/* Machine wear */}
                <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#151515] overflow-hidden">
                  <div className="h-1 w-full bg-[#34D399]" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⚙️</span>
                      <span className="text-[10px] font-bold text-[#34D399] uppercase tracking-widest">Desgaste</span>
                    </div>
                    <p className="text-2xl font-bold text-white leading-none">{formatCurrency(rateMachineWear)}<span className="text-xs font-normal text-[#A0A0A0] ml-1">/h</span></p>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#666]">$</span>
                      <input type="number" min="0" value={rateMachineWear} onChange={(e) => setRateMachineWear(Number(e.target.value))}
                        className="w-full pl-6 pr-8 py-1.5 bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#34D399]/40" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#666]">/h</span>
                    </div>
                    <p className="text-[9px] text-[#555] leading-tight">Amortización y mantenimiento de máquina</p>
                  </div>
                </div>

                {/* Production per minute */}
                <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#151515] overflow-hidden">
                  <div className="h-1 w-full bg-[#F97316]" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🖨️</span>
                      <span className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest">Producción</span>
                    </div>
                    <p className="text-2xl font-bold text-white leading-none">{formatCurrency(rateProductionPerMinute)}<span className="text-xs font-normal text-[#A0A0A0] ml-1">/min</span></p>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#666]">$</span>
                      <input type="number" min="0" step="0.1" value={rateProductionPerMinute} onChange={(e) => setRateProductionPerMinute(Number(e.target.value))}
                        className="w-full pl-6 pr-10 py-1.5 bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#F97316]/40" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#666]">/min</span>
                    </div>
                    <p className="text-[9px] text-[#555] leading-tight">Costo por minuto de impresión estimada</p>
                  </div>
                </div>

                {/* Material per gram */}
                <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#151515] overflow-hidden">
                  <div className="h-1 w-full bg-[#A78BFA]" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🧱</span>
                      <span className="text-[10px] font-bold text-[#A78BFA] uppercase tracking-widest">Material</span>
                    </div>
                    <p className="text-2xl font-bold text-white leading-none">{formatCurrency(materialPricePerGram)}<span className="text-xs font-normal text-[#A0A0A0] ml-1">/g</span></p>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#666]">$</span>
                      <input type="number" min="0" step="0.001" value={materialPricePerGram} onChange={(e) => setMaterialPricePerGram(Number(e.target.value))}
                        className="w-full pl-6 pr-7 py-1.5 bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#A78BFA]/40" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#666]">/g</span>
                    </div>
                    <p className="text-[9px] text-[#555] leading-tight">≈ {formatCurrency(materialPricePerGram * 1000)}/kg</p>
                  </div>
                </div>

              </div>

              {/* Totals summary row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 bg-[rgba(255,255,255,0.03)] rounded-xl border border-[rgba(255,255,255,0.06)] text-xs mb-5">
                <div className="flex items-center gap-1.5 text-[#A0A0A0]">
                  <span>Costo horario operativo:</span>
                  <span className="text-white font-semibold">{formatCurrency(rateElectricity + rateLabor + rateMachineWear + rateProductionPerMinute * 60)}/h</span>
                </div>
                <div className="w-px h-4 bg-[rgba(255,255,255,0.1)] hidden sm:block" />
                <div className="flex items-center gap-1.5 text-[#A0A0A0]">
                  <span>Material:</span>
                  <span className="text-[#A78BFA] font-semibold">{formatCurrency(materialPricePerGram)}/g · {formatCurrency(materialPricePerGram * 1000)}/kg</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveRates}
                  className="flex items-center gap-2 px-4 py-2 bg-[#FF1744] hover:bg-[#D50032] text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Guardar Tarifas
                </button>
                <button
                  type="button"
                  onClick={handleResetRates}
                  className="flex items-center gap-2 px-4 py-2 bg-[#151515] hover:bg-[#1c1c28] text-[#A0A0A0] hover:text-white text-xs font-semibold rounded-lg border border-[rgba(255,255,255,0.08)] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restablecer
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Generar presupuesto</h1>
          
        </div>

        {/* ── Order Selector ──────────────────────────────────────────────── */}
        <Card hover>
          <CardHeader>
            <CardTitle>1. Seleccionar Pedido Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <select
                value={selectedOrderId}
                onChange={(e) => handleOrderSelect(e.target.value)}
                className="w-full appearance-none px-4 py-3 bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#FF1744]/50 cursor-pointer"
              >
                <option value="">-- Seleccionar un pedido pendiente de presupuesto --</option>
                {pendingOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} - {o.customerName} ({o.productName} | Cant: {o.quantity}) {o.status === 'pending_approval' ? '[En Rediseño]' : ''}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#A0A0A0] text-sm">▼</div>
            </div>
            {pendingOrders.length === 0 && (
              <p className="text-xs text-[#FCD34D] mt-2 italic">No hay pedidos pendientes de cotización en este momento.</p>
            )}
          </CardContent>
        </Card>

        {selectedOrderId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-2 space-y-6">

              {/* Selected Order Details */}
              {selectedOrder && (
                <Card hover>
                  <CardHeader>
                    <CardTitle>Detalles del Pedido Seleccionado</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-white">
                    <div className="grid grid-cols-2 gap-4 bg-[#151515] p-4 rounded-xl border border-[rgba(255,255,255,0.08)]">
                      <div>
                        <p className="text-xs text-[#A0A0A0]">Cliente</p>
                        <p className="font-semibold text-white">{selectedOrder.customerName}</p>
                        <p className="text-xs text-[#A0A0A0]">{selectedOrder.customerEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#A0A0A0]">Producto / Servicio</p>
                        <p className="font-semibold text-white">{selectedOrder.productName}</p>
                        <p className="text-xs text-[#A0A0A0]">Cantidad: {selectedOrder.quantity}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="font-semibold text-xs text-[#A0A0A0] uppercase tracking-wider">Especificaciones técnicas:</p>
                      <div className="p-3 bg-[#151515] rounded-xl border border-[rgba(255,255,255,0.08)] space-y-1.5 text-xs text-[#A0A0A0]">
                        {selectedOrder.specifications?.color && <p>Color: <span className="text-white">{selectedOrder.specifications.color}</span></p>}
                        {selectedOrder.specifications?.notes && <p>Notas: <span className="text-white">{selectedOrder.specifications.notes}</span></p>}
                        {selectedOrder.specifications?.pieceType && <p>Tipo de Pieza: <span className="text-white">{selectedOrder.specifications.pieceType}</span></p>}
                        {selectedOrder.deliveryMethod && <p>Método de Entrega: <span className="text-white">{selectedOrder.deliveryMethod === 'pickup' ? 'Retiro en Local' : 'Envío a Domicilio'}</span></p>}
                      </div>
                    </div>

                    {selectedOrder.comments && (
                      <div className="p-4 bg-[rgba(251,191,36,0.05)] border border-[rgba(251,191,36,0.2)] rounded-xl space-y-2">
                        <p className="font-semibold text-[#FCD34D] text-xs uppercase tracking-wider">Comentarios de Rediseño (Cliente):</p>
                        <p className="text-xs text-white bg-[#0B0B0B]/50 p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap leading-relaxed">
                          {selectedOrder.comments}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 2. Quotation parameters */}
              <Card hover>
                <CardHeader>
                  <CardTitle>2. Parámetros de Cotización</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        Peso Real del Modelo (gramos)
                      </label>
                      <Input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        Tiempo de Impresión Base
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <Input
                            type="number"
                            value={inputHours}
                            onChange={(e) => setInputHours(Math.max(0, parseInt(e.target.value) || 0))}
                            min="0"
                            required
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A0A0A0] pointer-events-none">h</span>
                        </div>
                        <div className="relative">
                          <Input
                            type="number"
                            value={inputMinutes}
                            onChange={(e) => setInputMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                            min="0"
                            max="59"
                            required
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A0A0A0] pointer-events-none">min</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-[#FCD34D] mt-1.5">
                        * Horas estimadas (+80% margen): {formatHoursAndMinutes(estimatedHours)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-1">Margen de Utilidad (%)</label>
                      <Input
                        type="number"
                        value={margin}
                        onChange={(e) => setMargin(Number(e.target.value))}
                        min="0"
                        max="500"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[rgba(255,255,255,0.08)] grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1">
                        Ajuste de Precio Final (Opcional)
                      </label>
                      <Input
                        type="number"
                        placeholder="Ej: 35000 (dejar vacío para usar costo calculado)"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1">
                        Fecha Estimada de Entrega (Opcional)
                      </label>
                      <Input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                      />
                      <p className="text-[10px] text-[#A0A0A0] mt-1">
                        * Opcional: Se calculará desde la seña del cliente. Estimado actual: {formatDate(getSuggestedDate())} ({estimatedDays} día(s) de producción)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 3. Attachments */}
              <Card hover>
                <CardHeader>
                  <CardTitle>3. Adjuntar Archivos para el Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative border-2 border-dashed border-[rgba(255,255,255,0.12)] hover:border-[#FF1744]/60 transition-colors rounded-xl p-6 text-center cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.stl,.obj"
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      onChange={(e) => {
                        if (!e.target.files) return;
                        const files = Array.from(e.target.files);
                        files.forEach((file) => {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setAttachments((prev) => [
                              ...prev,
                              { name: file.name, dataUrl: ev.target?.result as string, type: file.type }
                            ]);
                          };
                          reader.readAsDataURL(file);
                        });
                        e.target.value = '';
                      }}
                    />
                    <Upload className="w-8 h-8 mx-auto mb-2 text-[#A0A0A0]" />
                    <p className="text-sm text-[#A0A0A0]">Arrastrá o hacé clic para adjuntar archivos</p>
                    <p className="text-[10px] text-[#666] mt-1">Imágenes, PDF, STL, OBJ — múltiples archivos permitidos</p>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2.5 bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded-lg">
                          {att.type.startsWith('image/') ? (
                            <img src={att.dataUrl} alt={att.name} className="w-10 h-10 object-cover rounded-md border border-white/10 flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 bg-[#1c1c28] rounded-md border border-white/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-[#A0A0A0]" />
                            </div>
                          )}
                          <span className="text-xs text-white truncate flex-1">{att.name}</span>
                          <button
                            type="button"
                            onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-[#666] hover:text-[#FF1744] transition-colors text-lg leading-none flex-shrink-0"
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cost Breakdown */}
              <Card hover>
                <CardHeader>
                  <CardTitle>Desglose de Costos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[#A0A0A0]">Material ({weight}g)</span>
                        <span className="ml-2 text-[10px] text-[#A78BFA]">{formatCurrency(materialPricePerGram)}/g</span>
                      </div>
                      <span className="text-white">{formatCurrency(materialCost)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[#A0A0A0]">Electricidad ({formatHoursAndMinutes(estimatedHours)})</span>
                        <span className="ml-2 text-[10px] text-[#FCD34D]">{formatCurrency(rateElectricity)}/h</span>
                      </div>
                      <span className="text-white">{formatCurrency(electricityCost)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[#A0A0A0]">Mano de Obra ({formatHoursAndMinutes(estimatedHours)})</span>
                        <span className="ml-2 text-[10px] text-[#60A5FA]">{formatCurrency(rateLabor)}/h</span>
                      </div>
                      <span className="text-white">{formatCurrency(laborCost)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[#A0A0A0]">Desgaste Máquina ({formatHoursAndMinutes(estimatedHours)})</span>
                        <span className="ml-2 text-[10px] text-[#34D399]">{formatCurrency(rateMachineWear)}/h</span>
                      </div>
                      <span className="text-white">{formatCurrency(machineWearCost)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[#A0A0A0]">Producción ({Math.round(estimatedHours * 60)} min)</span>
                        <span className="ml-2 text-[10px] text-[#F97316]">{formatCurrency(rateProductionPerMinute)}/min</span>
                      </div>
                      <span className="text-white">{formatCurrency(productionCost)}</span>
                    </div>

                    <div className="pt-3 border-t border-[rgba(255,255,255,0.08)] flex justify-between font-semibold">
                      <span className="text-white">Costo Base Impresión</span>
                      <span className="text-white">{formatCurrency(totalCost)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Price Summary */}
            <div className="space-y-6">
              <Card
                glow
                className="bg-gradient-to-br from-[#FF1744] to-[#D50032] border-transparent sticky top-8"
              >
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center">
                      <Calculator className="w-8 h-8 text-white" />
                    </div>

                    <p className="text-white/80 text-sm mb-2">Precio Final Propuesto</p>
                    <p className="text-5xl font-bold text-white mb-6">
                      {formatCurrency(finalPrice)}
                    </p>

                    <div className="space-y-3 mb-6 text-sm">
                      <div className="flex justify-between text-white/80">
                        <span>Costo Base</span>
                        <span>{formatCurrency(totalCost)}</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Margen Aplicado</span>
                        <span>
                          {customPrice !== ''
                            ? 'Ajustado a mano'
                            : `${margin}% (+${formatCurrency(finalPrice - totalCost)})`}
                        </span>
                      </div>
                      <div className="flex justify-between text-white text-xs pt-2 border-t border-white/20">
                        <span>Fecha Entrega:</span>
                        <span className="font-semibold">{formatDate(customDate || getSuggestedDate())}</span>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      onClick={handleSubmit}
                      className="w-full bg-white text-[#FF1744] hover:bg-white/90 border-transparent shadow-lg"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Enviar Presupuesto al Cliente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
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
