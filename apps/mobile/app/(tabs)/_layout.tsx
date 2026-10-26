import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Calendario' }} />
      <Tabs.Screen name="money" options={{ title: 'Cassa' }} />
      <Tabs.Screen name="groups" options={{ title: 'Gruppi' }} />
    </Tabs>
  );
}
