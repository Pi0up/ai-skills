/**
 * Jeu de Données de Démonstration Cohérent — Cas d'Usage "SpaceHub" (Spec v1.2 Point 10)
 * Lie parfaitement l'arborescence et les parcours utilisateur (codes exacts, métadonnées, fiches).
 */

export const DEMO_DIAGRAMS = [
  {
    filename: 'sitemap-overview.mmd',
    text: `%%@file id=sitemap-overview project=SPACEHUB kind=sitemap view=general title="Arborescence Générale"
%%@node HOME code=HOME type=HOME access=public roles=ANONYMOUS,CLIENT,HOST,ADMIN url=/ order=1
%%@node L001 code=L001 type=L subtype=datagrid access=public roles=ANONYMOUS,CLIENT,HOST,ADMIN url=/spaces order=2
%%@node C001 code=C001 type=C subtype=fiche access=public roles=ANONYMOUS,CLIENT,HOST,ADMIN url=/spaces/[id] order=3
%%@node F001 code=F001 type=F subtype=stepper access=protected roles=CLIENT,ADMIN url=/booking/[id] order=4
%%@node D001 code=D001 type=D subtype=dashboard access=protected roles=CLIENT,HOST,ADMIN url=/dashboard order=5
%%@node E404 code=E404 type=E subtype=erreur-404 access=public roles=ANONYMOUS,CLIENT,HOST,ADMIN url=/404 order=6
%%@edge HOME>L001 kind=navigation
%%@edge HOME>D001 kind=navigation
%%@edge HOME>E404 kind=navigation
%%@edge L001>C001 kind=navigation
%%@edge C001>F001 kind=navigation
flowchart TD
  HOME(["Accueil SpaceHub"])
  L001["Catalogue des Espaces"]
  C001(["Fiche Détail Espace"])
  F001{"Tunnel de Réservation"}
  D001["Tableau de Bord"]
  E404["Page 404"]

  HOME --> L001
  HOME --> D001
  HOME --> E404
  L001 --> C001
  C001 --> F001`,
  },

  {
    filename: 'sitemap-detailed.mmd',
    text: `%%@file id=sitemap-detailed project=SPACEHUB kind=sitemap view=detailed title="Arborescence Détaillée"
%%@tag MVP color=blue style=fill label="MVP"
%%@tag SP1 color=green style=outline label="Sprint 1"
%%@tag SP2 color=orange style=outline label="Sprint 2"
%%@tag VIP color=red style=outline label="VIP"
%%@node HOME code=HOME type=HOME access=public roles=ANONYMOUS,CLIENT,HOST,ADMIN url=/ order=1 tags=MVP icon=entry
%%@node L001 code=L001 type=L subtype=datagrid access=public roles=ANONYMOUS,CLIENT,HOST,ADMIN url=/spaces order=2 tags=MVP,SP1 icon=device
%%@node L001_dlg_filtres code=L001!filtres type=DLG order=1
%%@node C001 code=C001 type=C subtype=fiche access=public roles=ANONYMOUS,CLIENT,HOST,ADMIN url=/spaces/[id] dynamic=yes order=3 tags=MVP
%%@node C001_anc_avis code=C001#avis type=ANC order=1
%%@node F001 code=F001 type=F subtype=stepper access=protected roles=CLIENT,ADMIN url=/booking/[id] order=4 tags=MVP,SP2 who=CLIENT
%%@node F001_recap code=F001:RECAP type=F subtype=recap access=protected roles=CLIENT,ADMIN url=/booking/[id]/recap order=5
%%@node F002 code=F002 type=F subtype=formulaire access=protected roles=HOST,ADMIN url=/spaces/new tone=accent order=6 tags=SP2 who=HOST
%%@node D001 code=D001 type=D subtype=dashboard access=protected roles=CLIENT,HOST,ADMIN url=/dashboard order=7 tags=SP1 who=CLIENT,HOST,ADMIN
%%@node E404 code=E404 type=E subtype=erreur-404 access=public roles=ANONYMOUS,CLIENT,HOST,ADMIN url=/404 order=8
%%@node M001 code=M001 type=MOD scope=ALL order=1
%%@node M002 code=M002 type=MOD scope=AUTH order=2
%%@edge HOME>L001 kind=navigation
%%@edge HOME>D001 kind=navigation
%%@edge HOME>E404 kind=navigation
%%@edge L001>C001 kind=navigation
%%@edge L001>L001_dlg_filtres kind=attach ref=FEAT-FILTRES
%%@edge L001>F002 kind=action ref=FEAT-CREER-ESPACE
%%@edge C001>F001 kind=navigation
%%@edge C001>C001_anc_avis kind=attach
%%@edge F001>F001_recap kind=navigation
%%@edge L001>M001 kind=invoke
%%@edge F001>M002 kind=invoke
flowchart TD
  HOME(["Accueil SpaceHub"])
  L001["Catalogue des Espaces"]
  L001_dlg_filtres["Filtres Avancés"]
  C001(["Fiche Détail Espace"])
  C001_anc_avis["Avis Clients"]
  F001{"Tunnel de Réservation"}
  F001_recap{"Récapitulatif Commande"}
  F002{"Créer un Nouvel Espace"}
  D001["Tableau de Bord"]
  E404["Page Introuvable"]
  M001>"Centre d'Aide & FAQ"]
  M002>"Panier & Sélection"]

  HOME --> L001
  HOME --> D001
  HOME --> E404
  L001 --> C001
  L001 -.-> L001_dlg_filtres
  L001 -.-> F002
  C001 --> F001
  C001 -.-> C001_anc_avis
  F001 --> F001_recap
  L001 -.-> M001
  F001 -.-> M002`,
  },

  {
    filename: 'UC-RESERVATION-overview.mmd',
    text: `%%@file id=UC-RESERVATION-overview project=SPACEHUB kind=userflow view=uc uc=UC-RESERVATION obj=OBJ-RES-01 title="Cas d'Usage : Réservation Espace" roles=CLIENT,HOST
%%@node HOME code=HOME type=ECR order=1
%%@node L001 code=L001 type=ECR order=2
%%@node C001 code=C001 type=ECR order=3
%%@node F001 code=F001 type=ECR order=4
%%@node F001_recap code=F001:RECAP type=ECR order=5
%%@node CALL_PAY code=PF-PAIEMENT-SEG type=CALL order=6
%%@node D001 code=D001 type=ECR order=7
%%@node EXT_SUPPORT code=EXT-SUPPORT type=EXT order=8
%%@edge HOME>L001 kind=nominal
%%@edge L001>C001 kind=nominal
%%@edge C001>F001 kind=nominal
%%@edge F001>F001_recap kind=nominal
%%@edge F001_recap>CALL_PAY kind=nominal
%%@edge CALL_PAY>D001 kind=nominal
%%@edge F001>EXT_SUPPORT kind=variant
%%@edge EXT_SUPPORT>F001_recap kind=rejoin
flowchart LR
  HOME(["Accueil"])
  L001["Catalogue"]
  C001(["Fiche Espace"])
  F001{"Tunnel Réservation"}
  F001_recap{"Récapitulatif"}
  CALL_PAY[["Paiement Sécurisé"]]
  D001["Confirmation Dashboard"]
  EXT_SUPPORT[/"Rappel Conseiller ⏸"/]

  HOME --> L001 --> C001 --> F001 --> F001_recap --> CALL_PAY --> D001
  F001 -.-> EXT_SUPPORT -.-> F001_recap`,
  },

  {
    filename: 'PF-RESERVATION-NOM-collapsed.mmd',
    text: `%%@file id=PF-RESERVATION-NOM-collapsed project=SPACEHUB kind=userflow view=collapsed uc=UC-RESERVATION statut=nominal roles=CLIENT title="Parcours Nominal Réservation" atterrissage=D001
%%@node ND_HOME code=HOME type=ECR order=1
%%@node ND_ACT1 ref=FEAT-RECHERCHER type=ACT order=2
%%@node ND_L001 code=L001 type=ECR order=3
%%@node ND_ACT2 ref=FEAT-CHOISIR type=ACT order=4
%%@node ND_C001 code=C001 type=ECR order=5
%%@node ND_ACT3 ref=FEAT-CONFIG-OPTIONS type=ACT order=6
%%@node ND_F001 code=F001 type=ECR order=7
%%@node ND_ATT1 type=ATT order=8
%%@node ND_F001_RECAP code=F001:RECAP type=ECR order=9
%%@node ND_CALL_PAY code=PF-PAIEMENT-SEG type=CALL order=10
%%@node ND_D001 code=D001 type=ECR order=11
%%@edge ND_HOME>ND_ACT1 kind=nominal
%%@edge ND_ACT1>ND_L001 kind=nominal
%%@edge ND_L001>ND_ACT2 kind=nominal
%%@edge ND_ACT2>ND_C001 kind=nominal
%%@edge ND_C001>ND_ACT3 kind=nominal
%%@edge ND_ACT3>ND_F001 kind=nominal
%%@edge ND_F001>ND_ATT1 kind=nominal
%%@edge ND_ATT1>ND_F001_RECAP kind=nominal
%%@edge ND_F001_RECAP>ND_CALL_PAY kind=nominal
%%@edge ND_CALL_PAY>ND_D001 kind=nominal
flowchart LR
  ND_HOME(["Accueil"])
  ND_ACT1["Recherche par ville"]
  ND_L001["Catalogue des espaces"]
  ND_ACT2["Sélectionne l'espace"]
  ND_C001(["Fiche détaillée"])
  ND_ACT3["Configuration des créneaux"]
  ND_F001{"Tunnel options"}
  ND_ATT1{{"Vérification disponibilité"}}
  ND_F001_RECAP{"Récapitulatif commande"}
  ND_CALL_PAY[["Module Paiement Sécurisé"]]
  ND_D001["Tableau de bord"]

  ND_HOME --> ND_ACT1 --> ND_L001 --> ND_ACT2 --> ND_C001 --> ND_ACT3 --> ND_F001 --> ND_ATT1 --> ND_F001_RECAP --> ND_CALL_PAY --> ND_D001`,
  },

  {
    filename: 'PF-RESERVATION-VAR-ASSIST.mmd',
    text: `%%@file id=PF-RESERVATION-VAR-ASSIST project=SPACEHUB kind=userflow view=collapsed uc=UC-RESERVATION statut=variante roles=CLIENT title="Variante Devis & Rupture ⏸" diverge=PF-RESERVATION-NOM@7 rejoint=PF-RESERVATION-NOM@9
%%@node ND_F001 code=F001 type=ECR order=1
%%@node ND_ACT_HELP ref=FEAT-DEMANDE-DEVIS type=ACT order=2
%%@node ND_EXT_SUPPORT code=EXT-SUPPORT type=EXT obs=none break=yes resume=ND_F001_RECAP persist=external delay=24h order=3
%%@node ND_F001_RECAP code=F001:RECAP type=ECR order=4
%%@node ND_CALL_PAY code=PF-PAIEMENT-SEG type=CALL order=5
%%@edge ND_F001>ND_ACT_HELP kind=diverge
%%@edge ND_ACT_HELP>ND_EXT_SUPPORT kind=variant
%%@edge ND_EXT_SUPPORT>ND_F001_RECAP kind=rejoin
%%@edge ND_F001_RECAP>ND_CALL_PAY kind=nominal
flowchart LR
  ND_F001{"Tunnel réservation"}
  ND_ACT_HELP["Demande de devis sur mesure"]
  ND_EXT_SUPPORT[/"Rappel téléphonique conseiller ⏸"/]
  ND_F001_RECAP{"Récapitulatif ajusté"}
  ND_CALL_PAY[["Paiement validé"]]

  ND_F001 -.-> ND_ACT_HELP -.-> ND_EXT_SUPPORT -.-> ND_F001_RECAP
  ND_F001_RECAP --> ND_CALL_PAY`,
  },
];

