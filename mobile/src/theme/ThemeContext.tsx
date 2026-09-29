import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode, ThemePreference } from '../types';
import { colorsFor, radii, spacing, type ThemeColors } from './theme';

const STORAGE_KEY = 'ledger_theme';

interface ThemeContextValue {
  /** Resolved mode actually being rendered. */
  mode: ThemeMode;
  /** The user's choice, which may be 'system'. */
  preference: ThemePreference;
  colors: ThemeColors;
  radii: typeof radii;
  spacing: typeof spacing;
  setPreference: (p: ThemePreference) => void;
  ready: boolean;
}

const ThemeCtx = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'dark' || saved === 'light' || saved === 'system') setPreferenceState(saved);
      } catch {
        // ignore — fall back to light
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setPreference = (p: ThemePreference) => {
    setPreferenceState(p);
    AsyncStorage.setItem(STORAGE_KEY, p).catch(() => {});
  };

  const mode: ThemeMode = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, preference, colors: colorsFor(mode), radii, spacing, setPreference, ready }),
    [mode, preference, ready]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
