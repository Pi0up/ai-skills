# Fiche d'Écran : HOME (Accueil & Vitrine)

- **Code canonique** : `HOME`
- **Template** : Homepage (`type=HOME`)
- **URL** : `/` (Absolu)
- **Accès** : `public`
- **Rôles habilités** : `ANONYMOUS`, `CLIENT`, `ADMIN`
- **Tags** : `MVP`

## 1. Description fonctionnelle
Page d'accueil de la plateforme de réservation d'espaces et salles de réunion. Propose le moteur de recherche rapide, la mise en avant des espaces vedettes et l'accès à l'espace personnel.

## 2. Éléments clés de l'interface
- Moteur de recherche (critères : date, ville, capacité)
- Carrousel des espaces recommandés
- Témoignages et avis certifiés
- Barre de navigation principale vers le catalogue (`L001`) et le compte client

## 3. Entrées & Contexte requis
- Aucune condition préalable (`ctx_in : aucun`).

## 4. Sorties & Transitions
- Clic sur "Rechercher" -> `L001` (`/rooms?city=...`)
- Clic sur "Aide" -> ouverture module modal `M001`
- Clic sur "Mon espace" -> redirection `D001` si authentifié
