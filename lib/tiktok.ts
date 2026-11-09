/**
 * Lista curada de TikToks para mostrar en la home.
 *
 * Para agregar/quitar videos:
 *  1. Copiá la URL del TikTok desde la app o web (ej: https://www.tiktok.com/@usuario/video/1234567890)
 *  2. Pegala en este array
 *  3. Guardá y hacé redeploy (o en dev: hot reload)
 *
 * El componente `TikTokFeed` se encarga de obtener el embed via oEmbed.
 */

export interface TikTokVideo {
  /** URL completa del video de TikTok */
  url: string;
  /** Descripción mostrada debajo del mockup */
  description?: string;
  /** Imagen representativa mientras se obtienen los videos reales */
  thumbnail?: string;
}

export const TIKTOK_PROFILE_URL = 'https://www.tiktok.com/@megatornillos';

export const tiktokVideos: TikTokVideo[] = [
  {
    url: 'https://www.tiktok.com/@megatornillos/video/7702976589302123782',
    description: 'Super Kote White Lithium Complex',
  },
  {
    url: 'https://www.tiktok.com/@megatornillos/video/7601635309540904200',
    description: 'Herramientas MegaHerramientas',
  },
  {
    url: 'https://www.tiktok.com/@megatornillos/video/7547160047491501368',
    description: 'Oferta en torquímetro',
  },
  {
    url: 'https://www.tiktok.com/@megatornillos/video/7692581097154039041',
    description: 'Herramientas especiales para taller automotriz',
  },
  {
    url: 'https://www.tiktok.com/@megatornillos/video/7689893421820939538',
    description: 'Taladros y herramientas para mecánicos',
  },
  {
    url: 'https://www.tiktok.com/@megatornillos/video/7684818502380735762',
    description: 'Juegos especiales de herramientas',
  },
  {
    url: 'https://www.tiktok.com/@megatornillos/video/7684402352131935496',
    description: 'Herramientas para hacer más fácil tu taller',
  },
];
