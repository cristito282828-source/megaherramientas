'use client'
import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import Link from 'next/link';

interface Collection {
  title: string;
  handle: string;
  path: string;
}

interface CategorySectionDynamicProps {
  collections: Collection[];
}

export default function CategorySectionDynamic({ collections }: CategorySectionDynamicProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Filtrar colecciones válidas
  const validCollections = collections
    .filter(c =>
      c.handle !== '' &&
      !c.handle.toLowerCase().includes('hidden') &&
      c.title.toLowerCase() !== 'all'
    );

  // Calcular cuántas cards se ven a la vez según el viewport
  const getVisibleCards = () => {
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width < 640) return 1; // mobile: 1 card
    if (width < 1024) return 2; // tablet: 2 cards
    return 3; // desktop: 3 cards
  };

  const [visibleCards, setVisibleCards] = useState(getVisibleCards());

  useEffect(() => {
    const updateVisibleCards = () => {
      setVisibleCards(getVisibleCards());
    };
    
    updateVisibleCards();
    window.addEventListener('resize', updateVisibleCards);
    return () => window.removeEventListener('resize', updateVisibleCards);
  }, []);

  // Calcular cuántos dots (páginas) necesitamos
  const totalPages = Math.ceil(validCollections.length / visibleCards);
  const activePage = Math.floor(activeIndex / visibleCards);

  // Detectar posición del scroll
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const cards = Array.from(container.children) as HTMLElement[];
    
    if (cards.length === 0) return;

    // Encontrar la card más cercana al centro del viewport
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    
    let closestIndex = 0;
    let closestDistance = Infinity;

    cards.forEach((card, index) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(cardCenter - containerCenter);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    // Normalizar el índice para que siempre esté entre 0 y validCollections.length - 1
    const normalizedIndex = closestIndex % validCollections.length;
    setActiveIndex(normalizedIndex);

    // Si estamos en la segunda mitad duplicada, saltar sin animación al inicio
    if (closestIndex >= validCollections.length && !container.dataset.isLooping) {
      container.dataset.isLooping = 'true';
      setTimeout(() => {
        const targetCard = cards[normalizedIndex];
        if (targetCard) {
          const scrollAmount = targetCard.getBoundingClientRect().left - containerRect.left + container.scrollLeft;
          container.style.scrollBehavior = 'auto';
          container.scrollLeft = scrollAmount;
          container.style.scrollBehavior = 'smooth';
        }
        delete container.dataset.isLooping;
      }, 100);
    }
  }, [validCollections.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  if (validCollections.length === 0) {
    return null;
  }

  // Navegar a una card específica
  const scrollToCard = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cards = Array.from(container.children) as HTMLElement[];
    
    if (cards[index]) {
      const card = cards[index];
      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      
      // Calcular cuánto necesitamos scrollear para centrar la card
      const scrollAmount = cardRect.left - containerRect.left + container.scrollLeft;
      
      container.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Navegar a una página específica
  const scrollToPage = (pageIndex: number) => {
    const cardIndex = pageIndex * visibleCards;
    scrollToCard(Math.min(cardIndex, validCollections.length - 1));
  };

  // Navegación infinita
  const scrollPrev = () => {
    let newIndex = activeIndex - 1;
    if (newIndex < 0) {
      newIndex = validCollections.length - 1;
    }
    scrollToCard(newIndex);
  };

  const scrollNext = () => {
    let newIndex = activeIndex + 1;
    if (newIndex >= validCollections.length) {
      newIndex = 0;
    }
    scrollToCard(newIndex);
  };

  return (
    <div className="overflow-hidden bg-black py-8 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 sm:gap-8 lg:gap-12 items-center">

          {/* Caption - Izquierda */}
          <div className="lg:col-span-2">
            <h2 className="font-belleza text-2xl sm:text-3xl lg:text-5xl font-light tracking-wide leading-tight text-white text-center lg:text-left">
              Explora más
            </h2>
            <div className="mx-auto mt-4 h-1 w-14 bg-amber-400 lg:mx-0" />
          </div>

          {/* Slider - Derecha */}
          <div className="lg:col-span-8">
            <div className="relative">

              {/* Scroll Container */}
              <div
                ref={scrollContainerRef}
                className="scroll-container flex gap-3 sm:gap-4 overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory hide-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {/* Renderizar las cards dos veces para efecto infinito */}
                {[...validCollections, ...validCollections].map((category, index) => {
                  return (
                    <div
                      key={`${category.handle}-${index}`}
                      className="snap-start shrink-0 w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]"
                    >
                      <Link
                        href={category.path}
                        className="group block active:scale-[0.98] transition-transform duration-150"
                      >
                        <div className="flex aspect-[4/3] w-full flex-col justify-between rounded-sm border border-white/10 border-t-4 border-t-amber-400 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-5 transition-all duration-200 group-hover:border-amber-400/70 group-hover:shadow-lg group-hover:shadow-amber-400/10 sm:p-6">
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
                              Categoría
                            </span>
                            <div className="mt-3 h-px w-10 bg-amber-400/70 transition-all duration-200 group-hover:w-16" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold tracking-wide text-white sm:text-2xl">
                              {category.title}
                            </h3>
                            <span className="mt-3 flex items-center gap-2 text-sm font-medium text-amber-400 transition-colors group-hover:text-amber-300">
                              Ver categoría
                              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Botones de navegación - Siempre visibles, navegación infinita */}
              <button
                onClick={scrollPrev}
                className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 bg-black/90 hover:bg-zinc-800 border border-amber-400/50 p-3 rounded-full shadow-lg transition-all duration-300 z-30 hover:scale-110 min-w-[44px] min-h-[44px] items-center justify-center"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-6 w-6 text-amber-400" />
              </button>

              <button
                onClick={scrollNext}
                className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 bg-black/90 hover:bg-zinc-800 border border-amber-400/50 p-3 rounded-full shadow-lg transition-all duration-300 z-30 hover:scale-110 min-w-[44px] min-h-[44px] items-center justify-center"
                aria-label="Siguiente"
              >
                <ChevronRight className="h-6 w-6 text-amber-400" />
              </button>

{/* Dots de navegación */}
<div className="flex justify-center items-center gap-1 mt-8">
  {Array.from({ length: totalPages }).map((_, pageIndex) => {
    const isActive = activePage === pageIndex;
    return (
      <button
        key={pageIndex}
        onClick={() => scrollToPage(pageIndex)}
        style={{
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: 0,
          lineHeight: 0,
        }}
        aria-label={`Ir a página ${pageIndex + 1}`}
      >
        <div
          style={{
            width: isActive ? '40px' : '20px', // activo más largo
            height: '2px',
            backgroundColor: isActive ? '#fbbf24' : 'rgba(255,255,255,0.35)',
            transition: 'all 0.3s ease',
          }}
        />
      </button>
    );
  })}
</div>



              {/* Indicador de swipe solo en mobile */}
              <div className="block sm:hidden text-center mt-4 text-amber-400/70 text-xs animate-pulse">
                ← Desliza para ver más →
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar {
          -webkit-overflow-scrolling: touch;
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .scroll-container {
            scroll-behavior: auto !important;
          }

          * {
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }

        @media (max-width: 640px) {
          .scroll-container {
            scroll-padding: 0;
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </div>
  );
}