-- 0014 · Búsqueda con orden estable
-- search_catalog no tenía ORDER BY: las filas salían en el orden físico de la tabla (al editar un producto, su
-- fila pasaba al final) y el "limit 60" cortaba al azar. Ahora el orden es fijo:
--   1. comercios: destacados, mejor calificados, por nombre;
--   2. productos: del comercio destacado y mejor calificado primero y, dentro de cada comercio, en el orden del
--      menú (categoría y producto) y por nombre. Con "ceviche" da Ceviche clásico, de camarón y mixto (pantalla 10).
-- Misma firma, mismas columnas y mismos permisos que en 0005_functions.sql.
create or replace function public.search_catalog(p_q text, p_city uuid default null)
returns table (kind text, id uuid, merchant_id uuid, name text, subtitle text, image_url text, price integer, rating numeric)
language sql stable security definer set search_path = public as $$
  select r.kind, r.id, r.merchant_id, r.name, r.subtitle, r.image_url, r.price, r.rating
  from (
    select 'merchant'::text as kind, m.id, m.id as merchant_id, m.name, m.tagline as subtitle, m.logo_url as image_url,
           null::int as price, m.rating_avg as rating,
           0 as grupo, m.featured as destacado, m.name as comercio, 0 as cat_sort, 0 as prod_sort
    from merchants m where m.status = 'active' and (p_city is null or m.city_id = p_city)
      and (m.name ilike '%'||p_q||'%' or m.tagline ilike '%'||p_q||'%' or exists (select 1 from unnest(m.tags) t where t ilike '%'||p_q||'%'))
    union all
    select 'product', p.id, p.merchant_id, p.name, m.name, p.image_urls[1], p.price, m.rating_avg,
           1, m.featured, m.name, coalesce(c.sort, 2147483647), p.sort
    from products p join merchants m on m.id = p.merchant_id
    left join product_categories c on c.id = p.category_id
    where p.status = 'published' and m.status = 'active' and (p_city is null or m.city_id = p_city)
      and (p.name ilike '%'||p_q||'%' or p.description ilike '%'||p_q||'%')
  ) r
  order by r.grupo, r.destacado desc, r.rating desc nulls last, r.comercio, r.merchant_id, r.cat_sort, r.prod_sort, r.name, r.id
  limit 60
$$;
