import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, 'public');
const distDir = path.resolve(__dirname, 'dist');
const examplesDir = path.resolve(__dirname, '../examples/preview-showcase');

const files = {};

// 1. sitemap-overview.mmd
files['sitemap-overview.mmd'] = `%%@file id=sitemap-overview project=ECO-STAYS kind=sitemap view=general title="Arborescence Générale Éco-Hébergements" version="1.3"
%%@node HOME code=HOME type=HOME access=public roles=ANONYMOUS,VOYAGEUR,HOTE,ADMIN url=/ order=1
%%@node H001 code=H001 type=H subtype=hub access=protected roles=VOYAGEUR,ADMIN url=/account order=2
%%@node L002 code=L002 type=L subtype=liste access=protected roles=VOYAGEUR,ADMIN url=/account/bookings order=1
%%@node C002 code=C002 type=C subtype=facture access=protected roles=VOYAGEUR,ADMIN url=/account/bookings/[id] order=1
%%@node L001 code=L001 type=L subtype=datagrid access=public roles=ANONYMOUS,VOYAGEUR,ADMIN url=/stays order=3
%%@node C001 code=C001 type=C subtype=fiche access=public roles=ANONYMOUS,VOYAGEUR,ADMIN url=/stays/[id] dynamic=yes order=1
%%@node F001 code=F001 type=F subtype=stepper access=protected roles=VOYAGEUR,ADMIN url=/stays/[id]/book order=1
%%@node H002 code=H002 type=H subtype=hub access=protected roles=HOTE,ADMIN url=/host order=4
%%@node D001 code=D001 type=D subtype=dashboard access=protected roles=HOTE,ADMIN url=/host/dashboard order=1
%%@node L003 code=L003 type=L subtype=datagrid access=protected roles=HOTE,ADMIN url=/host/properties order=2
%%@node F002 code=F002 type=F subtype=formulaire access=protected roles=HOTE,ADMIN url=/host/properties/new order=1
%%@node D002 code=D002 type=D subtype=supervision access=protected roles=ADMIN url=/admin/dashboard order=5
%%@node E404 code=E404 type=E subtype=erreur-404 access=public roles=ANONYMOUS,VOYAGEUR,HOTE,ADMIN url=/404 order=6
%%@node E403 code=E403 type=E subtype=erreur-403 access=public roles=ANONYMOUS,VOYAGEUR,HOTE,ADMIN url=/403 order=7
%%@edge HOME>H001 kind=navigation
%%@edge H001>L002 kind=navigation
%%@edge L002>C002 kind=navigation
%%@edge HOME>L001 kind=navigation
%%@edge L001>C001 kind=navigation
%%@edge C001>F001 kind=navigation
%%@edge HOME>H002 kind=navigation
%%@edge H002>D001 kind=navigation
%%@edge H002>L003 kind=navigation
%%@edge L003>F002 kind=navigation
%%@edge HOME>D002 kind=navigation
%%@edge HOME>E404 kind=navigation
%%@edge HOME>E403 kind=navigation
flowchart TD
  HOME(["HOME · Accueil & Sélections Éco-Responsables"])
  H001["H001 · Espace Voyageur"]
  L002["L002 · Mes Réservations"]
  C002(["C002 · Détail Réservation & Facture"])
  L001["L001 · Catalogue des Écolodges"]
  C001(["C001 · Fiche Détail Écolodge"])
  F001{"F001 · Tunnel de Réservation Séjour"}
  H002["H002 · Espace Hôte Partenaire"]
  D001["D001 · Tableau de Bord Hôte"]
  L003["L003 · Gestion de mes Annonces"]
  F002{"F002 · Dépôt d'une Nouvelle Annonce"}
  D002["D002 · Tableau de Bord Administration"]
  E404["E404 · Page Introuvable"]
  E403["E403 · Accès Refusé"]

  HOME --> H001
  H001 --> L002
  L002 --> C002
  HOME --> L001
  L001 --> C001
  C001 --> F001
  HOME --> H002
  H002 --> D001
  H002 --> L003
  L003 --> F002
  HOME --> D002
  HOME --> E404
  HOME --> E403
`;

