# coding: utf-8
#
# Publication d'une étude Sankey en site statique autonome (zip).
#
# Ce module est un portage, adapté pour tourner dans le serveur Flask déployé,
# du pipeline de publication des scripts locaux MFAData (sankey_publish.py,
# html_json_replacer.py, normalize_filenames.py). Différence clé : au lieu de
# compiler / télécharger les assets, on copie l'INTÉGRALITÉ du build React
# (client/build/static — tous les chunks code-splités) et on détecte le bundle
# `main.<hash>.js/css` réel pour remplacer les placeholders du template viewer.
#
# Deux sources :
#   - un dossier serveur contenant déjà un index.html viewer (format historique)
#   - l'étude ouverte dans l'app : on synthétise un dossier source intermédiaire
#     (index.html + data.json bruts) puis on le passe dans le MÊME pipeline.
#
# Le format intermédiaire attendu par le pipeline (cf. dossiers MFAData) :
#   <script defer src="static/js/mainjs"></script>
#   <link href="static/css/maincss" rel="stylesheet">
#   <script src="NAME.json"></script>                       (JSON brut)
#   <script>window.sankey.diagram = window.sankey['NAME']</script>
# Le pipeline réécrit les deux derniers en chargeur `NAME.json.gz` (fetch + gunzip
# côté React), gzippe le JSON, normalise les noms de fichiers accentués.

import os
import re
import gzip
import json
import shutil
import unicodedata
from datetime import datetime
from pathlib import Path
from urllib.parse import unquote

import logging

logger = logging.getLogger(__name__)


def vprint(message, level=1):
    # Les fonctions portées appellent vprint(msg, level) abondamment ; on route
    # tout vers le logger en debug pour ne pas polluer les logs serveur.
    logger.debug(message)


# ---------------------------------------------------------------------------
# Utilitaires fichiers (portés de sankey_common.py)
# ---------------------------------------------------------------------------
def _longpath(p):
    r"""Sur Windows, préfixe \\?\ pour lever la limite MAX_PATH (260 car.)."""
    if os.name == "nt":
        s = str(Path(p).resolve())
        if not s.startswith("\\\\?\\"):
            s = "\\\\?\\" + s
        return s
    return str(p)


def safe_copy(src, dst):
    """Copie un fichier en gérant permissions et longs chemins Windows."""
    src_lp = _longpath(src)
    dst_lp = _longpath(dst)
    try:
        shutil.copy2(src_lp, dst_lp)
        return True
    except PermissionError:
        try:
            shutil.copy(src_lp, dst_lp)
            return True
        except PermissionError:
            try:
                with open(src_lp, "rb") as fsrc, open(dst_lp, "wb") as fdst:
                    shutil.copyfileobj(fsrc, fdst)
                return True
            except Exception as e:
                logger.warning("Impossible de copier %s vers %s: %s", src, dst, e)
                return False
    except Exception as e:
        logger.warning("Erreur copie %s vers %s: %s", src, dst, e)
        return False


# ---------------------------------------------------------------------------
# Exclusions de publication (#194, généralisées en mots-clés par #278)
#
# Deux étages, qui se CUMULENT (union), jamais ne se remplacent :
#   - les dossiers techniques ci-dessous, exclus en dur : répertoires de travail
#     du pipeline ou de l'app, qu'aucune saisie utilisateur ne doit pouvoir
#     réintroduire (garde-fou : vider le champ ne casse pas la publication) ;
#   - des mots-clés fournis par l'appelant, appliqués aux fichiers ET aux
#     dossiers, en correspondance PARTIELLE et insensible à la casse — c'est ce
#     qui permet de faire varier les exclusions selon le portfolio publié
#     (public / consortium) sans toucher au code.
# ---------------------------------------------------------------------------
_TECHNICAL_EXCLUDED_DIRS = {"Tous", "mfadata", "artifacts", "artefacts", "public"}

# Mots-clés proposés par défaut quand on publie un dossier du serveur (convention
# SOCLE : racine = portfolio public, Consortium/ = portfolio consortium,
# Consortium/Interne/ = travail jamais publié).
#
# ⚠️ « Partenaires » (ancien nom de « Consortium », #194) est délibérément ABSENT :
# la correspondance est partielle, donc ce mot-clé exclurait aussi l'étude
# « Détail pays partenaires commerciaux », qui est publique. Cf. test dédié.
#
# Rétro-compatibilité #194 : ces défauts s'appliquent dès que l'appelant ne dit rien
# (scripts de publication des sessions d'études, anciens clients) — cf.
# resolve_exclude_keywords. C'est là, et non dans une liste figée, que vit désormais
# la garantie du #194.
DEFAULT_EXCLUDE_KEYWORDS = ("Consortium", "Interne", "Archives", "Documents", "Livrables")

_KEYWORD_SEPARATORS = re.compile(r"[,;\r\n]+")


def normalize_exclude_keywords(raw):
    """Normalise des mots-clés d'exclusion en liste de minuscules, ou None.

    Accepte une chaîne saisie par l'utilisateur (« Consortium, Interne ; reconciled »)
    ou une liste. Renvoie None si `raw` est None — un champ ABSENT et un champ VIDE
    ne veulent pas dire la même chose (cf. resolve_exclude_keywords)."""
    if raw is None:
        return None
    parts = []
    for item in ([raw] if isinstance(raw, str) else list(raw)):
        parts.extend(_KEYWORD_SEPARATORS.split(str(item)))
    return [p.strip().lower() for p in parts if p and p.strip()]


def resolve_exclude_keywords(raw):
    """Mots-clés effectivement appliqués.

    None (champ absent de la requête) -> défauts métier : un appelant qui ignore
    la fonctionnalité garde la protection du #194. Une liste ou une chaîne, même
    VIDE, est prise telle quelle : l'utilisateur a le droit de tout publier (les
    dossiers techniques restent exclus par ailleurs)."""
    keywords = normalize_exclude_keywords(raw)
    if keywords is None:
        return [k.lower() for k in DEFAULT_EXCLUDE_KEYWORDS]
    return keywords


def is_excluded_file(name, keywords):
    """True si le nom de fichier contient l'un des mots-clés (casse indifférente).

    Les mots-clés sont remis en minuscules ici et pas seulement à la normalisation :
    un appelant qui passerait la saisie brute obtiendrait sinon un prédicat toujours
    faux — donc une fuite silencieuse, exactement ce que ce module doit empêcher."""
    low = name.lower()
    return any(k.lower() in low for k in keywords or ())


def is_excluded_dir(name, keywords):
    """True si le dossier est technique (nom exact) ou porte un mot-clé (partiel).
    Un dossier exclu n'est ni publié ni exploré : tout son contenu est écarté."""
    return name in _TECHNICAL_EXCLUDED_DIRS or is_excluded_file(name, keywords)


def _ignore_excluded(keywords):
    """Fabrique un `ignore` pour shutil.copytree écartant les noms exclus.

    Réservé aux arbres de CONTENU (doc/, images/… d'un dossier d'étude). À ne
    surtout pas appliquer au build React recopié dans l'artifact : un mot-clé
    malheureux ("main", "static") y détruirait le bundle."""
    def _ignore(dirpath, names):
        excluded = set()
        for name in names:
            if os.path.isdir(os.path.join(dirpath, name)):
                if is_excluded_dir(name, keywords):
                    excluded.add(name)
            elif is_excluded_file(name, keywords):
                excluded.add(name)
        return excluded
    return _ignore


def find_index_folders(base_path, current_path="", exclude_keywords=None):
    """Liste les dossiers (récursif) contenant un fichier index.html.

    exclude_keywords : cf. resolve_exclude_keywords. Les dossiers exclus ne sont
    ni listés ni explorés — c'est ce qui protège réellement leur contenu."""
    return _find_index_folders(
        base_path, current_path, resolve_exclude_keywords(exclude_keywords)
    )


def _find_index_folders(base_path, current_path, keywords):
    folders = []
    full = os.path.join(base_path, current_path) if current_path else base_path
    try:
        for item in os.listdir(full):
            item_path = os.path.join(full, item)
            if not os.path.isdir(item_path) or is_excluded_dir(item, keywords):
                continue
            rel = os.path.join(current_path, item) if current_path else item
            if os.path.isfile(os.path.join(item_path, "index.html")):
                folders.append(rel.replace("\\", "/"))
            folders.extend(_find_index_folders(base_path, rel, keywords))
    except (PermissionError, FileNotFoundError):
        pass
    return folders


