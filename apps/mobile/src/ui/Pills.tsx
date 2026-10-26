import { View } from 'react-native';
import { Button } from './Button';
import type { Variant } from './theme';

type Item<T> = { value: T; label: string };

// Gruppo di bottoni a scelta singola (come .btn-group con .btn-outline-primary)
export function Pills<T extends string | number | null>({
  items,
  value,
  onChange,
  variant = 'primary',
  disabled,
}: {
  items: Item<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: Variant;
  disabled?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {items.map((item) => (
        <Button
          key={String(item.value)}
          title={item.label}
          size="sm"
          variant={variant}
          outline={item.value !== value}
          disabled={disabled}
          onPress={() => onChange(item.value)}
        />
      ))}
    </View>
  );
}
