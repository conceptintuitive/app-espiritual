import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { TIKTOK_PIXEL_ID } from "@/lib/tiktok";
import { META_PIXEL_ID } from "@/lib/meta";
import "./globals.css";

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
  keywords: 'numerologia, astrologia, mapa astral, número da vida, autoconhecimento, padrões comportamentais, manual completo',
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
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-4YT1QFSD1P"
        />

        <script
  dangerouslySetInnerHTML={{
    __html: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

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
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for( var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script") ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
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
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Intuitive Concept',
              description: 'Manual Completo personalizado de Numerologia e Astrologia: padrão no amor, no dinheiro e no momento atual.',
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
      </body>
    </html>
  );
}