# Incremental Québécois

Jeu incrémental mobile 100 % en joual, inspiré de Mon Bazou. Tu pars à pied, tu ramasses des canettes, pis tu bâtis ton empire jusqu'au concessionnaire.

## Jalon 1 : prototype « chiffres seulement »

- Une job à pied (ramasser des canettes), un compteur de cash et un bouton pour taper
- 5 achats (tape, revenu passif, multiplicateur)
- Sauvegarde locale et gains hors-ligne (plafonnés à 8 h)
- Objectif affiché : ton premier bazou (500 $)

## Jalon 4 : quêtes et personnages

- 10 quêtes en joual, une à la fois : ta mère, Ginette du dépanneur, Ti-Guy pis le bonhomme Gagnon
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

## Lancer le jeu

```bash
npm install
npm run dev     # ouvre http://localhost:5173
npm test        # tests de la logique du jeu
npm run build   # version web dans dist/
```

## Structure

- `src/game/` : la logique du jeu (état, achats, bazou, quêtes, sauvegarde), sans rien d'affichage, testée avec Vitest
- `src/scene/rang.ts` : la scène 3D du rang
- `src/main.ts` : l'interface web
- `src/style.css` : le style (clair et sombre)

Stack : TypeScript + Vite + Three.js. Capacitor (app Android) arrive au Jalon 6.
