import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { getNotifications, markReadApi, markAllReadApi } from '@/lib/api';
import { useNotificationStore } from '@/lib/notification-store';
import { NotificationItem } from '@/components/ui/NotificationItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/layout/Header';
import { COLORS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import type { Notification } from '@/types';

const TYPE_ROUTES: Record<string, string> = {
  deposit: '/(accountant)/deposits',
  withdrawal: '/(accountant)/withdrawals',
};

export default function AccountantNotificationsScreen() {
  const { t } = useTranslation();
  const { setUnreadCount } = useNotificationStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const n = await getNotifications();
    setNotifications(n);
    setUnreadCount(n.filter((x) => !x.read).length);
  }

  useEffect(() => { load(); }, []);
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function handlePress(n: Notification) {
    if (!n.read) {
      await markReadApi(n.id);
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
      setUnreadCount(notifications.filter((x) => !x.read && x.id !== n.id).length);
    }
    const route = TYPE_ROUTES[n.type];
    if (route) router.push(route as never);
  }

  async function handleMarkAll() {
    await markAllReadApi();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.root}>
      <Header />
      <View style={styles.topRow}>
        <View>
          <Text style={styles.title}>{t('accountant.notifications.title')}</Text>
          <Text style={styles.subtitle}>{unread > 0 ? t('accountant.notifications.unread', { count: unread }) : t('accountant.notifications.allCaughtUp')}</Text>
        </View>
        {unread > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAll}>
            <Text style={styles.markAllText}>{t('accountant.notifications.markAllRead')}</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState icon="notifications-outline" title={t('accountant.notifications.noNotifications')} />}
        renderItem={({ item }) => <NotificationItem notification={item} onPress={handlePress} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.gray900 },
  subtitle: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
  markAllBtn: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: COLORS.white },
  markAllText: { fontSize: 13, fontWeight: '600', color: COLORS.gray700 },
});
