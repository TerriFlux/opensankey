# Plan maître 2026 — assainissement SankeyApplication

Liste complète et ordonnancée de tout ce qu'il y a à faire, issue de la revue du 2026-07-03 ([ARCHITECTURE.md](ARCHITECTURE.md) : revue de code + chantiers stratégiques). Hypothèses : quasi plein temps, feature freeze sauf urgence client.

**Logique d'ordonnancement** :
1. Sécurité et perte de données d'abord (exposition réelle, effort faible).
2. CI/release fiables ensuite (protège tout le reste).
3. Testabilité puis filet de tests (prérequis de tout refactor).
4. **Monorepo en août** — il supprime cascades et symlinks, ce qui rend tous les refactors suivants moins chers (1 commit au lieu de 3).
5. Refactors (TS puis Python) à la rentrée, sur base monorepo + filet de tests.
6. Consolidations de fond (persistance v-next, infra, doc) à l'automne.

---

## ÉTÉ — Juillet : le tronc commun

### S1 (6–10 juil.) — Urgences : sécurité + perte de données

| # | Tâche | Effort |
|---|-------|--------|
| 1 | **Révoquer le token `glpat-…`** de `.gitlab-ci.yml` (~l.700), supprimer le bloc, décider purge d'historique | ½ j |
| 2 | **Backup quotidien hors-site** : cron `sqlite3 .backup` + tar `USER_PREF_REP` + `cache/` + MFAData, poussé vers le mutualisé OVH (clé scp de publish.py déjà en place) | ½ j |
| 3 | **`/health`** (version + `SELECT 1`) + `curl -f` en fin de job CI et de `restart_site.sh` (deploy échoue si KO) | ½ j |
| 4 | ~~**Aligner `update_opensankey.sh` sur la CI**~~ — sans objet : le script est **supprimé** (2026-07-17). Depuis #255 (déploiement par slots) il rebuildait le checkout, que uWSGI ne sert plus, tout en affichant un succès : un déploiement qui ne déployait rien. La CI et `release.sh` passent par `deploy_release.sh`, qui fait déjà backup + `alembic upgrade head`. | fait |
| 5 | **Uptime monitoring externe** (3 hosts + alerte mail) | 1 h |
| 6 | **Auth des endpoints** : inventaire des routes qui doivent rester publiques (viewer publié, cartofob), puis `@login_required` sur `/api/publish/*` (deploy en premier), `/optimize/launch_optim`, `/api/vision/build` | 1,5 j |
| 7 | **`secure_filename`** sur `launch_optim` (`views.py:847`) | ¼ j |
| 8 | **`FLASK_SECRET_KEY` obligatoire** (fail au boot) ; vérifier les `.ini` des 3 envs | ½ j |
| 9 | **CORS** : kwarg `supports_credentials` correct + origins explicites par env + cookies `SameSite=Lax` | 1 j |

Test de fin de semaine : parcours non connecté (viewer publié OK, publish/optimize en 401), connecté (OK), viewer cartofob embarqué OK. Deploy dev.

### S2 (13–17 juil.) — Sécurité, fond

| # | Tâche | Effort |
|---|-------|--------|
| 10 | **Mots de passe** : `pbkdf2:sha256:600000` + rehash transparent au login + validation de force côté serveur (signup/reset/modify). Débloque Werkzeug 3 (montée différée) | 1,5 j |
| 11 | **Stripe** : table `stripe_events_processed` (migration alembic) + contrôle `event.livemode` + fix `create_user_from_stripe` (`db.session.add`) et `delete_user_from_stripe` (`filter_by` invalide) | 1,5 j |
| 12 | **Fuites d'infos** : plus de `str(e)` au client, `forgot_pw` réponse uniforme, purge des prints emails/Stripe de `models.py` | 1 j |
| 13 | **Hygiène secrets** : placeholders dans `env.example` (clés Stripe test réelles committées !), rotation du `whsec_`, host/user OVH de `publish.py` en env only | ½ j |

**Jalon** : release patch sécurité (décision de bump explicite) + deploy dev → test → prod. Backup db.sqlite avant (rehash irréversible). Tester le flow Stripe complet en mode test.

### S3 (20–24 juil.) — Release & CI fiables

