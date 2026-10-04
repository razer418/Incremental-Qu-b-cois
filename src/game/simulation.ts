// Un joueur simulé, pour vérifier le rythme du jeu (voir equilibre.test.ts).
// Il joue comme un vrai : il tape à un rythme fixe, a son boost x2 la moitié du temps, passe au magasin
// à Réjean, joue les mini-jeux (70 %), va à l'expo (2 critères sur 3), réclame ses quêtes,
// achète ses chars à retaper sur le Face-de-Bouc Marché (la meilleure annonce en ligne), les modifie,
// pis achète ce qui rapporte le plus vite.
import { UPGRADES } from './upgrades';
import { BUILDINGS, EMPIRE_GOAL, type BuildingId } from './buildings';
import { CAR_PRICE, PARTS } from './car';
import { PROJETS, SLOTS, annoncesEnLigne, facteurPieces, prixAnnonce } from './chars';
import { ARTICLES } from './magasin';
import { MINIJEUX, finirPartie, peutJouer } from './minijeux';
import { periode, peutInscrire, prixExpo } from './expo';
import {
  activeQuest,
  addBoost,
  articleCost,
  buyArticle,
  canBuyArticle,
  magasinFactor,
  useArticle,
  assez,
  buy,
  buyBuilding,
  buyCar,
  buyProjet,
  canPrestige,
  coutPiece,
  carRuns,
  claimQuest,
  modifierProjet,
  prochainMod,
  earn,
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
  vendreProjet,
  projetFini,
  type GameState,
} from './state';

const PAR_FORCE = [...ARTICLES].sort((a, b) => b.factor - a.factor);

export type Jalon = 'bazou' | 'roule' | BuildingId | 'prestige' | 'empire';

/** Coût des pièces qui restent à réparer sur un char déjà acheté. */
function reste(s: GameState, id: string): number {
  const p = PROJETS.find((x) => x.id === id)!;
  return p.pieces.filter((x) => !s.projets[id].includes(x.id)).reduce((t, x) => t + coutPiece(s, id, x.cost), 0);
}

/** Le prochain gros achat qui débloque du nouveau : bazou, pièces, bâtiments. */
function prochainJalon(s: GameState): { cost: number; faire: () => boolean } | null {
  if (!s.car.owned) return { cost: CAR_PRICE, faire: () => buyCar(s) };
  const part = PARTS.find((p) => p.essential && !s.car.parts[p.id]);
  if (part) return { cost: part.cost, faire: () => repair(s, part.id) };
  const b = nextBuilding(s);
  if (b) return { cost: b.cost, faire: () => buyBuilding(s, b.id) };
  return null;
}

/** Le meilleur achat en $ de revenu gagné par $ dépensé. */
function meilleurAchat(s: GameState, now: number): { cost: number; faire: () => boolean } | null {
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
    if (!projetDebloque(s, p)) continue;
    // Le bonus arrive seulement à la fin : on évalue le char au complet, pour chaque annonce en ligne.
    const finir = (x: GameState) => {
      for (const pc of p.pieces) reparerProjet(x, p.id, pc.id);
      return true;
    };
    if (s.projets[p.id]) {
      const total = reste(s, p.id);
      if (total > 0) essayer(total, (x) => ((x.cash = Math.max(x.cash, total)), finir(x)));
      // Retapé : chaque prochain niveau de mod.
      else
        for (const slot of SLOTS) {
          const c = prochainMod(s, p.id, slot);
          if (c !== null) essayer(c, (x) => ((x.cash = Math.max(x.cash, c)), modifierProjet(x, p.id, slot)));
        }
      continue;
    }
    for (const a of annoncesEnLigne(p.id, now).filter((x) => !s.vendus.includes(x.id))) {
      const total = prixAnnonce(a) + p.pieces.reduce((t, x) => t + Math.round(x.cost * facteurPieces(a)), 0);
      essayer(total, (x) => ((x.cash = Math.max(x.cash, total)), buyProjet(x, a.id) && finir(x)));
    }
  }
  return best;
}

/** Joue `maxSecondes` secondes. Retourne le temps (s) où chaque jalon est atteint. */
/** `flip` : un joueur qui revend chaque char aussitôt retapé pour le profit, au lieu de garder le bonus. */
export function simuler(
  tapesParSeconde: number,
  maxSecondes: number,
  journal?: (t: number, s: GameState) => void,
  flip = false,
): Partial<Record<Jalon, number>> {
  const s = newGame(0);
  const temps: Partial<Record<Jalon, number>> = {};
  let dette = 0;
  for (let t = 1; t <= maxSecondes; t++) {
    tick(s, t * 1000);
    dette += tapesParSeconde;
    for (; dette >= 1; dette--) tap(s);
    while (activeQuest(s) && claimQuest(s));
    // Une pub (1 h de boost) une heure sur deux : le boost est allumé la moitié du temps.
    if (s.boostSeconds <= 0 && Math.floor(t / 3600) % 2 === 0) addBoost(s);
    // Quand un buff finit, il achète le plus fort qu'il peut pis le prend drette.
    for (const a of PAR_FORCE)
      if (magasinFactor(s, a.boosts) === 1 && canBuyArticle(s, a.id) && articleCost(s, a.id) <= s.cash * 0.25) {
        buyArticle(s, a.id);
        useArticle(s, a.id);
      }
    for (const m of MINIJEUX) if (peutJouer(s, m.id, t * 1000)) finirPartie(s, m.id, 0.7, t * 1000);
    if (peutInscrire(s, t * 1000)) {
      earn(s, prixExpo(s, 2 / 3));
      s.expo.periode = periode(t * 1000);
    }

    // Quand le prochain jalon est à moins de 15 minutes de revenus, on ramasse pour,
    // en se permettant juste des petits achats (10 % du prix du jalon).
    for (;;) {
      const jalon = prochainJalon(s);
      const onRamasse = jalon !== null && jalon.cost <= revenuRef(s) * 900;
      if (onRamasse && assez(s, jalon.cost) && jalon.faire()) continue;
      const achat = meilleurAchat(s, t * 1000);
      if (!achat || !assez(s, achat.cost) || (onRamasse && achat.cost > jalon.cost * 0.1)) break;
      achat.faire();
    }

    if (flip) for (const p of PROJETS) if (projetFini(s, p)) vendreProjet(s, p.id);

    journal?.(t, s);
    if (!temps.bazou && s.car.owned) temps.bazou = t;
    if (!temps.roule && carRuns(s)) temps.roule = t;
    for (const b of BUILDINGS) if (!temps[b.id] && s.buildings[b.id]) temps[b.id] = t;
    // Le premier prestige possible, pis le gros (l'aréna pis 1 T $ gagnés) où il vend.
    if (!temps.prestige && canPrestige(s)) temps.prestige = t;
    if (s.buildings.arena && s.totalEarned >= EMPIRE_GOAL) {
      temps.empire = t;
      break;
    }
  }
  return temps;
}
