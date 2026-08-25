import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import { SIGNOS, signoSlug, signoPorSlug, dadosDoSigno } from '@/lib/seoConteudo';

export function generateStaticParams() {
  return SIGNOS.map((signo) => ({ signo: signoSlug(signo) }));
}

export async function generateMetadata({ params }) {
  const { signo: slug } = await params;
  const signo = signoPorSlug(slug);
  const dados = signo ? dadosDoSigno(signo) : null;
  if (!dados) return { title: 'Signo não encontrado | Intuitive Concept' };

  const title = `${signo}: o que o seu signo revela sobre você | Intuitive Concept`;
  const description = `${signo} (${dados.elemento}, regido por ${dados.regente}): ${dados.perfil.motor}. Veja o que isso significa no amor, no dinheiro e nos desafios de ${signo}.`;

  return {
    title,
    description,
    alternates: { canonical: `https://app-espiritual-psi.vercel.app/signos/${slug}` },
    openGraph: { title, description, locale: 'pt_BR', type: 'article' },
  };
}

export default async function SignoPage({ params }) {
  const { signo: slug } = await params;
  const signo = signoPorSlug(slug);
  const dados = signo ? dadosDoSigno(signo) : null;

  if (!dados) {
    return (
      <div className="wrap">
        <SiteNav active="explorar" />
        <div className="content">
          <h1>Signo não encontrado</h1>
          <Link href="/signos" className="back">← Ver todos os signos</Link>
        </div>
        <style>{`
          body { margin: 0; }
          .wrap { min-height: 100vh; background: #0a0118; color: #faf5ff; font-family: 'Cormorant Garamond', Georgia, serif; }
          .content { max-width: 640px; margin: 0 auto; padding: 80px 20px; text-align: center; }
          .back { color: #ec4899; text-decoration: none; }
        `}</style>
      </div>
    );
  }

  const { perfil, elemento, regente, estilo } = dados;
  const outrosSignos = SIGNOS.filter((s) => s !== signo);

  return (
    <div className="wrap">
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <SiteNav active="explorar" />

      <article className="content">
        <Link href="/signos" className="back">← Todos os signos</Link>
        <span className="eyebrow">{elemento} · regido por {regente}</span>
        <h1>{signo}</h1>
        <p className="frase">“{perfil.frase}”</p>

        <section className="bloco">
          <h2>O motor de {signo}</h2>
          <p>{perfil.motor.charAt(0).toUpperCase() + perfil.motor.slice(1)}.</p>
        </section>

        <section className="bloco">
          <h2>O ponto de atenção</h2>
          <p>Quando {signo} desequilibra, o padrão costuma ser {perfil.risco}.</p>
        </section>

        <div className="grid2">
          <section className="bloco card">
            <h2>No amor</h2>
            <p>{signo} {perfil.amor}.</p>
          </section>
          <section className="bloco card">
            <h2>No dinheiro</h2>
            <p>{signo} {perfil.dinheiro}.</p>
          </section>
        </div>

        <section className="bloco">
          <h2>Como o elemento {elemento} funciona</h2>
          <p>Em dia bom, {estilo.assinatura}. Em excesso, {estilo.excesso}. O caminho de ajuste é {estilo.cura}.</p>
        </section>

        <section className="bloco chave">
          <h2>A chave de {signo}</h2>
          <p>{perfil.chave.charAt(0).toUpperCase() + perfil.chave.slice(1)}.</p>
        </section>

        <div className="cta-box">
          <p>Isso é só o Sol. Seu mapa completo cruza Sol, Lua, Ascendente, Número de Vida e muito mais.</p>
          <Link href="/" className="cta">Descobrir meu mapa completo →</Link>
        </div>

        <section className="outros">
          <h2>Outros signos</h2>
          <div className="outros-links">
            {outrosSignos.map((s) => (
              <Link key={s} href={`/signos/${signoSlug(s)}`} className="outro-link">{s}</Link>
            ))}
          </div>
        </section>
      </article>

      <style>{`
        body { margin: 0; }
        :root {
          --bg1: #0a0118; --bg2: #130828;
          --primary: #ec4899; --secondary: #8b5cf6; --warning: #f59e0b;
          --text: #faf5ff; --muted: rgba(233,213,255,0.72);
          --border: rgba(216,180,254,0.15); --border-strong: rgba(216,180,254,0.3);
        }
        .wrap { min-height: 100vh; background: var(--bg1); color: var(--text); font-family: 'Cormorant Garamond', Georgia, serif; }
        .content { max-width: 640px; margin: 0 auto; padding: 48px 20px 100px; }
        .back { display: inline-block; margin-bottom: 24px; font-family: 'Cinzel', serif; font-size: 12.5px; letter-spacing: 0.08em; color: var(--muted); text-decoration: none; }
        .eyebrow { display: block; font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--warning); margin-bottom: 10px; }
        h1 { font-family: 'Cinzel', serif; font-weight: 700; font-size: clamp(34px, 7vw, 48px); line-height: 1.15; margin: 0 0 16px; text-wrap: balance; }
        .frase { font-size: 20px; font-style: italic; color: #fbcfe8; margin: 0 0 36px; }
        .bloco { margin-bottom: 28px; }
        .bloco h2 { font-family: 'Cinzel', serif; font-size: 15px; font-weight: 700; letter-spacing: 0.04em; color: var(--secondary); margin: 0 0 8px; }
        .bloco p { font-size: 18px; line-height: 1.7; color: var(--text); margin: 0; }
        .grid2 { display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 8px; }
        @media (min-width: 560px) { .grid2 { grid-template-columns: 1fr 1fr; } }
        .card { padding: 20px; border-radius: 16px; border: 1px solid var(--border); margin-bottom: 0; }
        .chave { padding: 20px; border-radius: 16px; background: rgba(139,92,246,0.1); border: 1px solid var(--border-strong); }
        .chave h2 { color: var(--warning); }

        .cta-box { margin: 44px 0; padding: 24px; border-radius: 16px; border: 1px dashed var(--border-strong); text-align: center; }
        .cta-box p { font-size: 16px; color: var(--muted); margin: 0 0 14px; }
        .cta {
          display: inline-block; font-family: 'Cinzel', serif; font-size: 13px; letter-spacing: 0.06em;
          color: #fff; background: linear-gradient(135deg, var(--primary), #be185d);
          padding: 11px 22px; border-radius: 999px; text-decoration: none;
        }

        .outros h2 { font-family: 'Cinzel', serif; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin: 0 0 14px; }
        .outros-links { display: flex; flex-wrap: wrap; gap: 8px; }
        .outro-link { font-size: 14px; color: var(--muted); text-decoration: none; padding: 7px 14px; border-radius: 999px; border: 1px solid var(--border); }
        .outro-link:hover { color: var(--text); border-color: var(--border-strong); }
      `}</style>
    </div>
  );
}
