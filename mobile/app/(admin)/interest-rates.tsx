import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, Alert, RefreshControl, TextInput,
} from 'react-native';
import { getInterestRates, upsertInterestRateApi, deleteInterestRateApi } from '@/lib/api';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';
import { COLORS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { InterestRate } from '@/types';

// Period must be a number followed by month(s) or year(s)
const PERIOD_REGEX = /^\d+\s+(month|months|year|years)$/i;

type ModalMode = 'add' | 'edit' | null;

export default function InterestRatesScreen() {
  const { t } = useTranslation();
  const [rates, setRates] = useState<InterestRate[]>([]);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<InterestRate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InterestRate | null>(null);
  const [period, setPeriod] = useState('');
  const [rate, setRate] = useState('');
  const [periodError, setPeriodError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load() { setRates(await getInterestRates()); }
  useEffect(() => { load(); }, []);
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  // Set of configured period names (lower-case) for duplicate detection
  const configuredPeriods = new Set(rates.map((r) => r.investmentPeriod.toLowerCase()));

  function openAdd() {
    setEditTarget(null);
    setPeriod(''); setRate(''); setPeriodError('');
    setModalMode('add');
  }

  function openEdit(r: InterestRate) {
    setEditTarget(r);
    setPeriod(r.investmentPeriod);
    setRate(String(r.ratePercentage));
    setPeriodError('');
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditTarget(null);
    setPeriod(''); setRate(''); setPeriodError('');
  }

  function validatePeriod(val: string): string {
    if (!val.trim()) return 'Period name is required';
    if (!PERIOD_REGEX.test(val.trim())) return 'Must be a number followed by Months or Years (e.g. 3 Months)';
    if (modalMode === 'add' && configuredPeriods.has(val.trim().toLowerCase())) {
      return `"${val.trim()}" already exists. Use Edit to change its rate.`;
    }
    return '';
  }

  async function handleSave() {
    const err = validatePeriod(period);
    if (err) { setPeriodError(err); return; }
    if (!rate || isNaN(Number(rate))) {
      Alert.alert(t('common.error'), 'Please enter a valid rate'); return;
    }

    setSaving(true);
    try {
      // Normalise: "3 months" → "3 Months"
      const normalised = period.trim().replace(
        /^(\d+)\s+(month|months|year|years)$/i,
        (_, n, unit) => `${n} ${unit.charAt(0).toUpperCase() + unit.slice(1).toLowerCase()}`
      );
      const updated = await upsertInterestRateApi(normalised, Number(rate));
      setRates((prev) => {
        const exists = prev.find((r) => r.investmentPeriod === updated.investmentPeriod);
        return exists
          ? prev.map((r) => r.investmentPeriod === updated.investmentPeriod ? updated : r)
          : [...prev, updated];
      });
      Alert.alert(t('common.success'), t('admin.interestRates.rateUpdated', { period: normalised, rate }));
      closeModal();
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error'));
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteInterestRateApi(deleteTarget.investmentPeriod);
      setRates((prev) => prev.filter((r) => r.investmentPeriod !== deleteTarget.investmentPeriod));
      Alert.alert(t('common.success'), t('admin.interestRates.rateDeleted', { period: deleteTarget.investmentPeriod }));
      setDeleteTarget(null);
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error'));
    } finally { setDeleting(false); }
  }

  return (
    <View style={styles.root}>
      <Header />
      <View style={styles.topRow}>
        <Text style={styles.pageTitle}>{t('admin.interestRates.title')}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={18} color={COLORS.white} />
          <Text style={styles.addBtnText}>{t('admin.interestRates.addRate')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rates}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No interest rates configured yet.</Text>
        }
        renderItem={({ item: r }) => (
          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <Text style={styles.period}>{r.investmentPeriod}</Text>
              <Text style={styles.updated}>{t('admin.interestRates.colLastUpdated')}: {formatDate(r.dateUpdated)}</Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.rateVal}>{r.ratePercentage}%</Text>
              <TouchableOpacity onPress={() => openEdit(r)} style={styles.iconBtn}>
                <Ionicons name="pencil" size={16} color={COLORS.navy} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDeleteTarget(r)} style={styles.iconBtn}>
                <Ionicons name="trash" size={16} color={COLORS.red} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Add / Edit Modal */}
      <Modal
        visible={modalMode !== null}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {modalMode === 'edit'
                ? t('admin.interestRates.editTitle', { period: editTarget?.investmentPeriod })
                : t('admin.interestRates.addTitle')}
            </Text>

            {/* Period — read-only in edit, free-text in add */}
            {modalMode === 'edit' ? (
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyLabel}>{t('admin.interestRates.investmentPeriod')}</Text>
                <Text style={styles.readOnlyValue}>{editTarget?.investmentPeriod}</Text>
              </View>
            ) : (
              <View>
                <Text style={styles.fieldLabel}>{t('admin.interestRates.investmentPeriod')}</Text>
                <TextInput
                  style={[styles.textInput, periodError ? styles.inputError : null]}
                  value={period}
                  onChangeText={(v) => { setPeriod(v); if (periodError) setPeriodError(validatePeriod(v)); }}
                  placeholder={t('admin.interestRates.periodTypePlaceholder')}
                  placeholderTextColor={COLORS.gray400}
                  autoCapitalize="words"
                />
                {periodError ? (
                  <Text style={styles.errorText}>{periodError}</Text>
                ) : period.length >= 2 && configuredPeriods.has(period.trim().toLowerCase()) ? (
                  <Text style={styles.errorText}>
                    This period already exists. Use Edit ✏️ on that row instead.
                  </Text>
                ) : null}
                <Text style={styles.hint}>e.g. 3 Months, 1 Year, 18 Months</Text>
              </View>
            )}

            <FormField
              label={t('admin.interestRates.rateLabel')}
              value={rate}
              onChangeText={setRate}
              keyboardType="decimal-pad"
              placeholder={t('admin.interestRates.ratePlaceholder')}
            />

            <View style={styles.modalBtns}>
              <Button title={t('common.cancel')} onPress={closeModal} variant="outline" style={styles.flex1} />
              <View style={{ width: 10 }} />
              <Button
                title={t('admin.interestRates.saveRate')}
                onPress={handleSave}
                loading={saving}
                disabled={modalMode === 'add' && (!!periodError || configuredPeriods.has(period.trim().toLowerCase()))}
                style={styles.flex1}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete confirm Modal */}
      <Modal
        visible={!!deleteTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.alertSheet}>
            <Text style={styles.alertTitle}>{t('admin.interestRates.deleteConfirmTitle')}</Text>
            <Text style={styles.alertMsg}>
              {t('admin.interestRates.deleteConfirmMessage', { period: deleteTarget?.investmentPeriod ?? '' })}
            </Text>
            <View style={styles.modalBtns}>
              <Button
                title={t('common.cancel')}
                onPress={() => setDeleteTarget(null)}
                variant="outline"
                style={styles.flex1}
                disabled={deleting}
              />
              <View style={{ width: 10 }} />
              <Button
                title={t('common.delete')}
                onPress={handleDelete}
                loading={deleting}
                variant="danger"
                style={styles.flex1}
              />
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
  empty: { textAlign: 'center', color: COLORS.gray400, marginTop: 40, fontSize: 14 },

  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  itemLeft: { flex: 1 },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  period: { fontSize: 15, fontWeight: '700', color: COLORS.gray900 },
  updated: { fontSize: 12, color: COLORS.gray400, marginTop: 3 },
  rateVal: { fontSize: 20, fontWeight: '700', color: COLORS.emerald, marginRight: 4 },
  iconBtn: { padding: 6 },

  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.gray200, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: COLORS.gray900, marginBottom: 16 },

  readOnlyField: { marginBottom: 16 },
  readOnlyLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  readOnlyValue: { fontSize: 16, fontWeight: '700', color: COLORS.gray900 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginBottom: 6 },
  textInput: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.gray900, backgroundColor: COLORS.white, marginBottom: 4 },
  inputError: { borderColor: COLORS.red },
  errorText: { fontSize: 12, color: COLORS.red, marginBottom: 4 },
  hint: { fontSize: 11, color: COLORS.gray400, marginBottom: 12 },

  modalBtns: { flexDirection: 'row', marginTop: 8 },
  flex1: { flex: 1 },

  alertSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, marginHorizontal: 0 },
  alertTitle: { fontSize: 17, fontWeight: '700', color: COLORS.gray900, marginBottom: 8 },
  alertMsg: { fontSize: 14, color: COLORS.gray600, marginBottom: 20, lineHeight: 20 },
});
