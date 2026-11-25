// POST /api/social/visita — conta uma visita que chegou das redes (UTM com
// utm_source=instagram|tiktok). Chamado 1x por sessão pelo
// app/components/CapturaAtribuicao.js. Com { declarar: true, sessao, utm_* }
// (página /comecar, a pessoa tocou num post), a visita da bio daquela sessão
// passa a contar pro formato tocado (migração 0032). Público e anônimo: grava só o dia e os
// rótulos conhecidos da campanha (lib/utmSocial.js#visitaDasRedes), nunca IP,
// e-mail ou id do aparelho. Migração 0031; sem ela, não grava e responde igual.
import { createClient } from '@supabase/supabase-js';
import { registrarVisita, declararVisita } from '@/lib/utmSocialServidor';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const texto = await request.text();
    if (texto.length > 1000) return new Response(null, { status: 204 });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const sb = createClient(url, key, { auth: { persistSession: false } });
      const body = JSON.parse(texto || '{}');
      if (body?.declarar === true) {
        const r = await declararVisita(sb, body);
        if (!r.ok && r.motivo !== 'declaração inválida') console.error('⚠️ Formato da visita não declarado:', r.motivo);
      } else {
        const r = await registrarVisita(sb, body);
        if (!r.ok && r.motivo !== 'fora das redes') console.error('⚠️ Visita das redes não contada:', r.motivo);
      }
    }
  } catch {}
  return new Response(null, { status: 204 });
}
