'use client'
import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import Link from 'next/link';

interface Collection {
  title: string;
  handle: string;
  path: string;
}

interface CategorySectionMinimalProps {
  collections: Collection[];
}

export default function CategorySectionMinimal({ collections }: CategorySectionMinimalProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);

  const validCollections = collections
    .filter(c =>
      c.handle !== '' &&
      c.handle !== 'undefined' &&
      !c.handle.toLowerCase().includes('hidden') &&
      c.handle.toLowerCase() !== 'undefined' &&
      c.title.toLowerCase() !== 'all'
    );

  // Duplicar colecciones para scroll infinito
  const infiniteCollections = [...validCollections, ...validCollections, ...validCollections];

  // Inicializar en el medio para permitir scroll en ambas direcciones
  useEffect(() => {
    if (scrollContainerRef.current && validCollections.length > 0) {
      const container = scrollContainerRef.current;
      const cardWidth = 143; // 140px + 3px gap aproximado
      const initialScroll = cardWidth * validCollections.length;
      container.scrollLeft = initialScroll;
    }
  }, [validCollections.length]);

  // Manejar el loop infinito
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isScrolling) return;

    const container = scrollContainerRef.current;
    const cardWidth = 143;
    const totalOriginalWidth = cardWidth * validCollections.length;

    // Si llegamos muy al inicio, saltar al medio
    if (container.scrollLeft < cardWidth) {
      setIsScrolling(true);
      container.style.scrollBehavior = 'auto';
      container.scrollLeft = container.scrollLeft + totalOriginalWidth;
      container.style.scrollBehavior = 'auto';
      setTimeout(() => setIsScrolling(false), 50);
    }

    // Si llegamos muy al final, saltar al medio
    if (container.scrollLeft > totalOriginalWidth * 2 - container.clientWidth) {
      setIsScrolling(true);
      container.style.scrollBehavior = 'auto';
      container.scrollLeft = container.scrollLeft - totalOriginalWidth;
      container.style.scrollBehavior = 'auto';
      setTimeout(() => setIsScrolling(false), 50);
    }
  }, [isScrolling, validCollections.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || isAutoplayPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let animationFrame = 0;
    let previousTime = 0;
    const animate = (time: number) => {
      if (previousTime) {
        container.scrollLeft += Math.min(time - previousTime, 50) * 0.018;
      }
      previousTime = time;
      animationFrame = window.requestAnimationFrame(animate);
    };

    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [isAutoplayPaused]);

  if (validCollections.length === 0) {
    return null;
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 300;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className="border-y border-gray-800 bg-black py-5 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="relative"
          onMouseEnter={() => setIsAutoplayPaused(true)}
          onMouseLeave={() => setIsAutoplayPaused(false)}
        >

          {/* Botón izquierdo */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-gray-700 bg-black text-amber-400 shadow-md transition-colors hover:border-amber-400 hover:bg-amber-400 hover:text-black"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Botón derecho */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-gray-700 bg-black text-amber-400 shadow-md transition-colors hover:border-amber-400 hover:bg-amber-400 hover:text-black"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto border-y border-gray-800 px-6 py-3"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {infiniteCollections.map((category, index) => (
              <Link
                key={`${category.handle}-${index}`}
                href={category.path}
                className="group flex min-h-12 w-[120px] shrink-0 items-center justify-center border-r border-gray-800 px-3 text-center sm:w-[140px]"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-400 transition-colors duration-200 group-hover:text-white sm:text-sm">
                  {category.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
