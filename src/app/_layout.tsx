import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { initDatabase } from '../db/database';
import { ThemeProvider as AppThemeProvider, useTheme } from '../theme/ThemeContext';

SplashScreen.preventAutoHideAsync();

function ThemedApp() {
  const { isDark } = useTheme();
  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((error) => {
        console.log(error);
        setDbReady(true);
      });
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#0E1110' : '#F4F7F5' }} />
    );
  }

  return (
    <AppThemeProvider>
      <ThemedApp />
    </AppThemeProvider>
  );
}