import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors, radii } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radii.lg,
          padding: 16,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.sectionTitleRow, style]}>
      <Text style={[styles.sectionTitleText, { color: colors.inkFaint }]}>{children}</Text>
    </View>
  );
}

export function ProgressBar({ pct, height = 8 }: { pct: number; height?: number }) {
  const { colors, radii } = useTheme();
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <View style={{ flex: 1, height, borderRadius: radii.pill, backgroundColor: colors.surface2, overflow: 'hidden' }}>
      <View style={{ width: `${clamped}%`, height: '100%', backgroundColor: colors.accent, borderRadius: radii.pill }} />
    </View>
  );
}

export function Pill({
  label,
  tone = 'accent',
}: {
  label: string;
  tone?: 'accent' | 'good' | 'neutral';
}) {
  const { colors, radii } = useTheme();
  const bg = tone === 'good' ? colors.goodSoft : tone === 'neutral' ? colors.surface2 : colors.accentSoft;
  const fg = tone === 'good' ? colors.good : tone === 'neutral' ? colors.inkDim : colors.accent;
  return (
    <View style={{ backgroundColor: bg, borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 4 }}>
      <Text style={{ color: fg, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.2 }}>{label}</Text>
    </View>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingVertical: 20 }}>
      <Text style={{ color: colors.inkFaint, fontSize: 13, textAlign: 'center' }}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitleRow: {
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitleText: {
    fontSize: 12.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
