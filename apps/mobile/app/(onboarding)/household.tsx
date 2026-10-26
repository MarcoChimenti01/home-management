import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
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
    <AuthScreen title="Il tuo primo gruppo">
      <Text style={styles.label}>Crea un nuovo gruppo</Text>
      <TextInput style={styles.input} placeholder="Nome (es. Casa Rossi)" value={name} onChangeText={setName} />
      <Button title="Crea" disabled={busy || !name.trim()} onPress={() => run(() => create(name))} />

      <Text style={[styles.label, { marginTop: 16 }]}>Oppure entra con un codice</Text>
      <TextInput
        style={styles.input}
        placeholder="Codice invito"
        autoCapitalize="characters"
        value={code}
        onChangeText={setCode}
      />
      <Button title="Entra" disabled={busy || !code.trim()} onPress={() => run(() => join(code))} />

      <View style={{ marginTop: 16 }}>
        <Button title="Esci" onPress={() => supabase.auth.signOut()} color="#888" />
      </View>
    </AuthScreen>
  );
}
