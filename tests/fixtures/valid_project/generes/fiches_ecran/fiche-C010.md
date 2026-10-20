# Fiche d'Écran Déduite : C010

- **Référence canonique** : `C010`
- **Label / Titre** : dossier-detail
- **URL / Signal** : `/files/[id]`
- **Rôles habilités** : `GESTIONNAIRE`
- **Importance maximale** : `critique`

## 1. Contextes d'usage observés

- `donnees=COMPLETES`
- `dossier=PRET`
- `infos=ACQUISES`
- `justificatifs=VALIDES`
- `origine=RECHERCHE`

## 2. Fonctionnalités et Contenus actionnés

- `FEAT-SOUMETTRE`

## 3. Entrées (provenance des flux)

- PF-DOSSIER-NOM (étape 3) venant de PF-DOSSIER-PJ-SEG [CALL]

## 4. Sorties (prochaines transitions)

- PF-DOSSIER-NOM (étape 5) vers ND-021 [ACT]