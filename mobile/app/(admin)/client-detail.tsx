import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getClientById, getDeposits, getInvestments } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Header } from '@/components/layout/Header';
import { formatCurrency, formatDate, getInitials, toNumber } from '@/lib/utils';
import { COLORS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import type { Deposit, Investment } from '@/types';

export default function ClientDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [client, setClient] = useState<Record<string, unknown> | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!id) return;
    const [c, d, i] = await Promise.all([
      getClientById(id),
      getDeposits(false, id),
      getInvestments(false, id),
    ]);
    setClient(c); setDeposits(d); setInvestments(i);
  }

  useEffect(() => { load(); }, [id]);
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  const confirmedDeposits = deposits.filter((d) => d.status === 'confirmed');
  const totalDeposited = confirmedDeposits.reduce((s, d) => s + toNumber(d.amount), 0);
  const totalBalance = investments.reduce((s, i) => s + toNumber(i.currentPrincipal) + toNumber(i.accruedInterest), 0);
  const activeInv = investments.filter((i) => i.status === 'active');
  const totalExpected = activeInv.reduce((s, i) => s + toNumber(i.expectedInterest), 0);

  const name = client?.name as string ?? '';
  const email = client?.email as string ?? '';
  const status = (client?.status as string ?? 'active').toLowerCase();

  return (
    <View style={styles.root}>
      <Header showBack title={t('admin.clients.detail.title')} />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

        {/* Profile card */}
        <Card>
          <View style={styles.profileRow}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(name)}</Text></View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{name}</Text>
                <StatusBadge status={status} />
              </View>
              <Text style={styles.email}>{email}</Text>
            </View>
          </View>
        </Card>

        {/* Summary stats */}
        <View style={styles.grid}>
          <StatCard title={t('admin.clients.detail.totalDeposited')} value={formatCurrency(totalDeposited)} iconName="wallet" />
          <StatCard title={t('admin.clients.detail.currentBalance')} value={formatCurrency(totalBalance)} iconName="trending-up" iconBg="#ecfdf5" iconColor={COLORS.emerald} />
        </View>
        <View style={styles.grid}>
          <StatCard title={t('admin.clients.detail.activeInvestments')} value={activeInv.length} iconName="checkmark-circle" iconBg="#f5f3ff" iconColor="#7c3aed" />
          <StatCard title={t('admin.clients.detail.expectedInterest')} value={formatCurrency(totalExpected)} iconName="cash" iconBg="#fffbeb" iconColor={COLORS.amber} />
        </View>

        {/* Deposit history */}
        <Card title={t('admin.clients.detail.depositHistory')} noPadding>
          {deposits.length === 0
            ? <Text style={styles.empty}>No deposits.</Text>
            : deposits.slice(0, 8).map((d) => (
              <View key={d.id} style={styles.row}>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{formatCurrency(toNumber(d.amount))}</Text>
                  <Text style={styles.rowSub}>{d.bank} · {d.investmentPeriod} · {formatDate(d.depositDate)}</Text>
                </View>
                <StatusBadge status={d.status} />
              </View>
            ))}
        </Card>

        {/* Investment portfolio */}
        <Card title={t('admin.clients.detail.investmentPortfolio')} noPadding>
          {investments.length === 0
            ? <Text style={styles.empty}>No investments.</Text>
            : investments.map((inv) => (
              <View key={inv.id} style={styles.row}>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{formatCurrency(toNumber(inv.amount))}</Text>
                  <Text style={styles.rowSub}>{inv.investmentPeriod} · {inv.interestRate}% · {formatDate(inv.maturityDate)}</Text>
                </View>
                <StatusBadge status={inv.status} />
              </View>
            ))}
        </Card>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  content: { padding: 16, paddingBottom: 40 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  profileInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.gray900 },
  email: { fontSize: 13, color: COLORS.gray500, marginTop: 3 },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  rowMain: { flex: 1 },
  rowTitle: { fontSize: 13, fontWeight: '700', color: COLORS.gray900 },
  rowSub: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  empty: { padding: 16, fontSize: 13, color: COLORS.gray400, textAlign: 'center' },
});
