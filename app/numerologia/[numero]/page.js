// /numerologia/numero-N — um Número de Vida por página (1–9 e os mestres 11,
// 22, 33). Server Component estático, no visual da Minha Área (nov/2026). Sem
// IA: a tabela NUMERO_PROFUNDO de lib/manualgenerator.js (a mesma do bot de
// comentários: essência, força, sombra, caminho), a conta de um exemplo
// (lib/social.js#contaNumeroVida) e a ponte com o Arcano de mesmo número
// (lib/seoTarot.js). Client só o menu e o CtaMapa (link pro quiz).

import { notFound } from 'next/navigation';
import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import CtaMapa from '@/app/components/CtaMapa';
import { NUMEROS_VIDA, dadosDoNumero } from '@/lib/seoConteudo';
import {
  BASE_URL, arcanoDoNumero, arcanosQueReduzem, numeroDoArcano, exemploDoNumero, metaDoNumero, jsonLdDaPagina, jsonSeguro,
} from '@/lib/seoTarot';
import { postDoNumero } from '@/lib/blogPosts';
import b from '@/app/blog/blog.module.css';
import s from '@/app/components/seo/seo.module.css';

export const dynamicParams = false;

function parseNumero(raw) {
  return parseInt(String(raw || '').replace(/^numero-/, ''), 10);
}

const maiuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

export function generateStaticParams() {
  return NUMEROS_VIDA.map((numero) => ({ numero: `numero-${numero}` }));
}

export async function generateMetadata({ params }) {
  const { numero: raw } = await params;
  const numero = parseNumero(raw);
  const dados = dadosDoNumero(numero);
  if (!dados) return { title: 'Número não encontrado | Intuitive Concept' };
  const { title, description } = metaDoNumero(numero, dados.perfil);
  const url = `${BASE_URL}/numerologia/numero-${numero}`;
  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, locale: 'pt_BR', type: 'article' },
  };
}

export default async function NumeroPage({ params }) {
  const { numero: raw } = await params;
  const numero = parseNumero(raw);
  const dados = dadosDoNumero(numero);
  if (!dados) notFound();

  const { perfil, mestre } = dados;
  const { description, lead } = metaDoNumero(numero, perfil);
  const exemplo = exemploDoNumero(numero);
  const arcano = arcanoDoNumero(numero);
  const reduzem = arcanosQueReduzem(numero);
  const outros = NUMEROS_VIDA.filter((n) => n !== numero);
  const post = postDoNumero(numero);
  const jsonLd = jsonLdDaPagina({
    titulo: `Número ${numero} na Numerologia`,
    descricao: description,
    caminho: `/numerologia/numero-${numero}`,
    migalhas: [['Início', '/'], ['Numerologia', '/numerologia'], [`Número ${numero}`, `/numerologia/numero-${numero}`]],
    sobre: `Número de Vida ${numero}`,
  });

  return (
    <div className={b.blog}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonSeguro(jsonLd) }} />
      <SiteNav active="numerologia" />

      <article className={`${b.ctr} ${b.post}`}>
        <div className={b.coluna}>
          <nav className={s.migalhas} aria-label="Você está em">
            <Link href="/">Início</Link><span aria-hidden="true">/</span><Link href="/numerologia">Numerologia</Link><span aria-hidden="true">/</span><span>Número {numero}</span>
          </nav>
          <header className={b.postTopo}>
            <span className={s.numeroGrande} aria-hidden="true">{numero}</span>
            <span className={b.rotulo}><b>Número de Vida</b>{mestre ? ' · Número Mestre' : ''}</span>
            <h1 className={b.postTitulo}>Número {numero} na Numerologia</h1>
            <p className={b.postResumo}>{lead}</p>
          </header>
        </div>

        <div className={`${b.coluna} ${b.corpo}`}>
          <h2>A força do {numero}</h2>
          <p>A força de quem tem o Número {numero}: {perfil.forca}.</p>

          <h2>A sombra do {numero}</h2>
          <p>O lado que pede atenção: {perfil.sombra}.</p>

          <h2>O caminho do {numero}</h2>
          <p className={s.pratica}>{maiuscula(perfil.cura)}.</p>

          {mestre && (
            <p>O {numero} é um Número Mestre: a conta para nele em vez de seguir até um dígito só. Carrega mais potência e também mais exigência do que os números de 1 a 9.</p>
          )}

          <h2>Como saber se o seu número é {numero}</h2>
          <p>Some todos os dígitos da sua data de nascimento e vá somando o resultado até sobrar um dígito só (11, 22 e 33 ficam como estão).</p>
          {exemplo && (
            <p>Exemplo, nascimento em {exemplo.data}: <span className={s.conta}>{exemplo.etapas.join(' → ')}</span>.</p>
          )}

          {(arcano || reduzem.length > 0) && (
            <>
              <h2>O {numero} no Tarô</h2>
              <p>
                {arcano && <>O Arcano {numero} é <Link href={`/tarot/${arcano.slug}`} className={s.link}>{arcano.nome}</Link>. </>}
                {reduzem.length > 0 && (
                  <>
                    Somando os dígitos, também chegam ao {numero}:{' '}
                    {reduzem.map((x, i) => (
                      <span key={x.slug}>
                        {i > 0 ? (i === reduzem.length - 1 ? ' e ' : ', ') : ''}
                        <Link href={`/tarot/${x.slug}`} className={s.link}>{x.nome}</Link> (<span className={s.conta}>{numeroDoArcano(x.id).conta}</span>)
                      </span>
                    ))}
                    .
                  </>
                )}
              </p>
            </>
          )}

          {post && (
            <p>No blog, mais sobre o {numero}: <Link href={`/blog/${post.slug}`} className={s.link}>{post.title}</Link>.</p>
          )}

          <div className={b.ctaFim}>
            <p className={b.ctaFimTexto}>Quer ver o que o seu próprio mapa diz sobre você?</p>
            <CtaMapa className={b.btn} origem="numerologia" />
          </div>
        </div>

        <section className={`${b.coluna} ${b.leia}`} aria-labelledby="outros">
          <h2 id="outros" className={b.leiaTitulo}>Outros números</h2>
          <div className={s.chips}>
            {outros.map((n) => <Link key={n} href={`/numerologia/numero-${n}`} className={s.chip}>Número {n}</Link>)}
            <Link href="/tarot" className={s.chip}>Os 22 Arcanos do Tarô</Link>
          </div>
        </section>
      </article>
    </div>
  );
}
