import Link from 'next/link';
import { WooNavbar } from '@/components/layout/navbar/woo-navbar';
import SeasonalBanner from '@/components/custom/SeasonalBanner';
import FooterCustom from '@/components/custom/FooterCustom';

export const metadata = {
  title: 'Lorem Ipsum Store',
  description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  keywords: 'lorem, ipsum, dolor, sit amet, consectetur, adipiscing elit',
};

// Revalidar cada 60 segundos para mantener productos actualizados
export const revalidate = 60;

// Función para formatear precio (remover HTML entities)
function formatPrice(price: string | undefined | null): string {
  if (!price) return 'Precio no disponible';
  return price
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

async function getAllProducts() {
  try {
    const { woocommerceFetch } = await import('@/lib/woocommerce');
    const { getProductsQuery } = await import('@/lib/woocommerce/queries/product');

    const res = await woocommerceFetch<any>({
      query: getProductsQuery,
      variables: {}
    });

    const products = res.body.data.products?.nodes || [];

    return products.map((product: any) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price || 'Precio no disponible',
      image: product.image?.sourceUrl || product.image?.url || '/placeholder.jpg',
      shortDescription: product.shortDescription || '',
      stockStatus: product.stockStatus
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function HomePage() {
  const products = await getAllProducts();

  return (
    <>
      <WooNavbar />
      <main id="main-content" className="min-h-screen bg-gray-50 pt-24">
        <SeasonalBanner />

        {/* Sección de productos */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Nuestros Productos
            </h2>
            <p className="text-lg text-gray-600">
              Explora nuestro catálogo completo de {products.length} productos
            </p>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                No hay productos disponibles
              </h3>
              <p className="text-gray-600 mb-6">
                Lo sentimos, no encontramos productos en este momento.
              </p>
              <Link
                href="/search"
                className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors"
              >
                Ver catálogo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product: any) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="group block bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Imagen */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-lg text-gray-700 font-medium mb-2">
                      {formatPrice(product.price)}
                    </p>

                    {/* Stock status */}
                    {product.stockStatus && (
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        product.stockStatus === 'IN_STOCK'
                          ? 'bg-green-100 text-green-800'
                          : product.stockStatus === 'OUT_OF_STOCK'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.stockStatus === 'IN_STOCK' && 'En stock'}
                        {product.stockStatus === 'OUT_OF_STOCK' && 'Agotado'}
                        {product.stockStatus === 'ON_BACKORDER' && 'Bajo pedido'}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <FooterCustom />
    </>
  );
}
