import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/lib/auth-store';
import { changePasswordApi, uploadAvatarApi } from '@/lib/api';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/layout/Header';
import { COLORS } from '@/constants/config';
import { getInitials } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export default function AdminSettingsScreen() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  async function handleAvatarPick() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const a = result.assets[0];
    setAvatarUploading(true);
    try {
      const res = await uploadAvatarApi(a.uri, a.fileName ?? 'avatar.jpg', a.mimeType ?? 'image/jpeg');
      updateUser({ profilePicture: res.profilePicture });
      Alert.alert(t('common.success'), t('admin.settings.avatarSuccess'));
    } catch (err) { Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error')); }
    finally { setAvatarUploading(false); }
  }

  async function handleSavePw() {
    if (newPw.length < 8) { Alert.alert(t('common.error'), t('admin.settings.pwMin8')); return; }
    if (newPw !== confirmPw) { Alert.alert(t('common.error'), t('admin.settings.pwNoMatch')); return; }
    setSavingPw(true);
    try {
      await changePasswordApi(currentPw, newPw);
      Alert.alert(t('common.success'), t('admin.settings.pwSuccess'));
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) { Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error')); }
    finally { setSavingPw(false); }
  }

  return (
    <View style={styles.root}>
      <Header />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.pageTitle}>{t('admin.settings.title')}</Text>

          <Card title={t('admin.settings.profilePicture')}>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(user?.name ?? 'A')}</Text></View>
              <View style={styles.avatarInfo}>
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.email}>{user?.email}</Text>
                <Text style={styles.role}>{user?.role}</Text>
                <TouchableOpacity onPress={handleAvatarPick} disabled={avatarUploading}>
                  <Text style={styles.changePhoto}>{avatarUploading ? t('common.uploading') : t('admin.settings.changePhoto')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          <Card title={t('common.language')}>
            <View style={styles.langRow}>
              <Text style={styles.langLabel}>{t('common.language')}</Text>
              <LanguageSwitcher />
            </View>
          </Card>

          <Card title={t('admin.settings.changePassword')}>
            <FormField label={t('admin.settings.currentPassword')} value={currentPw} onChangeText={setCurrentPw} secureTextEntry placeholder="••••••••" />
            <FormField label={t('admin.settings.newPassword')} value={newPw} onChangeText={setNewPw} secureTextEntry placeholder={t('admin.settings.newPasswordPlaceholder')} />
            <FormField label={t('admin.settings.confirmNewPassword')} value={confirmPw} onChangeText={setConfirmPw} secureTextEntry placeholder={t('admin.settings.confirmNewPasswordPlaceholder')} />
            <Button title={t('admin.settings.updatePassword')} onPress={handleSavePw} loading={savingPw} />
          </Card>
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  content: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: COLORS.gray900, marginBottom: 14 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  avatarInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.gray900 },
  email: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
  role: { fontSize: 11, color: COLORS.gray400, textTransform: 'capitalize', marginTop: 1 },
  changePhoto: { fontSize: 13, color: COLORS.navy, fontWeight: '600', marginTop: 6 },
  langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  langLabel: { fontSize: 14, color: COLORS.gray700, fontWeight: '500' },
});
