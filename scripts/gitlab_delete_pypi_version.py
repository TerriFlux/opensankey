#!/usr/bin/env python3
"""Supprime de la GitLab PyPI Package Registry du projet toutes les versions
d'un package donné égales à la version passée en argument.

Utilisé par le job CI publish:python avant le `twine upload` : la registry PyPI
de GitLab refuse d'écraser un fichier déjà publié (HTTP 400). Lors d'une
republication (re-tag d'une version existante sur un nouveau commit), il faut
donc supprimer les packages de cette version avant de réuploader les wheels.

Usage:
    python3 scripts/gitlab_delete_pypi_version.py <version>

Variables d'environnement (fournies par GitLab CI) :
    CI_API_V4_URL, CI_PROJECT_ID  : cible de l'API.
    GITLAB_PACKAGES_TOKEN         : PAT/Project token (scope api) — utilisé en
                                    priorité (PRIVATE-TOKEN). À définir comme
                                    variable CI si le CI_JOB_TOKEN n'a pas le
                                    droit de suppression de packages.
    CI_JOB_TOKEN                  : fallback (JOB-TOKEN) sinon.

Noms de packages ciblés : mfaproblem, sankeyexcelparser (comparaison
insensible à la casse et aux séparateurs - / _ / .).
"""
import json
import os
import sys
import urllib.error
import urllib.request

TARGETS = {"mfaproblem", "sankeyexcelparser"}


def _norm(name):
    return name.lower().replace("-", "_").replace(".", "_")


def main():
    if len(sys.argv) != 2:
        sys.exit("usage: gitlab_delete_pypi_version.py <version>")
    version = sys.argv[1]
    api = os.environ["CI_API_V4_URL"].rstrip("/")
    pid = os.environ["CI_PROJECT_ID"]
    pat = os.environ.get("GITLAB_PACKAGES_TOKEN")
    if pat:
        headers = {"PRIVATE-TOKEN": pat}
    else:
        headers = {"JOB-TOKEN": os.environ["CI_JOB_TOKEN"]}

    def call(url, method="GET"):
        req = urllib.request.Request(url, headers=headers, method=method)
        return urllib.request.urlopen(req)

    deleted = 0
    page = 1
    while True:
        url = (
            f"{api}/projects/{pid}/packages"
            f"?package_type=pypi&per_page=100&page={page}"
        )
        try:
            resp = call(url)
        except urllib.error.HTTPError as exc:
            sys.exit(f"  list page {page}: HTTP {exc.code} {exc.read().decode()}")
        pkgs = json.load(resp)
        if not pkgs:
            break
        for pkg in pkgs:
            if _norm(pkg.get("name", "")) in TARGETS and pkg.get("version") == version:
                durl = f"{api}/projects/{pid}/packages/{pkg['id']}"
                try:
                    dresp = call(durl, method="DELETE")
                except urllib.error.HTTPError as exc:
                    sys.exit(
                        f"  delete {pkg['name']} id={pkg['id']}: "
                        f"HTTP {exc.code} {exc.read().decode()}"
                    )
                print(
                    f"  deleted {pkg['name']} {pkg['version']} "
                    f"(id={pkg['id']}) -> {dresp.status}",
                    flush=True,
                )
                deleted += 1
        page += 1

    print(f"  {deleted} package(s) supprime(s) pour la version {version}", flush=True)


if __name__ == "__main__":
    main()