# ---------------------------------------------------------------------------
# Normalisation des noms de fichiers (porté de normalize_filenames.py)
# ---------------------------------------------------------------------------
def sanitize_filename(filename):
    """Normalise un nom de fichier (accents, espaces, caractères spéciaux)."""
    if not filename:
        return filename
    path = Path(filename)
    name = path.stem
    suffix = path.suffix
    name = unicodedata.normalize("NFD", name)
    name = "".join(c for c in name if unicodedata.category(c) != "Mn")
    replacements = {
        "œ": "oe", "æ": "ae", "ß": "ss",
        " ": "_", "+": "plus", "&": "et", "%": "pct",
        "(": "", ")": "", "[": "", "]": "",
        "{": "", "}": "", "<": "", ">": "",
        "|": "-", "\\": "-", "/": "-",
        "*": "", "?": "", '"': "", "'": "",
        ":": "-", ";": "-",
    }
    for old, new in replacements.items():
        name = name.replace(old, new)
    name = re.sub(r"[^\x00-\x7F]+", "", name)
    name = re.sub(r"[-_]+", "_", name)
    name = name.strip("-_")
    return name + suffix


def normalize_files_and_update_html(target_dir):
    """Renomme les fichiers du dossier vers des noms normalisés (sans accents)."""
    target_path = Path(target_dir)
    file_mapping = {}
    files_to_rename = []
    for file_path in target_path.rglob("*"):
        if file_path.is_file():
            original = file_path.name
            normalized = sanitize_filename(original)
            if original != normalized:
                files_to_rename.append((file_path, normalized))
                file_mapping[original] = normalized
    for file_path, new_name in files_to_rename:
        try:
            new_path = file_path.parent / new_name
            counter = 1
            while new_path.exists() and new_path != file_path:
                stem = Path(new_name).stem
                suffix = Path(new_name).suffix
                conflict = f"{stem}_{counter}{suffix}"
                new_path = file_path.parent / conflict
                for orig, norm in list(file_mapping.items()):
                    if norm == new_name:
                        file_mapping[orig] = conflict
                        new_name = conflict
                        break
                counter += 1
            file_path.rename(new_path)
        except Exception as e:
            logger.warning("Erreur renommage %s: %s", file_path.name, e)
    return file_mapping


# ---------------------------------------------------------------------------
# PathMapper + copie README/images/documents (porté de path_mapper.py) — pour
# la génération d'arborescence portfolio multi-niveaux.
# ---------------------------------------------------------------------------
_ACCENT_MAP = {
    'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a',
    'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
    'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
    'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
    'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u', 'ç': 'c', 'ñ': 'n',
    'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A',
    'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
    'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O',
    'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U', 'Ç': 'C', 'Ñ': 'N',
}


class PathMapper:
    """Mapping bidirectionnel chemins originaux <-> normalisés (sans accents/espaces).
    "Etude" disparaît (→ ""). Permet de reconstruire les noms d'affichage et le
    breadcrumb dans les pages de navigation."""

    def __init__(self):
        self.original_to_normalized = {}
        self.normalized_to_original = {}

    def normalize_folder_name(self, folder_name):
        if not folder_name:
            return ""
        if folder_name == "Etude":
            self.original_to_normalized["Etude"] = ""
            return ""
        if folder_name in self.original_to_normalized:
            return self.original_to_normalized[folder_name]
        normalized = folder_name.replace(' ', '-')
        for old, new in _ACCENT_MAP.items():
            normalized = normalized.replace(old, new)
        normalized = re.sub(r'[^a-zA-Z0-9\-]', '', normalized)
        normalized = re.sub(r'-+', '-', normalized).strip('-')
        if normalized:
            self.original_to_normalized[folder_name] = normalized
            self.normalized_to_original[normalized] = folder_name
        return normalized

    def normalize_path(self, original_path):
        parts = str(original_path).replace('\\', '/').split('/')
        out = []
        for part in parts:
            if not part:
                continue
            np = self.normalize_folder_name(part)
            if np:
                out.append(np)
        return '/'.join(out)

    def get_display_name(self, normalized_name):
        return self.normalized_to_original.get(normalized_name, normalized_name)

    def export_mapping(self):
        return {
            'original_to_normalized': dict(self.original_to_normalized),
            'normalized_to_original': dict(self.normalized_to_original),
        }

    def save_mapping(self, file_path):
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(self.export_mapping(), f, ensure_ascii=False, indent=2)


def copy_readmes(source_dir, target_dir, keywords=()):
    """Copie README.md + variantes traduites (README.<lang>.md, casse libre) et le
    descripteur multilingue names.json de source_dir vers target_dir. Retourne le
    nombre de fichiers copiés."""
    source_dir = Path(source_dir)
    target_dir = Path(target_dir)
    copied = 0
    if not source_dir.is_dir():
        return copied
    pattern = re.compile(r'^readme(\.[a-z]{2})?\.md$', re.IGNORECASE)
    for fp in source_dir.iterdir():
        if fp.is_file() and pattern.match(fp.name) and not is_excluded_file(fp.name, keywords):
            target_dir.mkdir(parents=True, exist_ok=True)
            # Nom canonique README[.lang].md pour que la génération HTML les retrouve
            m = pattern.match(fp.name)
            canonical = f"README{(m.group(1) or '').lower()}.md"
            if safe_copy(fp, target_dir / canonical):
                copied += 1
    names_src = source_dir / 'names.json'
    if names_src.is_file() and not is_excluded_file(names_src.name, keywords):
        target_dir.mkdir(parents=True, exist_ok=True)
        if safe_copy(names_src, target_dir / 'names.json'):
            copied += 1
    return copied


def read_names_descriptor(folder):
    """Lit le descripteur multilingue `names.json` d'un dossier, ou {}.

    Format : {"name": {"en": "Beef", ...}, "header": {"en": "<h1>...</h1>", ...}}
    - "name"   : nom d'affichage du dossier par langue (navigation portfolio)
    - "header" : bandeau du viewer (window.sankey.header) par langue
    """
    fp = Path(folder) / 'names.json'
    if not fp.is_file():
        return {}
    try:
        with open(fp, encoding='utf-8') as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except Exception as e:
        logger.warning("names.json illisible (%s): %s", fp, e)
        return {}


def copy_root_documentation(mfa_path, public_root, keywords=()):
    """Copie README(s) racine + image_front + dossiers doc vers la racine publique."""
    mfa_path = Path(mfa_path)
    public_root = Path(public_root)
    copied = copy_readmes(mfa_path, public_root, keywords)
    for folder in ('doc', 'docs', 'documentation', 'images', 'img', 'assets',
                   'static', 'media', 'files', 'guides', 'help', 'manual'):
        src = mfa_path / folder
        if src.is_dir() and not is_excluded_dir(folder, keywords):
            try:
                dst = public_root / folder
                if dst.exists():
                    shutil.rmtree(dst)
                # Un dossier doc peut abriter des sous-dossiers/fichiers exclus.
                shutil.copytree(src, dst, ignore=_ignore_excluded(keywords))
                copied += 1
            except Exception as e:
                logger.warning("Erreur copie dossier doc %s: %s", folder, e)
    for fname in ('CHANGELOG.md', 'LICENSE', 'LICENSE.md', 'portfolio_title.txt',
                  'image_front.png', 'image_front.jpg', 'image_front.jpeg'):
        src = mfa_path / fname
        if (src.is_file() and not is_excluded_file(fname, keywords)
                and safe_copy(src, public_root / fname)):
            copied += 1
    # Titres racine traduits (portfolio_title.en.txt, ...)
    for src in mfa_path.glob('portfolio_title.*.txt'):
        if (src.is_file() and not is_excluded_file(src.name, keywords)
                and safe_copy(src, public_root / src.name)):
            copied += 1
    return copied


