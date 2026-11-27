'use client';

// Uma linha no topo da Previsão ligando o Ano Pessoal à convergência principal
// do mapa (sinteseDoMapa, sem IA). Só aparece quando a combinação existe em
// LIGACAO_COM_O_MAPA (lib/transitos12meses.js). Entra via next/dynamic: as
// contas do mapa (astrologia chinesa, anjos, Kin) ficam fora do JS inicial.

import { useMemo } from 'react';
import { sistemasDaPessoa, sinteseDoMapa } from '@/lib/mapaSintese';
import { ligacaoComOMapa } from '@/lib/transitos12meses';

/** @param {{ dados: { dataNascimento: string, hora: string|null, cidade: object|null }, anoPessoal: number, className: string }} props */
export default function LigacaoMapa({ dados, anoPessoal, className }) {
  const frase = useMemo(() => {
    try {
      const s = sinteseDoMapa(sistemasDaPessoa({ dataNascimento: dados.dataNascimento, hora: dados.hora, cidade: dados.cidade }));
      const c = s.repete[0];
      return c ? { texto: ligacaoComOMapa(anoPessoal, c), nome: c.nome } : null;
    } catch {
      return null;
    }
  }, [dados, anoPessoal]);
  if (!frase?.texto) return null;
  // Destaca o nome do tema dentro da frase.
  const [antes, depois] = frase.texto.split(frase.nome);
  return <p className={className}>{antes}<strong>{frase.nome}</strong>{depois}</p>;
}
