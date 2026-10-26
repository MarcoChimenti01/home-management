import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/lib/theme';

// Contenitore delle schermate di accesso: scheda centrata e larga al massimo 400px.
export function AuthScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ScrollView contentContainerStyle={styles.outer} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        {children}
      </View>
    </ScrollView>
  );
}

export const authStyles = StyleSheet.create({
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
    color: colors.dark,
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
  },
  link: { color: colors.primary, fontWeight: '600' },
  label: { color: colors.dark, fontSize: 14, fontWeight: '600', marginTop: 4 },
});

const styles = StyleSheet.create({
  outer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    gap: 12,
    padding: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  title: {
    color: colors.dark,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'left',
    marginBottom: 8,
  },
});
