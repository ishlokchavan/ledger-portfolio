import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Currency, FxRate, PaymentMilestone, Portfolio, Profile, Property } from '../types';

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
  fxRate: number;
  currency: Currency;
  setCurrency: (c: Currency) => void;
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
  const [fxRate, setFxRate] = useState(25.96);
  const [currency, setCurrency] = useState<Currency>('AED');
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
        if (fxRes.data) setFxRate((fxRes.data as FxRate).aed_to_inr);

        // loadPortfolioData toggles `loading` itself; it's already true here so this just
        // keeps it true through the handoff — no flash of `loading=false` in between.
        await loadPortfolioData(pid);
      } finally {
        setLoading(false);
      }
    },
    [loadPortfolioData]
  );

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
    setCurrency('AED');
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