def copy_readme_with_mapping(mfa_data_dir, source_project_path, target_project_path,
                             target_dir, path_mapper, public_root, exclude_keywords=None):
    """Copie README.md + images + documents (.pdf/.docx/.pptx) à chaque niveau du
    chemin, vers le dossier normalisé correspondant. Porté de path_mapper.py."""
    keywords = resolve_exclude_keywords(exclude_keywords)
    mfa_path = Path(mfa_data_dir)
    public_root = Path(public_root)
    source_parts = [p for p in source_project_path.replace('\\', '/').split('/') if p]
    target_parts = [p for p in target_project_path.replace('\\', '/').split('/') if p]

    copied = copy_root_documentation(mfa_path, public_root, keywords)

    # Décalage source/cible (cas base relative)
    offset = 0
    if target_parts:
        for i, sp in enumerate(source_parts):
            if sp == target_parts[0]:
                offset = i
                break

    image_exts = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'}
    document_exts = {'.pdf', '.docx', '.pptx'}

    for i in range(1, len(target_parts) + 1):
        if offset + i > len(source_parts):
            break
        partial_target_path = '/'.join(target_parts[:i])
        partial_normalized = path_mapper.normalize_path(partial_target_path)
        full_source_path = '/'.join(source_parts[:offset + i])
        source_dir = mfa_path / full_source_path
        if not partial_normalized:
            continue
        target_norm_dir = public_root / partial_normalized

        copied += copy_readmes(source_dir, target_norm_dir, keywords)

        if source_dir.exists():
            for fp in source_dir.iterdir():
                if (fp.is_file() and fp.suffix.lower() in image_exts
                        and not is_excluded_file(fp.name, keywords)):
                    target_norm_dir.mkdir(parents=True, exist_ok=True)
                    safe_copy(fp, target_norm_dir / f"{fp.stem}{fp.suffix.lower()}")

        # Documents uniquement à la racine d'un dossier "Etude" + manifest JSON
        if source_dir.exists() and source_dir.name == 'Etude':
            manifest = []
            for fp in source_dir.iterdir():
                if (fp.is_file() and fp.suffix.lower() in document_exts
                        and not is_excluded_file(fp.name, keywords)):
                    target_norm_dir.mkdir(parents=True, exist_ok=True)
                    safe = sanitize_filename(fp.name)
                    if safe_copy(fp, target_norm_dir / safe):
                        manifest.append({'file': safe, 'label': fp.stem})
            if manifest:
                mpath = target_norm_dir / 'documents.json'
                existing = {}
                if mpath.exists():
                    try:
                        with open(mpath, encoding='utf-8') as f:
                            existing = {it['file']: it for it in json.load(f)}
                    except Exception:
                        existing = {}
                for it in manifest:
                    existing[it['file']] = it
                with open(mpath, 'w', encoding='utf-8') as f:
                    json.dump(list(existing.values()), f, ensure_ascii=False, indent=2)
    return copied


# ---------------------------------------------------------------------------
# Réécriture HTML pour compression + chargeur gz (porté de html_json_replacer.py)
# ---------------------------------------------------------------------------
def sanitize_js_variable_name(name):
    clean = re.sub(r"[^a-zA-Z0-9_]", "_", name)
    clean = re.sub(r"_+", "_", clean).strip("_")
    if clean and clean[0].isdigit():
        clean = f"var_{clean}"
    return clean or "unnamed_var"


def _check_value_in_mapping(value, file_mapping):
    variants = [
        value, value + ".gz", value + ".json", value + ".json.gz",
        value.replace(".json", "") if ".json" in value else None,
    ]
    for v in variants:
        if v and (v in file_mapping or v in file_mapping.values()):
            return True
    return False


def _normalize_all_file_references(content, file_mapping):
    if not file_mapping:
        return content
    errors = []
    # Vérifs des zones critiques (sous_filieres / assignations diagram)
    m = re.search(r"window\.sankey\.sous_filieres\s*=\s*\{([^}]+)\}", content, re.DOTALL)
    if m:
        for value in re.findall(r"'[^']+'\s*:\s*'([^']+)'", m.group(1)):
            if not _check_value_in_mapping(value, file_mapping):
                errors.append(f"sous_filieres: '{value}' absent du mapping")
    for pattern, desc in [
        (r"window\.sankey\.diagram\s*=\s*window\.sankey\[['\"](.*?)['\"]\]", "diagram"),
        (r"window\.sankey\.filiere\s*=\s*window\.sankey\[['\"](.*?)['\"]\]", "filiere"),
    ]:
        for match in re.findall(pattern, content):
            if not _check_value_in_mapping(match, file_mapping):
                errors.append(f"{desc}: '{match}' absent du mapping")
    if errors:
        for e in errors:
            logger.warning("Réf HTML non résolue: %s", e)
        return content  # ne rien remplacer si incohérence
    for original, normalized in file_mapping.items():
        original_base = original.replace(".gz", "").replace(".json", "")
        normalized_base = normalized.replace(".gz", "").replace(".json", "")
        if original_base and original_base in content:
            content = content.replace(original_base, normalized_base)
    return content


def _update_single_html(html_file):
    """Réécrit un HTML : normalise les refs, transforme les <script src=*.json>
    en chargeur asynchrone vers les .json.gz, renomme les fichiers du dossier."""
    with open(_longpath(html_file), "r", encoding="utf-8") as f:
        content = f.read()

    if "<meta charset=" not in content and "<meta http-equiv=" not in content:
        if "<head>" in content:
            content = content.replace("<head>", '<head>\n    <meta charset="utf-8">')
        elif "<head" in content:
            content = re.sub(r"(<head[^>]*>)", r'\1\n    <meta charset="utf-8">', content)

    json_script_pattern = r'<script[^>]*src="([^"]+\.(?:json(?:\.gz)?|gz))"[^>]*></script>'
    json_scripts = re.findall(json_script_pattern, content)

    # Mapping de normalisation de tous les fichiers du dossier + renommage physique
    file_mapping = {}
    target_dir = html_file.parent
    for file_path in target_dir.rglob("*"):
        if file_path.is_file() and file_path != html_file:
            original = file_path.name
            normalized = sanitize_filename(original)
            file_mapping[original] = normalized
            if original != normalized:
                try:
                    new_path = file_path.parent / normalized
                    counter = 1
                    while new_path.exists() and new_path != file_path:
                        stem = Path(normalized).stem
                        suffix = Path(normalized).suffix
                        conflict = f"{stem}_{counter}{suffix}"
                        new_path = file_path.parent / conflict
                        file_mapping[original] = conflict
                        normalized = conflict
                        counter += 1
                    os.rename(_longpath(file_path), _longpath(new_path))
                except Exception as e:
                    logger.warning("Erreur renommage %s: %s", original, e)
                    file_mapping.pop(original, None)

    content = _normalize_all_file_references(content, file_mapping)

    # Construire la liste des fichiers JSON normalisés + leur extension cible
    json_files = []
    json_extensions = {}
    for src in json_scripts:
        if src.endswith(".json.gz") or src.endswith(".json"):
            ext_to_add = ".json.gz"
        elif src.endswith(".gz"):
            ext_to_add = ".gz"
        else:
            ext_to_add = ".json.gz"
        parts = src.split("/")
        normalized_parts = []
        for i, part in enumerate(parts):
            normalized_part = part
            variants = [part + ".gz", part] if i == len(parts) - 1 else [part]
            for variant in variants:
                if variant in file_mapping:
                    normalized_part = (
                        file_mapping[variant]
                        .replace(".json.gz", "").replace(".json", "").replace(".gz", "")
                    )
                    break
            normalized_parts.append(normalized_part)
        normalized_path = "/".join(normalized_parts)
        json_files.append(normalized_path)
        json_extensions[normalized_path] = ext_to_add

    # Supprimer les anciens <script src=*.json> (noms originaux et normalisés)
    all_json_names = json_scripts + [file_mapping.get(s, s) for s in json_scripts]
    for json_src in set(all_json_names):
        pattern = f'<script[^>]*src="{re.escape(json_src)}"[^>]*></script>'
        content = re.sub(pattern, "", content)

    # Supprimer l'assignation directe window.sankey.diagram = window.sankey['..']
    diagram_assignment = (
        r"<script>\s*window\.sankey\.diagram\s*=\s*"
        r"window\.sankey\[(?:\"[^\"]*\"|'[^']*')\]\s*</script>\s*"
    )
    content = re.sub(diagram_assignment, "", content)

    if json_files:
        loading_calls = []
        for i, base_name in enumerate(json_files):
            var_name = base_name.split("/")[-1]
            safe_var = sanitize_js_variable_name(var_name)
            ext_to_add = json_extensions.get(base_name, ".json.gz")
            if i == 0:
                loading_calls.append(
                    f"\n    window.sankey.diagram = '{safe_var}{ext_to_add}'"
                    f"\n    window.sankey['{var_name}'] = '{safe_var}{ext_to_add}'"
                )
            else:
                loading_calls.append(
                    f"\n    window.sankey['{var_name}'] = '{safe_var}{ext_to_add}'"
                )
        script_code = "\n  <script>" + "".join(loading_calls) + "\n  </script>"
        if "</body>" in content:
            content = content.replace("</body>", f"{script_code}\n</body>")

    with open(_longpath(html_file), "w", encoding="utf-8") as f:
        f.write(content)


