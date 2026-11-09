'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TikTokEmbed } from './TikTokEmbed';

interface TikTokCarouselItem {
  url: string;
  description?: string;
  embedHtml: string;
}

interface TikTokCarouselProps {
  items: TikTokCarouselItem[];
}

export function TikTokCarousel({ items }: TikTokCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: number) => {
    const track = trackRef.current;
    if (!track) return;

    const card = track.firstElementChild as HTMLElement | null;
    const distance = card ? card.getBoundingClientRect().width + 24 : 360;
    track.scrollBy({ left: distance * direction, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 p-3 text-black shadow-lg transition hover:bg-amber-300 lg:block"
        aria-label="Ver TikToks anteriores"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div
        ref={trackRef}
        className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-4 sm:px-0"
      >
        {items.map((item, index) => (
          <div
            key={`${item.url}-${index}`}
            className="w-[82vw] max-w-[325px] shrink-0 snap-start sm:w-[325px]"
          >
            <TikTokEmbed
              embedHtml={item.embedHtml}
              authorName="megatornillos"
              description={item.description}
              videoUrl={item.url}
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex justify-center gap-2 lg:hidden" aria-hidden="true">
        {items.map((item, index) => (
          <span key={`${item.url}-${index}`} className="h-1.5 w-1.5 rounded-full bg-gray-600" />
        ))}
      </div>

      <button
        type="button"
        onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 z-10 hidden translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 p-3 text-black shadow-lg transition hover:bg-amber-300 lg:block"
        aria-label="Ver más TikToks"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
