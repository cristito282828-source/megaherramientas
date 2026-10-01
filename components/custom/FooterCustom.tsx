'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Facebook, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { newsletterSchema } from '@/lib/validations/forms';
import { toast } from 'sonner';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validación con Zod
    const result = newsletterSchema.safeParse({ email });

    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message || 'Error de validación';
      toast.error(errorMessage);
      return;
    }

    setIsSubmitting(true);

    // TODO: Integrar con servicio de email marketing
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('¡Gracias por suscribirte!');
      setEmail('');
    }, 1200);
  };

  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand & Description */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative h-16 w-16 flex-none">
                <Image
                  src="/logo-megaherramientas.png"
                  alt="MegaHerramientas"
                  fill
                  sizes="64px"
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-belleza text-2xl font-bold text-amber-400 leading-tight">
                  MegaHerramientas
                </h3>
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                  Herramientas especializadas
                </p>
              </div>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Tu tienda especializada en herramientas profesionales. Calidad, garantía y atención personalizada para cada proyecto.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-amber-400 transition-colors duration-200">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-amber-400 transition-colors duration-200">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-amber-400 transition-colors duration-200">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Menú Inferior */}
          <div>
            <h4 className="text-lg mb-6 text-amber-400">Menú</h4>
            <ul className="space-y-3">
              <li><Link href="/search" className="text-gray-400 hover:text-amber-400 transition-colors duration-200">Catálogo</Link></li>
              <li><Link href="/search" className="text-gray-400 hover:text-amber-400 transition-colors duration-200">Búsqueda</Link></li>
              <li><Link href="/terminos-del-servicio" className="text-gray-400 hover:text-amber-400 transition-colors duration-200">Términos del servicio</Link></li>
            </ul>
          </div>

          {/* Nuestras Políticas */}
          <div>
            <h4 className="text-lg mb-6 text-amber-400">Nuestras Políticas</h4>
            <ul className="space-y-3">
              <li><Link href="/politica-proteccion-datos" className="text-gray-400 hover:text-amber-400 transition-colors duration-200">Protección de datos</Link></li>
              <li><Link href="/politica-reembolso" className="text-gray-400 hover:text-amber-400 transition-colors duration-200">Política de reembolso</Link></li>
              <li><Link href="/politica-envios" className="text-gray-400 hover:text-amber-400 transition-colors duration-200">Política de envíos</Link></li>
              <li><Link href="/terminos-y-condiciones" className="text-gray-400 hover:text-amber-400 transition-colors duration-200">Términos y condiciones</Link></li>
            </ul>
          </div>

          {/* Newsletter & Contact */}
          <div>
            <h4 className="text-lg mb-6 text-amber-400">Novedades y descuentos</h4>
            <p className="text-gray-400 mb-4">
              Suscríbete y entérate primero de nuestras ofertas y nuevos productos.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="mb-6">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Su e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-400 text-black font-semibold rounded hover:bg-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isSubmitting ? '...' : 'Suscribir'}
                </button>
              </div>
            </form>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <a href="tel:+56900000000" className="text-gray-400 hover:text-amber-400 transition-colors duration-200">
                  +56 9 0000 0000
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <a href="mailto:contacto@megaherramientas.cl" className="text-gray-400 hover:text-amber-400 transition-colors duration-200">
                  contacto@megaherramientas.cl
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <span className="text-gray-400">Chile</span>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-800 mb-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} MegaHerramientas. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6">
              <span className="text-gray-400 text-sm">
                País/región: Chile (CLP $)
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Hecho con 💛 para profesionales
          </p>
        </div>
      </div>
    </footer>
  );
}
