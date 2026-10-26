import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHousehold } from '@/lib/household';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { Breadcrumb, Button, colors, radius, useBreakpoint } from '@/ui';

type Href = '/' | '/money' | '/groups';
const MENU: { label: string; icon: string; href: Href }[] = [
  { label: 'Calendario', icon: '📅', href: '/' },
  { label: 'Cassa', icon: '💶', href: '/money' },
  { label: 'Gruppi', icon: '👥', href: '/groups' },
];

// Layout in stile Bootstrap: navbar scura in alto, menu laterale (nav-pills) e breadcrumb.
// Il menu è fisso da 768px in su; sotto si apre dal pulsante ☰ come "offcanvas".
export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { atLeast } = useBreakpoint();
  const { session } = useSession();
  const { data: household } = useHousehold();
  const [open, setOpen] = useState(false);

  const wide = atLeast('md');
  const current = MENU.find((m) => m.href === pathname) ?? MENU[0];

  function go(href: Href) {
    setOpen(false);
    router.push(href);
  }

  const nav = (
    <ScrollView style={styles.sidebar} contentContainerStyle={styles.sidebarContent}>
      {household && (
        <Pressable onPress={() => go('/groups')} style={styles.group}>
          <Text style={styles.groupLabel}>Gruppo attivo</Text>
          <Text style={styles.groupName} numberOfLines={1}>
            {household.name}
          </Text>
        </Pressable>
      )}

      <View style={styles.pills}>
        {MENU.map((item) => {
          const active = item.href === current.href;
          return (
            <Pressable key={item.href} onPress={() => go(item.href)} style={[styles.pill, active && styles.pillActive]}>
              <Text style={styles.pillIcon}>{item.icon}</Text>
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.root}>
      {/* navbar navbar-dark bg-dark */}
      <View style={[styles.navbar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.navLeft}>
          {!wide && (
            <Pressable onPress={() => setOpen(true)} accessibilityLabel="Apri il menu" style={styles.toggler}>
              <Text style={styles.togglerText}>☰</Text>
            </Pressable>
          )}
          <Text style={styles.brand}>🏠 Home Management</Text>
        </View>
        <View style={styles.navRight}>
          {wide && <Text style={styles.email}>{session?.user.email}</Text>}
          <Button title="Esci" size="sm" variant="light" outline onPress={() => supabase.auth.signOut()} />
        </View>
      </View>

      <View style={styles.body}>
        {wide && nav}

        <View style={styles.content}>
          <View style={styles.crumbBar}>
            <Breadcrumb
              items={[
                { label: 'Home', onPress: () => go('/') },
                ...(household ? [{ label: household.name, onPress: () => go('/groups' as Href) }] : []),
                { label: current.label },
              ]}
            />
          </View>
          <View style={styles.page}>{children}</View>
        </View>

        {!wide && open && (
          <View style={styles.overlay}>
            <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
            <View style={styles.drawer}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Menu</Text>
                <Pressable onPress={() => setOpen(false)} accessibilityLabel="Chiudi il menu">
                  <Text style={styles.close}>✕</Text>
                </Pressable>
              </View>
              {nav}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bodyBg },

  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: colors.dark,
  },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggler: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.md,
    paddingVertical: 2,
    paddingHorizontal: 10,
  },
  togglerText: { color: 'rgba(255,255,255,0.75)', fontSize: 22 },
  brand: { color: colors.white, fontSize: 20, flexShrink: 1 },
  email: { color: 'rgba(255,255,255,0.65)' },

  body: { flex: 1, flexDirection: 'row' },
  content: { flex: 1 },
  crumbBar: { paddingHorizontal: 16, paddingVertical: 12 },
  page: { flex: 1 },

  sidebar: {
    width: 240,
    flexGrow: 0,
    backgroundColor: colors.white,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  sidebarContent: { padding: 16, gap: 16 },
  group: { backgroundColor: '#e7f1ff', borderRadius: radius.md, padding: 12 },
  groupLabel: { fontSize: 12, color: colors.muted, textTransform: 'uppercase' },
  groupName: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  pills: { gap: 4 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 16, borderRadius: radius.md },
  pillActive: { backgroundColor: colors.primary },
  pillIcon: { fontSize: 16 },
  pillText: { fontSize: 16, color: colors.primary },
  pillTextActive: { color: colors.white },

  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, flexDirection: 'row', zIndex: 100 },
  backdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  drawer: { width: 280, height: '100%', backgroundColor: colors.white },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  drawerTitle: { fontSize: 20, fontWeight: '500' },
  close: { fontSize: 18, color: colors.muted },
});
