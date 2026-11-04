# Registre des Pages et Variantes (Synchronisé depuis l'Arborescence)

## 1. Pages de base

| code | url | access | fonctionnalites |
| :--- | :--- | :--- | :--- |
| `HOME` | `/` | ANONYMOUS, BUYER, ADMIN, GESTIONNAIRE | — |
| `L001` | `/search-results` | ANONYMOUS, BUYER, ADMIN | FEAT-OUVRIR-PRODUIT |
| `L002` | `/products` | ANONYMOUS, BUYER, ADMIN | — |
| `C001` | `/products/[id]` | ANONYMOUS, BUYER, ADMIN | FEAT-COMMANDER |
| `F001` | `/login` | ANONYMOUS | FEAT-CONNEXION |
| `D001` | `/account` | BUYER, ADMIN | — |
| `F002` | `/checkout` | BUYER | FEAT-FINALISER |
| `C010` | `/files/[id]` | GESTIONNAIRE | FEAT-SOUMETTRE, FEAT-VALIDER-INFOS, FEAT-DEMANDER-AIDE |
| `F010` | `/files/[id]/documents` | GESTIONNAIRE | FEAT-TELEVERSER |

## 2. Variantes d'écrans déclarées

| ref | condition_spec | access | url_distincte |
| :--- | :--- | :--- | :--- |
| `C001@ADMIN:EDIT` | Spec catalogue, section Édition | ADMIN | — |
| `C001@BUYER` | Spec catalogue, section Consultation acheteur | BUYER | — |
| `C010:EDIT` | Spec dossier, section Édition brouillon | GESTIONNAIRE | — |
| `F010:CONTROLE` | Spec justificatifs, section Affichage contrôle | GESTIONNAIRE | — |

## 3. Composants rattachés

| reference | page | type | label | fonctionnalites |
| :--- | :--- | :--- | :--- | :--- |
| `C001!quick-view` | `C001` | popin/prompt | Aperçu rapide | FEAT-VOIR-RESUME |
| `C001#reviews` | `C001` | ancre interne | Avis | FEAT-POSTER-AVIS |