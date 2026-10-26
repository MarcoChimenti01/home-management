import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, onVariant, radius, type Variant } from './theme';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  outline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  disabled?: boolean;
};

const SIZES = {
  sm: { paddingVertical: 4, paddingHorizontal: 8, fontSize: 14, borderRadius: radius.sm },
  md: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 16, borderRadius: radius.md },
  lg: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 20, borderRadius: radius.lg },
};

// .btn, .btn-{variant}, .btn-outline-{variant}, .btn-sm/.btn-lg, .w-100 (block)
export function Button({ title, onPress, variant = 'primary', outline, size = 'md', block, disabled }: Props) {
  const color = colors[variant];
  const { fontSize, ...box } = SIZES[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        box,
        {
          borderColor: color,
          backgroundColor: outline ? (pressed ? color : 'transparent') : color,
          opacity: disabled ? 0.65 : !outline && pressed ? 0.85 : 1,
        },
        block && styles.block,
      ]}
    >
      {({ pressed }) => (
        <Text
          style={{
            fontSize,
            fontWeight: '400',
            textAlign: 'center',
            color: outline ? (pressed ? onVariant[variant] : color) : onVariant[variant],
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  block: { width: '100%' },
});
