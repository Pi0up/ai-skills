# Table `pages` — Arborescence Reference Repository

> Source of truth for application hierarchy, template codes, and canonical URLs.
> Conforms to spec-arborescence.md (Section 6.1).

| code | label | parent | ordre | url | access | fonctionnalites |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| HOME | home | — | — | / | ANONYMOUS, BUYER, ADMIN | |
| L001 | search-results | HOME | 1 | /search-results | ANONYMOUS, BUYER, ADMIN | FEAT-OUVRIR-PRODUIT |
| L002 | products | HOME | 2 | /products | ANONYMOUS, BUYER, ADMIN | |
| C001 | product-detail | L002 | 1 | /products/[id] | ANONYMOUS, BUYER, ADMIN | FEAT-COMMANDER |
| F001 | login | HOME | 3 | /login | ANONYMOUS | FEAT-CONNEXION |
| E001 | error-404 | HOME | 4 | /404 | ANONYMOUS | |
| D001 | account | HOME | 5 | /account | BUYER, ADMIN | |
| F002 | checkout | HOME | 6 | /checkout | BUYER | FEAT-FINALISER |
| H001 | workspace | HOME | 7 | /workspace | BUYER, ADMIN | |
| L003 | workspace-projects | H001 | 1 | /workspace/projects | BUYER, ADMIN | |
| C002 | project-detail | L003 | 1 | /workspace/projects/[id] | BUYER, ADMIN | |
| F003 | project-new | L003 | 2 | /workspace/projects/new | BUYER, ADMIN | |
