import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';
import { Card, Pill, ProgressBar } from './UI';
import { fmtDate, fmtMoney, paidPct, resaleEligibility } from '../lib/format';
import type { Currency, Property } from '../types';

export function PropertyCard({
  property,
  currency,
  fxRate,
  onPress,
}: {
  property: Property;
  currency: Currency;
  fxRate: number;
  onPress: () => void;
}) {
  const { colors, radii } = useTheme();
  const pct = paidPct(property);
  const resale = resaleEligibility(property);

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Card style={{ marginBottom: 12 }}>
        <View style={styles.topRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
              {property.project_name}
            </Text>
            <View style={styles.metaLine}>
              <Icon name="developer" size={13} color={colors.inkFaint} />
              <Text style={[styles.dev, { color: colors.inkDim }]} numberOfLines={1}>
                {' '}
                {property.developer} ·{' '}
              </Text>
              <Icon name="location" size={13} color={colors.inkFaint} />
              <Text style={[styles.dev, { color: colors.inkDim }]} numberOfLines={1}>
                {' '}
                {property.location || ''}
              </Text>
            </View>
          </View>
          <View style={styles.badgeRow}>
            <Pill label={property.status} tone="accent" />
            {resale.eligible && <Pill label="Resale ready" tone="good" />}
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name="bed" size={13} color={colors.inkFaint} />
            <Text style={[styles.metaText, { color: colors.inkDim }]}>
              {' '}
              <Text style={{ fontWeight: '700', color: colors.ink }}>{property.unit_type || ''}</Text>
              {property.bedrooms ? ` · ${Math.trunc(property.bedrooms)} BR` : ''}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="calendar" size={13} color={colors.inkFaint} />
            <Text style={[styles.metaText, { color: colors.inkDim }]}>
              {' '}
              Handover <Text style={{ fontWeight: '700', color: colors.ink }}>{fmtDate(property.handover_date)}</Text>
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          <View style={styles.progressLabels}>
            <Text style={{ fontSize: 11.5, color: colors.inkFaint }}>{fmtMoney(property.total_paid_aed, currency, fxRate)} paid</Text>
            <Text style={{ fontSize: 11.5, color: colors.inkFaint }}>{pct}%</Text>
          </View>
          <ProgressBar pct={pct} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  name: { fontSize: 16, fontWeight: '700' },
  metaLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 3 },
  dev: { fontSize: 12.5 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 12, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
});
