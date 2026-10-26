import { useState } from 'react';
import { Button, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { showError } from '@/lib/alert';
import { combine, isValidTime } from '@/lib/dates';
import type { Member } from '@/lib/members';
import { useAddTask } from '@/lib/tasks';

const REMINDERS = [
  { label: 'Nessuno', minutes: null },
  { label: "All'ora", minutes: 0 },
  { label: '10 min prima', minutes: 10 },
  { label: '1 ora prima', minutes: 60 },
  { label: '1 giorno prima', minutes: 1440 },
] as const;

type Props = {
  visible: boolean;
  onClose: () => void;
  householdId: string;
  dateKey: string;
  members: Member[];
  meId: string;
};

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={selected ? styles.chipTextSelected : undefined}>{label}</Text>
    </Pressable>
  );
}

export function AddTaskModal({ visible, onClose, householdId, dateKey, members, meId }: Props) {
  const addTask = useAddTask();
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [assignee, setAssignee] = useState<string | null>(null);
  const [reminder, setReminder] = useState<number | null>(null);

  function reset() {
    setTitle('');
    setTime('');
    setAssignee(null);
    setReminder(null);
  }

  async function save() {
    const hasTime = time.trim() !== '';
    if (hasTime && !isValidTime(time.trim())) return showError('Orario non valido: usa il formato HH:MM, es. 18:30.');
    if (reminder !== null && !hasTime) return showError('Per un promemoria inserisci anche un orario.');

    // il promemoria va all'assegnatario, o a chi crea il compito se non c'è
    const reminderUser = assignee ?? meId;
    const remindAt =
      reminder !== null ? new Date(combine(dateKey, time.trim()).getTime() - reminder * 60_000) : null;
    if (remindAt && remindAt <= new Date()) return showError('Il promemoria cadrebbe nel passato.');

    try {
      await addTask.mutateAsync({
        household_id: householdId,
        title: title.trim(),
        due_date: dateKey,
        due_time: hasTime ? time.trim() : null,
        assignee_id: assignee,
        remind_at: remindAt ? remindAt.toISOString() : null,
        reminder_user_id: remindAt ? reminderUser : null,
      });
      reset();
      onClose();
    } catch (e: any) {
      showError(e.message ?? 'Impossibile salvare il compito.');
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Nuova attività</Text>
        <Text style={styles.sub}>Giorno: {dateKey}</Text>

        <TextInput style={styles.input} placeholder="Titolo" value={title} onChangeText={setTitle} />
        <TextInput
          style={styles.input}
          placeholder="Orario (HH:MM, facoltativo)"
          keyboardType="numbers-and-punctuation"
          value={time}
          onChangeText={setTime}
        />

        <Text style={styles.label}>Assegna a</Text>
        <View style={styles.row}>
          <Chip label="Nessuno" selected={assignee === null} onPress={() => setAssignee(null)} />
          {members.map((m) => (
            <Chip
              key={m.user_id}
              label={m.user_id === meId ? `${m.display_name} (io)` : m.display_name}
              selected={assignee === m.user_id}
              onPress={() => setAssignee(m.user_id)}
            />
          ))}
        </View>

        <Text style={styles.label}>Promemoria</Text>
        <View style={styles.row}>
          {REMINDERS.map((r) => (
            <Chip key={r.label} label={r.label} selected={reminder === r.minutes} onPress={() => setReminder(r.minutes)} />
          ))}
        </View>

        <View style={styles.actions}>
          <Button title="Salva" onPress={save} disabled={!title.trim() || addTask.isPending} />
          <Button title="Annulla" onPress={onClose} color="#888" />
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  sub: { color: '#666' },
  label: { fontWeight: '600', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  chipSelected: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  chipTextSelected: { color: '#fff' },
  actions: { gap: 8, marginTop: 16 },
});