// 2. sitemap-detailed.mmd
files['sitemap-detailed.mmd'] = `%%@file id=sitemap-detailed project=ECO-STAYS kind=sitemap view=detailed title="Arborescence Détaillée Éco-Hébergements" version="1.3"
%%@tag MVP color=blue style=fill label="MVP"
%%@tag SP1 color=green style=outline label="Sprint 1"
%%@tag SP2 color=orange style=outline label="Sprint 2"
%%@tag ECO_LABEL color=green style=fill label="Éco-Label"
%%@tag AUDIT color=red style=outline label="Audit & Contrôle"
%%@node HOME code=HOME type=HOME access=public roles=ANONYMOUS,VOYAGEUR,HOTE,ADMIN url=/ order=1 tags=MVP icon=entry
%%@node H001 code=H001 type=H subtype=hub access=protected roles=VOYAGEUR,ADMIN url=/account order=2 tags=SP1 who=VOYAGEUR
%%@node L002 code=L002 type=L subtype=liste access=protected roles=VOYAGEUR,ADMIN url=/account/bookings order=1 tags=MVP who=VOYAGEUR
%%@node L002_dlg_annulation code=L002!annulation type=DLG order=1
%%@node C002 code=C002 type=C subtype=facture access=protected roles=VOYAGEUR,ADMIN url=/account/bookings/[id] order=1 tags=SP1 who=VOYAGEUR
%%@node L001 code=L001 type=L subtype=datagrid access=public roles=ANONYMOUS,VOYAGEUR,ADMIN url=/stays order=3 tags=MVP icon=device
%%@node L001_dlg_filtres code=L001!filtres type=DLG order=1 tags=ECO_LABEL
%%@node C001 code=C001 type=C subtype=fiche access=public roles=ANONYMOUS,VOYAGEUR,ADMIN url=/stays/[id] dynamic=yes order=1 tags=MVP,ECO_LABEL
%%@node C001_dlg_galerie code=C001!galerie type=DLG order=1
%%@node C001_anc_avis code=C001#avis type=ANC order=2
%%@node C001_anc_eco_impact code=C001#eco-impact type=ANC order=3 tags=ECO_LABEL
%%@node C001_admin code=C001@ADMIN type=C subtype=moderation access=protected roles=ADMIN order=4 tags=AUDIT who=ADMIN
%%@node C001_preview code=C001:PREVIEW type=C subtype=brouillon access=protected roles=HOTE,ADMIN order=5 who=HOTE
%%@node C001_admin_edit code=C001@ADMIN:EDIT type=C subtype=audit-edition access=protected roles=ADMIN order=6 tags=AUDIT who=ADMIN
%%@node F001 code=F001 type=F subtype=stepper access=protected roles=VOYAGEUR,ADMIN url=/stays/[id]/book order=1 tags=MVP who=VOYAGEUR
%%@node F001_recap code=F001:RECAP type=F subtype=recap access=protected roles=VOYAGEUR,ADMIN url=/stays/[id]/book/recap order=2 tags=MVP who=VOYAGEUR
%%@node H002 code=H002 type=H subtype=hub access=protected roles=HOTE,ADMIN url=/host order=4 tags=SP2 who=HOTE
%%@node D001 code=D001 type=D subtype=dashboard access=protected roles=HOTE,ADMIN url=/host/dashboard order=1 tags=SP2 who=HOTE
%%@node L003 code=L003 type=L subtype=datagrid access=protected roles=HOTE,ADMIN url=/host/properties order=2 tags=SP2 who=HOTE
%%@node F002 code=F002 type=F subtype=formulaire access=protected roles=HOTE,ADMIN url=/host/properties/new tone=accent order=1 tags=SP2,ECO_LABEL who=HOTE
%%@node D002 code=D002 type=D subtype=supervision access=protected roles=ADMIN url=/admin/dashboard order=5 tags=AUDIT who=ADMIN
%%@node E404 code=E404 type=E subtype=erreur-404 access=public roles=ANONYMOUS,VOYAGEUR,HOTE,ADMIN url=/404 order=6
%%@node E403 code=E403 type=E subtype=erreur-403 access=public roles=ANONYMOUS,VOYAGEUR,HOTE,ADMIN url=/403 order=7
%%@node M001 code=M001 type=MOD scope=ALL order=1 tags=MVP
%%@node M002 code=M002 type=MOD scope=AUTH order=2 tags=SP1
%%@node M003 code=M003 type=MOD scope=@ADMIN order=3 tags=AUDIT who=ADMIN
%%@edge HOME>H001 kind=navigation
%%@edge H001>L002 kind=navigation
%%@edge L002>C002 kind=navigation
%%@edge L002>L002_dlg_annulation kind=attach ref=FEAT-ANNULER-RESA
%%@edge HOME>L001 kind=navigation
%%@edge L001>C001 kind=navigation
%%@edge L001>L001_dlg_filtres kind=attach ref=FEAT-FILTRER
%%@edge L001>F002 kind=action ref=FEAT-DEVENIR-HOTE
%%@edge C001>F001 kind=navigation
%%@edge C001>C001_dlg_galerie kind=attach ref=FEAT-OUVRIR-GALERIE
%%@edge C001>C001_anc_avis kind=attach
%%@edge C001>C001_anc_eco_impact kind=attach
%%@edge F001>F001_recap kind=navigation
%%@edge HOME>H002 kind=navigation
%%@edge H002>D001 kind=navigation
%%@edge H002>L003 kind=navigation
%%@edge L003>F002 kind=navigation
%%@edge D001>C001 kind=action ref=FEAT-GERER-ANNONCE
%%@edge HOME>D002 kind=navigation
%%@edge D002>C001_admin_edit kind=action ref=FEAT-MODERER-ANNONCE
%%@edge HOME>E404 kind=navigation
%%@edge HOME>E403 kind=navigation
%%@edge L001>M001 kind=invoke
%%@edge F001>M002 kind=invoke
%%@edge D002>M003 kind=invoke
flowchart TD
  HOME(["HOME · Accueil & Sélections Éco-Responsables"])
  H001["H001 · Espace Voyageur"]
  L002["L002 · Mes Réservations"]
  L002_dlg_annulation["!annulation · Confirmation d'Annulation"]
  C002(["C002 · Détail Réservation & Facture"])
  L001["L001 · Catalogue des Écolodges"]
  L001_dlg_filtres["!filtres · Filtres Avancés & Éco-labels"]
  C001(["C001 · Fiche Détail Écolodge"])
  C001_dlg_galerie["!galerie · Galerie & Visite Virtuelle"]
  C001_anc_avis["#avis · Avis Voyageurs & Notes"]
  C001_anc_eco_impact["#eco-impact · Bilan Carbone & Engagements"]
  C001_admin(["C001@ADMIN · Contrôle Modérateur"])
  C001_preview(["C001:PREVIEW · Prévisualisation Brouillon"])
  C001_admin_edit(["C001@ADMIN:EDIT · Audit & Édition Directe"])
  F001{"F001 · Tunnel de Réservation Séjour"}
  F001_recap{"F001:RECAP · Récapitulatif & CGV"}
  H002["H002 · Espace Hôte Partenaire"]
  D001["D001 · Tableau de Bord Hôte"]
  L003["L003 · Gestion de mes Annonces"]
  F002{"F002 · Dépôt d'une Nouvelle Annonce"}
  D002["D002 · Tableau de Bord Administration"]
  E404["E404 · Page Introuvable"]
  E403["E403 · Accès Refusé"]
  M001>"M001 · FAQ & Assistant Éco-Guide"]
  M002>"M002 · Sélecteur Rapide de Dates"]
  M003>"M003 · Tiroir Modération Express"]

  HOME --> H001
  H001 --> L002
  L002 --> C002
  L002 -.-> L002_dlg_annulation
  HOME --> L001
  L001 --> C001
  L001 -.-> L001_dlg_filtres
  L001 -.-> F002
  C001 --> F001
  C001 -.-> C001_dlg_galerie
  C001 -.-> C001_anc_avis
  C001 -.-> C001_anc_eco_impact
  F001 --> F001_recap
  HOME --> H002
  H002 --> D001
  H002 --> L003
  L003 --> F002
  D001 -.-> C001
  HOME --> D002
  D002 -.-> C001_admin_edit
  HOME --> E404
  HOME --> E403
  L001 -.-> M001
  F001 -.-> M002
  D002 -.-> M003
`;

// 3. sitemap-by-role-admin.mmd
files['sitemap-by-role-admin.mmd'] = `%%@file id=sitemap-by-role-admin project=ECO-STAYS kind=sitemap view=role role=ADMIN title="Arborescence Administrateur & Modération" version="1.3"
%%@tag AUDIT color=red style=outline label="Audit & Contrôle"
%%@tag ECO_LABEL color=green style=fill label="Éco-Label"
%%@node HOME code=HOME type=HOME access=public roles=ADMIN url=/ order=1
%%@node L001 code=L001 type=L subtype=datagrid access=public roles=ADMIN url=/stays order=2
%%@node C001_admin code=C001@ADMIN type=C subtype=moderation access=protected roles=ADMIN url=/stays/[id] order=3 tags=AUDIT who=ADMIN
%%@node C001_admin_edit code=C001@ADMIN:EDIT type=C subtype=audit-edition access=protected roles=ADMIN url=/stays/[id]/audit order=4 tags=AUDIT,ECO_LABEL who=ADMIN
%%@node D002 code=D002 type=D subtype=supervision access=protected roles=ADMIN url=/admin/dashboard order=5 tags=AUDIT who=ADMIN
%%@node M003 code=M003 type=MOD scope=@ADMIN order=1 tags=AUDIT who=ADMIN
%%@node E404 code=E404 type=E subtype=erreur-404 access=public roles=ADMIN url=/404 order=6
%%@node E403 code=E403 type=E subtype=erreur-403 access=public roles=ADMIN url=/403 order=7
%%@edge HOME>L001 kind=navigation
%%@edge L001>C001_admin kind=navigation
%%@edge C001_admin>C001_admin_edit kind=navigation
%%@edge HOME>D002 kind=navigation
%%@edge D002>C001_admin_edit kind=action ref=FEAT-MODERER-ANNONCE
%%@edge D002>M003 kind=invoke
%%@edge HOME>E404 kind=navigation
%%@edge HOME>E403 kind=navigation
flowchart TD
  HOME(["HOME · Accueil & Sélections Éco-Responsables"])
  L001["L001 · Catalogue des Écolodges"]
  C001_admin(["C001@ADMIN · Contrôle Modérateur"])
  C001_admin_edit(["C001@ADMIN:EDIT · Audit & Édition Directe"])
  D002["D002 · Tableau de Bord Administration"]
  M003>"M003 · Tiroir Modération Express"]
  E404["E404 · Page Introuvable"]
  E403["E403 · Accès Refusé"]

  HOME --> L001
  L001 --> C001_admin
  C001_admin --> C001_admin_edit
  HOME --> D002
  D002 -.-> C001_admin_edit
  D002 -.-> M003
  HOME --> E404
  HOME --> E403
`;

// 4. sitemap-by-role-host.mmd
files['sitemap-by-role-host.mmd'] = `%%@file id=sitemap-by-role-host project=ECO-STAYS kind=sitemap view=role role=HOTE title="Arborescence Espace Hôte Partenaire" version="1.3"
%%@tag SP2 color=orange style=outline label="Sprint 2"
%%@tag ECO_LABEL color=green style=fill label="Éco-Label"
%%@node HOME code=HOME type=HOME access=public roles=HOTE url=/ order=1
%%@node H002 code=H002 type=H subtype=hub access=protected roles=HOTE url=/host order=2 tags=SP2 who=HOTE
%%@node D001 code=D001 type=D subtype=dashboard access=protected roles=HOTE url=/host/dashboard order=1 tags=SP2 who=HOTE
%%@node L003 code=L003 type=L subtype=datagrid access=protected roles=HOTE url=/host/properties order=2 tags=SP2 who=HOTE
%%@node F002 code=F002 type=F subtype=formulaire access=protected roles=HOTE url=/host/properties/new tone=accent order=1 tags=SP2,ECO_LABEL who=HOTE
%%@node C001_preview code=C001:PREVIEW type=C subtype=brouillon access=protected roles=HOTE url=/stays/[id]/preview order=3 who=HOTE
%%@node M001 code=M001 type=MOD scope=ALL order=1
%%@edge HOME>H002 kind=navigation
%%@edge H002>D001 kind=navigation
%%@edge H002>L003 kind=navigation
%%@edge L003>F002 kind=navigation
%%@edge L003>C001_preview kind=navigation
%%@edge D001>M001 kind=invoke
flowchart TD
  HOME(["HOME · Accueil & Sélections Éco-Responsables"])
  H002["H002 · Espace Hôte Partenaire"]
  D001["D001 · Tableau de Bord Hôte"]
  L003["L003 · Gestion de mes Annonces"]
  F002{"F002 · Dépôt d'une Nouvelle Annonce"}
  C001_preview(["C001:PREVIEW · Prévisualisation Brouillon"])
  M001>"M001 · FAQ & Assistant Éco-Guide"]

  HOME --> H002
  H002 --> D001
  H002 --> L003
  L003 --> F002
  L003 --> C001_preview
  D001 -.-> M001
`;

