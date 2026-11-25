// Testes do Reels interativo (lib/reelsInterativo.js) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FORMATO_POR_DIA, formatoDoDia, cartasDoDia, praticasDoDia, reduzirDia, exemploDoDia, numerosDoSite, essenciaCurta, porExtenso,
  roteiroInterativo, textoDoSegmento, textoDoRoteiro, linhaDoTempo, cenaCarta, cenaPausa, cenaNumero, legendaInterativa,
  CONTADOR_S, FLASH_S, N_FLASH,
} from '../lib/reelsInterativo.js';
import { contarPalavras, palavrasDoAlinhamento } from '../lib/reelsRoteiro.js';
import { problemasDoTexto } from '../lib/socialEditorial.js';
import { ARCANOS_MAIORES } from '../lib/tarot.js';
import { TEMAS } from '../lib/seuDiaTextos.js';
import { NUMERO_PROFUNDO } from '../lib/manualgenerator.js';
import { numeroEscolhido, respostaInterativa, decidirResposta, CTA_RESPOSTA, ABERTURAS_CARTA, variacaoDaCarta } from '../lib/socialComentarios.js';
import { REFLEXAO_ARCANOS } from '../lib/tarotReflexao.js';
import { montarLegenda } from '../lib/social.js';

const F = { arcanos: ARCANOS_MAIORES, temasSeuDia: TEMAS, numeroProfundo: NUMERO_PROFUNDO };
// 30/11/2026 = segunda
const SEMANA = ['2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05'];

test('rodízio: carta 2x, pausa 1x, número 1x, narrado nos outros 3 dias', () => {
  assert.deepEqual(SEMANA.map(formatoDoDia), ['narrado', 'numero', 'carta', 'pausa', 'narrado', 'narrado', 'carta']);
  const conta = (f) => FORMATO_POR_DIA.filter((x) => x === f).length;
  assert.deepEqual([conta('carta'), conta('pausa'), conta('numero'), conta('narrado')], [2, 1, 1, 3]);
});

test('cartas: 3 diferentes, do tarô do site, sempre as mesmas no mesmo dia', () => {
  const a = cartasDoDia('2026-12-01', ARCANOS_MAIORES);
  assert.equal(a.length, 3);
  assert.equal(new Set(a.map((c) => c.id)).size, 3);
  assert.deepEqual(a.map((c) => c.posicao), [1, 2, 3]);
  for (const c of a) {
    const orig = ARCANOS_MAIORES.find((x) => x.id === c.id);
    assert.equal(c.nome, orig.nome);
    assert.ok(orig.significado.startsWith(c.frase), 'a mensagem é a 1ª frase do significado do site');
  }
  assert.deepEqual(cartasDoDia('2026-12-01', ARCANOS_MAIORES), a, 'determinístico');
  const outros = ['2026-12-05', '2026-12-08', '2026-12-12'].map((d) => cartasDoDia(d, ARCANOS_MAIORES).map((c) => c.id).join());
  assert.ok(new Set([a.map((c) => c.id).join(), ...outros]).size >= 3, 'muda de um dia pro outro');
});

test('práticas: 8, do "Faça" do Seu Dia, cobrindo os 6 temas, curtas pra 0,4s', () => {
  const p = praticasDoDia('2026-12-02', TEMAS);
  assert.equal(p.length, N_FLASH);
  assert.equal(new Set(p).size, p.length);
  const todas = Object.values(TEMAS).flatMap((t) => t.faca);
  assert.ok(p.every((x) => todas.includes(x)));
  const temas = new Set(p.map((x) => Object.keys(TEMAS).find((k) => TEMAS[k].faca.includes(x))));
  assert.equal(temas.size, Object.keys(TEMAS).length, 'uma de cada tema antes de repetir tema');
  assert.ok(p.every((x) => contarPalavras(x) <= 8));
});

