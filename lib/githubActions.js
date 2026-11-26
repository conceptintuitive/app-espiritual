// lib/githubActions.js
// O site dispara o workflow "Reels diário" do GitHub Actions (nov/2026).
//
// Por quê: o agendamento do GitHub (`schedule` no reels.yml) é "melhor
// esforço" e, na prática, atrasava horas ou nem rodava (25/11: 5h40 e ~13h de
// atraso; 26/11: nenhum dos dois horários). O cron de hora em hora do site
// (cron-job.org, que é pontual) passou a chamar o `workflow_dispatch` quando o
// Reels do dia ainda não saiu. O `schedule` do workflow fica como reserva: se
// ele rodar depois, o site responde "nada a fazer".
//
// Precisa de GITHUB_TOKEN_REELS: token fine-grained só do repositório, com a
// permissão "Actions: Read and write". Sem ele, nada muda (só o aviso das 12h).
// GITHUB_REPO opcional (padrão conceptintuitive/app-espiritual).

const API = 'https://api.github.com';
export const WORKFLOW_REELS = 'reels.yml';
export const MAX_DISPAROS_POR_DIA = 3;

export function configGithub(env = process.env) {
  const token = (env.GITHUB_TOKEN_REELS || '').trim();
  if (!token) return null;
  return { token, repo: (env.GITHUB_REPO || 'conceptintuitive/app-espiritual').trim(), ref: (env.GITHUB_REF_REELS || 'main').trim() };
}

function cabecalhos(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'intuitive-concept-site',
  };
}

/** Dia (AAAA-MM-DD) em Brasília de um instante ISO. */
const diaBrasilia = (iso) => new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });

/**
 * Decide se dispara, olhando as execuções do workflow:
 *   - alguma na fila ou rodando → não (evita duas ao mesmo tempo);
 *   - já disparou MAX_DISPAROS_POR_DIA vezes hoje (workflow_dispatch) → não
 *     (se o workflow está quebrado, não fica tentando o dia todo).
 * Puro: recebe a lista `workflow_runs` da API.
 * @returns {{ disparar: boolean, motivo?: string }}
 */
export function decidirDisparo(runs, hoje) {
  const ativas = runs.filter((r) => r.status === 'queued' || r.status === 'in_progress' || r.status === 'waiting' || r.status === 'pending' || r.status === 'requested');
  if (ativas.length) return { disparar: false, motivo: 'já tem uma execução na fila ou rodando' };
  const hojeManual = runs.filter((r) => r.event === 'workflow_dispatch' && diaBrasilia(r.created_at) === hoje);
  if (hojeManual.length >= MAX_DISPAROS_POR_DIA) return { disparar: false, motivo: `já disparou ${hojeManual.length} vezes hoje` };
  return { disparar: true };
}

/**
 * Dispara o workflow do Reels se fizer sentido (ver decidirDisparo).
 * @returns {Promise<{ disparado: boolean, motivo?: string }>}
 */
export async function dispararReelsSePreciso({ config, hoje, fetchImpl = globalThis.fetch }) {
  if (!config) return { disparado: false, motivo: 'sem GITHUB_TOKEN_REELS' };
  const base = `${API}/repos/${config.repo}/actions/workflows/${WORKFLOW_REELS}`;
  const lista = await fetchImpl(`${base}/runs?per_page=20`, { headers: cabecalhos(config.token) });
  if (!lista.ok) throw new Error(`GitHub (listar execuções) ${lista.status}: ${(await lista.text()).slice(0, 200)}`);
  const { workflow_runs: runs = [] } = await lista.json();
  const decisao = decidirDisparo(runs, hoje);
  if (!decisao.disparar) return { disparado: false, motivo: decisao.motivo };
  const r = await fetchImpl(`${base}/dispatches`, {
    method: 'POST',
    headers: { ...cabecalhos(config.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: config.ref }),
  });
  if (r.status !== 204) throw new Error(`GitHub (disparar workflow) ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return { disparado: true };
}