// 5. UC-RESERVATION-overview.mmd
files['UC-RESERVATION-overview.mmd'] = `%%@file id=UC-RESERVATION-overview project=ECO-STAYS kind=userflow view=uc uc=UC-RESERVATION obj=OBJ-RES-01 title="Cas d'Usage : Réservation d'un Écolodge" version="1.3" roles=VOYAGEUR,HOTE,ADMIN confiance=YELLOW validation=QA+UAT funnel=yes
%%@node ND_HOME code=HOME type=ECR order=1
%%@node ND_L001 code=L001 type=ECR order=2
%%@node ND_C001 code=C001 type=ECR order=3
%%@node ND_F001 code=F001 type=ECR order=4
%%@node ND_EXT_APPROVAL code=EXT-APPROVAL type=EXT break=yes delay=24h persist=external resume=ND_F001_RECAP order=5
%%@node ND_F001_RECAP code=F001:RECAP type=ECR order=6
%%@node CALL_PAY code=PF-PAIEMENT-SEG type=CALL order=7
%%@node ND_L002 code=L002 type=ECR order=8
%%@edge ND_HOME>ND_L001 kind=nominal
%%@edge ND_L001>ND_C001 kind=nominal
%%@edge ND_C001>ND_F001 kind=nominal
%%@edge ND_F001>ND_F001_RECAP kind=nominal
%%@edge ND_F001>ND_EXT_APPROVAL kind=diverge
%%@edge ND_EXT_APPROVAL>ND_F001_RECAP kind=rejoin
%%@edge ND_F001_RECAP>CALL_PAY kind=nominal
%%@edge CALL_PAY>ND_L002 kind=nominal
flowchart LR
  subgraph Role_VOYAGEUR["flows / VOYAGEUR"]
    ND_HOME(["ND-001 · Accueil"])
    ND_L001["ND-002 · Catalogue Écolodges"]
    ND_C001(["ND-003 · Fiche Lodge"])
    ND_F001{"ND-004 · Tunnel Réservation"}
    ND_F001_RECAP{"ND-005 · Récapitulatif & CGV"}
    CALL_PAY[["PF-PAIEMENT-SEG · Module Paiement"]]
    ND_L002["ND-007 · Confirmation & Mes Réservations"]
  end

  subgraph Role_HOTE["flows / HOTE"]
    ND_EXT_APPROVAL[/"ND-008 · Accord Manuel Hôte ⏸ 24h"/]
  end

  ND_HOME --> ND_L001 --> ND_C001 --> ND_F001 --> ND_F001_RECAP --> CALL_PAY --> ND_L002
  ND_F001 -.-> ND_EXT_APPROVAL -.-> ND_F001_RECAP
`;

// 6. PF-RESERVATION-NOM-collapsed.mmd
files['PF-RESERVATION-NOM-collapsed.mmd'] = `%%@file id=PF-RESERVATION-NOM-collapsed project=ECO-STAYS kind=userflow view=collapsed uc=UC-RESERVATION obj=OBJ-RES-01 statut=nominal roles=VOYAGEUR title="Réservation Nominale Écolodge (Vue Repliée)" version="1.3" atterrissage=L002
%%@node ND_HOME code=HOME type=ECR order=1
%%@node ND_ACT1 ref=FEAT-RECHERCHER type=ACT order=2
%%@node ND_L001 code=L001 type=ECR order=3
%%@node ND_ACT2 ref=FEAT-CHOISIR-DATES type=ACT order=4
%%@node ND_C001 code=C001 type=ECR order=5
%%@node ND_ACT3 ref=FEAT-CONFIG-OPTIONS type=ACT order=6
%%@node ND_F001 code=F001 type=ECR order=7
%%@node ND_ATT1 type=ATT break=yes delay=30s persist=volatile resume=ND_F001_RECAP order=8
%%@node ND_F001_RECAP code=F001:RECAP type=ECR order=9
%%@node ND_CALL_PAY code=PF-PAIEMENT-SEG type=CALL order=10
%%@node ND_L002 code=L002 type=ECR order=11
%%@edge ND_HOME>ND_ACT1 kind=nominal
%%@edge ND_ACT1>ND_L001 kind=nominal
%%@edge ND_L001>ND_ACT2 kind=nominal
%%@edge ND_ACT2>ND_C001 kind=nominal
%%@edge ND_C001>ND_ACT3 kind=nominal
%%@edge ND_ACT3>ND_F001 kind=nominal
%%@edge ND_F001>ND_ATT1 kind=nominal
%%@edge ND_ATT1>ND_F001_RECAP kind=nominal
%%@edge ND_F001_RECAP>ND_CALL_PAY kind=nominal
%%@edge ND_CALL_PAY>ND_L002 kind=nominal
flowchart LR
  ND_HOME(["ND-001 · Accueil"])
  ND_ACT1["ND-002 · Recherche par massif"]
  ND_L001["ND-003 · Catalogue des écolodges"]
  ND_ACT2["ND-004 · Choix des dates & voyageurs"]
  ND_C001(["ND-005 · Fiche détaillée lodge"])
  ND_ACT3["ND-006 · Sélection options vertes"]
  ND_F001{"ND-007 · Tunnel de réservation"}
  ND_ATT1{{"ND-008 · Vérification disponibilité instantanée ⏸"}}
  ND_F001_RECAP{"ND-009 · Récapitulatif commande & CGV"}
  ND_CALL_PAY[["PF-PAIEMENT-SEG · Paiement sécurisé"]]
  ND_L002["ND-011 · Mes réservations confirmées"]

  ND_HOME --> ND_ACT1 --> ND_L001 --> ND_ACT2 --> ND_C001 --> ND_ACT3 --> ND_F001 --> ND_ATT1 --> ND_F001_RECAP --> ND_CALL_PAY --> ND_L002
`;

// 7. PF-RESERVATION-VAR-HOST-APPROVAL.mmd
files['PF-RESERVATION-VAR-HOST-APPROVAL.mmd'] = `%%@file id=PF-RESERVATION-VAR-HOST-APPROVAL project=ECO-STAYS kind=userflow view=collapsed uc=UC-RESERVATION obj=OBJ-RES-01 statut=variante roles=VOYAGEUR title="Variante avec Approbation Manuelle Hôte ⏸" version="1.3" diverge=PF-RESERVATION-NOM@7 rejoint=PF-RESERVATION-NOM@9
%%@node ND_F001 code=F001 type=ECR order=1
%%@node ND_ACT_REQUEST ref=FEAT-DEMANDE-ACCORD type=ACT order=2
%%@node ND_EXT_APPROVAL code=EXT-APPROVAL type=EXT obs=none break=yes delay=24h persist=external resume=ND_F001_RECAP order=3
%%@node ND_F001_RECAP code=F001:RECAP type=ECR order=4
%%@node ND_CALL_PAY code=PF-PAIEMENT-SEG type=CALL order=5
%%@edge ND_F001>ND_ACT_REQUEST kind=diverge
%%@edge ND_ACT_REQUEST>ND_EXT_APPROVAL kind=variant
%%@edge ND_EXT_APPROVAL>ND_F001_RECAP kind=rejoin
%%@edge ND_F001_RECAP>ND_CALL_PAY kind=nominal
flowchart LR
  ND_F001{"ND-001 · Tunnel réservation"}
  ND_ACT_REQUEST["ND-002 · Demande de confirmation à l'hôte"]
  ND_EXT_APPROVAL[/"ND-003 · Validation manuelle par l'hôte ⏸ 24h"/]
  ND_F001_RECAP{"ND-004 · Récapitulatif après accord hôte"}
  ND_CALL_PAY[["PF-PAIEMENT-SEG · Finalisation du paiement"]]

  ND_F001 -.-> ND_ACT_REQUEST -.-> ND_EXT_APPROVAL -.-> ND_F001_RECAP
  ND_F001_RECAP --> ND_CALL_PAY
`;

