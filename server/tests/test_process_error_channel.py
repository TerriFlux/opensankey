# coding: utf-8
#
# SA#249 — canal de cause d'echec (<logname>.error), frere du fichier de statut.
#
# Le fichier de statut ne porte qu'un mot (running/finished/failed) et le client le compare tel
# quel : la CAUSE voyage donc a cote, en JSON. Ce que ces tests verrouillent, c'est le contrat vu
# par le client :
#   - une cause ecrite est relue a l'identique (code + message + details) ;
#   - un run qui redemarre EFFACE la cause du run precedent (meme logname reutilise) ;
#   - l'absence de cause n'est pas une erreur : le client retombe sur son message generique.
#
# Le canal vit dans la couche BASE (paquet opensankey), pas dans SA : c'est la que la lecture
# (check_process) et l'ecriture (thread) se rejoignent.

import json
from pathlib import Path

import opensankey.server.views as views


def test_cause_ecrite_est_relue_a_l_identique(tmp_path):
    logname = str(tmp_path / "run.log")
    cause = {
        "code": "INCONSISTENT_STOCK_GRID",
        "message": "stock declared for some datatags only",
        "details": {"nb_datas": 7, "nb_datatag_combinations": 2},
    }

    views.write_process_error(logname, cause)

    assert views.read_process_error(logname) == cause
    # Le fichier est bien le frere du log (contrat de nommage lu par check_process).
    assert json.loads(Path(logname + ".error").read_text(encoding="utf-8")) == cause


def test_cause_absente_renvoie_none(tmp_path):
    # Cas nominal d'un run reussi : pas de fichier .error du tout.
    assert views.read_process_error(str(tmp_path / "run.log")) is None


def test_cause_illisible_renvoie_none(tmp_path):
    # Un .error tronque (crash pendant l'ecriture) ne doit pas faire tomber check_process : le
    # client affichera son message generique.
    logname = str(tmp_path / "run.log")
    Path(logname + ".error").write_text("{not json", encoding="utf-8")

    assert views.read_process_error(logname) is None


def test_un_nouveau_run_efface_la_cause_du_precedent(tmp_path):
    # Le meme logname est reutilise d'un run a l'autre : sans effacement, l'erreur du run PRECEDENT
    # survivrait a un run qui repart (et un run reussi afficherait une erreur fantome).
    logname = str(tmp_path / "run.log")
    views.write_process_error(logname, {"code": "INFEASIBLE", "message": "x", "details": {}})
    assert views.read_process_error(logname) is not None

    views.write_process_status(logname, views.PROCESS_STATUS_RUNNING)

    assert views.read_process_error(logname) is None
    assert views.read_process_status(logname) == views.PROCESS_STATUS_RUNNING


def test_statut_echec_ne_touche_pas_a_la_cause(tmp_path):
    # L'ordre d'ecriture cote serveur est : cause PUIS statut 'failed' (c'est le passage a 'failed'
    # qui declenche la lecture cote client). Ecrire le statut ne doit donc rien effacer.
    logname = str(tmp_path / "run.log")
    cause = {"code": "INFEASIBLE", "message": "infeasible", "details": {}}
    views.write_process_error(logname, cause)

    views.write_process_status(logname, views.PROCESS_STATUS_FAILED)

    assert views.read_process_error(logname) == cause
