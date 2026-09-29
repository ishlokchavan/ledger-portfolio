import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { TopBar } from './TopBar';

/** Wraps a top-level tab screen with the shared brand + portfolio-switcher header. */
export function Screen({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar />
      {children}
    </View>
  );
}
