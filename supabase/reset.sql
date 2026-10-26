-- ATTENZIONE: cancella TUTTI i dati e TUTTI gli utenti del progetto.
-- Lo schema (tabelle, viste, policy, funzioni) resta intatto.
-- Solo per lo sviluppo: da eseguire a mano nel SQL Editor di Supabase.

-- 1. Dati dell'app (l'ordine non conta grazie a CASCADE)
truncate table
  public.reminders,
  public.tasks,
  public.expenses,
  public.contributions,
  public.categories,
  public.household_members,
  public.households,
  public.profiles
restart identity cascade;

-- 2. Utenti di accesso (elimina anche sessioni e identità collegate)
delete from auth.users;

-- 3. Controllo: devono essere tutti 0
select
  (select count(*) from auth.users)               as utenti,
  (select count(*) from public.profiles)          as profili,
  (select count(*) from public.households)        as famiglie,
  (select count(*) from public.tasks)             as compiti,
  (select count(*) from public.expenses)          as spese;
