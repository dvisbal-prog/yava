function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}. Revisa apps/admin/.env.example.`);
  }
  return value;
}

export const env = {
  get supabaseUrl(): string {
    return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseAnonKey(): string {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  },
  get siteUrl(): string | undefined {
    return process.env.NEXT_PUBLIC_SITE_URL;
  },
};
