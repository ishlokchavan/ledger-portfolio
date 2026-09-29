import React, { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../context/AppDataContext';
import { PropertyCard } from '../components/PropertyCard';
import { EmptyNote } from '../components/UI';
import { Screen } from '../components/Screen';
import { PropertiesSkeleton } from '../components/Skeleton';
import type { PropertiesStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<PropertiesStackParamList, 'PropertiesList'>;

export function PropertiesScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { properties, currency, fxRate, loading, refresh } = useAppData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (loading && properties.length === 0 && !refreshing) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.header, { color: colors.inkFaint }]}>PROPERTIES</Text>
          <PropertiesSkeleton />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={properties}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListHeaderComponent={
          <Text style={[styles.header, { color: colors.inkFaint }]}>PROPERTIES ({properties.length})</Text>
        }
        ListEmptyComponent={<EmptyNote>No properties in this portfolio yet.</EmptyNote>}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
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
  content: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 12.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
});
