'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Plus, Barcode, Printer, Trash2, Edit, X } from 'lucide-react';

interface Livro {
  id: string;
  titulo: string;
  autor: string;
  categoria_genero: string;
  preco: string | number;
  quantidade_estoque: number;
  codigo_barras: string;
}

export default function Estoque() {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para controlar se estamos editando um livro existente
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [form, setForm] = useState({
    titulo: '',
    autor: '',
    categoria_genero: '',
    preco: '',
    quantidade_estoque: '',
    codigo_barras: ''
  });

  useEffect(() => {
    carregarLivros();
  }, []);

  const carregarLivros = async () => {
    try {
      const response = await axios.get('/api/livros');
      setLivros(response.data);
    } catch (error) {
      console.error('Erro ao buscar livros', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const gerarCodigoInterno = () => {
    const codigoAleatorio = Math.floor(10000000 + Math.random() * 90000000).toString();
    setForm({ ...form, codigo_barras: codigoAleatorio });
  };

  const imprimirEtiqueta = () => {
    if (!form.codigo_barras) return alert('Gere ou digite um código de barras primeiro.');
    const janelaImpressao = window.open('', '', 'width=600,height=400');
    if (janelaImpressao) {
      janelaImpressao.document.write(`
        <html>
          <head>
            <title>Etiqueta</title>
            <style>
              body { font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .etiqueta { border: 2px dashed #333; padding: 20px; text-align: center; width: 300px; }
              .titulo { font-size: 14px; font-weight: bold; margin-bottom: 10px; }
              .codigo { font-size: 24px; letter-spacing: 2px; font-family: monospace; }
            </style>
          </head>
          <body>
            <div class="etiqueta">
              <div class="titulo">${form.titulo || 'Produto Sem Título'}</div>
              <div>-------------------------</div>
              <div class="codigo">*${form.codigo_barras}*</div>
              <div>-------------------------</div>
              <div style="font-size: 12px; margin-top: 5px;">R$ ${form.preco || '0,00'}</div>
            </div>
            <script>window.onload = () => { window.print(); window.close(); }</script>
          </body>
        </html>
      `);
      janelaImpressao.document.close();
    }
  };

  // Prepara o formulário para edição
  const handleEdit = (livro: Livro) => {
    setEditandoId(livro.id);
    setForm({
      titulo: livro.titulo,
      autor: livro.autor,
      categoria_genero: livro.categoria_genero,
      preco: livro.preco.toString(),
      quantidade_estoque: livro.quantidade_estoque.toString(),
      codigo_barras: livro.codigo_barras
    });
    // Rola a tela para o topo para o usuário ver o form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancela o modo de edição
  const cancelarEdicao = () => {
    setEditandoId(null);
    setForm({ titulo: '', autor: '', categoria_genero: '', preco: '', quantidade_estoque: '', codigo_barras: '' });
  };

  // Exclui um livro com confirmação
  const handleDelete = async (id: string, titulo: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o livro "${titulo}"?`)) {
      try {
        await axios.delete(`/api/livros/${id}`);
        alert('Livro excluído com sucesso!');
        carregarLivros();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Erro ao excluir.');
      }
    }
  };

  // Salva (Cria novo) ou Atualiza (Edita) no Banco
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editandoId) {
        // Modo Edição
        await axios.put(`/api/livros/${editandoId}`, form);
        alert('Livro atualizado com sucesso!');
      } else {
        // Modo Criação
        await axios.post('/api/livros', form);
        alert('Livro cadastrado com sucesso!');
      }
      cancelarEdicao(); // Limpa o formulário e tira do modo edição
      carregarLivros(); // Atualiza a tabela
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
        <Package className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Estoque</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulário de Cadastro / Edição */}
        <div className={`lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border h-fit transition-colors ${editandoId ? 'border-yellow-400 bg-yellow-50/30' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              {editandoId ? <Edit className="w-5 h-5 text-yellow-600" /> : <Plus className="w-5 h-5 text-gray-500" />}
              {editandoId ? 'Editando Livro' : 'Novo Livro'}
            </h3>
            {editandoId && (
              <button onClick={cancelarEdicao} className="text-gray-400 hover:text-red-500 transition-colors" title="Cancelar edição">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título do Livro</label>
              <input required type="text" name="titulo" value={form.titulo} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
              <input required type="text" name="autor" value={form.autor} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <input required type="text" name="categoria_genero" value={form.categoria_genero} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                <input required type="text" name="preco" value={form.preco} onChange={handleChange} placeholder="00.00" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade em Estoque</label>
              <input required type="number" name="quantidade_estoque" value={form.quantidade_estoque} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras / ISBN</label>
              <div className="flex gap-2 mb-3">
                <input required type="text" name="codigo_barras" value={form.codigo_barras} onChange={handleChange} className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 font-mono" />
              </div>
              
              <div className="flex gap-2">
                <button type="button" onClick={gerarCodigoInterno} className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-700 text-sm font-medium py-2 rounded-md transition-colors border border-gray-300">
                  <Barcode className="w-4 h-4" /> Gerar Interno
                </button>
                <button type="button" onClick={imprimirEtiqueta} className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-700 text-sm font-medium py-2 rounded-md transition-colors border border-gray-300">
                  <Printer className="w-4 h-4" /> Etiqueta
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className={`w-full mt-6 text-white font-medium py-3 rounded-md transition-colors shadow-sm disabled:opacity-70 ${editandoId ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {loading ? 'Salvando...' : editandoId ? 'Atualizar Livro' : 'Cadastrar Livro'}
            </button>
          </form>
        </div>

        {/* Tabela de Produtos */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Acervo Cadastrado</h3>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{livros.length} itens</span>
          </div>
          
          <div className="flex-grow overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-gray-600 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-6 py-4 font-semibold">Título</th>
                  <th className="px-6 py-4 font-semibold">Preço</th>
                  <th className="px-6 py-4 font-semibold text-center">Estoque</th>
                  <th className="px-6 py-4 font-semibold">Cód. Barras</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {livros.length > 0 ? (
                  livros.map((livro) => (
                    <tr key={livro.id} className={`transition-colors ${editandoId === livro.id ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 font-medium text-gray-900">{livro.titulo}</td>
                      <td className="px-6 py-4 text-gray-600">R$ {Number(livro.preco).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold ${livro.quantidade_estoque <= 2 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {livro.quantidade_estoque}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">{livro.codigo_barras}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleEdit(livro)} className="text-blue-500 hover:text-blue-700 p-2 rounded hover:bg-blue-50 transition-colors mx-1" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(livro.id, livro.titulo)} className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors mx-1" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                      Nenhum livro cadastrado. Adicione o primeiro no formulário ao lado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}