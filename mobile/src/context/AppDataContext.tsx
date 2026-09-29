import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { FALLBACK_RATES, RATES_URL, isKnownCurrency, rateLabel } from '../lib/currency';
import type { Currency, FxRate, PaymentMilestone, Portfolio, Profile, Property } from '../types';

const K_CURRENCY = 'ledger_currency';
const K_SECONDARY = 'ledger_secondary';
const K_RATES = 'ledger_rates';
const RATES_TTL = 12 * 3600 * 1000;

export interface RatesMeta {
  source: 'live' | 'stale' | 'fallback';
  asOf?: string;
}

interface AppDataContextValue {
  booting: boolean;
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  portfolios: Portfolio[];
  currentPortfolioId: string | null;
  setCurrentPortfolioId: (id: string) => void;
  properties: Property[];
  milestones: PaymentMilestone[];
  /** AED -> active currency rate (1 when the active currency is AED). */
  fxRate: number;
  /** Active display currency: 'AED' or the user's secondary currency. */
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** The user's chosen secondary currency (AED is always the base). */
  secondary: Currency;
  setSecondary: (c: Currency) => void;
  rateFor: (code: string) => number;
  ratesNote: string;
  rateText: (code: string) => string;
  loginError: string;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AppDataCtx = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [currentPortfolioId, setCurrentPortfolioId] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([]);
  const [inrRate, setInrRate] = useState(25.96);
  const [currency, setCurrencyState] = useState<Currency>('AED');
  const [secondary, setSecondaryState] = useState<Currency>('INR');
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [ratesMeta, setRatesMeta] = useState<RatesMeta>({ source: 'fallback' });
  const [loginError, setLoginError] = useState('');

