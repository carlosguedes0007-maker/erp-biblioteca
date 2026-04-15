import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// No Next.js moderno, 'params' é uma Promise e DEVE ter o await antes de desestruturar
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        vendas: {
          orderBy: { data_venda: 'desc' },
          include: {
            itens: {
              include: {
                livro: true 
              }
            }
          }
        }
      }
    });

    if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });

    return NextResponse.json(cliente);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar perfil do cliente' }, { status: 500 });
  }
}