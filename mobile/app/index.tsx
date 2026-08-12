import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { getAccessToken } from '@/lib/secure-storage';
import { getMe } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { COLORS } from '@/constants/config';

export default function Index() {
  const { login, setLoading } = useAuthStore();

  useEffect(() => {
    async function bootstrap() {
      try {
        const token = await getAccessToken();
        if (!token) {
          router.replace('/(auth)/login');
          return;
        }
        const user = await getMe();
        login(user);
        const routes: Record<string, string> = {
          admin: '/(admin)/dashboard',
          accountant: '/(accountant)/dashboard',
          client: '/(client)/dashboard',
        };
        router.replace((routes[user.role] ?? '/(auth)/login') as never);
      } catch {
        router.replace('/(auth)/login');
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.navy }}>
      <ActivityIndicator size="large" color={COLORS.white} />
    </View>
  );
}
