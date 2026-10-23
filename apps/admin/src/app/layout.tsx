import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "YAVA · Administración", template: "%s · YAVA Administración" },
  description: "Panel administrativo de YAVA: pedidos, comercios, repartidores, finanzas y soporte.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
