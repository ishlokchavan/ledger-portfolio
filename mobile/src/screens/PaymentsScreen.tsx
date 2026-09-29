import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../context/AppDataContext';
import { Icon } from '../components/Icon';
import { Card, EmptyNote, PageHeader, SearchField } from '../components/UI';
import { Screen } from '../components/Screen';
import { PayRow } from '../components/PayRow';
import { PayListSkeleton } from '../components/Skeleton';
import { fmtCompact, fmtDate, fmtMoney, milestoneState, plural } from '../lib/format';
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

type RangeId = 'all' | 'month' | 'last30' | 'next30' | 'next90' | 'quarter' | 'year' | 'custom';
const RANGES: { id: RangeId; label: string }[] = [
  { id: 'all', label: 'All time' },
  { id: 'month', label: 'This month' },
  { id: 'last30', label: 'Last 30 days' },
  { id: 'next30', label: 'Next 30 days' },
  { id: 'next90', label: 'Next 90 days' },
  { id: 'quarter', label: 'This quarter' },
  { id: 'year', label: 'This year' },
];
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

function rangeBounds(range: RangeId, from: Date | null, to: Date | null): [string, string] | null {
  const t = new Date();
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  const y = today.getFullYear();
  const m = today.getMonth();
  switch (range) {
    case 'month':
      return [iso(new Date(y, m, 1)), iso(new Date(y, m + 1, 0))];
    case 'last30':
      return [iso(addDays(today, -30)), iso(today)];
    case 'next30':
      return [iso(today), iso(addDays(today, 30))];
    case 'next90':
      return [iso(today), iso(addDays(today, 90))];
    case 'quarter': {
      const q = Math.floor(m / 3) * 3;
      return [iso(new Date(y, q, 1)), iso(new Date(y, q + 3, 0))];
    }
    case 'year':
      return [`${y}-01-01`, `${y}-12-31`];
    case 'custom':
      return from || to ? [from ? iso(from) : '0000-01-01', to ? iso(to) : '9999-12-31'] : null;
    default:
      return null;
  }
}

const byDue = (a: PaymentMilestone, b: PaymentMilestone) =>
  new Date(a.due_date || '2099-01-01').getTime() - new Date(b.due_date || '2099-01-01').getTime();

export function PaymentsScreen() {
  const { colors, radii } = useTheme();
  const { properties, milestones, currency, fxRate, loading, refresh } = useAppData();
  const [activeTab, setActiveTab] = useState<MilestoneState>('soon');
  const [range, setRange] = useState<RangeId>('all');
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);
  const [query, setQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // All hooks run before any early return (rules of hooks).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const bounds = rangeBounds(range, from, to);
    return milestones.filter((m) => {
      if (bounds && (!m.due_date || m.due_date < bounds[0] || m.due_date > bounds[1])) return false;
      if (q) {
        const p = properties.find((x) => x.id === m.property_id);
        if ([m.milestone_event, p?.project_name, m.remarks].join(' ').toLowerCase().indexOf(q) === -1) return false;
      }
      return true;
    });
  }, [milestones, properties, range, from, to, query]);

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

  const rangeText =
    range === 'custom'
      ? from && to
        ? `${fmtDate(iso(from))} – ${fmtDate(iso(to))}`
        : from
          ? `From ${fmtDate(iso(from))}`
          : to
            ? `Until ${fmtDate(iso(to))}`
            : 'Custom range'
      : RANGES.find((r) => r.id === range)!.label;
  const rangeActive = range !== 'all';

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
            accessibilityLabel="Filter by date range"
            style={[styles.periodBtn, { backgroundColor: colors.surface, borderColor: colors.borderStrong, borderRadius: radii.md }]}
          >
            <Icon name="calendar" size={14} color={rangeActive ? colors.accent : colors.inkDim} />
            <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '700', maxWidth: 130 }} numberOfLines={1}>{rangeText}</Text>
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
            <EmptyNote>{query || rangeActive ? (activeTab === 'undecided' && rangeActive ? 'Milestones without a date can only be listed under “All time”.' : 'No payments match the current search or filters.') : activeDef.empty}</EmptyNote>
          </Card>
        )}
      </ScrollView>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => { setPicking(null); setPickerOpen(false); }}>
        <Pressable style={styles.modalBackdrop} onPress={() => { setPicking(null); setPickerOpen(false); }}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl }]} onPress={() => {}}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 15, marginBottom: 10 }}>Date range</Text>
              {RANGES.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  activeOpacity={0.7}
                  style={[styles.modalOption, range === r.id && { backgroundColor: colors.accentSoft, borderRadius: radii.sm }]}
                  onPress={() => {
                    setRange(r.id);
                    setPicking(null);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={{ color: colors.ink, fontSize: 15, fontWeight: range === r.id ? '700' : '400' }}>{r.label}</Text>
                </TouchableOpacity>
              ))}
              <View style={{ borderTopWidth: 1, borderColor: colors.border, marginTop: 8, paddingTop: 14 }}>
                <Text style={{ color: colors.inkFaint, fontSize: 11.5, fontWeight: '700', letterSpacing: 0.7, marginBottom: 8 }}>CUSTOM RANGE</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {(['from', 'to'] as const).map((k) => {
                    const val = k === 'from' ? from : to;
                    return (
                      <TouchableOpacity
                        key={k}
                        activeOpacity={0.7}
                        onPress={() => {
                          setRange('custom');
                          setPicking(picking === k ? null : k);
                        }}
                        style={[styles.dateBtn, { borderColor: picking === k ? colors.accent : colors.borderStrong, backgroundColor: colors.surface, borderRadius: radii.md }]}
                      >
                        <Text style={{ color: colors.inkFaint, fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</Text>
                        <Text style={{ color: val ? colors.ink : colors.inkFaint, fontSize: 14, fontWeight: '700', marginTop: 3 }}>{val ? fmtDate(iso(val)) : 'Select date'}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {picking && (
                  <DateTimePicker
                    value={(picking === 'from' ? from : to) ?? new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    minimumDate={picking === 'to' && from ? from : undefined}
                    maximumDate={picking === 'from' && to ? to : undefined}
                    onChange={(e, d) => {
                      if (Platform.OS === 'android') setPicking(null);
                      if (e.type === 'set' && d) {
                        if (picking === 'from') setFrom(d);
                        else setTo(d);
                        setRange('custom');
                      }
                    }}
                  />
                )}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.sheetBtn, { borderColor: colors.borderStrong, borderRadius: radii.md }]}
                    onPress={() => {
                      setRange('all');
                      setFrom(null);
                      setTo(null);
                      setPicking(null);
                      setPickerOpen(false);
                    }}
                  >
                    <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 14 }}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.sheetBtn, { backgroundColor: colors.accent, borderColor: colors.accent, borderRadius: radii.md }]}
                    onPress={() => {
                      setPicking(null);
                      setPickerOpen(false);
                    }}
                  >
                    <Text style={{ color: colors.accentInk, fontWeight: '700', fontSize: 14 }}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </Pressable>
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
  modalSheet: { padding: 18, paddingBottom: 34, borderWidth: 1, maxHeight: '85%' },
  dateBtn: { flex: 1, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  sheetBtn: { flex: 1, minHeight: 46, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modalOption: { paddingVertical: 13, paddingHorizontal: 12 },
});
