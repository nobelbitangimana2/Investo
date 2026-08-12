import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { verifyEmailApi, resendVerificationApi } from '@/lib/api';
import { COLORS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

type State = 'loading' | 'success' | 'expired' | 'invalid' | 'already-verified';

export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [state, setState] = useState<State>('loading');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    verifyEmailApi(token)
      .then((res) => setState(res.message.toLowerCase().includes('already') ? 'already-verified' : 'success'))
      .catch((err: Error) => {
        const msg = (err.message ?? '').toLowerCase();
        setState(msg.includes('expired') ? 'expired' : 'invalid');
      });
  }, [token]);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    try {
      await resendVerificationApi(email);
      Alert.alert(t('common.success'), t('auth.verify.newLinkSent'));
    } catch { Alert.alert(t('common.error'), t('auth.verify.resendFailed')); }
    finally { setResending(false); }
  }

  if (state === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.navy} />
        <Text style={styles.loadingText}>{t('auth.verify.verifying')}</Text>
      </View>
    );
  }

  const configs = {
    success: { icon: 'checkmark-circle' as const, color: COLORS.emerald, title: t('auth.verify.successTitle'), subtitle: t('auth.verify.successSubtitle') },
    'already-verified': { icon: 'checkmark-circle' as const, color: COLORS.emerald, title: t('auth.verify.alreadyVerifiedTitle'), subtitle: t('auth.verify.alreadyVerifiedSubtitle') },
    expired: { icon: 'time' as const, color: COLORS.amber, title: t('auth.verify.expiredTitle'), subtitle: t('auth.verify.expiredSubtitle') },
    invalid: { icon: 'close-circle' as const, color: COLORS.red, title: t('auth.verify.invalidTitle'), subtitle: t('auth.verify.invalidSubtitle') },
  };
  const cfg = configs[state];

  return (
    <View style={styles.container}>
      <Ionicons name={cfg.icon} size={72} color={cfg.color} />
      <Text style={styles.title}>{cfg.title}</Text>
      <Text style={styles.subtitle}>{cfg.subtitle}</Text>

      {state === 'expired' && (
        <View style={styles.resendBox}>
          <TextInput style={styles.input} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <TouchableOpacity style={styles.button} onPress={handleResend} disabled={!email || resending}>
            {resending ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>{t('auth.verify.sendNewLink')}</Text>}
          </TouchableOpacity>
        </View>
      )}

      {(state === 'success' || state === 'already-verified') && (
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.buttonText}>{t('auth.verify.signInToInvesto')}</Text>
        </TouchableOpacity>
      )}

      {state === 'invalid' && (
        <>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.buttonText}>{t('auth.verify.backToLogin')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => router.replace('/(auth)/register')}>
            <Text style={styles.outlineBtnText}>{t('auth.verify.createNewAccount')}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { color: COLORS.gray500, fontSize: 14 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: COLORS.white },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.gray900, marginTop: 20, marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.gray500, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  resendBox: { width: '100%', gap: 12, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 10, padding: 14, fontSize: 14, color: COLORS.gray900 },
  button: { backgroundColor: COLORS.navy, borderRadius: 12, padding: 16, alignItems: 'center', width: '100%', marginBottom: 12 },
  buttonText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  outlineBtn: { borderWidth: 1, borderColor: COLORS.navy, borderRadius: 12, padding: 14, alignItems: 'center', width: '100%' },
  outlineBtnText: { color: COLORS.navy, fontSize: 14, fontWeight: '600' },
});
