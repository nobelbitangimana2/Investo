import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../lib/i18n';
import { ThemeProvider } from '../lib/theme';
import { useTheme } from '../lib/theme';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function ThemedApp() {
  const { theme, colors } = useTheme();
  return (
    <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(client)" />
          <Stack.Screen name="(accountant)" />
          <Stack.Screen name="(admin)" />
        </Stack>
        <Toast />
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
    </QueryClientProvider>
  );
}
