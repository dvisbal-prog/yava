-- YAVA · Row Level Security por rol
alter table cities enable row level security;
alter table delivery_zones enable row level security;
alter table profiles enable row level security;
alter table addresses enable row level security;
alter table merchants enable row level security;
alter table merchant_members enable row level security;
alter table merchant_hours enable row level security;
alter table merchant_documents enable row level security;
alter table product_categories enable row level security;
alter table products enable row level security;
alter table product_option_groups enable row level security;
alter table product_options enable row level security;
alter table favorites enable row level security;
alter table promotions enable row level security;
alter table coupons enable row level security;
alter table payment_methods enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_events enable row level security;
alter table order_messages enable row level security;
alter table payments enable row level security;
alter table ratings enable row level security;
alter table coupon_redemptions enable row level security;
alter table couriers enable row level security;
alter table courier_documents enable row level security;
alter table courier_location_history enable row level security;
alter table settlements enable row level security;
alter table settlement_orders enable row level security;
alter table courier_withdrawals enable row level security;
alter table support_cases enable row level security;
alter table support_messages enable row level security;
alter table admin_users enable row level security;
alter table admin_invitations enable row level security;
alter table audit_log enable row level security;
alter table platform_settings enable row level security;
alter table notifications enable row level security;
alter table device_tokens enable row level security;
alter table owner_alerts enable row level security;
alter table operating_expenses enable row level security;

-- Público / catálogo
create policy "cities read" on cities for select using (true);
create policy "cities admin" on cities for all using (is_admin()) with check (is_admin());
create policy "zones read" on delivery_zones for select using (true);
create policy "zones admin" on delivery_zones for all using (is_admin()) with check (is_admin());
create policy "promotions read" on promotions for select using (active);
create policy "promotions admin" on promotions for all using (is_admin()) with check (is_admin());
create policy "coupons read active" on coupons for select using (active or is_admin() or (merchant_id is not null and is_merchant_member(merchant_id)));
create policy "coupons admin" on coupons for all using (is_admin()) with check (is_admin());

-- Perfiles
create policy "profiles self read" on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles self update" on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles counterpart read" on profiles for select using (
  exists (select 1 from orders o where (o.customer_id = profiles.id or o.courier_id = profiles.id)
          and (o.customer_id = auth.uid() or o.courier_id = auth.uid() or (o.merchant_id is not null and is_merchant_member(o.merchant_id))))
);

-- Direcciones
create policy "addresses own" on addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "addresses admin" on addresses for select using (is_admin());

-- Comercios
create policy "merchants public read" on merchants for select using (status = 'active' or is_merchant_member(id) or is_admin() or is_courier());
create policy "merchants member update" on merchants for update using (is_merchant_member(id)) with check (is_merchant_member(id));
create policy "merchants admin" on merchants for all using (is_admin()) with check (is_admin());
create policy "members read" on merchant_members for select using (user_id = auth.uid() or is_merchant_member(merchant_id) or is_admin());
create policy "members admin" on merchant_members for all using (is_admin() or is_merchant_member(merchant_id)) with check (is_admin() or is_merchant_member(merchant_id));
create policy "hours read" on merchant_hours for select using (true);
create policy "hours manage" on merchant_hours for all using (is_merchant_member(merchant_id) or is_admin()) with check (is_merchant_member(merchant_id) or is_admin());
create policy "mdocs manage" on merchant_documents for all using (is_merchant_member(merchant_id) or is_admin()) with check (is_merchant_member(merchant_id) or is_admin());

-- Catálogo
create policy "pcat read" on product_categories for select using (true);
create policy "pcat manage" on product_categories for all using (is_merchant_member(merchant_id) or is_admin()) with check (is_merchant_member(merchant_id) or is_admin());
create policy "products read" on products for select using (status = 'published' or is_merchant_member(merchant_id) or is_admin());
create policy "products manage" on products for all using (is_merchant_member(merchant_id) or is_admin()) with check (is_merchant_member(merchant_id) or is_admin());
create policy "pog read" on product_option_groups for select using (true);
create policy "pog manage" on product_option_groups for all
  using (exists (select 1 from products p where p.id = product_id and (is_merchant_member(p.merchant_id) or is_admin())))
  with check (exists (select 1 from products p where p.id = product_id and (is_merchant_member(p.merchant_id) or is_admin())));
create policy "po read" on product_options for select using (true);
create policy "po manage" on product_options for all
  using (exists (select 1 from product_option_groups g join products p on p.id = g.product_id where g.id = group_id and (is_merchant_member(p.merchant_id) or is_admin())))
  with check (exists (select 1 from product_option_groups g join products p on p.id = g.product_id where g.id = group_id and (is_merchant_member(p.merchant_id) or is_admin())));

