import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

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
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, backgroundColor: '#fff' },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  link: { color: '#2196F3', fontWeight: '600' },
  label: { fontSize: 16, fontWeight: '600' },
});

const styles = StyleSheet.create({
  outer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 400, gap: 12 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
});
