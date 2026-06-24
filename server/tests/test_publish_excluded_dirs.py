# coding: utf-8
#
# Ticket #194 : _EXCLUDED_DIRS doit exclure "Partenaires" et "Interne" de la
# publication de portfolios, au meme titre que "Archives"/"Documents"/"Livrables".
# find_index_folders (sweep de publication) et la route browse ne doivent jamais
# lister ces dossiers comme publiables.
#
# Note : la CI (.gitlab-ci.yml job `test`) ne lance pytest que sur les submodules
# MFAProblem/OpenSankey/SankeyExcelParser, pas sur server/. Ce test sert donc de
# documentation executable + verification locale. On importe publish.py en
# isolation (importlib) pour ne pas declencher les imports lourds de server/__init__.

import importlib.util
from pathlib import Path

_PUBLISH = Path(__file__).resolve().parents[1] / "publish.py"
_spec = importlib.util.spec_from_file_location("sa_publish_under_test", _PUBLISH)
publish = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(publish)


def _make_viewer(base, rel):
    d = Path(base) / rel
    d.mkdir(parents=True, exist_ok=True)
    (d / "index.html").write_text("<html></html>", encoding="utf-8")


def test_excluded_dirs_contains_new_entries():
    assert {"Partenaires", "Interne"} <= publish._EXCLUDED_DIRS


def test_find_index_folders_excludes_partenaires_interne(tmp_path):
    _make_viewer(tmp_path, "Filiere/Resultats")
    _make_viewer(tmp_path, "Partenaires/refflux/Resultats")
    _make_viewer(tmp_path, "Interne/notes/Resultats")
    _make_viewer(tmp_path, "Archives/V1")

    found = set(publish.find_index_folders(str(tmp_path)))

    assert "Filiere/Resultats" in found
    assert not any(f.startswith("Partenaires") for f in found), found
    assert not any(f.startswith("Interne") for f in found), found
    assert not any(f.startswith("Archives") for f in found), found
