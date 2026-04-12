# Architecture SankeyApplication

Ce document décrit l'architecture globale de la stack SankeyApplication et référence des pistes d'amélioration identifiées lors de la revue de code du 2026-04-12.

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

Version actuelle : `0.93`. Côté OSP, les vues sont compressées gzip dans le JSON racine (`views[id] = {...data, name, heredited_attr}` + `current_view`).

## Licensing / trial

Types de licence DB : `terriflux` (free), `OpenSankey+`, `sankeysuite` (AFM). Flags côté app : `has_sankey_plus`, `has_sankey_afm`, `has_sankey_dev`. Le trial OSP est client-side (localStorage, 30 jours, UUID anonyme), endpoints `/api/trial/started` et `/api/trial/converted`.

## Submodules Python

### SankeyExcelParser (v1.1.2)

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

### MFAProblem (v1.1.2)

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

Identifiées lors de la revue de code, non priorisées.

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
