import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../context/AppDataContext';
import { Icon } from '../components/Icon';
import { Card, EmptyNote } from '../components/UI';
import { Screen } from '../components/Screen';
import { PayRow } from '../components/PayRow';
import { milestoneState } from '../lib/format';
import type { MilestoneState } from '../types';

interface TabDef {
  id: MilestoneState;
  label: string;
  empty: string;
}

const PAY_TABS: TabDef[] = [
  { id: 'overdue', label: 'Overdue', empty: 'Nothing overdue.' },
  { id: 'soon', label: 'Due soon', empty: 'Nothing due in the next 30 days.' },
  { id: 'upcoming', label: 'Upcoming', empty: 'Nothing further out on the schedule.' },
  { id: 'undecided', label: 'Undecided', empty: 'Every milestone has a confirmed date.' },
  { id: 'paid', label: 'Paid', empty: 'No payments recorded yet.' },
];

export function PaymentsScreen() {
  const { colors, radii } = useTheme();
  const { properties, milestones, currency, fxRate } = useAppData();
  const [activeTab, setActiveTab] = useState<MilestoneState>('soon');
  const [period, setPeriod] = useState<string>('all');
  const [pickerOpen, setPickerOpen] = useState(false);

  const years = useMemo(() => {
    const set = new Set<number>();
    milestones.forEach((m) => {
      const y = m.year || (m.due_date ? Number(m.due_date.slice(0, 4)) : null);
      if (y) set.add(y);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [milestones]);

  const periodFiltered = useMemo(() => {
    if (period === 'all') return milestones;
    return milestones.filter((m) => {
      const y = m.year || (m.due_date ? Number(m.due_date.slice(0, 4)) : null);
      return String(y) === period;
    });
  }, [milestones, period]);

  const buckets = useMemo(() => {
    const b: Record<MilestoneState, typeof milestones> = { overdue: [], soon: [], upcoming: [], undecided: [], paid: [] };
    periodFiltered.forEach((m) => b[milestoneState(m)].push(m));
    return b;
  }, [periodFiltered]);

  const activeDef = PAY_TABS.find((t) => t.id === activeTab)!;
  const activeList = useMemo(() => {
    const list = buckets[activeTab].slice().sort((a, b) => new Date(a.due_date || '2099-01-01').getTime() - new Date(b.due_date || '2099-01-01').getTime());
    if (activeTab === 'paid') list.reverse();
    return list;
  }, [buckets, activeTab]);

  const tabColor = (id: MilestoneState) => (id === 'overdue' ? colors.bad : id === 'soon' ? colors.warn : colors.accent);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.header, { color: colors.inkFaint }]}>PAYMENTS</Text>

        <View style={styles.toolbar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 6 }}>
            {PAY_TABS.map((t) => {
              const active = t.id === activeTab;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setActiveTab(t.id)}
                  style={[
                    styles.tabBtn,
                    { borderColor: colors.border, backgroundColor: active ? tabColor(t.id) : colors.surface, borderRadius: radii.sm },
                  ]}
                >
                  <Text style={{ color: active ? colors.accentInk : colors.inkDim, fontSize: 12.5, fontWeight: '700' }}>{t.label}</Text>
                  <View
                    style={[
                      styles.countBadge,
                      { backgroundColor: active ? 'rgba(255,255,255,0.25)' : colors.surface2, borderRadius: radii.pill },
                    ]}
                  >
                    <Text style={{ color: active ? colors.accentInk : colors.inkFaint, fontSize: 10.5, fontWeight: '700' }}>
                      {buckets[t.id].length}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            onPress={() => setPickerOpen(true)}
            style={[styles.periodBtn, { backgroundColor: colors.surface2, borderColor: colors.border, borderRadius: radii.sm }]}
          >
            <Text style={{ color: colors.ink, fontSize: 12.5, fontWeight: '700' }}>{period === 'all' ? 'All time' : period}</Text>
            <Icon name="chevron" size={13} color={colors.inkFaint} />
          </TouchableOpacity>
        </View>

        <Card>
          {activeList.length ? (
            activeList.map((m, i) => (
              <View key={m.id} style={i > 0 ? { borderTopWidth: 1, borderColor: colors.border } : undefined}>
                <PayRow
                  milestone={m}
                  property={properties.find((p) => p.id === m.property_id)}
                  state={activeTab}
                  currency={currency}
                  fxRate={fxRate}
                  showDate
                />
              </View>
            ))
          ) : (
            <EmptyNote>{activeDef.empty}</EmptyNote>
          )}
        </Card>
      </ScrollView>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg }]}>
            <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 14, marginBottom: 10 }}>Period</Text>
            <TouchableOpacity
              style={[styles.modalOption, period === 'all' && { backgroundColor: colors.accentSoft, borderRadius: radii.sm }]}
              onPress={() => {
                setPeriod('all');
                setPickerOpen(false);
              }}
            >
              <Text style={{ color: colors.ink, fontSize: 14 }}>All time</Text>
            </TouchableOpacity>
            {years.map((y) => (
              <TouchableOpacity
                key={y}
                style={[styles.modalOption, String(y) === period && { backgroundColor: colors.accentSoft, borderRadius: radii.sm }]}
                onPress={() => {
                  setPeriod(String(y));
                  setPickerOpen(false);
                }}
              >
                <Text style={{ color: colors.ink, fontSize: 14 }}>{y}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 12.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, minHeight: 38 },
  countBadge: { minWidth: 18, paddingHorizontal: 5, paddingVertical: 1, alignItems: 'center' },
  periodBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, minHeight: 38 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { padding: 16, paddingBottom: 32, borderWidth: 1, maxHeight: '60%' },
  modalOption: { paddingVertical: 12, paddingHorizontal: 10 },
});
