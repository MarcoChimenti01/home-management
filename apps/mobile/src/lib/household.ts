import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useSession } from './session';

export type Household = { id: string; name: string; invite_code: string };

// Famiglia dell'utente corrente (null se non ne ha ancora una)
export function useHousehold() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['household', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Household | null> => {
      const { data, error } = await supabase
        .from('household_members')
        .select('households(id, name, invite_code)')
        .eq('user_id', userId!)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data?.households as unknown as Household | null) ?? null;
    },
  });
}
