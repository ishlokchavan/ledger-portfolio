import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../context/AppDataContext';
import { PropertyCard } from '../components/PropertyCard';
import { Card, Chip, EmptyNote, PageHeader, SearchField } from '../components/UI';
import { Screen } from '../components/Screen';
import { PropertiesSkeleton } from '../components/Skeleton';
import { fmtCompact, nextMilestone, paidPct, plural, resaleEligibility } from '../lib/format';
import type { PropertiesStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<PropertiesStackParamList, 'PropertiesList'>;
type Sort = 'handover' | 'value' | 'progress' | 'name';
const SORTS: { id: Sort; label: string }[] = [
  { id: 'handover', label: 'Handover' },
  { id: 'value', label: 'Value' },
  { id: 'progress', label: 'Most paid' },
  { id: 'name', label: 'A–Z' },
];

export function PropertiesScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { properties, milestones, currency, fxRate, loading, refresh } = useAppData();
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
    const value = list.reduce((a, p) => a + Number(p.total_unit_price_aed || 0), 0);
    const paid = list.reduce((a, p) => a + Number(p.total_paid_aed || 0), 0);
    return { value, paid, pct: value > 0 ? Math.round((paid / value) * 100) : 0 };
  }, [list]);

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

  const header = (
    <View>
      <PageHeader title="Properties" subtitle={`${plural(properties.length, 'unit')} in this portfolio.`} />
      <SearchField value={query} onChangeText={setQuery} placeholder="Search name, developer or location" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="All" count={properties.length} active={filter === 'all'} onPress={() => setFilter('all')} />
        {statuses.map((s) => (
          <Chip key={s} label={s} count={properties.filter((p) => p.status === s).length} active={filter === s} onPress={() => setFilter(s)} />
        ))}
        {resaleN > 0 && <Chip label="Resale-ready" count={resaleN} active={filter === 'resale'} onPress={() => setFilter('resale')} />}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, { paddingTop: 0 }]}>
        <Text style={[styles.sortLabel, { color: colors.inkFaint }]}>SORT</Text>
        {SORTS.map((s) => (
          <Chip key={s.id} label={s.label} active={sort === s.id} onPress={() => setSort(s.id)} />
        ))}
      </ScrollView>
      {list.length > 0 && (
        <Card style={styles.strip}>
          {[
            ['Showing', `${list.length} of ${properties.length}`],
            ['Value', fmtCompact(totals.value, currency, fxRate)],
            ['Paid', fmtCompact(totals.paid, currency, fxRate)],
            ['Avg.', `${totals.pct}%`],
          ].map(([k, v]) => (
            <View key={k} style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: colors.inkFaint, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>{k}</Text>
              <Text style={{ color: colors.ink, fontSize: 15, fontWeight: '700', marginTop: 3 }} numberOfLines={1} adjustsFontSizeToFit>{v}</Text>
            </View>
          ))}
        </Card>
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
            currency={currency}
            fxRate={fxRate}
            onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.id })}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  chips: { gap: 8, paddingVertical: 12, alignItems: 'center' },
  sortLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.7, marginRight: 2 },
  strip: { flexDirection: 'row', gap: 12, padding: 14, marginBottom: 16 },
});
