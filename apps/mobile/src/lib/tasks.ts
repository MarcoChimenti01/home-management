import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useSession } from './session';
import { syncReminders } from './notifications';

export type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  due_time: string | null;
  assignee_id: string | null;
  done: boolean;
};

export type NewTask = {
  household_id: string;
  title: string;
  due_date: string;
  due_time: string | null;
  assignee_id: string | null;
  // se presente crea un reminder per reminder_user_id a questo istante (ISO)
  remind_at: string | null;
  reminder_user_id: string | null;
};

export function useTasks(householdId: string | undefined, from: string, to: string) {
  return useQuery({
    queryKey: ['tasks', householdId, from, to],
    enabled: !!householdId,
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description, due_date, due_time, assignee_id, done')
        .eq('household_id', householdId!)
        .gte('due_date', from)
        .lte('due_date', to)
        .order('due_time', { ascending: true, nullsFirst: true });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  const { session } = useSession();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    if (session) await syncReminders(session.user.id);
  };
}

export function useAddTask() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (t: NewTask) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          household_id: t.household_id,
          title: t.title,
          due_date: t.due_date,
          due_time: t.due_time,
          assignee_id: t.assignee_id,
        })
        .select('id')
        .single();
      if (error) throw error;

      if (t.remind_at && t.reminder_user_id) {
        const { error: rErr } = await supabase
          .from('reminders')
          .insert({ task_id: data.id, user_id: t.reminder_user_id, remind_at: t.remind_at });
        if (rErr) throw rErr;
      }
    },
    onSuccess: invalidate,
  });
}

export function useToggleTask() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from('tasks').update({ done }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
