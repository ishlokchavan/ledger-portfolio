import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';
import { Card, Pill, ProgressBar } from './UI';
import { coverColors, daysUntil, fmtCompact, fmtDate, fmtMoney, milestoneState, paidPct, relDays, resaleEligibility } from '../lib/format';
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
  const { colors, radii } = useTheme();
  const pct = paidPct(property);
  const resale = resaleEligibility(property);
  const [c1] = coverColors(property);
  const ns = next ? milestoneState(next) : null;
  const nextBg = ns === 'overdue' ? colors.badSoft : ns === 'soon' ? colors.warnSoft : colors.surface2;
  const nextFg = ns === 'overdue' ? colors.bad : colors.ink;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${property.project_name}, ${pct}% paid`}>
      <Card style={{ marginBottom: 14, padding: 0, overflow: 'hidden' }}>
        <View style={[styles.cover, { backgroundColor: c1 }]}>
          <View style={styles.coverPill}><Text style={styles.coverPillText}>{property.status || 'Property'}</Text></View>
          {resale.eligible && (
            <View style={styles.coverPill}>
              <Icon name="resale" size={12} color="#fff" />
              <Text style={styles.coverPillText}>Resale ready</Text>
            </View>
          )}
        </View>
        <View style={styles.body}>
          <Text style={[styles.name, { color: colors.ink }]} numberOfLines={2}>{property.project_name}</Text>
          <View style={styles.metaLine}>
            <Icon name="developer" size={13} color={colors.inkFaint} />
            <Text style={[styles.dev, { color: colors.inkDim }]} numberOfLines={1}> {property.developer || '—'}   </Text>
            <Icon name="location" size={13} color={colors.inkFaint} />
            <Text style={[styles.dev, { color: colors.inkDim }]} numberOfLines={1}> {property.location || '—'}</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="bed" size={14} color={colors.inkFaint} />
              <Text style={[styles.metaText, { color: colors.inkDim }]}>
                {' '}<Text style={{ fontWeight: '700', color: colors.ink }}>{property.unit_type || '—'}</Text>
                {property.bedrooms ? ` · ${Math.trunc(property.bedrooms)} BR` : ''}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="calendar" size={14} color={colors.inkFaint} />
              <Text style={[styles.metaText, { color: colors.inkDim }]}>
                {' '}Handover <Text style={{ fontWeight: '700', color: colors.ink }}>{fmtDate(property.handover_date)}</Text>
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <View style={styles.progressLabels}>
              <Text style={{ fontSize: 12, color: colors.inkDim }}>
                <Text style={{ color: colors.ink, fontWeight: '700' }}>{fmtMoney(property.total_paid_aed, currency, fxRate)}</Text> paid
              </Text>
              <Text style={{ fontSize: 12, color: colors.inkDim }}>{pct}% of {fmtCompact(property.total_unit_price_aed, currency, fxRate)}</Text>
            </View>
            <ProgressBar pct={pct} />
          </View>

          <View style={[styles.next, { backgroundColor: nextBg, borderRadius: radii.md }]}>
            <Icon name={ns === 'overdue' ? 'alert' : next ? 'clock' : 'check'} size={16} color={ns === 'overdue' ? colors.bad : colors.inkFaint} />
            {next ? (
              <>
                <Text style={{ flex: 1, color: colors.inkDim, fontSize: 12.5 }} numberOfLines={1}>
                  <Text style={{ color: nextFg, fontWeight: '700' }}>{relDays(daysUntil(next.due_date))}</Text> · {next.milestone_event}
                </Text>
                <Text style={{ color: colors.ink, fontSize: 12.5, fontWeight: '700' }}>{fmtCompact(next.amount_aed, currency, fxRate)}</Text>
              </>
            ) : (
              <Text style={{ flex: 1, color: colors.inkDim, fontSize: 12.5 }}>
                {Number(property.total_pending_aed) > 0 ? 'Remaining milestones have no date yet' : 'Fully paid'}
              </Text>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cover: { height: 64, paddingHorizontal: 16, paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  coverPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  coverPillText: { color: '#fff', fontSize: 10.5, fontWeight: '700', letterSpacing: 0.2 },
  body: { padding: 16 },
  name: { fontSize: 19, fontWeight: '700', letterSpacing: -0.2 },
  metaLine: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  dev: { fontSize: 12.5, flexShrink: 1 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 12, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12.5 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  next: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 11, marginTop: 14 },
});
