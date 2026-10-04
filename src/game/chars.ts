// Les chars à retaper après le bazou. Tu l'achètes, tu le répares pièce par pièce,
// pis une fois fini il reste dans ta cour : bonus sur tous tes gains jusqu'au prochain prestige.
// Tu les trouves sur le Face-de-Bouc Marché : chaque sorte de char a ses annonces, pis elles changent avec le temps.
// Marques inventées seulement.

export interface Projet {
  id: string;
  nom: string;
  description: string;
  prix: number;
  /** Débloqué quand le bazou roule, ou avec le bâtiment. */
  requires: 'roule' | 'garage' | 'concession' | 'arena';
  pieces: readonly { id: string; nom: string; cost: number }[];
  /** Multiplicateur sur tous tes gains une fois retapé. */
  bonus: number;
}

export const PROJETS: readonly Projet[] = [
  {
    id: 'pickup',
    nom: 'Le pick-up rouillé à Ti-Guy',
    description: "Un Bœuf 1979. Y'a plus de rouille que de tôle, mais la boîte est encore bonne.",
    prix: 10_000,
    requires: 'roule',
    pieces: [
      { id: 'moteur', nom: 'Moteur', cost: 15_000 },
      { id: 'boite', nom: 'Fond de boîte', cost: 25_000 },
      { id: 'parebrise', nom: 'Pare-brise', cost: 40_000 },
    ],
    bonus: 1.3,
  },
  {
    id: 'monarque',
    nom: 'La Grand Monarque à matante Huguette',
    description: 'Un salon sur quatre roues. Les bancs de velours sont pognés dans le plastique depuis 1991.',
    prix: 4_000_000,
    requires: 'garage',
    pieces: [
      { id: 'transmission', nom: 'Transmission', cost: 4_000_000 },
      { id: 'suspension', nom: 'Suspension', cost: 7_000_000 },
      { id: 'vinyle', nom: 'Toit de vinyle', cost: 11_000_000 },
    ],
    bonus: 1.4,
  },
  {
    id: 'bolide',
    nom: 'Le Bolide 1970',
    description: 'Un vrai char de muscle, trouvé sous une bâche dans une grange à Saint-Clin-Clin.',
    prix: 600_000_000,
    requires: 'concession',
    pieces: [
      { id: 'v8', nom: 'Le V8', cost: 1_000_000_000 },
      { id: 'chrome', nom: 'Les chromes', cost: 1_500_000_000 },
      { id: 'flammes', nom: 'Des flammes sur le capot', cost: 2_500_000_000 },
    ],
    bonus: 1.5,
  },
  {
    id: 'motorise',
    nom: 'Le motorisé des Tremblay',
    description: "Y'a fait la Floride 22 hivers de suite. Le dernier, y'est revenu sur une remorque.",
    prix: 10_000_000_000,
    requires: 'arena',
    pieces: [
      { id: 'diesel', nom: 'Le diesel', cost: 15_000_000_000 },
      { id: 'roues', nom: 'Les roues doubles', cost: 25_000_000_000 },
      { id: 'interieur', nom: "L'intérieur en tapis", cost: 40_000_000_000 },
    ],
    bonus: 1.6,
  },
  {
    id: 'resurfaceuse',
    nom: "La resurfaceuse de l'aréna",
    description: "Quarante ans à faire la glace entre deux périodes. Est due pour sa retraite... chez vous.",
    prix: 40_000_000_000,
    requires: 'arena',
    pieces: [
      { id: 'turbo', nom: 'Le turbo', cost: 60_000_000_000 },
      { id: 'aileron', nom: "L'aileron", cost: 100_000_000_000 },
      { id: 'legende', nom: 'La peinture de légende', cost: 160_000_000_000 },
    ],
    bonus: 1.7,
  },
];

export function getProjet(id: string): Projet | undefined {
  return PROJETS.find((p) => p.id === id);
}

// --- Le Face-de-Bouc Marché ---

/** L'état du char dans l'annonce : moins cher à l'achat = plus cher à réparer. Le total reste le même. */
export const ETATS = {
  finie: { nom: 'Finie ben raide', prix: 0.5 },
  correct: { nom: 'Correct', prix: 1 },
  propre: { nom: 'Propre pour son âge', prix: 2 },
} as const;

export interface Annonce {
  id: string;
  /** La sorte de char (un des PROJETS) : même déblocage, mêmes pièces, même bonus. */
  projet: string;
  nom: string;
  vendeur: string;
  etat: keyof typeof ETATS;
  description: string;
}

