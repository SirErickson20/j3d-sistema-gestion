// J3D System Types

export type UserRole = 'client' | 'operator';

export type OrderStatus =
  | 'pending_quotation' // Pendiente de Presupuesto
  | 'quotation_sent'    // Presupuesto Enviado
  | 'pending_approval'  // En Rediseño
  | 'pending_deposit'   // Pendiente de Seña
  | 'deposit_verification' // Seña Pendiente de Verificación
  | 'in_production'     // En Producción
  | 'pending_balance'   // Pendiente de Saldo
  | 'finished'          // Finalizado
  | 'balance_verification' // Saldo Pendiente de Verificación
  | 'delivered'         // Entregado
  | 'cancelled';        // Cancelado

export type PaymentStatus = 'pending' | 'partial' | 'completed' | 'invalidated';
export type PaymentValidationStatus = 'pending_validation' | 'validated' | 'invalidated';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  image: string;
  printTime: number; // hours
  material: string;
}

export interface Material {
  id: string;
  name: string;
  type: string;
  costPerGram: number;
  colors: string[];
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  updatedByRole: UserRole;
}

export interface CancellationInfo {
  reason: string;
  date: string;
  cancelledByRole: UserRole;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  productId?: string;
  productName: string;
  quantity: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalPrice: number;
  depositPaid: number;
  remainingBalance: number;
  estimatedDelivery: string;
  createdAt: string;
  updatedAt: string;
  priority: 'low' | 'medium' | 'high';
  deliveryMethod: 'delivery' | 'pickup';
  deliveryAddress?: string;
  specifications?: {
    material?: string;
    color?: string;
    dimensions?: string;
    notes?: string;
    pieceType?: string; // for custom orders
  };
  files: string[]; // simulation of attached images/files
  statusHistory: StatusHistoryEntry[];
  cancellation?: CancellationInfo;
  comments?: string; // change request comments
}

export interface Quotation {
  id: string;
  orderId: string;
  materialCost: number;
  printTime: number; // hours
  electricityCost: number;
  laborCost: number;
  machineWearCost: number;
  totalCost: number;
  margin: number; // margin percentage
  finalPrice: number;
  weight: number; // grams
  estimatedDelivery: string;
  prototypeUrl?: string; // 3D viewer or render simulation
  createdAt: string;
  approved: boolean | null;
  // RF10 Prototypes
  renderUrl?: string;
  imageUrl?: string;
  model3DUrl?: string;
  attachments?: { name: string; dataUrl: string; type: string }[]; // operator files sent with quotation
  validUntil: string; // 7 days validity
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  type: 'seña' | 'saldo';
  date: string;
  method: string;
  status: PaymentValidationStatus;
  receiptUrl?: string; // proof file path/url
}

export interface ProductionTask {
  id: string;
  orderId: string;
  title: string;
  status: OrderStatus;
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate: string;
}

