import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { senha } = await request.json();

    // Validação da senha exigida
    if (senha !== 'devguedes02') {
      return NextResponse.json({ error: 'Senha de administrador incorreta!' }, { status: 401 });
    }

    // A transação apaga tudo na ordem correta para não quebrar as chaves estrangeiras
    await prisma.$transaction([
      prisma.itemVenda.deleteMany(),
      prisma.venda.deleteMany(),
      prisma.caixa.deleteMany(),
      prisma.livro.deleteMany(),
      prisma.cliente.deleteMany(),
      prisma.usuario.deleteMany(),
    ]);

    return NextResponse.json({ message: 'Banco de dados zerado com sucesso.' });
  } catch (error) {
    console.error("Erro no reset:", error);
    return NextResponse.json({ error: 'Erro crítico ao tentar resetar o sistema.' }, { status: 500 });
  }
}