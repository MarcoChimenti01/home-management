import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from './theme';

// .list-group / .list-group-item
export function ListGroup({ children }: { children: ReactNode }) {
  return (
    <View style={styles.group}>
      {Children.toArray(children).map((child, i) =>
        isValidElement(child) ? cloneElement(child as ReactElement<{ first?: boolean }>, { first: i === 0 }) : child,
      )}
    </View>
  );
}

export function ListGroupItem({
  children,
  first,
  active,
}: {
  children: ReactNode;
  first?: boolean;
  active?: boolean;
}) {
  return (
    <View
      style={[
        styles.item,
        !first && { borderTopWidth: 1, borderTopColor: colors.border },
        active && { backgroundColor: '#e7f1ff' },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  item: { paddingVertical: 8, paddingHorizontal: 16, gap: 6 },
});
