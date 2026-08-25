import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import { NUMEROS_VIDA, dadosDoNumero } from '@/lib/seoConteudo';

export const metadata = {
  title: 'Números de Vida na Numerologia: significado de 1 a 33 | Intuitive Concept',
  description: 'O significado de cada Número de Vida na numerologia — essência, força, sombra e caminho de cura, dos números de 1 a 9 até os Números Mestres 11, 22 e 33.',
  alternates: { canonical: 'https://intuitiveconcept.com.br/numerologia' },
};

export default function NumerologiaHubPage() {
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
      <h1>Números de Vida na Numerologia</h1>
      <p className="tagline">Cada número carrega uma essência, uma força e uma sombra. Encontre o seu.</p>

      <div className="grid">
        {NUMEROS_VIDA.map((numero) => {
          const dados = dadosDoNumero(numero);
          return (
            <Link key={numero} href={`/numerologia/numero-${numero}`} className="card">
              {dados.mestre && <span className="tag">Número Mestre</span>}
              <h3>{numero}</h3>
              <p>{dados.perfil.essencia}</p>
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
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
        }
        @media (min-width: 640px) { .grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 980px) { .grid { grid-template-columns: repeat(4, 1fr); } }

        .card {
          border-radius: 18px; border: 1px solid var(--border); padding: 22px;
          text-decoration: none; color: var(--text); background: rgba(139,92,246,0.05);
          transition: border-color 0.2s ease, transform 0.2s ease;
        }
        .card:hover { border-color: var(--border-strong); transform: translateY(-2px); }
        .tag { display: block; font-family: 'Cinzel', serif; font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--warning); margin-bottom: 6px; }
        .card h3 { font-family: 'Cinzel', serif; font-size: 30px; font-weight: 700; margin: 0 0 8px; }
        .card p { font-size: 14px; color: var(--muted); margin: 0; line-height: 1.5; }
      `}</style>
    </div>
  );
}
