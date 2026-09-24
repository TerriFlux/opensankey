"""
Régression — /menus/templates_asset ne doit servir QUE le contenu publié.

La route filtre par liste blanche : préfixe `templates/` pour les modèles
(source 'sankeydata'), chemins exactement déclarés par l'index pour la
sankeythèque ('mfadata').

Bug : le filtre portait sur la chaîne brute de l'URL, alors que le chemin
réellement ouvert est normalisé ensuite (par safe_join / send_from_directory).
`templates/../ailleurs/x.json` commence bien par `templates/` → passe le filtre,
puis se normalise en `ailleurs/x.json` : hors de templates/, mais toujours sous
la racine, donc aucune remontée à neutraliser du point de vue de safe_join. Tout
fichier de la racine devenait servable. Le correctif normalise AVANT de filtrer.

On vérifie aussi le service nominal : l'index déclare `x.json` alors que seul
`x.json.gz` existe sur disque (compression à la volée mise en cache), et la
route doit servir le .gz BRUT — sans Content-Encoding, le client dégzippe
lui-même (cf. les portfolios, où l'en-tête provoquait une double décompression).
"""

import gzip
import json

import pytest

from opensankey.server import create_app


@pytest.fixture
def sankey_data(tmp_path, monkeypatch):
    """Une racine SANKEY_DATA minimale : un modèle publié, et un leurre hors de
    templates/ qui ne doit jamais sortir."""
    templates = tmp_path / "templates"
    (templates / "data").mkdir(parents=True)
    (templates / "image").mkdir(parents=True)

    # Le modèle n'existe QUE compressé, comme dans la vraie galerie.
    diagram = {"nodes": {}, "links": {}}
    with gzip.open(templates / "data" / "demo.json.gz", "wt", encoding="utf-8") as f:
        json.dump(diagram, f)
    (templates / "image" / "demo.png").write_bytes(b"\x89PNG\r\n\x1a\n" + b"0" * 16)

    index = {
        "categories": ["demo"],
        "templates": {
            "demo": {
                "file_path": "templates/data/demo.json",  # .json déclaré, .gz sur disque
                "img_path": "templates/image/demo.png",
                "lang": "fr",
                "category": "demo",
            }
        },
    }
    (templates / "index.json").write_text(json.dumps(index), encoding="utf-8")

    bait = tmp_path / "prive"
    bait.mkdir()
    (bait / "secret.json").write_text(json.dumps({"secret": "interdit"}), encoding="utf-8")
    (bait / "secret.png").write_bytes(b"\x89PNG\r\n\x1a\n" + b"0" * 16)

    monkeypatch.setenv("SANKEY_DATA", str(tmp_path))
    monkeypatch.delenv("MFAData", raising=False)
    return tmp_path


@pytest.fixture
def client(sankey_data):
    app = create_app()
    app.config["PROPAGATE_EXCEPTIONS"] = False
    return app.test_client()


def test_sert_le_modele_json_declare_alors_que_seul_le_gz_existe(client):
    """Tolérance .json -> .json.gz : c'est ce qui permet le GET direct."""
    response = client.get("/menus/templates_asset/templates/data/demo.json")

    assert response.status_code == 200
    assert json.loads(gzip.decompress(response.data).decode("utf-8"))["nodes"] == {}


def test_le_gz_est_servi_brut_et_cacheable(client):
    """Pas de Content-Encoding (le client dégzippe), mais un ETag pour les 304."""
    response = client.get("/menus/templates_asset/templates/data/demo.json")

    assert response.headers.get("Content-Encoding") is None
    assert response.headers.get("ETag")

    not_modified = client.get(
        "/menus/templates_asset/templates/data/demo.json",
        headers={"If-None-Match": response.headers["ETag"]},
    )
    assert not_modified.status_code == 304


def test_sert_la_vignette(client):
    response = client.get("/menus/templates_asset/templates/image/demo.png")

    assert response.status_code == 200


@pytest.mark.parametrize(
    "asset",
    [
        # Le cœur de la régression : sort de templates/ tout en restant sous la
        # racine, donc invisible pour safe_join — seul le filtre peut l'arrêter.
        "templates/../prive/secret.json",
        "templates/../prive/secret.png",
        "templates/./../prive/secret.json",
        # Remontées hors racine (déjà couvertes par safe_join, gardées en filet).
        "templates/../../secret.json",
        "../secret.json",
        # Sans le préfixe publié.
        "prive/secret.json",
    ],
)
def test_refuse_tout_ce_qui_n_est_pas_publie(client, asset, sankey_data):
    response = client.get("/menus/templates_asset/" + asset)

    assert response.status_code != 200, f"{asset} ne doit pas etre servi"
    assert b"interdit" not in response.data


