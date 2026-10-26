import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { showError, showInfo } from './alert';
import { getPref, setPref } from './prefs';
import { useSession } from './session';
import { supabase } from './supabase';

export type Household = { id: string; name: string; invite_code: string };

const ACTIVE_KEY = 'activeHouseholdId';

type HouseholdState = {
  households: Household[];
  active: Household | null;
  isLoading: boolean;
  setActiveId: (id: string) => void;
};

const HouseholdContext = createContext<HouseholdState>({
  households: [],
  active: null,
  isLoading: true,
  setActiveId: () => {},
});

// Tutti i gruppi di cui l'utente fa parte + quello attualmente selezionato
export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const userId = session?.user.id;
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [prefLoaded, setPrefLoaded] = useState(false);

  useEffect(() => {
    getPref(ACTIVE_KEY).then((v) => {
      setActiveIdState(v);
      setPrefLoaded(true);
    });
  }, []);

  const { data: households = [], isLoading } = useQuery({
    queryKey: ['households', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Household[]> => {
      const { data, error } = await supabase
        .from('household_members')
        .select('joined_at, households(id, name, invite_code)')
        .eq('user_id', userId!)
        .order('joined_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((m: any) => m.households as Household).filter(Boolean);
    },
  });

  const setActiveId = useCallback((id: string) => {
    setActiveIdState(id);
    setPref(ACTIVE_KEY, id);
  }, []);

  const value = useMemo<HouseholdState>(
    () => ({
      households,
      // se il gruppo salvato non c'è più (uscito, eliminato) si torna al primo
      active: households.find((h) => h.id === activeId) ?? households[0] ?? null,
      isLoading: !prefLoaded || (!!userId && isLoading),
      setActiveId,
    }),
    [households, activeId, prefLoaded, userId, isLoading, setActiveId],
  );

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}

export const useHouseholds = () => useContext(HouseholdContext);

// Gruppo attivo (stessa forma di prima, così le schermate esistenti non cambiano)
export function useHousehold() {
  const { active, isLoading } = useContext(HouseholdContext);
  return { data: active, isLoading };
}

// Azioni sui gruppi: creare, entrare con codice, uscire
export function useGroupActions() {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const { setActiveId } = useHouseholds();

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['households'] });

  async function create(name: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('create_household', { p_name: name.trim() });
    if (error) {
      showError(error.message);
      return false;
    }
    await refresh();
    setActiveId((data as Household).id);
    showInfo(`Gruppo "${name.trim()}" creato.`);
    return true;
  }

  async function join(code: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('join_household', { p_code: code.trim() });
    if (error) {
      showError(error.message);
      return false;
    }
    await refresh();
    setActiveId((data as Household).id);
    showInfo(`Sei entrato in "${(data as Household).name}".`);
    return true;
  }

  async function leave(householdId: string): Promise<boolean> {
    const { error } = await supabase
      .from('household_members')
      .delete()
      .eq('household_id', householdId)
      .eq('user_id', session!.user.id);
    if (error) {
      showError(error.message);
      return false;
    }
    await refresh();
    showInfo('Sei uscito dal gruppo.');
    return true;
  }

  return { create, join, leave };
}
