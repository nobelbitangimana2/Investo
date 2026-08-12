import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormValues } from '@/lib/zod-schemas';
import { loginApi, resendVerificationApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { COLORS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const { control, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const demoAccounts = [
    { label: 'Admin', email: 'admin@investo.bi', password: 'Admin@2024!' },
    { label: 'Accountant', email: 'grace@investo.bi', password: 'Grace@2024!' },
    { label: 'Client', email: 'kevin@example.com', password: 'Client@2024!' },
  ];

  async function onSubmit(data: LoginFormValues) {
    setUnverifiedEmail(null);
    try {
      const user = await loginApi(data.email, data.password);
      login(user);
      const routes: Record<string, string> = {
        admin: '/(admin)/dashboard',
        accountant: '/(accountant)/dashboard',
        client: '/(client)/dashboard',
      };
      router.replace((routes[user.role] ?? '/(auth)/login') as never);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      try {
        const parsed = JSON.parse(msg);
        if (parsed?.code === 'EMAIL_NOT_VERIFIED') {
          setUnverifiedEmail(parsed.email ?? data.email);
          return;
        }
      } catch { /* not JSON */ }
      Alert.alert(t('auth.invalidCredentials'), msg || t('auth.invalidCredentials'));
    }
  }

  async function handleResend() {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      await resendVerificationApi(unverifiedEmail);
      Alert.alert(t('common.success'), t('auth.verificationEmailSent'));
    } catch {
      Alert.alert(t('common.error'), t('auth.resendFailed'));
    } finally { setResending(false); }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="trending-up" size={32} color={COLORS.white} />
          </View>
          <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
          <Text style={styles.subtitle}>{t('auth.signInSubtitle')}</Text>
        </View>

        <View style={styles.card}>
          {/* Demo accounts */}
          <Text style={styles.sectionLabel}>{t('auth.demoAccounts')}</Text>
          <View style={styles.demoRow}>
            {demoAccounts.map((acc) => (
              <TouchableOpacity
                key={acc.email}
                style={styles.demoBtn}
                onPress={() => { setValue('email', acc.email); setValue('password', acc.password); }}
              >
                <Text style={styles.demoBtnLabel}>{acc.label}</Text>
                <Text style={styles.demoBtnEmail} numberOfLines={1}>{acc.email}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider}><Text style={styles.dividerText}>{t('auth.orSignInManually')}</Text></View>

          {/* Email */}
          <Text style={styles.label}>{t('auth.emailAddress')}</Text>
          <Controller control={control} name="email" render={({ field }) => (
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder={t('auth.emailPlaceholder')}
              keyboardType="email-address" autoCapitalize="none"
              value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
            />
          )} />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

          {/* Password */}
          <Text style={styles.label}>{t('auth.password')}</Text>
          <View style={styles.passwordRow}>
            <Controller control={control} name="password" render={({ field }) => (
              <TextInput
                style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                placeholder={t('auth.passwordPlaceholder')}
                secureTextEntry={!showPassword}
                value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
              />
            )} />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.gray400} />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

          {/* Unverified email */}
          {unverifiedEmail && (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>{t('auth.verifyEmailFirst')}</Text>
              <Text style={styles.warningText}>{t('auth.verificationLinkSent')} {unverifiedEmail}</Text>
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                <Text style={styles.resendLink}>{resending ? t('common.sending') : t('auth.resendVerification')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)} disabled={isSubmitting}
          >
            {isSubmitting
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.buttonText}>{t('auth.signIn')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.linkText}>
              {t('auth.noAccount')} <Text style={styles.link}>{t('auth.createOne')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { flexGrow: 1, padding: 24 },
  header: { alignItems: 'center', paddingVertical: 32 },
  logoBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.white, marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)' },
  card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: COLORS.gray400, textTransform: 'uppercase', marginBottom: 10 },
  demoRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  demoBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 10, padding: 10 },
  demoBtnLabel: { fontSize: 12, fontWeight: '700', color: COLORS.gray700 },
  demoBtnEmail: { fontSize: 10, color: COLORS.gray400, marginTop: 2 },
  divider: { alignItems: 'center', marginBottom: 20 },
  dividerText: { fontSize: 12, color: COLORS.gray400 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 10, padding: 14, fontSize: 14, color: COLORS.gray900, marginBottom: 4 },
  inputError: { borderColor: COLORS.red },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },
  errorText: { fontSize: 12, color: COLORS.red, marginBottom: 8 },
  warningBox: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fcd34d', borderRadius: 10, padding: 14, marginBottom: 16 },
  warningTitle: { fontSize: 13, fontWeight: '700', color: '#92400e', marginBottom: 4 },
  warningText: { fontSize: 12, color: '#78350f', marginBottom: 6 },
  resendLink: { fontSize: 12, fontWeight: '700', color: '#92400e', textDecorationLine: 'underline' },
  button: { backgroundColor: COLORS.navy, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  linkText: { textAlign: 'center', fontSize: 13, color: COLORS.gray500 },
  link: { color: COLORS.navy, fontWeight: '700' },
});
