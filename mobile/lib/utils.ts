export function formatCurrency(amount: number | string): string {
  const num = Number(amount);
  return `${num.toLocaleString('fr-BI')} BIF`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function toNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val);
  if (typeof val === 'object') {
    const dec = val as { d?: number[]; s?: number; e?: number };
    if (Array.isArray(dec.d) && dec.d.length > 0) {
      if (typeof (val as Record<string, unknown>).toString === 'function') {
        const str = (val as { toString: () => string }).toString();
        const parsed = parseFloat(str);
        if (!isNaN(parsed)) return parsed;
      }
      const significant = dec.d[0];
      const exponent = dec.e ?? 0;
      const digits = significant.toString().length - 1;
      return (dec.s ?? 1) * significant * Math.pow(10, exponent - digits);
    }
  }
  return Number(val);
}
