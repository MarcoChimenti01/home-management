import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

export type Crumb = { label: string; onPress?: () => void };

// .breadcrumb: voci separate da "/", l'ultima è quella attiva
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <View style={styles.row} accessibilityRole="header">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <View key={`${item.label}-${i}`} style={styles.item}>
            {i > 0 && <Text style={styles.divider}>/</Text>}
            {last || !item.onPress ? (
              <Text style={styles.active} numberOfLines={1}>
                {item.label}
              </Text>
            ) : (
              <Pressable onPress={item.onPress}>
                <Text style={styles.link} numberOfLines={1}>
                  {item.label}
                </Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', maxWidth: 220 },
  divider: { color: colors.muted, paddingHorizontal: 8 },
  link: { color: colors.primary, textDecorationLine: 'underline' },
  active: { color: colors.muted },
});
