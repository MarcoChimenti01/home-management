import { StyleSheet, Text, View } from 'react-native';
import { colors, onVariant, radius, type Variant } from './theme';

// .badge / .rounded-pill
export function Badge({ children, variant = 'secondary', pill }: { children: string; variant?: Variant; pill?: boolean }) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors[variant], borderRadius: pill ? radius.pill : radius.md },
      ]}
    >
      <Text style={[styles.text, { color: onVariant[variant] }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 8 },
  text: { fontSize: 12, fontWeight: '700' },
});
