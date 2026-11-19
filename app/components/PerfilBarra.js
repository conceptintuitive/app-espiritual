'use client';

// Barrinha acima do resultado das ferramentas grátis: diz de quem é o mapa
// mostrado e deixa trocar de pessoa sem perder o perfil salvo (lib/perfilLocal.js).

import { limparPerfil, salvarPerfil } from '@/lib/perfilLocal';

const dataBR = (iso) => iso.split('-').reverse().join('/');

/**
 * @param {{ perfil: object|null, mostrando: { nome?: string, data: string, hora?: string|null, cidade?: object|null },
 *   onOutraPessoa: () => void, onVoltarPraMim: () => void, onMudou?: () => void }} props
 */
export default function PerfilBarra({ perfil, mostrando, onOutraPessoa, onVoltarPraMim, onMudou }) {
  if (!mostrando) return null;
  const ehMeu = perfil && perfil.dataNascimento === mostrando.data;

  return (
    <div className="pb">
      {ehMeu ? (
        <>
          <span>
            ✓ Seu perfil{perfil.nome ? ` (${perfil.nome})` : ''} · {dataBR(perfil.dataNascimento)} · salvo só neste aparelho
          </span>
          <span className="pb-acoes">
            <button type="button" onClick={onOutraPessoa}>Calcular pra outra pessoa</button>
            <button type="button" onClick={() => { limparPerfil(); onMudou?.(); }}>Apagar</button>
          </span>
        </>
      ) : (
        <>
          <span>Mostrando o mapa de {mostrando.nome || 'outra pessoa'} ({dataBR(mostrando.data)}).</span>
          <span className="pb-acoes">
            <button
              type="button"
              onClick={() => {
                salvarPerfil({ nome: mostrando.nome, dataNascimento: mostrando.data, hora: mostrando.hora ?? null, cidade: mostrando.cidade || null });
                onMudou?.();
              }}
            >
              Usar como meu perfil
            </button>
            {perfil && <button type="button" onClick={onVoltarPraMim}>Voltar pro meu</button>}
          </span>
        </>
      )}
      <style>{`
        .pb { max-width: 760px; margin: 18px auto 0; padding: 10px 14px; box-sizing: border-box; display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; justify-content: space-between;
          border: 1px solid rgba(216,180,254,0.18); border-radius: 14px; background: rgba(139,92,246,0.06); color: rgba(233,213,255,0.8);
          font-family: 'Cormorant Garamond', Georgia, serif; font-size: 15px; }
        @media (max-width: 800px) { .pb { margin-left: 14px; margin-right: 14px; } }
        .pb-acoes { display: flex; gap: 12px; flex-wrap: wrap; }
        .pb button { background: none; border: 0; padding: 0; color: #f5d48a; font: inherit; text-decoration: underline; cursor: pointer; }
      `}</style>
    </div>
  );
}
