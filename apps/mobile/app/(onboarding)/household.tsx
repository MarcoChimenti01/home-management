import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { AuthScreen, authStyles as styles } from '@/components/AuthScreen';
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
    <AuthScreen title="La tua famiglia">
      <Text style={styles.label}>Crea una nuova famiglia</Text>
      <TextInput style={styles.input} placeholder="Nome (es. Casa Rossi)" value={name} onChangeText={setName} />
      <Button
        title="Crea"
        disabled={busy || !name.trim()}
        onPress={() => run(() => supabase.rpc('create_household', { p_name: name.trim() }))}
      />

      <Text style={[styles.label, { marginTop: 16 }]}>Oppure entra con un codice</Text>
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

      <View style={{ marginTop: 16 }}>
        <Button title="Esci" onPress={() => supabase.auth.signOut()} color="#888" />
      </View>
    </AuthScreen>
  );
}
