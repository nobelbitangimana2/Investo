import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { depositSchema, type DepositFormValues } from '@/lib/zod-schemas';
import { submitDepositApi, getInterestRates, getActivePartnerBanks } from '@/lib/api';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/layout/Header';
import { formatCurrency } from '@/lib/utils';
import { COLORS, FALLBACK_BANKS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { InterestRate, PartnerBank } from '@/types';

export default function NewDepositScreen() {
  const { t } = useTranslation();
  const [rates, setRates] = useState<InterestRate[]>([]);
  const [partnerBanks, setPartnerBanks] = useState<PartnerBank[]>([]);
  const [receipt, setReceipt] = useState<{ uri: string; name: string; mime: string } | null>(null);

  useEffect(() => {
    getInterestRates().then(setRates);
    getActivePartnerBanks().then(setPartnerBanks);
  }, []);

  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<DepositFormValues>({
      resolver: zodResolver(depositSchema),
      defaultValues: { depositDate: new Date().toISOString().split('T')[0] },
    });

  const watchBank = watch('bank');
  const watchAmount = watch('amount');
  const watchPeriod = watch('investmentPeriod');
  const watchAccountNumber = watch('accountNumber');

  // Find the selected partner bank — used for autofill card and validation
  const bankList = partnerBanks.length > 0
    ? partnerBanks.map((b) => b.name)
    : [...FALLBACK_BANKS];

  const selectedPartnerBank = partnerBanks.find((b) => b.name === watchBank) ?? null;

  // Account number mismatch check
  const accountMismatch =
    selectedPartnerBank &&
    watchAccountNumber &&
    watchAccountNumber.trim() !== selectedPartnerBank.accountNumber.trim();

  const selectedRate = rates.find((r) => r.investmentPeriod === watchPeriod)?.ratePercentage ?? 0;
  const expectedInterest =
    watchAmount && selectedRate ? Math.round(Number(watchAmount) * selectedRate / 100) : 0;

  // Collect unique period names from the rates API
  const periodList = rates.map((r) => r.investmentPeriod);

  async function pickReceipt() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setReceipt({ uri: a.uri, name: a.fileName ?? 'receipt.jpg', mime: a.mimeType ?? 'image/jpeg' });
    }
  }

  async function captureReceipt() {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setReceipt({ uri: a.uri, name: a.fileName ?? 'receipt.jpg', mime: a.mimeType ?? 'image/jpeg' });
    }
  }

  async function onSubmit(data: DepositFormValues) {
    if (accountMismatch) {
      Alert.alert(
        t('common.error'),
        `${t('client.deposits.form.accountMismatchError')}\n\n${t('client.deposits.form.autofillAccountNumber')}: ${selectedPartnerBank!.accountNumber}`,
      );
      return;
    }
    try {
      await submitDepositApi({
        ...data,
        receiptUri: receipt?.uri,
        receiptName: receipt?.name,
        receiptMime: receipt?.mime,
      });
      Alert.alert(t('common.success'), t('client.deposits.form.successMessage'));
      router.back();
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error'));
    }
  }

  return (
    <View style={styles.root}>
      <Header showBack title={t('client.deposits.form.title')} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Info banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={18} color="#3b82f6" style={{ marginTop: 1 }} />
            <Text style={styles.infoText}>{t('client.deposits.form.infoBanner')}</Text>
          </View>

          {/* Autofill card — shown when a bank is selected */}
          {selectedPartnerBank && (
            <View style={styles.autofillCard}>
              <Text style={styles.autofillTitle}>{t('client.deposits.form.autofillLabel')}</Text>
              <View style={styles.autofillRow}>
                <View style={styles.autofillItem}>
                  <Text style={styles.autofillLabel}>{t('client.deposits.form.autofillBank')}</Text>
                  <Text style={styles.autofillValue}>{selectedPartnerBank.name}</Text>
                </View>
                <View style={styles.autofillItem}>
                  <Text style={styles.autofillLabel}>{t('client.deposits.form.autofillAccountName')}</Text>
                  <Text style={styles.autofillValue}>{selectedPartnerBank.accountName}</Text>
                </View>
              </View>
              <View style={{ marginTop: 8 }}>
                <Text style={styles.autofillLabel}>{t('client.deposits.form.autofillAccountNumber')}</Text>
                <Text style={styles.autofillAccountNumber}>{selectedPartnerBank.accountNumber}</Text>
              </View>
            </View>
          )}

          <Card title={t('client.deposits.form.sectionDetails')}>
            <Controller control={control} name="fullName" render={({ field }) => (
              <FormField
                label={t('client.deposits.form.fullName')}
                value={field.value}
                onChangeText={field.onChange}
                error={errors.fullName?.message}
                placeholder={t('client.deposits.form.fullNamePlaceholder')}
              />
            )} />

            {/* Bank chips — dynamic from partner banks API */}
            <Text style={styles.label}>{t('client.deposits.form.bank')}</Text>
            <View style={styles.chipRow}>
              <Controller control={control} name="bank" render={({ field }) =>
                <>{bankList.map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.chip, field.value === b && styles.chipActive]}
                    onPress={() => {
                      field.onChange(b);
                      const partnerBank = partnerBanks.find((bank) => bank.name === b);
                      setValue('accountNumber', partnerBank?.accountNumber ?? '');
                    }}
                  >
                    <Text style={[styles.chipText, field.value === b && styles.chipTextActive]}>{b}</Text>
                  </TouchableOpacity>
                ))}</>
              } />
            </View>
            {errors.bank && <Text style={styles.errorText}>{errors.bank.message}</Text>}

            {/* Account number with mismatch feedback */}
            <Controller control={control} name="accountNumber" render={({ field }) => (
              <FormField
                label={t('client.deposits.form.accountNumber')}
                value={field.value}
                onChangeText={field.onChange}
                error={errors.accountNumber?.message}
                placeholder={selectedPartnerBank
                  ? selectedPartnerBank.accountNumber
                  : t('client.deposits.form.accountNumberPlaceholder')}
              />
            )} />
            {accountMismatch && (
              <View style={styles.mismatchRow}>
                <Ionicons name="alert-circle" size={14} color={COLORS.red} />
                <Text style={styles.mismatchText}>
                  {t('client.deposits.form.accountMismatchWarning', {
                    correct: selectedPartnerBank!.accountNumber,
                  })}
                </Text>
              </View>
            )}
            {selectedPartnerBank && watchAccountNumber && !accountMismatch && (
              <Text style={styles.matchText}>✓ {t('client.deposits.form.accountMatchConfirm')}</Text>
            )}

            <Controller control={control} name="amount" render={({ field }) => (
              <FormField
                label={t('client.deposits.form.amount')}
                value={field.value ? String(field.value) : ''}
                onChangeText={(v) => field.onChange(Number(v))}
                error={errors.amount?.message}
                keyboardType="numeric"
                placeholder={t('client.deposits.form.amountPlaceholder')}
              />
            )} />

            <Controller control={control} name="depositDate" render={({ field }) => (
              <FormField
                label={t('client.deposits.form.depositDate')}
                value={field.value}
                onChangeText={field.onChange}
                error={errors.depositDate?.message}
                placeholder="YYYY-MM-DD"
              />
            )} />

            {/* Investment period chips — dynamic from rates API */}
            <Text style={styles.label}>{t('client.deposits.form.investmentPeriod')}</Text>
            <View style={styles.chipRow}>
              <Controller control={control} name="investmentPeriod" render={({ field }) =>
                <>{periodList.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.chip, field.value === p && styles.chipActive]}
                    onPress={() => field.onChange(p)}
                  >
                    <Text style={[styles.chipText, field.value === p && styles.chipTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}</>
              } />
            </View>
            {errors.investmentPeriod && <Text style={styles.errorText}>{errors.investmentPeriod.message}</Text>}

            <Controller control={control} name="referenceNumber" render={({ field }) => (
              <FormField
                label={t('client.deposits.form.referenceNumber')}
                value={field.value}
                onChangeText={field.onChange}
                error={errors.referenceNumber?.message}
                placeholder={t('client.deposits.form.referencePlaceholder')}
              />
            )} />
          </Card>

          {/* Investment preview */}
          {watchAmount > 0 && watchPeriod && (
            <Card title={t('client.deposits.form.previewCard')}>
              <View style={styles.previewRow}>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>Principal</Text>
                  <Text style={styles.previewVal}>{formatCurrency(Number(watchAmount))}</Text>
                </View>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>{t('client.deposits.form.atRate', { rate: selectedRate })}</Text>
                  <Text style={styles.previewVal}>{selectedRate}%</Text>
                </View>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>{t('client.deposits.form.estimatedInterest')}</Text>
                  <Text style={[styles.previewVal, { color: COLORS.emerald }]}>{formatCurrency(expectedInterest)}</Text>
                </View>
              </View>
            </Card>
          )}

          {/* Receipt upload */}
          <Card title={t('client.deposits.form.receiptUpload')}>
            {receipt ? (
              <View>
                <Image source={{ uri: receipt.uri }} style={styles.receiptPreview} resizeMode="cover" />
                <TouchableOpacity onPress={() => setReceipt(null)} style={styles.removeReceipt}>
                  <Text style={styles.removeReceiptText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadRow}>
                <TouchableOpacity style={styles.uploadBtn} onPress={captureReceipt}>
                  <Ionicons name="camera" size={22} color={COLORS.navy} />
                  <Text style={styles.uploadBtnText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickReceipt}>
                  <Ionicons name="images" size={22} color={COLORS.navy} />
                  <Text style={styles.uploadBtnText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>

          <Button
            title={t('client.deposits.form.submitButton')}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={!!accountMismatch}
            size="lg"
          />
          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  content: { padding: 16, paddingBottom: 40 },

  // Info banner
  infoBanner: {
    flexDirection: 'row', gap: 8, backgroundColor: '#eff6ff',
    borderRadius: 10, padding: 12, marginBottom: 12, alignItems: 'flex-start',
    borderWidth: 1, borderColor: '#bfdbfe',
  },
  infoText: { flex: 1, fontSize: 12, color: '#1d4ed8', lineHeight: 18 },

  // Autofill card
  autofillCard: {
    backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  autofillTitle: {
    fontSize: 10, fontWeight: '700', color: '#15803d',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  autofillRow: { flexDirection: 'row', gap: 16 },
  autofillItem: { flex: 1 },
  autofillLabel: { fontSize: 10, color: '#16a34a', textTransform: 'uppercase', letterSpacing: 0.5 },
  autofillValue: { fontSize: 13, fontWeight: '600', color: '#14532d', marginTop: 2 },
  autofillAccountNumber: {
    fontSize: 18, fontWeight: '800', color: '#14532d',
    letterSpacing: 2, fontVariant: ['tabular-nums'], marginTop: 2,
  },

  // Form
  label: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginBottom: 8, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.gray200, backgroundColor: COLORS.white,
  },
  chipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  chipText: { fontSize: 13, color: COLORS.gray600 },
  chipTextActive: { color: COLORS.white, fontWeight: '700' },
  errorText: { fontSize: 12, color: COLORS.red, marginBottom: 8 },

  // Mismatch feedback
  mismatchRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: -4, marginBottom: 8 },
  mismatchText: { fontSize: 11, color: COLORS.red, flex: 1, lineHeight: 16 },
  matchText: { fontSize: 11, color: COLORS.emerald, marginTop: -4, marginBottom: 8, fontWeight: '600' },

  // Preview
  previewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  previewItem: { alignItems: 'center', flex: 1 },
  previewLabel: { fontSize: 11, color: COLORS.gray500, textAlign: 'center' },
  previewVal: { fontSize: 13, fontWeight: '700', color: COLORS.gray900, marginTop: 4 },

  // Receipt
  receiptPreview: { width: '100%', height: 180, borderRadius: 10, marginBottom: 8 },
  removeReceipt: { alignSelf: 'center' },
  removeReceiptText: { color: COLORS.red, fontSize: 13, fontWeight: '600' },
  uploadRow: { flexDirection: 'row', gap: 12 },
  uploadBtn: {
    flex: 1, borderWidth: 1, borderColor: COLORS.navy, borderRadius: 10,
    borderStyle: 'dashed', alignItems: 'center', paddingVertical: 16, gap: 6,
  },
  uploadBtnText: { fontSize: 13, color: COLORS.navy, fontWeight: '600' },
});
