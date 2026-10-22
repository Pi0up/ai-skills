# Fiche d'Écran : L001 (Liste des Salles & Espaces)

- **Code canonique** : `L001`
- **Template** : Liste / Datagrid (`type=L`, `subtype=datagrid`)
- **URL** : `/rooms` (Relatif à `/`)
- **Accès** : `public`
- **Rôles habilités** : `ANONYMOUS`, `CLIENT`, `ADMIN`
- **Tags** : `MVP`, `SP1`

## 1. Description fonctionnelle
Catalogue paginé des salles disponibles à la réservation avec facettes de filtrage latéral, tri par prix/pertinence et affichage en grille ou carte.

## 2. Éléments clés de l'interface
- Barre de tri et bouton d'ouverture des filtres avancés (popin `L001!filtres`)
- Liste paginée des cartes de salle
- Indicateurs de disponibilité en temps réel

## 3. Entrées & Contexte requis
- `ctx_in` : `search_query=STRING` (optionnel), `city=STRING`

## 4. Sorties & Transitions
- Sélection d'une salle -> consultation détaillée `C001` (`/rooms/[id]`)
- Clic sur "Filtres avancés" -> popin `L001!filtres`
- Clic sur "Ajouter une salle" (si ADMIN) -> formulaire création `F002` (`/rooms/new`)
