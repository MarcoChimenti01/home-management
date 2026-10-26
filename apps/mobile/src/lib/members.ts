import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

export type Member = { user_id: string; display_name: string };

export function useMembers(householdId: string | undefined) {
  return useQuery({
    queryKey: ['members', householdId],
    enabled: !!householdId,
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from('household_members')
        .select('user_id, profiles(display_name)')
        .eq('household_id', householdId!);
      if (error) throw error;
      return (data ?? []).map((m: any) => ({
        user_id: m.user_id,
        display_name: m.profiles?.display_name || 'Senza nome',
      }));
    },
  });
}
