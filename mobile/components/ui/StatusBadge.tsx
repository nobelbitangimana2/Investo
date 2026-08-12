import { View, Text, StyleSheet } from 'react-native';
import { STATUS_COLORS } from '@/constants/config';

interface Props { status: string; }

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', rejected: 'Rejected',
  active: 'Active', matured: 'Matured', suspended: 'Suspended', closed: 'Closed',
};

export function StatusBadge({ status }: Props) {
  const color = STATUS_COLORS[status] ?? '#6b7280';
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{STATUS_LABELS[status] ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start',
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
});
