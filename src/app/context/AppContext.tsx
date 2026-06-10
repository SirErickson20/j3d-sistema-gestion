import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, Quotation, Payment, User, UserRole, OrderStatus, PaymentStatus } from '../types';
import { orders as mockOrders, quotations as mockQuotations, payments as mockPayments, currentUser as mockClient, operatorUser as mockOperator, products } from '../data/mockData';

interface AppContextType {
  currentUser: User | null;
  orders: Order[];
  quotations: Quotation[];
  payments: Payment[];
  loginAttempts: number;
  lockoutUntil: number | null;
  dbLoaded: boolean;
  login: (email: string, password: string, role: UserRole) => { success: boolean; error?: string };
  logout: () => void;
  createCatalogOrder: (productId: string, productName: string, quantity: number, material: string, color: string, deliveryMethod: 'delivery' | 'pickup', deliveryAddress: string, notes: string, clientName?: string, clientEmail?: string, clientPhone?: string) => Order;
  createCustomOrder: (pieceType: string, material: string, color: string, quantity: number, description: string, files: string[], clientName?: string, clientEmail?: string, clientPhone?: string) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, role: UserRole, reason?: string) => void;
  createQuotation: (orderId: string, weight: number, printTime: number, materialName: string, margin: number, customPrice?: number, customEstimatedDelivery?: string, renderUrl?: string, imageUrl?: string, model3DUrl?: string, attachments?: { name: string; dataUrl: string; type: string }[]) => Quotation;
  requestQuotationModifications: (orderId: string, comments: string) => void;
  acceptQuotation: (orderId: string) => void;
  rejectQuotation: (orderId: string, reason: string) => void;
  submitPaymentReceipt: (orderId: string, type: 'seña' | 'saldo', method: string, receiptUrl: string) => void;
  verifyPayment: (orderId: string, type: 'seña' | 'saldo', action: 'approve' | 'reject', reason?: string) => void;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

const dbName = 'j3d_db';
const storeName = 'j3d_store';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getVal = async (key: string): Promise<any> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error reading from IndexedDB:', err);
    return null;
  }
};

