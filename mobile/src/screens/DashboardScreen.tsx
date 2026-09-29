import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../context/AppDataContext';
import { Card, EmptyNote, ProgressBar, Ring } from '../components/UI';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { PayRow } from '../components/PayRow';
import { DashboardSkeleton } from '../components/Skeleton';
import {
  daysUntil,
  firstName,
  fmtCompact,
  fmtDate,
  fmtMoney,
  greeting,
  milestoneState,
  paidPct,
  plural,
  resaleEligibility,
} from '../lib/format';
import type { RootTabParamList } from '../navigation/types';
import type { MilestoneState, PaymentMilestone } from '../types';

type Tone = 'bad' | 'warn' | 'good' | 'info' | 'dim';

function byDue(a: PaymentMilestone, b: PaymentMilestone) {
  return new Date(a.due_date || '2099-01-01').getTime() - new Date(b.due_date || '2099-01-01').getTime();
}
const sum = (list: PaymentMilestone[]) => list.reduce((a, m) => a + Number(m.amount_aed || 0), 0);

export function DashboardScreen() {
  const { colors, radii } = useTheme();
  const nav = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { profile, portfolios, currentPortfolioId, properties, milestones, fxRate, currency, refresh, loading } = useAppData();
  const [refreshing, setRefreshing] = useState(false);

  const portfolio = portfolios.find((p) => p.id === currentPortfolioId);
  const money = (v: number) => fmtMoney(v, currency, fxRate);
  const compact = (v: number) => fmtCompact(v, currency, fxRate);

  const totals = useMemo(() => {
    let value = 0, paid = 0, pending = 0;
    properties.forEach((p) => {
      value += Number(p.total_unit_price_aed || 0);
      paid += Number(p.total_paid_aed || 0);
      pending += Number(p.total_pending_aed || 0);
    });
    return { value, paid, pending, pct: value > 0 ? (paid / value) * 100 : 0 };
  }, [properties]);

  const buckets = useMemo(() => {
    const b: Record<MilestoneState, PaymentMilestone[]> = { overdue: [], soon: [], upcoming: [], undecided: [], paid: [] };
    milestones.forEach((m) => b[milestoneState(m)].push(m));
    return b;
  }, [milestones]);

  const upcoming = useMemo(() => milestones.filter((m) => m.status !== 'Paid').sort(byDue).slice(0, 5), [milestones]);
  const nextPay = useMemo(() => milestones.filter((m) => m.status !== 'Paid' && m.due_date).sort(byDue)[0], [milestones]);
  const due90 = useMemo(
    () =>
      milestones.filter((m) => {
        const d = daysUntil(m.due_date);
        return m.status !== 'Paid' && d !== null && d >= 0 && d <= 90;
      }),
    [milestones]
  );
  const resaleReady = useMemo(() => properties.filter((p) => resaleEligibility(p).eligible), [properties]);
  const nextHandover = useMemo(
    () =>
      properties
        .filter((p) => p.handover_date && (daysUntil(p.handover_date) ?? -1) >= 0)
        .sort((a, b) => new Date(a.handover_date!).getTime() - new Date(b.handover_date!).getTime())[0],
    [properties]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (loading && properties.length === 0 && !refreshing) {
    return (
      <Screen>
        <ScrollView style={{ flex: 1 }}>
          <DashboardSkeleton />
        </ScrollView>
      </Screen>
    );
  }

  const attention: { tone: Tone; icon: React.ComponentProps<typeof Icon>['name']; title: string; sub: string; onPress: () => void }[] = [];
  if (buckets.overdue.length)
    attention.push({ tone: 'bad', icon: 'alert', title: plural(buckets.overdue.length, 'overdue payment'), sub: `${money(sum(buckets.overdue))} needs attention now`, onPress: () => nav.navigate('Payments') });
  if (buckets.soon.length)
    attention.push({ tone: 'warn', icon: 'clock', title: `${plural(buckets.soon.length, 'payment')} due within 30 days`, sub: `${money(sum(buckets.soon))} total`, onPress: () => nav.navigate('Payments') });
  if (buckets.undecided.length)
    attention.push({ tone: 'dim', icon: 'calendar', title: `${plural(buckets.undecided.length, 'milestone')} without a date`, sub: 'Due dates are still to be confirmed', onPress: () => nav.navigate('Payments') });
  if (resaleReady.length)
    attention.push({ tone: 'good', icon: 'resale', title: `${plural(resaleReady.length, 'unit')} resale-ready`, sub: resaleReady.slice(0, 2).map((p) => p.project_name).join(', '), onPress: () => nav.navigate('Properties', { screen: 'PropertiesList' }) });
  if (nextHandover)
    attention.push({ tone: 'info', icon: 'developer', title: `Next handover: ${nextHandover.project_name}`, sub: fmtDate(nextHandover.handover_date), onPress: () => nav.navigate('Properties', { screen: 'PropertiesList' }) });

  const toneBg = (t: Tone) => ({ bad: colors.badSoft, warn: colors.warnSoft, good: colors.goodSoft, info: colors.infoSoft, dim: colors.surface2 }[t]);
  const toneFg = (t: Tone) => ({ bad: colors.bad, warn: colors.warn, good: colors.good, info: colors.info, dim: colors.inkDim }[t]);

  const nd = nextPay ? daysUntil(nextPay.due_date) : null;
  const nextProp = nextPay ? properties.find((p) => p.id === nextPay.property_id) : undefined;
  const nextTone = nd !== null && nd < 0 ? colors.bad : nd !== null && nd <= 30 ? colors.warn : colors.ink;
  const maxVal = Math.max(1, ...properties.map((p) => Number(p.total_unit_price_aed || 0)));

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <Text style={[styles.h1, { color: colors.ink }]}>
          {greeting()}, {firstName(profile?.full_name)}
        </Text>
        <Text style={{ color: colors.inkDim, fontSize: 14, marginTop: 4, marginBottom: 16 }}>
          {portfolio ? `${portfolio.name} · ` : ''}here is where your portfolio stands today.
        </Text>

        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.heroA, borderRadius: radii.xl }]}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>Total portfolio value</Text>
              <Text style={styles.heroValue} adjustsFontSizeToFit numberOfLines={1}>
                {money(totals.value)}
              </Text>
              <Text style={styles.heroSub}>{plural(properties.length, 'property', 'properties')}</Text>
            </View>
            <Ring pct={totals.pct} size={92} stroke={9} onHero />
          </View>
          <View style={styles.heroStats}>
            {[
              ['Paid to date', compact(totals.paid)],
              ['Remaining', compact(totals.pending)],
              ['Next 90 days', compact(sum(due90))],
            ].map(([k, v]) => (
              <View key={k} style={styles.heroStat}>
                <Text style={styles.heroStatK}>{k}</Text>
                <Text style={styles.heroStatV} numberOfLines={1} adjustsFontSizeToFit>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Next payment */}
        <Card style={{ marginTop: 14, padding: 20 }}>
          <View style={styles.eyebrowRow}>
            <Icon name="clock" size={14} color={colors.inkFaint} />
            <Text style={[styles.eyebrow, { color: colors.inkFaint }]}>NEXT PAYMENT</Text>
          </View>
          {nextPay && nd !== null ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
                <Text style={{ color: nextTone, fontSize: 52, fontWeight: '700', letterSpacing: -1.5 }}>{Math.abs(nd)}</Text>
                <Text style={{ color: colors.inkDim, fontSize: 14, fontWeight: '600' }}>
                  {nd < 0 ? (Math.abs(nd) === 1 ? 'day late' : 'days late') : nd === 0 ? 'due today' : nd === 1 ? 'day left' : 'days left'}
                </Text>
              </View>
              <Text style={{ color: colors.ink, fontSize: 19, fontWeight: '700', marginTop: 10, fontVariant: ['tabular-nums'] }}>
                {money(Number(nextPay.amount_aed || 0))}
              </Text>
              <Text style={{ color: colors.inkDim, fontSize: 13.5, marginTop: 4 }}>
                <Text style={{ color: colors.ink, fontWeight: '700' }}>{nextProp?.project_name}</Text>
                {'\n'}
                {nextPay.milestone_event} · {fmtDate(nextPay.due_date)}
              </Text>
            </>
          ) : (
            <Text style={{ color: colors.inkDim, fontSize: 14, marginTop: 12, lineHeight: 21 }}>Nothing scheduled. Every dated milestone is settled.</Text>
          )}
        </Card>

        {/* KPIs */}
        <View style={styles.kpis}>
          <Kpi label="Paid to date" value={compact(totals.paid)} sub={`${Math.round(totals.pct)}% of total value`} icon="check" tone="good" />
          <Kpi
            label="Remaining"
            value={compact(totals.pending)}
            sub={`across ${plural(buckets.overdue.length + buckets.soon.length + buckets.upcoming.length + buckets.undecided.length, 'milestone')}`}
            icon="payments"
            tone="accent"
          />
          <Kpi
            label={buckets.overdue.length ? 'Overdue' : 'Due in 30 days'}
            value={compact(sum(buckets.overdue.length ? buckets.overdue : buckets.soon))}
            sub={plural((buckets.overdue.length ? buckets.overdue : buckets.soon).length, 'payment')}
            icon={buckets.overdue.length ? 'alert' : 'clock'}
            tone={buckets.overdue.length ? 'bad' : 'warn'}
            valueColor={buckets.overdue.length ? colors.bad : undefined}
            onPress={() => nav.navigate('Payments')}
          />
          <Kpi label="Resale-ready" value={`${resaleReady.length} of ${properties.length}`} sub="eligible for resale NOC" icon="resale" tone="good" onPress={() => nav.navigate('Properties', { screen: 'PropertiesList' })} />
        </View>

        {/* Needs attention */}
        <Text style={[styles.sectionTitle, { color: colors.inkFaint }]}>NEEDS ATTENTION</Text>
        <Card style={{ padding: 8 }}>
          {attention.length ? (
            attention.map((a, i) => (
              <TouchableOpacity key={i} activeOpacity={0.7} onPress={a.onPress} style={styles.attRow}>
                <View style={[styles.attIcon, { backgroundColor: toneBg(a.tone) }]}>
                  <Icon name={a.icon} size={18} color={toneFg(a.tone)} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: colors.ink, fontSize: 13.5, fontWeight: '700' }} numberOfLines={1}>{a.title}</Text>
                  <Text style={{ color: colors.inkDim, fontSize: 12 }} numberOfLines={1}>{a.sub}</Text>
                </View>
                <Icon name="chevronRight" size={16} color={colors.inkFaint} />
              </TouchableOpacity>
            ))
          ) : (
            <EmptyNote>You are all caught up.</EmptyNote>
          )}
        </Card>

        {/* By property */}
        {properties.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.inkFaint }]}>BY PROPERTY</Text>
            <Card>
              {properties.map((p, i) => {
                const paid = Number(p.total_paid_aed || 0);
                const pend = Number(p.total_pending_aed || 0);
                const width = Math.max(8, ((paid + pend) / maxVal) * 100);
                return (
                  <View key={p.id} style={[{ paddingVertical: 11 }, i > 0 && { borderTopWidth: 1, borderColor: colors.border }]}>
                    <View style={styles.allocTop}>
                      <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 13, flex: 1 }} numberOfLines={1}>{p.project_name}</Text>
                      <Text style={{ color: colors.inkDim, fontSize: 12, fontVariant: ['tabular-nums'] }}>
                        {compact(paid + pend)} · {paidPct(p)}%
                      </Text>
                    </View>
                    <View style={{ width: `${width}%` }}>
                      <ProgressBar pct={paidPct(p)} height={10} />
                    </View>
                  </View>
                );
              })}
            </Card>
          </>
        )}

        <Text style={[styles.sectionTitle, { color: colors.inkFaint }]}>UPCOMING PAYMENTS</Text>
        <Card>
          {upcoming.length ? (
            upcoming.map((m, i) => (
              <View key={m.id} style={i > 0 ? { borderTopWidth: 1, borderColor: colors.border } : undefined}>
                <PayRow milestone={m} property={properties.find((p) => p.id === m.property_id)} state={milestoneState(m)} currency={currency} fxRate={fxRate} />
              </View>
            ))
          ) : (
            <EmptyNote>Nothing upcoming — every milestone on this portfolio is settled.</EmptyNote>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon,
  tone,
  onPress,
  valueColor,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  tone: 'good' | 'accent' | 'bad' | 'warn';
  onPress?: () => void;
  valueColor?: string;
}) {
  const { colors } = useTheme();
  const bg = { good: colors.goodSoft, accent: colors.accentSoft, bad: colors.badSoft, warn: colors.warnSoft }[tone];
  const fg = { good: colors.good, accent: colors.accent, bad: colors.bad, warn: colors.warn }[tone];
  const body = (
    <Card style={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.inkDim, fontSize: 12, fontWeight: '600' }}>{label}</Text>
        <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={15} color={fg} />
        </View>
      </View>
      <Text style={{ color: valueColor ?? colors.ink, fontSize: 21, fontWeight: '700', marginTop: 10 }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={{ color: colors.inkFaint, fontSize: 11.5, marginTop: 4 }} numberOfLines={1}>{sub}</Text>
    </Card>
  );
  return (
    <View style={{ flexBasis: '47%', flexGrow: 1 }}>
      {onPress ? (
        <TouchableOpacity activeOpacity={0.75} onPress={onPress}>{body}</TouchableOpacity>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  hero: { padding: 22 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  heroLabel: { color: 'rgba(240,250,248,0.66)', fontSize: 12.5, fontWeight: '600' },
  heroValue: { color: '#f0faf8', fontSize: 34, fontWeight: '700', marginTop: 6, letterSpacing: -0.8 },
  heroSub: { color: 'rgba(240,250,248,0.66)', fontSize: 13, marginTop: 6 },
  heroStats: { flexDirection: 'row', gap: 8, marginTop: 20 },
  heroStat: { flex: 1, minWidth: 0, padding: 11, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.09)' },
  heroStatK: { color: 'rgba(240,250,248,0.66)', fontSize: 10.5, fontWeight: '600' },
  heroStatV: { color: '#f0faf8', fontSize: 14, fontWeight: '700', marginTop: 3, fontVariant: ['tabular-nums'] },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.7 },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.7, marginTop: 24, marginBottom: 10 },
  attRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, minHeight: 56 },
  attIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  allocTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 8 },
});
