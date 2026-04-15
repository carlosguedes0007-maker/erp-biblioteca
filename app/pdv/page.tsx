'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ScanBarcode, CreditCard, Banknote, QrCode, Users, Trash2, Search, X, PackageSearch } from 'lucide-react';

interface ProdutoCarrinho { id: string; titulo: string; preco: number; quantidade: number; quantidade_estoque: number; }
interface Cliente { id: string; nome_completo: string; }

export default function PDV() {
  const [carrinho, setCarrinho] = useState<ProdutoCarrinho[]>([]);
  const [codigoBipado, setCodigoBipado] = useState('');
  const [carregando, setCarregando] = useState(false);
  
  // Busca de Clientes
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [mostrarBusca, setMostrarBusca] = useState(false);

  // Busca de Produtos Manual
  const [estoque, setEstoque] = useState<ProdutoCarrinho[]>([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [mostrarBuscaProduto, setMostrarBuscaProduto] = useState(false);

  const [valorRecebido, setValorRecebido] = useState<string>('');
  const [gerarCredito, setGerarCredito] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    axios.get('/api/clientes').then(res => setClientes(res.data));
    axios.get('/api/livros').then(res => setEstoque(res.data));
  }, []);

  // BUG FIX: Desmarca a opção de crédito se o usuário fechar a seleção de cliente
  useEffect(() => {
    if (!clienteSelecionado) setGerarCredito(false);
  }, [clienteSelecionado]);

  useEffect(() => { 
    if (!mostrarBusca && !mostrarBuscaProduto) inputRef.current?.focus(); 
  }, [carrinho, carregando, mostrarBusca, mostrarBuscaProduto]);

  const subtotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
  const valorPagoNum = parseFloat(valorRecebido.replace(',', '.') || '0');
  const diferenca = valorPagoNum - subtotal;

  const clientesFiltrados = clientes.filter(c => c.nome_completo.toLowerCase().includes(buscaCliente.toLowerCase()));
  const produtosFiltrados = estoque.filter(p => p.titulo.toLowerCase().includes(buscaProduto.toLowerCase()) && p.quantidade_estoque > 0);

  // Função universal para adicionar ao carrinho (usada pelo bip ou pelo clique na busca manual)
  const processarAdicao = (livro: ProdutoCarrinho) => {
    setCarrinho(prev => {
      const existe = prev.find(i => i.id === livro.id);
      if (existe) {
        if (existe.quantidade + 1 > livro.quantidade_estoque) { alert(`Estoque físico insuficiente (${livro.quantidade_estoque} un)`); return prev; }
        return prev.map(i => i.id === livro.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      if (livro.quantidade_estoque < 1) { alert('Produto esgotado!'); return prev; }
      return [...prev, { ...livro, quantidade: 1, quantidade_estoque: livro.quantidade_estoque }];
    });
  };

  const handleBip = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && codigoBipado.trim() !== '') {
      e.preventDefault();
      setCarregando(true);
      try {
        const { data: livro } = await axios.get(`/api/livros/bip?codigo=${codigoBipado}`);
        if (livro) processarAdicao(livro);
      } catch (e) { alert('Não encontrado!'); } 
      finally { setCodigoBipado(''); setCarregando(false); }
    }
  };

  const finalizarVenda = async (metodo: string) => {
    if (carrinho.length === 0) return alert('Carrinho vazio!');
    if (valorPagoNum < subtotal && !clienteSelecionado) return alert('Selecione um cliente para fiado!');
    
    // BUG FIX DA TRAVA FINAL: Impossível finalizar deixando crédito sem cliente vinculado
    if (diferenca > 0 && gerarCredito && !clienteSelecionado) return alert('Para gerar crédito, é obrigatório selecionar um cliente.');

    setCarregando(true);
    try {
      await axios.post('/api/vendas', {
        itens: carrinho, total: subtotal, valor_pago: valorPagoNum, metodo_pagamento: metodo, cliente_id: clienteSelecionado?.id || null, gerar_credito: gerarCredito
      });
      alert('Venda finalizada!');
      setCarrinho([]); setClienteSelecionado(null); setValorRecebido(''); setBuscaCliente(''); setGerarCredito(false);
      // Atualiza o estoque local após a venda para a busca manual refletir a nova qtd
      axios.get('/api/livros').then(res => setEstoque(res.data));
    } catch (e) { alert('Erro na venda.'); }
    finally { setCarregando(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3"><ScanBarcode className="w-8 h-8 text-blue-600" /><h2 className="text-2xl font-bold">Caixa</h2></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
          <div className="p-6 bg-gray-50 border-b flex gap-4">
            <div className="flex-grow">
              <label className="text-xs font-bold text-gray-500 mb-1 block">Bipe o Código (Foco Automático)</label>
              <input ref={inputRef} type="text" value={codigoBipado} onChange={(e) => setCodigoBipado(e.target.value)} onKeyDown={handleBip} className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg text-lg font-mono focus:border-blue-500 outline-none" placeholder="12345678" />
            </div>
            
            {/* BUSCA MANUAL DE PRODUTO */}
            <div className="flex-grow relative">
               <label className="text-xs font-bold text-gray-500 mb-1 block">Ou busque pelo nome</label>
               <div className="relative">
                 <PackageSearch className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                 <input 
                   type="text" 
                   value={buscaProduto}
                   onChange={e => {setBuscaProduto(e.target.value); setMostrarBuscaProduto(true);}}
                   onFocus={() => setMostrarBuscaProduto(true)}
                   className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg outline-none text-sm" 
                   placeholder="Ex: Livro dos Espíritos" 
                 />
                 {mostrarBuscaProduto && buscaProduto && (
                   <div className="absolute z-50 w-full bg-white border mt-1 rounded-lg shadow-xl max-h-60 overflow-auto">
                      {produtosFiltrados.map(p => (
                        <button 
                          key={p.id} 
                          onClick={() => { processarAdicao(p); setMostrarBuscaProduto(false); setBuscaProduto(''); }} 
                          className="w-full text-left p-3 hover:bg-blue-50 border-b text-sm transition-colors flex justify-between"
                        >
                          <span className="font-bold">{p.titulo}</span>
                          <span className="text-gray-500 text-xs">R$ {Number(p.preco).toFixed(2)} | Estq: {p.quantidade_estoque}</span>
                        </button>
                      ))}
                      {produtosFiltrados.length === 0 && <div className="p-3 text-sm text-gray-400 text-center">Nenhum produto em estoque encontrado.</div>}
                   </div>
                 )}
               </div>
            </div>
          </div>
          
          <div className="flex-grow overflow-auto p-6">
            <table className="w-full">
              <thead><tr className="text-gray-500 text-sm border-b"><th className="pb-3 text-left">Produto</th><th className="pb-3 text-center">Qtd</th><th className="pb-3 text-right">Total</th><th className="pb-3"></th></tr></thead>
              <tbody>
                {carrinho.map(item => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 font-medium">{item.titulo}</td>
                    <td className="py-4 text-center">{item.quantidade}</td>
                    <td className="py-4 text-right font-bold">R$ {(item.preco * item.quantidade).toFixed(2)}</td>
                    <td className="text-center"><button onClick={() => setCarrinho(c => c.filter(i => i.id !== item.id))} className="text-red-400 hover:text-red-600"><Trash2 className="w-5 h-5"/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="relative">
            <label className="block text-sm font-bold text-gray-700 mb-2">Vincular Cliente</label>
            {clienteSelecionado ? (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 font-bold"><Users className="w-4 h-4"/>{clienteSelecionado.nome_completo}</div>
                <button onClick={() => setClienteSelecionado(null)}><X className="w-4 h-4 text-blue-400 hover:text-blue-600"/></button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input type="text" className="w-full pl-10 pr-4 py-2 border rounded-lg focus:border-blue-500 outline-none text-sm" placeholder="Pesquisar cliente..." value={buscaCliente} onChange={(e) => {setBuscaCliente(e.target.value); setMostrarBusca(true);}} onFocus={() => setMostrarBusca(true)}/>
                {mostrarBusca && buscaCliente && (
                  <div className="absolute z-50 w-full bg-white border mt-1 rounded-lg shadow-xl max-h-40 overflow-auto">
                    {clientesFiltrados.map(c => (<button key={c.id} onClick={() => {setClienteSelecionado(c); setMostrarBusca(false); setBuscaCliente('');}} className="w-full text-left p-3 hover:bg-blue-50 border-b text-sm transition-colors">{c.nome_completo}</button>))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border">
            <span className="text-xs font-bold text-gray-500 uppercase">Total</span>
            <span className="block text-3xl font-black text-gray-900 mb-4">R$ {subtotal.toFixed(2)}</span>
            
            <label className="block text-sm font-bold mb-1">Recebido (R$)</label>
            <input type="number" value={valorRecebido} onChange={(e) => setValorRecebido(e.target.value)} className="w-full p-3 border rounded-lg text-lg font-bold text-blue-600 outline-none" />
            
            {valorRecebido && (
              <div className="mt-2 text-sm">
                {diferenca < 0 ? <span className="text-red-600 font-bold">Faltam: R$ {Math.abs(diferenca).toFixed(2)}</span> : (
                  <div className="flex flex-col gap-1">
                    <span className="text-green-600 font-bold">Troco: R$ {diferenca.toFixed(2)}</span>
                    {/* BUG FIX NA UI: Bloqueia a checkbox se não tiver cliente */}
                    <label className={`flex items-center gap-2 bg-white p-2 border rounded mt-1 transition-opacity ${!clienteSelecionado ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} title={!clienteSelecionado ? 'Selecione um cliente acima' : ''}>
                      <input 
                        type="checkbox" 
                        checked={gerarCredito} 
                        disabled={!clienteSelecionado}
                        onChange={e => {
                          if (!clienteSelecionado) return alert("Você DEVE selecionar o cliente na caixa acima antes de tentar adicionar crédito para ele.");
                          setGerarCredito(e.target.checked);
                        }} 
                      />
                      <span className="text-xs font-bold text-gray-700">Transformar em CRÉDITO na Loja</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button onClick={() => finalizarVenda('Pix')} className="bg-[#00bdae] hover:bg-[#00a396] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"><QrCode className="w-4 h-4"/> Pix</button>
            <button onClick={() => finalizarVenda('Cartão')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"><CreditCard className="w-4 h-4"/> Cartão</button>
            <button onClick={() => finalizarVenda('Dinheiro')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"><Banknote className="w-4 h-4"/> Dinheiro</button>
          </div>
        </div>
      </div>
    </div>
  );
}