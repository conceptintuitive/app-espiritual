import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import { NUMEROS_VIDA, dadosDoNumero } from '@/lib/seoConteudo';

export function generateStaticParams() {
  return NUMEROS_VIDA.map((numero) => ({ numero: String(numero) }));
}

export async function generateMetadata({ params }) {
  const { numero: raw } = await params;
  const numero = parseInt(raw, 10);
  const dados = dadosDoNumero(numero);
  if (!dados) return { title: 'Número não encontrado | Intuitive Concept' };

  const title = `Número de Vida ${numero}: significado na Numerologia | Intuitive Concept`;
  const description = `Número de Vida ${numero}: ${dados.perfil.essencia}. Veja a força, a sombra e o caminho de cura de quem tem esse número.`;

  return {
    title,
    description,
    alternates: { canonical: `https://app-espiritual-psi.vercel.app/numerologia/numero-${numero}` },
    openGraph: { title, description, locale: 'pt_BR', type: 'article' },
  };
}

export default async function NumeroPage({ params }) {
  const { numero: raw } = await params;
  const numero = parseInt(raw, 10);
  const dados = dadosDoNumero(numero);

  if (!dados) {
    return (
      <div className="wrap">
        <SiteNav active="explorar" />
        <div className="content">
          <h1>Número não encontrado</h1>
          <Link href="/numerologia" className="back">← Ver todos os números</Link>
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

  const { perfil, mestre } = dados;
  const outrosNumeros = NUMEROS_VIDA.filter((n) => n !== numero);

  return (
    <div className="wrap">
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <SiteNav active="explorar" />

      <article className="content">
        <Link href="/numerologia" className="back">← Todos os números</Link>
        <span className="eyebrow">Número de Vida{mestre ? ' · Número Mestre' : ''}</span>
        <h1>Número {numero}</h1>
        <p className="frase">{perfil.essencia.charAt(0).toUpperCase() + perfil.essencia.slice(1)}.</p>

        <section className="bloco card">
          <h2>Força</h2>
          <p>Quem carrega o Número {numero} costuma ter {perfil.forca} como principal força.</p>
        </section>

        <section className="bloco card">
          <h2>Sombra</h2>
          <p>O lado que pede atenção é {perfil.sombra}.</p>
        </section>

        <section className="bloco chave">
          <h2>Caminho de cura</h2>
          <p>{perfil.cura.charAt(0).toUpperCase() + perfil.cura.slice(1)}.</p>
        </section>

        {mestre && (
          <section className="bloco">
            <p className="nota">{numero} é um Número Mestre — carrega mais potência e também mais exigência do que os números reduzidos (1 a 9). Vale entender também o número base por trás dele.</p>
          </section>
        )}

        <div className="cta-box">
          <p>Seu Número de Vida é só uma camada. Seu manual completo cruza esse número com seu Sol, Lua, Ascendente e objetivo de vida.</p>
          <Link href="/" className="cta">Calcular meu Número de Vida →</Link>
        </div>

        <section className="outros">
          <h2>Outros números</h2>
          <div className="outros-links">
            {outrosNumeros.map((n) => (
              <Link key={n} href={`/numerologia/numero-${n}`} className="outro-link">{n}</Link>
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
        .bloco { margin-bottom: 20px; }
        .bloco h2 { font-family: 'Cinzel', serif; font-size: 15px; font-weight: 700; letter-spacing: 0.04em; color: var(--secondary); margin: 0 0 8px; }
        .bloco p { font-size: 18px; line-height: 1.7; color: var(--text); margin: 0; }
        .card { padding: 20px; border-radius: 16px; border: 1px solid var(--border); }
        .chave { padding: 20px; border-radius: 16px; background: rgba(139,92,246,0.1); border: 1px solid var(--border-strong); }
        .chave h2 { color: var(--warning); }
        .nota { font-size: 15px; color: var(--muted); line-height: 1.6; font-style: italic; }

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
