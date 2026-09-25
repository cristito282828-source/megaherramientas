import type { Metadata } from 'next';
import './globals.css';
import { RecentlyViewedProvider } from '@/components/providers/RecentlyViewedProvider';
import { CartProvider } from '@/components/providers/CartProvider';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { generateOrganizationSchema, generateWebSiteSchema } from '@/lib/structured-data';
import { JsonLdScript } from '@/lib/json-ld-script';

export const metadata: Metadata = {
  title: {
    default: 'Lorem Ipsum Store',
    template: '%s | Lorem Ipsum Store'
  },
  description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  keywords: ['lorem', 'ipsum', 'dolor', 'sit amet', 'consectetur', 'adipiscing'],
  authors: [{ name: 'Lorem Ipsum Store' }],
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://example.com',
    siteName: 'Lorem Ipsum Store',
    title: 'Lorem Ipsum Store - Ejemplo de tienda online',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationSchema = generateOrganizationSchema();
  const webSiteSchema = generateWebSiteSchema();

  return (
    <html lang="es">
      <head>
        {/* Structured Data global para SEO */}
        <JsonLdScript data={organizationSchema} />
        <JsonLdScript data={webSiteSchema} />
      </head>
      <body className="antialiased">
        {/* Skip Link para accesibilidad - permite saltar al contenido principal */}
        <a
          href="#main-content"
          className="skip-link"
        >
          Saltar al contenido principal
        </a>

        <CartProvider>
          <RecentlyViewedProvider>
            {children}
          </RecentlyViewedProvider>
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
