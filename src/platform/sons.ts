// Les sons du jeu, faits à la main avec Web Audio : pas de fichiers à télécharger.
// Le son part seulement après un premier geste du joueur (règle des navigateurs).

export type Son = 'canette' | 'livraison' | 'achat' | 'quete' | 'boost' | 'moteur' | 'coupe';

/** Le son d'un char à retaper : son moteur (Hz pis forme d'onde), combien de fois il tousse avant de partir, pis son klaxon. */
export interface SonChar {
  moteur: number;
  onde: OscillatorType;
  toux: number;
  klaxon: number[];
}

// Un son à chaque annonce du Face-de-Bouc Marché (même id).
export const SONS_CHARS: Record<string, SonChar> = {
  van: { moteur: 52, onde: 'square', toux: 3, klaxon: [330] },
  pickup: { moteur: 45, onde: 'sawtooth', toux: 2, klaxon: [294, 294] },
  castor: { moteur: 60, onde: 'triangle', toux: 1, klaxon: [440] },
  quatre: { moteur: 38, onde: 'sawtooth', toux: 4, klaxon: [220, 220, 220] },
  tempete: { moteur: 55, onde: 'square', toux: 2, klaxon: [392, 330] },
  familiale: { moteur: 48, onde: 'triangle', toux: 1, klaxon: [262, 330, 392] },
  corbillard: { moteur: 34, onde: 'triangle', toux: 2, klaxon: [196, 185] },
  monarque: { moteur: 42, onde: 'sawtooth', toux: 1, klaxon: [349, 440] },
  decapotable: { moteur: 66, onde: 'square', toux: 1, klaxon: [523, 659] },
  limo: { moteur: 40, onde: 'triangle', toux: 1, klaxon: [392, 523, 659, 784] },
  coupe: { moteur: 70, onde: 'square', toux: 1, klaxon: [587] },
  grandpapa: { moteur: 44, onde: 'sawtooth', toux: 3, klaxon: [247, 247] },
  drag: { moteur: 30, onde: 'sawtooth', toux: 2, klaxon: [392, 392, 392, 311] },
  bolide: { moteur: 36, onde: 'sawtooth', toux: 1, klaxon: [330, 415] },
  parade: { moteur: 40, onde: 'square', toux: 1, klaxon: [523, 659, 784, 1047] },
  fusee: { moteur: 46, onde: 'square', toux: 3, klaxon: [370, 370, 294] },
  requin: { moteur: 33, onde: 'sawtooth', toux: 1, klaxon: [165, 175, 165, 175] },
  phenix: { moteur: 50, onde: 'triangle', toux: 1, klaxon: [659, 784, 988] },
  autobus: { moteur: 28, onde: 'square', toux: 3, klaxon: [262, 262] },
  motorise: { moteur: 32, onde: 'triangle', toux: 2, klaxon: [294, 370, 440] },
  pompier: { moteur: 31, onde: 'sawtooth', toux: 1, klaxon: [440, 330, 440, 330] },
  depanneuse: { moteur: 29, onde: 'sawtooth', toux: 3, klaxon: [208] },
  cantine: { moteur: 35, onde: 'square', toux: 2, klaxon: [523, 392, 523] },
  police: { moteur: 47, onde: 'sawtooth', toux: 1, klaxon: [880, 659, 880, 659] },
  monstre: { moteur: 26, onde: 'sawtooth', toux: 2, klaxon: [147, 147, 196] },
  resurfaceuse: { moteur: 58, onde: 'triangle', toux: 1, klaxon: [392, 494, 587, 784] },
  royale: { moteur: 39, onde: 'triangle', toux: 1, klaxon: [330, 392] },
  stockcar: { moteur: 43, onde: 'sawtooth', toux: 1, klaxon: [494] },
  concept: { moteur: 75, onde: 'sine', toux: 1, klaxon: [1047, 1319, 1568] },
  formule: { moteur: 90, onde: 'sawtooth', toux: 1, klaxon: [698, 698] },
};

export interface Sons {
  jouer(son: Son): void;
  /** Un char à retaper : son klaxon quand il arrive, une toux à chaque pièce, il démarre quand il est retapé, pis vroum quand tu le touches. */
  char(id: string, moment: 'achat' | 'piece' | 'fini' | 'vroum'): void;
  /** Volume des effets, de 0 (coupés) à 1. */
  volume: number;
  /** L'AudioContext partagé avec la radio (créé au premier geste). */
  contexte(): AudioContext | null;
}

