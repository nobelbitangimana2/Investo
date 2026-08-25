import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, Image } from 'react-native';
import { getDeposits, confirmDepositApi, rejectDepositApi } from '@/lib/api';
import { getAccountantPermissions } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmRejectSheet } from '@/components/ui/ConfirmRejectSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatDate, formatDateTime, toNumber } from '@/lib/utils';
import { COLORS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/lib/auth-store';
import { Ionicons } from '@expo/vector-icons';
import type { Deposit, AccountantPermissions } from '@/types';

export default function AccountantDepositsScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [perms, setPerms] = useState<AccountantPermissions | null>(null);
  const [selected, setSelected] = useState<Deposit | null>(null);
  const [action, setAction] = useState<{ deposit: Deposit; type: 'confirm' | 'reject' } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!user) return;
    const [d, p] = await Promise.all([getDeposits(false), getAccountantPermissions(user.id)]);
    setDeposits(d); setPerms(p);
  }

  useEffect(() => { load(); }, [user]);
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function handleAction(note?: string) {
    if (!action) return;
    if (action.type === 'confirm') {
      const updated = await confirmDepositApi(action.deposit.id);
      setDeposits((prev) => prev.map((d) => d.id === updated.id ? updated : d));
      Alert.alert(t('common.success'), t('accountant.deposits.depositConfirmed'));
    } else {
      const updated = await rejectDepositApi(action.deposit.id, note ?? '');
      setDeposits((prev) => prev.map((d) => d.id === updated.id ? updated : d));
      Alert.alert(t('common.success'), t('accountant.deposits.depositRejected'));
    }
    setSelected(null);
  }

  const canConfirm = user?.role === 'admin' || perms?.confirmDeposits;
  const canReject = user?.role === 'admin' || perms?.rejectDeposits;

  return (
    <View style={styles.root}>
      <Header />
      <Text style={styles.pageTitle}>{t('accountant.deposits.title')}</Text>
      {!canConfirm && !canReject && (
        <View style={styles.viewOnly}>
          <Text style={styles.viewOnlyText}>{t('accountant.deposits.viewOnly')}</Text>
        </View>
      )}
      <FlatList
        data={deposits}
        keyExtractor={(d) => d.id}
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
                  {canConfirm && (
                    <TouchableOpacity style={styles.confirmBtn} onPress={() => setAction({ deposit: d, type: 'confirm' })}>
                      <Ionicons name="checkmark" size={16} color={COLORS.white} />
                    </TouchableOpacity>
                  )}
                  {canReject && (
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => setAction({ deposit: d, type: 'reject' })}>
                      <Ionicons name="close" size={16} color={COLORS.white} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Detail modal */}
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
            ['Client', selected.fullName], selected.phoneNumber ? ['Phone', selected.phoneNumber] : null, ['Bank', selected.bank],
            ['Amount', formatCurrency(toNumber(selected.amount))],
            ['Date', formatDate(selected.depositDate)],
            ['Reference', selected.referenceNumber],
            ['Period', selected.investmentPeriod],
            ['Status', selected.status],
            ['Submitted', formatDateTime(selected.submittedAt)],
            selected.rejectionNote ? ['Rejection Note', selected.rejectionNote] : null,
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
          visible={!!action}
          action={action.type}
          targetLabel={`${formatCurrency(toNumber(action.deposit.amount))} — ${action.deposit.fullName}`}
          onClose={() => setAction(null)}
          onConfirm={handleAction}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: COLORS.gray900, padding: 16, paddingBottom: 8 },
  viewOnly: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d', marginHorizontal: 16, borderRadius: 10, padding: 10, marginBottom: 8 },
  viewOnlyText: { fontSize: 12, color: '#92400e' },
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
