// POST /api/quiz/etapa — conta, sem identificar ninguém, que uma sessão chegou
// numa etapa do quiz (0 = viu a home … 5 = concluiu). Chamado por
// app/components/home/contarEtapa.js. Grava só dia, id aleatório da aba,
// etapa e origem (lib/quizEtapas.js). Migração 0034; sem ela, responde igual.
import { createClient } from '@supabase/supabase-js';
import { registrarEtapa } from '@/lib/quizEtapasServidor';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const texto = await request.text();
    if (texto.length > 500) return new Response(null, { status: 204 });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const r = await registrarEtapa(createClient(url, key, { auth: { persistSession: false } }), JSON.parse(texto || '{}'));
      if (!r.ok && r.motivo !== 'pedido inválido') console.error('⚠️ Etapa do quiz não contada:', r.motivo);
    }
  } catch {}
  return new Response(null, { status: 204 });
}
