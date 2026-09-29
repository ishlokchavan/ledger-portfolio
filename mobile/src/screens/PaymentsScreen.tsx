import React, { useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../context/AppDataContext';
import { Icon } from '../components/Icon';
import { Card, EmptyNote, PageHeader, SearchField } from '../components/UI';
import { Screen } from '../components/Screen';
import { PayRow } from '../components/PayRow';
import { PayListSkeleton } from '../components/Skeleton';
import { fmtCompact, fmtMoney, milestoneState, plural } from '../lib/format';
import type { MilestoneState, PaymentMilestone } from '../types';

interface TabDef {
  id: MilestoneState;
  label: string;
  empty: string;
}

const PAY_TABS: TabDef[] = [
  { id: 'overdue', label: 'Overdue', empty: 'Nothing overdue — you are fully up to date.' },
  { id: 'soon', label: 'Due soon', empty: 'Nothing due in the next 30 days.' },
  { id: 'upcoming', label: 'Upcoming', empty: 'Nothing further out on the schedule.' },
  { id: 'undecided', label: 'Date TBC', empty: 'Every milestone has a confirmed date.' },
  { id: 'paid', label: 'Paid', empty: 'No payments recorded yet.' },
];

const byDue = (a: PaymentMilestone, b: PaymentMilestone) =>
  new Date(a.due_date || '2099-01-01').getTime() - new Date(b.due_date || '2099-01-01').getTime();

export function PaymentsScreen() {
  const { colors, radii } = useTheme();
  const { properties, milestones, currency, fxRate, loading, refresh } = useAppData();
  const [activeTab, setActiveTab] = useState<MilestoneState>('soon');
  const [period, setPeriod] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // All hooks run before any early return (rules of hooks).
  const years = useMemo(() => {
    const set = new Set<number>();
    milestones.forEach((m) => {
      const y = m.year || (m.due_date ? Number(m.due_date.slice(0, 4)) : null);
      if (y) set.add(y);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [milestones]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return milestones.filter((m) => {
      if (period !== 'all') {
        const y = m.year || (m.due_date ? Number(m.due_date.slice(0, 4)) : null);
        if (String(y) !== period) return false;
      }
      if (q) {
        const p = properties.find((x) => x.id === m.property_id);
        if ([m.milestone_event, p?.project_name, m.remarks].join(' ').toLowerCase().indexOf(q) === -1) return false;
      }
      return true;
    });
  }, [milestones, properties, period, query]);

  const buckets = useMemo(() => {
    const b: Record<MilestoneState, PaymentMilestone[]> = { overdue: [], soon: [], upcoming: [], undecided: [], paid: [] };
    filtered.forEach((m) => b[milestoneState(m)].push(m));
    return b;
  }, [filtered]);

  const activeDef = PAY_TABS.find((t) => t.id === activeTab)!;
  const groups = useMemo(() => {
    const list = buckets[activeTab].slice().sort(byDue);
    if (activeTab === 'paid') list.reverse();
    const out: { key: string; label: string; items: PaymentMilestone[] }[] = [];
    list.forEach((m) => {
      const key = m.due_date ? m.due_date.slice(0, 7) : 'none';
      let g = out.find((x) => x.key === key);
      if (!g) {
        const label = m.due_date ? new Date(m.due_date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'No date yet';
        g = { key, label, items: [] };
        out.push(g);
      }
      g.items.push(m);
    });
    return out;
  }, [buckets, activeTab]);

  const sum = (l: PaymentMilestone[]) => l.reduce((a, m) => a + Number(m.amount_aed || 0), 0);
  const dot = (id: MilestoneState) => (id === 'overdue' ? colors.bad : id === 'soon' ? colors.warn : id === 'upcoming' ? colors.info : id === 'paid' ? colors.good : colors.inkFaint);

  if (loading && milestones.length === 0 && properties.length === 0 && !refreshing) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <PageHeader title="Payments" />
          <PayListSkeleton count={5} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <PageHeader title="Payments" subtitle="Every milestone across your portfolio, in one place." />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 14 }}>
          {PAY_TABS.map((t) => {
            const active = t.id === activeTab;
            return (
              <TouchableOpacity
                key={t.id}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setActiveTab(t.id)}
                style={[
                  styles.stat,
                  { backgroundColor: colors.surface, borderColor: active ? colors.ink : colors.border, borderRadius: radii.lg, borderWidth: active ? 1.5 : 1 },
                ]}
              >
                <View style={styles.statTop}>
                  <View style={[styles.statDot, { backgroundColor: dot(t.id) }]} />
                  <Text style={{ color: colors.inkDim, fontSize: 12, fontWeight: '700' }}>{t.label}</Text>
                </View>
                <Text style={{ color: colors.ink, fontSize: 20, fontWeight: '700', marginTop: 8 }}>{fmtCompact(sum(buckets[t.id]), currency, fxRate)}</Text>
                <Text style={{ color: colors.inkFaint, fontSize: 12, marginTop: 3 }}>{plural(buckets[t.id].length, 'payment')}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.toolbar}>
          <View style={{ flex: 1 }}>
            <SearchField value={query} onChangeText={setQuery} placeholder="Search milestone or property" />
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPickerOpen(true)}
            accessibilityLabel="Filter by year"
            style={[styles.periodBtn, { backgroundColor: colors.surface, borderColor: colors.borderStrong, borderRadius: radii.md }]}
          >
            <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '700' }}>{period === 'all' ? 'All years' : period}</Text>
            <Icon name="chevron" size={13} color={colors.inkFaint} />
          </TouchableOpacity>
        </View>

        {groups.length ? (
          <>
            <Text style={{ color: colors.inkDim, fontSize: 12.5, marginBottom: 10, marginLeft: 2 }}>
              {plural(buckets[activeTab].length, 'payment')} · <Text style={{ color: colors.ink, fontWeight: '700' }}>{fmtMoney(sum(buckets[activeTab]), currency, fxRate)}</Text>
            </Text>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {groups.map((g, gi) => (
                <View key={g.key}>
                  <View style={[styles.monthHead, { backgroundColor: colors.surface2 }, gi > 0 && { borderTopWidth: 1, borderColor: colors.border }]}>
                    <Text style={{ color: colors.inkDim, fontSize: 12, fontWeight: '700' }}>
                      {g.label} · {plural(g.items.length, 'payment')}
                    </Text>
                    <Text style={{ color: colors.inkDim, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{fmtCompact(sum(g.items), currency, fxRate)}</Text>
                  </View>
                  {g.items.map((m, i) => (
                    <View key={m.id} style={[{ paddingHorizontal: 16 }, i > 0 && { borderTopWidth: 1, borderColor: colors.border }]}>
                      <PayRow
                        milestone={m}
                        property={properties.find((p) => p.id === m.property_id)}
                        state={activeTab}
                        currency={currency}
                        fxRate={fxRate}
                        showDate
                      />
                    </View>
                  ))}
                </View>
              ))}
            </Card>
          </>
        ) : (
          <Card>
            <EmptyNote>{query || period !== 'all' ? 'No payments match the current search or filters.' : activeDef.empty}</EmptyNote>
          </Card>
        )}
      </ScrollView>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl }]}>
            <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 15, marginBottom: 10 }}>Year</Text>
            {['all', ...years.map(String)].map((y) => (
              <TouchableOpacity
                key={y}
                activeOpacity={0.7}
                style={[styles.modalOption, y === period && { backgroundColor: colors.accentSoft, borderRadius: radii.sm }]}
                onPress={() => {
                  setPeriod(y);
                  setPickerOpen(false);
                }}
              >
                <Text style={{ color: colors.ink, fontSize: 15, fontWeight: y === period ? '700' : '400' }}>{y === 'all' ? 'All years' : y}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  stat: { width: 140, padding: 14 },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  periodBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderWidth: 1, minHeight: 46 },
  monthHead: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { padding: 18, paddingBottom: 34, borderWidth: 1, maxHeight: '60%' },
  modalOption: { paddingVertical: 13, paddingHorizontal: 12 },
});
