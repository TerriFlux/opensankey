"""
Ce qu'il reste d'un fichier importé : sa forme, et rien d'autre.

Le 25/09/2026, le temp de prod portait 97 000 dossiers de conversion et 342
classeurs Excel de visiteurs, jamais supprimés par le code. Deux contrats ici :

- un run vit dans un dossier à nous (`new_run_dir`), que `discard_run` supprime
  à partir de l'état de session et que `sweep_runs` reprend s'il a été abandonné
  — sans jamais toucher un chemin qu'on n'a pas créé (modèle de la galerie) ;
- `diagram_shape` décrit un résultat par des comptes et des présences (nœuds,
  flux, incertitudes, contraintes…) et le classe dessin / analyse : c'est ce que
  la couche hôte journalise à la place du fichier.
"""

import gzip
import json
import os
import time

import pytest

from opensankey.server import views


@pytest.fixture
def runs(tmp_path, monkeypatch):
    """Un temp système à nous, pour que runs_root() n'aille pas dans le vrai."""
    monkeypatch.setattr(views.tempfile, "gettempdir", lambda: str(tmp_path))
    monkeypatch.setattr(views, "_last_run_sweep", [0.0])
    return tmp_path


def _state(folder, name="output.json"):
    return {"output_file_name": os.path.join(folder, name), "logname": os.path.join(folder, "rollover.log")}


def test_un_run_se_supprime_depuis_l_etat_de_session(runs):
    folder = views.new_run_dir()
    log_folder = views.new_run_dir()
    open(os.path.join(folder, "input.xlsx"), "wb").close()
    open(os.path.join(log_folder, "rollover.log"), "wb").close()
    assert views.is_run_dir(folder) and views.is_run_dir(log_folder)

    views.discard_run({
        "input_filename": os.path.join(folder, "input.xlsx"),
        "output_file_name": os.path.join(folder, "output.json"),   # pas encore écrit : indifférent
        "logname": os.path.join(log_folder, "rollover.log"),
    })
    assert not os.path.exists(folder) and not os.path.exists(log_folder)


def test_un_chemin_qui_n_est_pas_un_run_n_est_jamais_supprime(runs, tmp_path):
    gallery = tmp_path / "SANKEY_DATA"
    gallery.mkdir()
    model = gallery / "business_simple.json"
    model.write_text("{}", encoding="utf-8")
    assert not views.is_run_dir(str(gallery))
    views.discard_run({"output_file_name": str(model), "input_filename": str(model)})
    assert model.exists()
    # Le dossier parent des runs lui-même n'est pas un run.
    assert not views.is_run_dir(views.runs_root())
    views.discard_run({"logname": os.path.join(views.runs_root(), "rollover.log")})
    assert os.path.isdir(views.runs_root())
    # Un état vide ou absent ne fait rien.
    views.discard_run({})
    views.discard_run(None)


def test_le_balayage_reprend_les_runs_abandonnes_et_garde_les_recents(runs):
    old = views.new_run_dir()
    fresh = views.new_run_dir()
    stale = time.time() - views.RUN_MAX_AGE_S - 60
    os.utime(old, (stale, stale))
    assert views.sweep_runs(force=True) == 1
    assert not os.path.exists(old) and os.path.isdir(fresh)
    # Au plus un balayage par RUN_SWEEP_EVERY_S : le suivant ne fait rien.
    os.utime(fresh, (stale, stale))
    assert views.sweep_runs() == 0
    assert views.sweep_runs(now=time.time() + views.RUN_SWEEP_EVERY_S + 1) == 1


def _write(path, data, compressed=False):
    if compressed:
        with gzip.open(path, "wt", encoding="utf-8") as f:
            json.dump(data, f)
    else:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f)


def test_la_forme_d_un_dessin(tmp_path):
    path = tmp_path / "output.json"
    _write(path, {
        "nodes": {"a": {"name": "A"}, "b": {"name": "B"}, "c": {"name": "C"}},
        "links": {"1": {"idSource": "a", "idTarget": "b", "value": {"data_value": 3}},
                  "2": {"idSource": "b", "idTarget": "c", "value": {"data_value": 2}}},
        "levelTags": {}, "nodeTags": {"type": {}}, "fluxTags": {},
    })
    assert views.diagram_shape(str(path)) == {
        "k": views.SHAPE_KIND_DRAWING, "n": 3, "l": 2, "lv": 0, "nt": 1, "ft": 0, "dt": 0,
        "unc": 0, "cons": 0, "bal": 0,
    }


def test_la_forme_d_une_analyse_de_flux_lit_les_valeurs_imbriquees_par_tags(tmp_path):
    path = tmp_path / "output.json"
    _write(str(path) + ".gz", {
        "nodes": [{"name": "A", "has_material_balance": True}, {"name": "B"}],
        # Valeurs par jeu de données : l'incertitude est deux niveaux plus bas.
        "links": [{"value": {"2024": {"data_value": 1, "data_uncertainty": 0.1},
                             "2025": {"data_value": 2, "data_uncertainty": 0}}},
                  {"value": {"result_value": 4.0}}],
        "levelTags": {"secteurs": {}, "produits": {}},
        "dataTags": {"année": {}},
        "ratio_flux_constraints": {"c1": {}, "c2": {}, "c3": {}},
    }, compressed=True)
    # Le .json n'existe pas, le .json.gz oui : c'est l'état normal après envoi.
    assert views.diagram_shape(str(path)) == {
        "k": views.SHAPE_KIND_ANALYSIS, "n": 2, "l": 2, "lv": 2, "nt": 0, "ft": 0, "dt": 1,
        "unc": 1, "cons": 3, "bal": 1,
    }


def test_une_forme_illisible_vaut_none_jamais_une_erreur(tmp_path):
    assert views.diagram_shape(None) is None
    assert views.diagram_shape(str(tmp_path / "absent.json")) is None
    bad = tmp_path / "bad.json"
    bad.write_text("{pas du json", encoding="utf-8")
    assert views.diagram_shape(str(bad)) is None
    not_a_dict = tmp_path / "list.json"
    not_a_dict.write_text("[1, 2]", encoding="utf-8")
    assert views.diagram_shape(str(not_a_dict)) is None
