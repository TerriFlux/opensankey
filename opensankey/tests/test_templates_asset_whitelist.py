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
