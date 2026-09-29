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
