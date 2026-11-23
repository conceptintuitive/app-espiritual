import { NextResponse } from 'next/server';
import { admin, emailDaSessao, marcarConfirmado } from '@/lib/seuDiaServidor';

export const runtime = 'nodejs';

// POST → "Sim, sou eu" da tela "Esta é você?": grava perfil_confirmado_em no
// perfil de quem está logado. Só com sessão (cookie). Sem a migração 0021
// responde { ok: false, salvo: false } com 200: o front guarda a confirmação
// no aparelho e segue.
export async function POST(request) {
  const email = emailDaSessao(request);
  if (!email) return NextResponse.json({ error: 'Sem sessão' }, { status: 401 });
  const salvo = await marcarConfirmado(admin(), email);
  if (!salvo) console.error('[seu-dia/perfil/confirmar] não gravou (migração 0021?)');
  return NextResponse.json({ ok: salvo, salvo });
}
