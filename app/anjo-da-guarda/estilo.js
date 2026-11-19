// CSS compartilhado por /anjo-da-guarda e /anjo-da-guarda/[anjo] (mesma paleta do /astrologia-chinesa).
export const FONTES_ANJO = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap';

export const CSS_ANJO = `
  body { margin: 0; }
  .an-wrap {
    --bg1: #0a0118; --bg2: #130828;
    --primary: #ec4899; --secondary: #8b5cf6; --ouro: #f5d48a;
    --text: #faf5ff; --muted: rgba(233,213,255,0.72);
    --border: rgba(216,180,254,0.15); --border-strong: rgba(216,180,254,0.3);
    min-height: 100vh; background: radial-gradient(ellipse at 50% -10%, rgba(245,212,138,0.12), transparent 55%), linear-gradient(180deg, var(--bg1), var(--bg2));
    color: var(--text); font-family: 'Cormorant Garamond', Georgia, serif; padding-bottom: 80px;
  }
  .an-hero { text-align: center; padding: 48px 20px 8px; }
  .an-glyph { font-size: 38px; color: var(--ouro); display: block; letter-spacing: 0.3em; }
  .an-wrap h1 { font-family: 'Cinzel', serif; font-weight: 700; font-size: clamp(24px, 5vw, 34px); margin: 14px auto 10px; max-width: 660px; text-wrap: balance; }
  .an-tagline { font-size: 19px; color: var(--muted); max-width: 580px; margin: 0 auto 28px; line-height: 1.55; }

  .an-form { max-width: 440px; margin: 0 auto; padding: 22px 20px; display: grid; gap: 14px; border: 1px solid var(--border); border-radius: 18px; background: rgba(245,212,138,0.05); }
  @media (max-width: 480px) { .an-form { margin: 0 14px; } }
  .an-form label { display: grid; gap: 6px; font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
  .an-hint { text-transform: none; letter-spacing: 0; font-family: 'Cormorant Garamond', serif; font-size: 14px; opacity: 0.8; }
  .an-input { width: 100%; box-sizing: border-box; background: rgba(10,1,24,0.8); color: var(--text); border: 1px solid var(--border-strong); border-radius: 12px; padding: 12px 14px; font-family: 'Cormorant Garamond', serif; font-size: 18px; color-scheme: dark; }
  .an-input:disabled { opacity: 0.4; }
  .an-form .an-check { display: flex; align-items: center; gap: 8px; text-transform: none; letter-spacing: 0; font-family: 'Cormorant Garamond', serif; font-size: 17px; }
  .an-erro { color: #fca5a5; margin: 0; font-size: 16px; }
  .an-btn { display: inline-block; text-align: center; text-decoration: none; font-family: 'Cinzel', serif; font-weight: 700; font-size: 15px; letter-spacing: 0.06em; color: #1a0b2e; background: linear-gradient(135deg, #f5d48a, #f0abfc); border: 0; border-radius: 999px; padding: 15px 22px; cursor: pointer; }
  .an-btn.sec { background: transparent; color: var(--text); border: 1px solid var(--border-strong); }
  .an-priv { text-align: center; font-size: 14px; color: var(--muted); margin: 0; }

  .an-sec { max-width: 760px; margin: 0 auto; padding: 36px 20px 0; scroll-margin-top: 16px; }
  .an-wrap h2 { font-family: 'Cinzel', serif; font-size: clamp(20px, 4vw, 26px); margin: 40px 0 6px; text-wrap: balance; }
  .an-wrap h3 { font-family: 'Cinzel', serif; font-size: 16px; margin: 24px 0 6px; color: var(--ouro); letter-spacing: 0.05em; }
  .an-sec p, .an-sec li { font-size: 19px; line-height: 1.6; }
  .an-eyebrow { font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ouro); }
  .an-lead { font-size: 21px; color: var(--muted); }
  .an-nota { font-size: 16px; color: var(--muted); border-left: 2px solid var(--ouro); padding-left: 12px; }

  .an-card { border: 1px solid var(--border-strong); border-radius: 22px; padding: 28px 22px; background: linear-gradient(160deg, rgba(245,212,138,0.09), rgba(139,92,246,0.07) 60%, rgba(10,1,24,0.4)); text-align: center; }
  .an-nome { font-family: 'Cinzel', serif; font-weight: 900; font-size: clamp(34px, 9vw, 54px); letter-spacing: 0.04em; margin: 6px 0 2px; color: var(--ouro); }
  .an-num { font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 0.2em; color: var(--muted); text-transform: uppercase; }
  .an-dom { font-size: 23px; font-style: italic; margin: 8px 0 0; }

  .an-ficha { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin: 18px 0 0; padding: 0; list-style: none; }
  .an-ficha li { border: 1px solid var(--border); border-radius: 14px; padding: 12px 14px; font-size: 17px; line-height: 1.35; }
  .an-ficha b { display: block; font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); font-weight: 500; margin-bottom: 4px; }

  .an-pedir { padding-left: 20px; }
  .an-duo { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin-top: 12px; }
  .an-mini { display: block; border: 1px solid var(--border); border-radius: 16px; padding: 16px; text-decoration: none; color: var(--text); background: rgba(139,92,246,0.05); }
  .an-mini .an-eyebrow { display: block; }
  .an-mini strong { display: block; font-family: 'Cinzel', serif; font-size: 22px; color: var(--ouro); margin: 6px 0 2px; }
  .an-mini span.an-sub { font-size: 17px; color: var(--muted); }

  .an-cta { margin: 36px 0 0; padding: 24px 20px; border: 1px solid var(--border-strong); border-radius: 20px; background: rgba(236,72,153,0.07); text-align: center; }
  .an-cta p { margin: 0 0 16px; }
  .an-cta-btns { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }

  .an-lista { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 8px; margin: 16px 0 0; padding: 0; list-style: none; }
  .an-lista a { display: flex; gap: 10px; align-items: baseline; padding: 10px 12px; border: 1px solid var(--border); border-radius: 12px; text-decoration: none; color: var(--text); font-size: 17px; }
  .an-lista a:hover { border-color: var(--ouro); }
  .an-lista .n { font-family: 'Cinzel', serif; font-size: 12px; color: var(--muted); min-width: 22px; }
  .an-lista .d { margin-left: auto; font-size: 14px; color: var(--muted); white-space: nowrap; }
  .an-lista .eu { border-color: var(--ouro); background: rgba(245,212,138,0.08); }

  .an-nav { display: flex; justify-content: space-between; gap: 10px; margin-top: 36px; flex-wrap: wrap; }
  .an-nav a { color: var(--muted); text-decoration: none; font-size: 17px; }
  .an-link { color: var(--ouro); }
`;
