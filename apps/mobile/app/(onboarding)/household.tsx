import { useState } from 'react';
import { Text, View } from 'react-native';
import { AuthScreen } from '@/components/AuthScreen';
import { useGroupActions } from '@/lib/household';
import { supabase } from '@/lib/supabase';
import { Button, Input, colors } from '@/ui';

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
      <Input label="Crea un nuovo gruppo" placeholder="Es. Casa Rossi" value={name} onChangeText={setName} />
      <Button title="Crea gruppo" block disabled={busy || !name.trim()} onPress={() => run(() => create(name))} />

      <Text style={{ textAlign: 'center', color: colors.muted }}>oppure</Text>

      <Input
        label="Entra con un codice invito"
        autoCapitalize="characters"
        value={code}
        onChangeText={setCode}
      />
      <Button
        title="Entra nel gruppo"
        variant="success"
        block
        disabled={busy || !code.trim()}
        onPress={() => run(() => join(code))}
      />

      <View style={{ marginTop: 4 }}>
        <Button title="Esci dall'account" variant="secondary" outline block onPress={() => supabase.auth.signOut()} />
      </View>
    </AuthScreen>
  );
}
