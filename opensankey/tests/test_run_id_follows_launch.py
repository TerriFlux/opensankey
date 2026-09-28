"""
sa#571 — le statut d'un traitement se lit sur SON run, jamais sur le précédent.

Bug : après un import en échec, cocher l'option demandée puis recliquer « Ouvrir »
réaffichait aussitôt l'ancien journal et la même erreur ; il fallait un troisième
clic. Le dialogue montait son poll AVANT la réponse du lancement : ce premier
`check_process` partait avec l'ancien cookie de session, donc lisait l'état du run
précédent, dont le fichier de statut valait encore `failed`.

Contrat vérifié ici :
- chaque lancement renvoie l'identifiant de son run (`run_id`) ;
- `check_process` répète l'identifiant du run dont il parle, ce qui permet au
  client d'écarter une réponse qui concerne un autre run ;
- le lancement jette le run précédent de la session (ce que faisait le bouton
  « Réinitialisation », supprimé, via /upload/clean).
"""

import json
import os

import pytest

from opensankey.server import create_app
from opensankey.server import views


@pytest.fixture
def runs(tmp_path, monkeypatch):
    """Un temp système à nous, pour que runs_root() n'aille pas dans le vrai."""
    monkeypatch.setattr(views.tempfile, "gettempdir", lambda: str(tmp_path / "tmp"))
    monkeypatch.setattr(views, "_last_run_sweep", [0.0])
    return tmp_path


@pytest.fixture
def client():
    app = create_app()
    app.config["PROPAGATE_EXCEPTIONS"] = False
    return app.test_client()


def _failed_run():
    """Un run précédent en échec, tel qu'un import refusé le laisse : jamais repris par retrieve_result."""
    log_dir = views.new_run_dir()
    logname = os.path.join(log_dir, "rollover.log")
    with open(logname, "w", encoding="utf-8") as f:
        f.write("ERROR autofix constraints redundancies requis\n")
    views.write_process_status(logname, views.PROCESS_STATUS_FAILED)
    return logname


def test_run_id_est_le_dossier_du_journal():
    assert views.run_id_of(os.path.join("tmp", "opensankey_runs", "abc123", "rollover.log")) == "abc123"
    assert views.run_id_of(None) is None
    assert views.run_id_of("") is None


def test_check_process_nomme_le_run_et_le_lancement_en_ouvre_un_autre(runs, client, monkeypatch):
    # Un modèle de la galerie : le chemin example_json répond sans thread, donc sans course.
    gallery = runs / "SANKEY_DATA"
    gallery.mkdir()
    (gallery / "modele.json").write_text("{}", encoding="utf-8")
    monkeypatch.setenv("SANKEY_DATA", str(gallery))

    old_log = _failed_run()
    with client.session_transaction() as sess:
        sess["process_state"] = {"process_started": True, "logname": old_log}

    # Ce que lisait le premier poll de l'ancien dialogue : l'échec du run précédent.
    stale = json.loads(client.post("/upload/check_process").get_data(as_text=True))
    assert stale["status"] == "failed"
    assert stale["run_id"] == views.run_id_of(old_log)

    resp = client.post("/convert/launch", data={
        "input_format": "example_json",
        "output_format": "json",
        "file_name": "modele.json",
    })
    assert resp.status_code == 200, resp.get_data(as_text=True)
    launched = json.loads(resp.get_data(as_text=True))
    assert launched["run_id"] and launched["run_id"] != stale["run_id"]

    # Le poll lié au run lancé lit SON statut…
    fresh = json.loads(client.post("/upload/check_process").get_data(as_text=True))
    assert fresh["run_id"] == launched["run_id"]
    assert fresh["status"] == "finished"
    # … et le run précédent a été jeté au lancement.
    assert not os.path.exists(os.path.dirname(old_log))