  const loadPortfolioData = useCallback(async (portfolioId: string | null) => {
    setLoading(true);
    try {
      if (!portfolioId) {
        setProperties([]);
        setMilestones([]);
        return;
      }
      const propRes = await supabase
        .from('properties')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('purchase_date');
      const props = (propRes.data as Property[]) || [];
      setProperties(props);
      const ids = props.map((p) => p.id);
      if (ids.length) {
        const msRes = await supabase.from('payment_milestones').select('*').in('property_id', ids).order('due_date');
        setMilestones((msRes.data as PaymentMilestone[]) || []);
      } else {
        setMilestones([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEverything = useCallback(
    async (sess: Session) => {
      setLoading(true);
      try {
        const userId = sess.user.id;
        const profRes = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (profRes.error || !profRes.data) {
          setLoginError('Could not load your profile. Please try again.');
          setSession(null);
          return;
        }
        const prof = profRes.data as Profile;
        setProfile(prof);

        const portRes = await supabase.from('portfolios').select('*').order('name');
        const ports = (portRes.data as Portfolio[]) || [];
        setPortfolios(ports);
        const pid = ports.length ? ports[0].id : null;
        setCurrentPortfolioId((prev) => prev ?? pid);

        const fxRes = await supabase.from('fx_rates').select('*').eq('id', 1).single();
        if (fxRes.data) setInrRate((fxRes.data as FxRate).aed_to_inr);

        // loadPortfolioData toggles `loading` itself; it's already true here so this just
        // keeps it true through the handoff — no flash of `loading=false` in between.
        await loadPortfolioData(pid);
      } finally {
        setLoading(false);
      }
    },
    [loadPortfolioData]
  );

  // Persisted currency preferences.
  useEffect(() => {
    (async () => {
      try {
        const [c, sec] = await Promise.all([AsyncStorage.getItem(K_CURRENCY), AsyncStorage.getItem(K_SECONDARY)]);
        const secOk = sec && sec !== 'AED' && isKnownCurrency(sec) ? sec : 'INR';
        setSecondaryState(secOk);
        if (c && isKnownCurrency(c)) setCurrencyState(c);
      } catch {
        // defaults are fine
      }
    })();
  }, []);

  // Live FX rates: cached for 12h, then fetched; falls back to the last saved set, then to labelled approximations.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let cached: { t: number; rates: Record<string, number>; asOf?: string } | null = null;
      try {
        const raw = await AsyncStorage.getItem(K_RATES);
        cached = raw ? JSON.parse(raw) : null;
      } catch {
        cached = null;
      }
      if (cached && Date.now() - cached.t < RATES_TTL) {
        if (!cancelled) {
          setRates(cached.rates);
          setRatesMeta({ source: 'live', asOf: cached.asOf });
        }
        return;
      }
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 7000);
        const res = await fetch(RATES_URL, { signal: ctrl.signal });
        clearTimeout(to);
        const j = await res.json();
        if (j && j.result === 'success' && j.rates) {
          if (cancelled) return;
          setRates(j.rates);
          setRatesMeta({ source: 'live', asOf: j.time_last_update_utc });
          AsyncStorage.setItem(K_RATES, JSON.stringify({ t: Date.now(), rates: j.rates, asOf: j.time_last_update_utc })).catch(() => {});
          return;
        }
      } catch {
        // fall through to stale/fallback
      }
      if (cancelled) return;
      if (cached) {
        setRates(cached.rates);
        setRatesMeta({ source: 'stale', asOf: cached.asOf });
      } else {
        setRates(FALLBACK_RATES);
        setRatesMeta({ source: 'fallback' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const sess = data.session ?? null;
      setSession(sess);
      // Flip booting off as soon as we know whether there's a session — the tab UI (with
      // its own skeletons) renders immediately rather than sitting behind a blank spinner
      // for however long the data fetch below takes.
      setBooting(false);
      if (sess) {
        setLoading(true);
        loadEverything(sess);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadEverything]);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoginError('');
      const res = await supabase.auth.signInWithPassword({ email, password });
      if (res.error) {
        setLoginError(res.error.message === 'Invalid login credentials' ? 'Incorrect email or password.' : res.error.message);
        return false;
      }
      if (res.data.session) {
        setSession(res.data.session);
        await loadEverything(res.data.session);
      }
      return true;
    },
    [loadEverything]
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setPortfolios([]);
    setCurrentPortfolioId(null);
    setProperties([]);
    setMilestones([]);
    setLoginError('');
  }, []);

  const switchPortfolio = useCallback(
    (id: string) => {
      setCurrentPortfolioId(id);
      // Clear the previous portfolio's data immediately so screens fall into their
      // "loading, no data yet" skeleton state right away instead of showing the old
      // portfolio's properties/milestones while the new ones are still in flight.
      setProperties([]);
      setMilestones([]);
      loadPortfolioData(id);
    },
    [loadPortfolioData]
  );

  const refresh = useCallback(async () => {
    if (session) await loadEverything(session);
  }, [session, loadEverything]);

  const rateFor = useCallback(
    (code: string) => {
      if (code === 'AED') return 1;
      if (code === 'INR') return inrRate; // the operator-maintained rate stays authoritative for INR
      return rates?.[code] ?? FALLBACK_RATES[code] ?? 1;
    },
    [inrRate, rates]
  );
  const fxRate = rateFor(currency);
  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    AsyncStorage.setItem(K_CURRENCY, c).catch(() => {});
  }, []);
  const setSecondary = useCallback(
    (c: Currency) => {
      const wasSecondary = currency !== 'AED';
      setSecondaryState(c);
      AsyncStorage.setItem(K_SECONDARY, c).catch(() => {});
      if (wasSecondary) setCurrency(c);
    },
    [currency, setCurrency]
  );
  const ratesNote =
    ratesMeta.source === 'live'
      ? 'Live rates'
      : ratesMeta.source === 'stale'
        ? 'Last saved rates'
        : 'Approximate rates (live rates unavailable)';
  const rateText = useCallback((code: string) => rateLabel(code, rateFor(code)), [rateFor]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      booting,
      loading,
      session,
      profile,
      portfolios,
      currentPortfolioId,
      setCurrentPortfolioId: switchPortfolio,
      properties,
      milestones,
      fxRate,
      currency,
      setCurrency,
      secondary,
      setSecondary,
      rateFor,
      ratesNote,
      rateText,
      loginError,
      login,
      logout,
      refresh,
    }),
    [
      booting,
      loading,
      session,
      profile,
      portfolios,
      currentPortfolioId,
      switchPortfolio,
      properties,
      milestones,
      fxRate,
      currency,
      setCurrency,
      secondary,
      setSecondary,
      rateFor,
      ratesNote,
      rateText,
      loginError,
      login,
      logout,
      refresh,
    ]
  );

  return <AppDataCtx.Provider value={value}>{children}</AppDataCtx.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataCtx);
  if (!ctx) throw new Error('useAppData must be used within an AppDataProvider');
  return ctx;
}
