import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { AuthScreen } from '@/components/AuthScreen';
import { showError } from '@/lib/alert';
import { supabase } from '@/lib/supabase';
import { Button, Input, colors } from '@/ui';

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
      <Input
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Input label="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <Button title="Accedi" block onPress={signIn} disabled={busy || !email || !password} />

      <View style={styles.footer}>
        <Text style={styles.muted}>Non hai un account?</Text>
        <Link href="/register" style={styles.link}>
          Registrati
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
