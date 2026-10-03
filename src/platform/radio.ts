// La radio du char : deux stations, des tounes composées en code (Web Audio) pis des fausses pubs
// de radio locale lues par la voix du navigateur. Le son passe dans un filtre « radio AM » pour
// fitter le style Bazou VHS. Toute la musique est faite ici : aucun fichier, aucune licence.

export interface Toune {
  titre: string;
  artiste: string;
  bpm: number;
  /** Un accord par mesure, joué 3 fois (intro, couplet, refrain). */
  accords: string[];
  graine: number;
}

export interface Station {
  nom: string;
  style: 'country' | 'rock';
  slogan: string;
  tounes: Toune[];
}

export const STATIONS: Station[] = [
  {
    nom: 'RADIO RANG 98,7',
    style: 'country',
    slogan: 'Vous écoutez Radio Rang, 98,7. La radio qui sent le diesel pis la tarte au sucre.',
    tounes: [
      { titre: 'Le reel du bazou', artiste: 'Ti-Mé Pelletier', bpm: 124, accords: ['G', 'C', 'G', 'D', 'G', 'C', 'D', 'G'], graine: 11 },
      { titre: 'Ma blonde est partie avec ma motoneige', artiste: 'Huguette pis ses Bottes', bpm: 100, accords: ['D', 'D', 'G', 'D', 'A', 'A', 'D', 'D'], graine: 23 },
      { titre: 'Le blues du dépanneur', artiste: 'Les Gars du Rang', bpm: 92, accords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'G', 'C'], graine: 37 },
      { titre: "Mononc' a vendu la terre", artiste: 'Ti-Mé Pelletier', bpm: 112, accords: ['A', 'D', 'A', 'E', 'A', 'D', 'E', 'A'], graine: 41 },
    ],
  },
  {
    nom: 'GARAGE FM 103,3',
    style: 'rock',
    slogan: 'Garage FM, 103,3. Du rock sale pour du monde propre. Ou l’inverse.',
    tounes: [
      { titre: 'Silencieux percé', artiste: 'Rouille Totale', bpm: 140, accords: ['E', 'E', 'G', 'A', 'E', 'E', 'D', 'A'], graine: 5 },
      { titre: "Pédale dans l'tapis", artiste: 'Les Pistons Croches', bpm: 150, accords: ['A', 'A', 'C', 'D', 'A', 'A', 'G', 'E'], graine: 17 },
      { titre: 'Ma minoune rouille en paix', artiste: 'Rouille Totale', bpm: 116, accords: ['D', 'D', 'F', 'G', 'D', 'C', 'G', 'A'], graine: 29 },
      { titre: 'Brake à bras', artiste: 'Les Pistons Croches', bpm: 132, accords: ['E', 'G', 'A', 'C', 'E', 'G', 'D', 'E'], graine: 43 },
    ],
  },
];

/** Fausses pubs de radio locale. Commerces pis marques inventés. */
export const PUBS: string[] = [
  'Pneus Bouchard, sur la 132! Achetez-en trois, le quatrième est usagé. Pneus Bouchard : on roule, nous autres.',
  'Casse-croûte Chez Lulu, à 5 km passé l’église. La poutine qui te colle au corps jusqu’au printemps. Cash seulement, le terminal marche pas.',
  'Le bingo de la Fabrique, mardi soir à 7 h. 2 $ la carte, café compris. Apportez vos bouchons pis votre chance.',
  'Garage Ti-Guy : on répare toute, même ce qui marchait. Pas besoin de rendez-vous, klaxonnez dans la cour.',
  'La météo du rang : y fait frette à matin, pis plus frette à soir. Mettez une tuque pis partez le char d’avance.',
  'Grosse vente de garage chez le bonhomme Gagnon samedi! Des roues, de la tôle pis un frigo qui marche quasiment. Prix négociables.',
  'Érablière Chez Ti-Paul : le temps des sucres est commencé! Tire sur la neige, oreilles de crisse pis danse en ligne à 2 h.',
  'Club de motoneige du rang : 40 km de sentiers ouverts. Restez dans les piquets, le bonhomme Gagnon surveille ses clôtures.',
];

