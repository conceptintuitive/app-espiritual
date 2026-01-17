import { Geist, Geist_Mono } from "next/font/google";
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
        <meta name="google-site-verification" content="Dm-MjTPhbvz9q1IFUDc22sqm0DC2t5pbU4wtrkd5V3M" />
        {/* Google Analytics */}
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
            `,
          }}
        />

        {/* Google Ads Conversion Tracking */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-16938088515"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-16938088515');
            `,
          }}
        />

        {/* Schema.org JSON-LD */}
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}