import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/config';

interface StatCardProps {
  title: string;
  value: string | number;
  iconName: keyof typeof Ionicons.glyphMap;
  iconBg?: string;
  iconColor?: string;
  description?: string;
  fullWidth?: boolean;
}

export function StatCard({
  title, value, iconName, iconBg = '#eff6ff',
  iconColor = COLORS.navy, description, fullWidth,
}: StatCardProps) {
  return (
    <View style={[styles.card, fullWidth && styles.fullWidth]}>
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
          {description && <Text style={styles.desc}>{description}</Text>}
        </View>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  fullWidth: { flex: undefined },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  textBlock: { flex: 1, marginRight: 8 },
  title: { fontSize: 12, color: COLORS.gray500, marginBottom: 6, fontWeight: '500' },
  value: { fontSize: 20, fontWeight: '700', color: COLORS.gray900 },
  desc: { fontSize: 10, color: COLORS.gray400, marginTop: 2 },
  iconBox: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
});
