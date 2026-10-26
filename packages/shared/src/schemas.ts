import { z } from 'zod';

export const taskInputSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  due_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  assignee_id: z.string().uuid().nullable().optional(),
});

export const reminderInputSchema = z.object({
  task_id: z.string().uuid(),
  user_id: z.string().uuid(),
  remind_at: z.string().datetime(),
});

export const expenseInputSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1).max(200),
  category_id: z.string().uuid().nullable().optional(),
  spent_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const contributionInputSchema = z.object({
  amount: z.number().positive(),
  // primo giorno del mese di riferimento, es. 2026-10-01
  month: z.string().regex(/^\d{4}-\d{2}-01$/),
});

export type TaskInput = z.infer<typeof taskInputSchema>;
export type ReminderInput = z.infer<typeof reminderInputSchema>;
export type ExpenseInput = z.infer<typeof expenseInputSchema>;
export type ContributionInput = z.infer<typeof contributionInputSchema>;
