import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { getWithdrawals, confirmWithdrawalApi, rejectWithdrawalApi } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmRejectSheet } from '@/components/ui/ConfirmRejectSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/layout/Header';
import { formatCurrency, formatDate, toNumber } from '@/lib/utils';
import { COLORS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { Withdrawal } from '@/types';

export default function AdminWithdrawalsScreen() {
  const { t } = useTranslation();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [action, setAction] = useState<{ w: Withdrawal; type: 'confirm' | 'reject' } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() { setWithdrawals(await getWithdrawals(false)); }
  useEffect(() => { load(); }, []);
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function handleAction(note?: string) {
    if (!action) return;
    if (action.type === 'confirm') {
      const updated = await confirmWithdrawalApi(action.w.id);
      setWithdrawals((prev) => prev.map((w) => w.id === updated.id ? updated : w));
      Alert.alert(t('common.success'), t('admin.withdrawals.withdrawalConfirmed'));
    } else {
      const updated = await rejectWithdrawalApi(action.w.id, note ?? '');
      setWithdrawals((prev) => prev.map((w) => w.id === updated.id ? updated : w));
      Alert.alert(t('common.success'), t('admin.withdrawals.withdrawalRejected'));
    }
  }

  return (
    <View style={styles.root}>
      <Header />
      <Text style={styles.pageTitle}>{t('admin.withdrawals.title')}</Text>
      <FlatList
        data={withdrawals} keyExtractor={(w) => w.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState icon="arrow-up-circle-outline" title="No withdrawals." />}
        renderItem={({ item: w }) => (
          <View style={styles.item}>
            <View style={styles.itemMain}>
              <Text style={styles.name}>{w.fullName}</Text>
              <Text style={styles.amount}>{formatCurrency(toNumber(w.amount))}</Text>
              <Text style={styles.meta}>{w.bankToTransferTo} → {w.recipientName} · {formatDate(w.requestedAt)}</Text>
              {w.rejectionNote ? <Text style={styles.note}>{w.rejectionNote}</Text> : null}
            </View>
            <View style={styles.itemRight}>
              <StatusBadge status={w.status} />
              {w.status === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.confirmBtn} onPress={() => setAction({ w, type: 'confirm' })}>
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => setAction({ w, type: 'reject' })}>
                    <Ionicons name="close" size={16} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      />
      {action && (
        <ConfirmRejectSheet
          visible={!!action} action={action.type}
          targetLabel={`${formatCurrency(toNumber(action.w.amount))} — ${action.w.fullName}`}
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
  note: { fontSize: 11, color: COLORS.red, marginTop: 3 },
  actionRow: { flexDirection: 'row', gap: 6 },
  confirmBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.emerald, alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center' },
});
