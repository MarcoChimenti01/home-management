import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

export type Contribution = {
  id: string;
  user_id: string;
  month: string;
  amount: number;
  created_at: string;
};

export type Expense = {
  id: string;
  category_id: string | null;
  description: string;
  amount: number;
  spent_on: string;
  created_by: string;
};

export type MoneyCategory = { id: string; name: string };

export function useContributions(householdId: string | undefined, month: string) {
  return useQuery({
    queryKey: ['contributions', householdId, month],
    enabled: !!householdId,
    queryFn: async (): Promise<Contribution[]> => {
      const { data, error } = await supabase
        .from('contributions')
        .select('id, user_id, month, amount, created_at')
        .eq('household_id', householdId!)
        .eq('month', month)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Contribution[];
    },
  });
}

export function useExpenses(householdId: string | undefined, from: string, to: string) {
  return useQuery({
    queryKey: ['expenses', householdId, from, to],
    enabled: !!householdId,
    queryFn: async (): Promise<Expense[]> => {
      const { data, error } = await supabase
        .from('expenses')
        .select('id, category_id, description, amount, spent_on, created_by')
        .eq('household_id', householdId!)
        .gte('spent_on', from)
        .lt('spent_on', to)
        .order('spent_on', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Expense[];
    },
  });
}

export function useMoneyCategories(householdId: string | undefined) {
  return useQuery({
    queryKey: ['money-categories', householdId],
    enabled: !!householdId,
    queryFn: async (): Promise<MoneyCategory[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('household_id', householdId!)
        .order('name');
      if (error) throw error;
      return (data ?? []) as MoneyCategory[];
    },
  });
}

function useInvalidateMoney() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['contributions'] }),
      queryClient.invalidateQueries({ queryKey: ['expenses'] }),
      queryClient.invalidateQueries({ queryKey: ['money-categories'] }),
    ]);
  };
}

export function useAddContribution() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: async (entry: {
      householdId: string;
      userId: string;
      month: string;
      amount: number;
    }) => {
      const { error } = await supabase.from('contributions').insert({
        household_id: entry.householdId,
        user_id: entry.userId,
        month: entry.month,
        amount: entry.amount,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useAddExpense() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: async (entry: {
      householdId: string;
      userId: string;
      description: string;
      amount: number;
      spentOn: string;
      categoryName: string;
    }) => {
      let categoryId: string | null = null;
      if (entry.categoryName) {
        const { data: existing, error: findError } = await supabase
          .from('categories')
          .select('id')
          .eq('household_id', entry.householdId)
          .eq('name', entry.categoryName)
          .maybeSingle();
        if (findError) throw findError;

        if (existing) {
          categoryId = existing.id;
        } else {
          const { data: category, error: createError } = await supabase
            .from('categories')
            .insert({ household_id: entry.householdId, name: entry.categoryName })
            .select('id')
            .single();
          if (createError) throw createError;
          categoryId = category.id;
        }
      }

      const { error } = await supabase.from('expenses').insert({
        household_id: entry.householdId,
        created_by: entry.userId,
        description: entry.description,
        amount: entry.amount,
        spent_on: entry.spentOn,
        category_id: categoryId,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteContribution() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase
        .from('contributions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteExpense() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('created_by', userId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
