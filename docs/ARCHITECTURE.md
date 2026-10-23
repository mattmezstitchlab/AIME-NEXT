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
