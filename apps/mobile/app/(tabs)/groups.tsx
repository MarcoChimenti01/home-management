import { useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useGroupActions, useHouseholds } from '@/lib/household';
import { supabase } from '@/lib/supabase';

export default function Groups() {
  const { households, active, setActiveId } = useHouseholds();
  const { create, join, leave } = useGroupActions();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState<string | null>(null);

  async function run(action: () => Promise<boolean>, onOk?: () => void) {
    setBusy(true);
    const ok = await action();
    setBusy(false);
    if (ok) onOk?.();
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>I tuoi gruppi</Text>

        {households.map((h) => {
          const isActive = h.id === active?.id;
          return (
            <View key={h.id} style={[styles.card, isActive && styles.cardActive]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {h.name}
                  {isActive ? '  ·  attivo' : ''}
                </Text>
                <Text style={styles.code}>Codice invito: {h.invite_code}</Text>
              </View>
              <View style={styles.actions}>
                {!isActive && <Button title="Usa" onPress={() => setActiveId(h.id)} />}
                {confirmLeave === h.id ? (
                  <Button
                    title="Conferma uscita"
                    color="#c62828"
                    disabled={busy}
                    onPress={() => run(() => leave(h.id), () => setConfirmLeave(null))}
                  />
                ) : (
                  <Button title="Esci" color="#888" onPress={() => setConfirmLeave(h.id)} />
                )}
              </View>
            </View>
          );
        })}

        <Text style={styles.section}>Crea un nuovo gruppo</Text>
        <TextInput style={styles.input} placeholder="Nome (es. Casa al mare)" value={name} onChangeText={setName} />
        <Button
          title="Crea"
          disabled={busy || !name.trim()}
          onPress={() => run(() => create(name), () => setName(''))}
        />

        <Text style={styles.section}>Entra in un gruppo con un codice</Text>
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
          onPress={() => run(() => join(code), () => setCode(''))}
        />

        <View style={{ marginTop: 24 }}>
          <Button title="Esci dall'account" color="#888" onPress={() => supabase.auth.signOut()} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center' },
  inner: { width: '100%', maxWidth: 480, gap: 10 },
  title: { fontSize: 22, fontWeight: '700' },
  section: { fontSize: 16, fontWeight: '600', marginTop: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
  },
  cardActive: { borderColor: '#2196F3', borderWidth: 2 },
  name: { fontSize: 16, fontWeight: '600' },
  code: { color: '#666', marginTop: 2 },
  actions: { gap: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, backgroundColor: '#fff' },
});
