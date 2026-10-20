# Fiche d'Écran Déduite : F002

- **Référence canonique** : `F002`
- **Label / Titre** : checkout
- **URL / Signal** : `/checkout`
- **Rôles habilités** : `BUYER`
- **Importance maximale** : `critique`

## 1. Contextes d'usage observés

- `auth=REQUISE`
- `catalogue=OUVERT`
- `commande=EN_COURS`
- `compte=VALIDE`
- `origine=ACCUEIL`
- `panier=REMPLI`
- `produit=VU`
- `recherche=ACTIVE`

## 2. Fonctionnalités et Contenus actionnés

- `FEAT-FINALISER`

## 3. Entrées (provenance des flux)

- PF-CATALOGUE-NOM (étape 7) venant de ND-106 [ECR]

## 4. Sorties (prochaines transitions)

- PF-CATALOGUE-NOM (étape 9) vers ND-108 [ACT]