// 8. PF-PAIEMENT-EXPANDED.mmd
files['PF-PAIEMENT-EXPANDED.mmd'] = `%%@file id=PF-PAIEMENT-EXPANDED project=ECO-STAYS kind=userflow view=expanded uc=UC-RESERVATION obj=OBJ-RES-01 roles=VOYAGEUR title="Sous-Parcours Paiement Sécurisé (Déplié)" version="1.3"
%%@node ND_P01 code=F001:PAY type=ECR order=1
%%@node ND_P02 ref=FEAT-SAISIE-CB type=ACT order=2
%%@node ND_P03 code=EXT-3DSECURE type=EXT obs=none break=yes delay=5m persist=volatile resume=ND_P04 order=3
%%@node ND_P04 type=ATT break=yes delay=10s persist=volatile resume=ND_P05 order=4
%%@node ND_P05 code=L002 type=ECR order=5
%%@edge ND_P01>ND_P02 kind=nominal
%%@edge ND_P02>ND_P03 kind=nominal
%%@edge ND_P03>ND_P04 kind=nominal
%%@edge ND_P04>ND_P05 kind=nominal
flowchart LR
  ND_P01{"ND-001 · Saisie coordonnées bancaires"}
  ND_P02["ND-002 · Validation empreinte carte"]
  ND_P03[/"ND-003 · Challenge 3D-Secure banque ⏸"/]
  ND_P04{{"ND-004 · Attente webhook bancaire ⏸"}}
  ND_P05["ND-005 · Confirmation sur mes réservations"]

  ND_P01 --> ND_P02 --> ND_P03 --> ND_P04 --> ND_P05
`;

// 9. PF-PAIEMENT-SEG.mmd
files['PF-PAIEMENT-SEG.mmd'] = `%%@file id=PF-PAIEMENT-SEG project=ECO-STAYS kind=userflow view=collapsed uc=UC-RESERVATION statut=segment roles=VOYAGEUR title="Segment Facteur : Paiement Sécurisé" version="1.3" atterrissage=L002
%%@node ND_S01 code=F001:PAY type=ECR order=1
%%@node ND_S02 ref=FEAT-SAISIE-CB type=ACT order=2
%%@node ND_S03 code=L002 type=ECR order=3
%%@edge ND_S01>ND_S02 kind=nominal
%%@edge ND_S02>ND_S03 kind=nominal
flowchart LR
  ND_S01{"ND-001 · Écran de paiement"}
  ND_S02["ND-002 · Exécution du débit"]
  ND_S03["ND-003 · Atterrissage sur réservations"]

  ND_S01 --> ND_S02 --> ND_S03
`;

// 10. UC-DEPOT-overview.mmd
files['UC-DEPOT-overview.mmd'] = `%%@file id=UC-DEPOT-overview project=ECO-STAYS kind=userflow view=uc uc=UC-DEPOT-ANNONCE obj=OBJ-DEPOT-01 title="Cas d'Usage : Création & Modération d'Annonce" version="1.3" roles=HOTE,ADMIN confiance=YELLOW validation=QA+UAT funnel=yes
%%@node ND_D001 code=D001 type=ECR order=1
%%@node ND_F002 code=F002 type=ECR order=2
%%@node ND_EXT_CONSEIL code=EXT-CONSEIL type=EXT break=yes delay=48h persist=external resume=ND_C001_PREV order=3
%%@node ND_C001_PREV code=C001:PREVIEW type=ECR order=4
%%@node ND_L003 code=L003 type=ECR order=5
%%@node ND_D002 code=D002 type=ECR order=6
%%@node ND_C001_AUDIT code=C001@ADMIN:EDIT type=ECR order=7
%%@edge ND_D001>ND_F002 kind=nominal
%%@edge ND_F002>ND_C001_PREV kind=nominal
%%@edge ND_F002>ND_EXT_CONSEIL kind=diverge
%%@edge ND_EXT_CONSEIL>ND_C001_PREV kind=rejoin
%%@edge ND_C001_PREV>ND_L003 kind=nominal
%%@edge ND_L003>ND_D002 kind=nominal
%%@edge ND_D002>ND_C001_AUDIT kind=nominal
flowchart LR
  subgraph Role_HOTE["flows / HOTE"]
    ND_D001["ND-001 · Tableau de bord hôte"]
    ND_F002{"ND-002 · Formulaire de création"}
    ND_EXT_CONSEIL[/"ND-003 · Audit Conseiller Éco-Label ⏸ 48h"/]
    ND_C001_PREV(["ND-004 · Aperçu avant publication"])
    ND_L003["ND-005 · Annonces publiées"]
  end

  subgraph Role_ADMIN["flows / ADMIN"]
    ND_D002["ND-006 · Supervision modération"]
    ND_C001_AUDIT(["ND-007 · Audit conformité écolodge"])
  end

  ND_D001 --> ND_F002 --> ND_C001_PREV --> ND_L003
  ND_F002 -.-> ND_EXT_CONSEIL -.-> ND_C001_PREV
  ND_L003 --> ND_D002 --> ND_C001_AUDIT
`;

// 11. PF-DEPOT-NOM-collapsed.mmd
files['PF-DEPOT-NOM-collapsed.mmd'] = `%%@file id=PF-DEPOT-NOM-collapsed project=ECO-STAYS kind=userflow view=collapsed uc=UC-DEPOT-ANNONCE obj=OBJ-DEPOT-01 statut=nominal roles=HOTE title="Création Nominale d'Annonce Écolodge (Vue Repliée)" version="1.3" atterrissage=L003
%%@node ND_D001 code=D001 type=ECR order=1
%%@node ND_ACT_NEW ref=FEAT-NOUVELLE-ANNONCE type=ACT order=2
%%@node ND_F002 code=F002 type=ECR order=3
%%@node ND_ACT_UPLOAD ref=FEAT-UPLOAD-PHOTOS type=ACT order=4
%%@node ND_ATT_CADASTRE type=ATT break=yes delay=1m persist=volatile resume=ND_C001_PREV order=5
%%@node ND_C001_PREV code=C001:PREVIEW type=ECR order=6
%%@node ND_ACT_PUBLISH ref=FEAT-PUBLIER-ANNONCE type=ACT order=7
%%@node ND_L003 code=L003 type=ECR order=8
%%@edge ND_D001>ND_ACT_NEW kind=nominal
%%@edge ND_ACT_NEW>ND_F002 kind=nominal
%%@edge ND_F002>ND_ACT_UPLOAD kind=nominal
%%@edge ND_ACT_UPLOAD>ND_ATT_CADASTRE kind=nominal
%%@edge ND_ATT_CADASTRE>ND_C001_PREV kind=nominal
%%@edge ND_C001_PREV>ND_ACT_PUBLISH kind=nominal
%%@edge ND_ACT_PUBLISH>ND_L003 kind=nominal
flowchart LR
  ND_D001["ND-001 · Tableau de bord hôte"]
  ND_ACT_NEW["ND-002 · Clic déposer une annonce"]
  ND_F002{"ND-003 · Formulaire caractéristiques & éco-gestes"}
  ND_ACT_UPLOAD["ND-004 · Téléversement photos & justificatifs"]
  ND_ATT_CADASTRE{{"ND-005 · Vérification automatique cadastre & zone protégée ⏸"}}
  ND_C001_PREV(["ND-006 · Prévisualisation de la fiche écolodge"])
  ND_ACT_PUBLISH["ND-007 · Confirmation de mise en ligne"]
  ND_L003["ND-008 · Liste de mes annonces en ligne"]

  ND_D001 --> ND_ACT_NEW --> ND_F002 --> ND_ACT_UPLOAD --> ND_ATT_CADASTRE --> ND_C001_PREV --> ND_ACT_PUBLISH --> ND_L003
`;

