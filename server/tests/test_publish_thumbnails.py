# coding: utf-8
#
# #288 : miniatures de portfolio generees automatiquement depuis le JSON (1ere vue)
#        au publish, via un navigateur headless (Playwright + Chromium), en FALLBACK
#        des qu'aucun image_front.* n'est fourni a la main.
#
# Ce test couvre la logique deterministe (selection des dossiers cibles, garde-fous
# de fallback, interrupteur d'environnement, degradation gracieuse sans Playwright).
# Le rendu headless lui-meme (fidelite du PNG) se valide en local sur un vrai
# portfolio -- il exige Chromium + un build client, hors perimetre d'un test unitaire.
#
# Comme test_publish_excluded_dirs.py : import isole via importlib pour ne pas
# declencher les imports lourds de server/__init__.

import importlib.util
from pathlib import Path

_MOD = Path(__file__).resolve().parents[1] / "publish_thumbnails.py"
_spec = importlib.util.spec_from_file_location("sa_publish_thumbnails_under_test", _MOD)
thumbs = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(thumbs)


def _make_folder(base, rel, *, index=True, json_gz=True, manual_image=None):
    d = Path(base) / rel if rel else Path(base)
    d.mkdir(parents=True, exist_ok=True)
    if index:
        (d / "index.html").write_text("<html></html>", encoding="utf-8")
    if json_gz:
        (d / "data.json.gz").write_bytes(b"\x1f\x8b\x08\x00")  # entete gzip factice
    if manual_image:
        (d / manual_image).write_bytes(b"\x89PNG\r\n")
    return d


# ---------------------------------------------------------------------------
# Selection des dossiers cibles
# ---------------------------------------------------------------------------
def test_targets_a_viewer_folder_with_json_and_no_manual_image(tmp_path):
    _make_folder(tmp_path, "sucre")
    assert thumbs.find_thumbnail_targets(tmp_path) == ["sucre"]


def test_manual_image_disables_generation_fallback(tmp_path):
    # Un image_front.* depose a la main reste prioritaire : dossier NON cible.
    _make_folder(tmp_path, "sucre", manual_image="image_front.png")
    _make_folder(tmp_path, "vin", manual_image="image_front.JPG")  # casse indifferente
    _make_folder(tmp_path, "oeufs", manual_image="image_front.jpeg")
    assert thumbs.find_thumbnail_targets(tmp_path) == []


def test_folder_without_diagram_data_is_not_targeted(tmp_path):
    # Un dossier "groupe" (index.html mais pas de *.json.gz) n'a rien a rendre.
    _make_folder(tmp_path, "groupe", json_gz=False)
    assert thumbs.find_thumbnail_targets(tmp_path) == []


def test_resources_json_gz_alone_does_not_count_as_diagram(tmp_path):
    d = _make_folder(tmp_path, "meta", json_gz=False)
    (d / "resources.json.gz").write_bytes(b"\x1f\x8b")
    assert thumbs.find_thumbnail_targets(tmp_path) == []


def test_bare_gz_data_counts_as_diagram_socle_naming(tmp_path):
    # Portfolios SOCLE : les données sont nommées "... - Resultats.gz" (pas .json.gz).
    d = _make_folder(tmp_path, "sucre", json_gz=False)
    (d / "SOCLE_Sucre_Resultats.gz").write_bytes(b"\x1f\x8b\x08\x00")
    assert thumbs.find_thumbnail_targets(tmp_path) == ["sucre"]


def test_root_folder_is_reported_as_empty_relpath(tmp_path):
    _make_folder(tmp_path, "")  # viewer a la racine du portfolio
    assert thumbs.find_thumbnail_targets(tmp_path) == [""]


def test_multiple_targets_sorted(tmp_path):
    _make_folder(tmp_path, "vin")
    _make_folder(tmp_path, "sucre")
    _make_folder(tmp_path, "porc", manual_image="image_front.png")  # exclu
    assert thumbs.find_thumbnail_targets(tmp_path) == ["sucre", "vin"]


# ---------------------------------------------------------------------------
# Interrupteur d'environnement
# ---------------------------------------------------------------------------
def test_env_toggle(monkeypatch):
    monkeypatch.delenv("PUBLISH_THUMBNAILS", raising=False)
    assert thumbs.thumbnails_enabled() is True
    for off in ("0", "false", "No", "off", "OFF"):
        monkeypatch.setenv("PUBLISH_THUMBNAILS", off)
        assert thumbs.thumbnails_enabled() is False
    monkeypatch.setenv("PUBLISH_THUMBNAILS", "1")
    assert thumbs.thumbnails_enabled() is True


def test_disabled_env_short_circuits(tmp_path, monkeypatch):
    _make_folder(tmp_path, "sucre")
    monkeypatch.setenv("PUBLISH_THUMBNAILS", "0")
    assert thumbs.generate_missing_thumbnails(tmp_path) == 0


# ---------------------------------------------------------------------------
# Degradation gracieuse : Playwright indisponible -> 0, sans exception
# ---------------------------------------------------------------------------
def test_graceful_degradation_without_playwright(tmp_path, monkeypatch):
    _make_folder(tmp_path, "sucre")
    _make_folder(tmp_path, "vin")
    monkeypatch.delenv("PUBLISH_THUMBNAILS", raising=False)
    monkeypatch.setattr(thumbs, "_import_playwright", lambda: None)
    # Ne doit rien lever et ne generer aucune miniature.
    assert thumbs.generate_missing_thumbnails(tmp_path) == 0
    assert not (tmp_path / "sucre" / "image_front.png").exists()


def test_no_targets_returns_zero_without_touching_playwright(tmp_path, monkeypatch):
    # Aucun dossier eligible -> on ne tente meme pas d'importer Playwright.
    def _boom():
        raise AssertionError("Playwright ne doit pas etre sollicite sans cible")
    monkeypatch.setattr(thumbs, "_import_playwright", _boom)
    _make_folder(tmp_path, "porc", manual_image="image_front.png")
    assert thumbs.generate_missing_thumbnails(tmp_path) == 0
