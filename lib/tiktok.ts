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
  /** Descripción opcional (se muestra debajo del video) */
  description?: string;
}

export const tiktokVideos: TikTokVideo[] = [
  {
    url: 'https://www.tiktok.com/@tiktok/video/7236990862590558506',
    description: 'Ejemplo de video — reemplazá esta URL con tus TikToks',
  },
  {
    url: 'https://www.tiktok.com/@tiktok/video/7236990862590558506',
    description: 'Otro video importante de tu marca',
  },
  {
    url: 'https://www.tiktok.com/@tiktok/video/7236990862590558506',
    description: 'Tercer video destacado',
  },
];
