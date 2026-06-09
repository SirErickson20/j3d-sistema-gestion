import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getExtensionFromDataUrl(dataUrl: string, defaultExt = 'png'): string {
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    if (dataUrl && dataUrl.includes('.')) {
      const parts = dataUrl.split('.');
      return parts[parts.length - 1];
    }
    return defaultExt;
  }
  const match = dataUrl.match(/^data:([^;]+);/);
  if (!match) return defaultExt;
  const mimeType = match[1];
  switch (mimeType) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/gif':
      return 'gif';
    case 'image/webp':
      return 'webp';
    case 'image/svg+xml':
      return 'svg';
    case 'application/pdf':
      return 'pdf';
    case 'image/png':
    default:
      return 'png';
  }
}

export function generatePlaceholderReceipt(orderId: string, type: string, amount: number, method: string, date: string, fileName: string): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const grad = ctx.createLinearGradient(0, 0, 600, 400);
  grad.addColorStop(0, '#0B0B1E');
  grad.addColorStop(1, '#15152A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 400);

  ctx.strokeStyle = '#FF1744';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 594, 394);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 26px Arial';
  ctx.fillText('J3D IMPRESIONES', 40, 60);

  ctx.fillStyle = '#FF1744';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('COMPROBANTE DE PAGO SIMULADO', 40, 95);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 115);
  ctx.lineTo(560, 115);
  ctx.stroke();

  ctx.fillStyle = '#A0A0A0';
  ctx.font = '14px Arial';
  let y = 160;

  const drawField = (label: string, val: string, isHighlighted = false) => {
    ctx.fillStyle = '#A0A0A0';
    ctx.font = '14px Arial';
    ctx.fillText(label, 40, y);
    ctx.fillStyle = isHighlighted ? '#4ADE80' : '#FFFFFF';
    ctx.font = 'bold 15px Arial';
    ctx.fillText(val, 200, y);
    y += 40;
  };

  drawField('Pedido ID:', `#${orderId}`);
  drawField('Tipo de Pago:', type === 'deposit' ? 'Seña (50%)' : 'Saldo Restante');
  drawField('Monto:', formatCurrency(amount), true);
  drawField('Método:', method);
  drawField('Fecha:', formatDate(date));
  drawField('Archivo Original:', fileName);

  ctx.fillStyle = '#666666';
  ctx.font = '11px Arial';
  ctx.fillText('Este documento es una representación visual del comprobante registrado.', 40, 365);

  return canvas.toDataURL('image/png');
}

