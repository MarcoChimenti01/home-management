import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { Link, useRouter } from 'expo-router';
import { AuthScreen } from '@/components/AuthScreen';
import { showError, showInfo } from '@/lib/alert';
import { supabase } from '@/lib/supabase';
import { Button, Input, colors } from '@/ui';

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
      options: {
        data: { display_name: name.trim() },
        // Dove porta il link nell'email: web -> http://localhost:8081/login,
        // Expo Go -> exp://<ip>:8081/--/login, build -> homemanagement://login
        emailRedirectTo: Linking.createURL('login'),
      },
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
    <AuthScreen title="Registrati">
      <Input label="Nome" value={name} onChangeText={setName} />
      <Input
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        label="Password"
        hint="Almeno 6 caratteri"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Input label="Conferma password" secureTextEntry value={confirm} onChangeText={setConfirm} />
      <Button
        title="Crea account"
        block
        onPress={signUp}
        disabled={busy || !name.trim() || !email || !password || !confirm}
      />

      <View style={styles.footer}>
        <Text style={styles.muted}>Hai già un account?</Text>
        <Link href="/login" style={styles.link}>
          Accedi
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  muted: { color: colors.muted },
  link: { color: colors.primary },
});
