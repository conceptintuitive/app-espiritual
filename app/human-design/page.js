// /human-design — "o que é Human Design" pra quem nunca ouviu falar (Server
// Component, sem IA), no visual da Minha Área como /tarot e /numerologia.
// O resultado de cada pessoa continua em /human-design/[id] (rota irmã).

import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import CtaMapa from '@/app/components/CtaMapa';
import { TIPO_DESCRICAO } from '@/lib/humanDesignTextos';
import { BASE_URL, jsonSeguro } from '@/lib/seoTarot';
import b from '@/app/blog/blog.module.css';
import s from '@/app/components/seo/seo.module.css';

const url = `${BASE_URL}/human-design`;
const title = 'O que é Human Design? Tipos, Autoridade e Perfil | Intuitive Concept';
const description =
  'Human Design explicado do zero: de onde vem, os 5 Tipos (Gerador, Gerador Manifestador, Projetor, Manifestador e Refletor), Autoridade, Perfil e como descobrir o seu.';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, locale: 'pt_BR', type: 'article' },
};

// Proporção aproximada de cada Tipo, como o próprio sistema divulga (bate com
// a distribuição de lib/humanDesign.js em 5.000 nascimentos, nov/2026). O
// texto longo é o mesmo da página de resultado (lib/humanDesignTextos.js).
const TIPOS = [
  { chave: 'Generator', pct: '~37%', frase: 'Energia constante que funciona respondendo.' },
  { chave: 'Manifesting Generator', pct: '~33%', frase: 'Responde como o Gerador, mas pula etapas.' },
  { chave: 'Projector', pct: '~20%', frase: 'Enxerga pessoas e sistemas; rende guiando.' },
  { chave: 'Manifestor', pct: '~9%', frase: 'Feito pra iniciar, em rajadas.' },
  { chave: 'Reflector', pct: '~1%', frase: 'Espelho do ambiente; decide com o tempo.' },
];

const PECAS = [
  { nome: 'Tipo', texto: 'Como a sua energia funciona no dia a dia. São só 5, e é a primeira coisa que todo mundo quer saber.' },
  { nome: 'Autoridade', texto: 'Onde mora a sua decisão certa: no corpo, na emoção, na intuição, na voz ou no tempo. Não na cabeça.' },
  { nome: 'Perfil', texto: 'Dois números (como 1/3 ou 4/6) que descrevem seu jeito de aprender, se relacionar e aparecer pro mundo.' },
];

const FAQ = [
  {
    p: 'Human Design é a mesma coisa que mapa astral?',
    r: 'Não. Os dois usam a posição dos planetas no seu nascimento, mas o Human Design lê essas posições em outro mapa: 9 centros de energia, 64 portas e 36 canais. O resultado não fala de signo, e sim de Tipo, Autoridade e Perfil.',
  },
  {
    p: 'Preciso da hora exata de nascimento?',
    r: 'Sim, ela faz diferença. O Tipo costuma se manter mesmo com a hora um pouco errada, mas o Perfil e alguns centros podem mudar. Se você não sabe a hora, a certidão de nascimento costuma ter.',
  },
  {
    p: 'Human Design é ciência?',
    r: 'Não. É um sistema de autoconhecimento, como a astrologia e a numerologia. Vale como uma lente pra observar como você decide e gasta energia: o teste é ver se a leitura faz sentido na sua vida.',
  },
  {
    p: 'Qual é o Tipo mais raro?',
    r: 'O Refletor, com cerca de 1% das pessoas. O mais comum é o Gerador.',
  },
];