export function createSons(): Sons {
  let ctx: AudioContext | null = null;
  let bruit: AudioBuffer | null = null;
  let sortie: GainNode | null = null;
  const audio = () => {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      bruit = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = bruit.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      sortie = ctx.createGain();
      sortie.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  };

  // Une note avec une enveloppe qui monte vite pis redescend.
  const note = (c: AudioContext, type: OscillatorType, f: number, t: number, dur: number, vol: number, f2?: number) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(sortie!);
    o.start(t);
    o.stop(t + dur + 0.02);
  };
  const souffle = (c: AudioContext, t: number, dur: number, vol: number, filtre: BiquadFilterType, f: number) => {
    const s = c.createBufferSource();
    s.buffer = bruit;
    const b = c.createBiquadFilter();
    b.type = filtre;
    b.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(b).connect(g).connect(sortie!);
    s.start(t);
    s.stop(t + dur);
  };

  const klaxon = (c: AudioContext, sc: SonChar, t: number) =>
    sc.klaxon.forEach((f, i) => {
      // Deux notes en même temps, comme un vrai klaxon
      note(c, 'square', f, t + i * 0.2, 0.17, 0.05);
      note(c, 'square', f * 1.26, t + i * 0.2, 0.17, 0.04);
    });
  const toux = (c: AudioContext, sc: SonChar, t: number) => {
    for (let i = 0; i < sc.toux; i++) {
      note(c, sc.onde, sc.moteur * 1.6, t + i * 0.22, 0.12, 0.1, sc.moteur);
      souffle(c, t + i * 0.22, 0.1, 0.1, 'lowpass', 500);
    }
    return t + sc.toux * 0.22;
  };

  const sons: Sons = {
    volume: 1,
    contexte: audio,
    char(id, moment) {
      const sc = SONS_CHARS[id];
      if (!sc || sons.volume <= 0) return;
      const c = audio();
      if (!c) return;
      sortie!.gain.value = sons.volume;
      const t = c.currentTime;
      if (moment === 'achat') klaxon(c, sc, t);
      else if (moment === 'piece') toux(c, sc, t);
      else if (moment === 'vroum') {
        // Un coup d'accélérateur dans la cour
        note(c, sc.onde, sc.moteur, t, 0.9, 0.12, sc.moteur * 2.6);
        souffle(c, t, 0.9, 0.1, 'lowpass', 500);
      }
      else {
        // Y tousse, y part, y monte en régime, pis un coup de klaxon.
        const part = toux(c, sc, t);
        note(c, sc.onde, sc.moteur, part, 1.3, 0.12, sc.moteur * 2.4);
        souffle(c, part, 1.3, 0.1, 'lowpass', 450);
        klaxon(c, sc, part + 1.4);
      }
    },
    jouer(son) {
      if (sons.volume <= 0) return;
      const c = audio();
      if (!c) return;
      sortie!.gain.value = sons.volume;
      const t = c.currentTime;
      switch (son) {
        case 'canette': // une canette qui tombe dans le sac
          note(c, 'triangle', 1900 + Math.random() * 300, t, 0.09, 0.12);
          note(c, 'sine', 2900, t + 0.02, 0.07, 0.06);
          break;
        case 'livraison': // ding de sonnette
          note(c, 'triangle', 1320, t, 0.18, 0.1);
          break;
        case 'achat': // ka-ching de vieille caisse
          souffle(c, t, 0.05, 0.25, 'highpass', 3000);
          note(c, 'triangle', 2093, t + 0.05, 0.35, 0.12);
          note(c, 'triangle', 2637, t + 0.1, 0.4, 0.1);
          break;
        case 'quete': // trois notes de guitare country
          [392, 494, 587].forEach((f, i) => note(c, 'square', f, t + i * 0.09, 0.22, 0.05));
          break;
        case 'boost':
          note(c, 'sawtooth', 220, t, 0.45, 0.06, 880);
          break;
        case 'moteur': // le bazou qui démarre pis part
          note(c, 'sawtooth', 45, t, 0.9, 0.12, 95);
          souffle(c, t, 0.9, 0.12, 'lowpass', 400);
          break;
        case 'coupe': // neige de cassette VHS
          souffle(c, t, 0.32, 0.18, 'bandpass', 2500);
          break;
      }
    },
  };
  return sons;
}
