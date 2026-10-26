import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AddTaskModal } from '@/components/AddTaskModal';
import { BootstrapButton } from '@/components/BootstrapButton';
import { showError } from '@/lib/alert';
import { MONTH_NAMES, WEEKDAYS, monthGrid, monthRange, toDateKey } from '@/lib/dates';
import { useHousehold } from '@/lib/household';
import { useMembers } from '@/lib/members';
import { syncReminders } from '@/lib/notifications';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { useDeleteTask, useTasks, useToggleTask } from '@/lib/tasks';
import { colors } from '@/lib/theme';

export default function Calendar() {
  const { session } = useSession();
  // La sessione è null per un istante dopo "Esci", prima che l'app torni al login.
  const meId = session?.user.id;
  const { data: household } = useHousehold();
  const { data: members = [] } = useMembers(household?.id);

  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState(toDateKey(today));
  const [adding, setAdding] = useState(false);

  const { from, to } = monthRange(cursor.year, cursor.month);
  const { data: tasks = [], isLoading } = useTasks(household?.id, from, to);
  const toggle = useToggleTask();
  const remove = useDeleteTask();

  // all'avvio programma sul dispositivo i reminder futuri dell'utente
  useEffect(() => {
    if (meId) syncReminders(meId);
  }, [meId]);

  const nameOf = useMemo(
    () => (id: string | null) => members.find((m) => m.user_id === id)?.display_name,
    [members],
  );
  const datesWithTasks = useMemo(() => new Set(tasks.map((t) => t.due_date)), [tasks]);
  const dayTasks = tasks.filter((t) => t.due_date === selected);
  const grid = monthGrid(cursor.year, cursor.month);

  if (!meId) return null;

  function shiftMonth(delta: number) {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.householdRow}>
        <View>
          <Text style={styles.household}>{household?.name}</Text>
          <Text style={styles.code}>Codice invito: {household?.invite_code}</Text>
        </View>
        <Link href="/groups" style={styles.switch}>
          Cambia gruppo
        </Link>
      </View>

      <View style={styles.monthRow}>
        <Pressable
          accessibilityLabel="Mese precedente"
          style={styles.monthArrow}
          onPress={() => shiftMonth(-1)}
        >
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <Text style={styles.month}>
          {MONTH_NAMES[cursor.month]} {cursor.year}
        </Text>
        <Pressable
          accessibilityLabel="Mese successivo"
          style={styles.monthArrow}
          onPress={() => shiftMonth(1)}
        >
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.grid}>
          {WEEKDAYS.map((w, i) => (
            <Text key={i} style={[styles.cell, styles.weekday]}>
              {w}
            </Text>
          ))}
          {grid.map((d, i) => {
            if (!d) return <View key={i} style={styles.cell} />;
            const key = toDateKey(d);
            const isSelected = key === selected;
            return (
              <Pressable key={i} style={styles.cell} onPress={() => setSelected(key)}>
                <View
                  style={[
                    styles.day,
                    isSelected && styles.daySelected,
                    key === toDateKey(today) && styles.dayToday,
                  ]}
                >
                  <Text style={isSelected ? styles.daySelectedText : undefined}>{d.getDate()}</Text>
                </View>
                {datesWithTasks.has(key) && <View style={styles.dot} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>{selected}</Text>
        <BootstrapButton
          title="+ Aggiungi attività"
          onPress={() => setAdding(true)}
          disabled={!household}
        />
      </View>

      {isLoading && <Text style={styles.empty}>Caricamento…</Text>}
      {!isLoading && dayTasks.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.empty}>Nessuna attività per questo giorno.</Text>
        </View>
      )}

      {dayTasks.map((t) => (
        <View key={t.id} style={styles.task}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() =>
              toggle.mutate({ id: t.id, done: !t.done }, { onError: (e) => showError(e.message) })
            }
          >
            <Text style={[styles.taskTitle, t.done && styles.done]}>
              {t.done ? '☑ ' : '☐ '}
              {t.due_time ? `${t.due_time.slice(0, 5)}  ` : ''}
              {t.title}
            </Text>
            {t.assignee_id && (
              <Text style={styles.assignee}>Per: {nameOf(t.assignee_id) ?? '…'}</Text>
            )}
          </Pressable>
          <BootstrapButton
            title="Elimina"
            variant="danger"
            onPress={() => remove.mutate(t.id, { onError: (e) => showError(e.message) })}
          />
        </View>
      ))}

      <View style={{ marginTop: 24 }}>
        <BootstrapButton title="Esci" onPress={() => supabase.auth.signOut()} variant="secondary" />
      </View>

      {household && (
        <AddTaskModal
          visible={adding}
          onClose={() => setAdding(false)}
          householdId={household.id}
          dateKey={selected}
          members={members}
          meId={meId}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12, backgroundColor: colors.background, flexGrow: 1 },
  household: { fontSize: 24, fontWeight: '700', color: colors.dark },
  code: { color: colors.muted, marginBottom: 4, fontSize: 13 },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
  },
  month: { fontSize: 16, fontWeight: '700', color: colors.dark },
  monthArrow: {
    width: 38,
    height: 38,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light,
  },
  arrowText: { color: colors.primary, fontSize: 26, lineHeight: 30 },
  calendarCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', alignItems: 'center', paddingVertical: 4, minHeight: 42 },
  weekday: { fontWeight: '700', color: colors.muted, textAlign: 'center', fontSize: 12 },
  day: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayToday: { borderWidth: 1, borderColor: colors.primary },
  daySelected: { backgroundColor: colors.primary },
  daySelectedText: { color: '#fff', fontWeight: '700' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginTop: 2 },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  listTitle: { fontSize: 15, fontWeight: '700', color: colors.dark },
  empty: { color: colors.muted, fontSize: 13 },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.white,
  },
  taskTitle: { fontSize: 15, color: colors.dark },
  done: { textDecorationLine: 'line-through', color: colors.muted },
  assignee: { color: colors.muted, marginTop: 3, fontSize: 12 },
});