def test_la_source_mfadata_ne_sert_plus_le_disque(client, sankey_data,
                                                  tmp_path, monkeypatch):
    """Retrait sa#457 (31/08/2026) : la sankeytheque n'a plus de racine de
    disque. Meme avec l'env posee et un index present, un chemin de fichier
    MFAData repond 404 — seuls les chemins virtuels du resolveur externe
    (@library/..., pose par la couche SaaS) se servent sous cette source."""
    root = tmp_path / "mfadata"
    (root / "Etudes").mkdir(parents=True)
    (root / "Etudes" / "etude.json").write_text(
        json.dumps({"secret": "interdit"}), encoding="utf-8")
    (root / "index.json").write_text(json.dumps({
        "categories": ["etudes"],
        "templates": {"etude": {"file_path": "Etudes/etude.json",
                                "lang": "fr", "category": "etudes"}},
    }), encoding="utf-8")
    monkeypatch.setenv("MFAData", str(root))

    response = client.get("/menus/templates_asset/Etudes/etude.json?source=mfadata")

    assert response.status_code != 200
    assert b"interdit" not in response.data
    # Et l'index du disque n'alimente plus la galerie de la theque.
    gallery = client.post("/menus/templates", json={"source": "mfadata"})
    assert gallery.status_code == 200
    assert gallery.get_json()["templates"] == {}


# --- /menus/templates_xlsx : le classeur Excel d'un modele -------------------
#
# Un visiteur qui vient avec SES donnees n'a aucun moyen de deviner le format
# d'onglets du parser : c'est la qu'on le perd (11 IP sur 28 arretees par
# « aucun onglet au format » sur 30 jours, mesure du 24/09/2026). La galerie lui
# donne donc le classeur de n'importe quel modele — pose a cote quand il existe,
# converti a la volee sinon, comme « Enregistrer sous > Excel » le fait deja sur
# un diagramme ouvert.

XLSX_MAGIC = b"PK\x03\x04"


def test_convertit_le_modele_en_classeur_quand_aucun_nest_pose_a_cote(client):
    response = client.get("/menus/templates_xlsx/templates/data/demo.json")

    assert response.status_code == 200
    assert response.data.startswith(XLSX_MAGIC)
    assert "demo.xlsx" in response.headers.get("Content-Disposition", "")


def test_un_classeur_pose_a_cote_prime_sur_la_conversion(client, sankey_data):
    """Il porte la mise en forme et les commentaires de son auteur : une
    reecriture les perdrait."""
    (sankey_data / "templates" / "data" / "demo.xlsx").write_bytes(
        XLSX_MAGIC + b"classeur-de-l-auteur")

    response = client.get("/menus/templates_xlsx/templates/data/demo.json")

    assert response.status_code == 200
    assert b"classeur-de-l-auteur" in response.data


@pytest.mark.parametrize(
    "asset",
    [
        "templates/../prive/secret.json",   # sort de templates/ en restant sous la racine
        "prive/secret.json",                # sans le prefixe publie
        "templates/data/inconnu.json",      # sous templates/, mais non declare par l'index
        "templates/image/demo.png",         # declare, mais ce n'est pas un modele
    ],
)
def test_ne_convertit_que_les_modeles_declares(client, asset):
    response = client.get("/menus/templates_xlsx/" + asset)

    assert response.status_code != 200, f"{asset} ne doit pas etre converti"


def test_la_theque_et_le_corpus_esankey_nont_pas_de_classeur(client):
    """Pas de disque pour l'une, format proprietaire pour l'autre : ni l'une ni
    l'autre n'est un Sankey que l'on sait reecrire."""
    for source in ("mfadata", "esankey-local"):
        response = client.get(
            "/menus/templates_xlsx/templates/data/demo.json?source=" + source)
        # Pas `== 404` : selon la branche, le gestionnaire d'erreur de
        # l'application renvoie le navigateur vers « / » (302) plutot que de
        # rendre la page 404. Ce qui doit tenir, c'est qu'aucun classeur ne sort.
        assert response.status_code != 200, source
        assert not response.data.startswith(XLSX_MAGIC)
