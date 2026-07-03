# Architecture SankeyApplication

Ce document décrit l'architecture globale de la stack SankeyApplication et référence des pistes d'amélioration identifiées lors de la revue de code du 2026-04-12, **mise à jour lors de la revue du 2026-07-03** (statut de chaque piste, forces/faiblesses et plan d'action en fin de document).

## Stack 3 couches

L'application est construite en 3 couches concentriques, chacune étend la précédente via des submodules git imbriqués (classes `*SA → *OSP → base`).

```
sankeyapplication/                          LAYER 3 — SankeyApplication (SaaS)
├── client/src/                             React top-level, auth, Stripe, MFA UI
│   ├── index.tsx                           mount React + Class_ApplicationDataSA
│   ├── AppSA.tsx                           wrapper, routing HashRouter
│   ├── ApplicationDataSA.tsx               extends Class_ApplicationDataOSP
│   ├── MenuConfigSA.tsx                    extends Class_MenuConfigOSP
│   └── deps/                               symlinks vers submodules
├── server/                                 Flask backend
│   ├── __init__.py                         create_app, register blueprints
│   └── views.py                            routes SankeyApp, MFA solver
├── app.py                                  Flask entry
├── submodules/
│   ├── OpenSankey+/                        LAYER 2 — OSP (premium)
│   │   ├── client/src/
│   │   │   ├── AppOSP.tsx
│   │   │   ├── ModulesOSP.tsx              injecte menus/dialogs OSP
│   │   │   ├── types/                      ApplicationDataOSP, DrawingAreaOSP, MenuConfigOSP
│   │   │   └── components/                 SankeyPlusViews, tags, icons, trial
│   │   └── submodules/OpenSankey/          LAYER 1 — base
│   │       └── opensankey/client/src/
│   │           ├── App.tsx                 OpenSankeyApp
│   │           ├── types/                  Class_ApplicationData, DrawingArea, Sankey, MenuConfig, Tag, TagGroup
│   │           ├── Elements/               Node, Link, TextZone, LinkValues, NodeDimension
│   │           ├── Persistence/            SankeyPersistence (toJSON/fromJSON versionné)
│   │           └── components/             configmenus, topmenus, dialogs
│   ├── LoginComponent/                     auth JWT, Stripe, user DB
│   └── MFAProblem/                         solveur Python réconciliation MFA
```

**Stack technique** : React 18 + TypeScript + D3.js + Chakra UI + i18next côté client (build Craco, pnpm) ; Flask 2.3 + SQLAlchemy + SQLite + Alembic côté serveur ; Stripe pour la facturation ; MFAProblem (Python, Eigen/NumPy) pour la réconciliation.

## Data model

```
Class_ApplicationData
├── _drawing_area: Class_DrawingArea
│   ├── _sankey: Class_Sankey
│   │   ├── _nodes: {[id]: Class_NodeElement}
│   │   ├── _links: {[id]: Class_LinkElement}
│   │   ├── _containers: {[id]: Class_ContainerElement}   (free labels)
│   │   ├── _styles: {[id]: Class_ElementStyle}
│   │   ├── _nodes_dimensions, _node/flux/data/level/view_taggs
│   │   └── _icon_catalog
│   ├── _legend: ClassTemplate_Legend
│   └── _selection_zone: Class_ZoneSelection
├── _history: Class_ApplicationHistory          undo/redo (buffer 10)
├── _menu_configuration: Class_MenuConfig
└── _icon_library: Class_IconLibrary
```

Hiérarchie d'éléments : `Class_BaseElement → Class_ProtoElement → Class_BaseShape → {Class_NodeBase → Class_NodeElement | Class_LinkAttribute → Class_LinkElement}`, plus `Class_ContainerElement` pour les zones de texte.

Tags : `Class_ProtoTag` → `Class_Tag → {NodeTag(→LevelTag/ViewTag), FluxTag} | DataTag`. Idem pour les groupes. `Type_MacroTagGroup = 'node_taggs' | 'flux_taggs' | 'data_taggs' | 'level_taggs' | 'view_taggs'`.

## Pipeline de rendu D3

`Class_DrawingArea` maintient une structure de sélections d3 persistées :

```
d3_selection_zoom_area    <svg> root, zoom/pan
└── d3_selection          <g> principal
    ├── d3_selection_bg_group            (bg + grid)
    ├── d3_selection_elements_group      (sankey + handlers + zone select)
    ├── d3_selection_legend
    └── d3_selection_def_gradient
```

Pattern `Class_BaseElement.draw()` :

```
draw() → _process_or_bypass()
          ├─ unDraw()
          └─ if visible && !deleted → _draw()
                                       ├─ _initDraw() (crée <g>)
                                       ├─ setEventsListeners()
                                       └─ override subclass
```

Flag `bypass_redraws` sur la DA court-circuite les redraws pendant les opérations en lot. Modes : `selection | edition | style_paint | static/publish`.

## Pattern ref-based (perf)

Pour éviter le prop-drilling et les re-renders React massifs, `Class_MenuConfig` stocke des `MutableRefObject` vers les setters/updaters des composants. Les mutations data appellent `ref.current()` pour forcer un re-render ciblé.

```ts
// Class_MenuConfig
_ref_to_menu_config_nodes_selection_updater: MutableRefObject<() => void>

// Composant React
const [, force] = useReducer(x => x + 1, 0)
useEffect(() => { menu_config.ref_to_menu_config_nodes_selection_updater.current = force }, [])

// Mutation depuis data model
app_data.menu_configuration.ref_to_menu_config_nodes_selection_updater.current()
```

Onglets de menu : `data | style | presentation`.

## Système de vues OSP

`Class_ApplicationDataOSP._views` stocke les vues en gzip. À chaque switch via `extractViewFromJSON`, l'instance `Class_DrawingArea` est recréée — l'état d'héritage vit donc sur `app_data`, pas sur la DA.

```ts
_heredited_attr: { [target_view_id]: { [source_id]: string[] } }
```

Cascade dans `_setCurrentView` : le maître puis les vues dans l'ordre de `_views_order` sont appliqués via `updateFrom(target_da, source_da, attrs)`. Le dialogue `ModalTransparentViewAttrOSP` gère l'UI d'édition. Hotkeys : F7 (master), F8 (prev), F9 (next), Ctrl+X (new view).

## Persistance

Chaque classe a une classe statique `*Persistence` dans `SankeyPersistence.tsx` :

```ts
static toJSON(el, json, kwargs?): Type_JSON
static fromJSON(version, el, json, kwargs?): void
// + fromJSON_pre_0_9, fromJSON_0_9, fromJSON_0_91 pour legacy
```

Version actuelle : `1.1.9` (alignée sur la version applicative depuis mai 2026). Depuis avril : migration `fromJSON_pre_0_94` (refonte expansion #1225) et module isolé [`persistenceMigrations.ts`](submodules/OpenSankey+/submodules/OpenSankey/opensankey/client/src/Persistence/persistenceMigrations.ts) (migration #191, comparateur `isVersionBelow` correct sur les versions à segments). Côté OSP, les vues sont compressées gzip dans le JSON racine (`views[id] = {...data, name, heredited_attr}` + `current_view`).

## Licensing / trial

Types de licence DB : `terriflux` (free), `OpenSankey+`, `sankeysuite` (AFM). Flags côté app : `has_sankey_plus`, `has_sankey_afm`, `has_sankey_dev`. Le trial OSP est client-side (localStorage, 30 jours, UUID anonyme), endpoints `/api/trial/started` et `/api/trial/converted`.

## Documentation (`doc/`)

La documentation technique et utilisateur vit sous [`doc/`](doc/), séparée du code applicatif et servie par Flask via [`doc/views.py`](doc/views.py).

### Structure Sphinx multi-langue, multi-audience

```
doc/
├── sources/
│   ├── fr/                     projet Sphinx FR
│   │   ├── conf.py
│   │   ├── index.rst           racine : toctree user/ + dev/
│   │   ├── user/
│   │   │   ├── index.rst
│   │   │   └── features/       auto-découverte via :glob:
│   │   │       └── mode_englobant.rst
│   │   └── dev/
│   │       ├── index.rst
│   │       └── features/
│   │           └── mode_englobant.rst
│   ├── en/                     miroir EN (même arbo, fichiers nommés en anglais)
│   │   └── ...
│   ├── index/, pages/, conf.py legacy 2023 — non référencés par fr/ ou en/, à archiver
│   └── README.md
├── templates/                  fiches de départ pour une nouvelle feature
│   ├── README.md
│   ├── feature-user.rst
│   └── feature-dev.rst
├── build/                      artefacts HTML (gitignore)
├── __init__.py / views.py      blueprint Flask qui sert la doc buildée
└── git_cleaner_documentation.md, git_selector.md
```

**Deux projets Sphinx indépendants** (un par langue) au lieu de `sphinx-intl`/gettext : chaque langue est éditée directement en RST, ce qui simplifie le workflow au prix d'une synchro manuelle. Migration vers gettext envisageable si la maintenance devient lourde.

**Split user/dev par langue** : la section `user/` répond à « que fait la feature, comment l'utiliser, quelles limites » ; la section `dev/` répond à « où vit le code, comment ça marche, pourquoi ces choix ». Les limitations visibles utilisateur apparaissent dans les deux. Chaque page croise l'autre via `:doc:` en bas.

**Auto-découverte des features** : les `index.rst` de `features/` utilisent `:glob: *`, donc ajouter un nouveau fichier `.rst` suffit à l'inclure dans la toctree. Pas de registre à mettre à jour.

### Workflow pour documenter une nouvelle feature

Chaque feature livrée produit **4 fichiers** : `{fr,en}/{user,dev}/features/<nom>.rst`. Le nom de fichier suit la langue (ex. `mode_englobant.rst` en FR, `enclosing_mode.rst` en EN). Partir des templates [`doc/templates/feature-user.rst`](doc/templates/feature-user.rst) et [`doc/templates/feature-dev.rst`](doc/templates/feature-dev.rst) — voir [`doc/templates/README.md`](doc/templates/README.md) pour les conventions (longueur, screenshots dans `_images/`, références de code par classe/méthode plutôt que par ligne, etc.).

Les pages dev peuvent (et doivent) citer précisément les fichiers impactés, mais préfèrent des ancres stables (`Class_Foo.bar`) aux numéros de ligne qui dérivent.

### Build

Depuis la racine du dépôt :

```bash
sphinx-build -b html doc/sources/fr doc/build/fr/html
sphinx-build -b html doc/sources/en doc/build/en/html
```

`conf.py` de chaque projet est minimaliste (`sphinx_rtd_theme`, pas d'extensions).

### Legacy et follow-up

- [`doc/sources/index/`](doc/sources/index/), [`doc/sources/pages/`](doc/sources/pages/) et `doc/sources/conf.py` sont la documentation 2023, **plus référencée** par les projets `fr/` / `en/`. À archiver ou supprimer dans un passage ultérieur une fois les pages migrées.
- [`doc/views.py`](doc/views.py) n'est **pas encore adapté** au double arbre fr/en — la route Flask sert toujours l'ancien layout. Follow-up : router `/doc/fr/...` et `/doc/en/...` sur `doc/build/{fr,en}/html/`, avec sélection automatique selon la langue active côté app.

## Submodules Python

### SankeyExcelParser (v1.1.9)

Parser Excel ↔ graphe Sankey Python, distribué en binaire Cython (wheels `.pyd`/`.so`). Publié sur PyPI.

**API publique** :
```python
from SankeyExcelParser.io_base import IOExcel, IOJson
io = IOExcel()
ok, msg = io.load_sankey("model.xlsx")
sankey = io.sankey  # SankeyPandas avec nodes, flux, taggs
io_out = IOExcel(sankey); io_out.write_sankey("output.xlsx")
```

**Modèle** : `SankeyBase` → `SankeyPandas` (dict `nodes`/`flux`/`taggs`), éléments `Node`, `Flux`, `Data`, `StockData`, `DataMinMax`, `DataConstraint`, `Tag`, `TagGroup`.

**Feuilles Excel** : ordre de traitement Tags → Nodes → Topologie (TER/IO) → Data (Values/Stocks) → Contraintes. Support FR/EN via regex sur noms de feuilles/colonnes.

**Changements avril 2026** : `StockData` pour stocks réconciliables (feuilles `stocks_results`/`stocks_analysis`), tapered flows (`data_value_target`), encodage hex pour IDs non-alphanumériques, distribution Cython binary-only.

### MFAProblem (v1.1.9)

Solveur de réconciliation de flux de matière. Problème : trouver des valeurs compatibles avec les équations de bilan à partir de mesures incertaines.

**API publique** (appelée depuis `server/views.py`) :
```python
from mfa_problem import mfa_problem_main
ok = mfa_problem_main.optimisation(model_name, sankey, uncertainty_analysis, nb_realisations, downscale)
```

**Approche** : Quadratic Programming via CVXPY + OSQP. Least-squares pondéré `min Σ (x−z)²/σ²` sous contraintes `A_eq x = 0` (bilan + agrégation) et box `min ≤ x ≤ max`. Tolérance cascade 1e-5 → 1e-4 → 1e-3. Multi-threadé par combinaison de datatags.

**Pipeline** :
1. Index flux + stocks → `data2index` / `index2data`
2. Build contraintes (aggregation, bilan nœud avec `+1` in / `−1` out / `−1` stock, autres)
3. Load `ter_vectors` (DATA, SIGMA, LB, UB)
4. Solve : RREF via C++/Eigen (`mfa_problem_matrices.pyd` / pybind11) → classification (mesuré / redondant / déterminé / libre) → `Cvx_minimize` → intervalles des variables libres (LP min/max) → optionnel Monte Carlo
5. Check compliance
6. Output : `data._result = Data(...)` ou `node.add_stock_result(...)` avec cross-link `alterego`

**Stock reconciliation (avril 2026)** : stocks indexés comme colonnes additionnelles, LB par défaut `-MAX_VALUE` pour drawdown, coefficient `-1.0` sur la ligne de bilan matché par set de datatags. Résultat créé en `StockData` séparé. Limitations : stocks sur nœuds parents (PR/PC) non réconciliés, invisibles aux contraintes de ratio.

**Fichiers clés** : `mfa_problem_main.py` (API, threading), `mfa_problem_solver.py` (RREF, CVXPY, MC), `mfa_problem_format_io.py` (builders contraintes, loader, output), `mfa_problem_check_io.py`, `mfa_problem_matrices/` (C++ Eigen).

### LoginComponent

Auth, licensing et paiement Stripe. Deux parties : `client/` (React/TS) et `server/` (Flask/SQLAlchemy).

**Schéma DB** (SQLAlchemy, `server/models.py`) :
- `User` : id, email (unique), password (sha256), firstname/name, dir, is_developer, stripe_id (customer), secret_token/expiry (reset)
- `License` : id, name (`OpenSankey+`, `SankeySuite`, `terriflux`), stripe_id (product)
- `UserLicences` (join) : user_id, license_id (cascade), creation, expiry (ISO ou `"never"`), activated, stripe_id (subscription)
- `Metrics` : id = SHA256(IP), nb_visits, last_visit

**Blueprints Flask** :
- `auth` — `/auth/{signup/create, login, logout, connected, license, forgot_pw, reset_pw/<token>}`
- `connected_user` — `/user/{infos, infos/modify/*, delete/license/<name>, delete/account}` (tout `@login_required`)
- `stripe` — `/stripe/{config, create-customer-portal, session-status, webhook}`

**Webhooks Stripe** : `customer.*`, `customer.subscription.*`, `product.*`, `checkout.session.completed` (→ `activated=False` si payé), `invoice.paid` (→ `activated=True`, `expiry="never"`).

**Flow paiement** : `PaiementCheckout` embed `<stripe-pricing-table>` → webhook `checkout.session.completed` → webhook `invoice.paid` active la licence → front `PaiementReturn` poll `/stripe/session-status`. Avril 2026 : `PaiementReturn` POST `/api/trial/converted` avec UUID lu depuis `localStorage.os_plus_trial_uuid` (idempotent via flag `os_plus_trial_converted`).

**Client** : `LoginComponent` singleton attaché à `Class_ApplicationDataSA.login_component`. `checkTokens()` throttlé à 1800ms appelle `GET /auth/connected` puis `POST /auth/license` et met à jour `has_account`, `has_licence_sankeyplus/sankeysuite/dev`. Routes gardées par `PrivateRoute` / `PublicRoute` / `LoginRoute`.

**Sécurité** : Werkzeug sha256, Flask-Login + remember cookies, Flask-CORS `support_credentials=True`, webhook Stripe signature vérifiée, reset password via `itsdangerous.URLSafeTimedSerializer` TTL 15 min, in-app PIN 6 chiffres TTL 10 min.

**Env requis** : `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID_OSPLUS{MENSUEL,ANNUEL}`, `STRIPE_ENDPOINT_SECRET`, `STRIPE_PRICING_TABLE_ID`, `CLIENT_ROOT_URL`, `MAIL_SENDING_ADRESS/PWD`, `MAIL_SERVER/PORT`, `MAIL_USE_TLS/SSL`, `MAIL_DBG_MODE`.

---

# Pistes d'amélioration

Identifiées lors de la revue de code d'avril 2026, non priorisées. **Le statut de chaque piste au 2026-07-03 est consolidé dans la section « Revue du 2026-07-03 » en fin de document.**

## 1. Symlinks `deps/` fragiles sous Windows

Le triple imbriquement `client/src/deps/OpenSankey+/deps/OpenSankey/` via submodules + symlinks est une source classique de casse en CI ou sur nouveau clone.

**Suggestion** : pnpm workspace avec path mappings TypeScript, ou au minimum un script `postinstall` qui recrée les symlinks de manière idempotente et vérifie leur intégrité.

## 2. `ApplicationDataOSP.tsx` à ~916 lignes

La classe mélange vues, trial, préférences utilisateur, clavier, persistance, palettes de couleurs.

**Suggestion** : découper en services composés (`ViewsManager`, `TrialManager`, `UserPreferencesStore`, `KeyboardHandler`). Réduit la surface de conflits de merge et facilite les tests unitaires ciblés.

## 3. `SankeyPlusViews.tsx` à ~1486 lignes

Contient 6+ composants et modals (`BannerViewsOSP`, `SelecteurView`, `ViewsConfig`, `ModalTransparentViewAttrOSP`, `ModalViewNotSavedOSP`, `ModalCreateUnitaryViewOSP`).

**Suggestion** : un fichier par composant/modal. Améliore la navigation, limite les imports circulaires, facilite le tree-shaking.

## 4. Pattern ref-based non documenté

Le pattern `MutableRefObject` contourne le modèle React et doit être re-dérivé à chaque nouvelle feature.

**Suggestion** : un helper `useForceRerender(ref)` + convention nommée documentée en tête de `MenuConfig.tsx`. Exemple :

```ts
function useForceRerender(slot: MutableRefObject<() => void>) {
  const [, force] = useReducer(x => x + 1, 0)
  useEffect(() => { slot.current = force }, [slot])
}
```

## 5. `bypass_redraws` comme flag global non-safe

Si une exception survient entre `= true` et `= false`, la DA reste figée jusqu'au prochain reset manuel.

**Suggestion** : helper `withBypassRedraws(da, fn)` avec try/finally.

```ts
function withBypassRedraws<T>(da: Class_DrawingArea, fn: () => T): T {
  da.bypass_redraws = true
  try { return fn() } finally { da.bypass_redraws = false; da.draw() }
}
```

## 6. Versioning persistance empilé

Les migrations `fromJSON_pre_0_9`, `fromJSON_0_9`, `fromJSON_0_91` s'accumulent sans table versionnée ni tests dédiés.

**Suggestion** : table de migrations séquentielles (style Alembic), chaque migration testée avec un fichier golden d'entrée et de sortie. Permet aussi de retirer les migrations anciennes une fois obsolètes avec confiance.

## 7. Change tracking par deep-clone entier

`_original_current_view` clone toute la vue à chaque switch pour détecter les changements — coûteux sur gros diagrammes.

**Suggestion** : dirty flag par champ muté, ou diff structurel au moment du save plutôt qu'un clone préventif.

## 8. Migration legacy `heredited_attr` in-place

La conversion de l'ancien format (`string[]` + `heredited_source_id`) vit dans le `fromJSON`, ce qui est OK mais sans marqueur de version.

**Suggestion** : introduire un marqueur dans le JSON indiquant le format d'entrée, et retirer la migration une fois tous les fichiers utilisateurs migrés.

## 9. Héritage profond `*SA extends *OSP extends *Base`

Trois niveaux d'extension rendent les overrides difficiles à retracer et les features OSP/SA difficiles à isoler.

**Suggestion** : architecture par composition (registry de plugins enregistrés via `ModulesOSP.register(...)` avec hooks bien définis). Plus testable, plus modulaire, compatible avec un futur découpage en npm packages séparés.

## 10. Couverture de tests à confirmer

Peu (pas ?) de tests unitaires visibles sur `Class_Sankey`, les valeurs, les tags, ou la persistance JSON.

**Suggestion** : prioriser les tests sur :
- `Class_Sankey` : add/remove node/link/tag, suppression en cascade
- Persistance : round-trip `toJSON → fromJSON` sur des fichiers golden
- `updateFrom` : cascade des attrs entre DA (base de l'héritage de vues)
- `heredited_attr` : migration legacy et cascade multi-source

## 11. MFAProblem — couplage duck-typing fragile entre `Data` et `StockData`

L'ajout des stocks (avril 2026) repose sur la parité d'interface entre `Data` et `StockData` (même attributs `sigma`, `min_val`, `max_val`, `analysis_vector`). Le solveur les traite uniformément via `isinstance` et des helpers comme `_data_label()`. Un refactor d'un côté qui oublie l'autre casse silencieusement la réconciliation.

**Suggestion** : extraire un `Protocol` (PEP 544) ou une classe de base explicite `ReconciliableVariable` documentant l'interface attendue par le solveur, et faire hériter `Data` et `StockData` de cette base. Les limitations actuelles (stocks sur parents non supportés, invisibles aux ratios) gagneraient aussi à être formalisées comme capabilities optionnelles.

## 12. MFAProblem — taille des fichiers et couplage

`mfa_problem_solver.py` (~1000L) et `mfa_problem_format_io.py` (~1400L) mélangent builders de contraintes, loaders, output, et helpers debug. L'ajout des stocks a nécessité des modifs parallèles dans les deux fichiers.

**Suggestion** : extraire un module `constraints_builder.py` (aggregation, nodes, ratios) et un module `results_writer.py` (Data vs StockData output), isolés et testables unitairement.

## 13. SankeyExcelParser — feuilles à reconnaissance regex

Le support bilingue (FR/EN) et la tolérance aux variations de nom de feuille passent par des regex dans `io_excel_constants.py`. Robuste mais silencieux : un nom proche d'un pattern mais non-match est ignoré sans warning.

**Suggestion** : logger systématiquement les feuilles ignorées, avec la distance de Levenshtein aux patterns connus. Aide énormément au debug quand un utilisateur rapporte un parsing partiel.

## 14. SankeyExcelParser — distribution Cython opaque

La compilation Cython retire les sources Python du wheel, ce qui complique le debug en prod (tracebacks pointent vers `.pyd` sans ligne lisible) et empêche le hot-reload en dev.

**Suggestion** : garder un build `pip install -e .` non-Cython pour le dev local, et réserver la compilation à la CI pour les releases. Un flag `SEP_CYTHON=1` dans `setup.py` permettrait de basculer explicitement.

## 15. LoginComponent — hash sha256 vs standard moderne

Les mots de passe sont hashés avec `werkzeug.generate_password_hash(method="sha256")`. sha256 simple (même salé par werkzeug) n'est plus recommandé pour des mots de passe — préférer bcrypt, argon2, ou au minimum `pbkdf2:sha256` avec un nombre d'itérations élevé (werkzeug le supporte nativement).

**Suggestion** : migrer vers `argon2` (via `argon2-cffi`) ou `pbkdf2:sha256:600000`. Migration progressive : au prochain login, rehasher si le hash existant utilise l'ancien schéma. Aucun impact utilisateur.

## 16. LoginComponent — webhooks Stripe idempotence

Les handlers de webhook (`checkout.session.completed`, `invoice.paid`) mutent la DB directement sans déduplication. Stripe peut retenter un webhook plusieurs fois — un double-traitement pourrait activer une licence deux fois ou créer des doublons.

**Suggestion** : table `stripe_events_processed(event_id PRIMARY KEY)` consultée en début de handler ; skip si déjà traité. Stripe garantit l'unicité de `event.id`, c'est le pattern officiel recommandé.

## 17. LoginComponent — pas de séparation dev/test/prod dans les webhooks

Le webhook Stripe écoute `POST /stripe/webhook` sans discriminer l'environnement Stripe (test vs live). Un webhook test qui arrive en prod pollue la DB.

**Suggestion** : vérifier `event.livemode` dans le handler, logger les mismatches, et refuser les events hors environnement attendu.

---

# Robustesse du code — dette technique identifiée

Liste de tâches ciblées pour fiabiliser le code face aux cas limites déjà rencontrés ou probables. Chaque entrée mentionne le symptôme concret, pas une amélioration hypothétique.

## R1. Encodage `action_arg` dans le menu contextuel

**Symptôme** : dans [`SankeyMenuContext.tsx`](submodules/OpenSankey+/submodules/OpenSankey/opensankey/client/src/components/dialogs/SankeyMenuContext.tsx) les `actionName` dynamiques encodent un argument via un `_` (`aggregate_${dim.parent.id}`, `disaggregate_${id}`, `expandLeft_${id}`, `containerInChildrenOutParent_${id}`, `setChild_${id}`…). Or les IDs produits par `makeId(name)` contiennent eux-mêmes des `_` (`<std_name>_<randomId>`). Un `actionName.split('_')` naïf tronque l'argument. Fix minimal appliqué (slice sur `indexOf('_')`) — mais le format reste fragile.

**Suggestion** : remplacer l'encodage string par une structure `{ action: string, arg?: string }` dans les items de menu, ou au minimum un séparateur non-collisionnable (`:` ou `|`) + un helper `parseActionName` centralisé avec tests. Tous les sites d'émission et de consommation doivent basculer ensemble.

## R2. Parsing silencieux dans SankeyExcelParser

Déjà listé en #13 côté perf/debug, mais aussi un enjeu robustesse : une feuille renommée par erreur est simplement ignorée, le parse réussit avec un graphe incomplet et l'utilisateur ne voit le problème qu'en comparant visuellement.

**Suggestion** : mode strict optionnel côté API (`IOExcel.load_sankey(strict=True)`) qui lève sur toute feuille candidate non-matchée. Activer en CI / tests.

## R3. `bypass_redraws` sans garde

Doublon de #5, listé ici pour rappeler qu'il s'agit de robustesse exécutionnelle, pas juste de style : une exception dans un import, un clavier-shortcut en plein batch, un `await` oublié → DA figée, nécessite F5. Prioritaire si l'on veut des Error Boundaries utiles.

## R4. Persistance JSON sans validation de schéma

`fromJSON` suppose la forme du JSON et plante en runtime sur une propriété manquante. Sur les fichiers utilisateurs anciens ou édités à la main, on obtient un stack-trace opaque.

**Suggestion** : valider le JSON racine contre un schéma (Zod côté TS, marshmallow/pydantic côté Python) avant dispatch aux `fromJSON`, avec un message d'erreur listant les champs problématiques. Option : quarantaine automatique du fichier corrompu avec copie `.corrupted.json`.

## R5. Gestion d'erreur côté MFAProblem → client

Les erreurs du solveur (infaisabilité, matrice singulière, timeout OSQP) remontent via exceptions Python que `server/views.py` transforme en 500. Le client affiche un toast générique. L'utilisateur n'a pas de piste.

**Suggestion** : classe d'erreur `MFAProblemError` avec codes (`INFEASIBLE`, `SINGULAR`, `TIMEOUT`, `BAD_CONSTRAINT`), sérialisée en JSON structuré côté Flask, mappée en message i18n côté front.

## R6. IDs non-uniques possibles sur import multi-fichiers

`makeId` concatène `randomId()` court — collision peu probable unitaire, mais les vues OSP et l'import Excel peuvent fusionner des graphes de sources différentes sans re-namespacer les IDs.

**Suggestion** : au moment d'un merge/import, vérifier l'unicité globale et préfixer ou régénérer les IDs collisionnants. Utilitaire `Class_Sankey.assertUniqueIds()` à appeler en DEV.

## R7. Listeners D3 non nettoyés sur `unDraw`

Le lifecycle `_process_or_bypass → unDraw → _draw` recrée les `<g>` et les listeners à chaque redraw. Si un redraw est interrompu (exception dans `_draw` d'un subclass), on peut laisser des listeners orphelins sur des nœuds D3 retirés du DOM.

**Suggestion** : audit `.on('.namespace', null)` systématique dans `unDraw`, et wrap `_draw` dans try/catch qui loggue + marque l'élément comme `error_state` plutôt que de planter la DA complète.

## R8. `heredited_attr` — pas de validation de cycle

Rien n'empêche `view_A.updateFrom(view_B)` + `view_B.updateFrom(view_A)` sur le même attribut. Résultat : cascade infinie ou état indéterministe selon l'ordre de `_views_order`.

**Suggestion** : détecter les cycles à l'ajout d'une source dans `heredited_attr`, refuser avec message clair. Tests dédiés (voir #10).

## R9. Tests golden sur fichiers utilisateurs réels

Beaucoup de bugs historiques viennent de fichiers clients édités à la main. Pas de suite de régression sur ces fichiers.

**Suggestion** : dossier `tests/fixtures/user_files/` avec quelques `.xlsx` et `.json` anonymisés, test qui les charge + sauvegarde + recharge et vérifie l'équivalence sémantique. Ajouter chaque fois qu'un bug client est corrigé.

## R10. Couverture i18n partielle

Plusieurs `t('${path}.${action}')` renvoient la clé brute quand la traduction manque (surtout côté EN). Pas de CI qui vérifie la parité FR/EN des catalogues.

**Suggestion** : script `pnpm check-i18n` qui diff les clés FR vs EN et fail la CI si divergence. i18next expose les clés manquantes via `missingKeyHandler` — les collecter pendant les tests.

---

# Revue du 2026-07-03 — statuts, forces, faiblesses, plan d'action

Mise à jour de la revue du 2026-04-12. Période couverte : releases 1.1.4 → 1.1.9, ~620 commits client OpenSankey, ~50 commits de robustesse MFAProblem/SEP, refonte publish/viewer, tableur Univer, stocks réconciliables #156.

## Statut des pistes d'avril

| # | Sujet | Statut 2026-07 |
|---|-------|----------------|
| 1 | Symlinks `deps/` | **Partiel** — recréation scriptée et idempotente (`build_client.sh` l.108-136, `build_client.bat` `mklink /J`, `bootstrap-submodules.ps1/.sh`) mais pas de `postinstall` ; piège Git Bash → symlinks POSIX cassés toujours présent |
| 2 | `ApplicationDataOSP.tsx` | **Ouvert, aggravé** — 1392 lignes (+52 %) ; seul `isTrialActive` extrait (`utils/trial`) |
| 3 | `SankeyPlusViews.tsx` | **Ouvert** — 1505 lignes, 7 composants + 2 helpers |
| 4 | Helper `useForceRerender` | **Ouvert** — 0 occurrence ; 176 `MutableRefObject` dans le src OpenSankey |
| 5 | `withBypassRedraws` | **Ouvert, aggravé** — 81 poses manuelles du flag dans 21 fichiers, aucun try/finally |
| 6 | Versioning persistance | **Partiel** — `persistenceMigrations.ts` isolé, documenté et testé (première migration testée : #191) ; mais dispatch if-cascade conservé, pas de table, pas de golden round-trip |
| 7 | Deep-clone change tracking | **Partiel** — mécanisme conservé (`ApplicationDataOSP.tsx:1064`) mais skippé en mode static et pour les vues light |
| 8 | Migration `heredited_attr` | **Ouvert** — sniffing sans marqueur, gated `< 0.9` dans un site mais inconditionnel dans `addViewsFromJSON`, logique dupliquée en 2 endroits |
| 9 | Héritage 3 couches | **Ouvert** (structurel, assumé) |
| 10 | Tests unitaires client | **Partiel** — 12 fichiers jest OS (0 en avril : invariants géométriques + rétro-compat persistance) ; round-trip JSON et `updateFrom` couverts côté **Python** (SEP ~31 fichiers, MFA ~17) ; rien dans SA/OSP, jest absent de la CI |
| 11 | Duck typing `Data`/`StockData` | **Ouvert** — désormais documenté en docstring mais non contractuel ; interface dupliquée qui croît (#156 : `_is_level`, `_paired_variation`) |
| 12 | Monolithes MFAProblem | **Ouvert, aggravé** — `mfa_problem_solver.py` 1436 l. (+44 %), `mfa_problem_format_io.py` 1987 l. (+42 %) ; s'étend à SEP : `sankey_pandas.py` 6743 l., `sankey_base.py` 3155 l. |
| 13 | Feuilles Excel regex | **Partiel** — feuilles ignorées listées dans le log (`io_base.py:150`), fix accents, typos de nœuds détectées/corrigées (#114 `typo_strict`/`autocorrect_typo`) ; pas de mode strict au niveau feuille ni suggestion Levenshtein |
| 14 | Distribution Cython | **Résolu** — fallback pur-Python sans Cython dans les `setup.py`, wheels manylinux cp310+cp312 publiées sur tag |
| 15 | Hash sha256 | **Ouvert, aggravé** — HMAC-SHA256 à 1 itération (werkzeug 2.3.7, méthode supprimée en Werkzeug 3.0 → montée de version bloquée) ; politique de mot de passe relâchée à « non vide » (1f47d4d), validée côté client uniquement, aucun contrôle serveur |
| 16 | Idempotence webhooks Stripe | **Ouvert** — `stripe.py:167-225` dispatch direct sans stockage d'`event.id` |
| 17 | `livemode` webhooks | **Ouvert** — aucun contrôle après `construct_event` |
| R1 | Encodage `actionName` via `_` | **Ouvert** — `indexOf('_')` + `split('_')[0]` (`SankeyMenuContext.tsx:406,533`) |
| R2 | Parsing silencieux SEP | **Partiel** (cf. #13) |
| R3 | `bypass_redraws` sans garde | **Ouvert, aggravé** (cf. #5) |
| R4 | Validation de schéma `fromJSON` | **Ouvert** — getters défensifs mais accès bruts crashables subsistent (`SankeyPersistence.tsx:2151`, `UpdateFrom.tsx:53`) |
| R5 | Erreurs solveur typées | **Partiel** — plus de 500 brut : machine à états `RUNNING/FAILED/FINISHED` (`server/views.py:532-759`), statuts CVXPY/OSQP surfacés dans le log (#176, `ac0d193`, `49e31f5`) ; mais `optimisation()` retourne un bool, aucun code machine-lisible INFEASIBLE/SINGULAR/TIMEOUT |
| R6 | Unicité des IDs | **Ouvert** — atténué sur `addNewNode` (suffixe `_0` récursif) ; vues, clones de DA et fingerprints sans garantie |
| R7 | Listeners D3 | **Ouvert** — s'y ajoute `TooltipEventManager` (`TooltipsConfig.tsx:50-67`) : `mousemove` document permanent + timers jamais retirés (26 `addEventListener` vs 20 `remove` dans OS) |
| R8 | Cycles `heredited_attr` | **Ouvert** — pas de boucle infinie (passe unique dans `views_order`) mais résultat d'un cycle silencieusement ordre-dépendant |
| R9 | Tests golden fichiers réels | **Résolu** — submodule `SankeyData/` : 97 `.xlsx` (dont cas clients réels) + 210 fichiers de références (SEP/SCMFA/OpenSankey) + golden logs, exécutés en CI sur chaque branche (`TESTS_DIR`, `.gitlab-ci.yml:100`) |
| R10 | check-i18n | **Ouvert** — ~13 500 lignes de catalogues sur 3 couches, rattrapage manuel via `deep_merge_translations`, rien en CI |

**Bilan** : 2 points résolus (#14, R9), 8 partiels, 17 ouverts dont 5 aggravés. La robustesse *comportementale* a changé de niveau (force dominante ci-dessous) ; la dette *structurelle* a grossi avec le rythme de features.

## Forces

1. **Robustesse comportementale Python transformée** (~50 commits depuis avril) : les cas limites échouent bruyamment ou avertissent au lieu de produire des résultats faux — multi-campagnes n'avorte plus tout (#177), budget OSQP élargi avec exception réelle surfacée (#176), snap-to-zero relatif (#166), warning flux mesuré écrasé par sur-détermination (#189), échec explicite thread solveur, grille stock incohérente → échec propre.
2. **Filet de tests golden industrialisé et en CI** : `SankeyData` centralise 97 classeurs réels + références versionnées par outil, avec scripts de régénération (`regenerate_testdata_refs.sh`, `bump_testdata.sh`) — toute régression parser/solveur casse le pipeline de branche.
3. **Chaîne de release unifiée sur tag git** : versions strictement alignées npm = wheels (`PKG_VERSION=${CI_COMMIT_TAG#v}`), wheels manylinux multi-Python buildées en Docker + auditwheel, republication idempotente (skip npm, delete-avant-upload PyPI).
4. **Qualité vérifiée en CI sur chaque branche** : ESLint + tsc (`pnpm run dist`) + pytest des 3 packages Python avec les golden ; hygiène de runner shell traitée (réinstall forcée des editables, purge egg-link).
5. **Émergence d'une culture de test côté client** : 0 → 12 fichiers jest depuis le 17/06, ciblant les invariants géométriques (`applyLayoutAnchor`, `flowThickness`, `zOrder`…) et la rétro-compat de persistance.
6. **Patterns récents bien conçus** : `types/PublishOptions.tsx` (source unique typée des options viewer/publish avec dépréciation gérée), dirty-tracking par fingerprints (`Element.tsx:77`, `Sankey.tsx:160`), expansion batch sans redraw par nœud (`Hierarchies.tsx:642`), vues light sans duplication de géométrie, seuils d'affichage en px écran avec re-filtrage débouncé au zoom.
7. **Sécurité de base LoginComponent saine sur plusieurs plans** : signature webhook Stripe vérifiée, tokens de reset TTL courts à usage unique (15 min / PIN 10 min), comparaison de mot de passe en temps constant, path traversal maîtrisé côté publish (`_safe_under`), JSON inline échappé à la publication.
8. **Parcours d'erreur utilisateur SEP nettement amélioré** : feuilles ignorées listées, feuille Options (18 options), typos de nœuds strict/autocorrect, log throttlé et lisible.

## Faiblesses

### Sécurité backend (nouveau — critique)

- **S1. Endpoints sensibles sans authentification** : aucune route de `server/views.py` n'est `@login_required`. Anonymement accessibles : `/api/publish/deploy` (`views.py:433` → `scp`/`ssh` vers le serveur de portfolios OVH **prod**), `/api/publish/folder|current|browse|folders` (lecture/upload de l'arbre MFAData), `/optimize/launch_optim` (`views.py:830`, calcul lourd → DoS trivial), `/api/vision/build`. Seul `/api/vision/extract` contrôle `current_user.is_authenticated`.
- **S2. CORS + CSRF** : `CORS(app, support_credentials=True)` (`server/__init__.py:20`) sans liste d'origins — et le kwarg correct est `supports_credentials`, donc config probablement partiellement inopérante. Auth par cookie de session sans token CSRF ni SameSite explicite → tous les POST mutateurs exposés.
- **S3. Path traversal à l'upload** : `launch_optim` fait `os.path.join(tmp_dir, input_file.filename)` sans `secure_filename` (`views.py:847`) — un nom `../../…` écrit hors de `tmp_dir`.
- **S4. Secrets et DB** : `FLASK_SECRET_KEY` avec fallback aléatoire par worker (`app.py:27`) → sessions et tokens de reset incohérents entre workers si l'env manque ; SQLite en chemin relatif avec `server/db.sqlite` versionné dans le repo.
- **S5. Divulgation d'informations** : `str(e)` renvoyé au client (publish, vision, optimize, user), `/auth/forgot_pw` renvoie `user_exists` (énumération d'e-mails), logs stdout avec emails + identifiants Stripe en clair (`models.py:846-919`).
- **S6. Token GitLab en clair** : bloc commenté « Tag Release » de `.gitlab-ci.yml` (~l.700) contient un `glpat-…` en dur, présent dans l'historique git — à révoquer et purger.
- **S7. Points d'avril toujours ouverts** : hash sha256 1 itération + politique mdp « non vide » client-only (#15), webhooks Stripe sans idempotence (#16) ni contrôle `livemode` (#17).
- **S8. Bugs latents licensing** : `create_user_from_stripe` sans `db.session.add()` (`models.py:494`, user non persisté), `delete_user_from_stripe` avec `filter_by(func.lower(...)==...)` invalide (`models.py:533`).

### Dette structurelle en aggravation

- **God-files quasi doublés en 3 mois** : `DrawingArea.tsx` 2422→4328 l. (+79 %), `NodePositioning.tsx` 2072→4006 (+93 %), `DrawLabel.tsx` 1644→2866, `MenuElementsAppearance.tsx` 2379→3635, `SankeyPersistence.tsx` 1797→2559 ; côté Python `sankey_pandas.py` 6743 l. Chaque feature/fix grossit les mêmes fichiers, sans plan d'extraction.
- **Couche base polluée** : le tableur Univer (feature SA#163) vit dans OpenSankey base — 9 fichiers, 6185 lignes, dépendance Univer embarquée dans la lib open-source.
- **`bypass_redraws` propagé** : 81 poses manuelles (R3 non corrigé se réplique mécaniquement à chaque feature).
- **Hygiène** : 91 `console.log` dans les .tsx OS (28 dans `UniversalJSONCompression.tsx`, 29 dans `NodePositioning.tsx`), 54 casts `as unknown as` concentrés dans la persistance, `TooltipEventManager` singleton avec listeners globaux jamais retirés.
- **Duplication `Data`/`StockData`** : chaque attribut transversal ajouté à la main en miroir dans les deux classes ; setters `except Exception: pass` dans `ProtoData` (`data.py:79-98`) qui avalent les valeurs invalides sans warning.

### Process de release

- **Les tags publient sans exécuter aucun test** : le job `test` a `when: never` sur tag (`.gitlab-ci.yml:92-94`) alors que `publish:npm`/`publish:python` ne tournent que sur tag — un tag posé sur un commit au pipeline rouge publie quand même.
- **Wheels sans validation post-build** : ni `twine check` ni smoke test `pip install + import` avant upload au registry consommé par cartofob-sankey.
- **Jest hors CI** : les 12 tests OS ne tournent qu'en local, et le script npm `test` d'OS filtre `-t 'AFMBase'` ; le lint CI utilise `eslint --fix` (mutation du workspace au lieu d'une vérification).
- **`build:examples` toujours skippé** (TEMP 1.1.6) : editor/viewer d'exemples non rebuildés.

### Persistance

- **Piège `Number(version)`** : le dispatcher principal compare via `Number(version)` (`SankeyPersistence.tsx:2369-2389`) or `Number('1.1.9') = NaN` — fonctionne uniquement parce que tous les seuils actuels sont < 1 ; toute future migration à seuil ≥ 1.x copiant ce pattern ne se déclencherait jamais, silencieusement. S'y ajoutent 13 stubs morts `fromJSON_1_1_1` jamais invoqués.
- **Fichier N× la taille du diagramme** : chaque vue heavy est ré-inflatée et insérée en clair à la sauvegarde (`ApplicationDataOSP.tsx:344`), sans delta par rapport au maître.
- **`_toJSON` avec effets de bord** : en mode `save_only_visible_elements`, la sérialisation rebâtit `this._drawing_area` en boucle via `extractViewFromJSON` — la vue affichée après export dépend de la dernière itération.
- **Coût du switch de vue multi-sources** : une DrawingArea temporaire complète reconstruite par source d'héritage à chaque switch (`ApplicationDataOSP.tsx:1379-1387`).

## Plan d'action

Déclinaison opérationnelle semaine par semaine (juillet–août 2026) : [PLAN-ETE-2026.md](PLAN-ETE-2026.md).

### P0 — Sécurité (immédiat, avant toute autre chose)

1. **Authentifier les endpoints serveur** : `@login_required` sur `/api/publish/*` (deploy en premier), `/optimize/launch_optim`, `/api/vision/build` (S1).
2. **Révoquer et purger le token `glpat-…`** de `.gitlab-ci.yml` et de l'historique (S6).
3. **`secure_filename` sur `launch_optim`** (S3) — fix d'une ligne.
4. **`FLASK_SECRET_KEY` obligatoire** : fail au démarrage si absent (S4).
5. **CORS** : corriger le kwarg (`supports_credentials`) + liste d'origins explicite ; cookies `SameSite=Lax` minimum (S2).
6. **Mots de passe** : migrer vers `pbkdf2:sha256:600000` (natif werkzeug) avec rehash au login, + validation de force côté serveur (#15) — débloque aussi la montée Werkzeug 3.
7. **Stripe** : table `stripe_events_processed(event_id PK)` + contrôle `event.livemode` (#16, #17) ; corriger les 2 bugs latents `models.py` (S8).
8. **Fuites d'infos** : messages génériques au client, `forgot_pw` sans `user_exists`, purger les logs stdout emails/Stripe (S5).

### P1 — Fiabilité de la release (semaines)

9. **Faire dépendre `publish:*` des tests** : soit exécuter le job `test` sur tag, soit `needs: [test]` du pipeline de branche.
10. **`twine check` + smoke import** des wheels avant upload.
11. **Brancher jest en CI** (job dans `build` ou dédié) et retirer le filtre `-t 'AFMBase'` ; passer le lint CI en mode vérification (sans `--fix`).
12. **Corriger le piège `Number(version)`** : généraliser `isVersionBelow` dans le dispatcher principal et supprimer les 13 stubs `fromJSON_1_1_1` morts — avant la première migration ≥ 1.x, après ce sera trop tard.
13. **R5, le chaînon manquant** : classe `MFAProblemError` avec codes (`INFEASIBLE`, `SINGULAR`, `TIMEOUT`, `BAD_CONSTRAINT`) sérialisée en JSON → message i18n côté front (l'infrastructure statuts/logs existe déjà, il ne manque que le typage).

### P2 — Dette structurelle (fond, à planifier par lot)

14. **Stopper la croissance des god-files** : règle d'équipe « nouvelle feature = nouveau module », puis extraction progressive par domaine — `DrawingArea` (zoom/filtres/publish/copy-paste), `NodePositioning`, `ApplicationDataOSP` (#2), `SankeyPlusViews` (#3), `sankey_pandas.py` et `mfa_problem_format_io.py` (#12).
15. **`withBypassRedraws(da, fn)` avec try/finally** (#5/R3) puis migration mécanique des 81 sites.
16. **Sortir Univer de la couche base** vers SA (ou module optionnel lazy-loadé).
17. **Validation de schéma au `fromJSON`** (R4) + tests golden round-trip TS `toJSON → fromJSON` (#6, #10) — les fixtures SankeyData existent déjà, les réutiliser côté jest.
18. **`check-i18n` en CI** (R10) : diff des clés FR/EN, fail si divergence.
19. **Base commune `ReconciliableVariable`** pour `Data`/`StockData` (#11) + remplacer les `except Exception: pass` de `ProtoData` par un warning.
20. **Nettoyage** : `console.log` (lint rule `no-console`), casts `as unknown as` de la persistance, cycle de vie `TooltipEventManager` (R7).

---

# Chantiers stratégiques (audit élargi du 2026-07-03)

Quatre dimensions structurantes hors du périmètre de la revue de code d'avril, auditées séparément.

## A. Organisation en submodules → monorepo front

**Constat chiffré** : sur les 6 derniers mois, **28,6 % des commits de SA et 28 % de ceux d'OSP sont des cascades de pointeurs** (664 commits de bruit sur 3172). Une feature dans OS = 3 commits / 3 repos / 3 pipelines ; dans SEP = 4. Les versions sont déjà alignées sur un seul numéro depuis mai, `release.sh` orchestre déjà le tout, et le paquet npm publié compile déjà les 4 couches en un artefact via les symlinks `deps/` — **c'est un monorepo de fait, distribué sur des submodules**. Les pièges structurels (junctions Windows vs symlinks POSIX, double déclaration de deps OS/OSP, TS2307 sur clone frais, 6 `safe.directory` en CI, mélange SSH/HTTPS des `.gitmodules`) découlent tous de cette topologie. La contrainte open-source d'OpenSankey est une contrainte de **publication** (repo public autonome), pas de développement.

**Recommandation** : monorepo pnpm workspace front (`packages/{opensankey, opensankey-plus, login-component, sankeyapplication}` en `workspace:*`), OS mirroré vers le repo public par `git subtree split` outillé en CI ; Python inchangé (wheels + registry groupe). cartofob non impacté (même paquet npm). Effort ~5 semaines, précédé d'un `cascade.sh` + check CI de cohérence des pointeurs pour la transition. Risque principal : l'hygiène du premier split public (non-fuite de code privé). L'option « packages npm versionnés par couche » est écartée : à ~2 changements transversaux/jour, elle remplacerait la cascade par un cycle publish+bump pire.

## B. Conception de la persistance

**Constat** : le format n'a pas de schéma — la spécification est le code, **dupliqué en TS (SankeyPersistence 2559 l. + Legacy 2795 l.) et en Python (sankey_json.py 1906 l.), jamais confrontés en test croisé** alors que le chemin TS↔Python tourne à chaque réconciliation ; les 3 bugs de prod documentés viennent de là. SEP écrit `"version": "1.0"` **en dur** (`io_base.py:1458`) → un JSON issu d'un import Excel se voit appliquer les migrations < 1.1.4 comme un vieux fichier. Rétro-compat par convention « clé absente ⇒ défaut du code du jour » (~12 clés nouvelles/mois sans revue de format). Taille mesurée : vues heavy = 50 % du poids des fichiers multi-vues (snapshot intégral par vue, zéro dédup) ; sur les gros fichiers clients (CARTOFOB 7,3 Mo) ce sont les données multi-datatags qui dominent. `UniversalJSONCompression.tsx` n'est pas une amorce de refonte (utilitaire de transport, avec au passage un chargement pako depuis CDN et une branche brotli qui décompresse du gzip — à nettoyer).

**Recommandation** : consolidation incrémentale (pas de format v2 big-bang). Été : `format_version` distinct de la version d'app + fix du « 1.0 » Python + `FORMAT.md`, puis **corpus golden multi-époques + tests croisés TS↔Python en CI** (le meilleur ratio protection/effort), puis centralisation des migrations dans `persistenceMigrations.ts`. Automne : schéma zod racine → JSON Schema publié → validation Python, et dédup des vues en delta (~50 % de gain, additive et rétro-lisible).

## C. Architecture front (héritage, refs, D3)

**Constat** : l'héritage 3 couches est un faux problème — **seules 3 classes traversent les couches** (ApplicationData, MenuConfig, DrawingArea), la couche SA pèse ~110 lignes, et le mécanisme d'injection est déjà de la composition (props d'`App`, slots `Type_AdditionalMenus`, callbacks injectés, pub/sub `addMainZoneListener` naissant). Les vrais problèmes : (1) **les constructeurs des classes modèle appellent des hooks React** (~150 `useRef()` dans le constructeur de `Class_MenuConfig`, `useToast()` dans `createNewMenuConfiguration`) → classes centrales ininstanciables hors render, donc intestables ; (2) le bus d'événements artisanal de **218 `MutableRefObject`** sans contrat (refs no-op par défaut → notifications perdues silencieusement, hack compteur dupliqué 60×, `updateAllMenuComponents()` en tir au canon) ; (3) 325 call-sites `draw()`/`unDraw()` dans 40 fichiers — les widgets portent la responsabilité du redraw. La frontière React/D3 elle-même est saine (DrawingArea possède le DOM SVG).

**Recommandation** : ne pas casser l'héritage (rapport coût/bénéfice défavorable tant qu'OpenSankey n'est pas publié en paquet npm indépendant). Faire : sortir les hooks des constructeurs (remplacement mécanique `useRef(() => null)` → `{ current: () => null }`, toast injecté — 1 semaine, prérequis de toute testabilité), helper `useModelBinding` + résorption des 60 hacks compteur, généralisation du pub/sub par topic, extraction `ViewsManager`. Différer : fermeture des classes à l'héritage, refonte store observable, refonte frontière D3 (règle au fil de l'eau : les composants appellent des méthodes d'intention du modèle, pas `element.draw()`).

## D. Infra, donnée, documentation

**Constat** : le risque n°1 est **la perte de données** — backups de `db.sqlite` uniquement au moment des deploys CI, sur le même disque, aucune copie hors VPS, et le script de deploy manuel `update_opensankey.sh` ne fait ni backup ni `alembic upgrade` (divergence des deux canaux de deploy). Zéro healthcheck (un deploy qui 500 passe la CI en vert), zéro monitoring/alerting, logging serveur non configuré (`traceback.print_exc()` sur stdout), 404 redirigé silencieusement vers `/`. Reproductibilité faible : lockfiles client **gitignorés**, requirements partiellement pinnés, venv jamais recréé. `env.example` contient des clés Stripe test réelles. Préférences utilisateurs et MFAData sans quota/purge/sauvegarde. SQLite n'est **pas** le problème (volumétrie faible, alembic réellement utilisé — 9 migrations) : PostgreSQL différé sans état d'âme. Doc : `doc/views.py` en fait déjà adapté au double arbre fr/en ; legacy 2023 à purger ; duplication MD/RST toujours latente ; `doc/migrations/2026-05-vps-py3.12.md` est le seul vrai runbook.

**Recommandation** : quick wins d'abord (~4 j : backup quotidien hors-site via le scp OVH déjà en place, `/health` + `curl -f` en fin de deploy, alignement du script manuel sur la CI, uptime externe, Sentry, lockfiles commités, hygiène secrets). Ensuite : déploiement par artefacts avec bascule de slot + rollback en secondes (généralise `archive_version.sh` qui fait déjà 80 % du concept), observabilité structurée, cycle de vie des données utilisateurs, consolidation doc.
