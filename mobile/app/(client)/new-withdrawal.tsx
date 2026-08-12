import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { withdrawalSchema, type WithdrawalFormValues } from '@/lib/zod-schemas';
import { submitWithdrawalApi, getInvestments } from '@/lib/api';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/layout/Header';
import { formatCurrency, toNumber } from '@/lib/utils';
import { COLORS, BANKS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { Investment } from '@/types';

export default function NewWithdrawalScreen() {
  const { t } = useTranslation();
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => { getInvestments(true).then(setInvestments); }, []);

  const totalBalance = investments.reduce((s, i) => s + toNumber(i.currentPrincipal) + toNumber(i.accruedInterest), 0);
  const totalPrincipal = investments.reduce((s, i) => s + toNumber(i.currentPrincipal), 0);
  const totalAccrued = investments.reduce((s, i) => s + toNumber(i.accruedInterest), 0);

  const { control, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<WithdrawalFormValues>({ resolver: zodResolver(withdrawalSchema) });

  async function onSubmit(data: WithdrawalFormValues) {
    if (totalBalance === 0) { Alert.alert(t('common.error'), t('client.withdrawals.form.noBalance')); return; }
    if (data.amount > totalBalance) { Alert.alert(t('common.error'), t('client.withdrawals.form.insufficientBalance', { amount: formatCurrency(totalBalance) })); return; }
    try {
      await submitWithdrawalApi({ ...data, bankToTransferTo: data.bankToTransferTo });
      Alert.alert(t('common.success'), t('client.withdrawals.form.successMessage'));
      router.back();
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error'));
    }
  }

  return (
    <View style={styles.root}>
      <Header showBack title={t('client.withdrawals.form.title')} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Balance summary */}
          <Card title={t('client.withdrawals.form.availableBalance')}>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>{t('client.withdrawals.form.totalBalance')}</Text>
                <Text style={[styles.balanceVal, { color: COLORS.navy }]}>{formatCurrency(totalBalance)}</Text>
                <Text style={styles.balanceSub}>{t('client.withdrawals.form.maxWithdrawable')}</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>{t('client.withdrawals.form.principal')}</Text>
                <Text style={styles.balanceVal}>{formatCurrency(totalPrincipal)}</Text>
                <Text style={styles.balanceSub}>{t('client.withdrawals.form.remainingCapital')}</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>{t('client.withdrawals.form.accruedInterest')}</Text>
                <Text style={[styles.balanceVal, { color: COLORS.emerald }]}>{formatCurrency(totalAccrued)}</Text>
                <Text style={styles.balanceSub}>{t('client.withdrawals.form.deductedFirst')}</Text>
              </View>
            </View>
          </Card>

          {/* Rules notice */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={18} color={COLORS.blue} />
            <Text style={styles.infoText}>{t('client.withdrawals.form.howItWorks')}: {t('client.withdrawals.form.ruleInterestFirst')}</Text>
          </View>

          <Card title={t('client.withdrawals.form.sectionDetails')}>
            <Controller control={control} name="fullName" render={({ field }) => (
              <FormField label={t('client.withdrawals.form.fullName')} value={field.value} onChangeText={field.onChange} error={errors.fullName?.message} placeholder={t('client.withdrawals.form.fullNamePlaceholder')} />
            )} />

            <Text style={styles.label}>{t('client.withdrawals.form.bankToTransfer')}</Text>
            <View style={styles.chipRow}>
              <Controller control={control} name="bankToTransferTo" render={({ field }) =>
                BANKS.map((b) => (
                  <TouchableOpacity key={b} style={[styles.chip, field.value === b && styles.chipActive]} onPress={() => field.onChange(b)}>
                    <Text style={[styles.chipText, field.value === b && styles.chipTextActive]}>{b}</Text>
                  </TouchableOpacity>
                ))
              } />
            </View>
            {errors.bankToTransferTo && <Text style={styles.errorText}>{errors.bankToTransferTo.message}</Text>}

            <Controller control={control} name="accountNumber" render={({ field }) => (
              <FormField label={t('client.withdrawals.form.accountNumber')} value={field.value} onChangeText={field.onChange} error={errors.accountNumber?.message} placeholder={t('client.withdrawals.form.accountNumberPlaceholder')} />
            )} />
            <Controller control={control} name="recipientName" render={({ field }) => (
              <FormField label={t('client.withdrawals.form.recipientName')} value={field.value} onChangeText={field.onChange} error={errors.recipientName?.message} placeholder={t('client.withdrawals.form.recipientPlaceholder')} />
            )} />
            <Controller control={control} name="amount" render={({ field }) => (
              <FormField label={t('client.withdrawals.form.amount')} value={field.value ? String(field.value) : ''} onChangeText={(v) => field.onChange(Number(v))} error={errors.amount?.message} keyboardType="numeric" placeholder={t('client.withdrawals.form.amountPlaceholder')} />
            )} />
            {totalBalance > 0 && <Text style={styles.hint}>{t('client.withdrawals.form.availableLabel')} {formatCurrency(totalBalance)}</Text>}
          </Card>

          <Button title={t('client.withdrawals.form.submitButton')} onPress={handleSubmit(onSubmit)} loading={isSubmitting} size="lg" />
          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  content: { padding: 16, paddingBottom: 40 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  balanceItem: { flex: 1, alignItems: 'center' },
  balanceLabel: { fontSize: 11, color: COLORS.gray500, textAlign: 'center' },
  balanceVal: { fontSize: 14, fontWeight: '700', color: COLORS.gray900, marginTop: 4 },
  balanceSub: { fontSize: 10, color: COLORS.gray400, marginTop: 2, textAlign: 'center' },
  infoBox: { flexDirection: 'row', gap: 8, backgroundColor: '#eff6ff', borderRadius: 10, padding: 12, marginBottom: 12, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 12, color: '#1d4ed8', lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginBottom: 8, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: COLORS.gray200, backgroundColor: COLORS.white },
  chipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  chipText: { fontSize: 13, color: COLORS.gray600 },
  chipTextActive: { color: COLORS.white, fontWeight: '700' },
  errorText: { fontSize: 12, color: COLORS.red, marginBottom: 8 },
  hint: { fontSize: 12, color: COLORS.gray400, marginTop: -4, marginBottom: 8 },
});