// 12. PF-DEPOT-VAR-ASSIST.mmd
files['PF-DEPOT-VAR-ASSIST.mmd'] = `%%@file id=PF-DEPOT-VAR-ASSIST project=ECO-STAYS kind=userflow view=collapsed uc=UC-DEPOT-ANNONCE obj=OBJ-DEPOT-01 statut=variante roles=HOTE title="Variante avec Accompagnement Éco-Label ⏸" version="1.3" diverge=PF-DEPOT-NOM@3 rejoint=PF-DEPOT-NOM@6
%%@node ND_F002 code=F002 type=ECR order=1
%%@node ND_ACT_AIDE ref=FEAT-DEMANDE-LABEL type=ACT order=2
%%@node ND_EXT_CONSEIL code=EXT-CONSEIL type=EXT obs=none break=yes delay=48h persist=external resume=ND_C001_PREV order=3
%%@node ND_C001_PREV code=C001:PREVIEW type=ECR order=4
%%@node ND_ACT_PUBLISH ref=FEAT-PUBLIER-ANNONCE type=ACT order=5
%%@node ND_L003 code=L003 type=ECR order=6
%%@edge ND_F002>ND_ACT_AIDE kind=diverge
%%@edge ND_ACT_AIDE>ND_EXT_CONSEIL kind=variant
%%@edge ND_EXT_CONSEIL>ND_C001_PREV kind=rejoin
%%@edge ND_C001_PREV>ND_ACT_PUBLISH kind=nominal
%%@edge ND_ACT_PUBLISH>ND_L003 kind=nominal
flowchart LR
  ND_F002{"ND-001 · Formulaire d'annonce"}
  ND_ACT_AIDE["ND-002 · Demande de labellisation éco-habitat"]
  ND_EXT_CONSEIL[/"ND-003 · Audit & échange visio avec conseiller éco ⏸ 48h"/]
  ND_C001_PREV(["ND-004 · Prévisualisation avec badge Éco-Label validé"])
  ND_ACT_PUBLISH["ND-005 · Confirmation et publication"]
  ND_L003["ND-006 · Liste de mes annonces certifiées"]

  ND_F002 -.-> ND_ACT_AIDE -.-> ND_EXT_CONSEIL -.-> ND_C001_PREV
  ND_C001_PREV --> ND_ACT_PUBLISH --> ND_L003
`;

