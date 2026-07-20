import { readFileSync, writeFileSync } from 'fs';

let code = readFileSync('lib/ia.js', 'utf8').replace(/\r\n/g, '\n');

// Remove helper duplicado (deixa só o primeiro)
const helperBody = `\n// Helper interno: chama Groq com retry automático em rate limit 429
async function _callGroq(apiKey, body, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const wait = 2000 * attempt;
      console.warn(\`[IA] 429 — aguardando \${wait / 1000}s (tentativa \${attempt}/\${maxRetries})\`);
      await new Promise(r => setTimeout(r, wait));
    }
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: \`Bearer \${apiKey}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 429 && attempt < maxRetries) continue;
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('[IA] Groq erro HTTP:', res.status, txt.slice(0, 200));
      return null;
    }
    return res;
  }
  return null;
}\n`;

const firstOccurrence = code.indexOf('async function _callGroq');
const secondOccurrence = code.indexOf('async function _callGroq', firstOccurrence + 1);
if (secondOccurrence !== -1) {
  // Remove da segunda ocorrência até o fim do bloco (encontra o '\n}\n' após ela)
  const blockStart = code.lastIndexOf('\n// Helper interno', secondOccurrence);
  const blockEnd = code.indexOf('\n}\n', secondOccurrence) + 3;
  code = code.slice(0, blockStart) + code.slice(blockEnd);
  console.log('✓ helper duplicado removido');
} else {
  console.log('ℹ helper não duplicado — ok');
}

// ── 1. Insere o helper _callGroq antes da primeira função exportada ───────────
const HELPER = `
// Helper interno: chama Groq com retry automático em rate limit 429
async function _callGroq(apiKey, body, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const wait = 2000 * attempt;
      console.warn(\`[IA] 429 — aguardando \${wait / 1000}s (tentativa \${attempt}/\${maxRetries})\`);
      await new Promise(r => setTimeout(r, wait));
    }
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: \`Bearer \${apiKey}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 429 && attempt < maxRetries) continue;
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('[IA] Groq erro HTTP:', res.status, txt.slice(0, 200));
      return null;
    }
    return res;
  }
  return null;
}

`;

code = code.replace(
  'export async function gerarTipoPessoaIA',
  HELPER + 'export async function gerarTipoPessoaIA'
);

// ── 2. Substitui cada bloco fetch nos 7 exports ───────────────────────────────
function replaceExact(src, search, repl, label) {
  const idx = src.indexOf(search);
  if (idx === -1) { console.warn(`✗ ${label} — padrão não encontrado`); return src; }
  console.log(`✓ ${label}`);
  return src.slice(0, idx) + repl + src.slice(idx + search.length);
}

// Utilitário: monta o bloco antigo e novo para inline-headers (1 linha de headers)
function inlineBlock(maxTokens, errLabel, temperature = 0.75) {
  const old_ =
    `    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {\n` +
    `      method: 'POST',\n` +
    `      headers: { Authorization: \`Bearer \${apiKey}\`, 'Content-Type': 'application/json' },\n` +
    `      body: JSON.stringify({\n` +
    `        model: 'llama-3.3-70b-versatile',\n` +
    `        messages: [\n` +
    `          { role: 'system', content: systemPrompt },\n` +
    `          { role: 'user',   content: userPrompt },\n` +
    `        ],\n` +
    `        temperature: ${temperature},\n` +
    `        max_tokens: ${maxTokens},\n` +
    `        response_format: { type: 'json_object' },\n` +
    `      }),\n` +
    `    });\n` +
    `\n` +
    `    if (!res.ok) { console.error('${errLabel}', res.status); return null; }`;
  const new_ =
    `    const res = await _callGroq(apiKey, {\n` +
    `      model: 'llama-3.3-70b-versatile',\n` +
    `      messages: [\n` +
    `        { role: 'system', content: systemPrompt },\n` +
    `        { role: 'user',   content: userPrompt },\n` +
    `      ],\n` +
    `      temperature: ${temperature},\n` +
    `      max_tokens: ${maxTokens},\n` +
    `      response_format: { type: 'json_object' },\n` +
    `    });\n` +
    `    if (!res) return null;`;
  return { old: old_, new: new_ };
}

// Utilitário: monta o bloco antigo e novo para multiline-headers (amor e diagnostico)
function multilineBlock(maxTokens, errSnippet, temperature = 0.75) {
  const old_ =
    `    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {\n` +
    `      method: 'POST',\n` +
    `      headers: {\n` +
    `        Authorization: \`Bearer \${apiKey}\`,\n` +
    `        'Content-Type': 'application/json',\n` +
    `      },\n` +
    `      body: JSON.stringify({\n` +
    `        model: 'llama-3.3-70b-versatile',\n` +
    `        messages: [\n` +
    `          { role: 'system', content: systemPrompt },\n` +
    `          { role: 'user',   content: userPrompt },\n` +
    `        ],\n` +
    `        temperature: ${temperature},\n` +
    `        max_tokens: ${maxTokens},\n` +
    `        response_format: { type: 'json_object' },\n` +
    `      }),\n` +
    `    });\n\n` +
    `    if (!res.ok) {\n` +
    `      const errText = await res.text().catch(() => '');\n` +
    `      console.error('${errSnippet}', res.status, errText.slice(0, ${maxTokens > 1000 ? 300 : 200}));\n` +
    `      return null;\n` +
    `    }`;
  const new_ =
    `    const res = await _callGroq(apiKey, {\n` +
    `      model: 'llama-3.3-70b-versatile',\n` +
    `      messages: [\n` +
    `        { role: 'system', content: systemPrompt },\n` +
    `        { role: 'user',   content: userPrompt },\n` +
    `      ],\n` +
    `      temperature: ${temperature},\n` +
    `      max_tokens: ${maxTokens},\n` +
    `      response_format: { type: 'json_object' },\n` +
    `    });\n` +
    `    if (!res) return null;`;
  return { old: old_, new: new_ };
}

const patches = [
  { label: 'gerarTipoPessoaIA', ...inlineBlock(900,  '[IA] tipoPessoa erro:') },
  { label: 'gerarPlano7IA',     ...inlineBlock(1100, '[IA] plano7 erro:') },
  { label: 'gerarAmorIA',       ...multilineBlock(1400, '[IA] Groq amor erro:') },
  { label: 'gerarDiagnosticoIA',...multilineBlock(2500, '[IA] Groq erro HTTP:') },
  { label: 'gerarArquetiposIA', ...inlineBlock(1400, '[IA] arquetipos erro:', 0.8) },
  { label: 'gerarPontoCegoIA',  ...inlineBlock(700,  '[IA] pontoCego erro:') },
  { label: 'gerarBloqueiosIA',  ...inlineBlock(900,  '[IA] bloqueios erro:') },
];

for (const p of patches) {
  code = replaceExact(code, p.old, p.new, p.label);
}

// Conta fetch restantes (deve ser 1, o do helper interno)
const remaining = (code.match(/await fetch\('https:\/\/api\.groq\.com/g) || []).length;
console.log(`\nfetch restantes: ${remaining} (esperado: 1 — o do helper)`);

writeFileSync('lib/ia.js', code);
console.log('lib/ia.js salvo.\n');
