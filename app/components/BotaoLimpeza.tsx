'use client';

import axios from 'axios';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BotaoLimpeza() {
  const router = useRouter();

  const handleLimpeza = async () => {
    const senha = window.prompt(
      '🧹 FAXINA DE DADOS AUTOMÁTICA\n\n' +
      'O sistema irá procurar e excluir permanentemente:\n' +
      '- Clientes SEM dívida que não compram há 6 meses\n' +
      '- Clientes COM dívida que não compram há 1 ano\n' +
      '- Livros com estoque ZERADO há mais de 6 meses\n\n' +
      'Digite a senha de autorização:'
    );
    
    if (!senha) return;

    try {
      const { data } = await axios.post('/api/limpeza', { senha });
      alert(data.message); // Mostra quantos foram apagados
      router.refresh(); 
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro de comunicação ao executar faxina.');
    }
  };

  return (
    <div className="flex justify-end mt-4">
      <button 
        onClick={handleLimpeza} 
        className="flex items-center gap-2 bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 font-bold py-2 px-4 rounded-lg transition-colors text-sm shadow-sm"
      >
        <Trash2 className="w-4 h-4" />
        Executar Faxina Semestral
      </button>
    </div>
  );
}