export const DEMO_METADATA = {
  HOME: {
    code: 'HOME',
    title: 'Accueil & Vitrine',
    url: '/',
    template: 'HOME',
    access: 'public',
    roles: ['ANONYMOUS', 'CLIENT', 'HOST', 'ADMIN'],
    ctx_in: {},
    ctx_out: { utm_source: 'STRING', session_id: 'UUID' },
    tracking: { pageview: '/home', events: ['search_submit', 'explore_spaces'] },
  },
  L001: {
    code: 'L001',
    title: 'Catalogue des Espaces',
    url: '/spaces',
    template: 'L',
    subtype: 'datagrid',
    access: 'public',
    roles: ['ANONYMOUS', 'CLIENT', 'HOST', 'ADMIN'],
    ctx_in: { city: 'STRING', capacity: 'INTEGER' },
    ctx_out: { selected_space_id: 'INTEGER' },
    tracking: { pageview: '/spaces', events: ['filter_applied', 'card_click'] },
  },
  'L001!filtres': {
    code: 'L001!filtres',
    title: 'Filtres Avancés',
    template: 'DLG',
    access: 'public',
    ctx_in: { current_filters: 'OBJECT' },
    ctx_out: { applied_filters: 'OBJECT' },
  },
  C001: {
    code: 'C001',
    title: 'Fiche Détail Espace',
    url: '/spaces/[id]',
    template: 'C',
    subtype: 'fiche',
    access: 'public',
    roles: ['ANONYMOUS', 'CLIENT', 'HOST', 'ADMIN'],
    dynamic: true,
    ctx_in: { space_id: 'INTEGER' },
    ctx_out: { slot_id: 'STRING', price: 'NUMBER' },
    tracking: { pageview: '/spaces/:id', events: ['gallery_swipe', 'book_click'] },
  },
  'C001#avis': {
    code: 'C001#avis',
    title: 'Section Avis Clients',
    template: 'ANC',
    url: '/spaces/[id]#avis',
    access: 'public',
  },
  F001: {
    code: 'F001',
    title: 'Tunnel de Réservation',
    url: '/booking/[id]',
    template: 'F',
    subtype: 'stepper',
    access: 'protected',
    roles: ['CLIENT', 'ADMIN'],
    ctx_in: { space_id: 'INTEGER', slot_id: 'STRING' },
    ctx_out: { booking_id: 'UUID', total: 'NUMBER' },
  },
  'F001:RECAP': {
    code: 'F001:RECAP',
    title: 'Récapitulatif Commande',
    url: '/booking/[id]/recap',
    template: 'F',
    subtype: 'recap',
    access: 'protected',
    roles: ['CLIENT', 'ADMIN'],
  },
  F002: {
    code: 'F002',
    title: 'Créer un Nouvel Espace',
    url: '/spaces/new',
    template: 'F',
    subtype: 'formulaire',
    access: 'protected',
    roles: ['HOST', 'ADMIN'],
    tone: 'accent',
  },
  D001: {
    code: 'D001',
    title: 'Tableau de Bord',
    url: '/dashboard',
    template: 'D',
    subtype: 'dashboard',
    access: 'protected',
    roles: ['CLIENT', 'HOST', 'ADMIN'],
    ctx_in: { user_id: 'UUID' },
  },
  E404: {
    code: 'E404',
    title: 'Page Introuvable',
    url: '/404',
    template: 'E',
    subtype: 'erreur-404',
    access: 'public',
  },
  M001: {
    code: 'M001',
    title: "Centre d'Aide & FAQ",
    template: 'MOD',
    scope: 'ALL',
    access: 'public',
  },
  M002: {
    code: 'M002',
    title: 'Panier & Sélection',
    template: 'MOD',
    scope: 'AUTH',
    access: 'protected',
  },
  'EXT-SUPPORT': {
    code: 'EXT-SUPPORT',
    title: 'Rappel Téléphonique Conseiller',
    template: 'EXT',
    obs: 'none',
    break: { is_break: true, delay: '24h', resume_node: 'F001:RECAP' },
  },
};

