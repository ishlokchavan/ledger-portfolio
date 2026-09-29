import type { ThemeMode } from '../types';

export interface ThemeColors {
  bg: string;
  surface: string;
  surface2: string;
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
}

// Ported 1:1 from index.html's CSS custom properties (:root and [data-theme="dark"]).
export const lightColors: ThemeColors = {
  bg: '#f5f6f5',
  surface: '#ffffff',
  surface2: '#eef0ee',
  border: '#dde1de',
  ink: '#12181a',
  inkDim: '#5c6a68',
  inkFaint: '#8b9694',
  accent: '#0f7d72',
  accentInk: '#ffffff',
  accentSoft: '#e2f1ee',
  good: '#1f8a4c',
  goodSoft: '#e5f5ea',
  warn: '#a8721c',
  warnSoft: '#faf0dc',
  bad: '#c23b32',
  badSoft: '#fbe9e7',
};

export const darkColors: ThemeColors = {
  bg: '#0b1211',
  surface: '#0f1917',
  surface2: '#15221f',
  border: '#223330',
  ink: '#eef3f1',
  inkDim: '#93a5a1',
  inkFaint: '#5e716d',
  accent: '#3fd6c4',
  accentInk: '#06201c',
  accentSoft: '#122b27',
  good: '#4fbd7c',
  goodSoft: '#12291b',
  warn: '#e0a83e',
  warnSoft: '#2c2210',
  bad: '#e2645c',
  badSoft: '#2c1614',
};

export function colorsFor(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? darkColors : lightColors;
}

export const radii = { sm: 9, md: 12, lg: 16, xl: 20, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };
