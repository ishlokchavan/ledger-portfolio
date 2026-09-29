// AED is the base currency: all data is stored in dirhams. The user picks one secondary currency in Account.
// Formatting avoids Intl (Hermes' Intl support varies by platform/version) so output is identical everywhere.

export interface CurrencyDef {
  code: string;
  name: string;
  symbol: string;
  /** Uses lakh / crore grouping and suffixes (India, Pakistan, Bangladesh). */
  lakh?: boolean;
}

export const CURRENCIES: CurrencyDef[] = [
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED ' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', lakh: true },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs ', lakh: true },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', lakh: true },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: 'CN¥' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR ' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR ' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KWD ' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BHD ' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR ' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF ' },
  { code: 'JPY', name: 'Japanese Yen', symbol: 'JP¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R ' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM ' },
];

const BY_CODE: Record<string, CurrencyDef> = {};
CURRENCIES.forEach((c) => (BY_CODE[c.code] = c));

export function currencyDef(code: string): CurrencyDef {
  return BY_CODE[code] ?? { code, name: code, symbol: code + ' ' };
}
export function isKnownCurrency(code: string): boolean {
  return !!BY_CODE[code];
}

/** Used only when live rates cannot be fetched; the UI labels them "approximate". */
export const FALLBACK_RATES: Record<string, number> = {
  AED: 1, USD: 0.2723, GBP: 0.2, EUR: 0.235, INR: 25.96, PKR: 76.8, BDT: 33, RUB: 22.5, CNY: 1.97, SAR: 1.0211, QAR: 0.9912,
  KWD: 0.0835, BHD: 0.1024, OMR: 0.1047, AUD: 0.41, CAD: 0.37, CHF: 0.22, JPY: 41, SGD: 0.35, HKD: 2.124, ZAR: 4.8, THB: 9.5, MYR: 1.17,
};

export const RATES_URL = 'https://open.er-api.com/v6/latest/AED';

function group(intStr: string, lakh: boolean): string {
  if (!lakh || intStr.length <= 3) return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const last3 = intStr.slice(-3);
  const rest = intStr.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return rest + ',' + last3;
}

/** 1234567.891 -> "1,234,568" (or lakh grouping), with optional decimals. */
export function groupNumber(n: number, code: string, digits = 0): string {
  const fixed = Math.abs(n).toFixed(digits);
  const [i, d] = fixed.split('.');
  return group(i, !!currencyDef(code).lakh) + (d ? '.' + d : '');
}

/** ~3 significant digits, trailing zeros trimmed, thousands grouped. */
function sig(n: number): string {
  if (n >= 1000) return Math.round(n).toLocaleString('en-US');
  const d = n < 10 ? 2 : n < 100 ? 1 : 0;
  return String(parseFloat(n.toFixed(d)));
}

/** Compact form: AED 1.25M / 12.4B / ₹4.5 L / ₹1,250 Cr — safe for any magnitude. */
export function compactAmount(value: number, code: string): string {
  const a = Math.abs(value);
  const sym = currencyDef(code).symbol;
  if (!isFinite(a)) return sym + '—';
  let out: string;
  if (currencyDef(code).lakh) {
    out = a >= 1e12 ? sig(a / 1e12) + ' L Cr' : a >= 1e7 ? sig(a / 1e7) + ' Cr' : a >= 1e5 ? sig(a / 1e5) + ' L' : a >= 1e3 ? sig(a / 1e3) + 'K' : sig(a);
  } else {
    out = a >= 1e12 ? sig(a / 1e12) + 'T' : a >= 1e9 ? sig(a / 1e9) + 'B' : a >= 1e6 ? sig(a / 1e6) + 'M' : a >= 1e3 ? sig(a / 1e3) + 'K' : sig(a);
  }
  return (value < 0 ? '-' : '') + sym + out;
}

/** Longest full figure we show before switching to the compact form (keeps layouts intact). */
export const MAX_FULL = 16;

export function fullAmount(value: number, code: string): string {
  const a = Math.abs(value);
  const sym = currencyDef(code).symbol;
  if (!isFinite(a)) return sym + '—';
  const digits = a >= 100 || Math.abs(a - Math.round(a)) < 0.005 ? 0 : 2;
  return (value < 0 ? '-' : '') + sym + groupNumber(a, code, digits);
}

export function rateLabel(code: string, rate: number): string {
  const r = rate >= 100 ? rate.toFixed(1) : rate >= 1 ? rate.toFixed(2) : rate.toFixed(4);
  return `1 AED = ${currencyDef(code).symbol.trim()} ${r.replace(/\.?0+$/, '')}`;
}
