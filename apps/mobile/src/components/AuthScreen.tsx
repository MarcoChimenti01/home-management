import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, CardBody, colors } from '@/ui';

// Schermate di accesso: card Bootstrap centrata, larga al massimo 400px.
export function AuthScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ScrollView contentContainerStyle={styles.outer} keyboardShouldPersistTaps="handled">
      <View style={styles.wrap}>
        <Text style={styles.brand}>🏠 Home Management</Text>
        <Card>
          <CardBody style={{ padding: 24, gap: 16 }}>
            <Text style={styles.title}>{title}</Text>
            {children}
          </CardBody>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: colors.bodyBg },
  wrap: { width: '100%', maxWidth: 400, gap: 16 },
  brand: { fontSize: 20, fontWeight: '500', textAlign: 'center', color: colors.body },
  title: { fontSize: 24, fontWeight: '500', color: colors.body },
});
