import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { TIKTOK_PIXEL_ID } from "@/lib/tiktok";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'Manual dos Poderes Ocultos | Numerologia & Astrologia Personalizada',
  description: 'Descubra seu mapa espiritual completo com Numerologia, Astrologia e previsões personalizadas para 2025 e 2026. Análise profunda da sua alma.',
  keywords: 'numerologia, astrologia, mapa astral, número da vida, previsões 2025, espiritualidade, autoconhecimento, mapa espiritual',
  authors: [{ name: 'Manual dos Poderes Ocultos' }],
  creator: 'Manual dos Poderes Ocultos',
  publisher: 'Manual dos Poderes Ocultos',

  openGraph: {
    title: 'Manual dos Poderes Ocultos | Descubra Seu Mapa Espiritual',
    description: 'Análise completa de Numerologia + Astrologia + Previsões personalizadas. Descubra os segredos da sua alma.',
    url: 'https://app-espiritual-psi.vercel.app',
    siteName: 'Manual dos Poderes Ocultos',
    images: [
      {
        url: 'https://app-espiritual-psi.vercel.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Manual dos Poderes Ocultos - Mapa Espiritual',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Manual dos Poderes Ocultos',
    description: 'Descubra seu mapa espiritual completo com Numerologia e Astrologia',
    images: ['https://app-espiritual-psi.vercel.app/og-image.jpg'],
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
    canonical: 'https://app-espiritual-psi.vercel.app',
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
          strategy="afterInteractive"
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

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Manual dos Poderes Ocultos',
              description: 'Análise espiritual completa com Numerologia e Astrologia',
              url: 'https://app-espiritual-psi.vercel.app',
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