import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/lib/auth-store';
import { changePasswordApi, uploadAvatarApi, updateContactApi, getMe } from '@/lib/api';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/layout/Header';
import { COLORS } from '@/constants/config';
import { getInitials } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function AccountantSettingsScreen() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    getMe().then((u) => {
      const contact = u as unknown as { phone?: string; address?: string; city?: string; province?: string };
      setPhone(contact.phone ?? '');
      setAddress(contact.address ?? '');
      setCity(contact.city ?? '');
      setProvince(contact.province ?? '');
    }).catch(() => {});
  }, []);

  async function handleAvatarPick() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const a = result.assets[0];
    setAvatarUploading(true);
    try {
      const res = await uploadAvatarApi(a.uri, a.fileName ?? 'avatar.jpg', a.mimeType ?? 'image/jpeg');
      updateUser({ profilePicture: res.profilePicture });
      Alert.alert(t('common.success'), t('accountant.settings.avatarSuccess'));
    } catch (err) { Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error')); }
    finally { setAvatarUploading(false); }
  }

  async function handleSaveContact() {
    setSavingContact(true);
    try {
      await updateContactApi({ phone, address, city, province });
      Alert.alert(t('common.success'), t('accountant.settings.contactSaved'));
    } catch (err) { Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error')); }
    finally { setSavingContact(false); }
  }

  async function handleSavePw() {
    if (newPw.length < 8) { Alert.alert(t('common.error'), t('accountant.settings.pwMin8')); return; }
    if (newPw !== confirmPw) { Alert.alert(t('common.error'), t('accountant.settings.pwNoMatch')); return; }
    setSavingPw(true);
    try {
      await changePasswordApi(currentPw, newPw);
      Alert.alert(t('common.success'), t('accountant.settings.pwSuccess'));
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) { Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error')); }
    finally { setSavingPw(false); }
  }

  return (
    <View style={styles.root}>
      <Header />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.pageTitle}>{t('accountant.settings.title')}</Text>

          <Card title={t('accountant.settings.profilePicture')}>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(user?.name ?? 'AC')}</Text>
              </View>
              <View style={styles.avatarInfo}>
                <Text style={styles.avatarName}>{user?.name}</Text>
                <Text style={styles.avatarEmail}>{user?.email}</Text>
                <Text style={styles.roleTag}>{user?.role}</Text>
                <TouchableOpacity onPress={handleAvatarPick} disabled={avatarUploading}>
                  <Text style={styles.changePhoto}>{avatarUploading ? t('common.uploading') : t('accountant.settings.changePhoto')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* Read-only account info */}
          <Card title={t('accountant.settings.accountInfo')}>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={16} color={COLORS.amber} />
              <Text style={styles.infoText}>{t('accountant.settings.managedByAdmin')}</Text>
            </View>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>{t('accountant.settings.fullName')}</Text>
              <Text style={styles.readOnlyVal}>{user?.name}</Text>
            </View>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>{t('accountant.settings.emailAddress')}</Text>
              <Text style={styles.readOnlyVal}>{user?.email}</Text>
            </View>
          </Card>

          <Card title={t('accountant.settings.contactInfo')}>
            <FormField label={t('accountant.settings.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder={t('accountant.settings.phonePlaceholder')} />
            <FormField label={t('accountant.settings.address')} value={address} onChangeText={setAddress} placeholder={t('accountant.settings.addressPlaceholder')} />
            <FormField label={t('accountant.settings.city')} value={city} onChangeText={setCity} placeholder={t('accountant.settings.cityPlaceholder')} />
            <FormField label={t('accountant.settings.province')} value={province} onChangeText={setProvince} placeholder={t('accountant.settings.provincePlaceholder')} />
            <Button title={t('accountant.settings.saveContactInfo')} onPress={handleSaveContact} loading={savingContact} />
          </Card>

          <Card title={t('accountant.settings.changePassword')}>
            <FormField label={t('accountant.settings.currentPassword')} value={currentPw} onChangeText={setCurrentPw} secureTextEntry placeholder="••••••••" />
            <FormField label={t('accountant.settings.newPassword')} value={newPw} onChangeText={setNewPw} secureTextEntry placeholder={t('accountant.settings.newPasswordPlaceholder')} />
            <FormField label={t('accountant.settings.confirmNewPassword')} value={confirmPw} onChangeText={setConfirmPw} secureTextEntry placeholder={t('accountant.settings.confirmNewPasswordPlaceholder')} />
            <Button title={t('accountant.settings.updatePassword')} onPress={handleSavePw} loading={savingPw} />
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
  roleTag: { fontSize: 11, color: COLORS.gray400, textTransform: 'capitalize', marginTop: 1 },
  changePhoto: { fontSize: 13, color: COLORS.navy, fontWeight: '600', marginTop: 6 },
  infoBox: { flexDirection: 'row', gap: 8, backgroundColor: '#fffbeb', borderRadius: 8, padding: 10, marginBottom: 12 },
  infoText: { flex: 1, fontSize: 12, color: '#92400e' },
  readOnlyRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  readOnlyLabel: { fontSize: 12, color: COLORS.gray500, marginBottom: 4 },
  readOnlyVal: { fontSize: 14, color: COLORS.gray700, backgroundColor: COLORS.gray50, padding: 10, borderRadius: 8 },
});
