import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { TIKTOK_PIXEL_ID } from "@/lib/tiktok";
import { META_PIXEL_ID } from "@/lib/meta";
import "./globals.css";
import AvisoCookies from "@/app/components/AvisoCookies";
import CapturaAtribuicao from "@/app/components/CapturaAtribuicao";

// Os scripts de anúncio e de medição (gtag do GA4/Google Ads, Pixel da Meta,
// Pixel do TikTok) só baixam DEPOIS que a página carregou e o navegador ficou
// livre: no celular fraco eles disputavam CPU com a página e o botão do quiz
// demorava a responder. Os "stubs" (gtag/fbq/ttq) continuam no começo, então
// qualquer evento disparado antes entra na fila e sai quando o script chega.
// Custo: quem sai da página antes de ela terminar de carregar não é contado.
const DEPOIS_DA_PAGINA = "window.icDepois=window.icDepois||function(f){var go=function(){if(window.requestIdleCallback)window.requestIdleCallback(f,{timeout:3000});else setTimeout(f,1200)};if(document.readyState==='complete')go();else window.addEventListener('load',go,{once:true})};";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0118',
};

export const metadata = {
  title: 'Intuitive Concept | Seu Mapa de Numerologia e Astrologia',
  description: 'Descubra seu padrão no amor, no dinheiro e o que trava seu momento atual. Numerologia + Astrologia + Padrões Comportamentais. Teste grátis em 1 minuto.',
  keywords: 'numerologia, astrologia, mapa astral, número da vida, autoconhecimento, padrões comportamentais, manual do seu mapa',
  authors: [{ name: 'Intuitive Concept' }],
  creator: 'Intuitive Concept',
  publisher: 'Intuitive Concept',

  openGraph: {
    title: 'Intuitive Concept | Seu Mapa de Numerologia e Astrologia',
    description: 'Descubra seu padrão no amor, no dinheiro e o que trava seu momento atual. Numerologia + Astrologia + Padrões Comportamentais. Teste grátis em 1 minuto.',
    url: 'https://intuitiveconcept.com.br',
    siteName: 'Intuitive Concept',
    locale: 'pt_BR',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Intuitive Concept | Seu Mapa de Numerologia e Astrologia',
    description: 'Descubra seu padrão no amor, no dinheiro e o que trava seu momento atual. Numerologia + Astrologia + Padrões Comportamentais. Teste grátis em 1 minuto.',
  },

  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: 'https://intuitiveconcept.com.br',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta
          name="google-site-verification"
          content="Dm-MjTPhbvz9q1IFUDc22sqm0DC2t5pbU4wtrkd5V3M"
        />

        <script
  dangerouslySetInnerHTML={{
    __html: `
      ${DEPOIS_DA_PAGINA}
      // gtag.js (GA4 + Google Ads) só depois da página pronta; até lá, o dataLayer guarda tudo.
      window.icDepois(function () {
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=G-4YT1QFSD1P';
        document.head.appendChild(s);
      });
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      // LGPD: tudo negado até a pessoa aceitar no aviso de cookies (AvisoCookies.js).
      var icOk = false; try { icOk = localStorage.getItem('ic_consent') === 'sim'; } catch (e) {}
      gtag('consent', 'default', {
        ad_storage: icOk ? 'granted' : 'denied',
        ad_user_data: icOk ? 'granted' : 'denied',
        ad_personalization: icOk ? 'granted' : 'denied',
        analytics_storage: icOk ? 'granted' : 'denied',
        wait_for_update: 500
      });
      gtag('js', new Date());

      // O mesmo ID está em lib/atribuicao.js (GA4_WEB_ID) pro client_id/session_id do checkout.
      gtag('config', 'G-4YT1QFSD1P');
      gtag('config', 'AW-16938088515');
      gtag('config', 'AW-17660841644');
    `,
  }}
/>

        <Script
          id="tiktok-pixel"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              ${DEPOIS_DA_PAGINA}
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for( var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};w.icDepois(function(){var s=d.createElement("script");s.type="text/javascript",s.async=!0,s.src=r+"?sdkid="+e+"&lib="+t;var f=d.getElementsByTagName("script")[0];f.parentNode.insertBefore(s,f)})};
                var icOk = false; try { icOk = localStorage.getItem('ic_consent') === 'sim'; } catch (e) {}
                if (!icOk) ttq.holdConsent();
                ttq.load('${TIKTOK_PIXEL_ID}');
                ttq.page();
              }(window, document, 'ttq');
            `,
          }}
        />

        <Script
          id="meta-pixel"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              ${DEPOIS_DA_PAGINA}
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];f.icDepois(function(){t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)})}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              var icOk = false; try { icOk = localStorage.getItem('ic_consent') === 'sim'; } catch (e) {}
              if (!icOk) fbq('consent', 'revoke');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `,
          }}
        />
        {/* Sem o <noscript> do pixel do Meta: sem JavaScript não dá pra pedir consentimento (LGPD). */}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Intuitive Concept',
              description: 'O Manual do seu Mapa, personalizado de Numerologia e Astrologia: o seu padrão no amor, no dinheiro e no momento atual.',
              url: 'https://intuitiveconcept.com.br',
              applicationCategory: 'LifestyleApplication',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'BRL',
              },
            }),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <AvisoCookies />
        {/* gclid/gbraid/wbraid e UTMs da entrada, só no aparelho (lib/atribuicao.js) */}
        <CapturaAtribuicao />
      </body>
    </html>
  );
}