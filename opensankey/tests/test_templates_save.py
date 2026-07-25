"""
/menus/templates_save — reenregistrement d'une etude de la sankeytheque (DEV).

La route ecrit DANS MFAData puis committe : trois choses doivent tenir, sinon la
fonctionnalite devient un moyen d'ecrire n'importe ou dans le depot.

  - la garde dev (mode debug ou compte `is_developer`) : ferme, la route repond
    404, comme la galerie e!Sankey locale ;
  - la liste blanche : SEULS les chemins declares par index.json sont ecrivables.
    La racine MFAData contient aussi Clients/ et des materiaux non publies, qu'une
    simple regle de prefixe ne protegerait pas ;
  - l'ecrasement seul : un chemin declare mais absent du disque n'est pas cree.

On verifie aussi la forme d'enregistrement : .json indente (diff git relisible),
.json.gz d'origine supprime, index bascule sur le .json, et le tout dans UN commit
qui ne contient que ces fichiers — la copie de travail de MFAData est en
permanence pleine de materiaux de travail qu'il ne faut pas embarquer.
"""

import gzip
import json
import os
import subprocess

import pytest

from opensankey.server import create_app


def git(repo, *args):
    return subprocess.run(
        ["git", "-C", str(repo)] + list(args),
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )


@pytest.fixture(autouse=True)
def skip_sans_git():
    if subprocess.run(["git", "--version"], capture_output=True).returncode != 0:
        pytest.skip("git indisponible")


@pytest.fixture
def mfadata(tmp_path, monkeypatch):
    """Une racine MFAData minimale, versionnee : une etude publiee (uniquement
    compressee, comme dans la vraie sankeytheque) et un leurre non indexe."""
    root = tmp_path / "mfadata"
    (root / "Etudes").mkdir(parents=True)
    (root / "Clients").mkdir(parents=True)

    with gzip.open(root / "Etudes" / "demo.json.gz", "wt", encoding="utf-8") as file_gz:
        json.dump({"nodes": {}, "links": {}}, file_gz)
    (root / "Clients" / "prive.json").write_text(
        json.dumps({"secret": "interdit"}), encoding="utf-8"
    )

    index = {
        "categories": ["etudes"],
        "templates": {
            "demo": {
                "file_path": "Etudes/demo.json.gz",
                "lang": "fr",
                "category": "etudes",
            },
            # Declare par l'index mais absent du disque : ecraser, oui ; creer, non.
            "fantome": {
                "file_path": "Etudes/fantome.json",
                "lang": "fr",
                "category": "etudes",
            },
        },
    }
    (root / "index.json").write_text(json.dumps(index, indent=2), encoding="utf-8")

    git(root, "init", "-q")
    git(root, "add", "-A")
    git(root, "-c", "user.name=T", "-c", "user.email=t@t", "commit", "-q", "-m", "init")

    monkeypatch.setenv("MFAData", str(root))
    monkeypatch.delenv("SANKEY_DATA", raising=False)
    return root


@pytest.fixture
def client_dev(mfadata):
    """Poste de developpeur : mode debug et AUCUNE gestion de comptes montee."""
    app = create_app()
    app.config["PROPAGATE_EXCEPTIONS"] = False
    app.debug = True
    return app.test_client()


@pytest.fixture
def client_ferme(mfadata):
    """Client ordinaire : ni debug, ni compte developpeur. DEBUG force a False —
    FLASK_DEBUG traine dans l'environnement de beaucoup de postes."""
    app = create_app()
    app.config["PROPAGATE_EXCEPTIONS"] = False
    app.config["DEBUG"] = False
    return app.test_client()


@pytest.fixture
def client_deploye(mfadata):
    """Serveur deploye : login-component monte, visiteur non developpeur. Le repli
    « mode debug » ne doit PAS ouvrir la route, meme si FLASK_DEBUG est pose."""
    app = create_app()
    app.config["PROPAGATE_EXCEPTIONS"] = False
    app.debug = True
    app.login_manager = object()
    return app.test_client()


DIAGRAM = {"nodes": {"n0": {"name": "Corrige"}}, "links": {}}


def save(client, file_path, diagram=None, message="test"):
    return client.post(
        "/menus/templates_save",
        json={"file_path": file_path, "json": diagram or DIAGRAM, "message": message},
    )


# create_app renvoie une redirection sur 404 (page_not_found) : un refus se lit
# donc « pas 200 », comme dans test_templates_asset_whitelist.
def test_route_fermee_hors_compte_developpeur(client_ferme, mfadata):
    response = save(client_ferme, "Etudes/demo.json.gz")

    assert response.status_code != 200
    assert not (mfadata / "Etudes" / "demo.json").exists()
    assert (mfadata / "Etudes" / "demo.json.gz").exists()


def test_route_fermee_sur_un_serveur_avec_comptes(client_deploye, mfadata):
    """Le mode debug ne doit jamais suffire des qu'il y a des comptes."""
    response = save(client_deploye, "Etudes/demo.json.gz")

    assert response.status_code != 200
    assert not (mfadata / "Etudes" / "demo.json").exists()


