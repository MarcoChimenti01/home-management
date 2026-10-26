import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { colors } from '@/lib/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'outline';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: Variant;
};

export function BootstrapButton({ title, variant = 'primary', disabled, ...props }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
      {...props}
    >
      <Text style={[styles.label, styles[`${variant}Label`]]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 14, fontWeight: '600' },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  primaryLabel: { color: '#fff' },
  secondary: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  secondaryLabel: { color: '#fff' },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
  dangerLabel: { color: '#fff' },
  outline: { backgroundColor: '#fff', borderColor: colors.primary },
  outlineLabel: { color: colors.primary },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.82 },
});
