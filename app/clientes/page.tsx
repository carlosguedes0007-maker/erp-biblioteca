'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Printer, 
  Wallet, 
  ChevronRight, 
  Calendar, 
  RotateCcw, 
  DollarSign, 
  Search 
} from 'lucide-react';

interface Cliente { 
  id: string; 
  nome_completo: string; 
  saldo_financeiro: number; 
  data_cadastro: string; 
}

interface PerfilCliente extends Cliente {
  vendas: { 
    id: string; 
    data_venda: string; 
    total_venda: number; 
    valor_pago: number;
    status_pagamento: string; 
    metodo_pagamento: string; 
    itens: { 
      id: string; 
      quantidade: number; 
      preco_unitario: number;
      livro: { 
        titulo: string; 
      } | null; // Proteção: o livro pode ser nulo se foi apagado na faxina
    }[]; 
  }[];
}

export default function GestaoClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [perfilAtivo, setPerfilAtivo] = useState<PerfilCliente | null>(null);
  
  const [busca, setBusca] = useState('');
  const [mesFiltro, setMesFiltro] = useState('');
  
  const [form, setForm] = useState({ 
    nome_completo: '', 
    telefone: '' 
  });

  useEffect(() => { 
    carregarClientes(); 
  }, []);

  const carregarClientes = async () => { 
    try {
      const { data } = await axios.get('/api/clientes'); 
      setClientes(data); 
    } catch (error) {
      console.error("Erro ao carregar clientes", error);
    }
  };

  const abrirPerfil = async (id: string) => {
    try {
      const { data } = await axios.get(`/api/clientes/${id}`);
      setPerfilAtivo(data);
    } catch (error) {
      alert("Erro ao abrir o perfil do cliente.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/clientes', form);
      setForm({ nome_completo: '', telefone: '' });
      carregarClientes();
    } catch (error) {
      alert("Erro ao cadastrar novo cliente.");
    }
  };

  const handleDevolucao = async (itemId: string, titulo: string) => {
    const opcao = window.prompt(
      `DEVOLUÇÃO: "${titulo}"\n\n` +
      `Como deseja processar o reembolso?\n\n` +
      `Digite 1 para CRÉDITO NO SALDO (O cliente fica com crédito na loja)\n` +
      `Digite 2 para DINHEIRO (Você vai tirar do caixa e entregar na mão dele agora)`
    );
    
    if (opcao !== '1' && opcao !== '2') {
      return alert('Operação cancelada. Digite 1 ou 2.');
    }

    const tipo = opcao === '1' ? 'credito' : 'dinheiro';

    try {
      await axios.post(`/api/devolucoes/${itemId}`, { tipo });
      alert(`Devolução concluída via ${tipo.toUpperCase()}! O estoque foi atualizado.`);
      
      if (perfilAtivo) {
        abrirPerfil(perfilAtivo.id);
      }
      carregarClientes();
    } catch (error) { 
      alert('Erro ao processar a devolução no banco de dados.'); 
    }
  };

  const handlePagar = async () => {
    if (!perfilAtivo) return;

    const valorStr = window.prompt(
      `O saldo atual de ${perfilAtivo.nome_completo} é R$ ${Number(perfilAtivo.saldo_financeiro).toFixed(2)}\n\n` +
      `Quanto o cliente está pagando/adicionando agora?\n(Use ponto para centavos. Ex: 50.00)`
    );
    
    if (!valorStr) return;

    const valorNum = parseFloat(valorStr.replace(',', '.'));
    
    if (isNaN(valorNum) || valorNum <= 0) {
      return alert('Valor inválido. Digite um número maior que zero.');
    }

    try {
      await axios.post(`/api/clientes/${perfilAtivo.id}/pagar`, { valor: valorNum });
      alert(`Pagamento de R$ ${valorNum.toFixed(2)} registrado com sucesso!`);
      
      abrirPerfil(perfilAtivo.id); 
      carregarClientes();
    } catch (error) {
      alert('Erro ao registrar o pagamento.');
    }
  };

  // Filtragem de Histórico
  const historicoFiltrado: any[] = [];
  
  if (perfilAtivo) {
    perfilAtivo.vendas.forEach(venda => {
      const dataVenda = new Date(venda.data_venda);
      const mesAnoVenda = `${dataVenda.getFullYear()}-${String(dataVenda.getMonth() + 1).padStart(2, '0')}`;
      
      if (mesFiltro && mesFiltro !== mesAnoVenda) return;
      
      venda.itens.forEach(item => {
        historicoFiltrado.push({
          itemId: item.id,
          data: dataVenda.toLocaleDateString('pt-BR'),
          // A PROTEÇÃO DA FAXINA ENTRA AQUI:
          titulo: item.livro ? item.livro.titulo : '[Produto Removido do Sistema]',
          quantidade: item.quantidade,
          status: venda.status_pagamento,
          metodo_pagamento: venda.metodo_pagamento,
          valorFaltante: Number(venda.total_venda) - Number(venda.valor_pago)
        });
      });
    });
  }

  const filtrados = clientes.filter(c => 
    c.nome_completo.toLowerCase().includes(busca.toLowerCase())
  );

  const imprimirRelatorio = () => { 
    if (!perfilAtivo) return;
    
    const periodoLabel = mesFiltro 
      ? `Período: ${mesFiltro.split('-').reverse().join('/')}` 
      : 'Todo o Período';
      
    const janela = window.open('', '', 'width=800,height=900');
    
    if (janela) {
      janela.document.write(`
        <html>
          <head>
            <title>Relatório - ${perfilAtivo.nome_completo}</title>
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                padding: 40px; 
                color: #333; 
              }
              .header { 
                text-align: center; 
                border-bottom: 2px solid #eee; 
                padding-bottom: 20px; 
                margin-bottom: 30px; 
              }
              .title { font-size: 24px; font-weight: bold; margin: 0; color: #111; }
              .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
              table { 
                border-collapse: collapse; 
                width: 100%; 
                margin-top: 20px; 
              }
              th, td { 
                text-align: left; 
                padding: 12px; 
                border-bottom: 1px solid #ddd; 
                font-size: 14px; 
              }
              th { background-color: #f8fafc; font-weight: 600; color: #475569; }
              .status-divida { color: #dc2626; font-weight: bold; }
              .status-credito { color: #16a34a; font-weight: bold; }
              .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
              .badge-pago { background: #dcfce7; color: #166534; }
              .badge-pendente { background: #fee2e2; color: #991b1b; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">Sociedade Espírita Beneficente Miguel Vieira de Novaes</h1>
              <p class="subtitle">Relatório Analítico de Cliente - ${periodoLabel}</p>
            </div>
            
            <h2>${perfilAtivo.nome_completo}</h2>
            <p><strong>Saldo Geral do Cliente:</strong> 
              <span class="${Number(perfilAtivo.saldo_financeiro) < 0 ? 'status-divida' : 'status-credito'}">
                R$ ${Number(perfilAtivo.saldo_financeiro).toFixed(2)}
              </span>
            </p>
            
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Livro</th>
                  <th>Qtd</th>
                  <th>Pagamento</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${historicoFiltrado.map(h => `
                  <tr>
                    <td>${h.data}</td>
                    <td>${h.titulo}</td>
                    <td>${h.quantidade}</td>
                    <td style="text-transform: uppercase; font-size: 12px;">${h.metodo_pagamento}</td>
                    <td>
                      <span class="badge ${h.status === 'Pago' ? 'badge-pago' : 'badge-pendente'}">
                        ${h.status} ${h.status !== 'Pago' ? `(-R$ ${h.valorFaltante.toFixed(2)})` : ''}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div style="text-align: center; margin-top: 50px; font-size: 12px; color: #999;">
              Gerado pelo Sistema ERP - Desenvolvido por @devguedes02
            </div>
            
            <script>
              window.onload = () => window.print();
            </script>
          </body>
        </html>
      `);
      janela.document.close();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
        <Users className="w-8 h-8 text-blue-600"/>
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Clientes</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[75vh]">
        
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <input 
                required 
                type="text" 
                placeholder="Novo Cliente (Nome)" 
                value={form.nome_completo} 
                onChange={e => setForm({...form, nome_completo: e.target.value})} 
                className="w-full px-3 py-2 text-sm border rounded-md outline-none focus:border-blue-500" 
              />
              <button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium py-2 rounded-md transition-colors">
                Cadastrar
              </button>
            </form>

            <div className="relative pt-2 border-t border-gray-200">
              <Search className="absolute left-3 top-4.5 w-4 h-4 text-gray-400"/>
              <input 
                type="text" 
                placeholder="Procurar cliente..." 
                className="w-full pl-9 pr-4 py-2 border rounded-md outline-none text-sm bg-white focus:border-blue-500" 
                value={busca} 
                onChange={e => setBusca(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-grow overflow-auto p-2">
            {filtrados.map(c => (
              <button 
                key={c.id} 
                onClick={() => abrirPerfil(c.id)} 
                className={`w-full text-left p-3 rounded-lg flex justify-between items-center mb-1 transition-colors ${perfilAtivo?.id === c.id ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50'}`}
              >
                <div>
                  <div className="text-sm font-bold text-gray-800">{c.nome_completo}</div>
                  <div className={`text-xs font-black mt-1 ${Number(c.saldo_financeiro) < 0 ? 'text-red-500' : Number(c.saldo_financeiro) > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                    Saldo: R$ {Number(c.saldo_financeiro).toFixed(2)}
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${perfilAtivo?.id === c.id ? 'text-blue-500' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
          {perfilAtivo ? (
            <>
              <div className="p-6 border-b bg-gray-50 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{perfilAtivo.nome_completo}</h2>
                  <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 border rounded-full text-sm font-bold ${Number(perfilAtivo.saldo_financeiro) < 0 ? 'bg-red-50 text-red-600 border-red-200' : Number(perfilAtivo.saldo_financeiro) > 0 ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    <Wallet className="w-4 h-4"/> 
                    Saldo Atual: R$ {Number(perfilAtivo.saldo_financeiro).toFixed(2)}
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 items-end">
                  <div className="flex gap-2">
                    <button 
                      onClick={handlePagar} 
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-bold shadow-sm transition-colors"
                    >
                      <DollarSign className="w-4 h-4" /> Quitar Dívida / Add Saldo
                    </button>
                    <button 
                      onClick={imprimirRelatorio} 
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-bold shadow-sm transition-colors"
                    >
                      <Printer className="w-4 h-4" /> Imprimir PDF
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white border border-gray-300 px-3 py-1.5 rounded-md text-sm w-full justify-end">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <input 
                      type="month" 
                      value={mesFiltro} 
                      onChange={e => setMesFiltro(e.target.value)} 
                      className="outline-none bg-transparent text-gray-700 font-medium"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex-grow overflow-auto p-6">
                <table className="w-full text-left text-sm">
                  <thead className="text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="pb-3 font-semibold">Data</th>
                      <th className="pb-3 font-semibold">Título</th>
                      <th className="pb-3 font-semibold text-center">Qtd</th>
                      <th className="pb-3 font-semibold">Pagamento</th>
                      <th className="pb-3 font-semibold text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historicoFiltrado.map((h, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 text-gray-600">{h.data}</td>
                        <td className="py-4 font-bold text-gray-800">{h.titulo}</td>
                        <td className="py-4 text-center text-gray-600">{h.quantidade}</td>
                        <td className="py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                              {h.metodo_pagamento}
                            </span>
                            <span className={`inline-block px-2 py-0.5 rounded w-fit text-xs font-bold ${h.status === 'Pago' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {h.status} {h.status !== 'Pago' && `(-R$ ${h.valorFaltante.toFixed(2)})`}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <button 
                            onClick={() => handleDevolucao(h.itemId, h.titulo)} 
                            className="flex items-center justify-end w-full gap-1 text-orange-500 hover:text-orange-700 font-bold transition-colors" 
                            title="Realizar devolução"
                          >
                            <RotateCcw className="w-4 h-4" /> Devolver
                          </button>
                        </td>
                      </tr>
                    ))}
                    
                    {historicoFiltrado.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400 font-medium">
                          Nenhuma compra registrada para este período.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-gray-400 p-8">
              <Users className="w-16 h-16 opacity-20 mb-4" />
              <p className="text-lg font-medium">Nenhum cliente selecionado</p>
              <p className="text-sm mt-2">Busque ou selecione um cliente na lista lateral.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}