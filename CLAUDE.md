# Incremental Québécois

## Règle : le pacing d'abord

Tout nouveau contenu (achat, bâtiment, article, mini-jeu, événement, source de cash, multiplicateur) doit respecter le pacing du jeu.

- Ajoute-le au joueur simulé (`src/game/simulation.ts`) si un vrai joueur l'utiliserait.
- Relance `src/game/equilibre.test.ts` : les temps des jalons et le pire trou sans achat doivent rester dans les bornes.
- Si ça sort des bornes, règle les prix ou les gains du nouveau contenu. On touche pas aux bornes sans l'accord d'Etienne.
- Écris les temps avant/après dans la PR.

## Règle : poser des questions avant de bâtir

Avant de bâtir une nouvelle fonction ou du nouveau contenu, pose à Etienne quelques questions de design courtes.

- Chaque question a des choix A/B/C, une ligne par choix, avec ta reco marquée ⭐.
- En attendant sa réponse, continue d'explorer le code, mais fige aucun choix avant qu'il réponde.

## Conventions

- Tout le texte passe par `t()` avec sa traduction dans `src/game/en.ts`.
- Compare le cash avec `assez()` pis paye avec `payer()`.
- Rien par-dessus l'image 3D. Les réglages vont dans MENU > OPTIONS.
- Jamais de prettier.
