import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Rota GET: Busca todos os livros cadastrados
export async function GET() {
  try {
    const livros = await prisma.livro.findMany({
      orderBy: { titulo: 'asc' }
    });
    return NextResponse.json(livros);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar livros' }, { status: 500 });
  }
}

// Rota POST: Cadastra um novo livro
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validação básica para evitar duplicidade de código de barras
    const livroExistente = await prisma.livro.findUnique({
      where: { codigo_barras: data.codigo_barras }
    });

    if (livroExistente) {
      return NextResponse.json({ error: 'Código de barras já cadastrado' }, { status: 400 });
    }

    const novoLivro = await prisma.livro.create({
      data: {
        titulo: data.titulo,
        autor: data.autor,
        categoria_genero: data.categoria_genero,
        preco: parseFloat(data.preco.replace(',', '.')), // Garante formato decimal
        quantidade_estoque: parseInt(data.quantidade_estoque),
        codigo_barras: data.codigo_barras,
      }
    });

    return NextResponse.json(novoLivro, { status: 201 });
  } catch (error) {
    console.error("Erro no cadastro:", error);
    return NextResponse.json({ error: 'Erro ao cadastrar livro' }, { status: 500 });
  }
}