import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AppDataProvider } from './src/context/AppDataContext';
import { AppNavigator } from './src/navigation/AppNavigator';

function StatusBarForTheme() {
  const { mode } = useTheme();
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppDataProvider>
          <StatusBarForTheme />
          <AppNavigator />
        </AppDataProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
