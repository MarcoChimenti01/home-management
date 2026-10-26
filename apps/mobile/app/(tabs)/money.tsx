import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { showError, showInfo } from '@/lib/alert';
import { MONTH_NAMES, toDateKey } from '@/lib/dates';
import { useHousehold } from '@/lib/household';
import { useMembers } from '@/lib/members';
import { useSession } from '@/lib/session';
import {
  useAddContribution,
  useAddExpense,
  useContributions,
  useDeleteContribution,
  useDeleteExpense,
  useExpenses,
  useMoneyCategories,
} from '@/lib/money';
import { colors as themeColors } from '@/lib/theme';

type EntryKind = 'contribution' | 'expense';

const currency = (amount: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
const pad = (value: number) => String(value).padStart(2, '0');
const monthKey = (year: number, month: number) => `${year}-${pad(month + 1)}-01`;
const nextMonthKey = (year: number, month: number) =>
  monthKey(new Date(year, month + 1, 1).getFullYear(), new Date(year, month + 1, 1).getMonth());

export default function Money() {
  const { session } = useSession();
  const userId = session?.user.id;
  const { data: household, isLoading: householdLoading } = useHousehold();
  const { data: members = [] } = useMembers(household?.id);
  const today = new Date();
  const [month, setMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [entryKind, setEntryKind] = useState<EntryKind | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [spentOn, setSpentOn] = useState(
    toDateKey(new Date(month.year, month.month, today.getDate())),
  );
  const monthDate = monthKey(month.year, month.month);
  const nextMonthDate = nextMonthKey(month.year, month.month);
  const {
    data: contributions = [],
    isLoading: contributionsLoading,
    isError: contributionsError,
    refetch: refetchContributions,
  } = useContributions(household?.id, monthDate);
  const {
    data: expenses = [],
    isLoading: expensesLoading,
    isError: expensesError,
    refetch: refetchExpenses,
  } = useExpenses(household?.id, monthDate, nextMonthDate);
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useMoneyCategories(household?.id);
  const addContribution = useAddContribution();
  const addExpense = useAddExpense();
  const deleteContribution = useDeleteContribution();
  const deleteExpense = useDeleteExpense();

  const totalContributions = contributions.reduce((total, item) => total + Number(item.amount), 0);
  const totalExpenses = expenses.reduce((total, item) => total + Number(item.amount), 0);
  const balance = totalContributions - totalExpenses;
  const progress = totalContributions > 0 ? Math.min(totalExpenses / totalContributions, 1) : 0;
  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    expenses.forEach((expense) => {
      const name =
        categories.find((category) => category.id === expense.category_id)?.name ?? 'Altro';
      totals.set(name, (totals.get(name) ?? 0) + Number(expense.amount));
    });
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [categories, expenses]);
  const memberName = (id: string) =>
    members.find((member) => member.user_id === id)?.display_name ?? 'Componente';

  function moveMonth(delta: number) {
    const target = new Date(month.year, month.month + delta, 1);
    setMonth({ year: target.getFullYear(), month: target.getMonth() });
    setSpentOn(toDateKey(target));
  }

  function openEntry(kind: EntryKind) {
    setEntryKind(kind);
    setAmount('');
    setDescription('');
    setCategoryName('');
    setSpentOn(toDateKey(new Date(month.year, month.month, 1)));
  }

  async function saveEntry() {
    if (!userId || !household || !entryKind) return;
    const parsedAmount = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      showError('Inserisci un importo valido maggiore di zero.');
      return;
    }

    try {
      if (entryKind === 'contribution') {
        await addContribution.mutateAsync({
          householdId: household.id,
          userId,
          month: monthDate,
          amount: parsedAmount,
        });
        showInfo('Budget mensile aggiunto.');
      } else {
        if (!description.trim()) {
          showError('Inserisci una descrizione per la spesa.');
          return;
        }
        if (!isDateInMonth(spentOn, monthDate, nextMonthDate)) {
          showError('La data deve appartenere al mese selezionato.');
          return;
        }
        await addExpense.mutateAsync({
          householdId: household.id,
          userId,
          description: description.trim(),
          amount: parsedAmount,
          spentOn,
          categoryName: categoryName.trim(),
        });
        showInfo('Spesa aggiunta.');
      }
      setEntryKind(null);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Impossibile salvare la voce.');
    }
  }

  if (!userId) return null;

  if (householdLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.muted}>Caricamento cassa…</Text>
      </View>
    );
  }

  if (!household) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>€</Text>
        <Text style={styles.title}>La cassa di casa</Text>
        <Text style={styles.muted}>
          Crea una famiglia o unisciti a una per iniziare a gestire il budget comune.
        </Text>
      </View>
    );
  }

  const loading = contributionsLoading || expensesLoading || categoriesLoading;
  const failed = contributionsError || expensesError || categoriesError;
  const saving = addContribution.isPending || addExpense.isPending;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>GESTIONE FAMILIARE</Text>
          <Text style={styles.title}>Cassa comune</Text>
          <Text style={styles.muted}>{household.name}</Text>
        </View>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>€</Text>
        </View>
      </View>

      <View style={styles.monthSelector}>
        <Pressable
          accessibilityLabel="Mese precedente"
          style={styles.monthArrow}
          onPress={() => moveMonth(-1)}
        >
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <View style={styles.monthLabel}>
          <Text style={styles.monthName}>{MONTH_NAMES[month.month]}</Text>
          <Text style={styles.monthYear}>{month.year}</Text>
        </View>
        <Pressable
          accessibilityLabel="Mese successivo"
          style={styles.monthArrow}
          onPress={() => moveMonth(1)}
        >
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.cardLabel}>SALDO DISPONIBILE</Text>
            <Text style={styles.balance}>{currency(balance)}</Text>
          </View>
          <View style={[styles.balanceBadge, balance < 0 && styles.negativeBadge]}>
            <Text style={[styles.balanceBadgeText, balance < 0 && styles.negativeText]}>
              {balance < 0 ? 'In rosso' : 'Disponibile'}
            </Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressCaption}>
          {totalContributions > 0
            ? `${Math.round(progress * 100)}% del budget mensile utilizzato`
            : 'Aggiungi il budget mensile per monitorare le spese'}
        </Text>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryStats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>BUDGET</Text>
            <Text style={styles.statValue}>{currency(totalContributions)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>SPESE</Text>
            <Text style={styles.statValue}>{currency(totalExpenses)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.primaryButton} onPress={() => openEntry('contribution')}>
          <Text style={styles.primaryButtonText}>＋ Aggiungi budget</Text>
        </Pressable>
        <Pressable style={styles.outlineButton} onPress={() => openEntry('expense')}>
          <Text style={styles.outlineButtonText}>＋ Spesa</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Spese per categoria</Text>
        <Text style={styles.sectionCaption}>
          {expenses.length} {expenses.length === 1 ? 'voce' : 'voci'}
        </Text>
      </View>
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.cardLoader} />
        ) : failed ? (
          <View style={styles.inlineMessage}>
            <Text style={styles.errorText}>Non è stato possibile caricare i dati della cassa.</Text>
            <Pressable
              onPress={() => {
                void refetchContributions();
                void refetchExpenses();
                void refetchCategories();
              }}
            >
              <Text style={styles.linkText}>Riprova</Text>
            </Pressable>
          </View>
        ) : categoryTotals.length === 0 ? (
          <Text style={styles.cardEmpty}>Le spese aggiunte appariranno qui.</Text>
        ) : (
          categoryTotals.map(([name, total]) => {
            const percent = totalExpenses > 0 ? total / totalExpenses : 0;
            return (
              <View key={name} style={styles.categoryRow}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{name}</Text>
                  <Text style={styles.categoryAmount}>{currency(total)}</Text>
                </View>
                <View style={styles.categoryTrack}>
                  <View style={[styles.categoryFill, { width: `${percent * 100}%` }]} />
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Movimenti del mese</Text>
      </View>
      <View style={styles.card}>
        {!loading && !failed && contributions.length === 0 && expenses.length === 0 ? (
          <Text style={styles.cardEmpty}>
            Nessun movimento per questo mese. Aggiungi il budget o registra una spesa.
          </Text>
        ) : (
          <>
            {contributions.map((item) => (
              <View key={`contribution-${item.id}`} style={styles.transactionRow}>
                <View style={[styles.transactionIcon, styles.incomeIcon]}>
                  <Text style={styles.incomeText}>↑</Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>Budget · {memberName(item.user_id)}</Text>
                  <Text style={styles.transactionDate}>
                    Aggiunto il {formatDate(item.created_at.slice(0, 10))}
                  </Text>
                </View>
                <Text style={[styles.transactionAmount, styles.incomeText]}>
                  +{currency(Number(item.amount))}
                </Text>
                {item.user_id === userId && (
                  <Pressable
                    accessibilityLabel="Elimina budget"
                    style={styles.deleteButton}
                    onPress={() =>
                      deleteContribution.mutate(
                        { id: item.id, userId },
                        {
                          onError: (error) => showError(error.message),
                          onSuccess: () => showInfo('Budget eliminato.'),
                        },
                      )
                    }
                  >
                    <Text style={styles.deleteText}>×</Text>
                  </Pressable>
                )}
              </View>
            ))}
            {expenses.map((item) => {
              const category = categories.find((value) => value.id === item.category_id)?.name;
              return (
                <View key={`expense-${item.id}`} style={styles.transactionRow}>
                  <View style={[styles.transactionIcon, styles.expenseIcon]}>
                    <Text style={styles.expenseIconText}>↓</Text>
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle} numberOfLines={1}>
                      {item.description}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(item.spent_on)}
                      {category
                        ? ` · ${category}`
                        : item.category_id && categoriesError
                          ? ' · Categoria non disponibile'
                          : ''}
                    </Text>
                  </View>
                  <Text style={styles.transactionAmount}>−{currency(Number(item.amount))}</Text>
                  {item.created_by === userId && (
                    <Pressable
                      accessibilityLabel="Elimina spesa"
                      style={styles.deleteButton}
                      onPress={() =>
                        deleteExpense.mutate(
                          { id: item.id, userId },
                          {
                            onError: (error) => showError(error.message),
                            onSuccess: () => showInfo('Spesa eliminata.'),
                          },
                        )
                      }
                    >
                      <Text style={styles.deleteText}>×</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </>
        )}
      </View>
      <Text style={styles.footer}>
        La cassa è condivisa con tutti i componenti di {household.name}.
      </Text>

      <Modal
        visible={entryKind !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEntryKind(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {entryKind === 'contribution' ? 'Aggiungi budget' : 'Registra una spesa'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {MONTH_NAMES[month.month]} {month.year}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel="Chiudi"
                  onPress={() => setEntryKind(null)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeText}>×</Text>
                </Pressable>
              </View>
              <Text style={styles.inputLabel}>Importo (€)</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0,00"
                keyboardType="decimal-pad"
                style={styles.input}
                accessibilityLabel="Importo in euro"
              />
              {entryKind === 'expense' && (
                <>
                  <Text style={styles.inputLabel}>Descrizione</Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Es. Spesa supermercato"
                    style={styles.input}
                    maxLength={120}
                  />
                  <Text style={styles.inputLabel}>Categoria (facoltativa)</Text>
                  <TextInput
                    value={categoryName}
                    onChangeText={setCategoryName}
                    placeholder="Es. Alimentari"
                    style={styles.input}
                    maxLength={40}
                  />
                  {categories.length > 0 && (
                    <View style={styles.categoryChips}>
                      {categories.map((category) => (
                        <Pressable
                          key={category.id}
                          style={[
                            styles.categoryChip,
                            categoryName === category.name && styles.categoryChipSelected,
                          ]}
                          onPress={() =>
                            setCategoryName(categoryName === category.name ? '' : category.name)
                          }
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              categoryName === category.name && styles.categoryChipTextSelected,
                            ]}
                          >
                            {category.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  <Text style={styles.inputLabel}>Data (AAAA-MM-GG)</Text>
                  <TextInput
                    value={spentOn}
                    onChangeText={setSpentOn}
                    placeholder="2026-10-01"
                    style={styles.input}
                    maxLength={10}
                    accessibilityLabel="Data della spesa"
                  />
                </>
              )}
              <View style={styles.modalActions}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => setEntryKind(null)}
                  disabled={saving}
                >
                  <Text style={styles.cancelText}>Annulla</Text>
                </Pressable>
                <Pressable
                  style={[styles.primaryButton, styles.saveButton]}
                  onPress={() => void saveEntry()}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Salva</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

function isDateInMonth(value: string, from: string, to: string) {
  const parsed = new Date(`${value}T00:00:00`);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(parsed.getTime()) &&
    toDateKey(parsed) === value &&
    value >= from &&
    value < to
  );
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return `${pad(day)}/${pad(month)}/${year}`;
}

const colors = {
  ...themeColors,
  text: themeColors.dark,
  green: themeColors.success,
  red: themeColors.danger,
};

const styles = StyleSheet.create({
  container: { padding: 20, gap: 18, backgroundColor: colors.background, flexGrow: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 26, fontWeight: '700', marginTop: 3 },
  muted: { color: colors.muted, fontSize: 14, marginTop: 3, textAlign: 'center' },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#e7f1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: { color: colors.primary, fontSize: 25, fontWeight: '700' },
  monthSelector: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  monthArrow: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  arrowText: { color: colors.primary, fontSize: 28, lineHeight: 32 },
  monthLabel: { alignItems: 'center' },
  monthName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  monthYear: { color: colors.muted, fontSize: 12 },
  summaryCard: {
    backgroundColor: '#fff',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.7 },
  balance: { color: colors.text, fontSize: 30, fontWeight: '700', marginTop: 6 },
  balanceBadge: {
    backgroundColor: '#d1e7dd',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  balanceBadgeText: { color: colors.green, fontSize: 11, fontWeight: '700' },
  negativeBadge: { backgroundColor: '#f8d7da' },
  negativeText: { color: colors.red },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e9ecef',
    marginTop: 18,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  progressCaption: { color: colors.muted, fontSize: 12, marginTop: 7 },
  summaryDivider: { height: 1, backgroundColor: '#e9ecef', marginVertical: 16 },
  summaryStats: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, gap: 4 },
  statLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  statValue: { color: colors.text, fontSize: 16, fontWeight: '600' },
  statDivider: { width: 1, height: 34, backgroundColor: colors.border, marginHorizontal: 14 },
  actionRow: { flexDirection: 'row', gap: 10 },
  primaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  outlineButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  outlineButtonText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: -10,
  },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  sectionCaption: { color: colors.muted, fontSize: 12 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
  },
  cardLoader: { padding: 22 },
  cardEmpty: { color: colors.muted, fontSize: 13, lineHeight: 19, paddingVertical: 18 },
  inlineMessage: { paddingVertical: 16, gap: 8 },
  errorText: { color: colors.red, fontSize: 13 },
  linkText: { color: colors.primary, fontWeight: '600' },
  categoryRow: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f0f1f3' },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  categoryName: { color: colors.text, fontSize: 13, fontWeight: '500' },
  categoryAmount: { color: colors.text, fontSize: 13, fontWeight: '600' },
  categoryTrack: { height: 6, borderRadius: 3, backgroundColor: '#e9ecef', overflow: 'hidden' },
  categoryFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
  transactionRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f1f3',
  },
  transactionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeIcon: { backgroundColor: '#d1e7dd' },
  expenseIcon: { backgroundColor: '#f8d7da' },
  incomeText: { color: colors.green },
  expenseIconText: { color: colors.red, fontSize: 18, fontWeight: '700' },
  transactionInfo: { flex: 1, minWidth: 0 },
  transactionTitle: { color: colors.text, fontSize: 13, fontWeight: '600' },
  transactionDate: { color: colors.muted, fontSize: 11, marginTop: 3 },
  transactionAmount: { color: colors.text, fontSize: 12, fontWeight: '700' },
  deleteButton: { width: 28, height: 34, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: colors.muted, fontSize: 22 },
  footer: { color: colors.muted, fontSize: 11, textAlign: 'center', marginBottom: 10 },
  emptyIcon: { color: colors.primary, fontSize: 42, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(33,37,41,0.48)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalScrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 18 },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  modalSubtitle: { color: colors.muted, fontSize: 13, marginTop: 3 },
  closeButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.muted, fontSize: 25, lineHeight: 28 },
  inputLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 7,
    minHeight: 44,
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: 14,
  },
  categoryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  categoryChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryChipSelected: { borderColor: colors.primary, backgroundColor: '#e7f1ff' },
  categoryChipText: { color: colors.muted, fontSize: 11 },
  categoryChipTextSelected: { color: colors.primary, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    backgroundColor: colors.background,
  },
  cancelText: { color: colors.muted, fontWeight: '600' },
  saveButton: { flex: 1 },
});
