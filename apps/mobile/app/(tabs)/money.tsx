import { StyleSheet, Text, View } from 'react-native';

// TODO (fase 3): grafico spese mensili, versamenti e saldo cassa
export default function Money() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cassa comune</Text>
      <Text>Spese e versamenti: in arrivo.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: '600' },
});
