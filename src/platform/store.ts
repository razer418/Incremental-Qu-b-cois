/**
 * Achats in-app. Sur le web y'en a pas : on le dit au joueur.
 * Sur Android, Google Play Billing va se brancher ici.
 */
export interface Store {
  available: boolean;
  /** Achète « pas de pubs ». Retourne true si l'achat est confirmé. */
  buyNoAds(): Promise<boolean>;
}

export const NO_ADS_PRICE = '3,99 $';

export const webStore: Store = {
  available: false,
  buyNoAds: async () => false,
};
