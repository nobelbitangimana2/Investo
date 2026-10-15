import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, Image,
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

  const { control, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header with logo */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logoImg}
            resizeMode="cover"
          />
          <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
          <Text style={styles.subtitle}>{t('auth.signInSubtitle')}</Text>
        </View>

        <View style={styles.card}>
          {/* Email */}
          <Text style={styles.label}>{t('auth.emailAddress')}</Text>
          <Controller control={control} name="email" render={({ field }) => (
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor={COLORS.gray400}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
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
                placeholderTextColor={COLORS.gray400}
                secureTextEntry={!showPassword}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
              />
            )} />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={COLORS.gray400}
              />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

          {/* Email not verified */}
          {unverifiedEmail && (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>{t('auth.verifyEmailFirst')}</Text>
              <Text style={styles.warningText}>
                {t('auth.verificationLinkSent')} {unverifiedEmail}
              </Text>
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                <Text style={styles.resendLink}>
                  {resending ? t('common.sending') : t('auth.resendVerification')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sign in button */}
          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.buttonText}>{t('auth.signIn')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.linkText}>
              {t('auth.noAccount')}{' '}
              <Text style={styles.link}>{t('auth.createOne')}</Text>
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

  // Header
  header: { alignItems: 'center', paddingVertical: 40 },
  logoImg: { width: 72, height: 72, borderRadius: 20, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.white, marginBottom: 6 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },

  // Card
  card: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },

  // Form
  label: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 10,
    padding: 14, fontSize: 14, color: COLORS.gray900, backgroundColor: COLORS.white,
  },
  inputError: { borderColor: COLORS.red },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },
  errorText: { fontSize: 12, color: COLORS.red, marginTop: 4, marginBottom: 4 },

  // Warning
  warningBox: {
    backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fcd34d',
    borderRadius: 10, padding: 14, marginTop: 12,
  },
  warningTitle: { fontSize: 13, fontWeight: '700', color: '#92400e', marginBottom: 4 },
  warningText: { fontSize: 12, color: '#78350f', marginBottom: 6 },
  resendLink: { fontSize: 12, fontWeight: '700', color: '#92400e', textDecorationLine: 'underline' },

  // Button
  button: {
    backgroundColor: COLORS.navy, borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 24, marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },

  // Footer link
  linkText: { textAlign: 'center', fontSize: 13, color: COLORS.gray500 },
  link: { color: COLORS.navy, fontWeight: '700' },
});
