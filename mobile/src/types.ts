export type Role = 'investor' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  created_at: string;
}

export interface Portfolio {
  id: string;
  name: string;
  created_at: string;
}

export interface Property {
  id: string;
  portfolio_id: string;
  project_name: string;
  developer: string | null;
  location: string | null;
  unit_no: string | null;
  unit_type: string | null;
  bedrooms: number | null;
  size_sqft: number | null;
  plot_sqft: number | null;
  purchase_date: string | null;
  handover_date: string | null;
  payment_plan: string | null;
  unit_price_aed: number;
  total_unit_price_aed: number;
  total_paid_aed: number;
  total_pending_aed: number;
  status: string;
  owner1_name: string | null;
  owner2_name: string | null;
  owner1_pct: number | null;
  owner2_pct: number | null;
  resale_noc_pct: number | null;
  resale_applicable: string | null;
  offer_notes: string | null;
  remarks: string | null;
  ppsf_plot: number | null;
  ppsf_bua: number | null;
  accelerated_payment_pct: number | null;
  accelerated_payment_aed: number | null;
  equity_construction_pct: number | null;
  equity_handover_pct: number | null;
  equity_posthandover_pct: number | null;
  equity_construction_aed: number | null;
  equity_handover_aed: number | null;
  equity_posthandover_aed: number | null;
  created_at: string;
}

export type MilestoneStatus = 'Paid' | 'Pending';

export interface PaymentMilestone {
  id: string;
  property_id: string;
  milestone_no: number | null;
  milestone_event: string;
  installment_code: string | null;
  sale_date: string | null;
  due_date: string | null;
  pct: number | null;
  amount_aed: number;
  vat_aed: number;
  total_aed: number;
  paid_aed: number;
  outstanding_aed: number;
  status: MilestoneStatus;
  year: number | null;
  remarks: string | null;
}

export interface FxRate {
  id: number;
  aed_to_inr: number;
  as_of: string;
}

/** Five-way UI status derived from due_date + status. */
export type MilestoneState = 'paid' | 'overdue' | 'soon' | 'upcoming' | 'undecided';

/** ISO 4217 code. AED is the base; the user picks one secondary currency in Account. */
export type Currency = string;
export type ThemeMode = 'light' | 'dark';
/** What the user picked; 'system' resolves to light/dark from the device. */
export type ThemePreference = ThemeMode | 'system';

export interface ResaleEligibility {
  applicable: boolean;
  eligible: boolean;
  /** resale_applicable was never recorded (as opposed to explicitly 'NO'). */
  unknown?: boolean;
  reqPct?: number;
  paidPct?: number;
}
