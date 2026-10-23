-- YAVA · Eliminación de cuenta (requisito App Store / Google Play)
-- La parte pública se anonimiza aquí; la parte de Auth (bloquear usuario, quitar correo/teléfono) la hace la
-- Edge Function `delete-account` con service role (supabase.auth.admin.updateUserById). La app invoca esa función.
create or replace function public.anonymize_account(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.role() is distinct from 'service_role' and current_user not in ('postgres','service_role') and auth.uid() is distinct from p_uid then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if exists (select 1 from orders where (customer_id = p_uid or courier_id = p_uid) and status not in ('delivered','cancelled')) then
    raise exception 'Tienes pedidos en curso. Espera a que terminen para eliminar tu cuenta.';
  end if;
  if exists (select 1 from merchants where owner_id = p_uid and status = 'active') then
    raise exception 'Tu comercio está activo. Pide a soporte pausarlo antes de eliminar la cuenta.';
  end if;
  perform audit('account.delete', 'profile', p_uid::text, 'Solicitud del usuario', null, null);
  update orders set address_snapshot = '{}'::jsonb, notes = null where customer_id = p_uid;
  update order_messages set body = '[mensaje eliminado]' where sender_id = p_uid;
  update couriers set plate = null, document_number = null, bank_account = null, is_online = false, current_lat = null, current_lng = null where user_id = p_uid;
  update profiles set full_name = 'Usuario eliminado', phone = null, email = null, avatar_url = null, notifications_enabled = false where id = p_uid;
end $$;
