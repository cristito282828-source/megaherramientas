'use client';

import { useEffect, useRef } from 'react';

interface TikTokEmbedProps {
  /** HTML que devuelve el oEmbed de TikTok */
  embedHtml: string;
  /** Nombre del autor (@usuario) */
  authorName?: string;
  /** Descripción a mostrar debajo del video */
  description?: string;
  /** URL del video (para el link) */
  videoUrl: string;
}

/**
 * Renderiza el HTML del embed de TikTok y se asegura de que
 * el script oficial de TikTok se cargue para convertir el blockquote
 * en un reproductor interactivo.
 */
export function TikTokEmbed({
  embedHtml,
  authorName,
  description,
  videoUrl,
}: TikTokEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cargar el script oficial de TikTok solo una vez
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.tiktok.com/embed.js"]'
    );

    const initEmbed = () => {
      // @ts-expect-error - TikTok expone esta función global
      if (typeof window !== 'undefined' && window.tiktokEmbed?.lib?.load) {
        // @ts-expect-error - TikTok expone load() en window
        window.tiktokEmbed.lib.load();
      }
    };

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      script.onload = initEmbed;
      document.body.appendChild(script);
    } else {
      initEmbed();
    }
  }, [embedHtml]);

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-amber-400 transition-colors">
      {/* Embed oficial */}
      <div
        ref={containerRef}
        className="tiktok-embed-container"
        dangerouslySetInnerHTML={{ __html: embedHtml }}
      />

      {/* Footer con autor y descripción */}
      <div className="p-4">
        {authorName && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 font-medium text-sm transition-colors block mb-1"
          >
            @{authorName}
          </a>
        )}
        {description && (
          <p className="text-gray-300 text-sm line-clamp-2">{description}</p>
        )}
      </div>
    </div>
  );
}
