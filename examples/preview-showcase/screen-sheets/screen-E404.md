# Fiche Écran Déduite : E404

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `E404`
- **Type de Composant** : Page Technique (Erreur 404)
- **URL Canonique** : `/404`
- **Rôles Autorisés** : `ANONYMOUS`, `VOYAGEUR`, `HOTE`, `ADMIN`
- **Importance Calculée** : Occasionnelle (Gestion des erreurs de routage)

---

## 1. Contexte d'Usage & États Observables
- `error=HTTP_404`
- `target_url=UNKNOWN`

---

## 2. Contenus & Capacités Actionnables
- Message convivial expliquant que l'écolodge ou la page demandée n'existe pas
- Moteur de recherche de secours et bouton de retour à `HOME`

---

## 3. Entrées (D'où vient l'utilisateur ?)
- URL erronée ou lien rompu

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers `HOME` ou `L001`

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : `/404`
- **Événements** : `error_404_view`, `return_to_home`