/** Les annonces changent aux 10 minutes. */
export const ANNONCES_MS = 10 * 60_000;

// Par sorte : finie, correct, propre, finie, correct, propre. L'annonce qui a l'id du projet, c'est le char d'origine.
export const ANNONCES: readonly Annonce[] = [
  { id: 'van', projet: 'pickup', nom: "La van à mononc' Roger", vendeur: "Mononc' Roger", etat: 'finie', description: 'Une Caravane 1984. A sent le chien mouillé pis y\'a un nid de souris dans le coffre à gants. Pas de niaiseux SVP.' },
  { id: 'pickup', projet: 'pickup', nom: 'Le pick-up rouillé à Ti-Guy', vendeur: 'Ti-Guy', etat: 'correct', description: PROJETS[0].description },
  { id: 'castor', projet: 'pickup', nom: 'Le Castor 1986', vendeur: 'La veuve Tremblay', etat: 'propre', description: 'Son défunt le lavait tous les dimanches. Y\'a juste besoin d\'amour pis d\'un moteur.' },
  { id: 'quatre', projet: 'pickup', nom: 'Le 4x4 au fond du bois', vendeur: 'Bob le ferrailleur', etat: 'finie', description: "Y'a un arbre qui a poussé à travers. On le coupe ensemble si tu veux. Cash seulement." },
  { id: 'tempete', projet: 'pickup', nom: 'La Tempête 1982', vendeur: 'Le beau-frère à Gilles', etat: 'correct', description: 'Échange possible contre un Ski-Doo ou une chaloupe. Encore dispo? Oui.' },
  { id: 'familiale', projet: 'pickup', nom: 'La familiale en faux bois', vendeur: 'Le curé', etat: 'propre', description: 'A fait 30 ans de messes. Bénite, mais pas immortelle.' },

  { id: 'corbillard', projet: 'monarque', nom: 'Le corbillard du village', vendeur: 'Le salon funéraire', etat: 'finie', description: 'Un seul propriétaire, pas mal tranquille. Les rideaux sont inclus.' },
  { id: 'monarque', projet: 'monarque', nom: 'La Grand Monarque à matante Huguette', vendeur: 'Matante Huguette', etat: 'correct', description: PROJETS[1].description },
  { id: 'decapotable', projet: 'monarque', nom: 'La décapotable à Ginette', vendeur: 'Ginette', etat: 'propre', description: "Le toit ferme pu, mais en été c'est une option. Pas sérieux s'abstenir." },
  { id: 'limo', projet: 'monarque', nom: 'La limo des bals de finissants', vendeur: 'Location Prestige', etat: 'finie', description: 'Douze places, deux portes qui ouvrent. Senteur de parfum cheap garantie à vie.' },
  { id: 'coupe', projet: 'monarque', nom: 'Le coupé deux portes', vendeur: 'Un gars de Montréal', etat: 'correct', description: 'Y monte jamais au chalet, ça fait que je le vends. Livraison? Non.' },
  { id: 'grandpapa', projet: 'monarque', nom: 'La grosse familiale à grand-papa', vendeur: 'Les enfants à Rosaire', etat: 'propre', description: "Grand-papa la conduit pu depuis 1998. Les pneus d'hiver sont encore dessus." },

  { id: 'drag', projet: 'bolide', nom: 'Le char de drag de la piste', vendeur: 'Ti-Mé', etat: 'finie', description: 'A pogné le mur en 1987. Le mur va bien.' },
  { id: 'bolide', projet: 'bolide', nom: 'Le Bolide 1970', vendeur: 'Un fermier de Saint-Clin-Clin', etat: 'correct', description: PROJETS[2].description },
  { id: 'parade', projet: 'bolide', nom: 'Le Bolide de la parade', vendeur: 'Le maire', etat: 'propre', description: 'A ouvert la parade de la St-Jean douze années de suite. Prix ferme.' },
  { id: 'fusee', projet: 'bolide', nom: 'La Fusée 1969', vendeur: 'Un fermier de Saint-Clin-Clin', etat: 'finie', description: 'Les poules ont pondu dedans pendant 20 ans. Moteur d\'origine, poules pas incluses.' },
  { id: 'requin', projet: 'bolide', nom: 'Le Requin 1971', vendeur: 'Un collectionneur pressé', etat: 'correct', description: "Ma femme dit que c'est elle ou le char. J'garde le char, mais j'ai besoin de place." },
  { id: 'phenix', projet: 'bolide', nom: 'Le Phénix doré', vendeur: 'Un dentiste de Laval', etat: 'propre', description: 'Dans un garage chauffé depuis 1979. Jamais vu la pluie. Juste un peu de rouille... partout.' },

  { id: 'autobus', projet: 'motorise', nom: "L'autobus jaune", vendeur: 'La commission scolaire', etat: 'finie', description: 'Quarante-deux places, toutes collées de gomme. Le stop sort encore tout seul.' },
  { id: 'motorise', projet: 'motorise', nom: 'Le motorisé des Tremblay', vendeur: 'Les Tremblay', etat: 'correct', description: PROJETS[3].description },
  { id: 'pompier', projet: 'motorise', nom: 'Le camion de pompier du village', vendeur: 'Les pompiers volontaires', etat: 'propre', description: "Sirène fonctionnelle. Le voisin est pas d'accord." },
  { id: 'depanneuse', projet: 'motorise', nom: 'La dépanneuse à Bob', vendeur: 'Bob le ferrailleur', etat: 'finie', description: "A remorqué la moitié du comté. Asteure, c'est elle qui a besoin d'une remorque." },
  { id: 'cantine', projet: 'motorise', nom: 'Le camion à patates', vendeur: 'La cantine chez Raymonde', etat: 'correct', description: "La friteuse est fournie. L'huile date de 2003." },
  { id: 'police', projet: 'motorise', nom: 'Le char de police retraité', vendeur: 'La police du village', etat: 'propre', description: 'Les gyrophares marchent. Faut pas s\'en servir. Sérieux.' },

  { id: 'monstre', projet: 'resurfaceuse', nom: 'Le camion-monstre', vendeur: 'Ti-Mé', etat: 'finie', description: "A écrasé 300 chars à l'expo de Saint-Clin-Clin. Le 301e, c'était le sien." },
  { id: 'resurfaceuse', projet: 'resurfaceuse', nom: "La resurfaceuse de l'aréna", vendeur: "L'aréna municipal", etat: 'correct', description: PROJETS[4].description },
  { id: 'royale', projet: 'resurfaceuse', nom: 'La Grande Royale 1959', vendeur: 'Un notaire de Québec', etat: 'propre', description: 'Des ailerons gros de même. A jamais dépassé 50 km/h.' },
  { id: 'stockcar', projet: 'resurfaceuse', nom: 'Le stock-car #27', vendeur: 'La piste de Saint-Clin-Clin', etat: 'finie', description: 'Toutes les tôles sont pliées du même bord. Ça tournait juste à gauche anyway.' },
  { id: 'concept', projet: 'resurfaceuse', nom: 'Le char du futur 1962', vendeur: "Le Salon de l'auto", etat: 'correct', description: 'Prototype unique. Le futur avait pas prévu la rouille.' },
  { id: 'formule', projet: 'resurfaceuse', nom: 'Le char de formule à Gilles', vendeur: 'Le neveu à Gilles', etat: 'propre', description: "Une place, quatre roues, zéro coffre. Pour l'épicerie, oublie ça." },
];

