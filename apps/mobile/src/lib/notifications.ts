import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

// Le notifiche locali non esistono sul web: lì tutte le funzioni non fanno nulla.
const supported = Platform.OS !== 'web';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

// Riprogramma sul dispositivo tutti i reminder futuri dell'utente (letti dal DB).
// Chiamata all'avvio e dopo ogni modifica: così i reminder creati da altri arrivano
// anche a chi li riceve, e quelli cancellati spariscono.
export async function syncReminders(userId: string) {
  if (!supported) return;
  if (!(await ensurePermission())) return;

  const { data, error } = await supabase
    .from('reminders')
    .select('id, remind_at, tasks(title, due_date, due_time)')
    .eq('user_id', userId)
    .gt('remind_at', new Date().toISOString());
  if (error) return;

  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const r of (data ?? []) as any[]) {
    const when = new Date(r.remind_at);
    if (when <= new Date()) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: r.id,
      content: {
        title: r.tasks?.title ?? 'Promemoria',
        body: r.tasks?.due_time ? `Alle ${String(r.tasks.due_time).slice(0, 5)}` : 'Promemoria',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
    });
  }
}
