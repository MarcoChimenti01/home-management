import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { AuthScreen, authStyles as styles } from '@/components/AuthScreen';
import { showError } from '@/lib/alert';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) showError(error.message);
  }

  return (
    <AuthScreen title="Accedi">
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
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Accedi" onPress={signIn} disabled={busy || !email || !password} />

      <View style={styles.footer}>
        <Text>Non hai un account?</Text>
        <Link href="/register" style={styles.link}>
          Registrati
        </Link>
      </View>
    </AuthScreen>
  );
}
