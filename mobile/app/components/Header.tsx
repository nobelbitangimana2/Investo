import React, { useState } from 'react';
import { View, Pressable, Modal, Text, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { clearTokens } from '@/lib/secure-storage';
import { useAuthStore } from '@/lib/auth-store';
import { COLORS } from '@/constants/config';
import { useTheme } from '@/lib/theme';

export default function Header() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  async function signOut() {
    try {
      await clearTokens();
    } finally {
      useAuthStore.getState().logout();
      router.replace('/(auth)/login');
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <Pressable accessibilityLabel="open-menu" onPress={() => setOpen(true)} style={styles.button}>
        <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent={false}
        onRequestClose={() => setOpen(false)}
      >
        <StatusBar style="dark" backgroundColor={COLORS.white} />
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={[styles.menu, { marginTop: insets.top + 18, backgroundColor: colors.surface }]}>
            <Pressable style={styles.menuItem} onPress={() => { setOpen(false); router.push('/settings'); }}>
              <Text style={[styles.menuText, { color: colors.text }]}>{t('nav.settings') || 'Settings'}</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.menuItem} onPress={async () => { setOpen(false); await signOut(); }}>
              <Text style={[styles.menuText, { color: COLORS.danger || '#d9534f' }]}>{t('common.logout') || 'Sign out'}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingLeft: 12 },
  button: { padding: 6 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-start' },
  menu: {
    marginTop: Platform.OS === 'android' ? 42 : 60,
    marginLeft: 8,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: 6,
    minWidth: 140,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  menuItem: { paddingVertical: 10, paddingHorizontal: 14 },
  menuText: { fontSize: 15, color: COLORS.navy },
  divider: { height: 1, backgroundColor: '#eee', marginHorizontal: 4 },
});
