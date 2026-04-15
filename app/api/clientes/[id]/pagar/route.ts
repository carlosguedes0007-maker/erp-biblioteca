import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { valor } = await request.json();
    
    const valorPago = parseFloat(valor);

    // Incrementa o saldo do cliente (Se ele devia -50 e pagou 50, o saldo vai para 0)
    const clienteAtualizado = await prisma.cliente.update({
      where: { id },
      data: { saldo_financeiro: { increment: valorPago } }
    });

    return NextResponse.json({ message: 'Pagamento registrado com sucesso', saldo: clienteAtualizado.saldo_financeiro });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao processar o pagamento do cliente' }, { status: 500 });
  }
}