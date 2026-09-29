import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../context/AppDataContext';
import { Icon } from '../components/Icon';
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { PaymentsScreen } from '../screens/PaymentsScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { PropertiesStackNavigator } from './PropertiesStackNavigator';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICON: Record<keyof RootTabParamList, React.ComponentProps<typeof Icon>['name']> = {
  Overview: 'overview',
  Properties: 'properties',
  Payments: 'payments',
  Account: 'account',
};

function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => <Icon name={TAB_ICON[route.name]} color={color} size={size ?? 20} />,
      })}
    >
      <Tab.Screen name="Overview" component={DashboardScreen} />
      <Tab.Screen name="Properties" component={PropertiesStackNavigator} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { colors, mode } = useTheme();
  const { booting, session } = useAppData();

  const navTheme = {
    ...(mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.bg,
      card: colors.surface,
      border: colors.border,
      text: colors.ink,
      primary: colors.accent,
    },
  };

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>{session ? <MainTabs /> : <LoginScreen />}</NavigationContainer>
  );
}
