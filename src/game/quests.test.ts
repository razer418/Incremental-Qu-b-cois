import { describe, expect, it } from 'vitest';
import { CHARACTERS, QUESTS } from './quests';
import { PARTS } from './car';
import { getUpgrade } from './upgrades';
import { activeQuest, buy, buyCar, claimQuest, newGame, questDone, questProgress, repair, tap } from './state';
import { load } from './save';

describe('les quêtes', () => {
  it('chaque quête pointe vers un personnage, un achat ou une pièce qui existe', () => {
    for (const q of QUESTS) {
      expect(CHARACTERS[q.giver]).toBeDefined();
      const o = q.objective;
      if (o.kind === 'upgrade') expect(getUpgrade(o.id)).toBeDefined();
      if (o.kind === 'repair') expect(PARTS.some((p) => p.id === o.part)).toBe(true);
    }
  });

  it('commence avec ta mère qui te sort du sous-sol', () => {
    const s = newGame(0);
    expect(activeQuest(s)?.giver).toBe('mere');
    expect(questDone(s)).toBe(false);
  });

  it('on réclame seulement quand c’est fait, pis la récompense rentre', () => {
    const s = newGame(0);
    expect(claimQuest(s)).toBeNull();
    for (let i = 0; i < 25; i++) tap(s);
    expect(questProgress(s, activeQuest(s)!)).toBe(1);
    const cash = s.cash;
    expect(claimQuest(s)?.id).toBe('sous-sol');
    expect(s.cash).toBeCloseTo(cash + 2);
    expect(s.questIndex).toBe(1);
  });

  it('suit le bazou : achat, pneus, roule', () => {
    const s = newGame(0);
    s.questIndex = QUESTS.findIndex((q) => q.id === 'a-vendre');
    s.cash = 1750;
    expect(questProgress(s, activeQuest(s)!)).toBeCloseTo(0.5);
    s.cash = 100_000;
    buyCar(s);
    expect(claimQuest(s)?.id).toBe('a-vendre');
    expect(questDone(s)).toBe(false);
    repair(s, 'pneus');
    expect(claimQuest(s)?.id).toBe('pneus');
    repair(s, 'batterie');
    expect(questProgress(s, activeQuest(s)!)).toBeCloseTo(0.5);
    repair(s, 'demarreur');
    repair(s, 'freins');
    expect(claimQuest(s)?.id).toBe('souper');
    buy(s, 'circulaires');
    expect(claimQuest(s)?.id).toBe('publisac');
  });

  it('rien après la dernière quête', () => {
    const s = newGame(0);
    s.questIndex = QUESTS.length;
    expect(activeQuest(s)).toBeNull();
    expect(claimQuest(s)).toBeNull();
  });

  it('une vieille sauvegarde repart à la première quête', () => {
    const storage = {
      getItem: () => JSON.stringify({ version: 1, cash: 5, totalEarned: 5, taps: 50, upgrades: {}, lastTick: 0 }),
      setItem: () => {},
      removeItem: () => {},
    };
    expect(load(storage, 0).questIndex).toBe(0);
  });
});