export interface Radio {
  /** Index dans STATIONS, ou -1 quand la radio est fermée. */
  station: number;
  volume: number;
  /** Change de station (ou ferme avec -1). Fait un petit grichage entre les deux. */
  syntoniser(station: number): void;
  setVolume(v: number): void;
  /** À appeler sur un geste du joueur : les navigateurs bloquent le son avant. */
  demarrer(): void;
}

// Un accord : sa fondamentale (en note MIDI, octave 3) pis ses trois notes.
const RACINES: Record<string, number> = { C: 48, D: 50, E: 52, F: 53, G: 55, A: 57, B: 59 };
const accord = (nom: string) => {
  const r = RACINES[nom[0]];
  return { r, notes: [r, r + (nom.endsWith('m') ? 3 : 4), r + 7] };
};
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

// Petit hasard reproductible : une toune sonne pareil à chaque fois.
const hasard = (graine: number) => () => {
  graine = (graine * 1664525 + 1013904223) % 4294967296;
  return graine / 4294967296;
};

/** La mélodie d'une toune : une note MIDI (ou null) par croche, pour une fois la grille. */
export function melodie(toune: Toune, style: Station['style']): (number | null)[] {
  const rnd = hasard(toune.graine);
  const cle = accord(toune.accords[0]).r + 24;
  const gamme = style === 'country' ? [0, 2, 4, 7, 9] : [0, 3, 5, 7, 10];
  const notes: number[] = [];
  for (let o = -12; o <= 12; o += 12) gamme.forEach((g) => notes.push(cle + g + o));
  let i = 5;
  const out: (number | null)[] = [];
  for (const nom of toune.accords) {
    const tons = accord(nom).notes.map((n) => (n % 12));
    for (let pas = 0; pas < 8; pas++) {
      const fort = pas % 4 === 0;
      if (!fort && rnd() < (style === 'country' ? 0.3 : 0.5)) {
        out.push(null);
        continue;
      }
      i = Math.max(2, Math.min(notes.length - 3, i + Math.round((rnd() - 0.5) * 4)));
      // Sur les temps forts, on retombe sur une note de l'accord pour que ça sonne juste.
      if (fort) while (!tons.includes(notes[i] % 12) && i > 0) i--;
      out.push(notes[i]);
    }
  }
  return out;
}

