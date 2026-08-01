# Fonctionnalités de Sans Escale

## Gameplay

- ✅ Boucle infinie classique : battre des ailes pour rester en vol, franchir les tuyaux
- ✅ 3 modes : Progressif (biomes évolutifs), Zen (gravité -30%, pas de mort), **Hardcore
  (défilement 1,4x plus rapide, bug corrigé — voir todo.md)**
- ✅ 10 biomes visuels avec météo dédiée et musique procédurale par biome, transition tous
  les 12 points en mode Progressif
- ✅ Score au tuyau franchi
- ✅ Pièces à ramasser en vol, boutique de 7 skins et 7 chapeaux
- ✅ 2 power-ups temporaires : bouclier (absorbe un choc), ralenti (défilement réduit)
- ✅ 10 succès avec récompense en pièces, **désormais réellement créditée** (bug corrigé —
  voir todo.md), compteur de progression fiable dans la modale Succès
- ✅ Record de score, pièces, skins/chapeaux et succès sauvegardés (localStorage)

## Interface

- ✅ Écran menu avec sélection de mode
- ✅ HUD en jeu (score, pièces, record, ralenti actif avec minuteur)
- ✅ Overlay « Crash » avec statistiques de fin de partie et biome atteint
- ✅ Modales Boutique et Succès accessibles depuis le menu et l'écran de fin
- ✅ Mode plein écran, jouable au clavier, à la souris ou au tactile
- ✅ Aucun débordement horizontal en 390×844

## Audio

- ✅ Musique de fond et effets sonores (battement d'aile, pièce, power-up, palier, crash)
  synthétisés en Web Audio, gamme musicale et timbre différents par biome
- ✅ Coupure du son au clic ou à la touche M

## Technique

- ✅ Build en un seul fichier (~280 Ko), fonctionne hors ligne
- ✅ TypeScript strict
- ✅ Bloc SEO complet, favicon, og-image (capture réelle du jeu)
- ⬜ Pas de tests automatisés embarqués
