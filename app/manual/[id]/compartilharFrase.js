// Carregado só no clique em "Compartilhar" (import() em page.js): desenha o
// card da frase (app/seu-dia/cardStory.js, céu + Instrument Serif) e manda
// pro navigator.share com o arquivo; sem suporte a arquivo, baixa o PNG.

import { desenharCardFrase, canvasParaBlob } from '@/app/seu-dia/cardStory';

/** @returns {Promise<'share'|'download'|'cancelado'>} */
export async function compartilharFrase({ frase, nome, dataNascimento, hora, cidade }) {
  const cv = await desenharCardFrase({ frase, nome, dataNascimento, hora, cidade });
  const blob = await canvasParaBlob(cv);
  const arquivo = new File([blob], 'frase-do-meu-manual.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], text: 'Do meu Manual · intuitiveconcept.com.br' });
      return 'share';
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelado';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = arquivo.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'download';
}

/** Baixa o .ics do ritual (lib/ritualIcs.js), também só no clique. */
export async function baixarIcsRitual(ritual) {
  const { gerarIcsRitual, nomeArquivoIcs } = await import('@/lib/ritualIcs');
  const blob = new Blob([gerarIcsRitual(ritual)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivoIcs(ritual.nome);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
