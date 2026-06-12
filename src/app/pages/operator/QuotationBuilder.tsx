import { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
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
  Package,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { materials } from '../../data/mockData';
import { formatCurrency, formatDate } from '../../lib/utils';
import { toast } from 'sonner';

// ── Default cost rates ────────────────────────────────────────────────────────
const DEFAULT_RATES = {
  electricityPerHour: 250,
  laborPerHour: 1000,
  machineWearPerHour: 375,
};

// Default material costs per gram (matches mockData)
const DEFAULT_MATERIAL_COSTS: Record<string, number> = Object.fromEntries(
  materials.map((m) => [m.id, m.costPerGram])
);

function loadRates() {
  try {
    const stored = localStorage.getItem('j3d_cost_rates');
    if (stored) return { ...DEFAULT_RATES, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return { ...DEFAULT_RATES };
}

function loadMaterialCosts(): Record<string, number> {
  try {
    const stored = localStorage.getItem('j3d_material_costs');
    if (stored) return { ...DEFAULT_MATERIAL_COSTS, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return { ...DEFAULT_MATERIAL_COSTS };
}

export function QuotationBuilder() {
  const { orders, createQuotation, currentUser } = useApp();

  // Filter orders that need a quotation or are in redesign
  const pendingOrders = orders.filter(
    (o) => o.status === 'pending_quotation' || o.status === 'pending_approval'
  );

  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [weight, setWeight] = useState(150);
  const [inputHours, setInputHours] = useState(8);
  const [inputMinutes, setInputMinutes] = useState(0);
  const [material, setMaterial] = useState('PLA');
  const [margin, setMargin] = useState(40);

  // RF09 Manual Adjustments
  const [customPrice, setCustomPrice] = useState<string>('');
  const [customDate, setCustomDate] = useState<string>('');

  // RF10 Prototypes / Attachments
  const [attachments, setAttachments] = useState<{ name: string; dataUrl: string; type: string }[]>([]);

  // ── Configurable cost rates (persisted in localStorage) ──────────────────
  const [showRates, setShowRates] = useState(false);
  const saved = loadRates();
  const [rateElectricity, setRateElectricity] = useState(saved.electricityPerHour);
  const [rateLabor, setRateLabor] = useState(saved.laborPerHour);
  const [rateMachineWear, setRateMachineWear] = useState(saved.machineWearPerHour);

  // ── Configurable material costs (persisted in localStorage) ───────────────
  const savedMats = loadMaterialCosts();
  const [materialCosts, setMaterialCosts] = useState<Record<string, number>>(savedMats);

  const handleSaveRates = () => {
    localStorage.setItem('j3d_cost_rates', JSON.stringify({
      electricityPerHour: rateElectricity,
      laborPerHour: rateLabor,
      machineWearPerHour: rateMachineWear,
    }));
    localStorage.setItem('j3d_material_costs', JSON.stringify(materialCosts));
    toast.success('Tarifas y costos guardados correctamente.');
  };

  const handleResetRates = () => {
    setRateElectricity(DEFAULT_RATES.electricityPerHour);
    setRateLabor(DEFAULT_RATES.laborPerHour);
    setRateMachineWear(DEFAULT_RATES.machineWearPerHour);
    setMaterialCosts({ ...DEFAULT_MATERIAL_COSTS });
    localStorage.removeItem('j3d_cost_rates');
    localStorage.removeItem('j3d_material_costs');
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

  // Cost calculations (RF08) — using configurable rates
  const printTime = inputHours + inputMinutes / 60;
  const estimatedHours = printTime * 1.8; // +80% margin RF09
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

  const materialCostPerGram = (materialCosts[materials.find(m => m.name === material)?.id || ''] ?? materials.find((m) => m.name === material)?.costPerGram ?? 0.05);
  const materialCost    = weight * materialCostPerGram;
  const electricityCost = estimatedHours * rateElectricity;
  const laborCost       = estimatedHours * rateLabor;
  const machineWearCost = estimatedHours * rateMachineWear;
  const totalCost       = materialCost + electricityCost + laborCost + machineWearCost;

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
  };

  return (
    <DashboardLayout userName={currentUser?.name || 'Operador'} userRole="operator">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2"><br />Constructor de Cotizaciones</h1>
          <p className="text-[#A0A0A0]">Calcula y emite presupuestos en tiempo real (RF08–RF10)</p>
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
                  Electricidad: {formatCurrency(rateElectricity)}/h · Mano de obra: {formatCurrency(rateLabor)}/h · Desgaste: {formatCurrency(rateMachineWear)}/h
                </p>
              </div>
            </div>
            {showRates
              ? <ChevronUp className="w-4 h-4 text-[#A0A0A0]" />
              : <ChevronDown className="w-4 h-4 text-[#A0A0A0]" />}
          </button>

          {showRates && (
            <div className="px-6 pb-6 border-t border-[rgba(255,255,255,0.06)]">
              <p className="text-xs text-[#A0A0A0] mt-4 mb-4">
                Definí las tarifas por hora que el sistema usará para calcular el costo de cada cotización.
                Los cambios se aplican inmediatamente y se guardan en este dispositivo.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {/* Electricity */}
                <div className="p-4 bg-[#151515] rounded-xl border border-[rgba(255,255,255,0.08)] space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">⚡</span>
                    <label className="text-xs font-semibold text-[#FCD34D] uppercase tracking-wider">Electricidad</label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#A0A0A0]">$</span>
                    <input
                      type="number"
                      min="0"
                      value={rateElectricity}
                      onChange={(e) => setRateElectricity(Number(e.target.value))}
                      className="w-full pl-7 pr-12 py-2 bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FCD34D]/30"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#A0A0A0]">/h</span>
                  </div>
                  <p className="text-[10px] text-[#666]">Costo de energía por hora de impresión estimada</p>
                </div>

                {/* Labor */}
                <div className="p-4 bg-[#151515] rounded-xl border border-[rgba(255,255,255,0.08)] space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">👷</span>
                    <label className="text-xs font-semibold text-[#60A5FA] uppercase tracking-wider">Mano de Obra</label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#A0A0A0]">$</span>
                    <input
                      type="number"
                      min="0"
                      value={rateLabor}
                      onChange={(e) => setRateLabor(Number(e.target.value))}
                      className="w-full pl-7 pr-12 py-2 bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/30"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#A0A0A0]">/h</span>
                  </div>
                  <p className="text-[10px] text-[#666]">Costo de mano de obra por hora estimada</p>
                </div>

                {/* Machine wear */}
                <div className="p-4 bg-[#151515] rounded-xl border border-[rgba(255,255,255,0.08)] space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">⚙️</span>
                    <label className="text-xs font-semibold text-[#34D399] uppercase tracking-wider">Desgaste Máquina</label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#A0A0A0]">$</span>
                    <input
                      type="number"
                      min="0"
                      value={rateMachineWear}
                      onChange={(e) => setRateMachineWear(Number(e.target.value))}
                      className="w-full pl-7 pr-12 py-2 bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#34D399]/30"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#A0A0A0]">/h</span>
                  </div>
                  <p className="text-[10px] text-[#666]">Amortización y mantenimiento por hora estimada</p>
                </div>
              </div>

              {/* Materials section */}
              <div className="mt-6 pt-5 border-t border-[rgba(255,255,255,0.06)]">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-[#A78BFA]" />
                  <p className="text-xs font-semibold text-[#A78BFA] uppercase tracking-wider">Costo de Materiales ($/kg)</p>
                </div>
                <p className="text-[11px] text-[#A0A0A0] mb-4">Definí el precio por kilogramo de cada material. El sistema convierte automáticamente a costo por gramo.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {materials.map((mat) => (
                    <div key={mat.id} className="p-3 bg-[#151515] rounded-xl border border-[rgba(255,255,255,0.08)] space-y-2">
                      <label className="text-xs font-semibold text-white block">{mat.name}</label>
                      <p className="text-[10px] text-[#666]">{mat.type}</p>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#A0A0A0]">$</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={Math.round((materialCosts[mat.id] ?? mat.costPerGram) * 1000)}
                          onChange={(e) => {
                            const kgPrice = Number(e.target.value);
                            setMaterialCosts(prev => ({ ...prev, [mat.id]: kgPrice / 1000 }));
                          }}
                          className="w-full pl-6 pr-9 py-1.5 bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#A78BFA]/40"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#666]">/kg</span>
                      </div>
                      <p className="text-[9px] text-[#555]">
                        = ${((materialCosts[mat.id] ?? mat.costPerGram)).toFixed(4)}/g
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-[rgba(255,255,255,0.03)] rounded-xl border border-[rgba(255,255,255,0.06)] flex flex-wrap gap-4 text-xs text-[#A0A0A0] mb-4">
                <span>Costo total por hora estimada:</span>
                <span className="text-white font-semibold">
                  {formatCurrency(rateElectricity + rateLabor + rateMachineWear)}/h
                </span>
                <span className="text-[#666]">· Los costos de material se calculan por gramo según el tipo seleccionado</span>
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

              {/* 2. Quotation parameters */}
              <Card hover>
                <CardHeader>
                  <CardTitle>2. Parámetros de Cotización (RF08 - RF09)</CardTitle>
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
                        * Horas estimadas (+80% margen RF09): {formatHoursAndMinutes(estimatedHours)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-1">Material</label>
                      <Select value={material} onChange={(e) => setMaterial(e.target.value)}>
                        {materials.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name} - {formatCurrency(Math.round((materialCosts[m.id] ?? m.costPerGram) * 1000))}/kg
                          </option>
                        ))}
                      </Select>
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
                        Ajuste de Precio Final (Opcional - RF09)
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
                        Fecha Estimada de Entrega (Opcional - RF09)
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

              {/* 3. RF10 Attachments */}
              <Card hover>
                <CardHeader>
                  <CardTitle>3. Adjuntar Archivos para el Cliente (RF10)</CardTitle>
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
                  <CardTitle>Desglose de Costos (RF08)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[#A0A0A0]">Material ({material})</span>
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
                      Enviar Cotización al Cliente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
