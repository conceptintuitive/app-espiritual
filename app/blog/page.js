'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import { BLOG_POSTS, formatPostDate } from '@/lib/blogPosts';

export default function BlogIndexPage() {
  useEffect(() => {
    const stars = document.getElementById('stars');
    if (!stars) return;
    const count = window.innerWidth < 768 ? 60 : 130;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      s.style.opacity = String(0.2 + Math.random() * 0.7);
      s.style.transform = `scale(${0.6 + Math.random() * 1.5})`;
      s.style.animationDelay = Math.random() * 3 + 's';
      stars.appendChild(s);
    }
    return () => { stars.innerHTML = ''; };
  }, []);

  return (
    <div className="wrap">
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div id="stars" className="stars" />
      <SiteNav active="blog" />

      <div className="content">
        <p className="eyebrow">Toda semana</p>
        <h1>Blog Intuitive Concept</h1>
        <p className="sub">Trânsitos, luas e numerologia do mês — pra ir além do seu mapa.</p>

        <div className="grid">
          {BLOG_POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="post-card">
              <div className={`cover cover-${post.cover}`}>{post.coverGlyph}</div>
              <div className="post-body">
                <span className="post-date">{formatPostDate(post.date)}</span>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <span className="post-link">Ler mais →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx global>{`
        body { margin: 0; }
        :root {
          --bg1: #0a0118; --bg2: #130828;
          --primary: #ec4899; --secondary: #8b5cf6; --warning: #f59e0b;
          --text: #faf5ff; --muted: rgba(233,213,255,0.72);
          --border: rgba(216,180,254,0.15); --border-strong: rgba(216,180,254,0.3);
        }
        .wrap { min-height: 100vh; background: var(--bg1); color: var(--text); font-family: 'Cormorant Garamond', Georgia, serif; position: relative; }
        .stars { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
        .star { position: absolute; width: 2px; height: 2px; background: #fff; border-radius: 50%; animation: twinkle 3.4s ease-in-out infinite; }
        @keyframes twinkle { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.9; } }

        .content { position: relative; z-index: 1; max-width: 900px; margin: 0 auto; padding: 56px 20px 100px; text-align: center; }
        .eyebrow { font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--secondary); margin: 0 0 12px; }
        h1 { font-family: 'Cinzel', serif; font-weight: 700; font-size: clamp(28px, 5vw, 38px); margin: 0 0 10px; }
        .sub { color: var(--muted); font-size: 19px; margin: 0 0 44px; }

        .grid { display: grid; grid-template-columns: 1fr; gap: 18px; text-align: left; }
        @media (min-width: 640px) { .grid { grid-template-columns: 1fr 1fr; } }

        .post-card { border-radius: 18px; overflow: hidden; background: var(--bg2); border: 1px solid var(--border); display: flex; flex-direction: column; text-decoration: none; color: var(--text); transition: border-color 0.2s ease; }
        .post-card:hover { border-color: var(--border-strong); }
        .cover { height: 128px; display: flex; align-items: center; justify-content: center; font-size: 34px; }
        .cover-a { background: linear-gradient(135deg, #4c1d95, #831843); }
        .cover-b { background: linear-gradient(135deg, #1e1b4b, #6d28d9); }
        .cover-c { background: linear-gradient(135deg, #701a75, #1e1b4b); }
        .cover-d { background: linear-gradient(135deg, #831843, #3730a3); }
        .post-body { padding: 18px 20px 22px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .post-date { font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--warning); }
        .post-body h3 { font-size: 19px; font-weight: 600; margin: 0; line-height: 1.35; }
        .post-body p { font-size: 15px; color: var(--muted); line-height: 1.55; margin: 0; flex: 1; }
        .post-link { margin-top: 6px; font-family: 'Cinzel', serif; font-size: 12.5px; letter-spacing: 0.08em; color: var(--primary); }
      `}</style>
    </div>
  );
}
