-- YAVA · Buckets de almacenamiento
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 10485760, array['image/jpeg','image/png','image/webp','image/heic']),
  ('merchant-media', 'merchant-media', true, 10485760, array['image/jpeg','image/png','image/webp']),
  ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('documents', 'documents', false, 10485760, array['image/jpeg','image/png','application/pdf','image/heic'])
on conflict (id) do nothing;

create policy "public read images" on storage.objects for select using (bucket_id in ('product-images','merchant-media','avatars'));
create policy "merchant upload product images" on storage.objects for insert to authenticated
  with check (bucket_id in ('product-images','merchant-media') and is_merchant_member((storage.foldername(name))[1]::uuid));
create policy "merchant manage product images" on storage.objects for update to authenticated
  using (bucket_id in ('product-images','merchant-media') and is_merchant_member((storage.foldername(name))[1]::uuid));
create policy "merchant delete product images" on storage.objects for delete to authenticated
  using (bucket_id in ('product-images','merchant-media') and is_merchant_member((storage.foldername(name))[1]::uuid));
create policy "avatar own" on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "documents own" on storage.objects for all to authenticated
  using (bucket_id = 'documents' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin() or is_merchant_member((storage.foldername(name))[1]::uuid)))
  with check (bucket_id = 'documents' and ((storage.foldername(name))[1] = auth.uid()::text or is_merchant_member((storage.foldername(name))[1]::uuid)));
