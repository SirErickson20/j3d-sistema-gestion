import { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import {
  Calculator,
  Zap,
  Users,
  Settings,
  FileText,
  Send,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { materials } from '../../data/mockData';
import { formatCurrency, formatDate } from '../../lib/utils';
import { toast } from 'sonner';

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

  // RF10 Prototypes
  const [renderName, setRenderName] = useState('');
  const [imageName, setImageName] = useState('');
  const [model3DName, setModel3DName] = useState('');

  // Pre-fill parameters if an order is selected
  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = pendingOrders.find(o => o.id === orderId);
    if (order) {
      if (order.specifications?.material) {
        setMaterial(order.specifications.material);
      }
      setWeight(150); // reset to default, operator defines actual weight
      setInputHours(8);
      setInputMinutes(0);
      setCustomPrice('');
      setCustomDate('');
      toast.info(`Pedido ${orderId} seleccionado. Configure cotización.`);
    }
  };

  // Cost calculations (RF08)
  const printTime = inputHours + inputMinutes / 60;

  // RF09 - 80% printing hours margin calculation
  const estimatedHours = printTime * 1.8;
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

  const materialCostPerGram = materials.find((m) => m.name === material)?.costPerGram || 0.05;
  const materialCost = weight * materialCostPerGram;
  const electricityCost = estimatedHours * 250; // $250 per hour
  const laborCost = estimatedHours * 1000; // $1000 per hour
  const machineWearCost = estimatedHours * 375; // $375 per hour
  const totalCost = materialCost + electricityCost + laborCost + machineWearCost;

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

    // Call context to save quote and transition order status
    createQuotation(
      selectedOrderId,
      weight,
      printTime, // under the hood the context will save estimatedPrintHours = printTime * 1.8
      material,
      margin,
      customPrice !== '' ? Number(customPrice) : undefined,
      customDate || getSuggestedDate(),
      renderName || undefined,
      imageName || undefined,
      model3DName || undefined
    );

    toast.success(`Cotización enviada correctamente para el pedido ${selectedOrderId}`);
    
    // Reset state
    setSelectedOrderId('');
    setWeight(150);
    setInputHours(8);
    setInputMinutes(0);
    setCustomPrice('');
    setCustomDate('');
    setRenderName('');
    setImageName('');
    setModel3DName('');
  };

  return (
    <DashboardLayout userName={currentUser?.name || 'Operador'} userRole="operator">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Constructor de Cotizaciones
          </h1>
          <p className="text-[#A0A0A0]">
            Calcula y emite presupuestos en tiempo real (RF08–RF10)
          </p>
        </div>

        {/* Order Selector */}
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
                      <label className="block text-sm font-medium text-white mb-1">
                        Material
                      </label>
                      <Select
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                      >
                        {materials.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name} - {formatCurrency(m.costPerGram * 1000)}/kg
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        Margen de Utilidad (%)
                      </label>
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

              {/* RF10 Prototypes */}
              <Card hover>
                <CardHeader>
                  <CardTitle>3. Adjuntar Prototipos y Renders (RF10)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">Cargar Render</label>
                      <div className="border border-dashed border-[rgba(255,255,255,0.08)] hover:border-[#FF1744] p-3 text-center cursor-pointer rounded-lg text-[10px] relative">
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && setRenderName(e.target.files[0].name)} />
                        <Upload className="w-4 h-4 mx-auto mb-1 text-[#A0A0A0]" />
                        <span>Render prototipo</span>
                      </div>
                      {renderName && <span className="text-[10px] text-[#4ADE80] font-semibold">{renderName}</span>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">Cargar Imagen</label>
                      <div className="border border-dashed border-[rgba(255,255,255,0.08)] hover:border-[#FF1744] p-3 text-center cursor-pointer rounded-lg text-[10px] relative">
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && setImageName(e.target.files[0].name)} />
                        <Upload className="w-4 h-4 mx-auto mb-1 text-[#A0A0A0]" />
                        <span>Foto modelo</span>
                      </div>
                      {imageName && <span className="text-[10px] text-[#4ADE80] font-semibold">{imageName}</span>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">Cargar Modelo 3D</label>
                      <div className="border border-dashed border-[rgba(255,255,255,0.08)] hover:border-[#FF1744] p-3 text-center cursor-pointer rounded-lg text-[10px] relative">
                        <input type="file" accept=".stl,.obj" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && setModel3DName(e.target.files[0].name)} />
                        <Upload className="w-4 h-4 mx-auto mb-1 text-[#A0A0A0]" />
                        <span>Archivo 3D</span>
                      </div>
                      {model3DName && <span className="text-[10px] text-[#4ADE80] font-semibold">{model3DName}</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Breakdown */}
              <Card hover>
                <CardHeader>
                  <CardTitle>Desglose de Costos (RF08)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#A0A0A0]">Material ({material})</span>
                      <span className="text-white">{formatCurrency(materialCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A0A0A0]">Electricidad ({formatHoursAndMinutes(estimatedHours)})</span>
                      <span className="text-white">{formatCurrency(electricityCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A0A0A0]">Mano de Obra ({formatHoursAndMinutes(estimatedHours)})</span>
                      <span className="text-white">{formatCurrency(laborCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A0A0A0]">Desgaste Máquina ({formatHoursAndMinutes(estimatedHours)})</span>
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

