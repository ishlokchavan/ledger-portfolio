import type { Currency, MilestoneState, PaymentMilestone, Property, ResaleEligibility } from '../types';

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

export function fmtMoney(aed: number | null | undefined, currency: Currency, fxRate: number): string {
  const amount = Number(aed || 0);
  const v = currency === 'INR' ? amount * (fxRate || 25.96) : amount;
  const symbol = currency === 'INR' ? '₹' : 'AED ';
  const rounded = Math.round(v);
  return symbol + rounded.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US');
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysUntil(d: string | null | undefined): number | null {
  if (!d) return null;
  const dt = new Date(d + 'T00:00:00');
  return Math.round((dt.getTime() - TODAY.getTime()) / 86400000);
}

export function fmtPct(x: number | null | undefined): string {
  return x == null ? '—' : Math.round(x * 1000) / 10 + '%';
}

export function fmtPsf(x: number | null | undefined): string | null {
  if (x == null || (x as unknown as string) === '') return null;
  return 'AED ' + Math.round(x).toLocaleString('en-US') + ' /sqft';
}

/** Five states: paid, overdue, soon (<=30d), upcoming (30-90d+), undecided (no due date, unpaid). */
export function milestoneState(m: PaymentMilestone): MilestoneState {
  if (m.status === 'Paid') return 'paid';
  if (!m.due_date) return 'undecided';
  const d = daysUntil(m.due_date)!;
  if (d < 0) return 'overdue';
  if (d <= 30) return 'soon';
  return 'upcoming';
}

export const STATE_LABEL: Record<MilestoneState, string> = {
  paid: 'Paid',
  overdue: 'Overdue',
  soon: 'Due soon',
  upcoming: 'Upcoming',
  undecided: 'Undecided',
};

export function resaleEligibility(p: Property): ResaleEligibility {
  const applicable = String(p.resale_applicable || '').toUpperCase() === 'YES';
  if (!applicable) return { applicable: false, eligible: false };
  const reqPct = Number(p.resale_noc_pct || 0);
  const paidPct = Number(p.total_unit_price_aed) > 0 ? Number(p.total_paid_aed || 0) / Number(p.total_unit_price_aed) : 0;
  return { applicable: true, eligible: paidPct >= reqPct, reqPct, paidPct };
}

export function paidPct(p: Property): number {
  return p.total_unit_price_aed > 0 ? Math.round((p.total_paid_aed / p.total_unit_price_aed) * 100) : 0;
}

/** Compact money for tiles: AED 1.25M / AED 250K, or ₹1.2 Cr / ₹4.5 L for INR. */
export function fmtCompact(aed: number | null | undefined, currency: Currency, fxRate: number): string {
  const amount = Number(aed || 0);
  const v = currency === 'INR' ? amount * (fxRate || 25.96) : amount;
  const a = Math.abs(v);
  const r = (n: number, d: number) => String(Math.round(n * d) / d);
  let out: string;
  if (currency === 'INR') {
    out = a >= 1e7 ? r(a / 1e7, 100) + ' Cr' : a >= 1e5 ? r(a / 1e5, 100) + ' L' : a >= 1e3 ? r(a / 1e3, 10) + 'K' : String(Math.round(a));
  } else {
    out = a >= 1e6 ? r(a / 1e6, 100) + 'M' : a >= 1e3 ? r(a / 1e3, 10) + 'K' : String(Math.round(a));
  }
  return (v < 0 ? '-' : '') + (currency === 'INR' ? '₹' : 'AED ') + out;
}

export function relDays(n: number | null): string {
  if (n === null) return 'No date set';
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n < 0) return `${Math.abs(n)} ${Math.abs(n) === 1 ? 'day' : 'days'} late`;
  if (n < 60) return `In ${n} days`;
  return `In ${Math.round(n / 30.4)} months`;
}

export function greeting(): string {
  const h = new Date().getHours();
  return h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function firstName(name: string | null | undefined): string {
  return String(name || '').trim().split(/\s+/)[0] || 'there';
}

export function initials(name: string | null | undefined): string {
  const p = String(name || '?').trim().split(/\s+/);
  return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

export function plural(n: number, s: string, p?: string): string {
  return `${n} ${n === 1 ? s : p || s + 's'}`;
}

export function nextMilestone(milestones: PaymentMilestone[], propertyId: string): PaymentMilestone | null {
  const list = milestones
    .filter((m) => m.property_id === propertyId && m.status !== 'Paid' && m.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
  return list[0] || null;
}

const COVERS: [string, string][] = [
  ['#0f766e', '#164e63'], ['#4338ca', '#1e3a8a'], ['#9a3412', '#7f1d1d'], ['#166534', '#134e4a'],
  ['#6d28d9', '#4c1d95'], ['#0e7490', '#1e40af'], ['#a16207', '#854d0e'], ['#be185d', '#831843'],
];
/** Stable per-developer accent colour so cards are recognisable at a glance. */
export function coverColors(p: Property): [string, string] {
  const s = String(p.developer || p.project_name || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return COVERS[h % COVERS.length];
}
