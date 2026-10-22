# Fiche d'Écran : F001 (Tunnel de Réservation)

- **Code canonique** : `F001`
- **Template** : Formulaire / Stepper (`type=F`, `subtype=stepper`)
- **URL** : `/booking/[id]`
- **Accès** : `protected`
- **Rôles habilités** : `CLIENT`, `ADMIN`
- **Tags** : `MVP`, `SP2`

## 1. Description fonctionnelle
Tunnel en 3 étapes : coordonnées, options additionnelles (vidéoprojecteur, traiteur), et validation du récapitulatif.

## 2. Éléments clés de l'interface
- Stepper indicateur d'avancement
- Formulaire de facturation
- Variantes d'état : `F001:RECAP` (récapitulatif avant paiement)
- Popin de confirmation : `F001!confirmation`

## 3. Entrées & Contexte requis
- `ctx_in` : `room_id=INTEGER`, `slot_id=STRING`, `auth_token=JWT`

## 4. Sorties & Transitions
- Validation formulaire -> `PF-PAIEMENT-EXPANDED` (appel de sous-parcours de paiement)
- En cas de besoin d'assistance -> rupture ⏸ avec appel externe `EXT-SUPPORT-RECALL`
- Annulation -> retour sur la fiche salle `C001`
