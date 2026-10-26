import { Slot } from 'expo-router';
import { AppShell } from '@/components/AppShell';

// Le pagine (Calendario, Cassa, Gruppi) vivono dentro il menu laterale con breadcrumb
export default function AppLayout() {
  return (
    <AppShell>
      <Slot />
    </AppShell>
  );
}
