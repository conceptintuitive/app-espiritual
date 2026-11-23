import { NextResponse } from 'next/server';
import { admin, emailDaSessao } from '@/lib/seuDiaServidor';
import { chaveValida } from '@/lib/minhaArea';

export const runtime = 'nodejs';

const MAX_OCULTAS = 50;

// POST { chave, ocultar: true|false } → esconde (ou volta a mostrar) uma
// leitura de OUTRA pessoa em "Outras leituras neste e-mail" da Minha Área.
// Só mexe no perfil de quem está logado (cookie); não apaga nem altera nenhuma
// análise. Chave = pessoa (lib/minhaArea.js → chavePessoa).
export async function POST(request) {
  const email = emailDaSessao(request);
  if (!email) return NextResponse.json({ error: 'Sem sessão' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { body = null; }
  const chave = body?.chave;
  const ocultar = body?.ocultar !== false;
  if (!chaveValida(chave)) return NextResponse.json({ error: 'Leitura inválida' }, { status: 400 });

  try {
    const sb = admin();
    const { data: perfil, error } = await sb.from('seu_dia_perfis').select('leituras_ocultas').eq('email', email).maybeSingle();
    if (error) throw error; // ex.: migração 0020 não rodou
    if (!perfil) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });

    const atual = new Set(perfil.leituras_ocultas || []);
    if (ocultar) atual.add(chave); else atual.delete(chave);
    const lista = [...atual].slice(-MAX_OCULTAS);

    const { error: upErr } = await sb.from('seu_dia_perfis').update({ leituras_ocultas: lista }).eq('email', email);
    if (upErr) throw upErr;
    return NextResponse.json({ ok: true, ocultas: lista });
  } catch (e) {
    console.error('[seu-dia/produtos/ocultar]', e?.code, e?.message || e);
    return NextResponse.json({ error: 'Não foi possível ocultar agora' }, { status: 500 });
  }
}
