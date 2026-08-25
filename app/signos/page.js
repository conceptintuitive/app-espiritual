import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import { SIGNOS, signoSlug, dadosDoSigno } from '@/lib/seoConteudo';

export const metadata = {
  title: 'Os 12 Signos do Zodíaco: o que cada um revela | Intuitive Concept',
  description: 'Áries, Touro, Gêmeos, Câncer, Leão, Virgem, Libra, Escorpião, Sagitário, Capricórnio, Aquário e Peixes — motor, riscos, amor e dinheiro de cada signo.',
  alternates: { canonical: 'https://app-espiritual-psi.vercel.app/signos' },
};

export default function SignosHubPage() {
  return (
    <div className="wrap">
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <SiteNav active="explorar" />

      <div className="wordmark">
        <span className="glyph">✦</span>
        <span className="name">Intuitive Concept</span>
      </div>
      <h1>Os 12 signos do zodíaco</h1>
      <p className="tagline">O motor, o risco, o amor e o dinheiro de cada um — clique no seu Sol.</p>

      <div className="grid">
        {SIGNOS.map((signo) => {
          const dados = dadosDoSigno(signo);
          return (
            <Link key={signo} href={`/signos/${signoSlug(signo)}`} className="card">
              <span className="tag">{dados.elemento}</span>
              <h3>{signo}</h3>
              <p>{dados.perfil.frase}</p>
            </Link>
          );
        })}
      </div>

      <style>{`
        body { margin: 0; }
        :root {
          --bg1: #0a0118; --bg2: #130828;
          --primary: #ec4899; --secondary: #8b5cf6; --warning: #f59e0b;
          --text: #faf5ff; --muted: rgba(233,213,255,0.72);
          --border: rgba(216,180,254,0.15); --border-strong: rgba(216,180,254,0.3);
        }
        .wrap { min-height: 100vh; background: var(--bg1); color: var(--text); font-family: 'Cormorant Garamond', Georgia, serif; }
        .wordmark { text-align: center; padding: 56px 20px 8px; }
        .glyph { font-size: 30px; color: var(--warning); display: block; margin-bottom: 10px; }
        .name { font-family: 'Cinzel', serif; font-weight: 700; font-size: 15px; letter-spacing: 0.34em; text-transform: uppercase; }
        h1 { font-family: 'Cinzel', serif; font-weight: 700; font-size: clamp(26px, 5vw, 34px); text-align: center; margin: 18px auto 8px; text-wrap: balance; }
        .tagline { text-align: center; font-size: 18px; color: var(--muted); max-width: 480px; margin: 0 auto 44px; line-height: 1.6; padding: 0 20px; }

        .grid {
          max-width: 980px; margin: 0 auto; padding: 0 20px 80px;
          display: grid; grid-template-columns: 1fr; gap: 16px;
        }
        @media (min-width: 640px) { .grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 980px) { .grid { grid-template-columns: repeat(3, 1fr); } }

        .card {
          border-radius: 18px; border: 1px solid var(--border); padding: 24px;
          text-decoration: none; color: var(--text); background: rgba(139,92,246,0.05);
          transition: border-color 0.2s ease, transform 0.2s ease;
        }
        .card:hover { border-color: var(--border-strong); transform: translateY(-2px); }
        .tag { font-family: 'Cinzel', serif; font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--warning); }
        .card h3 { font-family: 'Cinzel', serif; font-size: 21px; font-weight: 700; margin: 8px 0; }
        .card p { font-size: 15px; font-style: italic; color: var(--muted); margin: 0; line-height: 1.5; }
      `}</style>
    </div>
  );
}
