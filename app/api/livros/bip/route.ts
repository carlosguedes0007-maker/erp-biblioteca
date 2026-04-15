import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  // Pega o código de barras da URL (ex: /api/livros/bip?codigo=123456)
  const { searchParams } = new URL(request.url);
  const codigo = searchParams.get('codigo');

  if (!codigo) return NextResponse.json({ error: 'Código não fornecido' }, { status: 400 });

  try {
    const livro = await prisma.livro.findUnique({
      where: { codigo_barras: codigo }
    });

    if (!livro) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    if (livro.quantidade_estoque <= 0) return NextResponse.json({ error: 'Produto sem estoque!' }, { status: 400 });

    return NextResponse.json(livro);
  } catch (error) {
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}