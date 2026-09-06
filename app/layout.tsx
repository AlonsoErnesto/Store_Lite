import ConsentBanner from '@/components/consent/ConsentBanner';
import { env } from '@/config/env';
import { AuthProvider } from '@/features/auth';
import { MaterialWebInit } from '@/lib/material-design/MaterialWebInit';
import { ThemeBoot } from '@/shared/components/ThemeBoot';
import { WebVitalsReporter } from '@/shared/components/WebVitalsReporter';
import { ThemeProvider } from '@/shared/context/ThemeContext';
import { CSPostHogProvider } from '@/shared/providers/PostHogProvider';
import { buildSiteJsonLd, SITE_DESCRIPTION, SITE_NAME } from '@/shared/utils/siteJsonLd';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const google_sans_flex = localFont({
  src: './fonts/google-sans-flex.woff2',
  display: 'swap',
  variable: '--font-google-sans-flex',
  adjustFontFallback: false,
  fallback: ['system-ui', 'sans-serif'],
  weight: '1 1000',
});

const roboto_mono = localFont({
  src: './fonts/roboto-mono.woff2',
  display: 'swap',
  variable: '--font-roboto-mono',
  weight: '100 700',
});

const inter = localFont({
  src: './fonts/inter.woff2',
  display: 'swap',
  variable: '--font-storefront-inter',
  weight: '100 900',
});

const roboto = localFont({
  src: [
    { path: './fonts/roboto-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/roboto-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/roboto-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-storefront-roboto',
});

const poppins = localFont({
  src: [
    { path: './fonts/poppins-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/poppins-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/poppins-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/poppins-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-storefront-poppins',
});

// Site-level JSON-LD knowledge graph — built once, rendered on every page.
const siteJsonLd = buildSiteJsonLd(env.nextPublicAppUrl);

export const metadata: Metadata = {
  metadataBase: new URL(env.nextPublicAppUrl),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'es_PE',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: '/img/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${google_sans_flex.variable} ${roboto_mono.variable} ${inter.variable} ${roboto.variable} ${poppins.variable}`}
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
        <ThemeBoot />
      </head>
      <body suppressHydrationWarning className="antialiased">
        {/* Site-level structured data: Organization + WebSite knowledge graph */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <CSPostHogProvider>
          <ThemeProvider>
            <AuthProvider>
              <MaterialWebInit />
              <WebVitalsReporter />
              {children}
              <ConsentBanner />
            </AuthProvider>
          </ThemeProvider>
        </CSPostHogProvider>
      </body>
    </html>
  );
}
