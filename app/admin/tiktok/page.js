// /admin/tiktok — aprovar os posts do TikTok com Direct Post (a tela que a
// auditoria do Content Posting API exige: conta de destino visível, prévia,
// privacidade escolhida à mão, interações, conteúdo comercial e consentimento).
// Sem sessão, mostra só o formulário de entrada (CRON_SECRET).
import { cookies } from 'next/headers';
import { COOKIE_ADMIN, sessaoAdminValida } from '@/lib/adminSessao';
import AprovarTikTok from './AprovarTikTok';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Postar no TikTok · Intuitive Concept' };

const caixa = { maxWidth: 420, margin: '80px auto', padding: 24, fontFamily: 'system-ui, sans-serif', color: '#f3e9da' };

export default async function Pagina({ searchParams }) {
  const c = await cookies();
  if (sessaoAdminValida(c.get(COOKIE_ADMIN)?.value)) return <AprovarTikTok />;
  const { erro } = (await searchParams) || {};
  return (
    <main style={{ minHeight: '100vh', background: '#07040d' }}>
      <form method="post" action="/api/admin/entrar" style={caixa}>
        <h1 style={{ fontWeight: 400, color: '#f2c77b' }}>Área da autora</h1>
        <label htmlFor="segredo" style={{ display: 'block', margin: '18px 0 8px' }}>Chave de acesso</label>
        <input id="segredo" name="segredo" type="password" required autoComplete="current-password" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid rgba(242,199,123,.4)', background: '#140c22', color: '#f3e9da' }} />
        {erro && <p style={{ color: '#ffb4a8' }}>Chave errada.</p>}
        <button type="submit" style={{ marginTop: 16, padding: '12px 20px', borderRadius: 999, border: 0, background: '#f2c77b', color: '#1a1020', fontWeight: 600 }}>Entrar</button>
      </form>
    </main>
  );
}
