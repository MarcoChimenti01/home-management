import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ROLE_LABELS, usePermissions, type Role } from '@/lib/household';
import { useMemberActions, useMembers } from '@/lib/members';
import { useSession } from '@/lib/session';
import { Badge, Button, Card, CardBody, CardHeader, ListGroup, ListGroupItem, Pills, colors } from '@/ui';

const ROLE_ITEMS: { value: Role; label: string }[] = [
  { value: 'admin', label: ROLE_LABELS.admin },
  { value: 'member', label: ROLE_LABELS.member },
  { value: 'viewer', label: ROLE_LABELS.viewer },
];

// Membri del gruppo attivo. L'amministratore può cambiare i permessi o rimuovere un membro.
export function MembersPanel({ householdId }: { householdId: string }) {
  const { session } = useSession();
  const { isAdmin } = usePermissions();
  const { data: members = [] } = useMembers(householdId);
  const { setRole, remove } = useMemberActions(householdId);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <Text style={styles.title}>Membri e permessi</Text>
      </CardHeader>
      <CardBody>
        {!isAdmin && <Text style={styles.muted}>Solo l'amministratore del gruppo può modificare i permessi.</Text>}

        <ListGroup>
          {members.map((m) => {
            const isMe = m.user_id === session?.user.id;
            return (
              <ListGroupItem key={m.user_id}>
                <View style={styles.row}>
                  <Text style={styles.name}>
                    {m.display_name}
                    {isMe ? ' (io)' : ''}
                  </Text>
                  <Badge variant={m.role === 'admin' ? 'primary' : m.role === 'viewer' ? 'secondary' : 'success'}>
                    {ROLE_LABELS[m.role]}
                  </Badge>
                </View>

                {isAdmin && !isMe && (
                  <View style={{ gap: 8, paddingTop: 4 }}>
                    <Pills<Role>
                      value={m.role}
                      items={ROLE_ITEMS}
                      disabled={setRole.isPending}
                      onChange={(role) => role !== m.role && setRole.mutate({ userId: m.user_id, role })}
                    />
                    {confirmRemove === m.user_id ? (
                      <View style={styles.row}>
                        <Button
                          title="Conferma rimozione"
                          size="sm"
                          variant="danger"
                          onPress={() => remove.mutate(m.user_id, { onSettled: () => setConfirmRemove(null) })}
                        />
                        <Button title="Annulla" size="sm" variant="secondary" onPress={() => setConfirmRemove(null)} />
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row' }}>
                        <Button
                          title="Rimuovi dal gruppo"
                          size="sm"
                          variant="danger"
                          outline
                          onPress={() => setConfirmRemove(m.user_id)}
                        />
                      </View>
                    )}
                  </View>
                )}
              </ListGroupItem>
            );
          })}
        </ListGroup>
      </CardBody>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '500', color: colors.body },
  muted: { color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { fontSize: 16, flexShrink: 1, color: colors.body },
});
