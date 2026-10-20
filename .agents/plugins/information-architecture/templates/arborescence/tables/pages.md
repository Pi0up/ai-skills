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
| D001 | account | HOME | 4 | /account | BUYER, ADMIN | |
| F002 | checkout | HOME | 5 | /checkout | BUYER | FEAT-FINALISER |
