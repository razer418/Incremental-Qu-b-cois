/**
 * Jalons qu'on peut cacher en dev (voir .env.sans-j5).
 * Par défaut tout est là; VITE_JALON5=off cache le garage, le concessionnaire, le prestige pis leurs quêtes.
 */
export const JALON5 = import.meta.env?.VITE_JALON5 !== 'off';
