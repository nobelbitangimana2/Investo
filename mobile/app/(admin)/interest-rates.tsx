import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, Alert, RefreshControl } from 'react-native';
import { getInterestRates, upsertInterestRateApi } from '@/lib/api';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';
import { COLORS, INVESTMENT_PERIODS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { InterestRate } from '@/types';

export default function InterestRatesScreen() {
  const { t } = useTranslation();
  const [rates, setRates] = useState<InterestRate[]>([]);
  const [editing, setEditing] = useState<InterestRate | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [period, setPeriod] = useState('');
  const [rate, setRate] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load() { setRates(await getInterestRates()); }
  useEffect(() => { load(); }, []);
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  function startEdit(r: InterestRate) {
    setEditing(r); setPeriod(r.investmentPeriod); setRate(String(r.ratePercentage));
  }

  async function handleSave() {
    if (!period || !rate) return;
    setSaving(true);
    try {
      const updated = await upsertInterestRateApi(period, Number(rate));
      setRates((prev) => {
        const exists = prev.find((r) => r.investmentPeriod === updated.investmentPeriod);
        return exists ? prev.map((r) => r.investmentPeriod === updated.investmentPeriod ? updated : r) : [...prev, updated];
      });
      Alert.alert(t('common.success'), t('admin.interestRates.rateUpdated', { period, rate }));
      setEditing(null); setShowAdd(false); setPeriod(''); setRate('');
    } catch (err) { Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error')); }
    finally { setSaving(false); }
  }

  return (
    <View style={styles.root}>
      <Header />
      <View style={styles.topRow}>
        <Text style={styles.pageTitle}>{t('admin.interestRates.title')}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setPeriod(''); setRate(''); setShowAdd(true); }}>
          <Ionicons name="add" size={18} color={COLORS.white} />
          <Text style={styles.addBtnText}>{t('admin.interestRates.addUpdate')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rates} keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item: r }) => (
          <View style={styles.item}>
            <View>
              <Text style={styles.period}>{r.investmentPeriod}</Text>
              <Text style={styles.updated}>{t('admin.interestRates.colLastUpdated')}: {formatDate(r.dateUpdated)}</Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.rateVal}>{r.ratePercentage}%</Text>
              <TouchableOpacity onPress={() => startEdit(r)} style={styles.editBtn}>
                <Ionicons name="pencil" size={16} color={COLORS.navy} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Edit / Add Modal */}
      <Modal visible={!!editing || showAdd} transparent animationType="slide" onRequestClose={() => { setEditing(null); setShowAdd(false); }}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{editing ? t('admin.interestRates.editTitle', { period: editing.investmentPeriod }) : t('admin.interestRates.addTitle')}</Text>

            {!editing && (
              <View>
                <Text style={styles.label}>{t('admin.interestRates.investmentPeriod')}</Text>
                <View style={styles.chipRow}>
                  {INVESTMENT_PERIODS.map((p) => (
                    <TouchableOpacity key={p} style={[styles.chip, period === p && styles.chipActive]} onPress={() => setPeriod(p)}>
                      <Text style={[styles.chipText, period === p && styles.chipTextActive]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <FormField label={t('admin.interestRates.rateLabel')} value={rate} onChangeText={setRate} keyboardType="decimal-pad" placeholder={t('admin.interestRates.ratePlaceholder')} />

            <View style={styles.modalBtns}>
              <Button title={t('common.cancel')} onPress={() => { setEditing(null); setShowAdd(false); }} variant="outline" style={styles.flex1} />
              <View style={{ width: 10 }} />
              <Button title={t('admin.interestRates.saveRate')} onPress={handleSave} loading={saving} style={styles.flex1} />
            </View>
          </View>
        </View>
      </Modal>
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
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  period: { fontSize: 15, fontWeight: '700', color: COLORS.gray900 },
  updated: { fontSize: 12, color: COLORS.gray400, marginTop: 3 },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rateVal: { fontSize: 20, fontWeight: '700', color: COLORS.emerald },
  editBtn: { padding: 6 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.gray200, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: COLORS.gray900, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: COLORS.gray200, backgroundColor: COLORS.white },
  chipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  chipText: { fontSize: 12, color: COLORS.gray600 },
  chipTextActive: { color: COLORS.white, fontWeight: '700' },
  modalBtns: { flexDirection: 'row', marginTop: 8 },
  flex1: { flex: 1 },
});
