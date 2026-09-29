import type { ThemeMode } from '../types';

export interface ThemeColors {
  bg: string;
  surface: string;
  surface2: string;
  surface3: string;
  borderStrong: string;
  border: string;
  ink: string;
  inkDim: string;
  inkFaint: string;
  accent: string;
  accentInk: string;
  accentSoft: string;
  good: string;
  goodSoft: string;
  warn: string;
  warnSoft: string;
  bad: string;
  badSoft: string;
  info: string;
  infoSoft: string;
  heroA: string;
  heroB: string;
}

// Ported from index.html's CSS custom properties (:root and [data-theme="dark"]).
export const lightColors: ThemeColors = {
  bg: '#f7f7f5',
  surface: '#ffffff',
  surface2: '#f2f2ef',
  surface3: '#e8e8e4',
  border: '#e6e6e2',
  borderStrong: '#d3d3ce',
  ink: '#131816',
  inkDim: '#5a625f',
  inkFaint: '#8a918e',
  accent: '#0f7d72',
  accentInk: '#ffffff',
  accentSoft: '#e0f1ee',
  good: '#1c8a4a',
  goodSoft: '#e3f5e9',
  warn: '#a06a14',
  warnSoft: '#faf0d9',
  bad: '#c23b32',
  badSoft: '#fbe8e5',
  info: '#3b6fb6',
  infoSoft: '#e6eefa',
  heroA: '#1a2321',
  heroB: '#111716',
};

export const darkColors: ThemeColors = {
  bg: '#080e0d',
  surface: '#0e1816',
  surface2: '#142320',
  surface3: '#1b2e2a',
  border: '#1f302d',
  borderStrong: '#2c433e',
  ink: '#edf3f1',
  inkDim: '#95a8a3',
  inkFaint: '#61756f',
  accent: '#3fd6c4',
  accentInk: '#04201c',
  accentSoft: '#0f2a26',
  good: '#52c081',
  goodSoft: '#102a1a',
  warn: '#e3ac41',
  warnSoft: '#2b2110',
  bad: '#ea6d64',
  badSoft: '#2d1512',
  info: '#7aa7e6',
  infoSoft: '#12213a',
  heroA: '#1b2724',
  heroB: '#111a18',
};

export function colorsFor(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? darkColors : lightColors;
}

export const radii = { sm: 10, md: 12, lg: 18, xl: 24, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };
