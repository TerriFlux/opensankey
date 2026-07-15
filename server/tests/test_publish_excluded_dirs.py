# coding: utf-8
#
# Exclusions de publication.
#
# #194 : "Partenaires" et "Interne" ne doivent jamais etre publies, au meme titre
#        que "Archives"/"Documents"/"Livrables" (ensemble fige, noms exacts, dossiers
#        uniquement).
# #278 : l'ensemble fige devient des MOTS-CLES fournis par l'utilisateur, appliques
#        aux fichiers ET aux dossiers, en correspondance partielle insensible a la
#        casse -- pour faire varier les exclusions selon le portfolio publie
#        (public / consortium) sans toucher au code. La garantie du #194 est
#        conservee par les DEFAUTS (appliques des que l'appelant ne dit rien) et par
#        l'etage technique, lui non modifiable.
#
# Note : la CI (.gitlab-ci.yml job `test`) ne lance pytest que sur les submodules
# MFAProblem/OpenSankey/SankeyExcelParser + tests/ (croises), pas sur server/. Ce
# test sert donc de documentation executable + verification locale. On importe
# publish.py en isolation (importlib) pour ne pas declencher les imports lourds de
# server/__init__ -- ce qui le rend aussi ajoutable a la CI tel quel.

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


# ---------------------------------------------------------------------------
# Defauts et etage technique
# ---------------------------------------------------------------------------
def test_defaults_cover_the_socle_visibility_levels():
    # Convention SOCLE : racine = public, Consortium/ = consortium, Interne/ = jamais publie.
    assert {"Consortium", "Interne", "Archives", "Documents", "Livrables"} == set(
        publish.DEFAULT_EXCLUDE_KEYWORDS
    )


def test_technical_dirs_stay_excluded_even_with_no_keyword():
    # Garde-fou : vider le champ ne doit pas exposer les repertoires de travail.
    for name in ("Tous", "mfadata", "artifacts", "artefacts", "public"):
        assert publish.is_excluded_dir(name, [])


def test_technical_exclusion_stays_exact_match():
    # "public" est exclu, "publications" ne l'est pas : l'etage technique ne fait
    # pas de correspondance partielle (seuls les mots-cles utilisateur en font).
    assert publish.is_excluded_dir("public", [])
    assert not publish.is_excluded_dir("publications", [])


# ---------------------------------------------------------------------------
# Regle de correspondance des mots-cles
# ---------------------------------------------------------------------------
def test_keyword_match_is_partial_and_case_insensitive():
    assert publish.is_excluded_file("SOCLE - FR_Sucre_reconciled.xlsx", ["reconciled"])
    assert publish.is_excluded_file("SOCLE - FR_Sucre_RECONCILED.xlsx", ["reconciled"])
    assert publish.is_excluded_dir("Consortium", ["consortium"])
    assert not publish.is_excluded_file("SOCLE - FR_Sucre.xlsx", ["reconciled"])


def test_partenaires_is_absent_from_defaults_so_public_study_survives():
    # Piege du #278 : la correspondance etant PARTIELLE, le mot-cle "Partenaires"
    # (ancien nom de Consortium, #194) exclurait aussi l'etude publique
    # "Detail pays partenaires commerciaux". D'ou son absence des defauts.
    defaults = publish.resolve_exclude_keywords(None)
    assert not publish.is_excluded_dir("Détail pays partenaires commerciaux", defaults)
    assert publish.is_excluded_dir("Détail pays partenaires commerciaux", ["Partenaires"])


def test_keywords_are_parsed_from_a_free_text_field():
    assert publish.normalize_exclude_keywords("Consortium, Interne ; reconciled") == [
        "consortium", "interne", "reconciled",
    ]
    assert publish.normalize_exclude_keywords("  ") == []
    assert publish.normalize_exclude_keywords(["Consortium", " Interne "]) == [
        "consortium", "interne",
    ]


def test_absent_field_falls_back_to_defaults_but_empty_field_does_not():
    # None = l'appelant ignore la fonctionnalite (script de publication, ancien
    # client) -> il garde la protection du #194. "" = saisie vidée volontairement.
    assert publish.resolve_exclude_keywords(None) == [
        k.lower() for k in publish.DEFAULT_EXCLUDE_KEYWORDS
    ]
    assert publish.resolve_exclude_keywords("") == []
    assert publish.resolve_exclude_keywords([]) == []


# ---------------------------------------------------------------------------
# find_index_folders : c'est la non-descente qui protege reellement le contenu
# ---------------------------------------------------------------------------
def test_find_index_folders_defaults_exclude_business_dirs(tmp_path):
    # Garantie du #194, transposee au renommage Partenaires -> Consortium (#278).
    _make_viewer(tmp_path, "Filiere/Resultats")
    _make_viewer(tmp_path, "Filiere/Consortium/refflux/Resultats")
    _make_viewer(tmp_path, "Filiere/Consortium/Interne/notes/Resultats")
    _make_viewer(tmp_path, "Archives/V1")
    _make_viewer(tmp_path, "artifacts/build")

    found = set(publish.find_index_folders(str(tmp_path)))

    assert "Filiere/Resultats" in found
    for forbidden in ("Filiere/Consortium", "Archives", "artifacts"):
        assert not any(f.startswith(forbidden) for f in found), found


def test_find_index_folders_excludes_on_partial_match(tmp_path):
    _make_viewer(tmp_path, "Filiere/Resultats")
    _make_viewer(tmp_path, "Filiere/Notes internes 2026/Resultats")

    found = set(publish.find_index_folders(str(tmp_path), exclude_keywords=["interne"]))

    assert found == {"Filiere/Resultats"}


def test_find_index_folders_with_empty_keywords_keeps_only_technical(tmp_path):
    # Publier le portfolio consortium = retirer "Consortium" du champ : le dossier
    # redevient publiable, mais les dossiers techniques restent ecartes.
    _make_viewer(tmp_path, "Filiere/Consortium/Resultats")
    _make_viewer(tmp_path, "artifacts/build")

    found = set(publish.find_index_folders(str(tmp_path), exclude_keywords=[]))

    assert "Filiere/Consortium/Resultats" in found
    assert not any(f.startswith("artifacts") for f in found), found


# ---------------------------------------------------------------------------
# Exclusion de FICHIERS : le cas "reconciled" du #278
# ---------------------------------------------------------------------------
def test_copy_excel_files_skips_excluded_files_and_dirs(tmp_path):
    src = tmp_path / "src"
    (src / "Interne").mkdir(parents=True)
    (src / "SOCLE - FR_Sucre.xlsx").write_bytes(b"x")
    (src / "SOCLE - FR_Sucre_reconciled.xlsx").write_bytes(b"x")
    (src / "Interne" / "brouillon.xlsx").write_bytes(b"x")
    dst = tmp_path / "out"
    dst.mkdir()

    publish._copy_excel_files(src, dst, ["reconciled", "interne"])

    assert [p.name for p in dst.rglob("*.xlsx")] == ["SOCLE - FR_Sucre.xlsx"]


def test_referenced_file_is_excluded_by_keyword():
    # window.sankey.excel pointe sur le classeur telechargeable : un mot-cle doit
    # l'ecarter aussi, sinon il rentre dans le zip par la porte du HTML.
    assert publish._is_excluded_ref("SOCLE - FR_Sucre_reconciled.xlsx", ["reconciled"])
    assert publish._is_excluded_ref("Interne/data.json", ["interne"])
    assert not publish._is_excluded_ref("Sucre.json", ["reconciled", "interne"])