export function createRadio(contexte: () => AudioContext | null, afficher: (texte: string) => void): Radio {
  let ctx: AudioContext | null = null;
  let bus: GainNode;
  let disto: WaveShaperNode;
  let bruit: AudioBuffer;
  let grichage: GainNode;

  // Où on est rendu : quelle toune, quelle croche, pis quand jouer la prochaine.
  let tounesJouees = 0;
  let toune: Toune | null = null;
  let notesMelodie: (number | null)[] = [];
  let pas = 0;
  let prochaine = 0;
  let pubEnCours = false;
  let pubFin = 0;
  let pubIndex = Math.floor(Math.random() * PUBS.length);

  const preparer = () => {
    if (ctx) return true;
    ctx = contexte();
    if (!ctx) return false;
    const c = ctx;
    bus = c.createGain();
    // Le son « radio de char » : on coupe les basses pis les aigus.
    const passeHaut = c.createBiquadFilter();
    passeHaut.type = 'highpass';
    passeHaut.frequency.value = 180;
    const passeBas = c.createBiquadFilter();
    passeBas.type = 'lowpass';
    passeBas.frequency.value = 3800;
    bus.connect(passeHaut).connect(passeBas).connect(c.destination);
    disto = c.createWaveShaper();
    const courbe = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = i / 128 - 1;
      courbe[i] = Math.tanh(x * 6);
    }
    disto.curve = courbe;
    const apresDisto = c.createGain();
    apresDisto.gain.value = 0.35;
    disto.connect(apresDisto).connect(bus);
    bruit = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = bruit.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // Un petit souffle de radio en fond, qui monte quand on change de poste.
    const souffle = c.createBufferSource();
    souffle.buffer = bruit;
    souffle.loop = true;
    const bande = c.createBiquadFilter();
    bande.type = 'bandpass';
    bande.frequency.value = 2200;
    grichage = c.createGain();
    grichage.gain.value = 0.006;
    souffle.connect(bande).connect(grichage).connect(bus);
    souffle.start();
    bus.gain.value = radio.station < 0 ? 0 : radio.volume;
    return true;
  };

  // Les instruments.
  const ton = (type: OscillatorType, f: number, t: number, dur: number, vol: number, vers: AudioNode = bus) => {
    const c = ctx!;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(vers);
    o.start(t);
    o.stop(t + dur + 0.02);
  };
  const tape = (t: number, dur: number, vol: number, type: BiquadFilterType, f: number) => {
    const c = ctx!;
    const s = c.createBufferSource();
    s.buffer = bruit;
    const b = c.createBiquadFilter();
    b.type = type;
    b.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(b).connect(g).connect(bus);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur);
  };
  const grosseCaisse = (t: number) => {
    const c = ctx!;
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + 0.22);
  };

  // Une croche de musique, selon le style de la station.
  const jouerPas = (t: number, d: number) => {
    const s = STATIONS[radio.station];
    const t0 = toune!;
    const grille = t0.accords.length * 8;
    const tour = Math.floor(pas / grille);
    const p = pas % grille;
    const a = accord(t0.accords[Math.floor(p / 8)]);
    const croche = p % 8;
    const note = tour > 0 ? notesMelodie[p] : null;
    if (s.style === 'country') {
      // Boom-chicka : basse sur 1 pis 3 (fondamentale, quinte), guitare sur 2 pis 4.
      if (croche === 0) ton('triangle', hz(a.r - 12), t, d * 3, 0.32);
      if (croche === 4) ton('triangle', hz(a.r - 5), t, d * 3, 0.28);
      if (croche === 2 || croche === 6) {
        a.notes.forEach((n, i) => ton('triangle', hz(n + 12), t + i * 0.012, d * 1.6, 0.07));
        tape(t, 0.07, 0.05, 'bandpass', 3000);
      }
      // Le banjo : notes pincées, sèches.
      if (note) {
        ton('square', hz(note), t, d * 1.8, 0.05);
        ton('triangle', hz(note + 12), t, d * 0.9, 0.04);
      }
    } else {
      // Rock de garage : power chords qui « chug », basse en croches, drum.
      const accent = croche === 0 || croche === 3 || croche === 6;
      [a.r - 12, a.r - 5, a.r].forEach((n) => ton('sawtooth', hz(n), t, d * (accent ? 1.6 : 0.7), accent ? 0.22 : 0.12, disto));
      ton('sawtooth', hz(a.r - 24), t, d * 0.9, 0.16);
      if (croche === 0 || croche === 4 || (croche === 5 && tour > 0)) grosseCaisse(t);
      if (croche === 2 || croche === 6) {
        tape(t, 0.14, 0.32, 'bandpass', 1800);
        ton('triangle', 190, t, 0.08, 0.1);
      }
      tape(t, 0.035, 0.07, 'highpass', 7000);
      if (note && tour === 2) ton('square', hz(note), t, d * 1.5, 0.06, disto);
    }
    // Petit coup de cymbale pour finir la toune.
    if (pas === grille * 3 - 8) tape(t, 1.4, s.style === 'rock' ? 0.15 : 0.06, 'highpass', 5000);
  };

  // Les pubs pis le nom de la station, lus par la voix du navigateur si y'en a une en français.
  const voix = () => {
    const toutes = typeof speechSynthesis === 'undefined' ? [] : speechSynthesis.getVoices();
    return toutes.find((v) => v.lang === 'fr-CA') ?? toutes.find((v) => v.lang.startsWith('fr'));
  };
  const pause = () => {
    const s = STATIONS[radio.station];
    const texte = `${PUBS[pubIndex]} ${s.slogan}`;
    pubIndex = (pubIndex + 1) % PUBS.length;
    pubEnCours = true;
    afficher(`PUB · ${texte}`);
    const t = ctx!.currentTime;
    // Le jingle de la station.
    [0, 4, 7, 12].forEach((n, i) => ton('triangle', hz(67 + n), t + i * 0.12, 0.3, 0.12));
    // Assez de temps pour lire le texte, même sans voix.
    pubFin = performance.now() + 900 + texte.length * 65;
    const v = voix();
    if (!v) return;
    const u = new SpeechSynthesisUtterance(texte);
    u.voice = v;
    u.lang = v.lang;
    u.rate = 1.1;
    u.volume = radio.volume;
    u.onend = u.onerror = () => {
      if (pubEnCours) pubFin = Math.min(pubFin, performance.now() + 400);
    };
    setTimeout(() => {
      if (pubEnCours && radio.station >= 0) speechSynthesis.speak(u);
    }, 600);
  };
  const tounesuivante = () => {
    const s = STATIONS[radio.station];
    toune = s.tounes[tounesJouees % s.tounes.length];
    tounesJouees++;
    notesMelodie = melodie(toune, s.style);
    pas = 0;
    prochaine = ctx!.currentTime + 0.3;
    afficher(`♪ ${s.nom} · ${toune.titre} - ${toune.artiste}`);
  };
  const arreterPub = () => {
    pubEnCours = false;
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  };

  // On planifie la musique un peu d'avance, comme un vrai séquenceur.
  setInterval(() => {
    if (!ctx || radio.station < 0 || ctx.state !== 'running') return;
    if (document.hidden) {
      if (pubEnCours) pubFin = 0;
      return;
    }
    if (pubEnCours) {
      if (performance.now() < pubFin) return;
      arreterPub();
      tounesuivante();
    }
    if (!toune) tounesuivante();
    const d = 60 / toune!.bpm / 2;
    if (prochaine < ctx.currentTime) prochaine = ctx.currentTime + 0.05;
    while (prochaine < ctx.currentTime + 0.25) {
      if (pas >= toune!.accords.length * 8 * 3 + 8) {
        // Une pub aux deux tounes.
        if (tounesJouees % 2 === 0) {
          toune = null;
          pause();
        } else tounesuivante();
        return;
      }
      if (pas < toune!.accords.length * 8 * 3) jouerPas(prochaine, d);
      pas++;
      prochaine += d;
    }
  }, 60);

  const radio: Radio = {
    station: 0,
    volume: 0.6,
    syntoniser(station) {
      radio.station = station;
      arreterPub();
      toune = null;
      tounesJouees = Math.floor(Math.random() * 4);
      if (station < 0) afficher('RADIO FERMÉE');
      if (!ctx) return;
      const t = ctx.currentTime;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(station < 0 ? 0 : radio.volume, t);
      // Le grichage entre deux postes.
      grichage.gain.cancelScheduledValues(t);
      grichage.gain.setValueAtTime(station < 0 ? 0.006 : 0.25, t);
      grichage.gain.exponentialRampToValueAtTime(0.006, t + 0.6);
    },
    setVolume(v) {
      radio.volume = v;
      if (ctx && radio.station >= 0) bus.gain.setValueAtTime(v, ctx.currentTime);
    },
    demarrer() {
      if (!preparer()) return;
      if (radio.station >= 0 && !toune && !pubEnCours) radio.syntoniser(radio.station);
    },
  };
  return radio;
}
