-- Assistants can sign in and read order and customer message details.
-- Administrative writes remain restricted by the existing is_admin() policies.

create or replace function public.is_assistant()
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = (select auth.uid())
      and au.role = 'assistant'
  );
$$;

revoke all on function public.is_assistant() from public, anon;
grant execute on function public.is_assistant() to authenticated;

drop policy if exists assistants_can_read_orders on public.orders;
create policy assistants_can_read_orders
on public.orders
for select
to authenticated
using (public.is_assistant());

drop policy if exists assistants_can_read_order_items on public.order_items;
create policy assistants_can_read_order_items
on public.order_items
for select
to authenticated
using (public.is_assistant());

drop policy if exists assistants_can_read_contact_messages on public.contact_messages;
create policy assistants_can_read_contact_messages
on public.contact_messages
for select
to authenticated
using (public.is_assistant());

drop policy if exists assistants_can_read_wholesale_inquiries on public.wholesale_inquiries;
create policy assistants_can_read_wholesale_inquiries
on public.wholesale_inquiries
for select
to authenticated
using (public.is_assistant());