// 13. metadata.json
files['metadata.json'] = JSON.stringify({
  "_meta": {
    "format": "ia-metadata",
    "version": "1.3.0",
    "template_version": "1.3.0",
    "project": "ECO-STAYS"
  },
  "_diagrams": [
    "sitemap-overview.mmd",
    "sitemap-detailed.mmd",
    "sitemap-by-role-admin.mmd",
    "sitemap-by-role-host.mmd",
    "UC-RESERVATION-overview.mmd",
    "PF-RESERVATION-NOM-collapsed.mmd",
    "PF-RESERVATION-VAR-HOST-APPROVAL.mmd",
    "PF-PAIEMENT-EXPANDED.mmd",
    "PF-PAIEMENT-SEG.mmd",
    "UC-DEPOT-overview.mmd",
    "PF-DEPOT-NOM-collapsed.mmd",
    "PF-DEPOT-VAR-ASSIST.mmd"
  ],
  "HOME": {
    "code": "HOME",
    "title": "Accueil & Sélections Éco-Responsables",
    "url": "/",
    "template": "HOME",
    "access": "public",
    "roles": ["ANONYMOUS", "VOYAGEUR", "HOTE", "ADMIN"],
    "ctx_in": {},
    "ctx_out": { "utm_source": "STRING", "session_id": "UUID" },
    "tracking": {
      "pageview": "/home",
      "events": ["click_search", "click_featured_lodge", "filter_ecolabel_hero"]
    },
    "notes": "Vitrine d'entrée principale. Observabilité totale via pixel et GTM."
  },
  "H001": {
    "code": "H001",
    "title": "Espace Voyageur (Hub)",
    "url": "/account",
    "template": "H",
    "subtype": "hub",
    "access": "protected",
    "roles": ["VOYAGEUR", "ADMIN"],
    "ctx_in": { "auth_token": "JWT" },
    "ctx_out": { "user_id": "UUID" },
    "tracking": { "pageview": "/account" },
    "notes": "Nœud intermédiaire routant vers la première sous-page (Mes Réservations)."
  },
  "L002": {
    "code": "L002",
    "title": "Mes Réservations",
    "url": "/account/bookings",
    "template": "L",
    "subtype": "liste",
    "access": "protected",
    "roles": ["VOYAGEUR", "ADMIN"],
    "ctx_in": { "user_id": "UUID" },
    "ctx_out": { "selected_booking_id": "STRING" },
    "tracking": {
      "pageview": "/account/bookings",
      "events": ["view_booking_details", "open_cancel_dialog"]
    },
    "notes": "Historique des séjours passés et réservations confirmées."
  },
  "L002!annulation": {
    "code": "L002!annulation",
    "title": "Confirmation d'Annulation (Dialogue)",
    "template": "DLG",
    "subtype": "dialogue",
    "access": "protected",
    "roles": ["VOYAGEUR", "ADMIN"],
    "ctx_in": { "booking_id": "STRING" },
    "ctx_out": { "cancel_reason": "STRING", "refund_amount": "NUMBER" },
    "tracking": {
      "events": ["cancel_dialog_open", "cancel_confirmed"]
    }
  },
  "C002": {
    "code": "C002",
    "title": "Détail Réservation & Facture",
    "url": "/account/bookings/[id]",
    "template": "C",
    "subtype": "facture",
    "access": "protected",
    "roles": ["VOYAGEUR", "ADMIN"],
    "ctx_in": { "booking_id": "STRING" },
    "ctx_out": { "invoice_pdf_url": "STRING" },
    "tracking": {
      "pageview": "/account/bookings/:id",
      "events": ["download_invoice", "submit_stay_review"]
    }
  },
  "L001": {
    "code": "L001",
    "title": "Catalogue des Écolodges",
    "url": "/stays",
    "template": "L",
    "subtype": "datagrid",
    "access": "public",
    "roles": ["ANONYMOUS", "VOYAGEUR", "ADMIN"],
    "ctx_in": { "region": "STRING", "guests_min": "INTEGER", "ecolabel": "BOOLEAN" },
    "ctx_out": { "selected_lodge_id": "STRING", "active_filters_count": "INTEGER" },
    "tracking": {
      "pageview": "/stays",
      "events": ["filter_ecolabel_applied", "sort_price_changed", "lodge_card_click"]
    },
    "notes": "Grille de recherche avec facettes éco-responsables et carte interactive."
  },
  "L001!filtres": {
    "code": "L001!filtres",
    "title": "Filtres Avancés & Éco-labels (Popin)",
    "template": "DLG",
    "subtype": "popin",
    "access": "public",
    "roles": ["ANONYMOUS", "VOYAGEUR", "ADMIN"],
    "ctx_in": { "current_filters": "OBJECT" },
    "ctx_out": { "updated_filters": "OBJECT" },
    "tracking": {
      "events": ["filter_modal_opened", "label_clef_verte_toggled", "filter_submitted"]
    }
  },
  "C001": {
    "code": "C001",
    "title": "Fiche Détail Écolodge",
    "url": "/stays/[id]",
    "template": "C",
    "subtype": "fiche",
    "access": "public",
    "roles": ["ANONYMOUS", "VOYAGEUR", "ADMIN"],
    "dynamic": true,
    "ctx_in": { "lodge_id": "STRING" },
    "ctx_out": { "stay_nights": "INTEGER", "estimated_price": "NUMBER" },
    "tracking": {
      "pageview": "/stays/:id",
      "events": ["open_gallery", "scroll_eco_impact", "cta_start_booking"]
    },
    "notes": "Page clé du funnel de conversion hébergeant galerie, avis et bilan carbone."
  },
  "C001!galerie": {
    "code": "C001!galerie",
    "title": "Galerie & Visite Virtuelle (Modale)",
    "template": "DLG",
    "subtype": "visionneuse",
    "access": "public",
    "roles": ["ANONYMOUS", "VOYAGEUR", "ADMIN"],
    "ctx_in": { "lodge_id": "STRING", "initial_photo_index": "INTEGER" },
    "ctx_out": {},
    "tracking": {
      "events": ["gallery_opened", "vr_tour_started", "photo_next"]
    }
  },
  "C001#avis": {
    "code": "C001#avis",
    "title": "Avis Voyageurs & Notes (Ancre)",
    "url": "/stays/[id]#avis",
    "template": "ANC",
    "subtype": "ancre",
    "access": "public",
    "roles": ["ANONYMOUS", "VOYAGEUR", "ADMIN"],
    "tracking": {
      "events": ["scroll_to_reviews", "filter_reviews_by_rating"]
    }
  },
  "C001#eco-impact": {
    "code": "C001#eco-impact",
    "title": "Bilan Carbone & Éco-Engagements (Ancre)",
    "url": "/stays/[id]#eco-impact",
    "template": "ANC",
    "subtype": "ancre",
    "access": "public",
    "roles": ["ANONYMOUS", "VOYAGEUR", "ADMIN"],
    "tracking": {
      "events": ["scroll_eco_impact", "view_carbon_calculator"]
    }
  },
  "C001@ADMIN": {
    "code": "C001@ADMIN",
    "title": "Fiche Écolodge (Contrôle Modérateur)",
    "url": "/stays/[id]",
    "template": "C",
    "subtype": "moderation",
    "access": "protected",
    "roles": ["ADMIN"],
    "ctx_in": { "lodge_id": "STRING", "admin_jwt": "JWT" },
    "ctx_out": { "audit_flags": "ARRAY" },
    "tracking": {
      "pageview": "/stays/:id?view=admin",
      "events": ["admin_flag_photo", "open_direct_edit"]
    }
  },
  "C001:PREVIEW": {
    "code": "C001:PREVIEW",
    "title": "Prévisualisation Brouillon Lodge",
    "url": "/stays/[id]/preview",
    "template": "C",
    "subtype": "brouillon",
    "access": "protected",
    "roles": ["HOTE", "ADMIN"],
    "ctx_in": { "draft_id": "UUID" },
    "ctx_out": { "publish_ready": "BOOLEAN" },
    "tracking": {
      "pageview": "/stays/:id/preview",
      "events": ["preview_mode_toggle", "confirm_publish_click"]
    }
  },
  "C001@ADMIN:EDIT": {
    "code": "C001@ADMIN:EDIT",
    "title": "Audit & Édition Directe Modérateur",
    "url": "/stays/[id]/audit",
    "template": "C",
    "subtype": "audit-edition",
    "access": "protected",
    "roles": ["ADMIN"],
    "ctx_in": { "lodge_id": "STRING" },
    "ctx_out": { "certification_status": "STRING" },
    "tracking": {
      "pageview": "/stays/:id/audit",
      "events": ["override_label_status", "save_audit_report"]
    }
  },
  "F001": {
    "code": "F001",
    "title": "Tunnel de Réservation Séjour",
    "url": "/stays/[id]/book",
    "template": "F",
    "subtype": "stepper",
    "access": "protected",
    "roles": ["VOYAGEUR", "ADMIN"],
    "ctx_in": { "lodge_id": "STRING", "dates": "DATE_RANGE", "guests": "INTEGER" },
    "ctx_out": { "reservation_draft_id": "UUID", "total_price": "NUMBER" },
    "tracking": {
      "pageview": "/stays/:id/book",
      "funnel_step": "step_1_options",
      "events": ["option_local_basket_added", "submit_booking_step"]
    },
    "notes": "Tunnel sécurisé avec calcul d'options bas-carbone."
  },
  "F001:RECAP": {
    "code": "F001:RECAP",
    "title": "Récapitulatif & Validation CGV",
    "url": "/stays/[id]/book/recap",
    "template": "F",
    "subtype": "recap",
    "access": "protected",
    "roles": ["VOYAGEUR", "ADMIN"],
    "ctx_in": { "reservation_draft_id": "UUID" },
    "ctx_out": { "payment_intent_token": "STRING" },
    "tracking": {
      "pageview": "/stays/:id/book/recap",
      "funnel_step": "step_2_recap",
      "events": ["cgv_accepted", "cta_proceed_to_payment"]
    }
  },
  "F001:PAY": {
    "code": "F001:PAY",
    "title": "Paiement Sécurisé",
    "url": "/stays/[id]/book/pay",
    "template": "F",
    "subtype": "paiement",
    "access": "protected",
    "roles": ["VOYAGEUR", "ADMIN"],
    "ctx_in": { "payment_intent_token": "STRING" },
    "ctx_out": { "transaction_id": "STRING", "order_status": "CONFIRMED" },
    "tracking": {
      "pageview": "/stays/:id/book/pay",
      "funnel_step": "step_3_payment",
      "events": ["card_details_entered", "3ds_challenge_initiated"]
    }
  },
  "H002": {
    "code": "H002",
    "title": "Espace Hôte Partenaire (Hub)",
    "url": "/host",
    "template": "H",
    "subtype": "hub",
    "access": "protected",
    "roles": ["HOTE", "ADMIN"],
    "ctx_in": { "host_id": "UUID" },
    "ctx_out": {},
    "tracking": { "pageview": "/host" }
  },
  "D001": {
    "code": "D001",
    "title": "Tableau de Bord Hôte",
    "url": "/host/dashboard",
    "template": "D",
    "subtype": "dashboard",
    "access": "protected",
    "roles": ["HOTE", "ADMIN"],
    "ctx_in": { "host_id": "UUID" },
    "ctx_out": { "pending_requests_count": "INTEGER" },
    "tracking": {
      "pageview": "/host/dashboard",
      "events": ["calendar_synced", "booking_request_approved"]
    }
  },
  "L003": {
    "code": "L003",
    "title": "Gestion de mes Annonces",
    "url": "/host/properties",
    "template": "L",
    "subtype": "datagrid",
    "access": "protected",
    "roles": ["HOTE", "ADMIN"],
    "ctx_in": { "host_id": "UUID" },
    "ctx_out": { "selected_property_id": "STRING" },
    "tracking": {
      "pageview": "/host/properties",
      "events": ["click_create_listing", "toggle_listing_availability"]
    }
  },
  "F002": {
    "code": "F002",
    "title": "Dépôt d'une Nouvelle Annonce",
    "url": "/host/properties/new",
    "template": "F",
    "subtype": "formulaire",
    "access": "protected",
    "roles": ["HOTE", "ADMIN"],
    "ctx_in": { "host_id": "UUID" },
    "ctx_out": { "draft_id": "UUID" },
    "tracking": {
      "pageview": "/host/properties/new",
      "events": ["photo_batch_uploaded", "label_assistance_requested"]
    }
  },
  "D002": {
    "code": "D002",
    "title": "Tableau de Bord Administration",
    "url": "/admin/dashboard",
    "template": "D",
    "subtype": "supervision",
    "access": "protected",
    "roles": ["ADMIN"],
    "ctx_in": { "admin_id": "UUID" },
    "ctx_out": { "audit_queue_length": "INTEGER" },
    "tracking": {
      "pageview": "/admin/dashboard",
      "events": ["filter_audit_queue", "approve_eco_certification"]
    }
  },
  "E404": {
    "code": "E404",
    "title": "Page Introuvable",
    "url": "/404",
    "template": "E",
    "subtype": "erreur-404",
    "access": "public",
    "roles": ["ANONYMOUS", "VOYAGEUR", "HOTE", "ADMIN"],
    "tracking": {
      "pageview": "/404",
      "events": ["error_404_view", "return_to_home"]
    }
  },
  "E403": {
    "code": "E403",
    "title": "Accès Refusé",
    "url": "/403",
    "template": "E",
    "subtype": "erreur-403",
    "access": "public",
    "roles": ["ANONYMOUS", "VOYAGEUR", "HOTE", "ADMIN"],
    "tracking": {
      "pageview": "/403",
      "events": ["error_403_view", "login_cta_click"]
    }
  },
  "M001": {
    "code": "M001",
    "title": "FAQ & Assistant Éco-Guide",
    "template": "MOD",
    "subtype": "module",
    "access": "public",
    "roles": ["ANONYMOUS", "VOYAGEUR", "HOTE", "ADMIN"],
    "scope": "ALL",
    "invocation": "aide",
    "tracking": {
      "events": ["help_module_opened", "faq_search_performed", "contact_support"]
    }
  },
  "M002": {
    "code": "M002",
    "title": "Sélecteur Rapide de Dates",
    "template": "MOD",
    "subtype": "module",
    "access": "protected",
    "roles": ["VOYAGEUR", "HOTE", "ADMIN"],
    "scope": "AUTH",
    "invocation": "dates",
    "tracking": {
      "events": ["dates_drawer_opened", "slot_selected"]
    }
  },
  "M003": {
    "code": "M003",
    "title": "Tiroir Modération Express",
    "template": "MOD",
    "subtype": "module",
    "access": "protected",
    "roles": ["ADMIN"],
    "scope": "@ADMIN",
    "invocation": "mod-drawer",
    "tracking": {
      "events": ["mod_drawer_opened", "quick_approval_executed"]
    }
  }
}, null, 2);

