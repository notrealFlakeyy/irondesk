import { clsx, type ClassValue } from 'clsx';
import { Category, OrderStatus, PaymentMethod } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const currencyFormatter = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function fmt(n: number) {
  return currencyFormatter.format(n);
}

export function categoryLabel(category: Category) {
  return {
    fasteners: 'Fasteners',
    electrical: 'Electrical',
    plumbing: 'Plumbing',
    tools: 'Tools',
    paint: 'Paint',
    safety: 'Safety',
    lumber: 'Lumber',
  }[category];
}

export function paymentLabel(method: PaymentMethod) {
  return {
    card: 'Card',
    cash: 'Cash',
    invoice: 'Invoice',
  }[method];
}

export function orderStatusLabel(status: OrderStatus) {
  return {
    ready: 'Ready',
    paid: 'Paid',
    pending: 'Pending',
    processing: 'Processing',
  }[status];
}

export function stockStatus(stock: number, min: number): 'ok' | 'low' | 'out' {
  if (stock === 0) return 'out';
  if (stock < min) return 'low';
  return 'ok';
}

export function formatShortDate(value: string | Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export function startOfLocalDay(value: string | Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function dayKey(value: string | Date) {
  return startOfLocalDay(value).toISOString().slice(0, 10);
}

export function lastNDays(count: number, endDate: string | Date = new Date()) {
  const days: Date[] = [];
  const current = startOfLocalDay(endDate);

  for (let index = count - 1; index >= 0; index -= 1) {
    const next = new Date(current);
    next.setDate(current.getDate() - index);
    days.push(next);
  }

  return days;
}
