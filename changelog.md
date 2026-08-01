# Changelog de Sans Escale

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versionnage
[SemVer](https://semver.org/lang/fr/).

## [1.0.0] 2026-08-01

Première version intégrable à Hylst.Games, partie d'un export brut audité puis corrigé.

### Ajouté
- Bloc SEO complet dans `index.html` (description, keywords, og, twitter, robots,
  canonical) et `lang="fr"`
- `favicon.png` 32×32, `og-image.png` 1024×576 (capture réelle du jeu) et sa variante
  `og-image.webp`, `icon.webp` 128×128 pour la carte du menu
- `base: '/sansescale/'` dans `vite.config.ts`
- État `claimedAchievements` (persisté `localStorage`) pour le suivi des succès réclamés
- La doc : `about.md`, `README.md`, `structure.md`, `features.md`, `todo.md`,
  `changelog.md`

### Modifié
- Renommé en **Sans Escale**. « Flappy Bird » est une marque déposée ; le nom original
  reste uniquement dans les `keywords` SEO.
- `package.json` : `react-vite-tailwind` v0.0.0 devenu `sansescale` v0.0.0
- Clés `localStorage` renommées de `flappy-*` vers `sansescale-*`
- Retrait du sous-titre « Par Hylst - Geoffroy + IA » du header en jeu

### Corrigé
- **Les récompenses en pièces des 10 succès n'étaient jamais créditées.** Le compteur de
  succès complétés et l'état « débloqué » de la modale étaient recalculés à la volée sans
  qu'aucun code n'appelle jamais le crédit de pièces correspondant. Ajout d'un suivi
  persisté des succès réclamés et du versement effectif de la récompense, une seule fois
  par succès. Vérifié sur l'application réelle (badge de pièces et modale Succès après un
  vrai déblocage).
- **Le mode Hardcore (« Vitesse extrême ») était strictement identique au mode
  Progressif.** Aucune branche du code ne lisait `gameMode === "hardcore"` pour changer la
  vitesse ; seule la variété des biomes disparaissait. Ajout d'un multiplicateur ×1,4 sur
  la vitesse effective des tuyaux et du décor en Hardcore. Vérifié par mesure directe
  (ratio 1,400 mesuré).

### Vérifié
- QA Playwright avec pilotage automatique lisant l'état réel du jeu : score passé de 0 à 4
  en franchissant des tuyaux, mort par collision avec un tuyau provoquée et observée (pas
  seulement collision au sol), vitesse Hardcore mesurée à 1,4x, récompense de succès
  confirmée dans le DOM réellement rendu après un vrai déblocage.
- Aucun débordement horizontal en 390×844.
