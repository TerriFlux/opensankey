# sankeyapplication — contexte pour Claude Code

## Ce que c'est
Application web SaaS (Flask + React) de visualisation de flux Sankey, développée par TerriFlux.
Repo GitLab : https://gitlab.com/su-model/sankeyapplication

## Structure clé
- `client/` — lib React `@terriflux/sankeyapplication` (publiée sur GitLab Package Registry)
- `submodules/MFAProblem/` — solveur MFA compilé (Cython + pybind11 + Eigen)
- `submodules/OpenSankey+/submodules/OpenSankey/submodules/SankeyExcelParser/` — parser Excel (Cython)
- `scripts/` — scripts de build/deploy (`build_client.sh`, `build_server.sh`, `deploy_SankeyApp.sh`)
- `server/` — backend Flask

## CI/CD (`.gitlab-ci.yml`)
Runner shell tagué `[py312]` avec Docker disponible.
- `build` : compile la lib React + le serveur Python
- `test` : pytest sur MFAProblem, OpenSankey, SankeyExcelParser
- `publish:npm` : publie `@terriflux/sankeyapplication` sur GitLab Package Registry (sur tag git)
- `publish:python` : publie les wheels Python MFAProblem + SankeyExcelParser (sur tag git) — **récemment ajouté, à vérifier**
- `pages` : déploie GitLab Pages avec toutes les versions
- `dev/test/prod_opensankey` : déploiement applicatif (manuel)

## Packages Python
MFAProblem et SankeyExcelParser sont compilés en wheels manylinux via Docker (`quay.io/pypa/manylinux2014_x86_64`).
- MFAProblem : `submodules/MFAProblem/build_wheel_linux.sh` (existant)
- SankeyExcelParser : `submodules/OpenSankey+/.../SankeyExcelParser/build_wheel_linux.sh` (récemment créé)
Publiés sur le PyPI Registry du projet, accessibles au niveau groupe :
`https://gitlab.com/api/v4/groups/su-model/-/packages/pypi/simple/`

## Versioning
Semver, tag git = version npm = version des wheels Python.
Le tag déclenche `publish:npm` et `publish:python` simultanément.

**Ne JAMAIS changer de version sans demande explicite.** Bumper = modifier les 4 `package.json` (OS/OSP/LC/SA), `ApplicationData.version`, les CHANGELOG datés, figer `examples/<X.Y.Z>/`. Ne le faire que si l'utilisateur le demande clairement avec un mot dédié (« bump », « release », « monte la version », « release.sh »).
« Commit + push + cascade » ne signifie PAS bumper : « cascade » = propager les commits de pointeurs de submodules vers le haut (OS → OS+ → SA, et MFAProblem/SEP si concernés) puis pousser, en gardant la version inchangée. En cas de doute, demander avant de toucher à la version.

## Consommateur principal
`cartofob-sankey` (https://github.com/IGNF/cartofob-sankey) utilise :
- le paquet npm `@terriflux/sankeyapplication` dans `viewer/`
- les wheels Python MFAProblem + SankeyExcelParser dans `packages/` (à migrer vers le registry)
