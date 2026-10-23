-- YAVA · Eliminación de cuenta (requisito App Store / Google Play)
-- Anonimiza el perfil, borra datos personales y elimina el usuario de auth. Los pedidos se conservan anonimizados para contabilidad.
create or replace function public.request_account_deletion() returns void
language plpgsql security definer set search_path = public, auth as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = '28000'; end if;
  if exists (select 1 from orders where (customer_id = v_uid or courier_id = v_uid) and status not in ('delivered','cancelled')) then
    raise exception 'Tienes pedidos en curso. Espera a que terminen para eliminar tu cuenta.';
  end if;
  if exists (select 1 from merchants where owner_id = v_uid and status = 'active') then
    raise exception 'Tu comercio está activo. Pide a soporte pausarlo antes de eliminar la cuenta.';
  end if;
  perform audit('account.delete', 'profile', v_uid::text, 'Solicitud del usuario', null, null);
  delete from addresses where user_id = v_uid;
  delete from payment_methods where user_id = v_uid;
  delete from device_tokens where user_id = v_uid;
  delete from favorites where user_id = v_uid;
  delete from notifications where user_id = v_uid;
  update orders set address_snapshot = '{}'::jsonb, notes = null where customer_id = v_uid;
  update order_messages set body = '[mensaje eliminado]' where sender_id = v_uid;
  update couriers set plate = null, document_number = null, bank_account = null, is_online = false, current_lat = null, current_lng = null where user_id = v_uid;
  delete from courier_documents where courier_id = v_uid;
  update profiles set full_name = 'Usuario eliminado', phone = null, email = null, avatar_url = null, notifications_enabled = false where id = v_uid;
  delete from auth.users where id = v_uid;
end $$;
