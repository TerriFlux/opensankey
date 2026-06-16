#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Regenere l'index des modeles (templates) a partir de l'arborescence du disque.

Arborescence attendue (racine = SankeyData/templates) :

    <difficulte>/data/<id>.json        (ou <id>.json.gz)
    <difficulte>/image/<id>.png        (optionnel)

Pour chaque fichier de donnees trouve dans un dossier <difficulte>/data/, une
entree de template est generee. Le png correspondant (<difficulte>/image/<id>.png)
est ajoute via `img_path` s'il existe.

Comportement :
- les entrees deja presentes dans l'index sont conservees (themes / lang preserves) ;
- les entrees dont le fichier de donnees a disparu sont supprimees ;
- les nouveaux fichiers de donnees sont ajoutes (themes=[], lang=<defaut>).

Les chemins file_path / img_path sont relatifs a la racine SANKEY_DATA, conformement
a server/views.py (ex. `templates/advanced/data/cocoa.json`). Le serveur lit le
`.json.gz` reel de facon transparente : on ecrit donc toujours l'extension logique `.json`.

Exemples :
    python scripts/generate_templates_index.py
    python scripts/generate_templates_index.py --dry-run
    python scripts/generate_templates_index.py --templates-dir /chemin/templates --default-lang en
"""
import argparse
import json
import os
import sys

# Nom de dossier de difficulte -> valeur du champ `difficulty` attendue par le client.
DIFFICULTY_BY_DIR = {
    "essential": "basic",
    "intermediary": "intermediary",
    "advanced": "advanced",
}

# Ordre des onglets de difficulte dans l'UI (repli si absent de l'index existant).
DEFAULT_DIFFICULTIES = ["basic", "intermediary", "advanced"]

# Taxonomie canonique des themes (4 categories generales). C'est cette liste qui est
# ecrite en tete de l'index et qui pilote les onglets de theme du client.
THEMES = ["general", "energy", "mat", "economy"]

# Regroupement des anciens themes (granulaires) vers les 4 categories canoniques.
# L'identite des 4 cles canoniques permet de relancer le script sans dérive.
THEME_REMAP = {
    "general": "general",
    "energy": "energy",
    "mat": "mat",
    "economy": "economy",
    # Matieres
    "enviro": "mat",
    "ress": "mat",
    "agri": "mat",
    "transport": "mat",
    # Economique
    "industry": "economy",
    "commercial": "economy",
    "supply": "economy",
}


def remap_themes(themes):
    """Projette une liste de themes vers la taxonomie canonique (dedup, ordre stable).

    Une entree sans theme connu retombe sur ['general'].
    """
    mapped = []
    for theme in themes:
        canonical = THEME_REMAP.get(theme)
        if canonical and canonical not in mapped:
            mapped.append(canonical)
    if not mapped:
        return ["general"]
    # Reordonne selon THEMES pour une sortie stable.
    return [t for t in THEMES if t in mapped]

DATA_SUFFIXES = (".json.gz", ".json")


def repo_root():
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def template_id(filename):
    """Retourne l'identifiant logique d'un fichier de donnees, ou None si non pertinent."""
    for suffix in DATA_SUFFIXES:
        if filename.endswith(suffix):
            return filename[: -len(suffix)]
    return None


def scan_templates(templates_dir, prefix, default_lang, existing):
    """Construit le dict des templates a partir du disque, en preservant les metadonnees existantes."""
    templates = {}
    seen_difficulty_dirs = []

    for diff_dir in sorted(os.listdir(templates_dir)):
        data_dir = os.path.join(templates_dir, diff_dir, "data")
        if not os.path.isdir(data_dir):
            continue
        seen_difficulty_dirs.append(diff_dir)
        difficulty = DIFFICULTY_BY_DIR.get(diff_dir, diff_dir)
        image_dir = os.path.join(templates_dir, diff_dir, "image")

        ids = set()
        for filename in os.listdir(data_dir):
            tid = template_id(filename)
            if tid is not None:
                ids.add(tid)

        for tid in sorted(ids):
            prev = existing.get(tid, {})
            entry = {
                "file_path": f"{prefix}/{diff_dir}/data/{tid}.json",
                "difficulty": difficulty,
                "themes": remap_themes(prev.get("themes", [])),
                "lang": prev.get("lang", default_lang),
            }
            png_path = os.path.join(image_dir, f"{tid}.png")
            if os.path.exists(png_path):
                entry["img_path"] = f"{prefix}/{diff_dir}/image/{tid}.png"

            # Ordre des cles stable et lisible : file_path, img_path, difficulty, themes, lang.
            ordered = {"file_path": entry["file_path"]}
            if "img_path" in entry:
                ordered["img_path"] = entry["img_path"]
            ordered["difficulty"] = entry["difficulty"]
            ordered["themes"] = entry["themes"]
            ordered["lang"] = entry["lang"]
            templates[tid] = ordered

    return templates, seen_difficulty_dirs


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--templates-dir",
        default=os.path.join(repo_root(), "SankeyData", "templates"),
        help="Dossier racine des templates (defaut: SankeyData/templates).",
    )
    parser.add_argument(
        "--index",
        default=None,
        help="Chemin du fichier index a ecrire (defaut: <templates-dir>/index.json).",
    )
    parser.add_argument(
        "--prefix",
        default="templates",
        help="Prefixe des file_path/img_path, relatif a SANKEY_DATA (defaut: templates).",
    )
    parser.add_argument(
        "--default-lang",
        default="fr",
        help="Langue affectee aux nouveaux templates absents de l'index (defaut: fr).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Affiche le resultat et le diff sans ecrire le fichier.",
    )
    args = parser.parse_args(argv)

    templates_dir = os.path.abspath(args.templates_dir)
    if not os.path.isdir(templates_dir):
        parser.error(f"Dossier introuvable: {templates_dir}")
    index_path = args.index or os.path.join(templates_dir, "index.json")

    # Index existant (pour preserver themes/lang et les listes de tete).
    old_index = {}
    if os.path.exists(index_path):
        with open(index_path, encoding="utf-8") as fh:
            old_index = json.load(fh)
    existing_templates = old_index.get("templates", {})

    templates, seen_dirs = scan_templates(
        templates_dir, args.prefix.rstrip("/"), args.default_lang, existing_templates
    )

    index = {
        "difficulties": old_index.get("difficulties", DEFAULT_DIFFICULTIES),
        "themes": THEMES,
        "templates": templates,
    }

    # Rapport des changements.
    old_ids = set(existing_templates)
    new_ids = set(templates)
    added = sorted(new_ids - old_ids)
    removed = sorted(old_ids - new_ids)
    without_img = sorted(tid for tid, e in templates.items() if "img_path" not in e)

    print(f"Dossiers de difficulte: {', '.join(seen_dirs) or '(aucun)'}")
    print(f"Templates: {len(templates)} (ajoutes: {len(added)}, supprimes: {len(removed)})")
    if added:
        print("  + " + "\n  + ".join(added))
    if removed:
        print("  - " + "\n  - ".join(removed))
    if without_img:
        print(f"Sans image (img_path omis): {', '.join(without_img)}")

    payload = json.dumps(index, indent=2, ensure_ascii=False) + "\n"
    if args.dry_run:
        print("\n--- index.json (dry-run, non ecrit) ---")
        print(payload)
        return 0

    with open(index_path, "w", encoding="utf-8") as fh:
        fh.write(payload)
    print(f"\nEcrit: {index_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
