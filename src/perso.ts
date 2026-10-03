// La section « Le look du bazou » : une ligne par catégorie, des flèches pour magasiner,
// pis l'aperçu se voit tout de suite sur le bazou dans le rang.
import { CATEGORIES, LOOK, choisie, possede, poser, type Categorie } from './game/look';
import { assez, type GameState } from './game/state';
import { formatMoney } from './game/format';
import { t } from './game/i18n';
import type { CarLook } from './scene/rang';

/** Sans toucher aux flèches, l'aperçu revient au look posé. */
const APERCU_MS = 10_000;

export function createPerso(o: {
  liste: HTMLElement;
  etat: () => GameState;
  /** Après un achat : sauver, son, réafficher. */
  achete: () => void;
  /** On magasine : le bazou doit être dans le cadre. */
  apercu: () => void;
}) {
  const vu = {} as Record<Categorie, number>;
  let touche = 0;
  const indexPose = (c: Categorie) => LOOK[c].options.indexOf(choisie(o.etat(), c));
  const option = (c: Categorie) => LOOK[c].options[vu[c] ?? indexPose(c)];

  const rows = CATEGORIES.map((c) => {
    const li = document.createElement('li');
    li.className = 'upgrade look';
    li.innerHTML = `
      <button type="button" class="fleche" aria-label="${t('Précédent')}">‹</button>
      <div class="upgrade-info"><strong></strong><small></small></div>
      <button type="button" class="fleche" aria-label="${t('Suivant')}">›</button>
      <button type="button" class="buy"><span class="cost"></span></button>`;
    li.querySelector('strong')!.textContent = t(LOOK[c].nom);
    const [prec, suiv] = li.querySelectorAll<HTMLButtonElement>('.fleche');
    const tourner = (d: number) => {
      const n = LOOK[c].options.length;
      vu[c] = ((vu[c] ?? indexPose(c)) + d + n) % n;
      touche = Date.now();
      o.apercu();
    };
    prec.addEventListener('click', () => tourner(-1));
    suiv.addEventListener('click', () => tourner(1));
    const btn = li.querySelector<HTMLButtonElement>('.buy')!;
    btn.addEventListener('click', () => {
      if (poser(o.etat(), c, option(c).id)) o.achete();
    });
    o.liste.append(li);
    return { c, li, btn, nom: li.querySelector('small')!, cost: li.querySelector<HTMLElement>('.cost')! };
  });

  return {
    render(): void {
      const s = o.etat();
      if (touche && Date.now() - touche > APERCU_MS) {
        for (const c of CATEGORIES) delete vu[c];
        touche = 0;
      }
      for (const r of rows) {
        const x = option(r.c);
        const pose = choisie(s, r.c).id === x.id;
        const a = possede(s, r.c, x.id);
        r.nom.textContent = pose ? t(x.nom) : t('{nom} (aperçu)', { nom: t(x.nom) });
        r.cost.textContent = pose ? t('POSÉ') : a ? t('POSER') : formatMoney(x.prix);
        r.btn.disabled = pose || (!a && !assez(s, x.prix));
        r.li.classList.toggle('done', pose);
        if (!pose && !a) r.btn.style.setProperty('--p', `${Math.min(100, (s.cash / x.prix) * 100).toFixed(1)}%`);
      }
    },
    /** Les couleurs à montrer dans le rang : l'aperçu si on magasine. */
    look(): Pick<CarLook, 'peinture' | 'collant' | 'mags' | 'flaps'> {
      const collant = option('collant');
      return {
        peinture: option('peinture').couleur!,
        collant: { id: collant.id, couleur: collant.couleur },
        mags: option('mags').couleur,
        flaps: option('flaps').couleur,
      };
    },
  };
}
