import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormValues } from '@/lib/zod-schemas';
import { registerApi, resendVerificationApi } from '@/lib/api';
import { COLORS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resending, setResending] = useState(false);

  const { control, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema), mode: 'onChange' });

  const password = watch('password') ?? '';

  function getStrength(pw: string) {
    const checks = [
      pw.length >= 8, /[A-Z]/.test(pw), /[a-z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw),
    ];
    return checks.filter(Boolean).length;
  }

  const strength = getStrength(password);
  const strengthColors = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#10b981'];
  const strengthLabels = [
    t('auth.register.strengthVeryWeak'), t('auth.register.strengthWeak'),
    t('auth.register.strengthFair'), t('auth.register.strengthGood'), t('auth.register.strengthStrong'),
  ];

  async function onSubmit(data: RegisterFormValues) {
    try {
      await registerApi({ firstName: data.firstName, middleName: data.middleName, lastName: data.lastName, email: data.email, password: data.password });
      setRegisteredEmail(data.email);
      setRegistered(true);
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error'));
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await resendVerificationApi(registeredEmail);
      Alert.alert(t('common.success'), t('auth.register.successResend'));
    } catch { Alert.alert(t('common.error'), t('auth.resendFailed')); }
    finally { setResending(false); }
  }

  if (registered) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}><Ionicons name="checkmark-circle" size={56} color={COLORS.emerald} /></View>
        <Text style={styles.successTitle}>{t('auth.register.accountCreated')}</Text>
        <Text style={styles.successMsg}>{t('auth.register.accountCreatedMessage')}</Text>
        <Text style={styles.successEmail}>{registeredEmail}</Text>
        <Text style={styles.successHint}>{t('auth.register.toVerify')}</Text>
        <TouchableOpacity style={styles.button} onPress={handleResend} disabled={resending}>
          {resending ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>{t('auth.register.resendEmail')}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.outlineButton} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.outlineButtonText}>{t('auth.register.alreadyVerified')} {t('auth.signIn')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setRegistered(false); setRegisteredEmail(''); }}>
          <Text style={styles.linkText}>{t('auth.register.changEmail')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.navy }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.logoBox}><Ionicons name="trending-up" size={28} color={COLORS.white} /></View>
          <Text style={styles.title}>{t('auth.register.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.register.subtitle')}</Text>
        </View>

        <View style={styles.card}>
          {/* Name row */}
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={styles.label}>{t('auth.register.firstName')} *</Text>
              <Controller control={control} name="firstName" render={({ field }) => (
                <TextInput style={[styles.input, errors.firstName && styles.inputError]} placeholder="Kevin" value={field.value} onChangeText={field.onChange} />
              )} />
              {errors.firstName && <Text style={styles.errorText}>{errors.firstName.message}</Text>}
            </View>
            <View style={[styles.flex1, { marginLeft: 8 }]}>
              <Text style={styles.label}>{t('auth.register.lastName')} *</Text>
              <Controller control={control} name="lastName" render={({ field }) => (
                <TextInput style={[styles.input, errors.lastName && styles.inputError]} placeholder="Mutabazi" value={field.value} onChangeText={field.onChange} />
              )} />
              {errors.lastName && <Text style={styles.errorText}>{errors.lastName.message}</Text>}
            </View>
          </View>

          <Text style={styles.label}>{t('auth.register.middleName')}</Text>
          <Controller control={control} name="middleName" render={({ field }) => (
            <TextInput style={styles.input} placeholder={t('auth.register.middleNamePlaceholder')} value={field.value ?? ''} onChangeText={field.onChange} />
          )} />

          <Text style={styles.label}>{t('auth.register.emailAddress')} *</Text>
          <Controller control={control} name="email" render={({ field }) => (
            <TextInput style={[styles.input, errors.email && styles.inputError]} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={field.value} onChangeText={field.onChange} />
          )} />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

          <Text style={styles.label}>{t('auth.register.password')} *</Text>
          <View style={styles.passwordRow}>
            <Controller control={control} name="password" render={({ field }) => (
              <TextInput style={[styles.input, styles.passwordInput, errors.password && styles.inputError]} placeholder={t('auth.register.passwordPlaceholder')} secureTextEntry={!showPassword} value={field.value} onChangeText={field.onChange} />
            )} />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.gray400} />
            </TouchableOpacity>
          </View>
          {password.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <View style={styles.strengthBar}>
                {[0,1,2,3,4].map((i) => (
                  <View key={i} style={[styles.strengthSegment, { backgroundColor: i < strength ? strengthColors[strength - 1] : COLORS.gray200 }]} />
                ))}
              </View>
              <Text style={{ fontSize: 12, color: strengthColors[strength - 1] || COLORS.gray400 }}>{strengthLabels[strength - 1] || ''}</Text>
            </View>
          )}
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

          <Text style={styles.label}>{t('auth.register.confirmPassword')} *</Text>
          <View style={styles.passwordRow}>
            <Controller control={control} name="confirmPassword" render={({ field }) => (
              <TextInput style={[styles.input, styles.passwordInput, errors.confirmPassword && styles.inputError]} placeholder={t('auth.register.confirmPasswordPlaceholder')} secureTextEntry={!showConfirm} value={field.value} onChangeText={field.onChange} />
            )} />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
              <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color={COLORS.gray400} />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}

          <TouchableOpacity style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>{t('auth.register.createAccount')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.linkText}>{t('auth.register.alreadyHaveAccount')} <Text style={styles.link}>{t('auth.register.signIn')}</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 24 },
  header: { alignItems: 'center', paddingVertical: 24 },
  backBtn: { position: 'absolute', left: 0, top: 8, padding: 8 },
  logoBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.white, marginBottom: 6 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24 },
  row: { flexDirection: 'row', marginBottom: 0 },
  flex1: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 10, padding: 13, fontSize: 14, color: COLORS.gray900 },
  inputError: { borderColor: COLORS.red },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 13 },
  errorText: { fontSize: 12, color: COLORS.red, marginTop: 4 },
  strengthBar: { flexDirection: 'row', gap: 4, marginBottom: 4, marginTop: 8 },
  strengthSegment: { flex: 1, height: 4, borderRadius: 2 },
  button: { backgroundColor: COLORS.navy, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20, marginBottom: 12 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  outlineButton: { borderWidth: 1, borderColor: COLORS.navy, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12 },
  outlineButtonText: { color: COLORS.navy, fontSize: 14, fontWeight: '600' },
  linkText: { textAlign: 'center', fontSize: 13, color: COLORS.gray500 },
  link: { color: COLORS.navy, fontWeight: '700' },
  successContainer: { flex: 1, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: { marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '700', color: COLORS.gray900, marginBottom: 12 },
  successMsg: { fontSize: 14, color: COLORS.gray500, textAlign: 'center', marginBottom: 4 },
  successEmail: { fontSize: 14, fontWeight: '700', color: COLORS.gray900, marginBottom: 4 },
  successHint: { fontSize: 14, color: COLORS.gray500, textAlign: 'center', marginBottom: 24 },
});
