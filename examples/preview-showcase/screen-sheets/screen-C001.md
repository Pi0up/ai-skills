# Fiche d'Écran : C001 (Fiche Détail d'une Salle)

- **Code canonique** : `C001`
- **Template** : Contenu / Fiche (`type=C`, `subtype=fiche`)
- **URL** : `/rooms/[id]` (Relatif à `/rooms`)
- **Accès** : `public`
- **Rôles habilités** : `ANONYMOUS`, `CLIENT`, `ADMIN`
- **Tags** : `MVP`
- **Page dynamique** : `dynamic=yes`

## 1. Description fonctionnelle
Présentation exhaustive des équipements, photos haute résolution, calendrier de disponibilité, tarifs horaires/journaliers et avis clients.

## 2. Éléments clés de l'interface
- Galerie média
- Sélecteur de créneaux horaires
- Ancre interne des avis clients (`C001#avis`)
- Bouton CTA principal "Réserver ce créneau"

## 3. Entrées & Contexte requis
- `ctx_in` : `room_id=INTEGER`

## 4. Sorties & Transitions
- Clic sur "Réserver ce créneau" -> tunnel de réservation `F001`
- Clic sur l'ancre "Voir les 24 avis" -> défilement vers `C001#avis`
- Clic sur "Modifier" (ADMIN uniquement) -> `F001@ADMIN:EDIT`
