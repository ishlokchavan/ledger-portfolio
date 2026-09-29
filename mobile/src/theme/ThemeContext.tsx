import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '../types';
import { colorsFor, radii, spacing, type ThemeColors } from './theme';

const STORAGE_KEY = 'ledger_theme';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  radii: typeof radii;
  spacing: typeof spacing;
  setMode: (m: ThemeMode) => void;
  ready: boolean;
}

const ThemeCtx = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Light is the default regardless of the device's system setting — mirrors
  // the web app's explicit-light-by-default behavior with a switcher in Account.
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') setModeState(saved);
      } catch {
        // ignore — fall back to light
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  };

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, colors: colorsFor(mode), radii, spacing, setMode, ready }),
    [mode, ready]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
