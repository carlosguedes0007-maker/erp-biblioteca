import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ERP Biblioteca e Vendas",
  description: "Sistema de Gestão - Sociedade Espírita Beneficente Miguel Vieira de Novaes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800 antialiased">
        {/* Cabeçalho Fixo */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              Sociedade Espírita Beneficente Miguel Vieira de Novaes
            </h1>
            <nav className="flex gap-6 text-sm font-medium text-gray-600">
              <Link href="/" className="hover:text-blue-600 transition-colors">Dashboard</Link>
              <Link href="/pdv" className="hover:text-blue-600 transition-colors">PDV</Link>
              <Link href="/estoque" className="hover:text-blue-600 transition-colors">Estoque</Link>
              <Link href="/clientes" className="hover:text-blue-600 transition-colors">Clientes</Link>
            </nav>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
          {children}
        </main>

        {/* Rodapé Fixo */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-center">
            <p className="text-sm text-gray-500 font-medium">
              Desenvolvido por @devguedes02
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}