def _update_html_for_compression(target_dir):
    for html_file in Path(target_dir).resolve().rglob("*.html"):
        try:
            _update_single_html(html_file)
        except Exception as e:
            logger.warning("Erreur réécriture %s: %s", html_file, e)


# ---------------------------------------------------------------------------
# Détection / copie des assets compilés (NOUVEAU vs script legacy)
# ---------------------------------------------------------------------------
def _find_main_asset(directory, prefix, suffix):
    """Retrouve le bundle hashé main.<hash>.<ext> dans un dossier."""
    if not directory.exists():
        return None
    # Exact "main.<hash>.js" en priorité, sinon premier "main*.js" non-chunk.
    candidates = [
        p for p in directory.glob(f"{prefix}.*{suffix}")
        if not p.name.endswith(".map") and ".chunk." not in p.name
    ]
    if not candidates:
        candidates = [
            p for p in directory.glob(f"{prefix}*{suffix}")
            if not p.name.endswith(".map") and ".chunk." not in p.name
        ]
    return candidates[0] if candidates else None


def copy_build_assets(build_dir, target_dir):
    """Copie TOUT le build statique (tous les chunks) + meta dans l'artifact,
    et renvoie le mapping {js, css} vers les bundles main hashés.

    Indispensable car le build CRA est code-splité : ne copier que main.js
    casserait le lazy-loading des chunks. Les .map sont exclus (poids inutile)."""
    build_path = Path(build_dir)
    target_path = Path(target_dir)
    assets = {}

    src_static = build_path / "static"
    if src_static.exists():
        shutil.copytree(
            src_static,
            target_path / "static",
            dirs_exist_ok=True,
            ignore=shutil.ignore_patterns("*.map"),
        )
    # meta/ : favicons + manifest référencés par le template build
    src_meta = build_path / "meta"
    if src_meta.exists():
        shutil.copytree(src_meta, target_path / "meta", dirs_exist_ok=True)

    # Logos OpenSankey : l'UI les référence selon deux conventions —
    #  - 'logos/logo_opensankey.png' (chemin configuré, topbar...)
    #  - 'logo_opensankey.png' à la RACINE (bouton "Editer dans OpenSankey",
    #    cf. MenuTop <Image src='logo_opensankey.png'>).
    # On fournit les deux, sinon le logo manque (surtout sur l'étude courante).
    src_logos = build_path / "logos"
    if src_logos.exists():
        shutil.copytree(src_logos, target_path / "logos", dirs_exist_ok=True)
        for logo_name in ("logo_opensankey.png", "logo_opensankeyplus.png"):
            src_logo = src_logos / logo_name
            if src_logo.is_file():
                safe_copy(src_logo, target_path / logo_name)

    main_js = _find_main_asset(target_path / "static" / "js", "main", ".js")
    main_css = _find_main_asset(target_path / "static" / "css", "main", ".css")
    if main_js:
        assets["js"] = f"static/js/{main_js.name}"
    if main_css:
        assets["css"] = f"static/css/{main_css.name}"
    return assets


def _update_js_css_references(index_file, assets):
    """Remplace les placeholders du template viewer par les vrais bundles."""
    with open(index_file, "r", encoding="utf-8") as f:
        content = f.read()
    original = content
    if "css" in assets:
        content = content.replace("static/css/maincss", assets["css"])
    if "js" in assets:
        content = content.replace("static/js/mainjs", assets["js"])
    if content != original:
        with open(index_file, "w", encoding="utf-8") as f:
            f.write(content)


def _adapt_project_index(project_dir, final_dir, build_dir):
    source_index = project_dir / "index.html"
    dest_index = final_dir / "index.html"
    if not safe_copy(source_index, dest_index):
        raise RuntimeError("Échec copie index.html")
    assets = copy_build_assets(build_dir, final_dir)
    if assets:
        _update_js_css_references(dest_index, assets)
    else:
        logger.warning("Aucun asset compilé trouvé dans %s", build_dir)


# ---------------------------------------------------------------------------
# Extraction des fichiers référencés (porté de sankey_publish.py)
# ---------------------------------------------------------------------------
def _is_local_file(url):
    if not url or not isinstance(url, str):
        return False
    if url.startswith(("http://", "https://", "//", "data:", "javascript:", "mailto:")):
        return False
    if "%PUBLIC_URL%" in url or url.startswith("#"):
        return False
    if url.startswith("/") and not url.startswith("./"):
        return False
    if url.strip() in ("", "mainjs", "maincss"):
        return False
    return True


def _clean_path(file_path):
    if not isinstance(file_path, str):
        return str(file_path)
    file_path = unquote(file_path).lstrip("./").replace("\\", "/")
    return file_path


_IGNORED_FILES = {"static/css/maincss", "static/js/mainjs", "logo_terriflux.png"}
_COMMON_EXT = [
    ".json", ".gz", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".pdf",
    ".xlsx", ".xls", ".docx", ".pptx", ".zip", ".ico", ".css", ".js",
]


def _extract_referenced_files(html_file_path):
    try:
        with open(html_file_path, "r", encoding="utf-8") as f:
            html_content = f.read()
    except Exception:
        return []

    referenced = set()

    def add(file_path):
        if _is_local_file(file_path) and _clean_path(file_path) not in _IGNORED_FILES:
            referenced.add(_clean_path(file_path))

    for pat in [
        r'<script[^>]*src\s*=\s*(?:"([^"]+)"|\'([^\']+)\')[^>]*>',
        r'<link[^>]*href\s*=\s*(?:"([^"]+)"|\'([^\']+)\')[^>]*>',
        r'<img[^>]*src\s*=\s*(?:"([^"]+)"|\'([^\']+)\')[^>]*>',
    ]:
        for m in re.finditer(pat, html_content, re.IGNORECASE):
            add(m.group(1) if m.group(1) is not None else m.group(2))

    for pat in [
        r"window\.sankey\.logo\s*=\s*['\"]([^'\"]+)['\"]",
        r"window\.sankey\.excel\s*=\s*['\"]([^'\"]+)['\"]",
        r"window\.sankey\.background\s*=\s*['\"]([^'\"]+)['\"]",
        r"window\.sankey\.favicon\s*=\s*['\"]([^'\"]+)['\"]",
    ]:
        for m in re.finditer(pat, html_content, re.IGNORECASE):
            add(m.group(1))

    for ext in _COMMON_EXT:
        ext_esc = re.escape(ext)
        for m in re.finditer(r'"([^"]*' + ext_esc + r')"', html_content, re.IGNORECASE):
            add(m.group(1))
        for m in re.finditer(r"'([^']*" + ext_esc + r")'", html_content, re.IGNORECASE):
            add(m.group(1))

    for pat in [
        r'(?:"([^"]+\.(?:json|xlsx?|png|jpg|jpeg|gif|svg))")',
        r"(?:'([^']+\.(?:json|xlsx?|png|jpg|jpeg|gif|svg))')",
    ]:
        for m in re.finditer(pat, html_content, re.IGNORECASE):
            ref = next((g for g in m.groups() if g is not None), None)
            if ref is None:
                continue
            if not any(ref.lower().endswith(e) for e in _COMMON_EXT):
                ref += ".json"
            add(ref)

    return sorted(referenced)


def _copy_json_smart(project_dir, final_dir, json_ref):
    gz_source = project_dir / (json_ref + ".gz")
    json_source = project_dir / json_ref
    json_dest = final_dir / json_ref
    json_dest.parent.mkdir(parents=True, exist_ok=True)
    if gz_source.is_file():
        return safe_copy(gz_source, final_dir / (json_ref + ".gz"))
    if json_source.is_file():
        return safe_copy(json_source, json_dest)
    return False


