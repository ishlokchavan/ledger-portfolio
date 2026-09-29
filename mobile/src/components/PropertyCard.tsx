import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';
import { Card, Pill, ProgressBar } from './UI';
import { daysUntil, fmtCompact, fmtDate, fmtMoney, milestoneState, paidPct, relDays, resaleEligibility } from '../lib/format';
import type { Currency, PaymentMilestone, Property } from '../types';

export function PropertyCard({
  property,
  next,
  currency,
  fxRate,
  onPress,
}: {
  property: Property;
  /** Earliest unpaid dated milestone for this property, if any. */
  next: PaymentMilestone | null;
  currency: Currency;
  fxRate: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const pct = paidPct(property);
  const resale = resaleEligibility(property);
  const ns = next ? milestoneState(next) : null;
  const dot = ns === 'overdue' ? colors.bad : ns === 'soon' ? colors.warn : next ? colors.inkFaint : colors.good;
  const nextTone = ns === 'overdue' ? colors.bad : ns === 'soon' ? colors.warn : colors.ink;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${property.project_name}, ${pct}% paid`}>
      <Card style={{ marginBottom: 12, padding: 18, gap: 14 }}>
        <View style={styles.head}>
          <View style={[styles.icon, { backgroundColor: colors.surface2 }]}>
            <Icon name="properties" size={20} color={colors.inkDim} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.name, { color: colors.ink }]} numberOfLines={2}>{property.project_name}</Text>
            <Text style={{ color: colors.inkDim, fontSize: 12.5, marginTop: 3 }} numberOfLines={1}>
              {property.developer || '—'} · {property.location || '—'}
            </Text>
          </View>
        </View>

        <View style={styles.facts}>
          <Pill label={property.status || '—'} tone="neutral" />
          {resale.eligible && <Pill label="Resale ready" tone="good" />}
          <Text style={{ color: colors.inkDim, fontSize: 12.5 }}>
            <Text style={{ color: colors.ink, fontWeight: '700' }}>{property.unit_type || '—'}</Text>
            {property.bedrooms ? ` · ${Math.trunc(property.bedrooms)} BR` : ''}
          </Text>
          <Text style={{ color: colors.inkDim, fontSize: 12.5 }}>
            Handover <Text style={{ color: colors.ink, fontWeight: '700' }}>{fmtDate(property.handover_date)}</Text>
          </Text>
        </View>

        <View>
          <View style={styles.progressLabels}>
            <Text style={{ fontSize: 12.5, color: colors.inkDim }}>
              <Text style={{ color: colors.ink, fontWeight: '700' }}>{fmtMoney(property.total_paid_aed, currency, fxRate)}</Text> paid
            </Text>
            <Text style={{ fontSize: 12.5, color: colors.inkDim }}>{pct}% of {fmtCompact(property.total_unit_price_aed, currency, fxRate)}</Text>
          </View>
          <ProgressBar pct={pct} />
        </View>

        <View style={[styles.next, { borderColor: colors.border }]}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} />
          {next ? (
            <>
              <Text style={{ flex: 1, color: colors.inkDim, fontSize: 12.5 }} numberOfLines={1}>
                <Text style={{ color: nextTone, fontWeight: '700' }}>{relDays(daysUntil(next.due_date))}</Text> · {next.milestone_event}
              </Text>
              <Text style={{ color: colors.ink, fontSize: 12.5, fontWeight: '700' }}>{fmtCompact(next.amount_aed, currency, fxRate)}</Text>
            </>
          ) : (
            <Text style={{ flex: 1, color: colors.inkDim, fontSize: 12.5 }}>
              {Number(property.total_pending_aed) > 0 ? 'Remaining milestones have no date yet' : 'Fully paid'}
            </Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  icon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 8 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  next: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: 14, borderTopWidth: 1 },
});