export function getAnnonce(id: string): Annonce | undefined {
  return ANNONCES.find((a) => a.id === id);
}

/** Les 3 annonces en ligne pour une sorte de char à ce moment-là (une de chaque état). */
export function annoncesEnLigne(projet: string, now: number): Annonce[] {
  const toutes = ANNONCES.filter((a) => a.projet === projet);
  const debut = (Math.floor(now / ANNONCES_MS) * 3) % toutes.length;
  return toutes.slice(debut, debut + 3);
}

export function prixAnnonce(a: Annonce): number {
  return getProjet(a.projet)!.prix * ETATS[a.etat].prix;
}

/** Multiplicateur sur les pièces : ce que t'as sauvé (ou payé de trop) à l'achat se répartit sur les pièces. */
/** Ce que tu reçois en revendant un char retapé : ce qu'il t'a coûté, plus un profit. */
export const PROFIT_VENTE = 0.1;
export function prixVente(projet: Projet): number {
  return (projet.prix + projet.pieces.reduce((t, x) => t + x.cost, 0)) * (1 + PROFIT_VENTE);
}

export function facteurPieces(a: Annonce): number {
  const p = getProjet(a.projet)!;
  return 1 + (p.prix - prixAnnonce(a)) / p.pieces.reduce((t, x) => t + x.cost, 0);
}
