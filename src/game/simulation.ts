// Un joueur simulé, pour vérifier le rythme du jeu (voir equilibre.test.ts).
// Il tape à un rythme fixe, réclame ses quêtes, pis achète ce qui rapporte le plus vite.
import { UPGRADES } from './upgrades';
import { PARTS } from './car';
import { PROJETS } from './chars';
import {
  activeQuest,
  assez,
  buy,
  buyBuilding,
  buyCar,
  buyProjet,
  canPrestige,
  carRuns,
  claimQuest,
  isUnlocked,
  nextBuilding,
  nextCost,
  newGame,
  projetDebloque,
  repair,
  reparerProjet,
  revenuRef,
  tap,
  tick,
  type GameState,
} from './state';

export type Jalon = 'bazou' | 'roule' | 'garage' | 'concession' | 'prestige';

/** Coût d'un char à retaper qui reste à payer (achat + pièces). */
function resteProjet(s: GameState, id: string): number {
  const p = PROJETS.find((x) => x.id === id)!;
  const faites = s.projets[id];
  return (faites ? 0 : p.prix) + p.pieces.filter((x) => !faites?.includes(x.id)).reduce((t, x) => t + x.cost, 0);
}

/** Le prochain gros achat qui débloque du nouveau : bazou, pièces, bâtiments. */
function prochainJalon(s: GameState): { cost: number; faire: () => boolean } | null {
  if (!s.car.owned) return { cost: 500, faire: () => buyCar(s) };
  const part = PARTS.find((p) => p.essential && !s.car.parts[p.id]);
  if (part) return { cost: part.cost, faire: () => repair(s, part.id) };
  const b = nextBuilding(s);
  if (b) return { cost: b.cost, faire: () => buyBuilding(s, b.id) };
  return null;
}

/** Le meilleur achat en $ de revenu gagné par $ dépensé. */
function meilleurAchat(s: GameState): { cost: number; faire: () => boolean } | null {
  const avant = revenuRef(s);
  let best: { ratio: number; cost: number; faire: () => boolean } | null = null;
  const essayer = (cost: number, faire: (x: GameState) => boolean) => {
    const copie = structuredClone(s);
    if (!faire(copie)) return;
    const ratio = (revenuRef(copie) - avant) / cost;
    if (ratio > 0 && (!best || ratio > best.ratio)) best = { ratio, cost, faire: () => faire(s) };
  };
  for (const u of UPGRADES) {
    const cost = nextCost(s, u.id);
    if (cost === null || !isUnlocked(s, u)) continue;
    essayer(cost, (x) => ((x.cash = Math.max(x.cash, cost)), buy(x, u.id)));
  }
  if (!s.car.parts.carrosserie && carRuns(s)) {
    const c = PARTS.find((p) => p.id === 'carrosserie')!.cost;
    essayer(c, (x) => ((x.cash = Math.max(x.cash, c)), repair(x, 'carrosserie')));
  }
  for (const p of PROJETS) {
    if (!projetDebloque(s, p) || resteProjet(s, p.id) === 0) continue;
    const total = resteProjet(s, p.id);
    // Le bonus arrive seulement à la fin : on évalue le char au complet.
    essayer(total, (x) => {
      x.cash = Math.max(x.cash, total);
      if (!x.projets[p.id]) buyProjet(x, p.id);
      for (const pc of p.pieces) reparerProjet(x, p.id, pc.id);
      return true;
    });
  }
  return best;
}

/** Joue `maxSecondes` secondes. Retourne le temps (s) où chaque jalon est atteint. */
export function simuler(tapesParSeconde: number, maxSecondes: number, journal?: (t: number, s: GameState) => void): Partial<Record<Jalon, number>> {
  const s = newGame(0);
  const temps: Partial<Record<Jalon, number>> = {};
  let dette = 0;
  for (let t = 1; t <= maxSecondes; t++) {
    tick(s, t * 1000);
    dette += tapesParSeconde;
    for (; dette >= 1; dette--) tap(s);
    while (activeQuest(s) && claimQuest(s));

    // Quand le prochain jalon est à moins de 5 minutes de revenus, on ramasse pour,
    // en se permettant juste des petits achats (10 % du prix du jalon).
    for (;;) {
      const jalon = prochainJalon(s);
      const onRamasse = jalon !== null && jalon.cost <= revenuRef(s) * 300;
      if (onRamasse && assez(s, jalon.cost) && jalon.faire()) continue;
      const achat = meilleurAchat(s);
      if (!achat || !assez(s, achat.cost) || (onRamasse && achat.cost > jalon.cost * 0.1)) break;
      achat.faire();
    }

    journal?.(t, s);
    if (!temps.bazou && s.car.owned) temps.bazou = t;
    if (!temps.roule && carRuns(s)) temps.roule = t;
    if (!temps.garage && s.buildings.garage) temps.garage = t;
    if (!temps.concession && s.buildings.concession) temps.concession = t;
    if (!temps.prestige && canPrestige(s)) {
      temps.prestige = t;
      break;
    }
  }
  return temps;
}
