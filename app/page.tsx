import { PrismaClient } from '@prisma/client';
import BotaoReset from './components/BotaoReset';
import BotaoLimpeza from './components/BotaoLimpeza';

// ISSO DESLIGA A "FOTO VELHA" E FORÇA O DADO AO VIVO NA VERCEL
export const dynamic = 'force-dynamic'; 

const prisma = new PrismaClient();

export default async function Dashboard() {
  // 1. Busca total de clientes
  const totalClientes = await prisma.cliente.count();
  
  // 2. Busca livros com estoque <= 2
  const livrosEstoqueBaixo = await prisma.livro.findMany({
    where: { quantidade_estoque: { lte: 2 } },
    select: { id: true, titulo: true, quantidade_estoque: true, codigo_barras: true }
  });

  // 3. Calcula faturamento do dia atual
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vendasHoje = await prisma.venda.aggregate({
    _sum: { total_venda: true },
    where: { data_venda: { gte: hoje } }
  });
  const faturamentoDia = vendasHoje._sum.total_venda || 0;

  // 4. Calcula o total geral de livros vendidos (soma das quantidades)
  const itensVendidos = await prisma.itemVenda.aggregate({
    _sum: { quantidade: true }
  });
  const totalLivrosVendidos = itensVendidos._sum.quantidade || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-teal-500">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Faturamento do Dia</h3>
          <p className="text-3xl font-extrabold text-gray-900">
            R$ {Number(faturamentoDia).toFixed(2).replace('.', ',')}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-blue-500">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Livros Vendidos</h3>
          <p className="text-3xl font-extrabold text-gray-900">{totalLivrosVendidos}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-purple-500">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Total de Clientes</h3>
          <p className="text-3xl font-extrabold text-gray-900">{totalClientes}</p>
        </div>
      </div>

      {/* Tabela de Alerta de Estoque */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
        <div className="bg-red-50 px-6 py-4 border-b border-red-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
            ⚠️ Alerta de Estoque Crítico
          </h3>
          <span className="text-sm text-red-600 font-medium">Itens com 2 unidades ou menos</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-gray-600 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Título do Livro</th>
                <th className="px-6 py-4 font-semibold">Código de Barras</th>
                <th className="px-6 py-4 font-semibold text-center">Estoque Atual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {livrosEstoqueBaixo.length > 0 ? (
                livrosEstoqueBaixo.map((livro) => (
                  <tr key={livro.id} className="hover:bg-red-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{livro.titulo}</td>
                    <td className="px-6 py-4 text-gray-500">{livro.codigo_barras}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700">
                        {livro.quantidade_estoque}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500 font-medium">
                    Nenhum livro com estoque crítico no momento. Tudo certo! 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>      
      <div className="flex flex-col gap-2">
        <BotaoLimpeza />
        <BotaoReset />
      </div>
    </div>
  );
}