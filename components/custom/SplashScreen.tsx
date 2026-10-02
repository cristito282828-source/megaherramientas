import Image from 'next/image';
import Link from 'next/link';
import { Instagram, MessageCircle } from 'lucide-react';

interface SocialLink {
  label: string;
  href: string;
  icon: 'whatsapp' | 'instagram' | 'tiktok';
}

const SOCIAL_LINKS: SocialLink[] = [
  { label: 'WhatsApp', href: 'https://wa.me/573227725160', icon: 'whatsapp' },
  { label: 'Instagram', href: 'https://www.instagram.com/', icon: 'instagram' },
];

const SocialIcon = ({ type }: { type: SocialLink['icon'] }) => {
  if (type === 'whatsapp') return <MessageCircle className="h-4 w-4" />;
  if (type === 'instagram') return <Instagram className="h-4 w-4" />;
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.62a8.16 8.16 0 0 0 4.77 1.52V6.69h-1.84z" />
    </svg>
  );
};

export default function SplashScreen() {
  return (
    <div
      id="splash-content"
      className="fixed inset-0 z-[100] flex items-center justify-center px-6 overflow-hidden bg-black"
    >
      {/* ============ FONDO: VIDEO con filtro warm luxury ============ */}
      <video
        src="/video-tools.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: 'brightness(1.2) saturate(1.1) sepia(0.15)',
        }}
      />

      {/* Overlay sutil sobre el video para legibilidad del texto */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(250, 250, 248, 0.72)',
        }}
      />

      {/* ============ CONTENIDO PRINCIPAL ============ */}
      <div className="relative w-full max-w-xl text-center py-12 md:py-0">
        {/* Logo — fondo transparente, solo el badge amarillo/negro */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="relative w-32 h-32 md:w-40 md:h-40">
            <Image
              src="/logo-megaherramienta.png"
              alt="MegaHerramientas"
              width={160}
              height={160}
              className="h-full w-full object-contain"
              priority
            />
          </div>
        </div>

        {/* Eyebrow */}
        <p className="font-moderat text-[10px] md:text-xs tracking-[0.35em] uppercase text-gray-600 mb-3 md:mb-4">
        · Herramientas especializadas · 
        </p>

        {/* Wordmark */}
        <h1 className="font-belleza text-4xl md:text-6xl font-light tracking-wide text-black mb-6 md:mb-7">
          MegaHerramientas
        </h1>

        {/* Tagline */}
        <p className="font-moderat text-base md:text-lg text-gray-600 leading-relaxed max-w-md mx-auto mb-10 md:mb-12">
          Las mejores herramientas para profesionales y proyectos que desafían lo imposible.
        </p>

        {/* CTA — underline luxury → va a la home */}
        <Link
          href="/"
          className="group inline-flex items-center gap-3 font-moderat text-sm md:text-base tracking-[0.2em] uppercase text-black border-b border-black pb-2 hover:text-amber-500 hover:border-amber-500 transition-colors duration-300"
        >
          Entrar a la tienda
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>

        {/* Redes sociales — link-in-bio style */}
        <div className="flex items-center justify-center gap-8 mt-8 md:mt-10">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className="group flex flex-col items-center gap-2 text-gray-600 hover:text-black transition-colors duration-300"
            >
              <span className="flex items-center justify-center w-10 h-10 border border-gray-200 rounded-full group-hover:border-amber-500 transition-colors duration-300">
                <SocialIcon type={link.icon} />
              </span>
              <span className="font-moderat text-[10px] tracking-[0.25em] uppercase">
                {link.label}
              </span>
            </a>
          ))}
        </div>

        {/* Footer del splash */}
        <div className="mt-8 md:mt-10">
          <p className="font-belleza text-sm md:text-base italic text-gray-400 tracking-wide">
            Una herramienta a la vez.
          </p>
        </div>
      </div>
    </div>
  );
}
