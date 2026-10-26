import { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius } from './theme';

type Props = TextInputProps & { label?: string; hint?: string; error?: string };

// .form-label + .form-control (+ .form-text / .invalid-feedback)
export function Input({ label, hint, error, style, onFocus, onBlur, ...props }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.group}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor="#868e96"
        {...props}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.control,
          focused && styles.focused,
          !!error && styles.invalid,
          Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null,
          style,
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 4 },
  label: { fontSize: 16, color: colors.body },
  control: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: radius.md,
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.body,
    backgroundColor: colors.white,
  },
  focused: { borderColor: colors.focus },
  invalid: { borderColor: colors.danger },
  hint: { fontSize: 14, color: colors.muted },
  error: { fontSize: 14, color: colors.danger },
});