def _copy_case_insensitive(project_dir, final_dir, file_ref):
    source = project_dir / file_ref
    if source.is_file():
        dest = final_dir / file_ref
        dest.parent.mkdir(parents=True, exist_ok=True)
        return safe_copy(source, dest)
    try:
        if "/" in file_ref or "\\" in file_ref:
            fp = Path(file_ref)
            search_dir = project_dir / fp.parent
            filename = fp.name
        else:
            search_dir = project_dir
            filename = file_ref
        if not search_dir.exists():
            return False
        filename_lower = filename.lower()
        for existing in search_dir.iterdir():
            if existing.is_file() and existing.name.lower() == filename_lower:
                dest = final_dir / file_ref
                dest.parent.mkdir(parents=True, exist_ok=True)
                return safe_copy(existing, dest)
        # Fallback élisions françaises ("Vue ensemble" vs "Vue d'ensemble")
        norm = re.sub(r"\w'", "", filename).lower()
        for existing in search_dir.iterdir():
            if existing.is_file() and re.sub(r"\w'", "", existing.name).lower() == norm:
                dest = final_dir / file_ref
                dest.parent.mkdir(parents=True, exist_ok=True)
                return safe_copy(existing, dest)
    except Exception as e:
        logger.warning("Erreur recherche %s: %s", file_ref, e)
    return False


def _is_excluded_ref(ref, keywords):
    """True si un chemin référencé par le HTML traverse un dossier exclu ou porte
    lui-même un mot-clé (ex. `window.sankey.excel` -> ..._reconciled.xlsx)."""
    parts = [p for p in ref.replace("\\", "/").split("/") if p]
    if not parts:
        return False
    return (any(is_excluded_dir(p, keywords) for p in parts[:-1])
            or is_excluded_file(parts[-1], keywords))


def _copy_referenced_files(project_dir, final_dir, html_file_path, keywords=()):
    copied = 0
    for ref in _extract_referenced_files(html_file_path):
        if _is_excluded_ref(ref, keywords):
            vprint(f"Exclu de la publication (mot-clé) : {ref}", 2)
            continue
        if ref.endswith(".json"):
            ok = _copy_json_smart(project_dir, final_dir, ref)
        else:
            ok = _copy_case_insensitive(project_dir, final_dir, ref)
        if ok:
            copied += 1
        else:
            logger.warning("Fichier référencé introuvable: %s", ref)
    return copied


def _copy_excel_files(project_dir, final_dir, keywords=()):
    copied = 0
    for root, dirs, files in os.walk(project_dir):
        # os.walk en top-down : élaguer `dirs` sur place empêche la descente.
        dirs[:] = [d for d in dirs if not is_excluded_dir(d, keywords)]
        for file in files:
            if (Path(file).suffix.lower() in (".xlsx", ".xls")
                    and not is_excluded_file(file, keywords)):
                source = Path(root) / file
                try:
                    rel = source.relative_to(project_dir)
                    dest = final_dir / rel
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    if safe_copy(source, dest):
                        copied += 1
                except Exception as e:
                    logger.warning("Erreur copie excel %s: %s", file, e)
    return copied


def _copy_logos(source_dir, target_dir, keywords=()):
    copied = 0
    for _root, dirs, files in os.walk(source_dir):
        dirs[:] = [d for d in dirs if not is_excluded_dir(d, keywords)]
        for file in files:
            if (os.path.splitext(file.lower())[1] in (".png", ".jpg", ".jpeg")
                    and not is_excluded_file(file, keywords)):
                if safe_copy(Path(source_dir) / file, Path(target_dir) / file.lower()):
                    copied += 1
    return copied


def _compress_json_files(target_dir):
    """Compresse chaque .json en .json.gz (compact) et supprime l'original."""
    target_path = Path(target_dir)
    for json_file in target_path.glob("*.json"):
        if json_file.name == "resources.json":
            continue
        gz_file = json_file.with_suffix(".json.gz")
        if gz_file.exists():
            continue
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            with gzip.open(gz_file, "wt", encoding="utf-8") as f:
                json.dump(data, f, separators=(",", ":"), ensure_ascii=False)
            json_file.unlink()
        except Exception as e:
            logger.warning("Erreur compression %s: %s", json_file.name, e)


# ---------------------------------------------------------------------------
# Pipeline principal
# ---------------------------------------------------------------------------
_SERVER_BAT = r"""@echo off
rem Sert le site en local : un site Sankey charge ses donnees (.json.gz) par fetch,
rem ce qui est INTERDIT en file:// -> il faut un petit serveur HTTP.
rem On utilise PowerShell (present sur tout Windows, aucune installation) plutot que
rem Python : "where python" trouverait l'alias Microsoft Store et echouerait au double-clic.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
if %errorlevel% neq 0 (
  echo.
  echo Echec du demarrage du serveur PowerShell.
  echo Alternative si Python est installe : python -m http.server 8000
  echo puis ouvrez http://localhost:8000
  pause
)
"""

# Serveur HTTP statique en PowerShell pur (TcpListener) : present sur tout
# Windows, sans admin ni installation. Sert le dossier courant ; ne fixe JAMAIS
# Content-Encoding (les .json.gz sont decompresses par l'app, pas par le navigateur).
_SERVE_PS1 = r"""$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootFull = [System.IO.Path]::GetFullPath($root)

$mimes = @{
  '.html'='text/html'; '.htm'='text/html'; '.js'='text/javascript'; '.mjs'='text/javascript';
  '.css'='text/css'; '.json'='application/json'; '.gz'='application/gzip'; '.map'='application/json';
  '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.gif'='image/gif';
  '.svg'='image/svg+xml'; '.ico'='image/x-icon'; '.webmanifest'='application/manifest+json';
  '.woff'='font/woff'; '.woff2'='font/woff2'; '.ttf'='font/ttf';
  '.pdf'='application/pdf'; '.txt'='text/plain';
  '.xlsx'='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

$port = 8000
$listener = $null
while ($port -lt 8100) {
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
    $listener.Start()
    break
  } catch { $listener = $null; $port++ }
}
if (-not $listener) { Write-Host 'Aucun port libre (8000-8099).'; Read-Host 'Entree pour fermer'; exit 1 }

$url = "http://localhost:$port/"
Write-Host ''
Write-Host '  Site Sankey - serveur local (PowerShell)'
Write-Host "  Ouvrez : $url"
Write-Host '  (laissez cette fenetre ouverte ; fermez-la pour arreter)'
Write-Host ''
Start-Process $url

while ($true) {
  $client = $listener.AcceptTcpClient()
  $stream = $client.GetStream()
  try {
    $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII)
    $requestLine = $reader.ReadLine()
    while ($true) { $h = $reader.ReadLine(); if ($null -eq $h -or $h -eq '') { break } }
    if ($requestLine) {
      $parts = $requestLine.Split(' ')
      $target = if ($parts.Length -ge 2) { $parts[1] } else { '/' }
      $target = $target.Split('?')[0]
      $rel = [System.Uri]::UnescapeDataString($target.TrimStart('/'))
      if ([string]::IsNullOrEmpty($rel)) { $rel = 'index.html' }
      $rel = $rel.Replace('/', '\')
      $full = [System.IO.Path]::GetFullPath((Join-Path $root $rel))
      if (-not $full.StartsWith($rootFull)) {
        $body = [System.Text.Encoding]::UTF8.GetBytes('403')
        $head = "HTTP/1.1 403 Forbidden`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      } elseif (Test-Path $full -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($full).ToLower()
        $ct = $mimes[$ext]; if (-not $ct) { $ct = 'application/octet-stream' }
        $body = [System.IO.File]::ReadAllBytes($full)
        $head = "HTTP/1.1 200 OK`r`nContent-Type: $ct`r`n"
        $head += "Content-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      } else {
        $body = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
        $head = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`n"
        $head += "Content-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      }
      $hb = [System.Text.Encoding]::ASCII.GetBytes($head)
      $stream.Write($hb, 0, $hb.Length)
      $stream.Write($body, 0, $body.Length)
      $stream.Flush()
    }
  } catch {
  } finally {
    try { $client.Close() } catch {}
  }
}
"""

