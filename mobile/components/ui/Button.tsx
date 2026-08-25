import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { COLORS } from '@/constants/config';
import { useTheme } from '@/lib/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const BG: Record<Variant, string> = {
  primary: COLORS.navy, secondary: COLORS.gray100,
  outline: 'transparent', danger: COLORS.red, success: COLORS.emerald,
};
const FG: Record<Variant, string> = {
  primary: COLORS.white, secondary: COLORS.gray700,
  outline: COLORS.navy, danger: COLORS.white, success: COLORS.white,
};
const BORDER: Record<Variant, string> = {
  primary: 'transparent', secondary: 'transparent',
  outline: COLORS.navy, danger: 'transparent', success: 'transparent',
};
const PAD: Record<Size, { paddingVertical: number; paddingHorizontal: number }> = {
  sm: { paddingVertical: 8, paddingHorizontal: 14 },
  md: { paddingVertical: 12, paddingHorizontal: 20 },
  lg: { paddingVertical: 15, paddingHorizontal: 24 },
};
const FONT_SIZE: Record<Size, number> = { sm: 13, md: 14, lg: 15 };

export function Button({
  title, onPress, variant = 'primary', size = 'md', loading, disabled, style,
}: ButtonProps) {
  const { colors } = useTheme();
  const foreground = variant === 'secondary' ? colors.textMuted : variant === 'outline' ? colors.primary : FG[variant];
  return (
    <TouchableOpacity
      style={[
        styles.base, PAD[size],
        { backgroundColor: variant === 'secondary' ? colors.surfaceMuted : BG[variant], borderColor: variant === 'outline' ? colors.primary : BORDER[variant] },
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading
        ? <ActivityIndicator color={foreground} size="small" />
        : <Text style={[styles.text, { color: foreground, fontSize: FONT_SIZE[size] }]}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  text: { fontWeight: '700' },
  disabled: { opacity: 0.55 },
});
