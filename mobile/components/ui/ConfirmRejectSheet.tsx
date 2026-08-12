import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS } from '@/constants/config';
import { Button } from './Button';
import { useTranslation } from 'react-i18next';

interface Props {
  visible: boolean;
  action: 'confirm' | 'reject';
  targetLabel: string;
  onClose: () => void;
  onConfirm: (note?: string) => Promise<void>;
}

export function ConfirmRejectSheet({ visible, action, targetLabel, onClose, onConfirm }: Props) {
  const { t } = useTranslation();
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (action === 'reject' && note.trim().length < 10) {
      setError(t('confirmReject.rejectionNoteRequired'));
      return;
    }
    setLoading(true);
    try {
      await onConfirm(action === 'reject' ? note : undefined);
      setNote('');
      setError('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally { setLoading(false); }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>
            {action === 'confirm' ? t('confirmReject.confirmTitle') : t('confirmReject.rejectTitle')}
          </Text>
          <Text style={styles.subtitle}>{targetLabel}</Text>

          {action === 'reject' && (
            <>
              <TextInput
                style={[styles.noteInput, error ? styles.noteError : null]}
                placeholder={t('confirmReject.rejectionNotePlaceholder')}
                value={note} onChangeText={(v) => { setNote(v); setError(''); }}
                multiline numberOfLines={3} textAlignVertical="top"
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </>
          )}

          <View style={styles.row}>
            <Button title={t('common.cancel')} onPress={onClose} variant="outline" style={styles.flex1} />
            <View style={{ width: 10 }} />
            <Button
              title={action === 'confirm' ? t('confirmReject.confirmButton') : t('confirmReject.rejectButton')}
              onPress={handleSubmit} loading={loading}
              variant={action === 'confirm' ? 'success' : 'danger'}
              style={styles.flex1}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.gray200, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.gray900, marginBottom: 6 },
  subtitle: { fontSize: 13, color: COLORS.gray500, marginBottom: 16 },
  noteInput: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.gray900, minHeight: 80, marginBottom: 4 },
  noteError: { borderColor: COLORS.red },
  errorText: { fontSize: 12, color: COLORS.red, marginBottom: 12 },
  row: { flexDirection: 'row', marginTop: 12 },
  flex1: { flex: 1 },
});
