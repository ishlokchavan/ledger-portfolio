import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../context/AppDataContext';
import { PropertyCard } from '../components/PropertyCard';
import { Chip, EmptyNote, PageHeader, SearchField } from '../components/UI';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { PropertiesSkeleton } from '../components/Skeleton';
import { fmtCompact, nextMilestone, paidPct, plural, resaleEligibility } from '../lib/format';
import type { PropertiesStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<PropertiesStackParamList, 'PropertiesList'>;
type Sort = 'handover' | 'value' | 'progress' | 'name';
const SORTS: { id: Sort; label: string }[] = [
  { id: 'handover', label: 'Handover: soonest' },
  { id: 'value', label: 'Value: highest' },
  { id: 'progress', label: 'Most paid' },
  { id: 'name', label: 'Name: A–Z' },
];

export function PropertiesScreen({ navigation }: Props) {
  const { colors, radii } = useTheme();
  const { properties, milestones, currency, fxRate, loading, refresh } = useAppData();
  const [sortOpen, setSortOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState<Sort>('handover');

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const statuses = useMemo(() => Array.from(new Set(properties.map((p) => p.status).filter(Boolean))), [properties]);
  const resaleN = useMemo(() => properties.filter((p) => resaleEligibility(p).eligible).length, [properties]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = properties.filter((p) => {
      if (q && [p.project_name, p.developer, p.location, p.unit_type, p.unit_no].join(' ').toLowerCase().indexOf(q) === -1) return false;
      if (filter === 'resale') return resaleEligibility(p).eligible;
      if (filter !== 'all') return p.status === filter;
      return true;
    });
    out.sort((a, b) => {
      if (sort === 'value') return Number(b.total_unit_price_aed || 0) - Number(a.total_unit_price_aed || 0);
      if (sort === 'progress') return paidPct(b) - paidPct(a);
      if (sort === 'name') return String(a.project_name).localeCompare(String(b.project_name));
      return new Date(a.handover_date || '2099-01-01').getTime() - new Date(b.handover_date || '2099-01-01').getTime();
    });
    return out;
  }, [properties, query, filter, sort]);

  const totals = useMemo(() => {
    const value = properties.reduce((a, p) => a + Number(p.total_unit_price_aed || 0), 0);
    const paid = properties.reduce((a, p) => a + Number(p.total_paid_aed || 0), 0);
    return { value, paid, pct: value > 0 ? Math.round((paid / value) * 100) : 0 };
  }, [properties]);

  if (loading && properties.length === 0 && !refreshing) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <PageHeader title="Properties" />
          <PropertiesSkeleton />
        </ScrollView>
      </Screen>
    );
  }

  const showFilters = statuses.length > 1 || resaleN > 0;
  const header = (
    <View>
      <PageHeader
        title="Properties"
        subtitle={`${plural(properties.length, 'unit')} · ${fmtCompact(totals.value, currency, fxRate)} total · ${totals.pct}% paid`}
      />
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <SearchField value={query} onChangeText={setQuery} placeholder="Search properties" />
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setSortOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Sort properties"
          style={[styles.sortBtn, { borderColor: colors.borderStrong, backgroundColor: colors.surface, borderRadius: radii.md }]}
        >
          <Icon name="filter" size={18} color={sort === 'handover' ? colors.inkDim : colors.accent} />
        </TouchableOpacity>
      </View>
      {showFilters && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="All" count={properties.length} active={filter === 'all'} onPress={() => setFilter('all')} />
          {statuses.length > 1 &&
            statuses.map((s) => (
              <Chip key={s} label={s} count={properties.filter((p) => p.status === s).length} active={filter === s} onPress={() => setFilter(s)} />
            ))}
          {resaleN > 0 && <Chip label="Resale-ready" count={resaleN} active={filter === 'resale'} onPress={() => setFilter('resale')} />}
        </ScrollView>
      )}
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyNote>{properties.length ? 'No properties match. Try a different search or filter.' : 'No properties in this portfolio yet.'}</EmptyNote>}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            next={nextMilestone(milestones, item.id)}
            hasSchedule={milestones.some((m) => m.property_id === item.id)}
            currency={currency}
            fxRate={fxRate}
            onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.id })}
          />
        )}
      />
      <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSortOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl }]}>
            <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 15, marginBottom: 10 }}>Sort by</Text>
            {SORTS.map((o) => (
              <TouchableOpacity
                key={o.id}
                activeOpacity={0.7}
                style={[styles.opt, sort === o.id && { backgroundColor: colors.accentSoft, borderRadius: radii.sm }]}
                onPress={() => {
                  setSort(o.id);
                  setSortOpen(false);
                }}
              >
                <Text style={{ color: colors.ink, fontSize: 15, fontWeight: sort === o.id ? '700' : '400', flex: 1 }}>{o.label}</Text>
                {sort === o.id && <Icon name="check" size={16} color={colors.accent} />}
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
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  sortBtn: { width: 46, height: 46, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chips: { gap: 8, paddingVertical: 12, alignItems: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { padding: 18, paddingBottom: 32, borderWidth: 1 },
  opt: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12 },
});
