// lib/elevenlabs.js — narração do Reels pelo ElevenLabs. SÓ SERVIDOR.
//   POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps
//   modelo eleven_multilingual_v2, MP3 44,1 kHz 128 kbps
// Devolve o áudio (base64 → Buffer) e o alinhamento por caractere, que
// lib/reelsRoteiro.js (palavrasDoAlinhamento) transforma no tempo de cada
// palavra da legenda.
// Variáveis: ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, ELEVENLABS_LIMITE_MES
// (caracteres por mês, padrão 25000; a conta é feita em social_narracao_uso,
// migração 0028, por lib/socialServidor.js).

export const ELEVENLABS_API = 'https://api.elevenlabs.io/v1';
export const MODELO_TTS = 'eleven_multilingual_v2';
export const LIMITE_MES_PADRAO = 25000;

/** Limite mensal de caracteres (ELEVENLABS_LIMITE_MES; inválido = padrão). */
export function limiteMensal(valor = process.env.ELEVENLABS_LIMITE_MES) {
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : LIMITE_MES_PADRAO;
}

/** A narração está configurada (chave e voz)? */
export const narracaoConfigurada = () => Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID);

/** "AAAA-MM" de um instante no relógio de Brasília (o mês da conta de caracteres). */
export function mesBrasilia(agora = Date.now()) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).formatToParts(new Date(agora));
  const v = Object.fromEntries(p.map((x) => [x.type, x.value]));
  return `${v.year}-${v.month}`;
}

/** Cabe no limite do mês? usado = caracteres já narrados no mês. */
export const cabeNoLimite = ({ usado, texto, limite = limiteMensal() }) => usado + String(texto || '').length <= limite;

/**
 * Narra o texto. Lança com a mensagem do ElevenLabs se der erro.
 * @returns {Promise<{ audio: Buffer, alinhamento: object, duracao: number, caracteres: number }>}
 */
export async function narrar({ texto, apiKey = process.env.ELEVENLABS_API_KEY, voiceId = process.env.ELEVENLABS_VOICE_ID, fetchFn = fetch }) {
  if (!apiKey || !voiceId) throw new Error('ELEVENLABS_API_KEY ou ELEVENLABS_VOICE_ID não configurada');
  const url = `${ELEVENLABS_API}/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=mp3_44100_128`;
  let res;
  try {
    res = await fetchFn(url, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        text: texto,
        model_id: MODELO_TTS,
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true },
      }),
    });
  } catch (err) {
    throw new Error(`ElevenLabs sem resposta (${err.cause?.code || err.message})`);
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const d = json?.detail;
    throw new Error(`ElevenLabs: ${(typeof d === 'string' ? d : d?.message) || `HTTP ${res.status}`}`);
  }
  const al = json?.alignment;
  if (!json?.audio_base64 || !al?.characters?.length) throw new Error('ElevenLabs não devolveu o áudio com o alinhamento');
  const fins = al.character_end_times_seconds || [];
  return {
    audio: Buffer.from(json.audio_base64, 'base64'),
    alinhamento: al,
    duracao: Number(fins[fins.length - 1]) || 0,
    caracteres: String(texto).length,
  };
}
