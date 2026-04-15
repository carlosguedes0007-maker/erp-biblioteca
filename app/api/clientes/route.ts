import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { nome_completo: 'asc' }
    });
    return NextResponse.json(clientes);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.nome_completo) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const novoCliente = await prisma.cliente.create({
      data: {
        nome_completo: data.nome_completo,
        telefone: data.telefone || null,
      }
    });

    return NextResponse.json(novoCliente, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao cadastrar cliente' }, { status: 500 });
  }
}