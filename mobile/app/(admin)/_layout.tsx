import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import Header from '@/app/components/Header';

export default function AdminLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: '',
        headerStyle: { backgroundColor: COLORS.white, shadowColor: 'transparent', elevation: 0 },
        headerLeft: () => <Header />,
        tabBarActiveTintColor: COLORS.navy,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.gray100,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: t('nav.dashboard'), tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} /> }} />
      <Tabs.Screen name="deposits" options={{ title: t('nav.deposits'), tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} /> }} />
      <Tabs.Screen name="withdrawals" options={{ title: t('nav.withdrawals'), tabBarIcon: ({ color, size }) => <Ionicons name="arrow-up-circle" size={size} color={color} /> }} />
      <Tabs.Screen name="clients" options={{ title: t('nav.clients'), tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} /> }} />
      <Tabs.Screen name="notifications" options={{ title: t('nav.notifications'), tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} /> }} />
      {/* Hidden screens accessible via router.push */}
      <Tabs.Screen name="client-detail" options={{ href: null }} />
      <Tabs.Screen name="interest-rates" options={{ href: null }} />
      <Tabs.Screen name="audit-logs" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
