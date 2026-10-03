// Les sons du jeu, faits à la main avec Web Audio : pas de fichiers à télécharger.
// Le son part seulement après un premier geste du joueur (règle des navigateurs).

export type Son = 'canette' | 'livraison' | 'achat' | 'quete' | 'boost' | 'moteur' | 'coupe';

export interface Sons {
  jouer(son: Son): void;
  actif: boolean;
}

export function createSons(): Sons {
  let ctx: AudioContext | null = null;
  let bruit: AudioBuffer | null = null;
  const audio = () => {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      bruit = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = bruit.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
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
    o.connect(g).connect(c.destination);
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
    s.connect(b).connect(g).connect(c.destination);
    s.start(t);
    s.stop(t + dur);
  };

  const sons: Sons = {
    actif: true,
    jouer(son) {
      if (!sons.actif) return;
      const c = audio();
      if (!c) return;
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
