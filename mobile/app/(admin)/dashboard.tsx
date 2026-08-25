import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useAuthStore } from '@/lib/auth-store';
import { useNotificationStore } from '@/lib/notification-store';
import { getDeposits, getWithdrawals, getInvestments, getClients, getNotifications, getUnreadCount } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Header } from '@/components/layout/Header';
import { formatCurrency, timeAgo, toNumber } from '@/lib/utils';
import { COLORS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import type { Deposit, Withdrawal, Investment, User, Notification } from '@/types';
import { ThemeView } from '@/components/ui/ThemeView';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { setUnreadCount } = useNotificationStore();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!user) return;
    const [d, w, i, c, n, count] = await Promise.all([
      getDeposits(false), getWithdrawals(false), getInvestments(false),
      getClients(), getNotifications(), getUnreadCount(),
    ]);
    setDeposits(d); setWithdrawals(w); setInvestments(i);
    setClients(c); setNotifications(n.slice(0, 5)); setUnreadCount(count);
  }

  useEffect(() => { load(); }, [user]);
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  const confirmed = deposits.filter((d) => d.status === 'confirmed');
  const totalDeposited = confirmed.reduce((s, d) => s + toNumber(d.amount), 0);
  const totalBalance = investments.reduce((s, i) => s + toNumber(i.currentPrincipal) + toNumber(i.accruedInterest), 0);
  const activeInv = investments.filter((i) => i.status === 'active');
  const totalExpected = activeInv.reduce((s, i) => s + toNumber(i.expectedInterest), 0);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <ThemeView style={styles.root}>
      <Header />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={styles.title}>{t('admin.dashboard.title')}</Text>
        <Text style={styles.subtitle}>{t('admin.dashboard.subtitle')}</Text>

        <View style={styles.grid}>
          <StatCard title={t('admin.dashboard.totalClients')} value={clients.length} iconName="people" />
          <StatCard title={t('admin.dashboard.totalDeposited')} value={formatCurrency(totalDeposited)} iconName="wallet" iconBg="#eff6ff" iconColor={COLORS.blue} />
        </View>
        <View style={styles.grid}>
          <StatCard title={t('admin.dashboard.totalBalance')} value={formatCurrency(totalBalance)} iconName="trending-up" iconBg="#ecfdf5" iconColor={COLORS.emerald} description={t('admin.dashboard.balanceDescription')} />
          <StatCard title={t('admin.dashboard.activeInvestments')} value={activeInv.length} iconName="checkmark-circle" iconBg="#f5f3ff" iconColor="#7c3aed" />
        </View>
        <View style={styles.grid}>
          <StatCard title={t('admin.dashboard.pendingDeposits')} value={deposits.filter((d) => d.status === 'pending').length} iconName="time" iconBg="#fffbeb" iconColor={COLORS.amber} />
          <StatCard title={t('admin.dashboard.pendingWithdrawals')} value={withdrawals.filter((w) => w.status === 'pending').length} iconName="arrow-up-circle" iconBg="#fef2f2" iconColor={COLORS.red} />
        </View>

        <Card title={`${t('admin.dashboard.notifications')}${unread > 0 ? ` (${unread})` : ''}`} noPadding>
          {notifications.length === 0
            ? <Text style={styles.empty}>{t('admin.notifications.noNotifications')}</Text>
            : notifications.map((n) => (
              <View key={n.id} style={[styles.listItem, !n.read && styles.unread]}>
                <View style={styles.listMain}>
                  <Text style={[styles.listTitle, !n.read && { fontWeight: '700' }]}>{n.title}</Text>
                  <Text style={styles.listSub} numberOfLines={1}>{n.message}</Text>
                  <Text style={styles.listTime}>{timeAgo(n.date)}</Text>
                </View>
                {!n.read && <View style={styles.dot} />}
              </View>
            ))}
        </Card>

        <Card title={t('admin.dashboard.upcomingMaturities')} noPadding>
          {activeInv.length === 0
            ? <Text style={styles.empty}>{t('admin.dashboard.noActiveInvestments')}</Text>
            : activeInv.slice(0, 5).map((inv) => (
              <View key={inv.id} style={styles.listItem}>
                <View style={styles.listMain}>
                  <Text style={styles.listTitle}>{formatCurrency(toNumber(inv.amount))}</Text>
                  <Text style={styles.listSub}>{inv.investmentPeriod} · matures {inv.maturityDate?.slice(0, 10)}</Text>
                </View>
                <Text style={styles.interest}>+{formatCurrency(toNumber(inv.expectedInterest))}</Text>
              </View>
            ))}
        </Card>
        <View style={{ height: 24 }} />
      </ScrollView>
    </ThemeView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.gray900 },
  subtitle: { fontSize: 13, color: COLORS.gray500, marginBottom: 16, marginTop: 2 },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  unread: { backgroundColor: '#eff6ff' },
  listMain: { flex: 1 },
  listTitle: { fontSize: 13, fontWeight: '600', color: COLORS.gray700 },
  listSub: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  listTime: { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.blue },
  interest: { fontSize: 13, fontWeight: '700', color: COLORS.emerald },
  empty: { padding: 16, fontSize: 13, color: COLORS.gray400, textAlign: 'center' },
});
