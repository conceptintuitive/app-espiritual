// /compatibilidade-completa — guia "O que é a Compatibilidade Completa"
// (Server Component, sem IA), no visual da Minha Área como /human-design. O
// resultado de cada pessoa continua em /compatibilidade-completa/[id].

import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import BotaoMeuResultado, { LinhaMeuResultado } from '@/app/components/seo/BotaoMeuResultado';
import { BASE_URL, jsonSeguro } from '@/lib/seoTarot';
import b from '@/app/blog/blog.module.css';
import s from '@/app/components/seo/seo.module.css';

const url = `${BASE_URL}/compatibilidade-completa`;
const title = 'Compatibilidade Completa: Sol, Lua, Vênus e Marte de duas pessoas | Intuitive Concept';
const description =
  'Por que comparar só os signos não basta: como a Compatibilidade Completa cruza Sol, Lua, Vênus e Marte do seu mapa com os de outra pessoa, ponto a ponto.';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, locale: 'pt_BR', type: 'article' },
};

const BOTAO = { base: '/compatibilidade-completa', rotulo: 'Fazer minha Compatibilidade Completa', produto: 'compatibilidade-completa' };
const LINHA = {
  comMapa: 'Seu lado já está calculado. Da outra pessoa, só o nome e a data de nascimento. Sol com Sol é grátis.',
  semMapa: 'Começa pelo seu mapa grátis. Depois, da outra pessoa, só o nome e a data de nascimento.',
};

// Mesmos quatro pontos de EIXOS (lib/compatibilidadeCompleta.js), com o que
// cada um responde na relação.
const PONTOS = [
  { nome: 'Sol · Identidade', texto: 'Quem cada um é no centro: se vocês se reconhecem ou se estranham no jeito de ser.' },
  { nome: 'Lua · Emoção', texto: 'Como cada um sente e pede cuidado. É o ponto que mais pesa no convívio do dia a dia.' },
  { nome: 'Vênus · Amor', texto: 'Como cada um demonstra e recebe afeto, e se esses jeitos se encontram.' },
  { nome: 'Marte · Ação', texto: 'Como cada um briga, decide e corre atrás. Mostra como os conflitos acontecem entre vocês.' },
];

const FAQ = [
  {
    p: 'Qual a diferença pra Compatibilidade grátis?',
    r: 'A Compatibilidade grátis compara dois signos que você escolhe. A Completa usa o seu mapa de verdade e o da outra pessoa: quatro pontos de cada um, comparados um a um, mais a média dos quatro.',
  },
  {
    p: 'Preciso da hora de nascimento da outra pessoa?',
    r: 'Não. Da outra pessoa, só o nome e a data. A Lua dela é calculada ao meio-dia: em dia de troca de signo da Lua, ela pode cair no signo vizinho. Por isso o Ascendente fica de fora: sem hora e cidade, ele não tem precisão.',
  },
  {
    p: 'Serve só pra relacionamento amoroso?',
    r: 'Não. Funciona pra qualquer pessoa próxima: sócia, mãe, amiga, chefe. Vênus fala de afeto em geral, não só de romance.',
  },
  {
    p: 'Quanto custa?',
    r: 'Sol com Sol é grátis pra qualquer pessoa. A leitura completa vem de bônus com o Manual do seu Mapa e também está na assinatura Intuitive Completo.',
  },
];

export default function CompatibilidadeCompletaPage() {
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: 'O que é a Compatibilidade Completa', description, url, inLanguage: 'pt-BR', publisher: { '@type': 'Organization', name: 'Intuitive Concept' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(({ p, r }) => ({ '@type': 'Question', name: p, acceptedAnswer: { '@type': 'Answer', text: r } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Compatibilidade Completa', item: url },
    ] },
  ];

  return (
    <div className={b.blog}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonSeguro(jsonLd) }} />
      <SiteNav active="compat-completa-guia" />

      <article className={`${b.ctr} ${b.post}`}>
        <div className={b.coluna}>
          <nav className={s.migalhas} aria-label="Você está em">
            <Link href="/">Início</Link><span aria-hidden="true">/</span><span>Compatibilidade Completa</span>
          </nav>
          <header className={b.postTopo}>
            <span className={b.rotulo}><b>Guia do zero</b> · Astrologia</span>
            <h1 className={b.postTitulo}>O que é a <em style={{ color: 'var(--ouro)' }}>Compatibilidade Completa</em>?</h1>
            <p className={b.postResumo}>
              O seu mapa com o de uma pessoa específica: Sol, Lua, Vênus e Marte dos dois, comparados ponto a ponto.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, marginTop: 6 }}>
              <BotaoMeuResultado {...BOTAO} className={b.btn} origem="topo" />
              <LinhaMeuResultado {...LINHA} className={b.rotulo} />
            </div>
          </header>
        </div>

        <div className={`${b.coluna} ${b.corpo}`}>
          <p className={s.pratica}>
            &quot;Áries combina com Libra?&quot; olha só o <em style={{ color: 'var(--ouro)' }}>Sol</em>. Duas pessoas do mesmo signo podem ter Lua, Vênus e Marte completamente diferentes, e é aí que a relação acontece.
          </p>

          <h2>Por que só o signo não basta</h2>
          <p>
            O signo que todo mundo conhece é a posição do Sol no dia em que você nasceu. Ele diz muito sobre quem você é, mas pouco sobre como você ama, como você briga e do que você precisa quando está mal. Isso está em outros planetas, e cada pessoa tem uma combinação própria.
          </p>

          <h2>Os 4 pontos comparados</h2>
          <ol className={s.perguntas}>
            {PONTOS.map(({ nome, texto }) => (
              <li key={nome}><strong>{nome}.</strong> {texto}</li>
            ))}
          </ol>
          <p>
            Cada ponto ganha uma nota e um texto sobre como os dois signos se encontram ali. No fim, a média dos quatro dá a compatibilidade geral.
          </p>

          <h2>Como funciona</h2>
          <ul>
            <li>O seu lado vem do seu mapa: data, hora e cidade de nascimento.</li>
            <li>Da outra pessoa, só o nome e a data de nascimento.</li>
            <li>Sol com Sol aparece na hora, grátis. Lua, Vênus, Marte e a média completam a leitura.</li>
          </ul>

          <h2>Perguntas frequentes</h2>
          {FAQ.map(({ p, r }) => (
            <details key={p} style={{ borderTop: '1px solid var(--linha)', padding: '14px 0' }}>
              <summary style={{ cursor: 'pointer', fontFamily: 'var(--serif)', fontSize: 22, lineHeight: 1.2 }}>{p}</summary>
              <p style={{ marginTop: 10, color: 'var(--areia)' }}>{r}</p>
            </details>
          ))}
          <div style={{ borderTop: '1px solid var(--linha)' }} />

          <p style={{ marginTop: 28 }}>
            Quer só comparar dois signos? Use a <Link className={s.link} href="/compatibilidade">Compatibilidade grátis</Link>.
          </p>

          <div className={b.ctaFim}>
            <p className={b.ctaFimTexto}>Veja como o seu mapa conversa com o de alguém.</p>
            <BotaoMeuResultado {...BOTAO} className={b.btn} origem="fim" />
            <LinhaMeuResultado {...LINHA} className={b.rotulo} />
          </div>
        </div>
      </article>
    </div>
  );
}
