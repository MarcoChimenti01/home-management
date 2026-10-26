import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { showError, showInfo } from './alert';
import type { Role } from './household';
import { supabase } from './supabase';

export type Member = { user_id: string; display_name: string; role: Role };

export function useMembers(householdId: string | undefined) {
  return useQuery({
    queryKey: ['members', householdId],
    enabled: !!householdId,
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from('household_members')
        .select('user_id, role, joined_at, profiles(display_name)')
        .eq('household_id', householdId!)
        .order('joined_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((m: any) => ({
        user_id: m.user_id,
        role: m.role as Role,
        display_name: m.profiles?.display_name || 'Senza nome',
      }));
    },
  });
}

// Azioni riservate all'amministratore
export function useMemberActions(householdId: string | undefined) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['members', householdId] });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Role }) => {
      const { error } = await supabase.rpc('set_member_role', {
        p_household: householdId,
        p_user: userId,
        p_role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      showInfo('Permessi aggiornati.');
    },
    onError: (e: Error) => showError(e.message),
  });

  const remove = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('remove_member', { p_household: householdId, p_user: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      showInfo('Membro rimosso dal gruppo.');
    },
    onError: (e: Error) => showError(e.message),
  });

  return { setRole, remove };
}
