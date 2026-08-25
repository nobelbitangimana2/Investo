import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { COLORS } from '@/constants/config';
import { useTheme } from '@/lib/theme';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function FormField({ label, error, style, ...props }: FormFieldProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        style={[styles.input, { color: colors.text, backgroundColor: colors.input, borderColor: colors.border }, error ? styles.inputError : null, style]}
        placeholderTextColor={colors.textSubtle}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 10,
    padding: 13, fontSize: 14, color: COLORS.gray900,
    backgroundColor: COLORS.white,
  },
  inputError: { borderColor: COLORS.red },
  errorText: { fontSize: 12, color: COLORS.red, marginTop: 4 },
});
