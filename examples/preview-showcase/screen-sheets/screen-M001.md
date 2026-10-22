# Fiche Écran Déduite : M001

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `M001`
- **Type de Composant** : Module Transverse Hors-Arbre
- **Invocation** : `!aide`
- **Portée (Scope)** : `ALL` (Accessible sur toutes les pages de l'arbre)
- **Rôles Autorisés** : `ANONYMOUS`, `VOYAGEUR`, `HOTE`, `ADMIN`
- **Importance Calculée** : Standard

---

## 1. Contexte d'Usage & États Observables
- `module=ACTIVE`
- `host_page=ANY`

---

## 2. Contenus & Capacités Actionnables
- Moteur de recherche de questions fréquentes (politique d'annulation, arrivée autonome, labels)
- Bot de conseil éco-responsable interactif
- Formulaire de mise en relation avec le support utilisateur

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Clic sur l'icône d'aide ou raccourci clavier depuis n'importe quelle page

---

## 4. Sorties (Où va l'utilisateur ?)
- Fermeture du tiroir d'aide et retour à l'écran hôte

---

## 5. Signaux d'Observabilité & Tracking
- **Événements** : `help_module_opened`, `faq_search_performed`, `contact_support`
