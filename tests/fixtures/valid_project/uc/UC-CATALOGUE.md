---
uc_id: UC-CATALOGUE
nom: Consulter et commander un produit
nature: metier
importance: critique
objectifs: [OBJ-ACHAT-01]
roles: [BUYER]
---

# Cas d'Usage : UC-CATALOGUE

## Parcours Nominal : PF-CATALOGUE-NOM

```yaml
pf_id: PF-CATALOGUE-NOM
uc: UC-CATALOGUE
objectif: OBJ-ACHAT-01
statut: nominal
roles: [BUYER]
ctx_in: origine=ACCUEIL ; panier=VIDE
ctx_out: commande=FINALISEE
funnel: oui
```

| N° | Type | Nœud | Référence | Événement | Contexte produit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | ECR | ND-100 | HOME | Arrive sur l'accueil | origine=ACCUEIL |
| 2 | ECR | ND-101 | L001 | Recherche des produits | recherche=ACTIVE |
| 3 | ECR | ND-102 | L002 | Parcourt le catalogue | catalogue=OUVERT |
| 4 | ECR | ND-103 | C001@BUYER | Consulte la fiche produit | produit=VU |
| 5 | ACT | ND-104 | FEAT-COMMANDER | Ajoute au panier et commande | panier=REMPLI |
| 6 | ECR | ND-105 | F001 | S'authentifie si nécessaire | auth=REQUISE |
| 7 | ECR | ND-106 | D001 | Vérifie son compte | compte=VALIDE |
| 8 | ECR | ND-107 | F002 | Accède au paiement | commande=EN_COURS |
| 9 | ACT | ND-108 | FEAT-FINALISER | Finalise la commande | commande=FINALISEE |
