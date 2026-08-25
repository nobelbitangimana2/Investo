import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { getInvestments, getWithdrawals } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { formatCurrency, formatDate, toNumber } from '@/lib/utils';
import { COLORS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import type { Investment, Withdrawal } from '@/types';

function getCycles(inv: Investment): number {
  const days: Record<string, number> = { Weekly: 7, Monthly: 30, '3 Months': 90, '6 Months': 180, '1 Year': 365, '5 Years': 1825 };
  const elapsed = Math.floor((Date.now() - new Date(inv.confirmationDate).getTime()) / 86400000);
  return Math.floor(elapsed / (days[inv.investmentPeriod] ?? 30));
}

export default function InvestmentsScreen() {
  const { t } = useTranslation();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const [i, w] = await Promise.all([getInvestments(true), getWithdrawals(true)]);
    setInvestments(i); setWithdrawals(w);
  }

  useEffect(() => { load(); }, []);
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  const totalBalance = investments.reduce((s, i) => s + toNumber(i.currentPrincipal) + toNumber(i.accruedInterest), 0);
  const totalPrincipal = investments.reduce((s, i) => s + toNumber(i.currentPrincipal), 0);
  const totalAccrued = investments.reduce((s, i) => s + toNumber(i.accruedInterest), 0);

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={styles.pageTitle}>{t('client.investments.title')}</Text>

        <View style={styles.grid}>
          <StatCard title={t('client.investments.totalBalance')} value={formatCurrency(totalBalance)} iconName="wallet" iconBg="#eff6ff" fullWidth />
        </View>
        <View style={styles.grid}>
          <StatCard title={t('client.investments.totalPrincipal')} value={formatCurrency(totalPrincipal)} iconName="cash" />
          <StatCard title={t('client.investments.accruedInterest')} value={formatCurrency(totalAccrued)} iconName="trending-up" iconBg="#ecfdf5" iconColor={COLORS.emerald} />
        </View>

        {investments.length === 0 ? (
          <EmptyState icon="trending-up-outline" title={t('client.investments.noInvestments')} subtitle={t('client.investments.noInvestmentsSubtitle')} />
        ) : (
          investments.map((inv) => {
            const balance = toNumber(inv.currentPrincipal) + toNumber(inv.accruedInterest);
            const cycles = getCycles(inv);
            return (
              <Card key={inv.id}>
                <View style={styles.invHeader}>
                  <View>
                    <Text style={styles.invAmount}>{formatCurrency(toNumber(inv.amount))}</Text>
                    <Text style={styles.invPeriod}>{inv.investmentPeriod} · {t('client.investments.perpetual')}</Text>
                  </View>
                  <View style={styles.invRight}>
                    <StatusBadge status={inv.status} />
                    {cycles > 0 && <Text style={styles.cycles}>↻ {cycles} {t('client.investments.cyclesDone')}</Text>}
                  </View>
                </View>
                <View style={styles.breakdown}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownKey}>{t('client.investments.currentPrincipal')}</Text>
                    <Text style={styles.breakdownVal}>{formatCurrency(toNumber(inv.currentPrincipal))}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownKey}>{t('client.investments.accruedInterest')}</Text>
                    <Text style={[styles.breakdownVal, { color: COLORS.emerald }]}>+{formatCurrency(toNumber(inv.accruedInterest))}</Text>
                  </View>
                  <View style={[styles.breakdownRow, styles.breakdownTotal]}>
                    <Text style={styles.breakdownTotalKey}>{t('client.investments.currentBalance')}</Text>
                    <Text style={styles.breakdownTotalVal}>{formatCurrency(balance)}</Text>
                  </View>
                </View>
                <View style={styles.invMeta}>
                  <Text style={styles.invMetaItem}>{t('client.investments.interestRate')}: {inv.interestRate}%</Text>
                  <Text style={styles.invMetaItem}>{t('client.investments.started')}: {formatDate(inv.confirmationDate)}</Text>
                </View>
              </Card>
            );
          })
        )}

        {/* Withdrawal history */}
        {withdrawals.length > 0 && (
          <Card title={t('client.investments.withdrawalHistory')} noPadding>
            {withdrawals.map((w) => (
              <View key={w.id} style={styles.wdrRow}>
                <View style={styles.wdrLeft}>
                  <Text style={styles.wdrAmount}>{formatCurrency(toNumber(w.amount))}</Text>
                  <Text style={styles.wdrMeta}>{w.bankToTransferTo} · {formatDate(w.requestedAt)}</Text>
                </View>
                <StatusBadge status={w.status} />
              </View>
            ))}
          </Card>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  content: { padding: 16, paddingBottom: 32 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: COLORS.gray900, marginBottom: 14 },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  invHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  invAmount: { fontSize: 18, fontWeight: '700', color: COLORS.gray900 },
  invPeriod: { fontSize: 12, color: COLORS.gray500, marginTop: 3 },
  invRight: { alignItems: 'flex-end', gap: 4 },
  cycles: { fontSize: 11, color: COLORS.emerald, fontWeight: '600' },
  breakdown: { backgroundColor: COLORS.gray50, borderRadius: 10, padding: 12, gap: 8, marginBottom: 12 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownKey: { fontSize: 13, color: COLORS.gray500 },
  breakdownVal: { fontSize: 13, fontWeight: '600', color: COLORS.gray700 },
  breakdownTotal: { borderTopWidth: 1, borderTopColor: COLORS.gray200, paddingTop: 8, marginTop: 2 },
  breakdownTotalKey: { fontSize: 13, fontWeight: '700', color: COLORS.gray700 },
  breakdownTotalVal: { fontSize: 14, fontWeight: '700', color: COLORS.gray900 },
  invMeta: { flexDirection: 'row', gap: 12 },
  invMetaItem: { fontSize: 12, color: COLORS.gray400 },
  wdrRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  wdrLeft: { flex: 1 },
  wdrAmount: { fontSize: 14, fontWeight: '700', color: COLORS.gray900 },
  wdrMeta: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
});
