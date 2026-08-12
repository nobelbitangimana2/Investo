import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDeposits } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatDate, toNumber } from '@/lib/utils';
import { COLORS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import type { Deposit } from '@/types';

export default function DepositsScreen() {
  const { t } = useTranslation();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [selected, setSelected] = useState<Deposit | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const d = await getDeposits(true);
    setDeposits(d);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <View style={styles.root}>
      <Header />
      <View style={styles.topRow}>
        <Text style={styles.pageTitle}>{t('client.deposits.title')}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(client)/new-deposit')}>
          <Ionicons name="add" size={18} color={COLORS.white} />
          <Text style={styles.addBtnText}>{t('client.deposits.newDeposit')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={deposits}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={!loading ? <EmptyState icon="wallet-outline" title={t('client.deposits.noDeposits')} /> : null}
        renderItem={({ item: d }) => (
          <TouchableOpacity style={styles.item} onPress={() => setSelected(d)}>
            <View style={styles.itemLeft}>
              <Text style={styles.amount}>{formatCurrency(toNumber(d.amount))}</Text>
              <Text style={styles.meta}>{d.bank} · {d.investmentPeriod}</Text>
              <Text style={styles.date}>{formatDate(d.depositDate)}</Text>
            </View>
            <View style={styles.itemRight}>
              <StatusBadge status={d.status} />
              <Ionicons name="chevron-forward" size={16} color={COLORS.gray400} style={{ marginTop: 6 }} />
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Detail sheet */}
      {selected && (
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{t('client.deposits.detailTitle')}</Text>
            <TouchableOpacity onPress={() => setSelected(null)}>
              <Ionicons name="close" size={22} color={COLORS.gray500} />
            </TouchableOpacity>
          </View>
          {selected.receiptUrl && (
            <Image source={{ uri: selected.receiptUrl }} style={styles.receipt} resizeMode="contain" />
          )}
          {[
            [t('client.deposits.fieldBank'), selected.bank],
            [t('client.deposits.fieldAccount'), selected.accountNumber],
            [t('client.deposits.fieldAmount'), formatCurrency(toNumber(selected.amount))],
            [t('client.deposits.fieldDate'), formatDate(selected.depositDate)],
            [t('client.deposits.fieldReference'), selected.referenceNumber],
            [t('client.deposits.fieldPeriod'), selected.investmentPeriod],
            [t('client.deposits.fieldStatus'), selected.status],
            selected.rejectionNote ? [t('client.deposits.fieldRejectionNote'), selected.rejectionNote] : null,
          ].filter(Boolean).map(([k, v]) => (
            <View key={k as string} style={styles.row}>
              <Text style={styles.rowKey}>{k as string}</Text>
              <Text style={styles.rowVal}>{v as string}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: COLORS.gray900 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.navy, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  list: { padding: 16, paddingTop: 0, paddingBottom: 32 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  itemLeft: { flex: 1 },
  itemRight: { alignItems: 'flex-end' },
  amount: { fontSize: 15, fontWeight: '700', color: COLORS.gray900 },
  meta: { fontSize: 12, color: COLORS.gray500, marginTop: 3 },
  date: { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.gray200, alignSelf: 'center', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray900 },
  receipt: { width: '100%', height: 160, borderRadius: 10, marginBottom: 12, backgroundColor: COLORS.gray50 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  rowKey: { fontSize: 13, color: COLORS.gray500 },
  rowVal: { fontSize: 13, fontWeight: '600', color: COLORS.gray800, maxWidth: '60%', textAlign: 'right' },
});
