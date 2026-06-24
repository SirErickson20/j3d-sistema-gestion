import { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { CreditCard, Download, Search, DollarSign } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate, generatePlaceholderReceipt, getExtensionFromDataUrl } from '../../lib/utils';
import { PaymentStatusBadge, PaymentValidationStatusBadge } from '../../components/ui/Badge';

export function OperatorFinances() {
  const { orders, payments, currentUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter orders by search query
  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate overall financial statistics
  const totalInvoiced = orders.reduce((sum, o) => sum + o.depositPaid, 0);
  const totalDeposits = payments
    .filter(p => p.status === 'validated' && p.type === 'seña')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalRemaining = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.remainingBalance, 0);

  return (
    <DashboardLayout userName={currentUser?.name || 'María García'} userRole="operator">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2"><br />Historial de Pagos</h1>
          <p className="text-[#A0A0A0]">Historial de facturación, señas y saldos de todos los pedidos</p>
        </div>

        {/* Financial KPI Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#A0A0A0] mb-1">Monto Total Facturado</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalInvoiced)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[rgba(255,23,68,0.1)] flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-[#FF1744]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#A0A0A0] mb-1">Total Señas Cobradas</p>
                  <p className="text-2xl font-bold text-[#4ADE80]">{formatCurrency(totalDeposits)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[rgba(74,222,128,0.1)] flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-[#4ADE80]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#A0A0A0] mb-1">Total Saldo Pendiente</p>
                  <p className="text-2xl font-bold text-[#FF1744]">{formatCurrency(totalRemaining)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[rgba(255,23,68,0.1)] flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-[#FF1744]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A0A0A0]" />
            <input
              type="text"
              placeholder="Buscar por pedido o cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded-xl text-white placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF1744]/50 focus:border-[#FF1744] transition-all"
            />
          </div>
        </Card>

        {/* History Table */}
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.08)]">
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#A0A0A0]">Pedido ID</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#A0A0A0]">Cliente</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#A0A0A0]">Monto Total</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#A0A0A0]">Seña (50%)</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#A0A0A0]">Saldo Restante</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#A0A0A0]">Estado Pago</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#A0A0A0]">Comprobantes</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#A0A0A0]">Fecha Modif.</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  // Find payments linked to this order
                  const orderPayments = payments.filter(p => p.orderId === order.id);

                  return (
                    <tr key={order.id} className="border-b border-[rgba(255,255,255,0.08)] hover:bg-[#151515] transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-white font-medium">{order.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium text-sm">{order.customerName}</p>
                          <p className="text-[#A0A0A0] text-xs">{order.customerEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-medium">{formatCurrency(order.totalPrice)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#4ADE80]">{formatCurrency(order.depositPaid)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={order.remainingBalance > 0 ? "text-[#FF1744]" : "text-[#A0A0A0]"}>
                          {formatCurrency(order.remainingBalance)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          {orderPayments.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {orderPayments.map((p) => {
                               const ext = getExtensionFromDataUrl(p.receiptUrl);
                               return (
                                 <div key={p.id} className="flex items-center justify-between gap-3 bg-[#1A1A1A] p-2 rounded-lg border border-[rgba(255,255,255,0.04)]">
                                   <a
                                     href={p.receiptUrl.startsWith('data:') ? p.receiptUrl : '#'}
                                     download={`comprobante_${p.type}_${order.id}.${ext}`}
                                     onClick={(e) => {
                                       if (!p.receiptUrl.startsWith('data:')) {
                                         e.preventDefault();
                                         const dataUrl = generatePlaceholderReceipt(order.id, p.type, p.amount, p.method, p.date, p.receiptUrl);
                                         const element = document.createElement('a');
                                         element.href = dataUrl;
                                         element.download = `comprobante_${p.type}_${order.id}.png`;
                                         document.body.appendChild(element);
                                         element.click();
                                         document.body.removeChild(element);
                                       }
                                     }}
                                     className="inline-flex items-center gap-1 text-xs text-[#FF1744] hover:underline cursor-pointer"
                                   >
                                     <Download className="w-3 h-3" />
                                     <span className="capitalize">{p.type}</span>
                                   </a>
                                   <PaymentValidationStatusBadge status={p.status} />
                                 </div>
                               );
                              })}
                            </div>
                           ) : (
                             <span className="text-xs text-[#A0A0A0] italic">Sin comprobantes</span>
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#A0A0A0]">
                        {formatDate(order.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-16">
              <p className="text-[#A0A0A0]">No se encontraron registros de facturación.</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
