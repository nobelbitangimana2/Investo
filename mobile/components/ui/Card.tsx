import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '@/constants/config';
import { useTheme } from '@/lib/theme';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  style?: ViewStyle;
  noPadding?: boolean;
}

export function Card({ children, title, style, noPadding }: CardProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
      <View style={noPadding ? undefined : styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  title: {
    fontSize: 15, fontWeight: '700', color: COLORS.gray900,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4,
  },
  content: { padding: 16 },
});
