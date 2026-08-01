# Structure de Sans Escale

## Arborescence

```
sans-escale-game-development/
├── index.html              # template Vite + bloc SEO (lang=fr)
├── package.json            # sansescale v0.0.0
├── vite.config.ts          # base '/sansescale/', react + tailwind + singlefile
├── tsconfig.json
├── .gitignore                 # deps, secrets, fichiers d'agents IA
├── about.md / README.md / structure.md / features.md / todo.md / changelog.md
├── public/
│   ├── favicon.png
│   ├── og-image.png / og-image.webp
│   └── icon.webp             # carte du menu, 128x128
└── src/
    ├── main.tsx
    ├── index.css
    ├── gameConfig.ts          # BIOMES (10), SKINS (7), HATS (7), ACHIEVEMENTS (10), audio
    ├── App.tsx                # composant unique : état, boucle, rendu
    └── utils/cn.ts
```

## `gameConfig.ts`

Toute la donnée statique du jeu, séparée du composant : dix `Biome` (dégradés de ciel, sol,
tuyaux, type de météo, gamme musicale), sept `BirdSkin`, sept `Hat`, dix `Achievement` (une
fonction `check()` pure par succès), et `SoundController` — synthèse Web Audio de la
musique et des effets, une gamme différente par biome.

## `App.tsx`, de haut en bas

- **Constantes physiques** (`BIRD_SIZE`, `GROUND_HEIGHT`, `PIPE_WIDTH`...) et
  `getDifficulty(score)` : gravité, vitesse, écart et intervalle des tuyaux, tous en
  fonction du score sur une courbe logarithmique
- **Décor** (`makeScenery`) : montagnes, collines, arbres générés une fois via un PRNG
  déterministe (seed fixe), pas à chaque frame
- **État persisté** (`localStorage`, préfixe `sansescale-`) : pièces, record, skins et
  chapeaux débloqués/équipés, parties jouées, biomes visités, **succès réclamés**
- **Récompenses de succès** : un `useEffect` compare en continu les stats du joueur aux
  conditions de chaque succès (`ACHIEVEMENTS[].check`) et crédite les pièces une seule fois
  par succès nouvellement complété — voir le bug corrigé dans `todo.md`
- **`gameLoop`** : tout le pas de simulation (gravité, tuyaux, pickups, collisions,
  météo, transitions de biome) puis tout le dessin Canvas, rappelée en boucle par
  `requestAnimationFrame`
- **Contrôles** : clavier (Espace/↑/W, F, M), pointer (tap/clic sur le canvas)
- **Rendu JSX** : écran menu (sélection de mode), HUD, canvas, overlay game over, modales
  boutique et succès

## Collisions

Un tuyau est un rectangle haut + rectangle bas séparés par un trou (`topHeight` →
`topHeight + gap`). Le test de collision compare la boîte de l'oiseau à ces bornes
verticales quand son `x` chevauche la largeur du tuyau. Un court délai de grâce (700 ms)
ignore les collisions au tout début d'une partie ; le bouclier (pickup) absorbe un choc
avant de se briser, en mode Zen la mort est désactivée entièrement.

## Modes de jeu

`getDifficulty(score)` est pure et ignore le mode — le mode modifie son résultat au point
d'usage dans `gameLoop` : Zen réduit la gravité effective de 30%, Hardcore multiplie la
vitesse effective des tuyaux et du décor par 1,4 (voir le bug corrigé dans `todo.md`), et
seul le mode Progressif fait défiler les biomes tous les 12 points.

## Build

`vite-plugin-singlefile` inline le JS et le CSS dans `index.html` (~280 Ko). Le `dist/`
contient en plus `favicon.png`, `og-image.png/webp` et `icon.webp` copiés depuis `public/`.
`base: '/sansescale/'` fait résoudre ces assets sous `https://games.hylst.fr/sansescale/`.
