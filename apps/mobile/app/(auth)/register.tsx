import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { showError, showInfo } from '@/lib/alert';
import { supabase } from '@/lib/supabase';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  async function signUp() {
    if (password.length < 6) return showError('La password deve avere almeno 6 caratteri.');
    if (password !== confirm) return showError('Le password non coincidono.');

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name.trim() } },
    });

    if (error) {
      setBusy(false);
      return showError(error.message);
    }

    // Se Supabase non richiede la conferma email crea subito la sessione:
    // la chiudiamo per riportare comunque l'utente alla pagina di accesso.
    const confirmationNeeded = !data.session;
    if (data.session) await supabase.auth.signOut();
    setBusy(false);

    showInfo(
      confirmationNeeded
        ? 'Registrazione effettuata! Vai a confermare la tua email, poi accedi.'
        : 'Registrazione effettuata! Ora puoi accedere.',
    );
    router.replace('/login');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrati</Text>
      <TextInput style={styles.input} placeholder="Nome" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password (min. 6 caratteri)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Conferma password"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
      />
      <Button
        title="Crea account"
        onPress={signUp}
        disabled={busy || !name.trim() || !email || !password || !confirm}
      />

      <View style={styles.footer}>
        <Text>Hai già un account?</Text>
        <Link href="/login" style={styles.link}>
          Accedi
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  link: { color: '#2196F3', fontWeight: '600' },
});
