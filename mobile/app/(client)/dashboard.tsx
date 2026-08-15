import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useAuthStore } from '@/lib/auth-store';
import { useNotificationStore } from '@/lib/notification-store';
import { getDeposits, getWithdrawals, getInvestments, getNotifications, getUnreadCount } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Header } from '@/components/layout/Header';
import { formatCurrency, formatDate, timeAgo, toNumber } from '@/lib/utils';
import { COLORS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import type { Deposit, Withdrawal, Investment, Notification } from '@/types';

export default function ClientDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { setUnreadCount } = useNotificationStore();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!user) return;
    const [d, w, i, n, count] = await Promise.all([
      getDeposits(true), getWithdrawals(true), getInvestments(true),
      getNotifications(), getUnreadCount(),
    ]);
    setDeposits(d); setWithdrawals(w); setInvestments(i);
    setNotifications(n.slice(0, 5)); setUnreadCount(count);
  }

  useEffect(() => { load(); }, [user]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const confirmed = deposits.filter((d) => d.status === 'confirmed');
  const totalDeposited = confirmed.reduce((s, d) => s + toNumber(d.amount), 0);
  const totalBalance = investments.reduce((s, i) => s + toNumber(i.currentPrincipal) + toNumber(i.accruedInterest), 0);
  const totalExpected = investments.filter((i) => i.status === 'active').reduce((s, i) => s + toNumber(i.expectedInterest), 0);
  const activeCount = investments.filter((i) => i.status === 'active').length;

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.greeting}>{t('topbar.welcomeBack')} {user?.name?.split(' ')[0]}</Text>

        <View style={styles.grid}>
          <View style={styles.cardWrap}>
            <StatCard title={t('client.dashboard.totalDeposited')} value={formatCurrency(totalDeposited)} iconName="wallet" iconBg="#eff6ff" />
          </View>
          <View style={styles.cardWrap}>
            <StatCard title={t('client.dashboard.currentBalance')} value={formatCurrency(totalBalance)} iconName="trending-up" iconBg="#ecfdf5" iconColor={COLORS.emerald} description={t('client.dashboard.balanceDescription')} />
          </View>
        </View>
        <View style={styles.grid}>
          <View style={styles.cardWrap}>
            <StatCard title={t('client.dashboard.expectedInterest')} value={formatCurrency(totalExpected)} iconName="cash" iconBg="#fffbeb" iconColor={COLORS.amber} />
          </View>
          <View style={styles.cardWrap}>
            <StatCard title={t('client.dashboard.activeInvestments')} value={activeCount} iconName="checkmark-circle" iconBg="#f5f3ff" iconColor="#7c3aed" />
          </View>
        </View>
        <View style={styles.grid}>
          <View style={styles.cardWrap}>
            <StatCard title={t('client.dashboard.pendingDeposits')} value={deposits.filter((d) => d.status === 'pending').length} iconName="time" iconBg="#fffbeb" iconColor={COLORS.amber} />
          </View>
          <View style={styles.cardWrap}>
            <StatCard title={t('client.dashboard.pendingWithdrawals')} value={withdrawals.filter((w) => w.status === 'pending').length} iconName="arrow-up-circle" iconBg="#eff6ff" iconColor={COLORS.blue} />
          </View>
        </View>

        {/* Recent deposits */}
        <Card title={t('client.dashboard.recentDeposits')} noPadding>
          {deposits.length === 0
            ? <Text style={styles.empty}>{t('client.dashboard.noDeposits')}</Text>
            : deposits.slice(0, 4).map((d) => (
              <View key={d.id} style={styles.listItem}>
                <View style={styles.listMain}>
                  <Text style={styles.listTitle}>{formatCurrency(toNumber(d.amount))}</Text>
                  <Text style={styles.listSub}>{d.bank} · {d.investmentPeriod} · {formatDate(d.depositDate)}</Text>
                </View>
                <StatusBadge status={d.status} />
              </View>
            ))}
        </Card>

        {/* Recent notifications */}
        <Card title={t('client.dashboard.recentNotifications')} noPadding>
          {notifications.length === 0
            ? <Text style={styles.empty}>{t('client.dashboard.noNotifications')}</Text>
            : notifications.map((n) => (
              <View key={n.id} style={[styles.listItem, !n.read && styles.unreadRow]}>
                {!n.read && <View style={styles.unreadDot} />}
                <View style={styles.listMain}>
                  <Text style={[styles.listTitle, !n.read && { fontWeight: '700' }]}>{n.title}</Text>
                  <Text style={styles.listSub}>{timeAgo(n.date)}</Text>
                </View>
              </View>
            ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  greeting: { fontSize: 20, fontWeight: '700', color: COLORS.gray900, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  cardWrap: { width: '48%', marginBottom: 10 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  unreadRow: { backgroundColor: '#eff6ff' },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.blue, marginRight: 8 },
  listMain: { flex: 1 },
  listTitle: { fontSize: 13, fontWeight: '600', color: COLORS.gray800 },
  listSub: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  empty: { padding: 16, fontSize: 13, color: COLORS.gray400, textAlign: 'center' },
});
