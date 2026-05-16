import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calcGST(amount, gstPercent = 18) {
  const gstAmount = Math.round((amount * gstPercent) / 100);
  return { amount, gstAmount, gstPercent, totalAmount: amount + gstAmount };
}

export function getStatusColor(status) {
  const colors = {
    active: 'badge-success',
    paid: 'badge-success',
    delivered: 'badge-success',
    ready: 'badge-success',
    pending: 'badge-warning',
    preparing: 'badge-warning',
    new: 'badge-info',
    expired: 'badge-danger',
    cancelled: 'badge-danger',
    failed: 'badge-danger',
    refunded: 'badge-danger',
    frozen: 'badge-info',
    inactive: 'badge-danger',
  };
  return colors[status] || 'badge-info';
}

export function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
