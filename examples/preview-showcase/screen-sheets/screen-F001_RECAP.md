# Fiche Écran Déduite : F001:RECAP

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `F001:RECAP`
- **Type de Composant** : Variante Structurelle de Formulaire (`:VARIANT`)
- **Écran de Base** : `F001`
- **URL Canonique** : `/stays/[id]/book/recap`
- **Rôles Autorisés** : `VOYAGEUR`, `ADMIN`
- **Importance Calculée** : Critique (Dernière étape avant engagement financier)

---

## 1. Contexte d'Usage & États Observables
- `basket=FINALIZED`
- `pricing=LOCKED`
- `host_approval=GRANTED` (si issu de variante)

---

## 2. Contenus & Capacités Actionnables
- Tableau de décomposition tarifaire (loyer éco-lodge, taxes locales, options)
- Consentement obligatoire aux Conditions Générales de Vente et Charte Éco-Voyageur
- `FEAT-VALIDER-COMMANDE` (Transition vers module de paiement)

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Sortie de l'attente `ND_ATT1` dans `PF-RESERVATION-NOM`
- Rejonction de l'approbation manuelle `ND_EXT_APPROVAL` dans `PF-RESERVATION-VAR-HOST-APPROVAL`

---

## 4. Sorties (Où va l'utilisateur ?)
- Appel de sous-parcours `CALL_PAY` vers `PF-PAIEMENT-SEG`

---

## 5. Ruptures & Mémoire de Session
- **Point de Reprise** : Cet écran est le point de reprise garanti après l'accord externe de l'hôte (`ND_EXT_APPROVAL`, délai 24h).

---

## 6. Signaux d'Observabilité & Tracking
- **Pageview** : `/stays/:id/book/recap`
- **Événements** : `cgv_accepted`, `cta_proceed_to_payment`
