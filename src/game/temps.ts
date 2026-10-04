// L'heure pis la météo du rang : comme les saisons, elles suivent l'horloge,
// donc tout le monde a le même temps, même l'app fermée.
import { SAISON_SECONDES, saisonA } from './saisons';

/** Une journée dure 2 minutes : 5 jours par saison. */
export const JOUR_SECONDES = 120;
/** La journée commence à 6 h. */
const DEBUT_JOUR = 6;

export type MomentId = 'matin' | 'midi' | 'apresmidi' | 'soir' | 'nuit';
export const MOMENTS: readonly { id: MomentId; nom: string; de: number }[] = [
  { id: 'matin', nom: 'LE MATIN', de: 5 },
  { id: 'midi', nom: 'MIDI', de: 11 },
  { id: 'apresmidi', nom: "L'APRÈS-MIDI", de: 13 },
  { id: 'soir', nom: 'LE SOIR', de: 18 },
  { id: 'nuit', nom: 'LA NUIT', de: 21 },
];

/** L'heure du jeu (0 à 24, avec les minutes en décimales). */
export function heureA(ms: number): number {
  const s = (ms / 1000) % JOUR_SECONDES;
  return ((s / JOUR_SECONDES) * 24 + DEBUT_JOUR) % 24;
}

/** Le jour dans la saison : 1 à 5. */
export function jourA(ms: number): number {
  return Math.floor(((ms / 1000) % SAISON_SECONDES) / JOUR_SECONDES) + 1;
}

export function momentA(ms: number): (typeof MOMENTS)[number] {
  const h = heureA(ms);
  // Avant 5 h, c'est encore la nuit.
  return [...MOMENTS].reverse().find((m) => h >= m.de) ?? MOMENTS[4];
}

/** 14,5 -> « 14 h 30 », par tranches de 10 minutes. */
export function formatHeure(h: number): string {
  const min = Math.floor((h % 1) * 6) * 10;
  return `${Math.floor(h)} h ${String(min).padStart(2, '0')}`;
}

export type MeteoId = 'beau' | 'pluie' | 'neige' | 'vent' | 'brouillard';
export const METEOS: readonly { id: MeteoId; nom: string }[] = [
  { id: 'beau', nom: 'BEAU TEMPS' },
  { id: 'pluie', nom: 'PLUIE' },
  { id: 'neige', nom: 'NEIGE' },
  { id: 'vent', nom: 'GROS VENT' },
  { id: 'brouillard', nom: 'BROUILLARD' },
];

/** La météo change aux 90 secondes. */
export const METEO_SECONDES = 90;

// Les chances de chaque météo selon la saison (le reste : beau temps).
const CHANCES: Record<string, Partial<Record<MeteoId, number>>> = {
  printemps: { pluie: 0.3, vent: 0.1, brouillard: 0.15 },
  ete: { pluie: 0.15, vent: 0.1, brouillard: 0.05 },
  automne: { pluie: 0.2, vent: 0.25, brouillard: 0.1 },
  hiver: { neige: 0.35, vent: 0.15, brouillard: 0.05 },
};

// Un hasard qui dépend juste du numéro de la tranche : même météo pour tout le monde.
function hasard(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function meteoA(ms: number): (typeof METEOS)[number] {
  const tranche = Math.floor(ms / 1000 / METEO_SECONDES);
  let r = hasard(tranche);
  for (const [id, p] of Object.entries(CHANCES[saisonA(ms).id])) {
    if (r < p) return METEOS.find((m) => m.id === id)!;
    r -= p;
  }
  return METEOS[0];
}
