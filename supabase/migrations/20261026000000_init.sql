-- Schema iniziale: famiglia, compiti/reminder, cassa comune.

-- ---------------------------------------------------------------
-- Profili e famiglia
-- ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  push_token text,
  created_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default upper(substr(md5(random()::text), 1, 8)),
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index on public.household_members (user_id);

-- Profilo creato automaticamente alla registrazione
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper per le policy RLS
create function public.is_household_member(hid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

-- Crea una famiglia e rende chi chiama admin
create function public.create_household(p_name text) returns public.households
language plpgsql security definer set search_path = public as $$
declare h public.households;
begin
  insert into public.households (name) values (p_name) returning * into h;
  insert into public.household_members (household_id, user_id, role)
  values (h.id, auth.uid(), 'admin');
  return h;
end $$;

-- Entra in una famiglia con il codice d'invito
create function public.join_household(p_code text) returns public.households
language plpgsql security definer set search_path = public as $$
declare h public.households;
begin
  select * into h from public.households where invite_code = upper(p_code);
  if not found then
    raise exception 'Codice invito non valido';
  end if;
  insert into public.household_members (household_id, user_id)
  values (h.id, auth.uid())
  on conflict do nothing;
  return h;
end $$;

-- ---------------------------------------------------------------
-- Compiti e reminder
-- ---------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  title text not null,
  description text,
  due_date date not null,
  due_time time,
  assignee_id uuid references public.profiles (id) on delete set null,
  done boolean not null default false,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now()
);
create index on public.tasks (household_id, due_date);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  remind_at timestamptz not null,
  sent boolean not null default false
);
create index on public.reminders (user_id, remind_at);
create index on public.reminders (remind_at) where not sent;

-- ---------------------------------------------------------------
-- Cassa comune
-- ---------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  unique (household_id, name)
);

-- Versamento mensile di un componente nella cassa comune
create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id),
  month date not null check (month = date_trunc('month', month)::date),
  amount numeric(10, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);
create index on public.contributions (household_id, month);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  description text not null,
  amount numeric(10, 2) not null check (amount > 0),
  spent_on date not null default current_date,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now()
);
create index on public.expenses (household_id, spent_on);

-- Riepilogo mensile della cassa: versato, speso, saldo del mese
create view public.monthly_summary with (security_invoker = true) as
select
  household_id,
  month,
  sum(contributed) as contributed,
  sum(spent) as spent,
  sum(contributed) - sum(spent) as balance
from (
  select household_id, month, amount as contributed, 0::numeric as spent
  from public.contributions
  union all
  select household_id, date_trunc('month', spent_on)::date, 0::numeric, amount
  from public.expenses
) m
group by household_id, month;

-- Spese del mese per categoria (per il grafico)
create view public.monthly_expenses_by_category with (security_invoker = true) as
select
  e.household_id,
  date_trunc('month', e.spent_on)::date as month,
  coalesce(c.name, 'Altro') as category,
  sum(e.amount) as total
from public.expenses e
left join public.categories c on c.id = e.category_id
group by 1, 2, 3;

-- ---------------------------------------------------------------
-- Row Level Security: si vede solo ciò che appartiene alla propria famiglia
-- ---------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.tasks enable row level security;
alter table public.reminders enable row level security;
alter table public.categories enable row level security;
alter table public.contributions enable row level security;
alter table public.expenses enable row level security;

-- profiles: il proprio, più quelli dei familiari
create policy "profiles_select" on public.profiles for select using (
  id = auth.uid() or exists (
    select 1 from public.household_members a
    join public.household_members b on a.household_id = b.household_id
    where a.user_id = auth.uid() and b.user_id = profiles.id
  )
);
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid());

-- households / membri (creazione e join passano dalle funzioni security definer)
create policy "households_select" on public.households for select using (public.is_household_member(id));
create policy "members_select" on public.household_members for select using (public.is_household_member(household_id));
create policy "members_delete_self" on public.household_members for delete using (user_id = auth.uid());

-- tabelle di famiglia
create policy "tasks_all" on public.tasks for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "categories_all" on public.categories for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "contributions_all" on public.contributions for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "expenses_all" on public.expenses for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- reminders: visibili ai familiari del task, modificabili se il task è della propria famiglia
create policy "reminders_all" on public.reminders for all
  using (exists (select 1 from public.tasks t where t.id = task_id and public.is_household_member(t.household_id)))
  with check (exists (select 1 from public.tasks t where t.id = task_id and public.is_household_member(t.household_id)));