test('número: redução do dia de nascimento e frases do site', () => {
  assert.deepEqual(reduzirDia(28), { numero: 1, passos: [[28, 10], [10, 1]] });
  assert.deepEqual(reduzirDia(13), { numero: 4, passos: [[13, 4]] });
  assert.deepEqual(reduzirDia(29), { numero: 2, passos: [[29, 11], [11, 2]] }, 'vai até 1 dígito');
  assert.deepEqual(reduzirDia(7), { numero: 7, passos: [] });
  assert.ok(exemploDoDia('2026-11-30') >= 10);
  assert.equal(essenciaCurta('autonomia, liderança e impulso de começo'), 'autonomia e liderança');
  const n = numerosDoSite(NUMERO_PROFUNDO);
  assert.deepEqual(n.map((x) => x.numero), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(n[3].essencia, NUMERO_PROFUNDO['4'].essencia);
  assert.deepEqual([1, 9, 13, 21, 28, 31].map(porExtenso), ['um', 'nove', 'treze', 'vinte e um', 'vinte e oito', 'trinta e um']);
});

test('roteiros: estrutura, pausa no lugar certo, fecho que pede comentário, nada proibido', () => {
  const carta = roteiroInterativo('2026-12-01', 'carta', F);
  assert.deepEqual(carta.segmentos.map((s) => s.id), ['escolha', 'revelacao']);
  assert.equal(carta.segmentos[0].pausaDepois, CONTADOR_S + 0.3, 'o contador mora no silêncio entre os trechos');
  assert.match(textoDoSegmento(carta.segmentos[0]), /um, dois ou três/);
  assert.match(textoDoSegmento(carta.segmentos[1]), /^Carta um: .+ Carta dois: .+ Carta três: .+ Comenta o número da sua carta\.$/);
  const pausa = roteiroInterativo('2026-12-02', 'pausa', F);
  assert.match(textoDoSegmento(pausa.segmentos[0]), /Pausa agora!$/);
  assert.ok(Math.abs(pausa.segmentos[0].pausaDepois - (N_FLASH * FLASH_S + 0.3)) < 1e-9);
  assert.match(textoDoRoteiro(pausa), /Comenta qual você pegou\.$/);
  const num = roteiroInterativo('2026-11-30', 'numero', F);
  assert.ok(num.segmentos[0].partes.some((p) => p.id === 'ex_passo1'));
  assert.deepEqual(num.segmentos[0].partes.filter((p) => /^n\d$/.test(p.id)).map((p) => p.id), ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9']);
  assert.match(textoDoRoteiro(num), /Comenta o seu número\.$/);
  for (const r of [carta, pausa, num]) {
    assert.deepEqual(problemasDoTexto(textoDoRoteiro(r)), []);
    assert.ok(!/\d/.test(textoDoRoteiro(r)), 'a voz fala os números por extenso');
    const w = contarPalavras(textoDoRoteiro(r));
    assert.ok(w >= 35 && w <= 95, `${r.formato}: ${w} palavras`);
  }
  assert.throws(() => roteiroInterativo('2026-12-01', 'xyz', F), /desconhecido/);
});

// narração falsa: 0,06s por caractere
const narrar = (texto) => {
  const chars = [...texto];
  return palavrasDoAlinhamento({ characters: chars, character_start_times_seconds: chars.map((_, i) => i * 0.06), character_end_times_seconds: chars.map((_, i) => (i + 1) * 0.06) });
};
const linha = (r) => linhaDoTempo(r, r.segmentos.map((s) => ({ id: s.id, palavras: narrar(textoDoSegmento(s)) })));

test('linha do tempo da carta: trechos com o silêncio do contador, cada carta vira quando a voz diz "Carta N"', () => {
  const r = roteiroInterativo('2026-12-01', 'carta', F);
  const l = linha(r);
  assert.equal(l.vozes[0].inicio, 0.5);
  const fimEscolha = l.palavras[contarPalavras(textoDoSegmento(r.segmentos[0])) - 1].fim;
  assert.ok(Math.abs(l.vozes[1].inicio - (fimEscolha + CONTADOR_S + 0.3)) < 0.002);
  assert.ok(l.eventos.contador.ini > fimEscolha && l.eventos.contador.fim < l.vozes[1].inicio);
  // a carta 2 vira exatamente na palavra "Carta" do 2º anúncio
  const idx = l.palavras.findIndex((w, i) => w.texto === 'Carta' && l.palavras[i + 1].texto === 'dois:');
  assert.equal(l.eventos.revelar[1], l.palavras[idx].ini);
  assert.ok(l.eventos.revelar[0] < l.eventos.revelar[1] && l.eventos.revelar[1] < l.eventos.revelar[2]);
  // "um, dois ou três" do pedido: cada carta acende quando a voz diz o número dela
  const [a1, a2, a3] = l.eventos.apontar;
  assert.ok(a1 && a1 < a2 && a2 < a3 && a3 < l.eventos.contador.ini, 'aponta as 3 antes do contador');
  assert.equal(l.palavras.find((w) => w.ini === a2).texto, 'dois');
  assert.equal(l.duracao, Math.ceil((l.palavras.at(-1).fim + 1.2) * 30) / 30);
  // cena: de costas → contador 3,2,1 → vira
  assert.deepEqual(cenaCarta(l.eventos, 0).angulos, [0, 0, 0]);
  const c = l.eventos.contador;
  assert.deepEqual([c.ini + 0.1, c.ini + 1.1, c.ini + 2.1].map((t) => cenaCarta(l.eventos, t).contador), [3, 2, 1]);
  assert.equal(cenaCarta(l.eventos, c.fim + 0.01).contador, null);
  const r1 = l.eventos.revelar[0];
  assert.equal(cenaCarta(l.eventos, r1 + 0.3).angulos[0], 90);
  assert.deepEqual(cenaCarta(l.eventos, l.duracao).angulos, [180, 180, 180]);
});

test('linha do tempo da pausa e do número: rajada de 0,4s e número aceso quando a voz fala', () => {
  const lp = linha(roteiroInterativo('2026-12-02', 'pausa', F));
  const raj = lp.eventos.rajada;
  assert.equal(raj.n, N_FLASH);
  assert.equal(cenaPausa(lp.eventos, raj.ini - 0.01), -1);
  assert.equal(cenaPausa(lp.eventos, raj.ini + 0.01), 0);
  assert.equal(cenaPausa(lp.eventos, raj.ini + 0.41), 1);
  assert.equal(cenaPausa(lp.eventos, raj.ini + N_FLASH * FLASH_S - 0.01), N_FLASH - 1);
  assert.equal(cenaPausa(lp.eventos, raj.ini + N_FLASH * FLASH_S), -1);
  assert.ok(lp.vozes[1].inicio > raj.ini + N_FLASH * FLASH_S, 'a explicação vem depois da rajada');

  const rn = roteiroInterativo('2026-11-30', 'numero', F);
  const ln = linha(rn);
  assert.deepEqual(cenaNumero(ln.eventos, 0), { passosVisiveis: 0, listaVisivel: false, aceso: 0 });
  assert.equal(cenaNumero(ln.eventos, ln.eventos.exemplo[0] + 0.01).passosVisiveis, 1);
  assert.equal(cenaNumero(ln.eventos, ln.eventos.numeros[6] + 0.01).aceso, 7);
  assert.equal(cenaNumero(ln.eventos, ln.duracao).aceso, 9);
  assert.throws(() => linhaDoTempo(rn, [{ id: 'outro', palavras: [] }]), /faltou a narração/);
});

test('comentário: número escolhido (1–3 na carta, 1–9 no número), datas e frases longas ficam de fora', () => {
  const ok = { 2: '2', 3: 'carta 3', 1: 'Escolhi a 1!', 7: 'sou 7 ✨' };
  for (const [n, t] of Object.entries(ok)) assert.equal(numeroEscolhido(t, 9), Number(n), t);
  assert.equal(numeroEscolhido('a dois', 3), 2);
  assert.equal(numeroEscolhido('Três', 3), 3);
  assert.equal(numeroEscolhido('4', 3), null, 'fora das 3 cartas');
  assert.equal(numeroEscolhido('14/07/1990', 9), null, 'data não é escolha (o bot de data cuida)');
  assert.equal(numeroEscolhido('2 e 3', 3), null);
  assert.equal(numeroEscolhido('a 2 é linda demais, amei esse post', 3), null);
  assert.equal(numeroEscolhido('amei', 3), null);
  assert.equal(numeroEscolhido('10', 9), null);
});

test('resposta: carta (abertura + significado + prática + 1 pergunta) e número + chamada; outro formato não responde', () => {
  const cartas = cartasDoDia('2026-12-01', ARCANOS_MAIORES);
  const rc = respostaInterativa({ formato: 'carta', dataISO: '2026-12-01', texto: '2', id: 'c1' });
  const r2 = REFLEXAO_ARCANOS[cartas[1].id];
  const v = variacaoDaCarta('c1');
  assert.equal(rc, `${ABERTURAS_CARTA[v.abertura](2, cartas[1].nome)} ${r2.central} ${r2.pratica} ${r2.perguntas[v.pergunta]} ${CTA_RESPOSTA}`);
  // 40 comentários "2": abertura e pergunta variam, a carta é sempre a 2 do dia
  const modelos = Array.from({ length: 40 }, (_, k) => respostaInterativa({ formato: 'carta', dataISO: '2026-12-01', texto: 'carta 2', id: `id-${k}` }));
  assert.ok(new Set(modelos).size >= 10, `${new Set(modelos).size} textos diferentes em 40`);
  assert.equal(new Set(modelos.map((t) => t.split('.')[0])).size, ABERTURAS_CARTA.length, 'as 5 aberturas aparecem');
  for (const t of modelos) assert.ok(t.includes(cartas[1].nome) && t.includes(r2.central) && t.includes(r2.pratica) && r2.perguntas.some((q) => t.includes(q)), 'sempre a carta 2 do dia, com significado, prática e 1 pergunta');
  assert.equal(respostaInterativa({ formato: 'carta', dataISO: '2026-12-01', texto: 'carta 2', id: 'id-7' }), modelos[7], 'mesmo comentário, mesma resposta');
  const rn = respostaInterativa({ formato: 'numero', dataISO: '2026-11-30', texto: 'sou 4' });
  assert.equal(rn, `Número 4: ${NUMERO_PROFUNDO['4'].essencia}. ${CTA_RESPOSTA}`);
  // o dia inteiro ("28") é reduzido na resposta
  const r28 = respostaInterativa({ formato: 'numero', dataISO: '2026-11-30', texto: 'nasci dia 28' });
  assert.equal(r28, `2 + 8 = 10, 1 + 0 = 1. Número 1: ${NUMERO_PROFUNDO['1'].essencia}. ${CTA_RESPOSTA}`);
  assert.equal(respostaInterativa({ formato: 'numero', dataISO: '2026-11-30', texto: '32' }), null);
  assert.equal(respostaInterativa({ formato: 'carta', dataISO: '2026-12-01', texto: '4' }), null);
  assert.equal(respostaInterativa({ formato: 'pausa', dataISO: '2026-12-02', texto: '2' }), null);
  assert.equal(respostaInterativa({ formato: 'carta', dataISO: '2026-12-01', texto: 'amei' }), null);
  // a chamada é a mesma do bot de datas (CTA_RESPOSTA); a resposta inteira, chamada junto, não pode ter nada proibido
  for (const t of [...modelos, rn, r28]) assert.deepEqual(problemasDoTexto(t), []);
  assert.ok(modelos.every((t) => t.length <= 600), 'resposta curta o bastante pra ler no comentário');
});

test('bot: "2" só ganha resposta no Reels interativo do dia; ofensa e a própria conta continuam fora; data vale em qualquer post', () => {
  const interativo = { formato: 'carta', data: '2026-12-01' };
  assert.deepEqual(decidirResposta({ id: 'c1', texto: '2' }), { responder: false, motivo: 'sem data' }, 'fora do Reels interativo, "2" não é nada');
  const d = decidirResposta({ id: 'c1', texto: '2', interativo });
  assert.equal(d.responder, true);
  assert.match(d.texto, /^.+ Seu mapa é grátis: link na bio\.$/);
  assert.equal(decidirResposta({ id: 'c1', texto: '2', interativo, proprio: true }).responder, false);
  assert.equal(decidirResposta({ id: 'c1', texto: '2 porra', interativo }).motivo, 'ofensivo ou spam');
  assert.equal(decidirResposta({ id: 'c1', texto: 'que lindo', interativo }).motivo, 'sem escolha');
  assert.equal(decidirResposta({ id: 'c1', texto: '2 www.x.com', interativo }).responder, false);
  // data de nascimento completa no Reels interativo: responde com o número de vida, como em qualquer post
  assert.match(decidirResposta({ id: 'c1', texto: '14/07/1990', interativo }, new Date('2026-12-01')).texto, /número de vida|Deu|Número|→/);
  // pausa: não tem escolha numérica pra responder
  assert.equal(decidirResposta({ id: 'c1', texto: '3', interativo: { formato: 'pausa', data: '2026-12-02' } }).responder, false);
});

test('legenda do post: chamada pro comentário, hashtags do formato, promessa de resposta só com o bot ligado', () => {
  for (const [data, formato] of [['2026-12-01', 'carta'], ['2026-12-02', 'pausa'], ['2026-11-30', 'numero']]) {
    const r = roteiroInterativo(data, formato, F);
    const sem = legendaInterativa(r, { respostas: false });
    const com = legendaInterativa(r, { respostas: true });
    assert.ok(sem.gancho && sem.texto.length >= 2 && sem.hashtags.length, formato);
    assert.match(sem.texto.join(' '), /Comenta/);
    assert.doesNotMatch(sem.texto.join(' '), /responde/, 'sem o bot, não promete resposta');
    if (formato !== 'pausa') assert.match(com.texto.join(' '), /a gente te responde/);
    const final = montarLegenda(sem);
    assert.match(final, /Faz o seu mapa grátis: link na bio/);
    assert.ok(final.length < 2200, 'limite de legenda do Instagram');
    for (const t of [sem.gancho, ...sem.texto, ...com.texto]) assert.deepEqual(problemasDoTexto(t), [], t);
  }
  const n = legendaInterativa(roteiroInterativo('2026-11-30', 'numero', F));
  const { dia, numero } = roteiroInterativo('2026-11-30', 'numero', F).cena.exemplo;
  assert.match(n.texto[0], new RegExp(`dia ${dia}: .*Número ${numero}\\.`));
});

test('tabela das 22 cartas pro bot: significado em 1–2 frases, prática de hoje, 3 perguntas diferentes, dentro do guia', () => {
  assert.deepEqual(Object.keys(REFLEXAO_ARCANOS).map(Number).sort((a, b) => a - b), ARCANOS_MAIORES.map((c) => c.id));
  const frases = (t) => t.split(/(?<=[.!?])\s+/).filter(Boolean).length;
  const GENERO = /\b(sozinha|sozinho|mesma|pronta|pronto|preso|presa|cansada|cansado|sua própria)\b/i;
  for (const c of ARCANOS_MAIORES) {
    const r = REFLEXAO_ARCANOS[c.id];
    assert.ok(frases(r.central) >= 1 && frases(r.central) <= 2, `${c.nome}: significado em 1–2 frases`);
    assert.ok(!r.central.includes(c.nome), `${c.nome}: o significado não repete o nome (a abertura já diz)`);
    assert.match(r.pratica, /^Hoje, /, `${c.nome}: prática começa com "Hoje,"`);
    assert.equal(frases(r.pratica), 1, `${c.nome}: prática em 1 frase`);
    assert.equal(r.perguntas.length, 3, c.nome);
    assert.equal(new Set(r.perguntas).size, 3, `${c.nome}: perguntas diferentes`);
    for (const q of r.perguntas) assert.match(q, /\?$/, `${c.nome}: "${q}" é pergunta`);
    for (const t of [r.central, r.pratica, ...r.perguntas]) {
      assert.deepEqual(problemasDoTexto(t), [], `${c.nome}: ${t}`);
      assert.doesNotMatch(t, GENERO, `${c.nome}: sem marcar gênero: ${t}`);
    }
    // todas as 15 combinações de cada carta passam e cabem
    for (let a = 0; a < ABERTURAS_CARTA.length; a++) {
      for (const q of r.perguntas) {
        const resp = `${ABERTURAS_CARTA[a](1, c.nome)} ${r.central} ${r.pratica} ${q} ${CTA_RESPOSTA}`;
        assert.deepEqual(problemasDoTexto(resp), []);
        assert.ok(resp.length <= 600, `${c.nome}: ${resp.length} caracteres`);
      }
    }
  }
});
