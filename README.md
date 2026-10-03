# Incremental Québécois

Jeu incrémental mobile 100 % en joual, inspiré de Mon Bazou. Tu pars à pied, tu ramasses des canettes, pis tu bâtis ton empire jusqu'au concessionnaire.

## Jalon 1 : prototype « chiffres seulement »

- Une job à pied (ramasser des canettes), un compteur de cash et un bouton pour taper
- 5 achats (tape, revenu passif, multiplicateur)
- Sauvegarde locale et gains hors-ligne (plafonnés à 8 h)
- Objectif affiché : ton premier bazou (500 $)

## Jalon 6 : monétisation et app Android

- Boost x2 : une pub récompensée = 10 minutes de gains doublés (jusqu'à 60 min d'avance). Le boost compte aussi hors-ligne.
- Jamais de pub forcée : si tu fermes la pub avant la fin, t'as juste pas de boost.
- Achat « Pas de pubs » (3,99 $) : le boost devient gratuit. Gardé au prestige.
- Sur le web, la pub est une pub de démo de 5 secondes. Les vraies pubs (AdMob) pis l'achat (Google Play) arrivent dans l'app Android.
- Projet Android généré avec Capacitor dans `android/`.
- Chaque endroit (maison, magasin général, garage, lot) est sa propre scène sur le rang. Quand tu changes d'endroit, ton bazou part, coupure VHS, pis il arrive plus loin en reculant dans l'entrée (environ 2 s). S'il roule pas, c'est juste la coupure. De temps en temps, il part livrer tout seul pis revient.
- Le magasin général à Réjean : chips, café, bière, cigarettes, vape, vin, vers de terre pis bois de chauffage donnent des bonus courts sur tes tapes ou ton passif, payés avec le cash du jeu. Les prix suivent tes revenus. Marques inventées seulement.

## Jalon 5 : garage, concessionnaire et prestige

- Le garage à Ti-Guy (50 000 $) pis le concessionnaire (1 000 000 $), chacun avec ses achats
- Les deux apparaissent dans la scène 3D, pis le rang finit au plus chaud
- Prestige : à 25 M$ gagnés avec le concessionnaire, tu vends l'empire pis tu repars avec de la réputation (+10 % par point, pour toujours)
- 4 nouvelles quêtes pour mener jusque-là

## Jalon 4 : quêtes et personnages

- 14 quêtes en joual, une à la fois : ta mère, Ginette du dépanneur, Ti-Guy pis le bonhomme Gagnon
- Chaque quête suit ta progression (canettes, achats, bazou) pis donne du cash quand tu la réclames
- La dernière (gagner 50 000 $) prépare le garage du prochain jalon

## Jalon 2 : le premier bazou

- À 500 $, tu achètes le bazou du bonhomme Gagnon (sur les blocs, pas de batterie)
- 4 pièces essentielles à réparer (batterie, pneus, démarreur, freins), plus la carrosserie (x1,25)
- Quand ça roule : tu livres des pizzas (1,50 $ par tape) pis 3 jobs motorisées se débloquent
- Dans la scène 3D : pancarte « à vendre », char sur les blocs, pneus pis rouille qui changent avec tes réparations

## Le rang en 3D (style Bazou VHS)

- Scène Three.js : maison de rang, le bazou à vendre, érables, sapins, poteaux d'Hydro
- Rendu à 1/3 de résolution sans lissage, brume, palette délavée, lignes VHS (désactivables)
- Le rang passe du gris brumeux à une lumière plus chaude à mesure que tu gagnes du cash
- Interface nette par-dessus : VT323 pour les chiffres, IBM Plex Mono pour les textes

## Sons pis radio du char

Faits à la main avec Web Audio, aucun fichier à télécharger.

- Effets (`src/platform/sons.ts`) : canette ou sonnette quand tu tapes, ka-ching quand tu achètes, trois notes country pour une quête, le moteur du bazou pis la neige VHS pendant les trajets.
- Radio (`src/platform/radio.ts`) : deux stations, Radio Rang 98,7 (country/folk) pis Garage FM 103,3 (rock de garage), 4 tounes chacune composées en code, avec un son « radio AM ». Aux deux tounes, une fausse pub de radio locale en joual, lue par la voix du navigateur (en français canadien si l'appareil en a une) pis affichée en texte.
- Le titre de la toune ou la pub défile sous ton cash. Tape dessus pour changer de poste (ou fermer la radio).
- Dans MENU > OPTIONS : station, volume radio pis volume des effets (gardés sur l'appareil).

**Crédits et licences** : toute la musique pis les sons sont composés dans le code du jeu, donc 100 % à nous, usage commercial correct. La voix des pubs est celle du système du joueur (synthèse vocale du navigateur), rien n'est enregistré ni distribué avec le jeu. Tounes, artistes, stations pis commerces : tous inventés.

## Lancer le jeu

```bash
npm install
npm run dev     # ouvre http://localhost:5173
npm test        # tests de la logique du jeu
npm run build   # version web dans dist/
npm run dev:sans-pubs # mode dev sans pubs : boost direct, boutique cachée
npm run android # build web, sync pis ouvre le projet dans Android Studio
```

## Structure

- `src/game/` : la logique du jeu (état, achats, bazou, quêtes, sauvegarde), sans rien d'affichage, testée avec Vitest
- `src/scene/rang.ts` : la scène 3D du rang
- `src/main.ts` : l'interface web
- `src/style.css` : le style (clair et sombre)

- `src/platform/` : pubs pis achats (démo sur le web)

Pour l'APK, il faut Android Studio sur ton ordi (le SDK Android est pas dans le conteneur).

Stack : TypeScript + Vite + Three.js + Capacitor (Android).
