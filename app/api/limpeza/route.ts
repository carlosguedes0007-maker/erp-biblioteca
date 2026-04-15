import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { senha } = await request.json();
    if (senha !== 'devguedes02') return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });

    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

    const umAnoAtras = new Date();
    umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);

    // 1. FAXINA DE CLIENTES
    const clientes = await prisma.cliente.findMany({
      include: { vendas: { orderBy: { data_venda: 'desc' }, take: 1 } }
    });
    
    let clientesExcluidos = 0;

    for (const cliente of clientes) {
      // Pega a data da última compra ou a data que ele foi cadastrado
      const ultimaAtividade = cliente.vendas.length > 0 ? cliente.vendas[0].data_venda : cliente.data_cadastro;
      const saldo = Number(cliente.saldo_financeiro);

      // Regra 1: Sem dívida (saldo >= 0) E não compra há 6 meses
      if (saldo >= 0 && ultimaAtividade < seisMesesAtras) {
        await prisma.cliente.delete({ where: { id: cliente.id } });
        clientesExcluidos++;
      } 
      // Regra 2: Com dívida (saldo < 0) E não compra há 1 ano
      else if (saldo < 0 && ultimaAtividade < umAnoAtras) {
        await prisma.cliente.delete({ where: { id: cliente.id } });
        clientesExcluidos++;
      }
    }

    // 2. FAXINA DE LIVROS (Estoque 0 e não foi atualizado há 6 meses)
    const livrosParaExcluir = await prisma.livro.findMany({
      where: { 
        quantidade_estoque: 0, 
        updatedAt: { lt: seisMesesAtras } 
      }
    });

    for (const livro of livrosParaExcluir) {
      await prisma.livro.delete({ where: { id: livro.id } });
    }

    return NextResponse.json({ message: `Faxina Concluída! ${clientesExcluidos} clientes ociosos e ${livrosParaExcluir.length} livros esgotados foram apagados.` });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao executar a limpeza.' }, { status: 500 });
  }
}