const extraSheets = {
  'screen-HOME.md': `# Fiche Écran Déduite : HOME

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : \`HOME\`
- **Type de Composant** : Page Racine (Homepage)
- **URL Canonique** : \`/\`
- **Rôles Autorisés** : \`ANONYMOUS\`, \`VOYAGEUR\`, \`HOTE\`, \`ADMIN\`
- **Importance Calculée** : Critique (Entrée principale de la plateforme)

---

## 1. Contexte d'Usage & États Observables
- \`origin=DIRECT\`
- \`session=INITIALIZED\`

---

## 2. Contenus & Capacités Actionnables
- \`FEAT-RECHERCHER\` (Recherche par massif montagneux et dates)
- \`FEAT-EXPLORER-THEMES\` (Navigation par éco-labels : Refuge LPO, Clef Verte)
- Module transverse \`M001\` (\`!aide\`)

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Accès direct via URL racine \`/\`
- Clic sur le logo depuis n'importe quelle page de la plateforme

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers \`L001\` (Catalogue des Écolodges) via recherche ou sélection
- Vers \`H001\` (Espace Voyageur) après authentification
- Vers \`H002\` (Espace Hôte Partenaire) pour devenir hôte
- Vers \`D002\` (Supervision Admin) pour les modérateurs

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : \`/home\`
- **Événements** : \`click_search\`, \`click_featured_lodge\`, \`filter_ecolabel_hero\`
`,
  'screen-H001.md': `# Fiche Écran Déduite : H001

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : \`H001\`
- **Type de Composant** : Page Hub Intermédiaire
- **URL Canonique** : \`/account\`
- **Rôles Autorisés** : \`VOYAGEUR\`, \`ADMIN\`
- **Importance Calculée** : Standard

---

## 1. Contexte d'Usage & États Observables
- \`auth=AUTHENTICATED\`
- \`role=VOYAGEUR\`

---

## 2. Contenus & Capacités Actionnables
- Nœud de routage automatique vers la première page fille : \`L002\` (Mes Réservations)
- Navigation latérale de gestion de profil et préférences

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Depuis le menu d'en-tête de \`HOME\` ou \`L001\`
- Depuis un lien d'accès direct au profil

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers \`L002\` (Mes Réservations)

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : \`/account\`
`,
  'screen-H002.md': `# Fiche Écran Déduite : H002

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : \`H002\`
- **Type de Composant** : Page Hub Intermédiaire
- **URL Canonique** : \`/host\`
- **Rôles Autorisés** : \`HOTE\`, \`ADMIN\`
- **Importance Calculée** : Standard

---

## 1. Contexte d'Usage & États Observables
- \`auth=AUTHENTICATED\`
- \`role=HOTE\`

---

## 2. Contenus & Capacités Actionnables
- Nœud de routage vers \`D001\` (Tableau de Bord Hôte)
- Accès direct au catalogue de gestion \`L003\`

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Depuis l'action \`FEAT-DEVENIR-HOTE\` sur \`L001\` ou \`HOME\`

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers \`D001\` (Tableau de Bord Hôte)
- Vers \`L003\` (Gestion de mes Annonces)

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : \`/host\`
`,
  'screen-L001.md': `# Fiche Écran Déduite : L001

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : \`L001\`
- **Type de Composant** : Page Liste (Catalogue Datagrid)
- **URL Canonique** : \`/stays\`
- **Rôles Autorisés** : \`ANONYMOUS\`, \`VOYAGEUR\`, \`ADMIN\`
- **Importance Calculée** : Critique (Point de passage obligatoire vers la réservation)

---

## 1. Contexte d'Usage & États Observables
- \`search=ACTIVE\`
- \`region=ALPES\`
- \`ecolabel=FILTERED\`

---

## 2. Contenus & Capacités Actionnables
- \`FEAT-FILTRER\` (Déclenchement popin \`!filtres\`)
- \`FEAT-CHOISIR-DATES\` (Sélection des créneaux de disponibilité)
- \`FEAT-DEVENIR-HOTE\` (Renvoi fonctionnel vers \`F002\`)
- Module transverse \`M001\` (\`!aide\`)

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Depuis \`HOME\` via le moteur de recherche
- Accès direct via \`/stays\`

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers \`C001\` (Fiche Détail Écolodge) lors du clic sur une carte
- Vers \`L001!filtres\` pour affiner les critères environnementaux
- Vers \`F002\` pour proposer son propre logement éco-responsable

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : \`/stays\`
- **Événements** : \`filter_ecolabel_applied\`, \`sort_price_changed\`, \`lodge_card_click\`
`,
  'screen-L001_dlg_filtres.md': `# Fiche Écran Déduite : L001!filtres

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : \`L001!filtres\`
- **Type de Composant** : Modale Rattachée (\`!\`)
- **Écran Hôte** : \`L001\`
- **Rôles Autorisés** : \`ANONYMOUS\`, \`VOYAGEUR\`, \`ADMIN\`
- **Importance Calculée** : Standard

---

## 1. Contexte d'Usage & États Observables
- \`modal=OPEN\`
- \`target=L001\`

---

## 2. Contenus & Capacités Actionnables
- Sélection des labels écologiques (Clef Verte, Panda LPO, Écolabel Européen)
- Critères énergétiques : Panneaux solaires, toilettes sèches, phyto-épuration
- \`FEAT-APPLIQUER-FILTRES\` (Validation et actualisation de la grille)

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Clic sur le bouton « Filtres Avancés » sur \`L001\`

---

## 4. Sorties (Où va l'utilisateur ?)
- Retour sur \`L001\` avec grille rechargée

---

## 5. Signaux d'Observabilité & Tracking
- **Événements** : \`filter_modal_opened\`, \`label_clef_verte_toggled\`, \`filter_submitted\`
`,
  'screen-L002.md': `# Fiche Écran Déduite : L002

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : \`L002\`
- **Type de Composant** : Page Liste (Mes Réservations)
- **URL Canonique** : \`/account/bookings\`
- **Rôles Autorisés** : \`VOYAGEUR\`, \`ADMIN\`
- **Importance Calculée** : Critique (Atterrissage des réservations confirmées)

---

## 1. Contexte d'Usage & États Observables
- \`booking=CONFIRMED\`
- \`payment=AUTHORIZED\`

---

## 2. Contenus & Capacités Actionnables
- \`FEAT-CONSULTER-RESA\` (Accès au récapitulatif complet sur \`C002\`)
- \`FEAT-ANNULER-RESA\` (Déclenchement popin d'annulation \`L002!annulation\`)
- Téléchargement du carnet de séjour et des instructions d'éco-gestes

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Sortie du module de paiement \`PF-PAIEMENT-SEG\` (atterrissage garanti)
- Depuis le hub \`H001\`

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers \`C002\` (Détail Réservation & Facture)
- Vers \`L002!annulation\`

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : \`/account/bookings\`
- **Événements** : \`view_booking_details\`, \`open_cancel_dialog\`
`,
  'screen-L002_dlg_annulation.md': `# Fiche Écran Déduite : L002!annulation

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : \`L002!annulation\`
- **Type de Composant** : Modale Rattachée (\`!\`)
- **Écran Hôte** : \`L002\`
- **Rôles Autorisés** : \`VOYAGEUR\`, \`ADMIN\`
- **Importance Calculée** : Standard

---

## 1. Contexte d'Usage & États Observables
- \`cancel_flow=ACTIVE\`
- \`target_booking=PRESENT\`

---

## 2. Contenus & Capacités Actionnables
- Choix du motif d'annulation (changement d'itinéraire, force majeure)
- Calcul de l'éventuel remboursement selon la politique éco-hôte
- \`FEAT-CONFIRMER-ANNULATION\` (Exécution de l'annulation)

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Bouton « Annuler ce séjour » sur \`L002\`

---

## 4. Sorties (Où va l'utilisateur ?)
- Retour sur \`L002\` avec statut mis à jour

---

## 5. Signaux d'Observabilité & Tracking
- **Événements** : \`cancel_dialog_open\`, \`cancel_confirmed\`
`,
  'screen-L003.md': `# Fiche Écran Déduite : L003

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : \`L003\`
- **Type de Composant** : Page Liste (Gestion des Annonces Hôte)
- **URL Canonique** : \`/host/properties\`
- **Rôles Autorisés** : \`HOTE\`, \`ADMIN\`
- **Importance Calculée** : Critique (Atterrissage après création d'annonce)

---

## 1. Contexte d'Usage & États Observables
- \`auth=AUTHENTICATED\`
- \`role=HOTE\`
- \`status=LISTING_ACTIVE\`

---

## 2. Contenus & Capacités Actionnables
- Tableau de bord des lodges actifs, en cours de modération ou brouillons
- \`FEAT-EDITER-LOGEMENT\` (Modification des créneaux et tarifs)
- \`FEAT-DESACTIVER-LOGEMENT\` (Mise en pause saisonnière)
- Bouton de création renvoyant vers \`F002\`

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Depuis le hub \`H002\`
- Atterrissage final du parcours \`PF-DEPOT-NOM\` et \`PF-DEPOT-VAR-ASSIST\`

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers \`F002\` (Dépôt d'une Nouvelle Annonce)
- Vers \`C001:PREVIEW\` pour vérifier le rendu visiteur

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : \`/host/properties\`
- **Événements** : \`click_create_listing\`, \`toggle_listing_availability\`
`,
  'screen-C001.md': `# Fiche Écran Déduite : C001

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : \`C001\`
- **Type de Composant** : Page Contenu (Fiche Détail Écolodge)
- **URL Canonique** : \`/stays/[id]\`
- **Rôles Autorisés** : \`ANONYMOUS\`, \`VOYAGEUR\`, \`ADMIN\`
- **Importance Calculée** : Critique (Point d'ancrage central de l'expérience)

---

## 1. Contexte d'Usage & États Observables
- \`lodge=SELECTED\`
- \`availability=CHECKED\`

---

## 2. Contenus & Capacités Actionnables
- Visuels principaux du lodge et description détaillée
- \`FEAT-INITIER-RESERVATION\` (Transition vers tunnel \`F001\`)
- \`FEAT-OUVRIR-GALERIE\` (Ouverture popin \`C001!galerie\`)
- Ancre \`C001#avis\` (Section avis vérifiés)
- Ancre \`C001#eco-impact\` (Bilan carbone & labels)

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Depuis \`L001\` (Catalogue des Écolodges)
- Depuis \`D001\` (Tableau de Bord Hôte via renvoi fonctionnel)

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers \`F001\` (Tunnel de Réservation Séjour)
- Vers \`C001!galerie\`
- Vers les ancres internes \`#avis\` et \`#eco-impact\`

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : \`/stays/:id\`
- **Événements** : \`open_gallery\`, \`scroll_eco_impact\`, \`cta_start_booking\`
`,
  'screen-C001_dlg_galerie.md': `# Fiche Écran Déduite : C001!galerie

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : \`C001!galerie\`
- **Type de Composant** : Modale Rattachée (\`!\`)
- **Écran Hôte** : \`C001\`
- **Rôles Autorisés** : \`ANONYMOUS\`, \`VOYAGEUR\`, \`ADMIN\`
- **Importance Calculée** : Standard

---

## 1. Contexte d'Usage & États Observables
- \`gallery=FULLSCREEN\`
- \`active_lodge=CONFIRMED\`

---

## 2. Contenus & Capacités Actionnables
- Diaporama haute définition des intérieurs et abords naturels
- Visite virtuelle 360° et vidéos d'immersion
- Navigation clavier et gestuelle tactile

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Clic sur une photo ou le lien « Voir toutes les photos » sur \`C001\`

---

## 4. Sorties (Où va l'utilisateur ?)
- Fermeture et retour à \`C001\`

---

## 5. Signaux d'Observabilité & Tracking
- **Événements** : \`gallery_opened\`, \`vr_tour_started\`, \`photo_next\`
`,
  'screen-C001_anc_avis.md': `# Fiche Écran Déduite : C001#avis

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : \`C001#avis\`
- **Type de Composant** : Ancre Interne (\`#\`)
- **Écran Hôte** : \`C001\`
- **URL Canonique** : \`/stays/[id]#avis\`
- **Rôles Autorisés** : \`ANONYMOUS\`, \`VOYAGEUR\`, \`ADMIN\`
- **Importance Calculée** : Standard

---

## 1. Contexte d'Usage & États Observables
- \`section=REVIEWS\`
- \`lodge=SELECTED\`

---

## 2. Contenus & Capacités Actionnables
- Liste des avis certifiés de voyageurs ayant séjourné dans le lodge
- Détail des notes par critères (propreté, respect nature, accueil hôte)
- Filtrage des avis par saison ou note

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Défilement ou clic sur le badge de note en haut de \`C001\`

---

## 4. Sorties (Où va l'utilisateur ?)
- Navigation dans la fiche \`C001\`

---

## 5. Signaux d'Observabilité & Tracking
- **Événements** : \`scroll_to_reviews\`, \`filter_reviews_by_rating\`
`,
  'screen-C001_anc_eco_impact.md': `# Fiche Écran Déduite : C001#eco-impact

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : \`C001#eco-impact\`
- **Type de Composant** : Ancre Interne (\`#\`)
- **Écran Hôte** : \`C001\`
- **URL Canonique** : \`/stays/[id]#eco-impact\`
- **Rôles Autorisés** : \`ANONYMOUS\`, \`VOYAGEUR\`, \`ADMIN\`
- **Importance Calculée** : Standard

---

## 1. Contexte d'Usage & États Observables
- \`section=CARBON_IMPACT\`
- \`ecolabel=CERTIFIED\`

---

## 2. Contenus & Capacités Actionnables
- Calculateur d'empreinte carbone comparée (vs séjour hôtel traditionnel)
- Justificatifs des labels environnementaux (Clef Verte, Refuge LPO, etc.)
- Charte de préservation de la biodiversité locale

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Clic sur la puce Éco-Score en tête de \`C001\`

---

## 4. Sorties (Où va l'utilisateur ?)
- Retour au bouton de réservation sur \`C001\`

---

## 5. Signaux d'Observabilité & Tracking
- **Événements** : \`scroll_eco_impact\`, \`view_carbon_calculator\`
`
};