create policy "favorites own" on favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "paymethods own" on payment_methods for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Pedidos (creación solo vía RPC place_order / place_shipment)
create policy "orders read" on orders for select using (
  customer_id = auth.uid() or courier_id = auth.uid()
  or (merchant_id is not null and is_merchant_member(merchant_id))
  or is_admin()
  or (courier_id is null and is_courier() and status in ('placed','accepted','preparing','ready'))
);
create policy "orders admin update" on orders for update using (is_admin()) with check (is_admin());
create policy "order_items read" on order_items for select using (exists (select 1 from orders o where o.id = order_id));
create policy "order_events read" on order_events for select using (exists (select 1 from orders o where o.id = order_id));
create policy "order_messages read" on order_messages for select using (
  exists (select 1 from orders o where o.id = order_id and (o.customer_id = auth.uid() or o.courier_id = auth.uid() or is_admin()))
);
create policy "order_messages send" on order_messages for insert with check (
  sender_id = auth.uid() and exists (select 1 from orders o where o.id = order_id and (o.customer_id = auth.uid() or o.courier_id = auth.uid() or is_admin()))
);
create policy "payments read" on payments for select using (
  exists (select 1 from orders o where o.id = order_id and (o.customer_id = auth.uid() or is_admin()))
);
create policy "payments admin" on payments for all using (is_admin()) with check (is_admin());
create policy "ratings insert" on ratings for insert with check (
  customer_id = auth.uid() and exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid() and o.status = 'delivered')
);
create policy "ratings read" on ratings for select using (
  customer_id = auth.uid() or courier_id = auth.uid() or (merchant_id is not null and is_merchant_member(merchant_id)) or is_admin()
);
create policy "redemptions own" on coupon_redemptions for select using (user_id = auth.uid() or is_admin());

-- Repartidores
create policy "couriers self" on couriers for select using (user_id = auth.uid() or is_admin());
create policy "couriers tracking" on couriers for select using (
  exists (select 1 from orders o where o.courier_id = couriers.user_id and o.status in ('assigned','picked_up','on_the_way')
          and (o.customer_id = auth.uid() or (o.merchant_id is not null and is_merchant_member(o.merchant_id))))
);
create policy "couriers self update" on couriers for update using (user_id = auth.uid()) with check (user_id = auth.uid() and status = (select status from couriers c2 where c2.user_id = auth.uid()));
create policy "couriers admin" on couriers for all using (is_admin()) with check (is_admin());
create policy "cdocs own" on courier_documents for all using (courier_id = auth.uid() or is_admin()) with check (courier_id = auth.uid() or is_admin());
create policy "cloc own" on courier_location_history for select using (courier_id = auth.uid() or is_admin());

-- Finanzas
create policy "settlements read" on settlements for select using (
  has_admin_role(array['owner','finance']::admin_role[])
  or (payee_type = 'merchant' and is_merchant_member(payee_id))
  or (payee_type = 'courier' and payee_id = auth.uid())
);
create policy "settlement_orders read" on settlement_orders for select using (exists (select 1 from settlements s where s.id = settlement_id));
create policy "withdrawals read" on courier_withdrawals for select using (courier_id = auth.uid() or has_admin_role(array['owner','finance']::admin_role[]));
create policy "withdrawals admin" on courier_withdrawals for update using (has_admin_role(array['owner','finance']::admin_role[])) with check (true);
create policy "expenses admin" on operating_expenses for all using (has_admin_role(array['owner','finance']::admin_role[])) with check (has_admin_role(array['owner','finance']::admin_role[]));

-- Soporte
create policy "cases read" on support_cases for select using (opened_by = auth.uid() or is_admin());
create policy "cases insert" on support_cases for insert with check (opened_by = auth.uid());
create policy "cases admin" on support_cases for update using (is_admin()) with check (is_admin());
create policy "smsg read" on support_messages for select using (
  exists (select 1 from support_cases c where c.id = case_id and (c.opened_by = auth.uid() or is_admin())) and (not internal or is_admin())
);
create policy "smsg insert" on support_messages for insert with check (
  sender_id = auth.uid() and exists (select 1 from support_cases c where c.id = case_id and (c.opened_by = auth.uid() or is_admin()))
);

-- Administración
create policy "admin_users read" on admin_users for select using (is_admin());
create policy "admin_users owner" on admin_users for all using (is_owner()) with check (is_owner());
create policy "invitations owner" on admin_invitations for select using (is_owner());
create policy "audit read" on audit_log for select using (has_admin_role(array['owner','finance','operations']::admin_role[]));
create policy "settings read" on platform_settings for select using (true);
create policy "settings owner" on platform_settings for all using (is_owner()) with check (is_owner());
create policy "alerts read" on owner_alerts for select using (is_owner());
create policy "alerts update" on owner_alerts for update using (is_owner()) with check (is_owner());

-- Notificaciones y dispositivos
create policy "notifications own" on notifications for select using (user_id = auth.uid());
create policy "notifications own update" on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "device_tokens own" on device_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Realtime
alter publication supabase_realtime add table orders, order_events, order_messages, couriers, notifications, support_messages;
