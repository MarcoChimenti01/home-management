import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AddTaskModal } from '@/components/AddTaskModal';
import { showError } from '@/lib/alert';
import { MONTH_NAMES, WEEKDAYS, formatDateIt, monthGrid, monthRange, toDateKey } from '@/lib/dates';
import { useHousehold, usePermissions } from '@/lib/household';
import { useMembers } from '@/lib/members';
import { syncReminders } from '@/lib/notifications';
import { useSession } from '@/lib/session';
import { useDeleteTask, useTasks, useToggleTask } from '@/lib/tasks';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  ListGroup,
  ListGroupItem,
  Row,
  colors,
} from '@/ui';

export default function Calendar() {
  const { session } = useSession();
  // La sessione è null per un istante dopo "Esci", prima che l'app torni al login.
  const meId = session?.user.id;
  const { data: household } = useHousehold();
  const { canEdit } = usePermissions();
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
  const todayKey = toDateKey(today);

  if (!meId) return null;

  function shiftMonth(delta: number) {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Container>
        <Text style={styles.h1}>Calendario</Text>

        <Row>
          <Col lg={7}>
            <Card>
              <CardHeader>
                <Button title="‹" size="sm" variant="secondary" outline onPress={() => shiftMonth(-1)} />
                <Text style={styles.cardTitle}>
                  {MONTH_NAMES[cursor.month]} {cursor.year}
                </Text>
                <Button title="›" size="sm" variant="secondary" outline onPress={() => shiftMonth(1)} />
              </CardHeader>
              <CardBody style={{ padding: 8 }}>
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
                            key === todayKey && styles.dayToday,
                            isSelected && styles.daySelected,
                          ]}
                        >
                          <Text style={isSelected ? styles.daySelectedText : undefined}>{d.getDate()}</Text>
                        </View>
                        {datesWithTasks.has(key) && <View style={styles.dot} />}
                      </Pressable>
                    );
                  })}
                </View>
              </CardBody>
            </Card>
          </Col>

          <Col lg={5}>
            <Card>
              <CardHeader>
                <Text style={[styles.cardTitle, { flex: 1, textAlign: 'left' }]}>{formatDateIt(selected)}</Text>
                {canEdit ? (
                  <Button title="+ Aggiungi" size="sm" onPress={() => setAdding(true)} disabled={!household} />
                ) : (
                  <Badge variant="secondary">Solo lettura</Badge>
                )}
              </CardHeader>
              <CardBody>
                {isLoading && <Text style={styles.muted}>Caricamento…</Text>}
                {!isLoading && dayTasks.length === 0 && (
                  <Text style={styles.muted}>Nessuna attività per questo giorno.</Text>
                )}

                {dayTasks.length > 0 && (
                  <ListGroup>
                    {dayTasks.map((t) => (
                      <ListGroupItem key={t.id}>
                        <View style={styles.taskRow}>
                          <Pressable
                            style={styles.taskMain}
                            disabled={!canEdit}
                            onPress={() =>
                              toggle.mutate({ id: t.id, done: !t.done }, { onError: (e) => showError(e.message) })
                            }
                          >
                            <View style={[styles.check, t.done && styles.checkOn]}>
                              {t.done && <Text style={styles.checkMark}>✓</Text>}
                            </View>
                            <Text style={[styles.taskTitle, t.done && styles.done]}>{t.title}</Text>
                          </Pressable>
                          {canEdit && (
                            <Button
                              title="Elimina"
                              size="sm"
                              variant="danger"
                              outline
                              onPress={() => remove.mutate(t.id, { onError: (e) => showError(e.message) })}
                            />
                          )}
                        </View>
                        <View style={styles.badges}>
                          {t.due_time && <Badge variant="secondary">{t.due_time.slice(0, 5)}</Badge>}
                          {t.assignee_id && <Badge variant="info">{`Per: ${nameOf(t.assignee_id) ?? '…'}`}</Badge>}
                          {t.done && <Badge variant="success">Fatto</Badge>}
                        </View>
                      </ListGroupItem>
                    ))}
                  </ListGroup>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

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
  scroll: { paddingBottom: 24 },
  h1: { fontSize: 32, fontWeight: '500', color: colors.body, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '500', textAlign: 'center', color: colors.body },
  muted: { color: colors.muted },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', alignItems: 'center', paddingVertical: 4, minHeight: 46 },
  weekday: { fontWeight: '700', color: colors.muted, textAlign: 'center' },
  day: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayToday: { borderWidth: 1, borderColor: colors.primary },
  daySelected: { backgroundColor: colors.primary },
  daySelectedText: { color: colors.white, fontWeight: '700' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginTop: 2 },

  taskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  taskMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  check: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#adb5bd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark: { color: colors.white, fontSize: 13, fontWeight: '700' },
  taskTitle: { fontSize: 16, flexShrink: 1, color: colors.body },
  done: { textDecorationLine: 'line-through', color: colors.muted },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingLeft: 30 },
});
