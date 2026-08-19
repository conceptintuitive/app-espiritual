'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import { getPostBySlug, formatPostDate } from '@/lib/blogPosts';

export default function BlogPostPage() {
  const { slug } = useParams();
  const router = useRouter();
  const post = getPostBySlug(slug);

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

  if (!post) {
    return (
      <div className="wrap">
        <div id="stars" className="stars" />
        <SiteNav active="blog" />
        <div className="content">
          <h1>Post não encontrado</h1>
          <button className="back" onClick={() => router.push('/blog')}>← Voltar pro blog</button>
        </div>
        <style jsx global>{`
          body { margin: 0; }
          .wrap { min-height: 100vh; background: #0a0118; color: #faf5ff; font-family: 'Cormorant Garamond', Georgia, serif; }
          .content { max-width: 640px; margin: 0 auto; padding: 80px 20px; text-align: center; }
          .back { margin-top: 20px; background: none; border: none; color: #ec4899; font-size: 16px; cursor: pointer; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="wrap">
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div id="stars" className="stars" />
      <SiteNav active="blog" />

      <article className="content">
        <Link href="/blog" className="back">← Todos os posts</Link>
        <span className="post-date">{formatPostDate(post.date)}</span>
        <h1>{post.title}</h1>
        <div className="body">
          {post.body.split('\n\n').map((paragraph, i) => {
            const html = paragraph.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
            return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />;
          })}
        </div>

        <div className="cta-box">
          <p>Quer ver como isso conversa com o seu próprio mapa?</p>
          <Link href="/" className="cta">Descobrir meu mapa →</Link>
        </div>
      </article>

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

        .content { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; padding: 48px 20px 100px; }
        .back { display: inline-block; margin-bottom: 24px; font-family: 'Cinzel', serif; font-size: 12.5px; letter-spacing: 0.08em; color: var(--muted); text-decoration: none; }
        .post-date { display: block; font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--warning); margin-bottom: 10px; }
        h1 { font-family: 'Cinzel', serif; font-weight: 700; font-size: clamp(26px, 5vw, 34px); line-height: 1.3; margin: 0 0 28px; text-wrap: balance; }
        .body p { font-size: 18px; line-height: 1.75; color: var(--text); margin: 0 0 18px; }
        .body strong { color: #fbcfe8; }

        .cta-box { margin-top: 44px; padding: 24px; border-radius: 16px; border: 1px dashed var(--border-strong); text-align: center; }
        .cta-box p { font-size: 16px; color: var(--muted); margin: 0 0 14px; }
        .cta {
          display: inline-block; font-family: 'Cinzel', serif; font-size: 13px; letter-spacing: 0.06em;
          color: #fff; background: linear-gradient(135deg, var(--primary), #be185d);
          padding: 11px 22px; border-radius: 999px; text-decoration: none;
        }
      `}</style>
    </div>
  );
}
