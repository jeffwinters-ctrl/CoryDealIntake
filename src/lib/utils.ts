import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getScoreColor(score: number): string {
  if (score >= 7) return 'text-green-400';
  if (score >= 5) return 'text-yellow-400';
  return 'text-red-400';
}

export function getScoreBgColor(score: number): string {
  if (score >= 7) return 'bg-green-500/20 border-green-500/30';
  if (score >= 5) return 'bg-yellow-500/20 border-yellow-500/30';
  return 'bg-red-500/20 border-red-500/30';
}

export function getStageBadgeColor(stage: string): string {
  const colors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    initial_review: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    due_diligence: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    committee: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    term_sheet: 'bg-brand-gold/20 text-brand-gold border-brand-gold/30',
    docs: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    funding: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    closed: 'bg-green-500/20 text-green-300 border-green-500/30',
    declined: 'bg-red-500/20 text-red-300 border-red-500/30',
  };
  return colors[stage] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}
