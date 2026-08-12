import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/config';
import { timeAgo } from '@/lib/utils';
import type { Notification } from '@/types';

const TYPE_ICONS: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  deposit: { name: 'wallet', color: COLORS.blue },
  withdrawal: { name: 'arrow-up-circle', color: COLORS.amber },
  investment: { name: 'trending-up', color: COLORS.emerald },
  system: { name: 'information-circle', color: '#8b5cf6' },
};

interface Props {
  notification: Notification;
  onPress?: (n: Notification) => void;
  onMarkRead?: (id: string) => void;
  showAction?: boolean;
}

export function NotificationItem({ notification: n, onPress, onMarkRead, showAction }: Props) {
  const cfg = TYPE_ICONS[n.type] ?? TYPE_ICONS.system;
  return (
    <TouchableOpacity
      style={[styles.container, !n.read && styles.unread]}
      onPress={() => onPress?.(n)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: cfg.color + '18' }]}>
        <Ionicons name={cfg.name} size={18} color={cfg.color} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !n.read && styles.boldTitle]}>{n.title}</Text>
        <Text style={styles.message} numberOfLines={2}>{n.message}</Text>
        <Text style={styles.time}>{timeAgo(n.date)}</Text>
      </View>
      <View style={styles.right}>
        {!n.read && <View style={styles.dot} />}
        {showAction && !n.read && (
          <TouchableOpacity onPress={() => onMarkRead?.(n.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.markRead}>✓</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', padding: 14, borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100, alignItems: 'flex-start', gap: 12,
  },
  unread: { backgroundColor: '#eff6ff' },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content: { flex: 1 },
  title: { fontSize: 13, color: COLORS.gray700, marginBottom: 3 },
  boldTitle: { fontWeight: '700', color: COLORS.gray900 },
  message: { fontSize: 12, color: COLORS.gray500, lineHeight: 17 },
  time: { fontSize: 11, color: COLORS.gray400, marginTop: 4 },
  right: { alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.blue },
  markRead: { fontSize: 14, color: COLORS.navy, fontWeight: '700' },
});
