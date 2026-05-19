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

## Consommateur principal
`cartofob-sankey` (https://github.com/IGNF/cartofob-sankey) utilise :
- le paquet npm `@terriflux/sankeyapplication` dans `viewer/`
- les wheels Python MFAProblem + SankeyExcelParser dans `packages/` (à migrer vers le registry)
