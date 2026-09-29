import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { PropertiesScreen } from '../screens/PropertiesScreen';
import { PropertyDetailScreen } from '../screens/PropertyDetailScreen';
import type { PropertiesStackParamList } from './types';

const Stack = createNativeStackNavigator<PropertiesStackParamList>();

export function PropertiesStackNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.ink,
        headerShadowVisible: true,
        headerTitleStyle: { color: colors.ink },
      }}
    >
      {/* PropertiesScreen renders its own shared TopBar (brand + portfolio switcher), so no native header here. */}
      <Stack.Screen name="PropertiesList" component={PropertiesScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="PropertyDetail"
        component={PropertyDetailScreen}
        options={{ title: 'Property', headerBackTitle: 'Properties' }}
      />
    </Stack.Navigator>
  );
}
