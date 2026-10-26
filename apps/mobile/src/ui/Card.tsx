import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from './theme';

type Props = { children: ReactNode; style?: StyleProp<ViewStyle> };

// .card, .card-header, .card-body
export function Card({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function CardHeader({ children, style }: Props) {
  return <View style={[styles.header, style]}>{children}</View>;
}

export function CardBody({ children, style }: Props) {
  return <View style={[styles.body, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(33,37,41,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderCard,
  },
  body: { padding: 16, gap: 12 },
});
