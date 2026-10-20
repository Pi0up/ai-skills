# Event Nodes Registry — Reference Sheet

> Indicative catalog of shared key event nodes.
> Conforms to spec-userflows.md (Section 2.2).

| Node | Type | Human Label | Carried Reference | Observability | Expected Signal |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ND-010 | ECR | Opens application file | C010:EDIT | Direct | URL: /files/[id] |
| ND-011 | ACT | Validates information | FEAT-VALIDER-INFOS | Direct | Event: feat_valider_infos |
| ND-020 | ECR | Returns to ready file | C010 | Direct | URL: /files/[id] |
| ND-021 | ACT | Submits application | FEAT-SOUMETTRE | Direct | Event: feat_soumettre |
| ND-030 | ACT | Requests advisor assistance | FEAT-DEMANDER-AIDE | Direct | Event: feat_demander_aide |
| ND-031 | EXT | Phone call with advisor | External exchange | Indirect | Return Key / Deep Link |
| ND-040 | ECR | Opens document upload | F010 | Direct | URL: /files/[id]/documents |
| ND-041 | ACT | Uploads files | FEAT-TELEVERSER | Direct | Event: feat_televerser |
| ND-042 | ATT | Document verification wait | Asynchronous processing | Indirect | Server status / Webhook |
| ND-043 | ECR | Review verification results | F010:CONTROLE | Direct | URL: /files/[id]/documents |