export const DEMO_SHEETS = {
  HOME: `# Fiche d'Écran : HOME (Accueil & Vitrine)\n\n- **Code canonique** : \`HOME\`\n- **Template** : Homepage (\`type=HOME\`)\n- **URL** : \`/\`\n- **Accès** : \`public\`\n\nPage d'accueil de la plateforme SpaceHub avec moteur de recherche rapide et mise en avant des espaces recommandés.`,
  L001: `# Fiche d'Écran : L001 (Catalogue des Espaces)\n\n- **Code canonique** : \`L001\`\n- **Template** : Liste / Datagrid (\`type=L\`)\n- **URL** : \`/spaces\`\n- **Accès** : \`public\`\n\nCatalogue paginé des salles et espaces de coworking avec filtres latéraux.`,
  C001: `# Fiche d'Écran : C001 (Fiche Détail Espace)\n\n- **Code canonique** : \`C001\`\n- **Template** : Consultation (\`type=C\`)\n- **URL** : \`/spaces/[id]\`\n- **Page dynamique** : \`dynamic=yes\`\n\nPrésentation complète des équipements, photos, tarifs et avis certifiés.`,
  F001: `# Fiche d'Écran : F001 (Tunnel de Réservation)\n\n- **Code canonique** : \`F001\`\n- **Template** : Stepper (\`type=F\`)\n- **URL** : \`/booking/[id]\`\n- **Accès** : \`protected\`\n\nTunnel en plusieurs étapes pour la sélection des options et la confirmation des coordonnées.`,
  D001: `# Fiche d'Écran : D001 (Tableau de Bord)\n\n- **Code canonique** : \`D001\`\n- **Template** : Dashboard (\`type=D\`)\n- **URL** : \`/dashboard\`\n- **Accès** : \`protected\`\n\nEspace de suivi des réservations et téléchargement des factures.`,
};
