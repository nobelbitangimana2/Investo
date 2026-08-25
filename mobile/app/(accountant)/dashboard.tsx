import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useAuthStore } from '@/lib/auth-store';
import { useNotificationStore } from '@/lib/notification-store';
import { getDeposits, getWithdrawals, getNotifications, getUnreadCount } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Header } from '@/components/layout/Header';
import { formatCurrency, formatDate, timeAgo, toNumber } from '@/lib/utils';
import { COLORS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import type { Deposit, Withdrawal, Notification } from '@/types';

export default function AccountantDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { setUnreadCount } = useNotificationStore();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!user) return;
    const [d, w, n, count] = await Promise.all([
      getDeposits(false), getWithdrawals(false), getNotifications(), getUnreadCount(),
    ]);
    setDeposits(d); setWithdrawals(w);
    setNotifications(n.slice(0, 5)); setUnreadCount(count);
  }

  useEffect(() => { load(); }, [user]);
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  const pending = deposits.filter((d) => d.status === 'pending');
  const pendingW = withdrawals.filter((w) => w.status === 'pending');
  const confirmed = deposits.filter((d) => d.status === 'confirmed');
  const rejected = deposits.filter((d) => d.status === 'rejected');
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={styles.greeting}>{t('accountant.dashboard.title')}</Text>
        <Text style={styles.subtitle}>{t('accountant.dashboard.subtitle')}</Text>

        <View style={styles.grid}>
          <StatCard title={t('accountant.dashboard.pendingDeposits')} value={pending.length} iconName="time" iconBg="#fffbeb" iconColor={COLORS.amber} />
          <StatCard title={t('accountant.dashboard.pendingWithdrawals')} value={pendingW.length} iconName="arrow-up-circle" iconBg="#eff6ff" iconColor={COLORS.blue} />
        </View>
        <View style={styles.grid}>
          <StatCard title={t('accountant.dashboard.confirmedDeposits')} value={confirmed.length} iconName="checkmark-circle" iconBg="#ecfdf5" iconColor={COLORS.emerald} />
          <StatCard title={t('accountant.dashboard.rejectedDeposits')} value={rejected.length} iconName="close-circle" iconBg="#fef2f2" iconColor={COLORS.red} />
        </View>

        {/* Pending queue */}
        <Card title={t('accountant.dashboard.pendingQueue')} noPadding>
          {pending.length === 0
            ? <Text style={styles.empty}>{t('accountant.dashboard.noPendingDeposits')}</Text>
            : pending.slice(0, 5).map((d) => (
              <View key={d.id} style={styles.listItem}>
                <View style={styles.listMain}>
                  <Text style={styles.listTitle}>{d.fullName}</Text>
                  <Text style={styles.listSub}>{formatCurrency(toNumber(d.amount))} · {d.bank}</Text>
                </View>
                <StatusBadge status={d.status} />
              </View>
            ))}
        </Card>

        {/* Notifications */}
        <Card title={`${t('accountant.dashboard.notifications')}${unread > 0 ? ` (${unread})` : ''}`} noPadding>
          {notifications.length === 0
            ? <Text style={styles.empty}>{t('accountant.notifications.noNotifications')}</Text>
            : notifications.map((n) => (
              <View key={n.id} style={[styles.listItem, !n.read && styles.unread]}>
                <View style={styles.listMain}>
                  <Text style={[styles.listTitle, !n.read && { fontWeight: '700' }]}>{n.title}</Text>
                  <Text style={styles.listSub}>{timeAgo(n.date)}</Text>
                </View>
                {!n.read && <View style={styles.dot} />}
              </View>
            ))}
        </Card>

        {/* Recently confirmed */}
        <Card title={t('accountant.dashboard.recentlyConfirmed')} noPadding>
          {confirmed.length === 0
            ? <Text style={styles.empty}>{t('accountant.dashboard.noConfirmedDeposits')}</Text>
            : confirmed.slice(0, 4).map((d) => (
              <View key={d.id} style={styles.listItem}>
                <View style={styles.listMain}>
                  <Text style={styles.listTitle}>{d.fullName}</Text>
                  <Text style={styles.listSub}>{formatCurrency(toNumber(d.amount))} · {formatDate(d.depositDate)}</Text>
                </View>
                <StatusBadge status={d.status} />
              </View>
            ))}
        </Card>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  content: { padding: 16, paddingBottom: 32 },
  greeting: { fontSize: 20, fontWeight: '700', color: COLORS.gray900 },
  subtitle: { fontSize: 13, color: COLORS.gray500, marginBottom: 16, marginTop: 2 },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  unread: { backgroundColor: '#eff6ff' },
  listMain: { flex: 1 },
  listTitle: { fontSize: 13, fontWeight: '600', color: COLORS.gray700 },
  listSub: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.blue },
  empty: { padding: 16, fontSize: 13, color: COLORS.gray400, textAlign: 'center' },
});
