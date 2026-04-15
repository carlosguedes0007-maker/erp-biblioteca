import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { itens, total, valor_pago, metodo_pagamento, cliente_id, gerar_credito } = await request.json();

    const totalVenda = parseFloat(total);
    const valorPago = parseFloat(valor_pago);
    let troco = 0;
    let status = "Pago";
    let variacaoSaldoCliente = 0; // Quanto vamos somar ou subtrair do perfil do cliente

    // Lógica Financeira
    if (valorPago < totalVenda) {
      status = valorPago === 0 ? "Pendente" : "Parcial";
      variacaoSaldoCliente = valorPago - totalVenda; // Gera um valor negativo (Dívida)
    } else if (valorPago > totalVenda) {
      if (gerar_credito) {
        variacaoSaldoCliente = valorPago - totalVenda; // Gera um valor positivo (Crédito)
      } else {
        troco = valorPago - totalVenda; // Devolve o dinheiro, não afeta o saldo do cliente
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Registra a Venda
      const novaVenda = await tx.venda.create({
        data: {
          total_venda: totalVenda,
          valor_pago: valorPago,
          troco: troco,
          status_pagamento: status,
          metodo_pagamento,
          cliente_id: cliente_id || null,
          itens: {
            create: itens.map((item: any) => ({
              livro_id: item.id,
              quantidade: item.quantidade,
              preco_unitario: parseFloat(item.preco.toString())
            }))
          }
        }
      });

      // 2. Dá baixa no Estoque
      for (const item of itens) {
        await tx.livro.update({
          where: { id: item.id },
          data: { quantidade_estoque: { decrement: item.quantidade } }
        });
      }

      // 3. Atualiza o Saldo do Cliente (se houver cliente vinculado)
      if (cliente_id && variacaoSaldoCliente !== 0) {
        await tx.cliente.update({
          where: { id: cliente_id },
          data: { saldo_financeiro: { increment: variacaoSaldoCliente } }
        });
      }

      return novaVenda;
    });

    return NextResponse.json({ message: 'Venda confirmada', venda: result, troco }, { status: 201 });
  } catch (error) {
    console.error("Erro transacional:", error);
    return NextResponse.json({ error: 'Erro ao processar transação financeira' }, { status: 500 });
  }
}