import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MembersPanel } from '@/components/MembersPanel';
import { ROLE_LABELS, useGroupActions, useHouseholds } from '@/lib/household';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Input,
  ListGroup,
  ListGroupItem,
  Row,
  colors,
} from '@/ui';

export default function Groups() {
  const { households, active, setActiveId } = useHouseholds();
  const { create, join, leave } = useGroupActions();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState<string | null>(null);

  async function run(action: () => Promise<boolean>, onOk?: () => void) {
    setBusy(true);
    const ok = await action();
    setBusy(false);
    if (ok) onOk?.();
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Container>
        <Text style={styles.h1}>Gruppi</Text>

        <Row>
          <Col lg={7}>
            <Card>
              <CardHeader>
                <Text style={styles.cardTitle}>I tuoi gruppi</Text>
              </CardHeader>
              <CardBody>
                <ListGroup>
                  {households.map((h) => {
                    const isActive = h.id === active?.id;
                    return (
                      <ListGroupItem key={h.id} active={isActive}>
                        <View style={styles.between}>
                          <Text style={styles.name}>{h.name}</Text>
                          {isActive && <Badge variant="primary">Attivo</Badge>}
                        </View>
                        <Text style={styles.muted}>Codice invito: {h.invite_code}</Text>
                        <Text style={styles.muted}>Il tuo ruolo: {ROLE_LABELS[h.role]}</Text>

                        <View style={styles.actions}>
                          {!isActive && <Button title="Usa" size="sm" onPress={() => setActiveId(h.id)} />}
                          {confirmLeave === h.id ? (
                            <>
                              <Button
                                title="Conferma uscita"
                                size="sm"
                                variant="danger"
                                disabled={busy}
                                onPress={() => run(() => leave(h.id), () => setConfirmLeave(null))}
                              />
                              <Button
                                title="Annulla"
                                size="sm"
                                variant="secondary"
                                onPress={() => setConfirmLeave(null)}
                              />
                            </>
                          ) : (
                            <Button
                              title="Esci dal gruppo"
                              size="sm"
                              variant="secondary"
                              outline
                              onPress={() => setConfirmLeave(h.id)}
                            />
                          )}
                        </View>
                      </ListGroupItem>
                    );
                  })}
                </ListGroup>
              </CardBody>
            </Card>

            {active && (
              <View style={{ marginTop: 16 }}>
                <MembersPanel householdId={active.id} />
              </View>
            )}
          </Col>

          <Col lg={5}>
            <Card>
              <CardHeader>
                <Text style={styles.cardTitle}>Crea un nuovo gruppo</Text>
              </CardHeader>
              <CardBody>
                <Input label="Nome" placeholder="Es. Casa al mare" value={name} onChangeText={setName} />
                <Button
                  title="Crea gruppo"
                  block
                  disabled={busy || !name.trim()}
                  onPress={() => run(() => create(name), () => setName(''))}
                />
              </CardBody>
            </Card>

            <View style={{ marginTop: 16 }}>
              <Card>
                <CardHeader>
                  <Text style={styles.cardTitle}>Entra con un codice</Text>
                </CardHeader>
                <CardBody>
                  <Input
                    label="Codice invito"
                    autoCapitalize="characters"
                    value={code}
                    onChangeText={setCode}
                  />
                  <Button
                    title="Entra nel gruppo"
                    variant="success"
                    block
                    disabled={busy || !code.trim()}
                    onPress={() => run(() => join(code), () => setCode(''))}
                  />
                </CardBody>
              </Card>
            </View>
          </Col>
        </Row>
      </Container>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 24 },
  h1: { fontSize: 32, fontWeight: '500', color: colors.body, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '500', color: colors.body },
  name: { fontSize: 16, fontWeight: '600', color: colors.body, flexShrink: 1 },
  muted: { color: colors.muted },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 4 },
});