| # | Tâche | Effort |
|---|-------|--------|
| 14 | **Tests exécutés sur tag** (retirer le `when: never`) ou `needs` des `publish:*` — aujourd'hui un tag publie sans aucun test | ½ j |
| 15 | **`twine check` + smoke import** des wheels avant upload | ½ j |
| 16 | **Jest en CI** + retirer le filtre `-t 'AFMBase'` + lint en vérification (sans `--fix`) | 1 j |
| 17 | **Piège `Number(version)`** : `isVersionBelow` généralisé dans le dispatcher de `SankeyPersistence.tsx` + suppression des 13 stubs morts `fromJSON_1_1_1`. À faire avant toute migration ≥ 1.x | 1 j |
| 18 | **Reproductibilité des builds** : committer `client/pnpm-lock.yaml` (retirer du .gitignore, `--frozen-lockfile`) + `requirements_frozen.txt` consommé au deploy | 1 j |
| 19 | **Sentry** (`sentry-sdk[flask]` dans `create_app`) | ½ j |
| 20 | **`cascade.sh` transitoire** + job CI de cohérence des pointeurs (sécurise la période d'ici le monorepo) | 1 j |

### S4 (27–31 juil.) — Débloquer la testabilité + contrat de format

| # | Tâche | Effort |
|---|-------|--------|
| 21 | **Sortir les hooks React des constructeurs** : `useRef(() => null)` → `{ current: () => null }` (interface identique, remplacement mécanique des ~150 du constructeur de `Class_MenuConfig`), injecter le toast au lieu de `useToast()` dans `createNewMenuConfiguration`. Rend les classes centrales instanciables en jest — prérequis de tout le filet de tests | 3 j |
| 22 | **Sémantique de version du format** : `format_version` distinct de la version d'app + fix du `"version": "1.0"` en dur de SEP (`io_base.py:1458`) + embryon de `FORMAT.md` (registre des clés) | 2 j |

### S5 (3–7 août) — Filet de tests (feu vert des refactors)

| # | Tâche | Effort |
|---|-------|--------|
| 23 | **Corpus golden multi-époques** dans SankeyData : fichiers réels 0.8 / 0.92 / 1.0 / 1.1.x, avec vues, multi-datatags (les templates existants en fournissent la moitié) | 1 j |
| 24 | **Round-trip TS en jest** : charger → sauver → recharger + invariants, sur le corpus | 1 j |
| 25 | **Tests croisés TS↔Python en CI** : TS-écrit → Python-lu et Python-écrit → TS-migré. Le meilleur ratio protection/effort de tout le plan : aurait attrapé les 3 bugs de prod connus | 1,5 j |
| 26 | **Tests `updateFrom` + `heredited_attr`** (cascade multi-source, migration legacy) | 1 j |
| 27 | **Validation racine au `fromJSON`** (pare-chocs léger : champs obligatoires + types, message listant les champs) | ½ j |
| 28 | **`check-i18n`** : diff clés FR/EN + job CI | ½ j |

**Critère de sortie** : tout tourne en CI et passe. C'est le feu vert du monorepo puis des refactors.

## ÉTÉ — Août : le monorepo front

Élimine les 28 % de commits de cascade, les symlinks `deps/` et leurs pièges (junctions Windows, TS2307, copie figée, double déclaration de deps). Python inchangé (wheels + registry). cartofob non impacté.

### S6–S7 (10–21 août) — Migration

| # | Tâche |
|---|-------|
| 29 | Création du monorepo : `pnpm-workspace.yaml`, `packages/{opensankey, opensankey-plus, login-component, sankeyapplication}`, migration d'historique (`git filter-repo`), dépendances `workspace:*`, suppression des symlinks et de la double déclaration de deps |
| 30 | Unification lint/tsc/jest en une passe ; suppression de la partie « liens » de `build_client.sh`/`.bat` |

### S8 (24–28 août) — CI + miroir public

| # | Tâche |
|---|-------|
| 31 | Recâblage CI : build, `publish:npm`, `pages`, jobs de deploy VPS (fin du `submodule foreach` front) |
| 32 | **Miroir public OpenSankey** : `subtree split` outillé en CI, **audit de non-fuite du premier split** (revue humaine), redirection du repo `su-model/opensankey`, gel/archivage des repos front historiques |

### S9 (31 août–4 sept.) — Rodage

| # | Tâche |
|---|-------|
| 33 | Une release complète de bout en bout (tag → npm → python → pages → deploy dev/test), mise à jour de `release.sh`, doc du nouveau workflow, mise à jour des mémoires/CLAUDE.md |

Si le monorepo déborde, il déborde sur début septembre — les refactors de la rentrée attendent, pas l'inverse.

---

## RENTRÉE — Septembre-octobre : refactors TS (sur base monorepo)

Ordre interne : mécanique d'abord, puis les découpages, puis le canal modèle→UI.

| # | Tâche | Effort |
|---|-------|--------|
| 34 | `withBypassRedraws(da, fn)` try/finally + migration des 81 sites | 2 j |
| 35 | Sortir Univer (9 fichiers, 6185 l.) de la couche base vers le package SA ou module lazy | 2-3 j |
| 36 | Découpage `DrawingArea.tsx` (4328 l.) par domaine : zoom/scrollbars, filtres px, publish/static, copy-paste, scale-adapted — un domaine = un commit, tsc/jest/smoke entre chaque | 3 j |
| 37 | Découpage `NodePositioning.tsx` (4006 l.) : les 2 algos + modes paramétrique/proportionnel | 2 j |
| 38 | Extraction `ViewsManager` hors d'`ApplicationDataOSP` (~25 méthodes de vues) + correction des effets de bord de `_toJSON` (extractViewFromJSON en boucle) | 2 j |
| 39 | Split `SankeyPlusViews.tsx` (7 composants → 1 fichier chacun) | 1 j |
| 40 | `SankeyPersistence.tsx` : centraliser toutes les migrations dans `persistenceMigrations.ts` (table séquentielle JSON→JSON pure), réduire les 54 `as unknown as` | 2 j |
| 41 | Helper `useModelBinding` (abonnement + cleanup unmount) + résorption des 60 hacks compteur / inventaire des 218 refs | 1,5 j |
| 42 | Généraliser le pub/sub `addMainZoneListener` par topic + règle d'équipe : plus jamais de ref nue ; migration opportuniste | 1,5 j |
| 43 | `MFAProblemError` avec codes (`INFEASIBLE`, `SINGULAR`, `TIMEOUT`, `BAD_CONSTRAINT`, `INCONSISTENT_STOCK_GRID`) → status JSON → messages i18n front | 2 j |

**Règle permanente dès maintenant** : nouvelle feature = nouveau module ; plus d'ajout net dans un fichier > 1500 lignes.

## AUTOMNE — Octobre-novembre : Python, persistance v-next, infra

| # | Tâche | Effort |
|---|-------|--------|
| 44 | MFAProblem : extraire `constraints_builder.py` + `results_writer.py` de `format_io` (1987 l.) et `solver` (1436 l.). Filet : refs golden SCMFA (diff nul attendu) | 3 j |
| 45 | SEP : base `ReconciliableVariable` pour `Data`/`StockData` + remplacer les `except Exception: pass` de `ProtoData` par des warnings | 2 j |
| 46 | Découpage `sankey_pandas.py` (6743 l.) : parsing feuilles / réconciliation / export | 3 j |
| 47 | Schéma zod racine + réglages DA → JSON Schema publié (= doc du format) → validation Python en warning puis bloquante | 2 sem. |
| 48 | Dédup des vues en delta vs maître (format additif rétro-lisible) — ~50 % de gain mesuré sur les fichiers multi-vues | 1-2 sem. |
| 49 | Déploiement par artefacts + bascule de slot + rollback en secondes (généralise `archive_version.sh`) ; supprime la fragilité du double canal umask/EACCES | 3-5 j |
| 50 | Observabilité structurée : config logging centrale, request-id, fin du 404→redirect silencieux, mini-dashboard métriques + trials (ou suppression de la table `metrics` write-only) | 2-3 j |
| 51 | Cycle de vie des données utilisateurs : quotas/purge MFAData + preferences, sortie de l'arbre applicatif, inclusion explicite au backup | 2-3 j |
| 52 | Consolidation doc : purge legacy 2023 (`doc/sources/{conf.py,index,pages}`), résorber duplication MD/RST, sort de la doc Sphinx OpenSankey (blueprint commenté) | 2-4 j |
| 53 | Nettoyages : lint `no-console` + purge des 91 `console.log`, cycle de vie `TooltipEventManager`, `UniversalJSONCompression` (CDN pako, branche brotli qui décompresse du gzip, code mort) | 2 j |

## Différés explicitement (décision à réévaluer, pas d'oubli)

- **PostgreSQL** — non nécessaire : volumétrie faible, alembic en place le jour venu. Réévaluer si multi-instance.
- **Montée Werkzeug 3 / Flask** — débloquée par l'item 10, à faire dans une fenêtre calme.
- **Packages npm versionnés par couche / fermeture des classes à l'héritage** — seulement si publier OpenSankey en paquet npm indépendant devient un objectif business.
- **Refonte state management (store observable)** — réévaluable dans un an ; les items 21/41/42 en sont les préalables.
- **Refonte frontière D3** — règle au fil de l'eau seulement (méthodes d'intention plutôt que `element.draw()` direct).
- **Format v2 big-bang** — écarté ; la consolidation incrémentale (22, 25, 47, 48) couvre les besoins.
- **R1 `actionName` → `{action, arg}`**, **R8 détection de cycles `heredited_attr`**, **mode strict feuilles Excel + Levenshtein**, **`build:examples` (skip 1.1.6)** — backlog rentrée, au fil de l'eau.

## Risques

1. **Monorepo : fuite de code privé dans le split public** → frontière de dossiers stricte dans `packages/opensankey` + revue humaine du premier miroir avant push.
2. **Auth des endpoints peut casser des consommateurs** (viewer publié, cartofob) → inventaire des routes publiques avant (item 6), test du viewer embarqué avant deploy.
3. **Rehash des mots de passe irréversible** → backup db.sqlite avant deploy, double-schéma accepté au login pendant la transition.
4. **Refactor DrawingArea = zone la plus chaude** → après monorepo (1 commit/extraction) et après filet de tests (S5) ; commits atomiques, arrêt possible entre deux extractions.
5. **Interruptions client** → items ≤ 3 j indépendants dans les phases refactor ; le seul bloc insécable est le monorepo (S6-S9) — le protéger dans l'agenda.
