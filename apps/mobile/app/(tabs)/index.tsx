import { Button, StyleSheet, Text, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useHousehold } from '@/lib/household';

// TODO (fase 2): calendario con compiti giornalieri e reminder
export default function Calendar() {
  const { data: household } = useHousehold();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{household?.name}</Text>
      <Text>Codice invito: {household?.invite_code}</Text>
      <Text>Compiti e reminder: in arrivo.</Text>
      <Button title="Esci" onPress={() => supabase.auth.signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: '600' },
});