export default function HumanDesignPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'O que é Human Design?',
      description,
      url,
      inLanguage: 'pt-BR',
      publisher: { '@type': 'Organization', name: 'Intuitive Concept' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map(({ p, r }) => ({ '@type': 'Question', name: p, acceptedAnswer: { '@type': 'Answer', text: r } })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'Human Design', item: url },
      ],
    },
  ];

  return (
    <div className={b.blog}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonSeguro(jsonLd) }} />
      <SiteNav />

      <article className={`${b.ctr} ${b.post}`}>
        <div className={b.coluna}>
          <nav className={s.migalhas} aria-label="Você está em">
            <Link href="/">Início</Link><span aria-hidden="true">/</span><span>Human Design</span>
          </nav>
          <header className={b.postTopo}>
            <span className={b.rotulo}><b>Guia do zero</b> · Human Design</span>
            <h1 className={b.postTitulo}>O que é <em style={{ color: 'var(--ouro)' }}>Human Design</em>?</h1>
            <p className={b.postResumo}>
              Um mapa de como a sua energia funciona e de como você toma decisões melhores, calculado a partir da data, hora e local de nascimento.
            </p>
          </header>
        </div>

        <div className={`${b.coluna} ${b.corpo}`}>
          <p className={s.pratica}>
            O signo tenta dizer <em style={{ color: 'var(--ouro)' }}>quem</em> você é. O Human Design diz <em style={{ color: 'var(--ouro)' }}>como</em> você funciona: de onde vem sua energia, como decidir sem se arrepender e que ritmo te desgasta.
          </p>

          <h2>De onde veio</h2>
          <p>
            O sistema foi criado em 1987 por Alan Krakower, que passou a assinar Ra Uru Hu. Ele juntou quatro linguagens antigas numa leitura só:
          </p>
          <ul>
            <li><strong>Astrologia:</strong> as posições dos planetas no nascimento e também cerca de 88 dias antes dele (quando o Sol estava 88° atrás).</li>
            <li><strong>I Ching:</strong> os 64 hexagramas viram as 64 portas do mapa.</li>
            <li><strong>Chakras:</strong> no lugar de 7, o Human Design usa 9 centros de energia.</li>
            <li><strong>Cabala:</strong> a Árvore da Vida inspira os caminhos que ligam os centros.</li>
          </ul>
          <p>
            O resultado é o <strong>bodygraph</strong>, um desenho do corpo com 9 centros. Os coloridos são definidos: energia fixa e confiável em você. Os em branco são abertos: ali você absorve e amplifica a energia dos outros.
          </p>

          <h2>As 3 peças que mais importam</h2>
          <ol className={s.perguntas}>
            {PECAS.map(({ nome, texto }) => (
              <li key={nome}><strong>{nome}.</strong> {texto}</li>
            ))}
          </ol>

          <h2>Os 5 Tipos</h2>
          <p>Lê os cinco. Muita gente se reconhece logo de cara.</p>
          {TIPOS.map(({ chave, pct, frase }) => {
            const t = TIPO_DESCRICAO[chave];
            return (
              <details key={chave} style={{ borderTop: '1px solid var(--linha)', padding: '18px 0' }}>
                <summary style={{ cursor: 'pointer', listStyle: 'none', display: 'grid', gap: 4 }}>
                  <span className={b.rotulo}><b>{pct}</b> das pessoas</span>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 30, lineHeight: 1.1 }}>{t.titulo}</span>
                  <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 19, color: 'var(--areia)' }}>{frase}</span>
                </summary>
                <p style={{ marginTop: 14 }}>{t.texto}</p>
                <p style={{ color: 'var(--areia)' }}><strong>Na prática:</strong> {t.comoAgir}</p>
              </details>
            );
          })}
          <div style={{ borderTop: '1px solid var(--linha)', marginBottom: 22 }} />

          <h2>Seu Human Design cruzado com o resto do seu mapa</h2>
          <p>
            Calculadoras de Human Design mostram o bodygraph e param aí. Aqui a gente já conhece seu Sol, seu Número de Vida e o que você quer destravar agora, então a leitura cruza as três coisas e termina num plano de ação pro seu objetivo.
          </p>
          <p>
            Comece pelo seu Mapa grátis. O Human Design completo (Tipo, Autoridade, Perfil e centros) é liberado junto com o Manual do seu Mapa.
          </p>

          <h2>Perguntas frequentes</h2>
          {FAQ.map(({ p, r }) => (
            <details key={p} style={{ borderTop: '1px solid var(--linha)', padding: '14px 0' }}>
              <summary style={{ cursor: 'pointer', fontFamily: 'var(--serif)', fontSize: 22, lineHeight: 1.2 }}>{p}</summary>
              <p style={{ marginTop: 10, color: 'var(--areia)' }}>{r}</p>
            </details>
          ))}
          <div style={{ borderTop: '1px solid var(--linha)' }} />

          <p style={{ marginTop: 28 }}>
            Outras lentes: <Link className={s.link} href="/signos">os 12 signos</Link>, <Link className={s.link} href="/numerologia">numerologia</Link> e <Link className={s.link} href="/hexagrama-do-dia">o hexagrama do dia</Link> do I Ching.
          </p>

          <div className={b.ctaFim}>
            <p className={b.ctaFimTexto}>Descubra seu Tipo começando pelo seu Mapa.</p>
            <CtaMapa className={b.btn} origem="human-design" />
          </div>
        </div>
      </article>
    </div>
  );
}