// Écriture dans public, dist et examples
const targetDirs = [publicDir, distDir, examplesDir];

for (const target of targetDirs) {
  if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
  const sheetDir = path.join(target, 'screen-sheets');
  if (!fs.existsSync(sheetDir)) fs.mkdirSync(sheetDir, { recursive: true });

  for (const [filename, content] of Object.entries(files)) {
    const destPath = path.join(target, filename);
    fs.writeFileSync(destPath, content, 'utf-8');
  }

  for (const [filename, content] of Object.entries(extraSheets)) {
    const destPath = path.join(sheetDir, filename);
    fs.writeFileSync(destPath, content, 'utf-8');
  }
}

// Copie des fiches écrans existantes de public vers dist et examples
const srcSheets = path.join(publicDir, 'screen-sheets');
if (fs.existsSync(srcSheets)) {
  for (const f of fs.readdirSync(srcSheets)) {
    const content = fs.readFileSync(path.join(srcSheets, f), 'utf-8');
    fs.writeFileSync(path.join(distDir, 'screen-sheets', f), content, 'utf-8');
    fs.writeFileSync(path.join(examplesDir, 'screen-sheets', f), content, 'utf-8');
  }
}

console.log('✅ Tous les fichiers MMD, metadata.json et screen-sheets ont été générés avec succès !');
