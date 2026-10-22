# Fiche Écran Déduite : E403

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `E403`
- **Type de Composant** : Page Technique (Erreur 403)
- **URL Canonique** : `/403`
- **Rôles Autorisés** : `ANONYMOUS`, `VOYAGEUR`, `HOTE`, `ADMIN`
- **Importance Calculée** : Occasionnelle (Contrôle d'accès)

---

## 1. Contexte d'Usage & États Observables
- `error=HTTP_403`
- `required_role=RESTRICTED`

---

## 2. Contenus & Capacités Actionnables
- Explication des autorisations manquantes (ex: accès à l'espace Hôte ou Admin non authentifié)
- Bouton de connexion ou demande d'habilitation

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Tentative d'accès non autorisé à une zone protégée

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers `HOME` ou module d'authentification

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : `/403`
- **Événements** : `error_403_view`, `login_cta_click`
