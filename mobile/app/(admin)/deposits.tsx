import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, Image } from 'react-native';
import { getDeposits, confirmDepositApi, rejectDepositApi } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmRejectSheet } from '@/components/ui/ConfirmRejectSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/layout/Header';
import { formatCurrency, formatDate, formatDateTime, toNumber } from '@/lib/utils';
import { COLORS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { Deposit } from '@/types';

export default function AdminDepositsScreen() {
  const { t } = useTranslation();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [selected, setSelected] = useState<Deposit | null>(null);
  const [action, setAction] = useState<{ deposit: Deposit; type: 'confirm' | 'reject' } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() { setDeposits(await getDeposits(false)); }
  useEffect(() => { load(); }, []);
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function handleAction(note?: string) {
    if (!action) return;
    if (action.type === 'confirm') {
      const updated = await confirmDepositApi(action.deposit.id);
      setDeposits((prev) => prev.map((d) => d.id === updated.id ? updated : d));
      Alert.alert(t('common.success'), t('admin.deposits.depositConfirmed'));
    } else {
      const updated = await rejectDepositApi(action.deposit.id, note ?? '');
      setDeposits((prev) => prev.map((d) => d.id === updated.id ? updated : d));
      Alert.alert(t('common.success'), t('admin.deposits.depositRejected'));
    }
    setSelected(null);
  }

  return (
    <View style={styles.root}>
      <Header />
      <Text style={styles.pageTitle}>{t('admin.deposits.title')}</Text>
      <FlatList
        data={deposits} keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState icon="wallet-outline" title="No deposits." />}
        renderItem={({ item: d }) => (
          <TouchableOpacity style={styles.item} onPress={() => setSelected(d)}>
            <View style={styles.itemMain}>
              <Text style={styles.name}>{d.fullName}</Text>
              <Text style={styles.amount}>{formatCurrency(toNumber(d.amount))}</Text>
              <Text style={styles.meta}>{d.bank} · {d.investmentPeriod} · {formatDate(d.depositDate)}</Text>
            </View>
            <View style={styles.itemRight}>
              <StatusBadge status={d.status} />
              {d.status === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.confirmBtn} onPress={() => setAction({ deposit: d, type: 'confirm' })}>
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => setAction({ deposit: d, type: 'reject' })}>
                    <Ionicons name="close" size={16} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
      {selected && (
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{t('admin.deposits.detailTitle')}</Text>
            <TouchableOpacity onPress={() => setSelected(null)}>
              <Ionicons name="close" size={22} color={COLORS.gray500} />
            </TouchableOpacity>
          </View>
          {selected.receiptUrl && (
            <Image source={{ uri: selected.receiptUrl }} style={styles.receipt} resizeMode="contain" />
          )}
          {[
            [t('admin.deposits.fieldClient'), selected.fullName],
            [t('admin.deposits.fieldBank'), selected.bank],
            [t('admin.deposits.fieldAmount'), formatCurrency(toNumber(selected.amount))],
            [t('admin.deposits.fieldDate'), formatDate(selected.depositDate)],
            [t('admin.deposits.fieldReference'), selected.referenceNumber],
            [t('admin.deposits.fieldPeriod'), selected.investmentPeriod],
            [t('admin.deposits.fieldStatus'), selected.status],
            ['Submitted', formatDateTime(selected.submittedAt)],
            selected.rejectionNote ? [t('admin.deposits.fieldRejectionNote'), selected.rejectionNote] : null,
          ].filter((row): row is [string, string] => row !== null).map(([k, v]) => (
            <View key={k as string} style={styles.row}>
              <Text style={styles.rowKey}>{k as string}</Text>
              <Text style={styles.rowVal}>{v as string}</Text>
            </View>
          ))}
        </View>
      )}
      {action && (
        <ConfirmRejectSheet
          visible={!!action} action={action.type}
          targetLabel={`${formatCurrency(toNumber(action.deposit.amount))} — ${action.deposit.fullName}`}
          onClose={() => setAction(null)} onConfirm={handleAction}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: COLORS.gray900, padding: 16, paddingBottom: 8 },
  list: { padding: 16, paddingTop: 0, paddingBottom: 32 },
  item: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  itemMain: { flex: 1 },
  itemRight: { alignItems: 'flex-end', gap: 6 },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.gray900 },
  amount: { fontSize: 13, color: COLORS.gray700, marginTop: 3 },
  meta: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 6 },
  confirmBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.emerald, alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.gray200, alignSelf: 'center', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray900 },
  receipt: { width: '100%', height: 150, borderRadius: 10, marginBottom: 12, backgroundColor: COLORS.gray50 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  rowKey: { fontSize: 13, color: COLORS.gray500 },
  rowVal: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, maxWidth: '60%', textAlign: 'right' },
});
