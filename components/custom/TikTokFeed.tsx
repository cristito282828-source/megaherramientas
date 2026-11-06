import { TIKTOK_PROFILE_URL, tiktokVideos, type TikTokVideo } from '@/lib/tiktok';
import { TikTokEmbed } from './TikTokEmbed';

interface TikTokFeedProps {
  /** Lista de TikToks a mostrar (por defecto usa la lista de lib/tiktok.ts) */
  videos?: TikTokVideo[];
  /** Título de la sección */
  title?: string;
  /** Subtítulo opcional */
  subtitle?: string;
}

async function fetchTikTokEmbed(url: string) {
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function TikTokFeed({
  videos = tiktokVideos,
  title = 'Síguenos en TikTok',
  subtitle = 'Mira herramientas en acción, ofertas y proyectos de MegaHerramientas.',
}: TikTokFeedProps) {
  const embeds = await Promise.all(videos.map((video) => fetchTikTokEmbed(video.url)));
  const validVideos = videos
    .map((video, index) => ({ video, embed: embeds[index] }))
    .filter((item): item is { video: TikTokVideo; embed: any } => item.embed !== null);

  return (
    <section className="bg-black text-white py-12 sm:py-16 lg:py-20 border-t border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <svg
              className="h-7 w-7 text-amber-400"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.62a8.16 8.16 0 0 0 4.77 1.52V6.69h-1.84z" />
            </svg>
            <h2 className="font-belleza text-3xl sm:text-4xl font-bold text-amber-400 tracking-wide">
              {title}
            </h2>
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {validVideos.length > 0 ? (
          <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {validVideos.map(({ video, embed }, index) => (
              <TikTokEmbed
                key={`${video.url}-${index}`}
                embedHtml={embed.html}
                authorName="megatornillos"
                description={video.description}
                videoUrl={video.url}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-800 bg-gray-950 p-8 text-center text-gray-400">
            TikTok no está disponible en este momento. Puedes ver todos los videos en nuestra cuenta.
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-10">
          <a
            href={TIKTOK_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-black font-semibold rounded-lg hover:bg-amber-300 transition-colors"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.62a8.16 8.16 0 0 0 4.77 1.52V6.69h-1.84z" />
            </svg>
            Ver más en TikTok
          </a>
        </div>
      </div>
    </section>
  );
}
