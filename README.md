# Sans Escale

**Vol direct, sans retour. Dix biomes en mode Progressif, zéro pause.**

Joue ici : [games.hylst.fr/sansescale/](https://games.hylst.fr/sansescale/)

![Sans Escale](og-image.png)

## Comment on joue

L'oiseau tombe en continu, un appui le fait remonter d'un battement d'aile. Il faut
enchaîner les tuyaux sans les toucher : chaque tuyau franchi rapporte un point. Des pièces,
des boucliers et des ralentis flottent au fil du vol. Le score fait défiler dix biomes en mode Progressif
différents (un tous les 12 points en mode Progressif), chacun avec sa météo et sa musique.

## Contrôles

| Action | Effet |
|--------|-------|
| Espace / Flèche haut / W | Battre des ailes |
| Clic / tap sur le canvas | Battre des ailes |
| F | Plein écran |
| M | Couper / activer le son |

## Ce qu'il y a dedans

- 3 modes : Progressif (biomes évolutifs), Zen (gravité adoucie, pas de mort), Hardcore
  (défilement 40% plus rapide)
- 10 biomes avec météo dédiée (pluie, neige, sable, lucioles, étoiles, pétales...) et
  musique procédurale propre à chacun
- Boutique : 7 skins et 7 chapeaux à débloquer avec les pièces ramassées en vol
- 10 succès à débloquer, chacun avec une récompense en pièces créditée automatiquement
- Bouclier et ralenti temporaires ramassables en vol
- Mode plein écran, jouable au clavier, à la souris ou au tactile

## L'arborescence

```
sans-escale-game-development/
├── index.html          # template + bloc SEO
├── vite.config.ts      # base '/sansescale/' + singlefile
├── public/
│   ├── favicon.png
│   ├── og-image.png / og-image.webp
│   └── icon.webp        # carte du menu, 128x128
└── src/
    ├── main.tsx
    ├── gameConfig.ts     # biomes, skins, chapeaux, succès, audio
    ├── App.tsx           # état, boucle de jeu, rendu Canvas
    └── utils/cn.ts
```

## Dev

```bash
npm install
npm run dev       # http://localhost:5173/
npm run build     # dist/index.html, un seul fichier
npm run preview
```

## Stack

React 19, TypeScript 5.9 (strict), Tailwind CSS 4, Vite 7, vite-plugin-singlefile.

Zéro sprite : tout est dessiné en Canvas 2D, les sons sont synthétisés au vol.

## Licence

AGPL-3.0-or-later, Geoffroy Streit (Hylst). Voir `LICENSE`.
