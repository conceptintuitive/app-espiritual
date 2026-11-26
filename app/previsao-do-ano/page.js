// /previsao-do-ano — guia "O que é a Previsão do Ano" (Server Component, sem
// IA), no visual da Minha Área como /human-design. O resultado de cada pessoa
// continua em /previsao-do-ano/[id] (rota irmã).

import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import BotaoMeuResultado, { LinhaMeuResultado } from '@/app/components/seo/BotaoMeuResultado';
import { MES_TEMA } from '@/lib/transitos12meses';
import { calcularAnoPessoal } from '@/lib/calculos';
import { BASE_URL, jsonSeguro } from '@/lib/seoTarot';
import b from '@/app/blog/blog.module.css';
import s from '@/app/components/seo/seo.module.css';

// O exemplo usa o ano corrente: revalida 1x por dia.
export const revalidate = 86400;

const url = `${BASE_URL}/previsao-do-ano`;
const title = 'Previsão do Ano pela numerologia: o seu Ano Pessoal e os 12 meses | Intuitive Concept';
const description =
  'Como funciona a Previsão do Ano: o Ano Pessoal e o Mês Pessoal da numerologia, o ciclo de 9 anos, o que cada número pede e como ver os seus próximos 12 meses.';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, locale: 'pt_BR', type: 'article' },
};

const BOTAO = { base: '/previsao-do-ano', rotulo: 'Ver minha Previsão do Ano', produto: 'previsao-do-ano' };
const LINHA = {
  comMapa: 'Calculada com a data do seu mapa. O mês atual aparece inteiro, grátis.',
  semMapa: 'A Previsão sai do mesmo mapa: só precisa da sua data de nascimento. O mês atual é grátis.',
};

const EXEMPLO = { data: '1990-12-25', rotulo: '25/12/1990' };

const FAQ = [
  {
    p: 'A Previsão do Ano é astrologia?',
    r: 'Não. É numerologia: o cálculo usa só o dia e o mês do seu nascimento e o ano em que você está. Não depende da hora nem da cidade.',
  },
  {
    p: 'Quando o meu Ano Pessoal muda?',
    r: 'Na virada do ano, em 1º de janeiro. Por isso a Previsão mostra os 12 meses a partir de agora: quando passa de dezembro, ela já entra no ano seguinte.',
  },
  {
    p: 'Ela prevê o que vai acontecer?',
    r: 'Não. Ela mostra o tema de cada ciclo, o que costuma render e o que costuma dar errado, pra você planejar com antecedência. O que acontece continua dependendo das suas escolhas.',
  },
  {
    p: 'O que são os números 11, 22 e 33?',
    r: 'São os números mestres. Quando a soma dá um deles, ele não é reduzido: o ciclo tem o tema do número de base (2, 4 ou 6) com mais intensidade.',
  },
];

function contaDoAno(dataISO, ano) {
  const [, mes, dia] = dataISO.split('-').map(Number);
  const digitos = `${dia}${mes}${ano}`.split('');
  return { digitos, soma: digitos.reduce((t, d) => t + Number(d), 0), resultado: calcularAnoPessoal(dataISO, ano) };
}

export default function PrevisaoDoAnoPage() {
  const ano = new Date().getFullYear();
  const exemplo = contaDoAno(EXEMPLO.data, ano);
  const ciclos = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({ n, ...MES_TEMA[n] }));

  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: 'O que é a Previsão do Ano', description, url, inLanguage: 'pt-BR', publisher: { '@type': 'Organization', name: 'Intuitive Concept' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(({ p, r }) => ({ '@type': 'Question', name: p, acceptedAnswer: { '@type': 'Answer', text: r } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Previsão do Ano', item: url },
    ] },
  ];

  return (
    <div className={b.blog}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonSeguro(jsonLd) }} />
      <SiteNav active="previsao-guia" />

      <article className={`${b.ctr} ${b.post}`}>
        <div className={b.coluna}>
          <nav className={s.migalhas} aria-label="Você está em">
            <Link href="/">Início</Link><span aria-hidden="true">/</span><span>Previsão do Ano</span>
          </nav>
          <header className={b.postTopo}>
            <span className={b.rotulo}><b>Guia do zero</b> · Numerologia</span>
            <h1 className={b.postTitulo}>O que é a <em style={{ color: 'var(--ouro)' }}>Previsão do Ano</em>?</h1>
            <p className={b.postResumo}>
              Os seus próximos 12 meses, um a um: o tema de cada mês, o que ele favorece e o que pede cuidado, a partir da sua data de nascimento.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, marginTop: 6 }}>
              <BotaoMeuResultado {...BOTAO} className={b.btn} origem="topo" />
              <LinhaMeuResultado {...LINHA} className={b.rotulo} />
            </div>
          </header>
        </div>

        <div className={`${b.coluna} ${b.corpo}`}>
          <p className={s.pratica}>
            O seu Número de Vida não muda. O seu <em style={{ color: 'var(--ouro)' }}>Ano Pessoal</em> muda todo ano, e diz em que fase de um ciclo de 9 anos você está agora.
          </p>

          <h2>O ciclo de 9 anos</h2>
          <p>
            Na numerologia, a vida anda em ciclos de 9 anos. O ano 1 abre o ciclo com começos; o 9 fecha, com o que precisa terminar pra outro ciclo nascer. Cada ano do meio tem a sua tarefa, e forçar a tarefa de outro ano costuma custar caro: tentar colher num ano de plantio, ou começar tudo de novo num ano de fechamento.
          </p>

          <h2>Como se calcula</h2>
          <p>
            Some os algarismos do dia e do mês do seu nascimento com os do ano em que você está, e reduza até sobrar um número de 1 a 9 (11, 22 e 33 ficam como estão).
          </p>
          <p className={s.conta}>
            {EXEMPLO.rotulo} em {ano}: {exemplo.digitos.join(' + ')} = {exemplo.soma}
            {exemplo.soma !== exemplo.resultado ? ` → ${exemplo.resultado}` : ''}
          </p>
          <p>
            O <strong>Mês Pessoal</strong> é o Ano Pessoal somado ao número do mês. É ele que dá o tema de cada um dos 12 meses da Previsão.
          </p>

          <h2>O que cada número pede</h2>
          <ol className={s.perguntas}>
            {ciclos.map(({ n, titulo, foco }) => (
              <li key={n}><strong>{titulo}.</strong> {foco[0]}.</li>
            ))}
          </ol>

          <h2>O que vem na sua Previsão</h2>
          <ul>
            <li>Os 12 meses a partir de agora, cada um com o Mês Pessoal e o tema.</li>
            <li>Um texto por mês explicando o que está em jogo naquele ciclo.</li>
            <li>O que o mês favorece e o que costuma sair errado se você não prestar atenção.</li>
          </ul>
          <p>
            O mês atual aparece inteiro, grátis, junto com o tema dos dois seguintes. Os 12 meses completos fazem parte do Intuitive Completo, e quem compra o Manual do seu Mapa ganha 30 dias dele. <Link className={s.link} href="/planos">Compare as opções</Link>.
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
            Quer entender o número que não muda? Veja <Link className={s.link} href="/numerologia">os Números de Vida</Link>.
          </p>

          <div className={b.ctaFim}>
            <p className={b.ctaFimTexto}>Veja o tema dos seus próximos 12 meses.</p>
            <BotaoMeuResultado {...BOTAO} className={b.btn} origem="fim" />
            <LinhaMeuResultado {...LINHA} className={b.rotulo} />
          </div>
        </div>
      </article>
    </div>
  );
}
