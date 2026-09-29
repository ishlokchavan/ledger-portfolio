import React from 'react';
import Svg, { Path } from 'react-native-svg';

// Same icon set as the web app's ICONS map — kept in sync by hand.
const ICONS: Record<string, string> = {
  calendar:
    'M8 2v4M16 2v4M3.5 10h17M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 20V6A1.5 1.5 0 0 1 5 4.5Z',
  bed: 'M2.5 18v-6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v2M2.5 18v3M2.5 18h19v3M10.5 12h6a2 2 0 0 1 2 2v2M21.5 16v-4a2 2 0 0 0-2-2h-3',
  size: 'M4 20 20 4M6 18l2 2M10.5 13.5l2 2M15 9l2 2',
  location: 'M12 21s-7-6.28-7-11.25A7 7 0 0 1 19 9.75C19 14.72 12 21 12 21Zm0-8.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z',
  developer:
    'M4.5 21V5.5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1V21M13.5 21V10a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v11M2.5 21h19M7 8.5h1M7 12h1M7 15.5h1M17 13h1M17 16.5h1',
  money: 'M3 6.5h18v11H3v-11Zm9 3a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM6.5 6.5v.01M17.5 17.5v.01',
  percent: 'M18.5 5.5 5.5 18.5M8 8.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm8 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  resale: 'M12 21.5s7.5-3.85 7.5-9.75V6l-7.5-2.75L4.5 6v5.75c0 5.9 7.5 9.75 7.5 9.75Zm-3.3-9 2.3 2.3 4.6-4.6',
  filter: 'M3.5 5h17l-6 8.5V19l-5 2.5v-8L3.5 5Z',
  chevron: 'M6 9.5l6 6 6-6',
  chevronLeft: 'M15 18l-6-6 6-6',
  check: 'M20 6.5 9.5 17 4 11.5',
  overview: 'M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z',
  properties: 'M4 21V9l8-6 8 6v12h-6v-7h-4v7H4Z',
  payments: 'M3 10h18M6 6h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z',
  account: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  search: 'M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm10 18-4.3-4.3',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4.5V12l3 2',
  alert: 'M12 3 2 20h20L12 3Zm0 6v5m0 3v.01',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  monitor: 'M3 5h18v11H3zM8 21h8M12 16v5',
  arrowRight: 'M5 12h14m-6-6 6 6-6 6',
  chevronRight: 'M9 6l6 6-6 6',
  x: 'M6 6l12 12M18 6 6 18',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  lock: 'M6 11V8a6 6 0 1 1 12 0v3M5 11h14v10H5z',
};

interface IconProps {
  name: keyof typeof ICONS;
  size?: number;
  color: string;
}

export function Icon({ name, size = 16, color }: IconProps) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d={d} />
    </Svg>
  );
}
