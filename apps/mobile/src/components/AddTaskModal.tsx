import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { showError } from '@/lib/alert';
import { combine, formatDateIt, isValidTime } from '@/lib/dates';
import type { Member } from '@/lib/members';
import { useAddTask } from '@/lib/tasks';
import { Button, Card, CardBody, CardHeader, Input, Pills, colors } from '@/ui';

const REMINDERS: { value: number | null; label: string }[] = [
  { value: null, label: 'Nessuno' },
  { value: 0, label: "All'ora" },
  { value: 10, label: '10 min prima' },
  { value: 60, label: '1 ora prima' },
  { value: 1440, label: '1 giorno prima' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  householdId: string;
  dateKey: string;
  members: Member[];
  meId: string;
};

// Finestra in stile .modal di Bootstrap
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <ScrollView contentContainerStyle={styles.center} keyboardShouldPersistTaps="handled">
          <View style={styles.dialog}>
            <Card>
              <CardHeader>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>Nuova attività</Text>
                  <Text style={styles.sub}>{formatDateIt(dateKey)}</Text>
                </View>
                <Pressable onPress={onClose} accessibilityLabel="Chiudi">
                  <Text style={styles.close}>✕</Text>
                </Pressable>
              </CardHeader>

              <CardBody style={{ gap: 16 }}>
                <Input label="Titolo" value={title} onChangeText={setTitle} />
                <Input
                  label="Orario"
                  hint="Facoltativo, formato HH:MM (es. 18:30)"
                  keyboardType="numbers-and-punctuation"
                  value={time}
                  onChangeText={setTime}
                />

                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>Assegna a</Text>
                  <Pills<string | null>
                    value={assignee}
                    onChange={setAssignee}
                    items={[
                      { value: null, label: 'Nessuno' },
                      ...members.map((m) => ({
                        value: m.user_id as string | null,
                        label: m.user_id === meId ? `${m.display_name} (io)` : m.display_name,
                      })),
                    ]}
                  />
                </View>

                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>Promemoria</Text>
                  <Pills<number | null> value={reminder} onChange={setReminder} items={REMINDERS} />
                </View>
              </CardBody>

              <View style={styles.footer}>
                <Button title="Annulla" variant="secondary" onPress={onClose} />
                <Button title="Salva" onPress={save} disabled={!title.trim() || addTask.isPending} />
              </View>
            </Card>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  dialog: { width: '100%', maxWidth: 500 },
  title: { fontSize: 20, fontWeight: '500', color: colors.body },
  sub: { color: colors.muted },
  close: { fontSize: 18, color: colors.muted, paddingHorizontal: 4 },
  label: { fontSize: 16, color: colors.body },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderCard,
  },
});
