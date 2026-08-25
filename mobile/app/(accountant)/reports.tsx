import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { getDeposits, getWithdrawals, getInvestments, getAccountantPermissions } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate, toNumber } from '@/lib/utils';
import { COLORS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/lib/auth-store';
import { Ionicons } from '@expo/vector-icons';
import type { Deposit, Investment } from '@/types';

export default function AccountantReportsScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [canGenerate, setCanGenerate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!user) return;
    const [d, i, p] = await Promise.all([getDeposits(false), getInvestments(false), getAccountantPermissions(user.id)]);
    setDeposits(d); setInvestments(i);
    setCanGenerate(user.role === 'admin' || !!p?.generateReports);
  }

  useEffect(() => { load(); }, [user]);
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  if (!canGenerate) {
    return (
      <View style={styles.root}>
        <Header />
        <View style={styles.noPermission}>
          <Ionicons name="lock-closed" size={48} color={COLORS.gray200} />
          <Text style={styles.noPermTitle}>{t('admin.reports.noPermission')}</Text>
          <Text style={styles.noPermSub}>{t('admin.reports.contactAdmin')}</Text>
        </View>
      </View>
    );
  }

  const confirmed = deposits.filter((d) => d.status === 'confirmed');
  const totalDeposited = confirmed.reduce((s, d) => s + toNumber(d.amount), 0);
  const activeInv = investments.filter((i) => i.status === 'active');
  const totalExpected = activeInv.reduce((s, i) => s + toNumber(i.expectedInterest), 0);

  const byStatus = ['pending', 'confirmed', 'rejected'].map((s) => ({
    label: s, count: deposits.filter((d) => d.status === s).length,
    amount: deposits.filter((d) => d.status === s).reduce((sum, d) => sum + toNumber(d.amount), 0),
  }));

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.topRow}>
          <Text style={styles.pageTitle}>{t('admin.reports.title')}</Text>
          <TouchableOpacity style={styles.exportBtn} onPress={() => Alert.alert('Export', t('admin.reports.exportMessage'))}>
            <Ionicons name="download-outline" size={16} color={COLORS.navy} />
            <Text style={styles.exportText}>Export</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          <StatCard title={t('admin.reports.tabDeposits')} value={deposits.length} iconName="wallet" />
          <StatCard title="Total Deposited" value={formatCurrency(totalDeposited)} iconName="cash" iconBg="#ecfdf5" iconColor={COLORS.emerald} />
        </View>
        <View style={styles.grid}>
          <StatCard title="Active Investments" value={activeInv.length} iconName="trending-up" iconBg="#eff6ff" iconColor={COLORS.blue} />
          <StatCard title="Expected Interest" value={formatCurrency(totalExpected)} iconName="diamond" iconBg="#fffbeb" iconColor={COLORS.amber} />
        </View>

        <Card title={t('admin.reports.depositsByStatus')}>
          {byStatus.map((s) => (
            <View key={s.label} style={styles.statusRow}>
              <StatusBadge status={s.label} />
              <Text style={styles.statusCount}>{s.count} deposits</Text>
              <Text style={styles.statusAmount}>{formatCurrency(s.amount)}</Text>
            </View>
          ))}
        </Card>

        <Card title="Recent Deposits" noPadding>
          {confirmed.slice(0, 6).map((d) => (
            <View key={d.id} style={styles.depRow}>
              <View style={styles.depMain}>
                <Text style={styles.depName}>{d.fullName}</Text>
                <Text style={styles.depMeta}>{d.bank} · {d.investmentPeriod} · {formatDate(d.depositDate)}</Text>
              </View>
              <Text style={styles.depAmount}>{formatCurrency(toNumber(d.amount))}</Text>
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
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: COLORS.gray900 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: COLORS.navy, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  exportText: { fontSize: 13, fontWeight: '600', color: COLORS.navy },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  statusCount: { flex: 1, fontSize: 13, color: COLORS.gray700 },
  statusAmount: { fontSize: 13, fontWeight: '700', color: COLORS.gray900 },
  depRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  depMain: { flex: 1 },
  depName: { fontSize: 13, fontWeight: '600', color: COLORS.gray700 },
  depMeta: { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  depAmount: { fontSize: 13, fontWeight: '700', color: COLORS.gray900 },
  noPermission: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  noPermTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray700, textAlign: 'center' },
  noPermSub: { fontSize: 13, color: COLORS.gray500, textAlign: 'center' },
});
