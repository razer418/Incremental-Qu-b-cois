/**
 * Pubs récompensées. Sur le web, c'est une pub de démo de 5 s (aucune vraie pub).
 * Sur Android, on branchera AdMob ici sans toucher au reste du jeu.
 */
export interface Ads {
  /** Montre une pub récompensée. Retourne true si le joueur l'a regardée au complet. */
  showRewarded(): Promise<boolean>;
}

const DEMO_SECONDS = 5;

export function createDemoAds(dialog: HTMLDialogElement, countdown: HTMLElement, close: HTMLButtonElement): Ads {
  return {
    showRewarded() {
      return new Promise((resolve) => {
        let left = DEMO_SECONDS;
        let done = false;
        const finish = (ok: boolean) => {
          if (done) return;
          done = true;
          clearInterval(timer);
          close.removeEventListener('click', onClose);
          dialog.removeEventListener('cancel', onClose);
          dialog.close();
          resolve(ok);
        };
        const onClose = (e: Event) => {
          e.preventDefault();
          // Fermer avant la fin = pas de récompense, mais jamais bloquant.
          finish(left <= 0);
        };
        const paint = () => {
          countdown.textContent = left > 0 ? `${left}` : 'MERCI!';
          close.textContent = left > 0 ? '[ FERMER ]' : '[ CHERCHER MON BOOST ]';
        };
        const timer = setInterval(() => {
          left -= 1;
          paint();
        }, 1000);
        close.addEventListener('click', onClose);
        dialog.addEventListener('cancel', onClose);
        paint();
        dialog.showModal();
      });
    },
  };
}
