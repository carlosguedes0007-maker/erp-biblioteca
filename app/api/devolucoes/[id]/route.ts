import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { tipo } = await request.json(); // "credito" ou "dinheiro"

    const item = await prisma.itemVenda.findUnique({
      where: { id },
      include: { venda: true }
    });

    if (!item) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // 1. Devolve pro estoque (Sempre acontece)
      await tx.livro.update({
        where: { id: item.livro_id },
        data: { quantidade_estoque: { increment: item.quantidade } }
      });

      const valorDevolvido = Number(item.preco_unitario) * item.quantidade;

      // 2. Lógica de Reembolso
      if (tipo === 'credito' && item.venda.cliente_id) {
        // Só mexe no saldo se o usuário escolheu CRÉDITO
        await tx.cliente.update({
          where: { id: item.venda.cliente_id },
          data: { saldo_financeiro: { increment: valorDevolvido } }
        });
      }

      // 3. Ajusta o total da venda original e remove o item
      await tx.venda.update({
        where: { id: item.venda_id },
        data: { total_venda: { decrement: valorDevolvido } }
      });

      await tx.itemVenda.delete({ where: { id } });
    });

    return NextResponse.json({ message: 'Devolução processada com sucesso!' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao processar devolução' }, { status: 500 });
  }
}