import type { Metadata } from 'next';
import SplashScreen from '@/components/custom/SplashScreen';

export const metadata: Metadata = {
  title: 'MegaHerramientas · Bienvenida',
  description:
    'Las mejores herramientas para profesionales y proyectos que desafían lo imposible. Visítanos y descubre nuestra tienda.',
  openGraph: {
    title: 'MegaHerramientas · Bienvenida',
    description:
      'Las mejores herramientas para profesionales y proyectos que desafían lo imposible.',
    type: 'website',
  },
};

export default function BienvenidaPage() {
  return <SplashScreen />;
}