const setVal = async (key: string, val: any): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(val, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error writing to IndexedDB:', err);
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // One-time wipe of registered orders
  const shouldWipe = !localStorage.getItem('j3d_orders_wiped_v3');
  if (shouldWipe) {
    localStorage.removeItem('j3d_orders');
    localStorage.removeItem('j3d_quotations');
    localStorage.removeItem('j3d_payments');
  }

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('j3d_user');
    if (stored) return JSON.parse(stored);
    
    // Default route login flow requirement:
    // "Por defecto cualquier persona que ingrese al sistema debe ingresar como CLIENTE."
    // So if no user is saved, we automatically log in the mock Client!
    localStorage.setItem('j3d_user', JSON.stringify(mockClient));
    return mockClient;
  });

  const [dbLoaded, setDbLoaded] = useState(false);

  const [orders, setOrders] = useState<Order[]>(() => {
    const stored = localStorage.getItem('j3d_orders');
    if (stored) return JSON.parse(stored);
    return [];
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const stored = localStorage.getItem('j3d_quotations');
    if (stored) return JSON.parse(stored);
    return [];
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const stored = localStorage.getItem('j3d_payments');
    return stored ? JSON.parse(stored) : [];
  });

  const [loginAttempts, setLoginAttempts] = useState<number>(() => {
    const stored = localStorage.getItem('j3d_login_attempts');
    return stored ? Number(stored) : 0;
  });

  const [lockoutUntil, setLockoutUntil] = useState<number | null>(() => {
    const stored = localStorage.getItem('j3d_lockout_until');
    return stored ? Number(stored) : null;
  });

  // Load data from IndexedDB on mount
  useEffect(() => {
    const loadFromIndexedDB = async () => {
      if (shouldWipe) {
        await setVal('j3d_orders', []);
        await setVal('j3d_quotations', []);
        await setVal('j3d_payments', []);
        localStorage.setItem('j3d_orders_wiped_v3', 'true');
        setDbLoaded(true);
        return;
      }

      const storedOrders = await getVal('j3d_orders');
      if (storedOrders !== undefined && storedOrders !== null) {
        setOrders(storedOrders);
      }
      const storedQuotations = await getVal('j3d_quotations');
      if (storedQuotations !== undefined && storedQuotations !== null) {
        setQuotations(storedQuotations);
      }
      const storedPayments = await getVal('j3d_payments');
      if (storedPayments !== undefined && storedPayments !== null) {
        setPayments(storedPayments);
      }
      setDbLoaded(true);
    };
    loadFromIndexedDB();
  }, [shouldWipe]);

  // Sync state to local storage and IndexedDB
  useEffect(() => {
    localStorage.setItem('j3d_user', currentUser ? JSON.stringify(currentUser) : '');
  }, [currentUser]);

  useEffect(() => {
    if (!dbLoaded) return;
    try {
      localStorage.setItem('j3d_orders', JSON.stringify(orders));
    } catch (e) {
      console.warn('localStorage limit exceeded for orders, relying on IndexedDB', e);
    }
    setVal('j3d_orders', orders);
  }, [orders, dbLoaded]);

  useEffect(() => {
    if (!dbLoaded) return;
    try {
      localStorage.setItem('j3d_quotations', JSON.stringify(quotations));
    } catch (e) {
      console.warn('localStorage limit exceeded for quotations, relying on IndexedDB', e);
    }
    setVal('j3d_quotations', quotations);
  }, [quotations, dbLoaded]);

  useEffect(() => {
    if (!dbLoaded) return;
    try {
      localStorage.setItem('j3d_payments', JSON.stringify(payments));
    } catch (e) {
      console.warn('localStorage limit exceeded for payments, relying on IndexedDB', e);
    }
    setVal('j3d_payments', payments);
  }, [payments, dbLoaded]);

  useEffect(() => {
    localStorage.setItem('j3d_login_attempts', String(loginAttempts));
  }, [loginAttempts]);

  useEffect(() => {
    localStorage.setItem('j3d_lockout_until', lockoutUntil ? String(lockoutUntil) : '');
  }, [lockoutUntil]);

  // Auto-switch user based on path to keep client and admin profiles separated
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) {
      if (!currentUser || currentUser.role !== 'operator') {
        setCurrentUser(mockOperator);
        localStorage.setItem('j3d_user', JSON.stringify(mockOperator));
      }
    } else if (path === '/' || path.startsWith('/client')) {
      if (!currentUser || currentUser.role !== 'client') {
        setCurrentUser(mockClient);
        localStorage.setItem('j3d_user', JSON.stringify(mockClient));
      }
    }
  });

  // Auth operations (RF01)
  const login = (email: string, password: string, role: UserRole) => {
    const now = Date.now();
    
    if (lockoutUntil && now < lockoutUntil) {
      const secondsLeft = Math.ceil((lockoutUntil - now) / 1000);
      return { success: false, error: `Acceso bloqueado. Intente de nuevo en ${secondsLeft} segundos.` };
    }

    let valid = false;
    let userToSet: User | null = null;

    if (role === 'client' && (email === 'juan@example.com' || email.toLowerCase() === 'juan') && password === 'password') {
      valid = true;
      userToSet = mockClient;
    } else if (role === 'operator' && (email === 'ivan@j3d.com' || email.toLowerCase() === 'ivan') && password === '123456') {
      valid = true;
      userToSet = mockOperator;
    }

    if (valid && userToSet) {
      setCurrentUser(userToSet);
      setLoginAttempts(0);
      setLockoutUntil(null);
      return { success: true };
    } else {
      const nextAttempts = loginAttempts + 1;
      setLoginAttempts(nextAttempts);
      
      if (nextAttempts >= 3) {
        const lockTime = now + 30 * 1000; // 30 seconds block
        setLockoutUntil(lockTime);
        return { success: false, error: 'Has alcanzado 3 intentos fallidos. Acceso bloqueado por 30 segundos.' };
      }
      
      return { success: false, error: `Credenciales inválidas. Intentos fallidos: ${nextAttempts}/3.` };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('j3d_user');
  };

  // RF02 - Pedido de Catálogo
  const createCatalogOrder = (
    productId: string,
    productName: string,
    quantity: number,
    material: string,
    color: string,
    deliveryMethod: 'delivery' | 'pickup',
    deliveryAddress: string,
    notes: string,
    clientName?: string,
    clientEmail?: string,
    clientPhone?: string
  ) => {
    const orderId = `ORD-CAT-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const estDelivery = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const product = products.find(p => p.id === productId);
    const baseProductPrice = product ? product.basePrice : 3500;
    const total = baseProductPrice * quantity;

    const newOrder: Order = {
      id: orderId,
      customerId: currentUser?.id || '1',
      customerName: clientName || currentUser?.name || 'Juan Pérez',
      customerEmail: clientEmail || currentUser?.email || 'juan@example.com',
      productId,
      productName,
      quantity,
      status: 'pending_deposit', // "Pendiente de Seña"
      paymentStatus: 'pending',
      totalPrice: total,
      depositPaid: 0,
      remainingBalance: total,
      estimatedDelivery: estDelivery,
      createdAt: now,
      updatedAt: now,
      priority: 'medium',
      deliveryMethod,
      deliveryAddress,
      specifications: {
        material,
        color,
        notes,
        phone: clientPhone || ''
      },
      files: [],
      statusHistory: [
        { status: 'pending_deposit', timestamp: now, updatedByRole: 'client' }
      ]
    };

    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  // RF03 - Pedido Personalizado
  const createCustomOrder = (
    pieceType: string,
    material: string,
    color: string,
    quantity: number,
    description: string,
    files: string[],
    clientName?: string,
    clientEmail?: string,
    clientPhone?: string
  ) => {
    const orderId = `ORD-CUST-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    
    const newOrder: Order = {
      id: orderId,
      customerId: currentUser?.id || '1',
      customerName: clientName || currentUser?.name || 'Juan Pérez',
      customerEmail: clientEmail || currentUser?.email || 'juan@example.com',
      productName: `Pieza Personalizada: ${pieceType}`,
      quantity,
      status: 'pending_quotation', // "Pendiente de Presupuesto"
      paymentStatus: 'pending',
      totalPrice: 0,
      depositPaid: 0,
      remainingBalance: 0,
      estimatedDelivery: '',
      createdAt: now,
      updatedAt: now,
      priority: 'medium',
      deliveryMethod: 'pickup',
      specifications: {
        material,
        color,
        pieceType,
        notes: description,
        phone: clientPhone || ''
      },
      files: files.length > 0 ? files : ['simulated_design_file.stl'],
      statusHistory: [
        { status: 'pending_quotation', timestamp: now, updatedByRole: 'client' }
      ]
    };

    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  // RF05 - Gestión de Estados
  const updateOrderStatus = (orderId: string, status: OrderStatus, role: UserRole, reason?: string) => {
    const now = new Date().toISOString();
    
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      
      const newHistory = [...o.statusHistory, { status, timestamp: now, updatedByRole: role }];
      
      const updateData: Partial<Order> = {
        status,
        updatedAt: now,
        statusHistory: newHistory
      };

      if (status === 'cancelled' && reason) {
        updateData.cancellation = {
          reason,
          date: now,
          cancelledByRole: role
        };
      }

      return {
        ...o,
        ...updateData
      };
    }));
  };

  // RF08 & RF09 & RF10 - Elaboración/Ajuste de Presupuesto y Prototipos
  const createQuotation = (
    orderId: string,
    weight: number,
    printTime: number,
    materialName: string,
    margin: number,
    customPrice?: number,
    customEstimatedDelivery?: string,
    renderUrl?: string,
    imageUrl?: string,
    model3DUrl?: string,
    attachments?: { name: string; dataUrl: string; type: string }[]
  ) => {
    const quoteId = `QUO-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days (RF11)

    const estimatedPrintHours = printTime * 1.8;

    const costPerGram = materialName === 'PLA' ? 0.05 : materialName === 'ABS' ? 0.08 : materialName === 'Resina' ? 0.15 : 0.12;
    const materialCost = weight * costPerGram;
    const electricityCost = estimatedPrintHours * 250;
    const laborCost = estimatedPrintHours * 1000;
    const machineWearCost = estimatedPrintHours * 375;
    const totalCost = materialCost + electricityCost + laborCost + machineWearCost;

    const calculatedPrice = totalCost * (1 + margin / 100);
    const finalPrice = customPrice !== undefined ? customPrice : calculatedPrice;
    const estDelivery = customEstimatedDelivery || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newQuotation: Quotation = {
      id: quoteId,
      orderId,
      materialCost,
      printTime: estimatedPrintHours,
      electricityCost,
      laborCost,
      machineWearCost,
      totalCost,
      margin,
      finalPrice,
      weight,
      estimatedDelivery: estDelivery,
      prototypeUrl: renderUrl || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600',
      createdAt: now,
      approved: null,
      renderUrl,
      imageUrl,
      model3DUrl,
      attachments: attachments || [],
      validUntil
    };

    setQuotations(prev => {
      const filtered = prev.filter(q => q.orderId.replace(/_/g, '-').toUpperCase() !== orderId.replace(/_/g, '-').toUpperCase());
      return [newQuotation, ...filtered];
    });

    setOrders(prev => prev.map(o => {
      if (o.id.replace(/_/g, '-').toUpperCase() !== orderId.replace(/_/g, '-').toUpperCase()) return o;
      return {
        ...o,
        status: 'quotation_sent',
        totalPrice: finalPrice,
        remainingBalance: finalPrice - o.depositPaid,
        estimatedDelivery: estDelivery,
        updatedAt: now,
        statusHistory: [
          ...o.statusHistory,
          { status: 'quotation_sent', timestamp: now, updatedByRole: 'operator' }
        ]
      };
    }));

    return newQuotation;
  };

  // RF12 - Solicitar Modificaciones
  const requestQuotationModifications = (orderId: string, comments: string) => {
    const now = new Date().toISOString();
    
    setOrders(prev => prev.map(o => {
      if (o.id.replace(/_/g, '-').toUpperCase() !== orderId.replace(/_/g, '-').toUpperCase()) return o;
      return {
        ...o,
        status: 'pending_approval', // "En Rediseño"
        comments: comments,
        updatedAt: now,
        statusHistory: [
          ...o.statusHistory,
          { status: 'pending_approval', timestamp: now, updatedByRole: 'client' }
        ]
      };
    }));

    setQuotations(prev => prev.map(q => {
      if (q.orderId.replace(/_/g, '-').toUpperCase() !== orderId.replace(/_/g, '-').toUpperCase()) return q;
      return { ...q, approved: false };
    }));
  };

  // RF13 - Aceptar Presupuesto
  const acceptQuotation = (orderId: string) => {
    const now = new Date().toISOString();
    
    setOrders(prev => prev.map(o => {
      if (o.id.replace(/_/g, '-').toUpperCase() !== orderId.replace(/_/g, '-').toUpperCase()) return o;
      return {
        ...o,
        status: 'pending_deposit', // "Pendiente de Seña"
        updatedAt: now,
        statusHistory: [
          ...o.statusHistory,
          { status: 'pending_deposit', timestamp: now, updatedByRole: 'client' }
        ]
      };
    }));

    setQuotations(prev => prev.map(q => {
      if (q.orderId.replace(/_/g, '-').toUpperCase() !== orderId.replace(/_/g, '-').toUpperCase()) return q;
      return { ...q, approved: true };
    }));
  };

  // RF13 - Rechazar Presupuesto
  const rejectQuotation = (orderId: string, reason: string) => {
    const now = new Date().toISOString();
    
    setOrders(prev => prev.map(o => {
      if (o.id.replace(/_/g, '-').toUpperCase() !== orderId.replace(/_/g, '-').toUpperCase()) return o;
      return {
        ...o,
        status: 'cancelled',
        updatedAt: now,
        statusHistory: [
          ...o.statusHistory,
          { status: 'cancelled', timestamp: now, updatedByRole: 'client' }
        ],
        cancellation: {
          reason,
          date: now,
          cancelledByRole: 'client'
        }
      };
    }));

    setQuotations(prev => prev.map(q => {
      if (q.orderId.replace(/_/g, '-').toUpperCase() !== orderId.replace(/_/g, '-').toUpperCase()) return q;
      return { ...q, approved: false };
    }));
  };

  // RF14 - Registro de Pagos (Client submits receipt)
  const submitPaymentReceipt = (
    orderId: string,
    type: 'seña' | 'saldo',
    method: string,
    receiptUrl: string
  ) => {
    const paymentId = `PAY-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const targetOrder = orders.find(o => o.id.replace(/_/g, '-').toUpperCase() === orderId.replace(/_/g, '-').toUpperCase());
    if (!targetOrder) return;

    const amount = type === 'seña' 
      ? targetOrder.totalPrice * 0.5 
      : targetOrder.remainingBalance;

    const newPayment: Payment = {
      id: paymentId,
      orderId,
      amount,
      type,
      date: now,
      method,
      status: 'pending_validation', // Pending operator verification
      receiptUrl
    };

    setPayments(prev => [newPayment, ...prev]);

    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;

      const nextStatus = type === 'seña' 
        ? 'deposit_verification'  // "Seña Pendiente de Verificación"
        : 'balance_verification';  // "Saldo Pendiente de Verificación"

      let estimatedDelivery = o.estimatedDelivery;

      if (type === 'seña') {
        let totalPrintTime = 4; // default fallback
        
        if (o.productId) {
          // Catalog order
          const product = products.find(p => p.id === o.productId);
          if (product) {
            totalPrintTime = product.printTime * o.quantity;
          }
        } else {
          // Custom order (has quotation)
          const quote = quotations.find(q => q.orderId.replace(/_/g, '-').toUpperCase() === o.id.replace(/_/g, '-').toUpperCase());
          if (quote) {
            totalPrintTime = quote.printTime; // this already includes the 1.8 multiplier
          }
        }

        // Apply 80% margin to catalog orders if not already applied (for custom orders, quote.printTime has it)
        const printHoursWithMargin = o.productId ? (totalPrintTime * 1.8) : totalPrintTime;
        const estimatedDays = Math.ceil(printHoursWithMargin / 8);

        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + estimatedDays);
        estimatedDelivery = deliveryDate.toISOString().split('T')[0];
      }

      const nextPaymentStatus = type === 'seña' ? 'pending' : 'partial';

      return {
        ...o,
        status: nextStatus,
        paymentStatus: nextPaymentStatus,
        estimatedDelivery,
        comments: '', // clear old operator reject reasons if any
        updatedAt: now,
        statusHistory: [
          ...o.statusHistory,
          { status: nextStatus, timestamp: now, updatedByRole: 'client' }
        ]
      };
    }));
  };

  // Operator verifies payment (RF14 approval or reject)
  const verifyPayment = (
    orderId: string,
    type: 'seña' | 'saldo',
    action: 'approve' | 'reject',
    reason?: string
  ) => {
    const now = new Date().toISOString();

    // 1. Update Payment record status
    setPayments(prev => prev.map(p => {
      if (p.orderId !== orderId || p.type !== type || p.status !== 'pending_validation') return p;
      return {
        ...p,
        status: action === 'approve' ? 'validated' : 'invalidated'
      };
    }));

    // 2. Update Order balances & statuses
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;

      if (action === 'approve') {
        const paidAmount = o.totalPrice * 0.5;
        const newDeposit = type === 'seña' ? paidAmount : o.depositPaid + paidAmount;
        const newRemaining = o.totalPrice - newDeposit;
        
        let newStatus: OrderStatus = type === 'seña' ? 'in_production' : 'finished';
        let newPaymentStatus: PaymentStatus = type === 'seña' ? 'partial' : 'completed';

        return {
          ...o,
          depositPaid: newDeposit,
          remainingBalance: newRemaining,
          paymentStatus: newPaymentStatus,
          status: newStatus,
          comments: '', // clear remarks
          updatedAt: now,
          statusHistory: [
            ...o.statusHistory,
            { status: newStatus, timestamp: now, updatedByRole: 'operator' }
          ]
        };
      } else {
        // Reject payment receipt, return to initial state
        const targetStatus: OrderStatus = type === 'seña' ? 'pending_deposit' : 'pending_balance';
        return {
          ...o,
          status: targetStatus,
          paymentStatus: 'invalidated',
          comments: reason || 'Comprobante de pago rechazado. Por favor verifique e intente nuevamente.',
          updatedAt: now,
          statusHistory: [
            ...o.statusHistory,
            { status: targetStatus, timestamp: now, updatedByRole: 'operator' }
          ]
        };
      }
    }));
  };

  const clearAllData = async () => {
    setOrders([]);
    setQuotations([]);
    setPayments([]);
    await setVal('j3d_orders', []);
    await setVal('j3d_quotations', []);
    await setVal('j3d_payments', []);
    localStorage.removeItem('j3d_orders');
    localStorage.removeItem('j3d_quotations');
    localStorage.removeItem('j3d_payments');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        orders,
        quotations,
        payments,
        loginAttempts,
        lockoutUntil,
        dbLoaded,
        login,
        logout,
        createCatalogOrder,
        createCustomOrder,
        updateOrderStatus,
        createQuotation,
        requestQuotationModifications,
        acceptQuotation,
        rejectQuotation,
        submitPaymentReceipt,
        verifyPayment,
        clearAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
