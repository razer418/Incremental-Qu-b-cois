# Incremental Québécois

Jeu incrémental mobile 100 % en joual, inspiré de Mon Bazou. Tu pars à pied, tu ramasses des canettes, pis tu bâtis ton empire jusqu'au concessionnaire.

## Jalon 1 : prototype « chiffres seulement »

- Une job à pied (ramasser des canettes), un compteur de cash et un bouton pour taper
- 5 achats (tape, revenu passif, multiplicateur)
- Sauvegarde locale et gains hors-ligne (plafonnés à 8 h)
- Objectif affiché : ton premier bazou (500 $)

## Lancer le jeu

```bash
npm install
npm run dev     # ouvre http://localhost:5173
npm test        # tests de la logique du jeu
npm run build   # version web dans dist/
```

## Structure

- `src/game/` : la logique du jeu (état, achats, sauvegarde), sans rien d'affichage, testée avec Vitest
- `src/main.ts` : l'interface web
- `src/style.css` : le style (clair et sombre)

Stack : TypeScript + Vite. Three.js (scène 3D) arrive au Jalon 3, Capacitor (app Android) au Jalon 6.
