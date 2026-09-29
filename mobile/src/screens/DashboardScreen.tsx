import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../context/AppDataContext';
import { Card, EmptyNote, ProgressBar, SectionTitle } from '../components/UI';
import { Screen } from '../components/Screen';
import { PayRow } from '../components/PayRow';
import { DashboardSkeleton } from '../components/Skeleton';
import { fmtMoney, milestoneState } from '../lib/format';
import type { Currency } from '../types';

function CurrencyToggle({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  const { colors, radii } = useTheme();
  return (
    <View style={[styles.toggle, { borderColor: colors.border, borderRadius: radii.sm }]}>
      {(['AED', 'INR'] as Currency[]).map((c) => (
        <TouchableOpacity
          key={c}
          activeOpacity={0.7}
          onPress={() => onChange(c)}
          style={[styles.toggleBtn, value === c && { backgroundColor: colors.accent }]}
        >
          <Text style={[styles.toggleText, { color: value === c ? colors.accentInk : colors.inkDim }]}>{c}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function DashboardScreen() {
  const { colors } = useTheme();
  const { profile, portfolios, currentPortfolioId, properties, milestones, fxRate, currency, setCurrency, refresh, loading } =
    useAppData();
  const [refreshing, setRefreshing] = useState(false);

  const portfolio = portfolios.find((p) => p.id === currentPortfolioId);

  const totals = useMemo(() => {
    let totalValue = 0,
      totalPaid = 0,
      totalPending = 0;
    properties.forEach((p) => {
      totalValue += Number(p.total_unit_price_aed || 0);
      totalPaid += Number(p.total_paid_aed || 0);
      totalPending += Number(p.total_pending_aed || 0);
    });
    const pct = totalValue > 0 ? Math.round((totalPaid / totalValue) * 100) : 0;
    return { totalValue, totalPaid, totalPending, pct };
  }, [properties]);

  const upcoming = useMemo(() => {
    return milestones
      .filter((m) => m.status !== 'Paid')
      .slice()
      .sort((a, b) => new Date(a.due_date || '2099-01-01').getTime() - new Date(b.due_date || '2099-01-01').getTime())
      .slice(0, 5);
  }, [milestones]);

  const maxVal = Math.max(1, ...properties.map((p) => Number(p.total_unit_price_aed || 0)));

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // First load (or a portfolio switch, which clears properties before refetching) — show
  // the skeleton instead of an empty dashboard. A pull-to-refresh on already-loaded data
  // keeps its own RefreshControl spinner and skips this.
  if (loading && properties.length === 0 && !refreshing) {
    return (
      <Screen>
        <ScrollView style={{ flex: 1 }}>
          <DashboardSkeleton />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={[styles.greet, { color: colors.inkDim }]}>
        Welcome back, <Text style={{ color: colors.ink, fontWeight: '700' }}>{profile?.full_name}</Text>
      </Text>
      {portfolio && (
        <Text style={{ color: colors.inkFaint, fontSize: 12, marginTop: 2 }}>{portfolio.name}</Text>
      )}

      <View style={[styles.sectionHeaderRow]}>
        <Text style={[styles.sectionTitleText, { color: colors.inkFaint }]}>PORTFOLIO SUMMARY</Text>
        <CurrencyToggle value={currency} onChange={setCurrency} />
      </View>

      <View style={styles.tiles}>
        <Card style={styles.tileWide}>
          <Text style={[styles.tileLabel, { color: colors.inkDim }]}>Total portfolio value</Text>
          <Text style={[styles.tileValue, { color: colors.ink }]}>{fmtMoney(totals.totalValue, currency, fxRate)}</Text>
          <View style={styles.progressRow}>
            <ProgressBar pct={totals.pct} />
            <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 12, minWidth: 34, textAlign: 'right' }}>
              {totals.pct}%
            </Text>
          </View>
          <Text style={{ color: colors.inkFaint, fontSize: 12, marginTop: 5 }}>
            {fmtMoney(totals.totalPaid, currency, fxRate)} paid of {fmtMoney(totals.totalValue, currency, fxRate)}
          </Text>
        </Card>
        <Card style={styles.tileHalf}>
          <Text style={[styles.tileLabel, { color: colors.inkDim }]}>Paid to date</Text>
          <Text style={[styles.tileValue, { color: colors.accent }]}>{fmtMoney(totals.totalPaid, currency, fxRate)}</Text>
        </Card>
        <Card style={styles.tileHalf}>
          <Text style={[styles.tileLabel, { color: colors.inkDim }]}>Remaining</Text>
          <Text style={[styles.tileValue, { color: colors.ink }]}>{fmtMoney(totals.totalPending, currency, fxRate)}</Text>
        </Card>
        <Card style={styles.tileHalf}>
          <Text style={[styles.tileLabel, { color: colors.inkDim }]}>Properties</Text>
          <Text style={[styles.tileValue, { color: colors.ink }]}>{properties.length}</Text>
        </Card>
        <Card style={styles.tileHalf}>
          <Text style={[styles.tileLabel, { color: colors.inkDim }]}>FX rate</Text>
          <Text style={[styles.tileValue, { color: colors.ink, fontSize: 16 }]}>1 AED = ₹{fxRate}</Text>
        </Card>
      </View>

      {properties.length > 0 && (
        <>
          <SectionTitle>PAID VS. REMAINING, BY PROPERTY</SectionTitle>
          <Card>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                <Text style={{ color: colors.inkDim, fontSize: 12 }}>Paid</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
                <Text style={{ color: colors.inkDim, fontSize: 12 }}>Remaining</Text>
              </View>
            </View>
            {properties.map((p) => {
              const paid = Number(p.total_paid_aed || 0);
              const pend = Number(p.total_pending_aed || 0);
              const paidW = (paid / maxVal) * 100;
              const pendW = (pend / maxVal) * 100;
              return (
                <View key={p.id} style={{ marginBottom: 10 }}>
                  <View style={styles.chartRowHeader}>
                    <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 12 }} numberOfLines={1}>
                      {p.project_name}
                    </Text>
                    <Text style={{ color: colors.inkDim, fontSize: 12 }}>{fmtMoney(paid + pend, currency, fxRate)}</Text>
                  </View>
                  <View style={[styles.chartBarTrack, { backgroundColor: colors.surface2 }]}>
                    <View style={{ width: `${paidW}%`, backgroundColor: colors.accent }} />
                    <View style={{ width: `${pendW}%`, backgroundColor: colors.border }} />
                  </View>
                </View>
              );
            })}
          </Card>
        </>
      )}

      <SectionTitle>UPCOMING PAYMENTS</SectionTitle>
      <Card>
        {upcoming.length ? (
          upcoming.map((m, i) => (
            <View key={m.id} style={i > 0 ? { borderTopWidth: 1, borderColor: colors.border } : undefined}>
              <PayRow
                milestone={m}
                property={properties.find((p) => p.id === m.property_id)}
                state={milestoneState(m)}
                currency={currency}
                fxRate={fxRate}
              />
            </View>
          ))
        ) : (
          <EmptyNote>No upcoming payments — everything on this portfolio is settled.</EmptyNote>
        )}
      </Card>
    </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  greet: { fontSize: 13 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  sectionTitleText: { fontSize: 12.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  toggle: { flexDirection: 'row', borderWidth: 1, overflow: 'hidden' },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 9, minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  toggleText: { fontSize: 12, fontWeight: '700' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tileWide: { width: '100%' },
  tileHalf: { flexBasis: '47%', flexGrow: 1 },
  tileLabel: { fontSize: 12, fontWeight: '600' },
  tileValue: { fontSize: 22, fontWeight: '700', marginTop: 6 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  chartRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, gap: 8 },
  chartBarTrack: { flexDirection: 'row', height: 16, borderRadius: 6, overflow: 'hidden' },
});
