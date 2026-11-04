# Changelog

Toutes les modifications notables apportées à ce projet sont consignées dans ce fichier.

## 1.0.0 (2026-11-04)

### ✨ Features

* **cli:** implement ia-tools automation package and validation engine ([c9e29f2](https://github.com/Pi0up/ai-skills/commit/c9e29f2f73547036c93287f530056a6a505e2267))
* **cli:** support unified preview.html generation, node metadata indexing, and English defaults ([4e0b786](https://github.com/Pi0up/ai-skills/commit/4e0b786ac30d9d79ba5fd8ed098e6fca3a949bcd))
* **dataset:** add comprehensive ECO-STAYS test dataset covering all IA articulation cases ([5d1f3f2](https://github.com/Pi0up/ai-skills/commit/5d1f3f2d1e78b4e442d745dabc225ca68c8a5f48))
* **installer:** add multi-platform installation script for AI assistants ([ec7427d](https://github.com/Pi0up/ai-skills/commit/ec7427dfca420ddd271e1ea150b3115a9bccd637))
* **mermaid_gen:** project page card nodes using pages.md label and relative url with trailing slash ([44562b4](https://github.com/Pi0up/ai-skills/commit/44562b425bb33ad60d51bf2ce1113bceba51db3c))
* **preview:** add unified HTML preview template with pan-zoom, inspector, and image exports ([57b2ed1](https://github.com/Pi0up/ai-skills/commit/57b2ed156816f0729914f246109155b2d02c2240))
* **preview:** create preview-showcase folder and implement unified-preview-template v1.1 ([b6f00f2](https://github.com/Pi0up/ai-skills/commit/b6f00f2d3dfd776391ac2b1acdf15d81e6c14a37))
* **preview:** implement dynamic directory scanner for preview.html and metadata.json ([b20607c](https://github.com/Pi0up/ai-skills/commit/b20607c351ed943886c6da759a71ca95f5da1a89))
* **preview:** rendre les lignes cross de l'arborescence systématiquement courbes ([4e3832b](https://github.com/Pi0up/ai-skills/commit/4e3832bb5081142e9f8f8b8122c46b9990947e72))
* **skills:** add 8 core agent skills and plugin manifest ([176f38d](https://github.com/Pi0up/ai-skills/commit/176f38df11ec4c6477c1f3fa179e0d8deed47e2f))
* **specs,ia-tools:** add specification and tools support for external service pages (EXT) in sitemap ([6166ce8](https://github.com/Pi0up/ai-skills/commit/6166ce810183820ff4737585939aac456e09cdd5))
* **studio,dataset:** render native vector icons, embed standalone export styles, and display external services in sitemap ([418af35](https://github.com/Pi0up/ai-skills/commit/418af353ed84bbe2bd71dbe52a8612280cb02061))
* **studio:** add external studio dependency sync tool and CLI command ([c155081](https://github.com/Pi0up/ai-skills/commit/c155081cfe2b83f61783287cb9ef0edbe2ade31c))
* **studio:** add support for hiding ACT and ATT with graph contraction, and ATT node rendering ([94373b3](https://github.com/Pi0up/ai-skills/commit/94373b39d1c81c74d4a235f7c6af0c0646c8be2c))
* **studio:** add test dataset generator script, build automation and dataset test suite ([38d012a](https://github.com/Pi0up/ai-skills/commit/38d012a75abc55a4b86b5c5d78de25a8f6ecc025))
* **studio:** implement UC folder vertical stacking, fix centerOnNode without bounce, and optimize event delegation ([4d4f2fe](https://github.com/Pi0up/ai-skills/commit/4d4f2fef92433590d25de7b3648867d1bed94df0))
* **studio:** initialize Information Architecture Studio project structure with Vite singlefile build ([0425094](https://github.com/Pi0up/ai-skills/commit/042509488bd4042a1c3b397224ff6628de0c1b92))
* **studio:** stacker les badges verticalement vers le bas avec recouvrement de 2px ([0f3fa71](https://github.com/Pi0up/ai-skills/commit/0f3fa71f6877b18c92d161d5e1f49925bb6cb39c))
* **studio:** support drag & drop of metadata.json and header version management ([0a88c2a](https://github.com/Pi0up/ai-skills/commit/0a88c2a40848092b5aa3c3448eb1c873501584ab))
* **studio:** try loading metadata.json next to preview.html with fallback folder dialog ([76c4825](https://github.com/Pi0up/ai-skills/commit/76c4825fc0fcfff6778703492aba0492e083ef51))
* **studio:** unifier les badges en objets SVG et les stacker en haut à droite ([61d46d6](https://github.com/Pi0up/ai-skills/commit/61d46d6307bee24cd4f39c16dfc026dcaffa7ea8))
* **studio:** unifier les tags en objet SVG et les stacker verticalement sur la droite ([b212e41](https://github.com/Pi0up/ai-skills/commit/b212e418568e917af2e7a81fd870331950925883))
* **templates:** add ATT node to nominal userflows and enrich break metadata in showcase ([8ff4f50](https://github.com/Pi0up/ai-skills/commit/8ff4f50efe73666929e9b419b3950fec6ca8fc5f))
* **templates:** add canonical templates and mermaid styling theme ([51ceb96](https://github.com/Pi0up/ai-skills/commit/51ceb969793984bbd887708f557cccc9a3a12858))
* **templates:** standardize templates to English and strip inline styles for pure logic ([16d4795](https://github.com/Pi0up/ai-skills/commit/16d479583a545942bdf59b594714bdea8baa52db))
* **urls:** enforce trailing slash on relative paths except for leaf popins and anchors ([13181f8](https://github.com/Pi0up/ai-skills/commit/13181f8bc275816322ac63d10230593a2a4da7d2))
* **userflows:** enforce raw variant file decoupling, divergence contextualization and unified UC overview ([4f9504b](https://github.com/Pi0up/ai-skills/commit/4f9504bbd4a9847287b447f1b78c2dd1d7b24fc4))

### 🐛 Bug Fixes

* **cli:** support arborescence subfolder in generate-mermaid and extract-screens ([cde4ba7](https://github.com/Pi0up/ai-skills/commit/cde4ba754680796621002a2c6e289d9ddf7e43ee))
* **installer:** correct global antigravity target path to ~/.gemini/config ([5c7d1cb](https://github.com/Pi0up/ai-skills/commit/5c7d1cb018eab77df66a7d8d0993238d49027f32))
* **parser:** split userflow sections by level 2 headings to preserve subsections ([e24751d](https://github.com/Pi0up/ai-skills/commit/e24751d167b64bc98896e66437f4a6126e249591))
* **studio:** passer la toolbar superieure au-dessus de la toolbar flottante pour liberer le dropdown export ([5ef602f](https://github.com/Pi0up/ai-skills/commit/5ef602fe801160a77c34b042919ac3b77f8dccb9))
* **studio:** resolve blurry canvas, infinite background, Y-axis alignment, legend panel and line styles ([eb38051](https://github.com/Pi0up/ai-skills/commit/eb38051f14b2a79a0c2ad433b30d7f34f94a2909))
* **studio:** resolve sitemap subtree overlap, clean card titles on 2 lines, and format relative URLs ([8052de7](https://github.com/Pi0up/ai-skills/commit/8052de7533ba74b8ba4a1977cf8051669cbe003f))
* **templates:** align arborescence templates and pages table with verbatim labels and relative urls ([c92a633](https://github.com/Pi0up/ai-skills/commit/c92a633837321f63ac147c2d0a2ea16a1c09b845))
