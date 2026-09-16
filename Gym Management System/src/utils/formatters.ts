export function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function fmtDate(iso?: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso + (iso.length <= 10 ? 'T00:00:00' : ''));
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function fmtMoney(amount: number, currency: string = 'USD'): string {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency} `;
  return `${symbol}${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function daysUntil(iso: string): number {
  if (!iso) return 0;
  const target = new Date(iso + 'T00:00:00');
  const now = new Date(todayISO() + 'T00:00:00');
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function initials(name?: string): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

let counterMap: Record<string, number> = {};

export function uid(prefix: string): string {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('gms_counters');
      if (stored) counterMap = JSON.parse(stored);
    } catch {}
  }
  counterMap[prefix] = (counterMap[prefix] || 0) + 1;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('gms_counters', JSON.stringify(counterMap));
    } catch {}
  }
  return `${prefix}-${String(counterMap[prefix]).padStart(4, '0')}`;
}
