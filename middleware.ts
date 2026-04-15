import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    // 👇 USUÁRIO E SENHA DO CADEADO 👇
    if (user === 'centro' && pwd === 'espirita2026') {
      return NextResponse.next(); // Senha correta, sistema liberado!
    }
  }

  // Se errar a senha ou tentar entrar direto, bloqueia e pede a senha
  return new NextResponse('Acesso Restrito: Autenticação Necessária.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Sistema ERP Protegido"',
    },
  });
}

// Trava TODAS as páginas do sistema
export const config = {
  matcher: '/:path*',
};