_SERVER_SH = """#!/bin/sh
# Sert le site en local : un site Sankey charge ses donnees (.json.gz) par fetch,
# ce qui est INTERDIT en file:// -> il faut un petit serveur HTTP.
cd "$(dirname "$0")" || exit 1
PORT=8000
echo ""
echo "  Site Sankey - serveur local"
echo "  Ouvrez : http://localhost:$PORT"
echo "  (laissez ce terminal ouvert ; Ctrl+C pour arreter)"
echo ""
( sleep 1; (xdg-open "http://localhost:$PORT" || open "http://localhost:$PORT") >/dev/null 2>&1 ) &
python3 -m http.server "$PORT" || python -m http.server "$PORT"
"""

_README_TXT = """Site Sankey autonome
====================

IMPORTANT : n'ouvrez PAS index.html directement (double-clic / file://).
Le diagramme charge ses donnees (.json.gz) via une requete reseau, bloquee
par les navigateurs en file://. Vous verriez alors une erreur
"NetworkError when attempting to fetch resource".

Pour visualiser le site :

  - Windows : double-cliquez sur server.bat
      (serveur PowerShell integre : AUCUNE installation requise)
  - macOS / Linux : ./server.sh  (Python3 est preinstalle)

Le navigateur s'ouvre automatiquement sur http://localhost:8000
(ou le premier port libre).

Alternative : deposez ce dossier sur n'importe quel hebergement web statique
(GitLab/GitHub Pages, Netlify, un serveur Apache/nginx...) et ouvrez l'URL.
"""


