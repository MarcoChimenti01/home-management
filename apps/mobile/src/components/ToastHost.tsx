import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subscribeToasts, type Toast } from '@/lib/alert';

const DURATION_MS = 4500;

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: Platform.OS !== 'web' }).start();
    const timer = setTimeout(onDismiss, DURATION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isError = toast.kind === 'error';
  return (
    <Animated.View style={{ opacity }}>
      <Pressable onPress={onDismiss} style={[styles.toast, isError ? styles.error : styles.info]}>
        <Text style={styles.icon}>{isError ? '!' : '✓'}</Text>
        <Text style={styles.message}>{toast.message}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(
    () =>
      subscribeToasts((t) => setToasts((current) => [...current.slice(-2), t])),
    [],
  );

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
    gap: 10,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  error: { backgroundColor: '#c62828' },
  info: { backgroundColor: '#2e7d32' },
  icon: { color: '#fff', fontWeight: '800', fontSize: 16, width: 18, textAlign: 'center' },
  message: { color: '#fff', flex: 1 },
});
