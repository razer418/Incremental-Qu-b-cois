# Incremental Québécois

Jeu incrémental mobile 100 % en joual, inspiré de Mon Bazou. Tu pars à pied, tu ramasses des canettes, pis tu bâtis ton empire jusqu'au concessionnaire.

## Jalon 1 : prototype « chiffres seulement »

- Une job à pied (ramasser des canettes), un compteur de cash et un bouton pour taper
- 5 achats (tape, revenu passif, multiplicateur)
- Sauvegarde locale et gains hors-ligne (plafonnés à 8 h)
- Objectif affiché : ton premier bazou (500 $)

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

- `src/game/` : la logique du jeu (état, achats, sauvegarde), sans rien d'affichage, testée avec Vitest
- `src/scene/rang.ts` : la scène 3D du rang
- `src/main.ts` : l'interface web
- `src/style.css` : le style (clair et sombre)

Stack : TypeScript + Vite + Three.js. Capacitor (app Android) arrive au Jalon 6.