def _write_local_servers(final_dir):
    """Ajoute des lanceurs de serveur HTTP local + un README dans l'artifact,
    car le site charge ses .json.gz par fetch (impossible en file://)."""
    final_dir = Path(final_dir)
    with open(final_dir / "server.bat", "w", encoding="utf-8", newline="\r\n") as f:
        f.write(_SERVER_BAT)
    with open(final_dir / "serve.ps1", "w", encoding="utf-8", newline="\r\n") as f:
        f.write(_SERVE_PS1)
    sh_path = final_dir / "server.sh"
    with open(sh_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(_SERVER_SH)
    try:
        os.chmod(sh_path, 0o755)
    except Exception:
        pass
    (final_dir / "LISEZ-MOI.txt").write_text(_README_TXT, encoding="utf-8")


def _builds_root():
    """Racine des dossiers de build (répertoires de travail des publications).

    Volontairement HORS de /tmp : ce dernier peut être purgé par le système à
    tout moment et n'est pas dimensionné pour ce volume (un build pèse de 30 Mo
    à ~1 Go). Surchargeable par SANKEY_BUILDS_DIR ; sinon ~/sankey_builds
    (= /home/ubuntu/sankey_builds quand le process Flask tourne en `ubuntu`)."""
    env = os.environ.get("SANKEY_BUILDS_DIR")
    return Path(env) if env else Path.home() / "sankey_builds"


def _artifacts_base():
    base = _builds_root()
    d = base / f"build_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
    d.mkdir(parents=True, exist_ok=True)
    return d


def cleanup_build_dir(artifact_dir):
    """Supprime le dossier de build `build_<timestamp>` contenant l'artifact et
    son zip. Les builds sont des répertoires de travail jetables une fois le zip
    envoyé / l'étude déployée : on les supprime immédiatement pour éviter toute
    accumulation sur le disque. À appeler APRÈS la fin du streaming du zip
    (cf. Response.call_on_close) ou en fin de déploiement.

    Garde-fou : ne supprime que si le parent s'appelle bien `build_<...>`."""
    try:
        build_dir = Path(artifact_dir).parent
        if build_dir.name.startswith("build_"):
            shutil.rmtree(build_dir, ignore_errors=True)
    except Exception as e:
        logger.warning("Échec nettoyage du dossier de build %s: %s", artifact_dir, e)


def _inject_header_i18n(source_dir, final_index):
    """Injecte `window.sankey.header_i18n` dans l'index viewer publié si le dossier
    source (ou son parent) porte un names.json avec des traductions de "header".
    Le front résout header_i18n[langue] avant window.sankey.header (PublishOptions)."""
    source_dir = Path(source_dir)
    headers = {}
    for folder in (source_dir, source_dir.parent):
        data = read_names_descriptor(folder)
        h = data.get('header')
        if isinstance(h, dict) and h:
            headers = {k: v for k, v in h.items() if isinstance(v, str)}
            break
    if not headers:
        return
    final_index = Path(final_index)
    if not final_index.is_file():
        return
    try:
        with open(_longpath(final_index), 'r', encoding='utf-8') as f:
            content = f.read()
        if 'header_i18n' in content:
            return
        payload = json.dumps(headers, ensure_ascii=False).replace('</', '<\\/')
        # Après `window.sankey = {…}` si présent (l'assignation écraserait une
        # injection antérieure), sinon avant </body>.
        assign = re.search(r'window\.sankey\s*=\s*\{[^;<]*\}\s*;?', content)
        if assign:
            insert_at = assign.end()
            content = (content[:insert_at]
                       + f'\n    window.sankey.header_i18n = {payload};'
                       + content[insert_at:])
        elif '</body>' in content:
            script = (
                '  <script>window.sankey = window.sankey || {}; '
                f'window.sankey.header_i18n = {payload};</script>\n'
            )
            content = content.replace('</body>', script + '</body>', 1)
        else:
            return
        with open(_longpath(final_index), 'w', encoding='utf-8') as f:
            f.write(content)
        vprint(f"🌐 header_i18n injecté ({', '.join(sorted(headers))}) dans {final_index.name}", 2)
    except Exception as e:
        logger.warning("Injection header_i18n échouée (%s): %s", final_index, e)


def publish_folder(project_dir, build_dir, publish_name=None, artifacts_base=None,
                   final_dir=None, write_servers=True, exclude_keywords=None):
    """Publie un dossier source (contenant index.html viewer + data) en artifact
    statique autonome. Renvoie le chemin du dossier artifact créé.

    project_dir   : dossier source contenant l'index.html viewer.
    build_dir     : client/build (assets compilés).
    final_dir     : si fourni, écrit l'artifact dans CE dossier exact (utilisé par
                    la génération d'arborescence) au lieu de <base>/<publish_name>.
    write_servers : ajoute les lanceurs locaux (server.bat/...). Désactivé pour les
                    sous-projets d'une arborescence (lanceurs uniquement à la racine).
    exclude_keywords : mots-clés d'exclusion appliqués aux fichiers et dossiers du
                    dossier source (cf. resolve_exclude_keywords). L'index.html
                    viewer et les assets compilés n'y sont jamais soumis : ils font
                    le site, pas son contenu.
    """
    keywords = resolve_exclude_keywords(exclude_keywords)
    project_dir = Path(project_dir)
    index_html = project_dir / "index.html"
    if not index_html.exists():
        # Règle "Résultats unique" : un seul sous-dossier nommé Résultats -> l'utiliser
        subdirs = [d for d in project_dir.iterdir() if d.is_dir()]
        if len(subdirs) == 1:
            name = re.sub(r"^\d+\s+", "", subdirs[0].name)
            name = "".join(
                c for c in unicodedata.normalize("NFD", name)
                if unicodedata.category(c) != "Mn"
            ).lower()
            if name == "resultats" and (subdirs[0] / "index.html").exists():
                project_dir = subdirs[0]
                index_html = project_dir / "index.html"
    if not index_html.exists():
        raise FileNotFoundError(f"index.html introuvable dans {project_dir}")

    if not publish_name:
        publish_name = project_dir.name
    publish_name = re.sub(r"[^\w\-_.]", "_", publish_name) or "sankey_site"

    if final_dir is not None:
        final_dir = Path(final_dir)
    else:
        base = Path(artifacts_base) if artifacts_base else _artifacts_base()
        final_dir = base / publish_name
    if final_dir.exists():
        shutil.rmtree(final_dir)
    final_dir.mkdir(parents=True, exist_ok=True)

    _copy_logos(project_dir, final_dir, keywords)
    for aux in (".stamped", "resources.json"):
        src = project_dir / aux
        if src.is_file():
            safe_copy(src, final_dir / aux)

    _adapt_project_index(project_dir, final_dir, build_dir)
    _inject_header_i18n(project_dir, final_dir / "index.html")
    _copy_referenced_files(project_dir, final_dir, index_html, keywords)
    _copy_excel_files(project_dir, final_dir, keywords)
    _update_html_for_compression(final_dir)
    normalize_files_and_update_html(final_dir)
    _compress_json_files(final_dir)
    if write_servers:
        _write_local_servers(final_dir)
    return str(final_dir)


def publish_tree(parent_dir, build_dir, publish_name=None, artifacts_base=None,
                 build_info=None, exclude_keywords=None):
    """Publie une ARBORESCENCE (portfolio) : tous les sous-dossiers contenant un
    index.html viewer sous parent_dir, avec pages de navigation/README à chaque
    niveau (remplace gitlab_pipeline + generate_html de MFAData).

    Renvoie le chemin du dossier public généré.

    NB : avec le build React code-splité (publicPath relatif), les assets compilés
    sont recopiés dans chaque projet (pas de partage racine possible sans rebuild)."""
    from . import publish_html

    keywords = resolve_exclude_keywords(exclude_keywords)
    parent_dir = Path(parent_dir)
    base = Path(artifacts_base) if artifacts_base else _artifacts_base()
    pub_name = re.sub(r"[^\w\-_.]", "_", publish_name or parent_dir.name) or "portfolio"
    public_dir = base / pub_name
    if public_dir.exists():
        shutil.rmtree(public_dir)
    public_dir.mkdir(parents=True, exist_ok=True)

    mapper = PathMapper()
    projects = find_index_folders(str(parent_dir), exclude_keywords=keywords)
    if (parent_dir / "index.html").exists():
        projects = ["."] + projects
    if not projects:
        raise FileNotFoundError(
            f"Aucun dossier avec index.html sous {parent_dir}"
        )

    published = 0
    for rel in projects:
        proj_abs = parent_dir if rel == "." else parent_dir / rel
        norm = "" if rel == "." else mapper.normalize_path(rel)
        target = public_dir if not norm else public_dir / norm
        try:
            publish_folder(proj_abs, build_dir, final_dir=target, write_servers=False,
                           exclude_keywords=keywords)
            published += 1
        except Exception as e:
            logger.warning("Échec publication projet %s: %s", rel, e)
            continue
        src_rel = "" if rel == "." else rel
        copy_readme_with_mapping(str(parent_dir), src_rel, src_rel, target, mapper, public_dir,
                                 exclude_keywords=keywords)

    if published == 0:
        raise RuntimeError("Aucun projet publié dans l'arborescence")

    # Miniatures des cartes : capter la 1ʳᵉ vue du diagramme là où aucun
    # image_front.* n'a été déposé à la main (fallback rétro-compatible). À faire
    # AVANT generate_all_index_pages, qui renomme les index.html viewer en
    # diagrams.html (ici, chaque index.html est encore un viewer rendable). Isolé
    # et sans échec dur : un environnement sans Playwright/Chromium publie comme
    # avant (cartes sans image).
    try:
        from . import publish_thumbnails
        n_thumbs = publish_thumbnails.generate_missing_thumbnails(str(public_dir))
        if n_thumbs:
            logger.info("%d miniature(s) de carte générée(s) depuis le JSON.", n_thumbs)
    except Exception as e:
        logger.warning("Génération des miniatures ignorée: %s", e)

    # Pages de navigation + README (renomme chaque index.html viewer en diagrams.html)
    publish_html.generate_all_index_pages(str(public_dir), build_info or "portfolio", mapper)
    _write_local_servers(public_dir)
    return str(public_dir)


def _build_viewer_index(title, data_basename, options):
    """Génère un index.html viewer au format intermédiaire attendu par le pipeline.

    Toutes les options viewer (cf. SankeyGlobals / getPublishOptions côté client)
    sont passées génériquement via `options['globals']` (dict). On émet un unique
    objet `window.sankey = {...}` ; `publish` est toujours forcé à true. Le logo
    éventuel (fichier uploadé) est injecté ici comme `logo`."""
    glob = dict(options.get("globals") or {})
    glob["publish"] = True
    if options.get("logo_filename"):
        glob["logo"] = options["logo_filename"]
        if options.get("logo_width"):
            try:
                glob["logo_width"] = int(options["logo_width"])
            except (TypeError, ValueError):
                pass
    # JSON inline dans une <script> : neutraliser tout </script> ou balise HTML.
    payload = json.dumps(glob, ensure_ascii=False).replace("</", "<\\/")
    lines = [
        "<!DOCTYPE html>",
        "<html>",
        "<head>",
        '  <meta charset="utf-8">',
        f"  <title>{html_escape(title)}</title>",
        '  <script defer src="static/js/mainjs"></script>',
        '  <link href="static/css/maincss" rel="stylesheet">',
        "</head>",
        "<body>",
        "  <script>",
        f"window.sankey = {payload}",
        "  </script>",
        f'  <script src="{data_basename}.json"></script>',
        f"  <script>window.sankey.diagram = window.sankey['{data_basename}']</script>",
        '  <div id="react-container"></div>',
        "</body>",
        "</html>",
    ]
    return "\n".join(lines)


def html_escape(s):
    return (
        str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    )


def publish_current_study(diagram_json, build_dir, options=None, artifacts_base=None):
    """Publie l'étude ouverte (JSON fourni par le front) en artifact statique.

    diagram_json : str (JSON brut) ou dict du diagramme (app_data.toJSON()).
    options : { publish_name, header, toolbar, editable, recenter,
                logo_filename, logo_bytes, logo_width }
    """
    options = options or {}
    publish_name = re.sub(r"[^\w\-_.]", "_", options.get("publish_name") or "sankey") or "sankey"
    data_basename = sanitize_js_variable_name(publish_name) or "diagram"

    base = Path(artifacts_base) if artifacts_base else _artifacts_base()
    source_dir = base / f"_src_{publish_name}"
    if source_dir.exists():
        shutil.rmtree(source_dir)
    source_dir.mkdir(parents=True, exist_ok=True)

    # data JSON brut
    if isinstance(diagram_json, (dict, list)):
        diagram_text = json.dumps(diagram_json, ensure_ascii=False)
    else:
        diagram_text = str(diagram_json)
    with open(source_dir / f"{data_basename}.json", "w", encoding="utf-8") as f:
        f.write(diagram_text)

    # logo éventuel
    if options.get("logo_bytes") and options.get("logo_filename"):
        try:
            with open(source_dir / options["logo_filename"], "wb") as f:
                f.write(options["logo_bytes"])
        except Exception as e:
            logger.warning("Erreur écriture logo: %s", e)
            options.pop("logo_filename", None)

    title = options.get("header") or (options.get("globals") or {}).get("header") or publish_name
    with open(source_dir / "index.html", "w", encoding="utf-8") as f:
        f.write(_build_viewer_index(title, data_basename, options))

    # exclude_keywords=[] : le dossier source est SYNTHÉTISÉ ici (données + index +
    # logo) et ne contient rien à filtrer. Laisser jouer les défauts métier ferait
    # dépendre la publication du nom choisi par l'utilisateur (une étude nommée
    # « Documents » y perdrait son propre JSON de données).
    return publish_folder(source_dir, build_dir, publish_name=publish_name,
                          artifacts_base=base, exclude_keywords=[])


def zip_artifact(artifact_dir, zip_basename=None):
    """Zippe le dossier artifact et renvoie le chemin du .zip."""
    artifact_dir = Path(artifact_dir)
    zip_basename = zip_basename or artifact_dir.name
    out_base = artifact_dir.parent / zip_basename
    # make_archive ajoute .zip ; archive le contenu du dossier à la racine du zip
    zip_path = shutil.make_archive(str(out_base), "zip", root_dir=str(artifact_dir))
    return zip_path


# ---------------------------------------------------------------------------
# Déploiement en ligne (porté de sankey_deploy.py : scp + ssh unzip)
# ---------------------------------------------------------------------------
def get_deploy_config():
    """Config du serveur de déploiement des portfolios (terriflux.com/portfolios).

    Par défaut = dépôt LOCAL : l'app tourne sur le VPS qui héberge lui-même
    terriflux.com/portfolios (dossier servi par nginx), donc on copie l'artefact
    directement dans `path` sans scp/ssh. Renseigner SANKEY_DEPLOY_HOST avec un
    hôte distant (ancien OVH…) rebascule en mode scp/ssh. L'auth SSH distante se
    fait via la clé ~/.ssh du process Flask (ou SANKEY_DEPLOY_KEY). Mettre
    SANKEY_DEPLOY_OFF à "1" pour désactiver (le bouton est alors masqué)."""
    if os.environ.get("SANKEY_DEPLOY_OFF") == "1":
        return None
    host = os.environ.get("SANKEY_DEPLOY_HOST", "").strip()
    # local si aucun hôte distant explicite n'est fourni
    local = host in ("", "local", "localhost", "127.0.0.1")
    return {
        "local": local,
        "host": host or "localhost",
        "user": os.environ.get("SANKEY_DEPLOY_USER", "ubuntu"),
        "path": os.environ.get("SANKEY_DEPLOY_PATH", "/home/ubuntu/portfolios"),
        "key": os.environ.get("SANKEY_DEPLOY_KEY") or None,
        "port": os.environ.get("SANKEY_DEPLOY_PORT") or "22",
        "url_base": (os.environ.get("SANKEY_DEPLOY_URL_BASE")
                     or "https://terriflux.com/portfolios").rstrip("/"),
    }


def _merge_tree(src, dst, skip_rel=frozenset()):
    """Copie récursive de src dans dst, en sautant les sous-arbres `skip_rel`
    (chemins relatifs à dst). Utilisé par le mode update local pour préserver
    les études déjà en ligne (dossiers avec diagrams.html)."""
    import shutil
    skip = {os.path.normpath(p) for p in skip_rel}

    def is_skipped(rel):
        rel = os.path.normpath(rel)
        return any(rel == s or rel.startswith(s + os.sep) for s in skip)

    for root, dirs, files in os.walk(src):
        rel_root = os.path.relpath(root, src)
        if rel_root != "." and is_skipped(rel_root):
            dirs[:] = []  # ne pas descendre dans une étude préservée
            continue
        target_root = dst if rel_root == "." else os.path.join(dst, rel_root)
        os.makedirs(target_root, exist_ok=True)
        for f in files:
            rel_f = f if rel_root == "." else os.path.join(rel_root, f)
            if is_skipped(rel_f):
                continue
            shutil.copy2(os.path.join(root, f), os.path.join(target_root, f))


def _deploy_local(artifact_dir, slug, config, force=False, update=False):
    """Déploiement LOCAL : l'app et les portfolios sont sur la même machine.
    Copie l'artefact dans <path>/<slug> sans scp/ssh, même sémantique que le
    mode distant (force = archive daté dans versions/ ; update = fusion additive
    préservant les études en ligne). Renvoie l'URL publique."""
    import shutil
    from datetime import datetime
    path = config["path"]
    dest = os.path.join(path, slug)
    os.makedirs(path, exist_ok=True)

    if update:
        if os.path.isdir(dest):
            # Préserver les études déjà en ligne (dossiers contenant diagrams.html)
            preserved = set()
            for root, _dirs, files in os.walk(dest):
                if "diagrams.html" in files:
                    rel = os.path.relpath(root, dest)
                    if rel != ".":
                        preserved.add(rel)
            _merge_tree(artifact_dir, dest, skip_rel=preserved)
        else:
            shutil.copytree(artifact_dir, dest)
    else:
        if os.path.isdir(dest):
            if not force:
                raise RuntimeError(
                    f"Le dossier « {slug} » existe déjà en ligne. "
                    "Cochez « Remplacer » pour l'écraser (sauvegarde datée dans versions/), "
                    "ou « Mode mise à jour » pour n'ajouter que les nouveautés."
                )
            versions = os.path.join(path, "versions")
            os.makedirs(versions, exist_ok=True)
            stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            shutil.move(dest, os.path.join(versions, f"{slug}_{stamp}"))
        shutil.copytree(artifact_dir, dest)

    return f"{config['url_base']}/{slug}"


def _run_remote(cmd, timeout=300):
    """Lance scp/ssh, lève RuntimeError avec stderr en cas d'échec."""
    import subprocess
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    if res.returncode != 0:
        raise RuntimeError((res.stderr or res.stdout or "échec commande distante").strip())
    return res


def deploy_artifact_to_server(artifact_dir, slug, config, force=False, update=False):
    """Zippe l'artifact, l'envoie par scp puis l'installe dans <path>/<slug>
    sur le serveur distant. Renvoie l'URL publique.

    slug   : nom de publication assaini (segment d'URL + dossier distant).
    force  : (mode remplacement) si le dossier existe déjà, refuse sauf force=True ;
             dans ce cas l'ancien dossier est archivé dans <path>/versions/<slug>_<date>.
    update : (mode mise à jour) fusion additive : les études déjà en ligne (dossiers
             contenant diagrams.html) sont PRÉSERVÉES telles quelles (données + assets) ;
             on ajoute seulement les nouveaux dossiers et on rafraîchit les pages de
             navigation. Aucune suppression. force est ignoré dans ce mode."""
    slug = sanitize_filename(slug) or "sankey_site"

    # Dépôt local (app hébergée sur le même serveur que les portfolios) :
    # copie directe, pas de scp/ssh.
    if config.get("local"):
        return _deploy_local(artifact_dir, slug, config, force=force, update=update)

    remote_zip = f"{slug}.zip"
    target = f"{config['user']}@{config['host']}"
    path = config["path"]

    common = ["-o", "StrictHostKeyChecking=accept-new", "-o", "BatchMode=yes"]
    scp = ["scp", *common, "-P", str(config["port"])]
    ssh = ["ssh", *common, "-p", str(config["port"])]
    if config.get("key"):
        scp += ["-i", config["key"]]
        ssh += ["-i", config["key"]]

    # 0. Pré-vérification d'existence (hors mode update, qui fusionne sans écraser)
    if not update:
        check = _run_remote(ssh + [target, f'[ -d "{path}/{slug}" ] && echo EXISTS || echo FREE'])
        if "EXISTS" in check.stdout and not force:
            raise RuntimeError(
                f"Le dossier « {slug} » existe déjà en ligne. "
                "Cochez « Remplacer » pour l'écraser (sauvegarde datée dans versions/), "
                "ou « Mode mise à jour » pour n'ajouter que les nouveautés."
            )

    # 1. Envoi de l'archive
    zip_path = zip_artifact(artifact_dir, slug)
    _run_remote(scp + [zip_path, f"{target}:{path}/{remote_zip}"], timeout=600)

    if update:
        # Mode mise à jour : décompresser dans un staging, retirer du staging les
        # études DÉJÀ en ligne (dossiers ayant un diagrams.html) pour préserver
        # leurs binaires, puis fusionner le reste (navigation + nouveaux dossiers).
        stage = f".staging_{slug}"
        remote_script = (
            f'cd "{path}" && rm -rf "{stage}" && mkdir -p "{stage}" && '
            f'LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 unzip -o "{remote_zip}" -d "{stage}" >/dev/null && '
            f'if [ -d "{slug}" ]; then '
            f'( cd "{slug}" && find . -name diagrams.html ) | sed "s|^\\./||; s|/diagrams.html$||" | '
            f'while read leaf; do '
            f'if [ -n "$leaf" ] && [ -d "{stage}/$leaf" ]; then rm -rf "{stage}/$leaf"; fi; done; '
            f'cp -rf "{stage}"/. "{slug}"/; '
            f'else mkdir -p "{slug}" && cp -rf "{stage}"/. "{slug}"/; fi && '
            f'rm -rf "{stage}" "{remote_zip}"'
        )
    else:
        # Mode remplacement : archivage daté de l'ancien dossier + décompression.
        remote_script = (
            f'cd "{path}" && '
            f'if [ -d "{slug}" ]; then mkdir -p versions && '
            f'mv "{slug}" "versions/{slug}_$(date +%Y%m%d_%H%M%S)"; fi && '
            f'mkdir -p "{slug}" && '
            f'LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 unzip -o "{remote_zip}" -d "{slug}" && '
            f'rm -f "{remote_zip}"'
        )
    _run_remote(ssh + [target, remote_script], timeout=300)
    return f"{config['url_base']}/{slug}"
