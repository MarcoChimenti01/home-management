import { Tabs } from 'expo-router';
import { colors } from '@/lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', paddingBottom: 2 },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingTop: 7,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Calendario' }} />
      <Tabs.Screen name="money" options={{ title: 'Cassa' }} />
      <Tabs.Screen name="groups" options={{ title: 'Gruppi' }} />
    </Tabs>
  );
}
