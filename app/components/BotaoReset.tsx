'use client';

import axios from 'axios';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BotaoReset() {
  const router = useRouter();

  const handleReset = async () => {
    const senha = window.prompt('⚠️ ZERAR SISTEMA DE TESTES ⚠️\n\nIsso apagará TODOS os livros, clientes e vendas do banco de dados.\n\nDigite a senha de autorização:');
    
    if (!senha) return; // Se o usuário cancelar ou deixar em branco

    try {
      await axios.post('/api/reset', { senha });
      alert('BOOM! 💥 Sistema completamente resetado e limpo.');
      router.refresh(); // Dá um F5 automático na página para zerar os cards
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro de comunicação ao resetar.');
    }
  };

  return (
    <div className="flex justify-end mt-12 border-t border-red-100 pt-6">
      <button 
        onClick={handleReset} 
        className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold py-2 px-4 rounded-lg transition-colors text-sm shadow-sm"
      >
        <AlertTriangle className="w-4 h-4" />
        Resetar Sistema
      </button>
    </div>
  );
}