-- 0015 · Home: promociones patrocinadas y precios con descuento (cervezas y licores)
-- 1. promotions.sponsored: las promociones que paga un restaurante para salir en el carrusel "Promociones" del
--    Home (se muestran con la etiqueta "Patrocinado"). El banner del Home (08) y Ofertas (33) siguen mostrando solo
--    las que no son patrocinadas; el filtro lo hace el app.
-- 2. products.compare_at_price: precio antes del descuento. Si está, el app tacha ese precio, resalta el precio
--    actual y muestra el porcentaje de descuento. Nulo = sin descuento.
-- 3. product_categories.is_alcohol: la categoría es de bebidas alcohólicas. El app pide la mayoría de edad al agregar
--    sus productos, muestra la leyenda legal (Ley 124 de 1994) y arma con ellas "Cervezas y licores" del Home. La BD
--    la marca sola cuando el nombre es de licor (is_alcohol_name, la misma lista de palabras que el app) y no se puede
--    desmarcar mientras el nombre lo sea; el admin puede marcar a mano otras (p. ej. "Bebidas" de un bar).
-- El cobro no cambia: place_order sigue cobrando products.price.
-- Ninguna vista depende de products, product_categories ni promotions: el app las consulta directo con select *, así que ve las
-- columnas nuevas sin recrear nada. Las RPC que leen products (place_order, search_catalog) devuelven columnas
-- fijas que no las necesitan. Los permisos son por tabla, así que también cubren las columnas nuevas.
-- Idempotente: add column if not exists, create or replace, y la restricción y el disparador se recrean sin error.

alter table promotions add column if not exists sponsored boolean not null default false;
comment on column promotions.sponsored is
  'Promoción pagada por el comercio: sale en el carrusel "Promociones" del Home con la etiqueta "Patrocinado" y no en el banner ni en Ofertas.';

alter table products add column if not exists compare_at_price integer;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_compare_at_price_check' and conrelid = 'public.products'::regclass) then
    alter table products add constraint products_compare_at_price_check check (compare_at_price is null or compare_at_price > 0);
  end if;
end $$;
comment on column products.compare_at_price is
  'Precio antes del descuento (COP). Nulo = sin descuento. Solo se muestra tachado: el pedido se cobra con price.';

-- 3. Categorías de licor
alter table product_categories add column if not exists is_alcohol boolean not null default false;
comment on column product_categories.is_alcohol is
  'Categoría de bebidas alcohólicas: el app pide confirmar la mayoría de edad al agregar sus productos y muestra la leyenda legal. Se marca sola si el nombre es de licor.';

-- Nombre de licor: palabras completas, sin tildes ni mayúsculas ("Cervezas y licores", "Bebidas alcohólicas",
-- "Whiskies", "Cócteles"…). "Alcohol antiséptico", "Bebidas" o "Vinagre" no cuentan.
create or replace function is_alcohol_name(p_name text) returns boolean
language sql immutable set search_path = public as $$
  select lower(translate(coalesce(p_name, ''),
    'ÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑÇáàäâéèëêíìïîóòöôúùüûñç',
    'AAAAEEEEIIIIOOOOUUUUNCaaaaeeeeiiiioooouuuunc'))
    ~ '\m(cervezas?|cervecerias?|licor(es|eria)?|vinos?|aguardientes?|rones|ron|whiske?y|whiskies|tequilas?|vodkas?|ginebras?|cocteles|coctel|cocteleria|espumantes?|champa(n|gn)(a|e)s?|mezcal(es)?|brandy|cognac|alcoholicas?|alcoholicos?)\M'
$$;

create or replace function product_categories_flag_alcohol() returns trigger
language plpgsql set search_path = public as $$
begin
  if is_alcohol_name(new.name) then
    new.is_alcohol := true;
  end if;
  return new;
end $$;

drop trigger if exists product_categories_flag_alcohol on product_categories;
create trigger product_categories_flag_alcohol before insert or update on product_categories
  for each row execute function product_categories_flag_alcohol();

-- Categorías que ya existían ("Cervezas y licores" de D1, Olímpica, Carulla y Oxxo).
update product_categories set is_alcohol = true where not is_alcohol and is_alcohol_name(name);
