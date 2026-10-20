| code | label | parent | ordre | url | access | fonctionnalites |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| HOME | home | — | — | / | ANONYMOUS, BUYER, ADMIN, GESTIONNAIRE | |
| L001 | search-results | HOME | 1 | /search-results | ANONYMOUS, BUYER, ADMIN | FEAT-OUVRIR-PRODUIT |
| L002 | products | HOME | 2 | /products | ANONYMOUS, BUYER, ADMIN | |
| C001 | product-detail | L002 | 1 | /products/[id] | ANONYMOUS, BUYER, ADMIN | FEAT-COMMANDER |
| F001 | login | HOME | 3 | /login | ANONYMOUS | FEAT-CONNEXION |
| D001 | account | HOME | 4 | /account | BUYER, ADMIN | |
| F002 | checkout | HOME | 5 | /checkout | BUYER | FEAT-FINALISER |
| C010 | dossier-detail | HOME | 6 | /files/[id] | GESTIONNAIRE | FEAT-SOUMETTRE, FEAT-VALIDER-INFOS, FEAT-DEMANDER-AIDE |
| F010 | justificatifs | C010 | 1 | /files/[id]/documents | GESTIONNAIRE | FEAT-TELEVERSER |