def test_enregistre_en_json_lisible_et_supprime_le_gz(client_dev, mfadata):
    response = save(client_dev, "Etudes/demo.json.gz")

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["ok"] and payload["committed"]
    ecrit = mfadata / "Etudes" / "demo.json"
    assert ecrit.exists()
    assert not (mfadata / "Etudes" / "demo.json.gz").exists()
    # Indente : un diff git ligne a ligne, c'est tout l'interet du .json en clair.
    contenu = ecrit.read_text(encoding="utf-8")
    assert "\n" in contenu.strip()
    assert json.loads(contenu) == DIAGRAM


def test_l_index_bascule_sur_le_json(client_dev, mfadata):
    """Les outils qui lisent l'index (vignettes, publication) ouvrent file_path
    tel quel : il doit decrire la realite du disque."""
    save(client_dev, "Etudes/demo.json.gz")

    index = json.loads((mfadata / "index.json").read_text(encoding="utf-8"))
    assert index["templates"]["demo"]["file_path"] == "Etudes/demo.json"


def test_le_commit_ne_contient_que_l_etude_et_l_index(client_dev, mfadata):
    """Un fichier de travail non committe traine dans la copie : il ne doit pas
    partir dans le commit de l'app."""
    (mfadata / "Etudes" / "brouillon.txt").write_text("en cours", encoding="utf-8")

    save(client_dev, "Etudes/demo.json.gz", message="mise a jour demo")

    fichiers = git(mfadata, "show", "--name-only", "--format=%s", "HEAD").stdout.split()
    assert "Etudes/demo.json" in fichiers
    assert "Etudes/demo.json.gz" in fichiers
    assert "index.json" in fichiers
    assert "Etudes/brouillon.txt" not in fichiers
    assert git(mfadata, "log", "-1", "--format=%s").stdout.strip() == "mise a jour demo"


def test_push_refuse_laisse_le_commit_et_le_dit(client_dev, mfadata):
    """Depot sans remote : le commit reste local et la reponse l'annonce, plutot
    que de faire croire a une publication."""
    payload = save(client_dev, "Etudes/demo.json.gz").get_json()

    assert payload["committed"] and not payload["pushed"]
    assert payload["detail"]


@pytest.mark.parametrize("demande", ["Etudes/demo.json", "Etudes/demo.json.gz"])
def test_relecture_par_la_galerie_apres_enregistrement(client_dev, mfadata, demande):
    """Round-trip. Le .json frais est servi aussi bien par le nouveau chemin que
    par l'ancien (.gz), que reclame toute galerie deja ouverte dans un navigateur
    — et sans ecrire de .gz de cache a cote, qui deviendrait perime au premier
    `git pull`."""
    save(client_dev, "Etudes/demo.json.gz")

    response = client_dev.get("/menus/templates_asset/" + demande + "?source=mfadata")

    assert response.status_code == 200
    assert json.loads(gzip.decompress(response.data).decode("utf-8")) == DIAGRAM
    assert not (mfadata / "Etudes" / "demo.json.gz").exists()


def test_reenregistrement_par_l_ancien_chemin(client_dev, mfadata):
    """Deuxieme enregistrement depuis une galerie chargee AVANT le premier :
    elle envoie encore le .gz, l'index dit deja .json — ca doit passer."""
    save(client_dev, "Etudes/demo.json.gz")

    payload = save(client_dev, "Etudes/demo.json.gz", diagram={"nodes": {}, "links": {"l": {}}})

    assert payload.status_code == 200 and payload.get_json()["committed"]
    ecrit = json.loads((mfadata / "Etudes" / "demo.json").read_text(encoding="utf-8"))
    assert ecrit["links"] == {"l": {}}


@pytest.mark.parametrize(
    "file_path",
    [
        "Clients/prive.json",          # existe, mais pas dans l'index
        "index.json",                  # l'index lui-meme n'est pas un modele
        "Etudes/../Clients/prive.json",  # remontee normalisee avant le filtre
        "../evasion.json",
    ],
)
def test_refuse_tout_chemin_non_declare(client_dev, mfadata, file_path):
    response = save(client_dev, file_path)

    assert response.status_code != 200
    assert json.loads(
        (mfadata / "Clients" / "prive.json").read_text(encoding="utf-8")
    ) == {"secret": "interdit"}


def test_refuse_de_creer_un_modele_absent_du_disque(client_dev, mfadata):
    response = save(client_dev, "Etudes/fantome.json")

    assert response.status_code != 200
    assert not (mfadata / "Etudes" / "fantome.json").exists()


def test_refuse_une_charge_utile_sans_diagramme(client_dev, mfadata):
    response = client_dev.post(
        "/menus/templates_save", json={"file_path": "Etudes/demo.json.gz", "json": "pas un objet"}
    )

    assert response.status_code == 400
    assert os.path.exists(mfadata / "Etudes" / "demo.json.gz")
