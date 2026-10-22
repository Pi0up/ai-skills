# Fiche Écran Déduite : F001:PAY

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `F001:PAY`
- **Type de Composant** : Variante de Formulaire Déplié (`:VARIANT`)
- **Écran de Base** : `F001`
- **URL Canonique** : `/stays/[id]/book/pay`
- **Rôles Autorisés** : `VOYAGEUR`, `ADMIN`
- **Importance Calculée** : Critique (Collecte et validation bancaire)

---

## 1. Contexte d'Usage & États Observables
- `intent=PAYMENT`
- `amount=CONFIRMED`

---

## 2. Contenus & Capacités Actionnables
- Formulaire PCI-DSS de saisie sécurisée des coordonnées bancaires
- Option de paiement en monnaie locale complémentaire ou chèques vacances
- `FEAT-SAISIE-CB` (Action de déclenchement du paiement)

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Depuis `F001:RECAP` via appel de sous-parcours `CALL_PAY`

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers challenge 3D-Secure `ND_P03` (événement externe avec pause)
- Vers confirmation finale sur `L002`

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : `/stays/:id/book/pay`
- **Événements** : `card_details_entered`, `3ds_challenge_initiated`
