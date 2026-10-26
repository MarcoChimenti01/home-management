import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { showError } from '@/lib/alert';
import { supabase } from '@/lib/supabase';

export default function HouseholdOnboarding() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) return showError(error.message);
    await queryClient.invalidateQueries({ queryKey: ['household'] });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>La tua famiglia</Text>

      <Text style={styles.label}>Crea una nuova famiglia</Text>
      <TextInput style={styles.input} placeholder="Nome (es. Casa Rossi)" value={name} onChangeText={setName} />
      <Button
        title="Crea"
        disabled={busy || !name.trim()}
        onPress={() => run(() => supabase.rpc('create_household', { p_name: name.trim() }))}
      />

      <Text style={[styles.label, { marginTop: 24 }]}>Oppure entra con un codice</Text>
      <TextInput
        style={styles.input}
        placeholder="Codice invito"
        autoCapitalize="characters"
        value={code}
        onChangeText={setCode}
      />
      <Button
        title="Entra"
        disabled={busy || !code.trim()}
        onPress={() => run(() => supabase.rpc('join_household', { p_code: code.trim() }))}
      />

      <View style={{ marginTop: 32 }}>
        <Button title="Esci" onPress={() => supabase.auth.signOut()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 16, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
});
