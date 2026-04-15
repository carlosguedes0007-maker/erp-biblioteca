import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ROTA PUT: Atualiza um livro existente
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();

    const livroAtualizado = await prisma.livro.update({
      where: { id },
      data: {
        titulo: data.titulo,
        autor: data.autor,
        categoria_genero: data.categoria_genero,
        preco: parseFloat(data.preco.toString().replace(',', '.')),
        quantidade_estoque: parseInt(data.quantidade_estoque),
        codigo_barras: data.codigo_barras,
      }
    });

    return NextResponse.json(livroAtualizado);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar o livro' }, { status: 500 });
  }
}

// ROTA DELETE: Exclui um livro
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    await prisma.livro.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Livro excluído com sucesso' });
  } catch (error: any) {
    // Tratamento importante: se o livro já foi vendido, o banco impede a exclusão para não quebrar o histórico financeiro
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Este livro não pode ser excluído pois já possui registro de vendas no sistema.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao excluir o livro' }, { status: 500 });
  }
}