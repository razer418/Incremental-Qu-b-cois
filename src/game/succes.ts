// Les succès : des petits trophées qui restent pour toujours, même après le prestige.
// Chacun donne un petit bonus sur tous tes gains (voir SUCCES_BONUS dans state.ts).
import { QUESTS } from './quests';
import { UPGRADES } from './upgrades';
import { PROJETS } from './chars';
import { carRuns, levelOf, projetFini, type GameState } from './state';

export interface Succes {
  id: string;
  nom: string;
  description: string;
  atteint: (s: GameState) => boolean;
}

export const SUCCES: readonly Succes[] = [
  { id: 'tapes-100', nom: 'Le pouce qui chauffe', description: 'Taper 100 fois.', atteint: (s) => s.stats.tapsVie >= 100 },
  { id: 'tapes-1k', nom: 'Tendinite du rang', description: 'Taper 1 000 fois.', atteint: (s) => s.stats.tapsVie >= 1000 },
  { id: 'tapes-10k', nom: "Pas d'autre chose à faire", description: 'Taper 10 000 fois.', atteint: (s) => s.stats.tapsVie >= 10_000 },
  { id: 'cash-1k', nom: 'Un beau mille', description: 'Gagner 1 000 $ au total.', atteint: (s) => s.stats.gagneVie >= 1000 },
  { id: 'cash-100k', nom: 'Le gros lot du dépanneur', description: 'Gagner 100 000 $ au total.', atteint: (s) => s.stats.gagneVie >= 100_000 },
  { id: 'cash-10m', nom: 'Millionnaire du rang', description: 'Gagner 10 M $ au total.', atteint: (s) => s.stats.gagneVie >= 10_000_000 },
  { id: 'cash-1g', nom: 'Plus riche que le maire', description: 'Gagner 1 G $ au total.', atteint: (s) => s.stats.gagneVie >= 1e9 },
  { id: 'bazou', nom: 'Propriétaire', description: 'Acheter le bazou du bonhomme Gagnon.', atteint: (s) => s.car.owned },
  { id: 'vroum', nom: 'Vroum vroum', description: 'Faire rouler le bazou.', atteint: carRuns },
  { id: 'propre', nom: 'Beau comme un char neuf', description: 'Débosser pis peinturer le bazou.', atteint: (s) => s.car.parts.carrosserie === true },
  { id: 'garage', nom: 'En affaires', description: 'Acheter le garage à Ti-Guy.', atteint: (s) => s.buildings.garage },
  { id: 'cabane', nom: 'Sucrier', description: 'Acheter la cabane à sucre.', atteint: (s) => s.buildings.cabane },
  { id: 'concession', nom: 'Le rêve à Gagnon', description: 'Acheter le concessionnaire.', atteint: (s) => s.buildings.concession },
  { id: 'bar', nom: 'Pilier de taverne', description: 'Acheter le bar du village.', atteint: (s) => s.buildings.bar },
  { id: 'arena', nom: "Citoyen de l'année", description: "Acheter l'aréna.", atteint: (s) => s.buildings.arena },
  { id: 'quetes', nom: 'Bon garçon', description: 'Finir toutes les quêtes.', atteint: (s) => s.questIndex >= QUESTS.length },
  { id: 'niveau-10', nom: 'Ça commence à rouler', description: 'Monter un achat au niveau 10.', atteint: (s) => UPGRADES.some((u) => levelOf(s, u.id) >= 10) },
  { id: 'au-max', nom: 'Au boutte', description: 'Monter un achat au max.', atteint: (s) => UPGRADES.some((u) => levelOf(s, u.id) >= u.maxLevel) },
  { id: 'boost', nom: 'Double ou rien', description: 'Partir un boost x2.', atteint: (s) => s.stats.boosts >= 1 },
  { id: 'boost-10', nom: 'Accro au boost', description: 'Partir 10 boosts x2.', atteint: (s) => s.stats.boosts >= 10 },
  { id: 'rejean', nom: 'Client régulier', description: 'Acheter 10 affaires chez Réjean.', atteint: (s) => s.stats.articles >= 10 },
  { id: 'heure', nom: 'Une bonne heure', description: 'Jouer une heure au total.', atteint: (s) => s.stats.secondes >= 3600 },
  { id: 'retape', nom: 'Patenteux', description: 'Retaper un char au complet.', atteint: (s) => PROJETS.some((p) => projetFini(s, p)) },
  { id: 'retape-tous', nom: 'Collectionneur', description: 'Retaper tous les chars.', atteint: (s) => PROJETS.every((p) => projetFini(s, p)) },
  { id: 'evenements', nom: 'Toujours de quoi dans le rang', description: 'Répondre à 10 événements.', atteint: (s) => s.stats.evenements >= 10 },
  { id: 'prestige', nom: 'On recommence', description: "Vendre l'empire une première fois.", atteint: (s) => s.prestige.count >= 1 },
];

/** Débloque les succès atteints. Retourne les nouveaux. */
export function verifierSucces(state: GameState): Succes[] {
  const nouveaux = SUCCES.filter((x) => !state.succes.includes(x.id) && x.atteint(state));
  for (const x of nouveaux) state.succes.push(x.id);
  return nouveaux;
}
