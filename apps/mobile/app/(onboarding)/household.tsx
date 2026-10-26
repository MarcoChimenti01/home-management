import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { BootstrapButton } from '@/components/BootstrapButton';
import { AuthScreen, authStyles as styles } from '@/components/AuthScreen';
import { useGroupActions } from '@/lib/household';
import { supabase } from '@/lib/supabase';

// Mostrata solo a chi non fa ancora parte di nessun gruppo
export default function HouseholdOnboarding() {
  const { create, join } = useGroupActions();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<boolean>) {
    setBusy(true);
    await action();
    setBusy(false);
  }

  return (
    <AuthScreen title="La tua famiglia">
      <Text style={styles.label}>Crea una nuova famiglia</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome (es. Casa Rossi)"
        value={name}
        onChangeText={setName}
      />
      <BootstrapButton
        title={busy ? 'Creazione…' : 'Crea famiglia'}
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
      <BootstrapButton
        title={busy ? 'Accesso…' : 'Entra in famiglia'}
        variant="outline"
        disabled={busy || !code.trim()}
        onPress={() => run(() => supabase.rpc('join_household', { p_code: code.trim() }))}
      />

      <View style={{ marginTop: 16 }}>
        <BootstrapButton title="Esci" onPress={() => supabase.auth.signOut()} variant="secondary" />
      </View>
    </AuthScreen>
  );
}
