import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';

export function ThemeView({ style, ...props }: ViewProps) {
  const { colors } = useTheme();
  return <View style={[styles.base, style, { backgroundColor: colors.background }]} {...props} />;
}

const styles = StyleSheet.create({
  base: { flex: 1 },
});
