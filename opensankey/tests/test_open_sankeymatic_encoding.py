# -*- coding: utf-8 -*-
"""
Régression ticket #182 — import SankeyMATIC en UTF-8 (classe de bug #180).

Bug : sous Windows, `parse_sankeymatic_file()` ouvrait le fichier importé
(`open(filename, "r")`) sans encodage explicite. Werkzeug enregistre l'upload
octet pour octet (binaire), donc le fichier reste en UTF-8 ; mais `open()` sans
encodage décode avec la locale du système — cp1252 sous Windows. Dès qu'un nom de
nœud/flux contient un octet hors cp1252 (ex. 0x9D, issu de U+201D « ” »),
`f.read()` lève `UnicodeDecodeError`. Toute exception de la route
`POST /open_sankeymatic` est convertie en `abort(500)` → l'import échoue.
Invisible sous Linux (CI/prod, défaut UTF-8).

Ce test reproduit la panne de façon déterministe et indépendante de la plateforme
en simulant le défaut Windows : un `open()` *sans* `encoding` explicite, ciblé sur
le fichier temporaire de la route, retombe sur cp1252. Le correctif
(encoding="utf-8") court-circuite ce défaut → la route répond 200 et le nom de
nœud accentué est bien remonté. Sans le correctif, la route renvoie 500.

Même approche que `test_check_process_log_encoding` livré pour #180.
"""

import builtins
import json
import os
import tempfile

import pytest

from opensankey.server import create_app


# Mini-diagramme SankeyMATIC valide « Source [valeur] Cible ». Deux sources vers
# une même cible : au moins une colonne porte ≥2 nœuds, ce qu'exige le calcul de
# positions du parser (sinon division par zéro, indépendante de #182).
# Le nom de la cible contient U+201D (guillemet fermant typographique « ” ») dont
# l'encodage UTF-8 inclut l'octet 0x9D — indéfini en cp1252 : c'est lui qui
# déclenche le 500. Le nom de source « Forêt » ne porte que des accents latin-1
# sûrs en cp1252 ; on vérifie qu'il survit intact au round-trip lu en UTF-8.
_SANKEYMATIC_CONTENT = "Forêt [60] Énergie “verte”\nCharbon [40] Énergie “verte”\n"


@pytest.fixture
def client():
    app = create_app()
    # On veut observer le code HTTP (500 avant correctif, 200 après) plutôt que
    # de voir l'exception se propager hors du client de test.
    app.config["PROPAGATE_EXCEPTIONS"] = False
    return app.test_client()


def _simulate_windows_default_encoding(monkeypatch, target_path):
    """Fait retomber sur cp1252 tout open() texte SANS encoding explicite visant
    `target_path` — exactement le comportement de open() sous Windows. Les autres
    fichiers et les open() avec encoding explicite restent intacts (la sauvegarde
    binaire de Werkzeug et les open() encodés ne sont pas affectés)."""
    real_open = builtins.open

    def _win_open(file, mode="r", *args, **kwargs):
        if (
            str(file) == str(target_path)
            and "b" not in mode
            and "encoding" not in kwargs
            and not args  # encoding non plus passé en positionnel
        ):
            kwargs["encoding"] = "cp1252"
        return real_open(file, mode, *args, **kwargs)

    monkeypatch.setattr(builtins, "open", _win_open)


def test_open_sankeymatic_reads_utf8_under_windows_default(tmp_path, client, monkeypatch):
    # La route crée son répertoire temporaire via tempfile.mkdtemp() puis y écrit
    # « toto.txt ». On fixe ce répertoire pour connaître le chemin exact à cibler.
    conv_dir = tmp_path / "conv"
    conv_dir.mkdir()
    monkeypatch.setattr(tempfile, "mkdtemp", lambda *a, **k: str(conv_dir))
    toto_path = conv_dir / "toto.txt"

    # Sanity : le contenu UTF-8 échoue bien en cp1252 — c'est ce qui déclenchait
    # le 500. Si ça ne lève pas, le fixture ne reproduit plus rien.
    content_bytes = _SANKEYMATIC_CONTENT.encode("utf-8")
    with pytest.raises(UnicodeDecodeError):
        content_bytes.decode("cp1252")

    # Simule le défaut Windows pour le seul fichier temporaire de la route.
    _simulate_windows_default_encoding(monkeypatch, toto_path)

    resp = client.post(
        "/open_sankeymatic",
        data={"file_content": (__import__("io").BytesIO(content_bytes), "graph.txt")},
        content_type="multipart/form-data",
    )

    # Avant correctif : UnicodeDecodeError -> 500. Après : 200.
    assert resp.status_code == 200, resp.get_data(as_text=True)
    payload = json.loads(resp.get_data(as_text=True))

    # Le nom de nœud accentué est lu et remonté intact (preuve du décodage UTF-8).
    names = {node.get("name", "") for node in payload.get("nodes", {}).values()}
    assert any("Forêt" in name for name in names), payload

    # Le fichier temporaire a été nettoyé par la route (clean_file).
    assert not os.path.exists(toto_path)
