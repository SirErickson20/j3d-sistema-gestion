import { useState, useMemo } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { KPICard } from '../../components/ui/KPICard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { OrderStatusBadge } from '../../components/ui/Badge';
import {
  ShoppingCart,
  DollarSign,
  Package,
  Clock,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export function OperatorDashboard() {
  const { orders, currentUser } = useApp();

  // Filters State
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 1. Filter orders based on Year, Month, and Date Range
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      const year = orderDate.getFullYear().toString();
      const month = orderDate.getMonth().toString(); // 0-indexed

      // Year Filter
      if (filterYear !== 'all' && year !== filterYear) return false;

      // Month Filter
      if (filterMonth !== 'all' && month !== filterMonth) return false;

      // Date Range Filter
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (orderDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (orderDate > end) return false;
      }

      return true;
    });
  }, [orders, filterYear, filterMonth, startDate, endDate]);

  // 2. Dynamic KPI Calculations
  const totalOrdersCount = filteredOrders.length;
  
  const inProductionCount = filteredOrders.filter(
    (o) => o.status === 'in_production'
  ).length;

  const totalBilling = filteredOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const pendingQuotationsCount = filteredOrders.filter(
    (o) => o.status === 'pending_quotation' || o.status === 'quotation_sent'
  ).length;

  // 3. Dynamic Monthly Chart Data (grouped by month of current year or selected year)
  const monthlyRevenueData = useMemo(() => {
    const monthsNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlySum = Array(12).fill(0);
    const monthlyCount = Array(12).fill(0);

    filteredOrders.forEach((o) => {
      if (o.status === 'cancelled') return;
      const m = new Date(o.createdAt).getMonth();
      monthlySum[m] += o.totalPrice;
      monthlyCount[m] += 1;
    });

    return monthsNames.map((name, i) => ({
      month: name,
      revenue: monthlySum[i],
      orders: monthlyCount[i],
    })).filter((d, idx) => d.revenue > 0 || d.orders > 0 || idx <= new Date().getMonth()); // show months up to current
  }, [filteredOrders]);

  // 4. Custom vs Catalog order split
  const orderTypeSplitData = useMemo(() => {
    let custom = 0;
    let catalog = 0;
    filteredOrders.forEach((o) => {
      if (o.id.startsWith('ORD-CUST')) custom += 1;
      else catalog += 1;
    });
    const result = [];
    if (custom > 0) result.push({ name: 'Producto Personalizado', value: custom });
    if (catalog > 0) result.push({ name: 'Producto de Catálogo', value: catalog });
    return result;
  }, [filteredOrders]);

  const TYPE_COLORS = ['#FF1744', '#60A5FA'];

  const years = ['all', '2026', '2025'];
  const months = [
    { value: 'all', label: 'Todos los Meses' },
    { value: '0', label: 'Enero' },
    { value: '1', label: 'Febrero' },
    { value: '2', label: 'Marzo' },
    { value: '3', label: 'Abril' },
    { value: '4', label: 'Mayo' },
    { value: '5', label: 'Junio' },
    { value: '6', label: 'Julio' },
    { value: '7', label: 'Agosto' },
    { value: '8', label: 'Septiembre' },
    { value: '9', label: 'Octubre' },
    { value: '10', label: 'Noviembre' },
    { value: '11', label: 'Diciembre' },
  ];

  return (
    <DashboardLayout userName={currentUser?.name || 'Operador'} userRole="operator">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2"><br />Panel de Control y Reportes</h1>
            <p className="text-[#A0A0A0]">
              Visualiza estadísticas de facturación y producción con filtros avanzados
            </p>
          </div>
        </div>

        {/* Filters Panel */}
        <Card>
          <div className="p-4 bg-[#151515] rounded-xl border border-[rgba(255,255,255,0.08)]">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#FF1744]" />
              Filtros de Reporte
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-[#A0A0A0] mb-1 font-medium">Año</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FF1744]"
                >
                  <option value="all">Todos los Años</option>
                  {years.filter(y => y !== 'all').map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#A0A0A0] mb-1 font-medium">Mes</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FF1744]"
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#A0A0A0] mb-1 font-medium">Fecha Inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FF1744]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#A0A0A0] mb-1 font-medium">Fecha Fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FF1744]"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Cantidad de Pedidos"
            value={totalOrdersCount}
            icon={<ShoppingCart />}
            variant="primary"
          />
          <KPICard
            title="Pedidos en Producción"
            value={inProductionCount}
            icon={<Package />}
          />
          <KPICard
            title="Facturación"
            value={formatCurrency(totalBilling)}
            icon={<DollarSign />}
          />
          <KPICard
            title="Cotizaciones Pendientes"
            value={pendingQuotationsCount}
            icon={<Clock />}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card hover>
            <CardHeader>
              <CardTitle>Ingresos por Mes (Facturación)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="month"
                    stroke="#A0A0A0"
                    tick={{ fill: '#A0A0A0' }}
                  />
                  <YAxis
                    stroke="#A0A0A0"
                    tick={{ fill: '#A0A0A0' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1C1C1C',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#FF1744"
                    strokeWidth={3}
                    dot={{ fill: '#FF1744', r: 5 }}
                    activeDot={{ r: 7, fill: '#FF1744' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Orders Chart */}
          <Card hover>
            <CardHeader>
              <CardTitle>Volumen de Pedidos por Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="month"
                    stroke="#A0A0A0"
                    tick={{ fill: '#A0A0A0' }}
                  />
                  <YAxis stroke="#A0A0A0" tick={{ fill: '#A0A0A0' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1C1C1C',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="orders" fill="#FF1744" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Type Split */}
          <Card hover>
            <CardHeader>
              <CardTitle>Pedidos por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              {orderTypeSplitData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={orderTypeSplitData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={75}
                        innerRadius={35}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {orderTypeSplitData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={TYPE_COLORS[index % TYPE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1C1C1C',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                        formatter={(value: number, name: string) => [`${value} pedido${value !== 1 ? 's' : ''}`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div className="flex justify-center gap-6 mt-2">
                    {orderTypeSplitData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ background: TYPE_COLORS[index % TYPE_COLORS.length] }} />
                        <span className="text-xs text-[#A0A0A0]">{entry.name}</span>
                        <span className="text-xs font-bold text-white">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-center text-xs text-[#A0A0A0] py-16">Sin datos para mostrar en este rango</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card hover className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Últimos Pedidos en este Filtro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-[#151515] rounded-xl border border-[rgba(255,255,255,0.08)] text-xs"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[rgba(255,23,68,0.1)] flex items-center justify-center">
                        <Package className="w-5 h-5 text-[#FF1744]" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">
                          {order.id} - {order.customerName}
                        </h4>
                        <p className="text-[#A0A0A0] text-[10px]">
                          {order.productName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">
                        {formatCurrency(order.totalPrice)}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
                {filteredOrders.length === 0 && (
                  <p className="text-center text-[#A0A0A0] py-8">Sin actividad en este filtro</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

