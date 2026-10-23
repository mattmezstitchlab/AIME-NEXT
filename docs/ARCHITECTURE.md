# Architecture

Le document de fondation (Claude Docs « AIME NEXT — Fondations ») décrit les choix et le plan. Ce fichier résume ce qui est en place.

| Dossier | Rôle | Dépend de |
| --- | --- | --- |
| `src/core/modele` | Schémas (Zod), identifiants, ouverture et migrations, import des projets AIMESTUDIO | — |
| `src/core/registre` | Déclaration des types de blocs : contenus acceptés, formes selon la largeur, réglages | modele |
| `src/core/grille` | Grille de 12 : collisions, place libre, contrainte, forme et hauteur, ordre de lecture | registre (types) |
| `src/core/commandes` | Commandes inversibles, historique avec regroupement | modele, registre, grille |
| `src/core/magasin.ts` | Le seul état, auquel l'interface s'abonne | commandes |
| `src/stockage` | IndexedDB (projets et médias), archive `.aime` | core |
| `src/demo` | Démonstration « Léa & Marc » | core |

## Formes selon la largeur (reprises d'AIMESTUDIO)

| Bloc | Paliers (colonnes → forme) |
| --- | --- |
| Date | 1 pastille · 4 compte à rebours · 6 calendrier · 9 frise |
| Lieu | 1 nom · 5 carte · 8 itinéraire |
| Personnes | 1 avatars · 5 équipe · 9 réseau |
| Programme | 1 liste · 9 ligne |
| Titre | 1 titre · 8 grand |

## Format d'un projet

`format: 'aime-projet'`, `version: 1`. Une version plus récente est refusée, jamais tronquée. Les migrations futures s'ajoutent dans `migrations.ts` (`migrations[n]` passe de n à n + 1).

## Le Constructeur (étape 3)

| Dossier | Rôle |
| --- | --- |
| `src/design` | Le style AIME (sombre et clair), traduit en variables CSS ; voir `docs/STYLE.md` |
| `src/rendu` | Un composant d'affichage par type de bloc ; la page en grille ou en colonne (téléphone) ; le même rendu pour l'édition, l'aperçu et l'export HTML |
| `src/editeur` | La scène (sélection, glisser, poignée, clavier), le « + », le panneau contextuel, « Vos informations », l'export HTML |
| `src/app` | « Mes projets », l'ouverture d'un projet, l'enregistrement automatique |

Gestes : glisser pour déplacer, poignée pour redimensionner ; au clavier, flèches pour déplacer, Maj + flèches pour redimensionner, Suppr pour retirer, Échap pour désélectionner ; Ctrl Z et Ctrl Maj Z partout hors des champs. Une place occupée n'est jamais prise : le bloc reste où il était.

Tests : `npm test` (cœur, « + », gestes, stockage) et `npm run parcours` (navigateur réel : glisser, onde, annuler, rechargement, aperçu, exports, téléphone).

## Les trois expériences (étape 4)

| Adresse | Écran | Ce qu'on y fait |
| --- | --- | --- |
| `#/` | Page Zéro | L'orbe, puis six étapes au défilement (point, ligne, relation, grille, composition, projet). Deux actions : découvrir Le Monde AIME, reprendre son travail |
| `#/monde` | Le Monde AIME | Trois chapitres manipulables avec les vrais blocs : la forme suit la largeur, saisi une fois vu partout, six perspectives (le cube). « Créer mon projet » transforme ce qu'on vient d'écrire en premier projet |
| `#/projets` | Mes projets | Nouveau, démonstration, import, liste |
| `#/projet/<id>` | Constructeur | L'édition |

`src/experiences` ne contient que de l'affichage : aucune règle métier, aucun stockage propre.
