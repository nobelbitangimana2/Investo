import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/lib/auth-store';
import { getClientProfile, updateClientProfileApi, changePasswordApi, uploadAvatarApi, updateContactApi } from '@/lib/api';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/layout/Header';
import { COLORS } from '@/constants/config';
import { getInitials } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function ClientSettingsScreen() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    getClientProfile().then((p) => {
      if (p) { setPhone(p.phone ?? ''); setAddress(p.address ?? ''); setCity(p.city ?? ''); setProvince(p.province ?? ''); setFirstName(p.firstName ?? ''); setLastName(p.lastName ?? ''); }
    });
  }, []);

  async function handleAvatarPick() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const a = result.assets[0];
    setAvatarUploading(true);
    try {
      const res = await uploadAvatarApi(a.uri, a.fileName ?? 'avatar.jpg', a.mimeType ?? 'image/jpeg');
      updateUser({ profilePicture: res.profilePicture });
      Alert.alert(t('common.success'), t('client.settings.avatarSuccess'));
    } catch (err) { Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error')); }
    finally { setAvatarUploading(false); }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      await updateClientProfileApi({ firstName, lastName, phone, address, city, province });
      await updateContactApi({ phone, address, city, province });
      Alert.alert(t('common.success'), t('client.settings.profileSuccess'));
    } catch (err) { Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error')); }
    finally { setSavingProfile(false); }
  }

  async function handleSavePw() {
    if (newPw.length < 8) { Alert.alert(t('common.error'), t('client.settings.pwMin8')); return; }
    if (newPw !== confirmPw) { Alert.alert(t('common.error'), t('client.settings.pwNoMatch')); return; }
    setSavingPw(true);
    try {
      await changePasswordApi(currentPw, newPw);
      Alert.alert(t('common.success'), t('client.settings.pwSuccess'));
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) { Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error')); }
    finally { setSavingPw(false); }
  }

  return (
    <View style={styles.root}>
      <Header />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.pageTitle}>{t('client.settings.title')}</Text>

          {/* Avatar */}
          <Card title={t('client.settings.profilePicture')}>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(user?.name ?? 'U')}</Text>
              </View>
              <View style={styles.avatarInfo}>
                <Text style={styles.avatarName}>{user?.name}</Text>
                <Text style={styles.avatarEmail}>{user?.email}</Text>
                <TouchableOpacity onPress={handleAvatarPick} disabled={avatarUploading}>
                  <Text style={styles.changePhoto}>{avatarUploading ? t('common.uploading') : t('client.settings.changePhoto')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* Personal Info */}
          <Card title={t('client.settings.personalInfo')}>
            <FormField label={t('client.settings.firstName')} value={firstName} onChangeText={setFirstName} />
            <FormField label={t('client.settings.lastName')} value={lastName} onChangeText={setLastName} />
            <FormField label={t('client.settings.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder={t('client.settings.phonePlaceholder')} />
            <FormField label={t('client.settings.address')} value={address} onChangeText={setAddress} />
            <FormField label={t('client.settings.city')} value={city} onChangeText={setCity} />
            <FormField label={t('client.settings.province')} value={province} onChangeText={setProvince} />
            <Button title={t('common.save')} onPress={handleSaveProfile} loading={savingProfile} />
          </Card>

          {/* Change Password */}
          <Card title={t('client.settings.changePassword')}>
            <FormField label={t('client.settings.currentPassword')} value={currentPw} onChangeText={setCurrentPw} secureTextEntry placeholder="••••••••" />
            <FormField label={t('client.settings.newPassword')} value={newPw} onChangeText={setNewPw} secureTextEntry placeholder={t('client.settings.newPasswordPlaceholder')} />
            <FormField label={t('client.settings.confirmNewPassword')} value={confirmPw} onChangeText={setConfirmPw} secureTextEntry placeholder={t('client.settings.confirmNewPasswordPlaceholder')} />
            <Button title={t('client.settings.updatePassword')} onPress={handleSavePw} loading={savingPw} />
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
  avatarName: { fontSize: 15, fontWeight: '700', color: COLORS.gray900 },
  avatarEmail: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
  changePhoto: { fontSize: 13, color: COLORS.navy, fontWeight: '600', marginTop: 6 },
});
