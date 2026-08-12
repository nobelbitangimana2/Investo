import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/config';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language;

  function toggle() {
    i18n.changeLanguage(current === 'en' ? 'fr' : 'en');
  }

  return (
    <TouchableOpacity style={styles.btn} onPress={toggle}>
      <Ionicons name="globe-outline" size={14} color={COLORS.gray600} />
      <Text style={styles.text}>{current === 'en' ? 'FR' : 'EN'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: COLORS.gray200,
    borderRadius: 8, backgroundColor: COLORS.white,
  },
  text: { fontSize: 12, fontWeight: '700', color: COLORS.gray700 },
});
