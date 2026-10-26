-- Permessi per gruppo: admin (gestisce i membri), member (vede e modifica), viewer (solo lettura).

-- ---------------------------------------------------------------
-- Ruoli
-- ---------------------------------------------------------------
alter table public.household_members drop constraint if exists household_members_role_check;
alter table public.household_members
  add constraint household_members_role_check check (role in ('admin', 'member', 'viewer'));

create function public.household_role(hid uuid) returns text
language sql stable security definer set search_path = public as $$
  select role from public.household_members where household_id = hid and user_id = auth.uid();
$$;

-- admin e member possono modificare; viewer no
create function public.is_household_editor(hid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.household_role(hid) in ('admin', 'member'), false);
$$;

create function public.is_household_admin(hid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.household_role(hid) = 'admin', false);
$$;

-- ---------------------------------------------------------------
-- Policy: tutti i membri leggono, solo admin/member scrivono
-- ---------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['tasks', 'categories', 'contributions', 'expenses'] loop
    execute format('drop policy if exists %I on public.%I', t || '_all', t);
    execute format('create policy %I on public.%I for select using (public.is_household_member(household_id))', t || '_select', t);
    execute format('create policy %I on public.%I for insert with check (public.is_household_editor(household_id))', t || '_insert', t);
    execute format('create policy %I on public.%I for update using (public.is_household_editor(household_id)) with check (public.is_household_editor(household_id))', t || '_update', t);
    execute format('create policy %I on public.%I for delete using (public.is_household_editor(household_id))', t || '_delete', t);
  end loop;
end $$;

drop policy if exists "reminders_all" on public.reminders;
create policy "reminders_select" on public.reminders for select using (
  exists (select 1 from public.tasks t where t.id = task_id and public.is_household_member(t.household_id))
);
create policy "reminders_insert" on public.reminders for insert with check (
  exists (select 1 from public.tasks t where t.id = task_id and public.is_household_editor(t.household_id))
);
create policy "reminders_update" on public.reminders for update
  using (exists (select 1 from public.tasks t where t.id = task_id and public.is_household_editor(t.household_id)))
  with check (exists (select 1 from public.tasks t where t.id = task_id and public.is_household_editor(t.household_id)));
create policy "reminders_delete" on public.reminders for delete using (
  exists (select 1 from public.tasks t where t.id = task_id and public.is_household_editor(t.household_id))
);

-- ---------------------------------------------------------------
-- Gestione membri: solo tramite funzioni (con controlli sull'ultimo admin)
-- ---------------------------------------------------------------
drop policy if exists "members_delete_self" on public.household_members;

create function public.set_member_role(p_household uuid, p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_household_admin(p_household) then
    raise exception 'Solo un amministratore può cambiare i ruoli';
  end if;
  if p_role not in ('admin', 'member', 'viewer') then
    raise exception 'Ruolo non valido';
  end if;
  if p_role <> 'admin'
     and (select role from public.household_members where household_id = p_household and user_id = p_user) = 'admin'
     and (select count(*) from public.household_members where household_id = p_household and role = 'admin') <= 1 then
    raise exception 'Deve restare almeno un amministratore';
  end if;
  update public.household_members set role = p_role
  where household_id = p_household and user_id = p_user;
end $$;

create function public.remove_member(p_household uuid, p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_household_admin(p_household) then
    raise exception 'Solo un amministratore può rimuovere un membro';
  end if;
  if p_user = auth.uid() then
    raise exception 'Per uscire dal gruppo usa "Esci"';
  end if;
  delete from public.household_members where household_id = p_household and user_id = p_user;
end $$;

create function public.leave_household(p_household uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.is_household_admin(p_household)
     and (select count(*) from public.household_members where household_id = p_household and role = 'admin') <= 1
     and (select count(*) from public.household_members where household_id = p_household) > 1 then
    raise exception 'Sei l''unico amministratore: nomina prima un altro amministratore';
  end if;
  delete from public.household_members where household_id = p_household and user_id = auth.uid();
end $$;
