import { useEffect, useMemo, useState } from 'react';
import { Button, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { AddTaskModal } from '@/components/AddTaskModal';
import { showError } from '@/lib/alert';
import { MONTH_NAMES, WEEKDAYS, monthGrid, monthRange, toDateKey } from '@/lib/dates';
import { useHousehold } from '@/lib/household';
import { useMembers } from '@/lib/members';
import { syncReminders } from '@/lib/notifications';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { useDeleteTask, useTasks, useToggleTask } from '@/lib/tasks';

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
        <Button title="‹" onPress={() => shiftMonth(-1)} />
        <Text style={styles.month}>
          {MONTH_NAMES[cursor.month]} {cursor.year}
        </Text>
        <Button title="›" onPress={() => shiftMonth(1)} />
      </View>

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
              <View style={[styles.day, isSelected && styles.daySelected, key === toDateKey(today) && styles.dayToday]}>
                <Text style={isSelected ? styles.daySelectedText : undefined}>{d.getDate()}</Text>
              </View>
              {datesWithTasks.has(key) && <View style={styles.dot} />}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>{selected}</Text>
        <Button title="+ Aggiungi" onPress={() => setAdding(true)} disabled={!household} />
      </View>

      {isLoading && <Text>Caricamento…</Text>}
      {!isLoading && dayTasks.length === 0 && <Text style={styles.empty}>Nessuna attività per questo giorno.</Text>}

      {dayTasks.map((t) => (
        <View key={t.id} style={styles.task}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => toggle.mutate({ id: t.id, done: !t.done }, { onError: (e) => showError(e.message) })}
          >
            <Text style={[styles.taskTitle, t.done && styles.done]}>
              {t.done ? '☑ ' : '☐ '}
              {t.due_time ? `${t.due_time.slice(0, 5)}  ` : ''}
              {t.title}
            </Text>
            {t.assignee_id && <Text style={styles.assignee}>Per: {nameOf(t.assignee_id) ?? '…'}</Text>}
          </Pressable>
          <Button
            title="Elimina"
            color="#c62828"
            onPress={() => remove.mutate(t.id, { onError: (e) => showError(e.message) })}
          />
        </View>
      ))}

      <View style={{ marginTop: 24 }}>
        <Button title="Esci" onPress={() => supabase.auth.signOut()} color="#888" />
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
  container: { padding: 16, gap: 8 },
  householdRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switch: { color: '#2196F3', fontWeight: '600' },
  household: { fontSize: 22, fontWeight: '700' },
  code: { color: '#666', marginBottom: 8 },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  month: { fontSize: 18, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', alignItems: 'center', paddingVertical: 4, minHeight: 44 },
  weekday: { fontWeight: '600', color: '#666', textAlign: 'center' },
  day: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayToday: { borderWidth: 1, borderColor: '#2196F3' },
  daySelected: { backgroundColor: '#2196F3' },
  daySelectedText: { color: '#fff', fontWeight: '700' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#2196F3', marginTop: 2 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  listTitle: { fontSize: 16, fontWeight: '600' },
  empty: { color: '#888' },
  task: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10 },
  taskTitle: { fontSize: 16 },
  done: { textDecorationLine: 'line-through', color: '#999' },
  assignee: { color: '#666', marginTop: 2 },
});
