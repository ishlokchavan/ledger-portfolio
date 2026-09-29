import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Icon } from './Icon';
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
  tone?: 'accent' | 'good' | 'neutral' | 'warn' | 'bad' | 'info';
}) {
  const { colors, radii } = useTheme();
  const map = {
    accent: [colors.accentSoft, colors.accent],
    good: [colors.goodSoft, colors.good],
    neutral: [colors.surface2, colors.inkDim],
    warn: [colors.warnSoft, colors.warn],
    bad: [colors.badSoft, colors.bad],
    info: [colors.infoSoft, colors.info],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
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

/** Circular progress ring with a centred percentage. `onHero` uses light-on-dark colours. */
export function Ring({ pct, size = 96, stroke = 9, onHero = false, label = 'paid' }: { pct: number; size?: number; stroke?: number; onHero?: boolean; label?: string }) {
  const { colors } = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const track = onHero ? 'rgba(255,255,255,0.16)' : colors.surface3;
  const prog = onHero ? '#7ff0dc' : colors.accent;
  const fg = onHero ? '#f0faf8' : colors.ink;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={prog}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c}`}
          strokeDashoffset={c * (1 - clamped / 100)}
        />
      </Svg>
      <Text style={{ color: fg, fontSize: size * 0.24, fontWeight: '700' }}>{Math.round(clamped)}%</Text>
      <Text style={{ color: fg, opacity: 0.7, fontSize: 9.5, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

/** Segmented control for small option sets (currency, theme, view). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  accent = false,
}: {
  value: T;
  options: { id: T; label: string; icon?: React.ComponentProps<typeof Icon>['name'] }[];
  onChange: (v: T) => void;
  accent?: boolean;
}) {
  const { colors, radii } = useTheme();
  return (
    <View style={{ flexDirection: 'row', padding: 3, gap: 2, backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: 1, borderRadius: radii.md }}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <TouchableOpacity
            key={o.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            activeOpacity={0.7}
            onPress={() => onChange(o.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              minHeight: 34,
              borderRadius: radii.sm,
              justifyContent: 'center',
              backgroundColor: active ? (accent ? colors.accent : colors.surface) : 'transparent',
            }}
          >
            {o.icon && <Icon name={o.icon} size={14} color={active ? (accent ? colors.accentInk : colors.ink) : colors.inkDim} />}
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: active ? (accent ? colors.accentInk : colors.ink) : colors.inkDim }}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** Pill-shaped filter chip with an optional count. */
export function Chip({ label, count, active, onPress }: { label: string; count?: number; active: boolean; onPress: () => void }) {
  const { colors, radii } = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 14,
        minHeight: 36,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: active ? colors.ink : colors.borderStrong,
        backgroundColor: active ? colors.ink : colors.surface,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? colors.bg : colors.inkDim }}>{label}</Text>
      {count != null && <Text style={{ fontSize: 11, fontWeight: '700', color: active ? colors.bg : colors.inkFaint, opacity: 0.7 }}>{count}</Text>}
    </TouchableOpacity>
  );
}

export function SearchField({ value, onChangeText, placeholder }: { value: string; onChangeText: (t: string) => void; placeholder: string }) {
  const { colors, radii } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        minHeight: 46,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        backgroundColor: colors.surface,
      }}
    >
      <Icon name="search" size={18} color={colors.inkFaint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessibilityLabel={placeholder}
        style={{ flex: 1, color: colors.ink, fontSize: 15, paddingVertical: 10 }}
      />
      {value.length > 0 && (
        <TouchableOpacity accessibilityLabel="Clear search" onPress={() => onChangeText('')} hitSlop={10}>
          <Icon name="x" size={16} color={colors.inkFaint} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: colors.ink, fontSize: 28, fontWeight: '700', letterSpacing: -0.4 }}>{title}</Text>
      {subtitle ? <Text style={{ color: colors.inkDim, fontSize: 14, marginTop: 4 }}>{subtitle}</Text> : null}
    </View>
  );
}
