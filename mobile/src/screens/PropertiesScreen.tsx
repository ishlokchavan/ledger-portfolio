import React from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../context/AppDataContext';
import { PropertyCard } from '../components/PropertyCard';
import { EmptyNote } from '../components/UI';
import { Screen } from '../components/Screen';
import type { PropertiesStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<PropertiesStackParamList, 'PropertiesList'>;

export function PropertiesScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { properties, currency, fxRate } = useAppData();

  return (
    <Screen>
      <FlatList
        data={properties}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.content}
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
