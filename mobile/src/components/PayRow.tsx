import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';
import { daysUntil, fmtDate, fmtMoney } from '../lib/format';
import type { Currency, MilestoneState, PaymentMilestone, Property } from '../types';

export function PayRow({
  milestone,
  property,
  state,
  currency,
  fxRate,
  showDate = false,
}: {
  milestone: PaymentMilestone;
  property: Property | undefined;
  state: MilestoneState;
  currency: Currency;
  fxRate: number;
  showDate?: boolean;
}) {
  const { colors, radii } = useTheme();
  const d = daysUntil(milestone.due_date);

  let boxBg = colors.surface2;
  let numColor = colors.ink;
  let label: string | number = '—';
  let sub = 'TBD';

  if (state === 'paid') {
    boxBg = colors.goodSoft;
    numColor = colors.good;
    label = '✓';
    sub = 'PAID';
  } else if (state === 'undecided') {
    label = '—';
    sub = 'TBD';
  } else if (d != null) {
    if (state === 'overdue') {
      boxBg = colors.badSoft;
      numColor = colors.bad;
      label = Math.abs(d);
      sub = 'LATE';
    } else if (state === 'soon') {
      boxBg = colors.warnSoft;
      numColor = colors.warn;
      label = d;
      sub = d === 0 ? 'TODAY' : 'DAYS';
    } else {
      label = d;
      sub = 'DAYS';
    }
  }

  return (
    <View style={styles.row}>
      <View style={[styles.daysBox, { backgroundColor: boxBg, borderRadius: radii.sm }]}>
        <Text style={[styles.daysNum, { color: numColor }]}>{label}</Text>
        <Text style={[styles.daysSub, { color: colors.inkFaint }]}>{sub}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.propName, { color: colors.ink }]} numberOfLines={1}>
          {property ? property.project_name : ''}
        </Text>
        <View style={styles.milestoneLine}>
          <Icon name="calendar" size={12} color={colors.inkFaint} />
          <Text style={[styles.milestoneText, { color: colors.inkDim, flexShrink: 1 }]} numberOfLines={1}>
            {' '}
            {milestone.milestone_event}
            {showDate && milestone.due_date ? ` · ${fmtDate(milestone.due_date)}` : ''}
          </Text>
        </View>
      </View>
      <Text style={[styles.amount, { color: colors.ink }]}>{fmtMoney(milestone.amount_aed, currency, fxRate)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  daysBox: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  daysNum: { fontSize: 15, fontWeight: '700' },
  daysSub: { fontSize: 8.5, textTransform: 'uppercase', marginTop: 2, letterSpacing: 0.3 },
  propName: { fontSize: 13.5, fontWeight: '700' },
  milestoneLine: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  milestoneText: { fontSize: 12 },
  amount: { fontSize: 13.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
