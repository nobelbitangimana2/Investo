import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme';

export default function ClientLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerTitle: '',
        headerStyle: { backgroundColor: colors.surface, shadowColor: 'transparent', elevation: 0 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('nav.dashboard'),
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="deposits"
        options={{
          title: t('nav.deposits'),
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="withdrawals"
        options={{
          title: t('nav.withdrawals'),
          tabBarIcon: ({ color, size }) => <Ionicons name="arrow-up-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="investments"
        options={{
          title: t('nav.investments'),
          tabBarIcon: ({ color, size }) => <Ionicons name="trending-up" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="banks"
        options={{
          title: t('nav.partnerBanks'),
          tabBarIcon: ({ color, size }) => <Ionicons name="business" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('nav.notifications'),
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} />,
        }}
      />
      {/* Hidden screens — accessible via router.push */}
      <Tabs.Screen name="new-deposit"    options={{ href: null }} />
      <Tabs.Screen name="new-withdrawal" options={{ href: null }} />
      <Tabs.Screen name="settings"       options={{ href: null }} />
    </Tabs>
  );
}
