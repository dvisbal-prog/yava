import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El panel es 100 % dinámico (sesión + RLS): se renderiza por petición.
  // Se desactiva cacheComponents para no exigir límites <Suspense> en cada lectura de cookies/searchParams.
  cacheComponents: false,
  transpilePackages: ["@yava/shared"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
