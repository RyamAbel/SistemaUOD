import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "SistemaUOD • SIIA - Sistema Inteligente de Inventario",
  description: "Plataforma institucional de inventario y control de activos con IA integrada.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ backgroundColor: 'var(--bg)', color: 'var(--text-1)' }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
