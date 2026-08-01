# TODO de Sans Escale

Audit fait le 2026-08-01 sur l'export brut (`build-flappy-bird-game (2)`), suivi d'une
passe QA navigateur (Playwright + Chromium) avec vérification réelle des deux correctifs
et des mécaniques centrales (vol, score, collision).

---

## ✅ Corrigé — récompenses de succès jamais créditées

- [x] **Les 10 succès affichent une récompense (« +N 🪙 ») qui n'était jamais versée.**
  `completedCount` et l'état « débloqué » de chaque succès dans la modale étaient
  recalculés à la volée via `ACHIEVEMENTS[].check(stats)`, sans aucune trace persistée de
  ce qui avait déjà été réclamé — et nulle part dans le code `addCoins` n'était appelé pour
  un succès complété. Un joueur pouvait débloquer les dix succès sans jamais voir sa
  cagnotte bouger d'un centime à cause d'eux. Corrigé en ajoutant un état
  `claimedAchievements` (persisté dans `localStorage`, clé `sansescale-achievements`) et un
  `useEffect` qui compare les stats courantes aux conditions de chaque succès non encore
  réclamé, crédite la somme une seule fois par succès, et bascule `completedCount` /
  l'état « débloqué » de la modale sur ce set persisté plutôt que sur un recalcul en
  direct. **Vérifié sur l'application réelle** : partie jouée jusqu'au score 4 puis crash
  volontaire contre un tuyau ; après le game over, badge de pièces du header passé de 0 à
  11 (10 de récompense + 1 pièce ramassée en vol), modale Succès affichant « 1 / 10 » et la
  ligne « Premier Envol » marquée comme débloquée avec sa récompense.

## ✅ Corrigé — le mode Hardcore ne changeait rien

- [x] **Le mode Hardcore, annoncé « Vitesse extrême » dans l'écran de sélection, était
  strictement identique au mode Progressif.** `gameMode` n'était lu nulle part dans
  `getDifficulty` ni dans la boucle de jeu pour ce mode précis (seul `zen` réduisait la
  gravité, et seul `progressive` déclenchait le défilement des biomes) : en pratique,
  Hardcore = Progressif moins la variété visuelle des biomes, ce qui le rendait plus
  monotone plutôt que plus dur. Corrigé en appliquant un multiplicateur ×1,4 sur la vitesse
  effective des tuyaux et du décor quand `gameMode === "hardcore"`, au point d'usage dans
  `gameLoop` (même schéma que le modificateur déjà existant pour la gravité en mode Zen).
  **Vérifié par mesure directe** : instrumentation temporaire exposant la vitesse de base et
  la vitesse effective à chaque frame en mode Hardcore, ratio mesuré sur 10 échantillons
  consécutifs = 1,400 (attendu 1,4).

## ✅ La passe QA navigateur

- [x] 0 erreur console, 0 exception non gérée, sur les trois scénarios ci-dessous
- [x] **Vitesse Hardcore mesurée** à 1,4x la vitesse de base, de façon stable sur toute une
  partie (voir correctif ci-dessus)
- [x] **Score et récompense de succès observés réellement** : pilotage automatique visant
  le centre du trou du prochain tuyau, score porté à 4, puis collision volontaire contre le
  tuyau du bas ; état final vérifié directement dans le DOM rendu (pas dans l'objet de
  télémétrie, voir la note méthode ci-dessous) : badge pièces = 11, modale Succès = 1/10
- [x] **Mort par collision avec un tuyau observée**, pas seulement collision avec le sol :
  position de l'oiseau au moment du crash largement au-dessus du sol (`birdY` ≈ 292-451px
  contre un sol à 612px selon les essais)
- [x] Aucun débordement horizontal en 390×844, en menu comme en jeu

### Méthode de vérification, et un piège rencontré

Instrumentation temporaire `window.__qa` exposée en tête de `gameLoop`, lue en continu par
un script Playwright pour piloter l'oiseau et pour comparer vitesse de base / vitesse
effective en Hardcore. **Piège** : une première version plaçait cette exposition à
l'intérieur du bloc `if (gameStateRef.current === "playing")`, qui contient aussi la
déclaration locale de la vitesse effective — l'objet ne se mettait donc jamais à jour une
fois la partie terminée (`gameState` restait bloqué sur `"playing"` dans la télémétrie même
après un vrai game over), rendant la détection de mort invisible au script. Déplacé en tête
de fonction pour s'exécuter à chaque frame quel que soit l'état. Second piège, plus
sournois : cette même télémétrie lisait `coins` et `claimedAchievements` depuis la closure
mémoïsée de `gameLoop` (`useCallback`), dont le tableau de dépendances ne les liste pas —
une fois `gameLoop` créé, ces deux valeurs restaient figées à leur valeur de montage dans
`window.__qa`, **alors que l'UI réelle (React) se remettait à jour normalement**. Le
correctif de récompense fonctionnait donc déjà correctement ; seule la sonde de test
mentait. Le succès a été confirmé en lisant le DOM réellement rendu (badge de pièces du
header, modale Succès) plutôt que l'objet de télémétrie. Leçon : une sonde de debug placée
dans une closure mémoïsée n'est pas neutre, elle peut avoir son propre bug de fraîcheur
indépendant du code qu'elle est censée vérifier — en cas de doute, se fier au rendu réel
plutôt qu'à la sonde. Instrumentation entièrement retirée avant le commit (hash de bundle
identique avant/après son ajout puis son retrait).

---

## ⬜ Idées d'amélioration (non corrigées, notes d'audit)

- [ ] Les succès « Chercheur d'Or » (50 pièces) et « Banquier » (200 pièces) sont vérifiés
  contre le solde courant (`coins`), pas contre un total cumulé à vie. Un joueur qui dépense
  ses pièces en boutique au fur et à mesure peut ne jamais atteindre ces seuils en une seule
  fois, même en ayant gagné largement plus que 200 pièces au total. Comportement déjà
  présent dans le code d'origine (pas introduit par le correctif des récompenses), laissé
  tel quel — un compteur de gains cumulés séparé serait un changement de design, pas un bug.
- [ ] Le bouclier protège aussi d'une chute au sol (rebond au lieu de game over), alors
  qu'il ne devrait normalement protéger que des tuyaux d'après son intitulé. Même
  comportement que Piaf, jamais documenté dans le jeu : pas tranché, laissé tel quel.
