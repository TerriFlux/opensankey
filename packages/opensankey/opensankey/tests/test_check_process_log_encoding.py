"""
Régression ticket #180 — lecture du log de process en UTF-8.

Bug : sous Windows, `check_process()` ouvrait le log (`open(logname, "r")`) sans
encodage explicite. Le log est écrit en UTF-8 (su_trace.logger_init :
`logging.FileHandler(..., encoding="utf-8")`), mais `open()` sans encodage décode
avec la locale du système — cp1252 sous Windows. Dès qu'un nom de feuille/nœud
accentué produit un octet hors cp1252 (ex. 0x9D, issu de U+201D « " »),
`f.read()` lève `UnicodeDecodeError` → la route renvoie 500 en boucle et le
spinner « En traitement… » du client tourne indéfiniment. Invisible sous Linux
(CI/prod, défaut UTF-8).

Ce test reproduit la panne de façon déterministe et indépendante de la plateforme
en simulant le défaut Windows : un `open()` *sans* `encoding` explicite, ciblé sur
le fichier log, retombe sur cp1252. Le correctif (encoding="utf-8") court-circuite
ce défaut → la route répond 200. Sans le correctif, la route renvoie 500.
"""

import builtins
import json

import pytest

from opensankey.server import create_app


# Caractère dont l'encodage UTF-8 contient l'octet 0x9D (U+201D, guillemet
# fermant typographique) — précisément l'octet « 0x9d » remonté dans le rapport.
# Combiné à un nom de nœud accentué réaliste pour coller au cas d'origine.
_LOG_CONTENT = 'INFO  Lecture de la feuille “Résultats” terminée\n'


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
    fichiers et les open() avec encoding explicite restent intacts (pas d'effet
    de bord sur Flask/json)."""
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


def test_check_process_reads_utf8_log_under_windows_default(tmp_path, client, monkeypatch):
    # Log écrit en UTF-8, comme le fait su_trace.logger_init.
    log_path = tmp_path / "rollover.log"
    log_path.write_text(_LOG_CONTENT, encoding="utf-8")

    # Sanity : la locale Windows (cp1252) échoue bien sur ce contenu — c'est ce
    # qui déclenchait le 500. Si ça ne lève pas, le fixture ne reproduit plus rien.
    with pytest.raises(UnicodeDecodeError):
        log_path.read_text(encoding="cp1252")

    # Simule le défaut Windows pour le seul fichier log.
    _simulate_windows_default_encoding(monkeypatch, log_path)

    # Amorce l'état de session attendu par check_process.
    with client.session_transaction() as sess:
        sess["process_state"] = {"process_started": True, "logname": str(log_path)}

    resp = client.post("/upload/check_process")

    # Avant correctif : UnicodeDecodeError -> 500. Après : 200.
    assert resp.status_code == 200, resp.get_data(as_text=True)
    payload = json.loads(resp.get_data(as_text=True))
    # Le contenu accentué/typographique est bien remonté, intact.
    assert "Résultats" in payload["output"]
    assert payload["log_name"] == str(log_path)
