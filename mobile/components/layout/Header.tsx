import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '@/lib/notification-store';
import { useAuthStore } from '@/lib/auth-store';
import { COLORS } from '@/constants/config';
import { getInitials } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  showAvatar?: boolean;
}

export function Header({ title, showBack, showNotifications = true, showAvatar = true }: HeaderProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  const notifRoute =
    user?.role === 'admin' ? '/(admin)/notifications'
    : user?.role === 'accountant' ? '/(accountant)/notifications'
    : '/(client)/notifications';

  return (
    <View style={styles.container}>
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.gray900} />
        </TouchableOpacity>
      ) : (
        <View style={styles.brand}>
          <View style={styles.logoBox}>
            <Ionicons name="trending-up" size={16} color={COLORS.white} />
          </View>
          <Text style={styles.brandName}>Investo</Text>
        </View>
      )}

      {title ? <Text style={styles.title}>{title}</Text> : <View style={styles.flex1} />}

      <View style={styles.right}>
        {showNotifications && (
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push(notifRoute as never)}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.gray700} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {showAvatar && user && (
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => {
              const settingsRoute = user.role === 'admin' ? '/(admin)/settings'
                : user.role === 'accountant' ? '/(accountant)/settings'
                : '/(client)/settings';
              router.push(settingsRoute as never);
            }}
          >
            <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 16, fontWeight: '800', color: COLORS.navy },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.gray900, flex: 1, textAlign: 'center' },
  flex1: { flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute', top: -2, right: -2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontWeight: '700', color: COLORS.white },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '700', color: COLORS.white },
});
