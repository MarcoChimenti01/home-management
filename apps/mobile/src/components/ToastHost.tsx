import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subscribeToasts, type Toast } from '@/lib/alert';
import { alertColors, radius } from '@/ui';

const DURATION_MS = 4500;

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: Platform.OS !== 'web' }).start();
    const timer = setTimeout(onDismiss, DURATION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // come .alert-danger / .alert-success di Bootstrap
  const c = toast.kind === 'error' ? alertColors.danger : alertColors.success;
  return (
    <Animated.View style={{ opacity }}>
      <Pressable
        onPress={onDismiss}
        style={[styles.toast, { backgroundColor: c.bg, borderColor: c.border }]}
        accessibilityRole="alert"
      >
        <Text style={[styles.message, { color: c.text }]}>{toast.message}</Text>
        <Text style={[styles.close, { color: c.text }]}>✕</Text>
      </Pressable>
    </Animated.View>
  );
}

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => subscribeToasts((t) => setToasts((current) => [...current.slice(-2), t])), []);

  const dismiss = (id: number) => setToasts((current) => current.filter((t) => t.id !== id));

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 8 }]}>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, alignItems: 'center', gap: 8, zIndex: 1000 },
  toast: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  message: { flex: 1, fontSize: 16 },
  close: { fontSize: 14 },
});
