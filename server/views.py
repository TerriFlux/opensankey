#  coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de modification : 26/09/2024

# ---------------------------------------------------------------
# External libs
import os
import time
import tempfile
import json
import html
import base64
from functools import wraps
from datetime import datetime

# External modules
from threading import Thread
import traceback

from flask import Blueprint
from flask import current_app
from flask import render_template
from flask import request
from flask import redirect
from flask import send_from_directory
from flask import send_file
from flask import Response
from flask import jsonify
from flask_login import current_user
from werkzeug.utils import secure_filename
from threading import Lock
from opensankey.server.views import (
    set_process_state,
    write_process_status,
    PROCESS_STATUS_RUNNING,
    PROCESS_STATUS_FINISHED,
    PROCESS_STATUS_FAILED,
)
from SankeyExcelParser.io_base import IOExcel, IOJson
import SankeyExcelParser.su_trace as trace

# from SankeyExcelParser.classes.sankey import Sankey

import mfa_problem.mfa_problem_main as mfa_problem_main

# ---------------------------------------------------------------
# Local imports
from logincomponent.server.models import update_metrics, user_excluded_from_metrics
from . import publish as publish_lib

# CONSTANTS -----------------------------------------------------
MAX_LINE_LENGTH = 120
# ---------------------------------------------------------------
# Create sankey_app app blueprint

_client_dir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "packages", "sankeyapplication",
)
template_folder = os.path.join(_client_dir, "build")
static_folder = os.path.join(template_folder, "static")
sankeyapp = Blueprint(
    "sankeyapp",
    __name__,
    static_folder=static_folder,
    template_folder=template_folder,
    static_url_path="/static/sankeyapp",
)


def api_login_required(view):
    """Exige une session authentifiée pour les endpoints d'API/traitement.

    Contrairement à flask_login.login_required (qui redirige en 302 vers la page
    de login), on renvoie un 401 JSON — adapté aux appels fetch du front. À poser
    SOUS le décorateur @route (le routage reste le décorateur le plus externe).
    En mode publié (site statique autonome) le serveur ne tourne pas : ces
    endpoints ne sont donc jamais atteints par un viewer public.
    """
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not current_user.is_authenticated:
            return Response(
                json.dumps({"error": "authentication required"}),
                status=401,
                mimetype="application/json",
            )
        return view(*args, **kwargs)
    return wrapped


def _visitor_is_internal() -> bool:
    """Vrai pour une visite de l'équipe, à ne pas compter dans `metrics` (#256).

    Sont internes : les comptes développeur (`is_developer`) et ceux marqués
    explicitement `exclude_from_metrics` (collègue non-développeur, compte de démo).

    La règle elle-même vit dans `models.user_excluded_from_metrics` (source unique,
    partagée avec l'admin) ; ici on n'ajoute que la condition d'authentification.

    Limite assumée : la page d'accueil peut être atteinte AVANT authentification —
    dans ce cas on ne sait pas qui est le visiteur et la visite est comptée. Le
    filtre couvre les navigations avec session active, cas courant pour l'équipe
    (le cookie de session persiste). Il n'est pas non plus rétroactif : les lignes
    déjà enregistrées (hash d'IP, sans identité) ne peuvent pas être réattribuées.
    """
    if not current_user.is_authenticated:
        return False
    return user_excluded_from_metrics(current_user)


@sankeyapp.route("/")
def index():
    # Pas de comptage ici : un GET sur la page d'accueil, c'est aussi bien un
    # crawler qu'un humain. La visite est enregistrée par /api/metrics/visit,
    # appelé par le front une fois l'app montée (cf. AppSA.tsx).
    return render_template("index.html", filename="", static_site="false")


@sankeyapp.route("/api/metrics/visit", methods=["POST"])
def metrics_visit():
    """Enregistre une visite — appelé par le front au montage de l'application.

    Compter côté serveur dans `index()` faisait entrer dans `metrics` tout ce qui
    émet un GET sur `/` : moteurs d'indexation, crawlers IA, scanners, sondes
    uptime. D'où des dizaines de milliers de « visiteurs » sans rapport avec
    l'usage réel. Le beacon exige d'exécuter le bundle JS, ce que les crawlers
    ne font pas : le bruit disparaît sans liste noire d'User-Agent à maintenir.

    Endpoint public (la home est accessible sans compte) et idempotent : `new_visit`
    n'incrémente `nb_visits` qu'une fois par jour et par IP, un appel répété ne
    gonfle donc pas les chiffres. Le site publié en statique n'a pas de serveur ;
    le front ne l'appelle que hors mode `is_static`.
    """
    if not _visitor_is_internal():
        update_metrics(request.environ.get("HTTP_X_FORWARDED_FOR", request.remote_addr))
    return Response(status=204)


@sankeyapp.route("/fr")
def index_fr():
    return render_template("index_fr.html", filename="", static_site="false")


# Repo root holds CHANGELOG.md (one level above server/). Served by the app
# itself so the info popover can link to it on the same host — always in sync
# with the deployed commit, and without exposing the private GitLab repo. The
# file lists every version, so a single page covers "what changed" + history.
CHANGELOG_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "CHANGELOG.md"
)


@sankeyapp.route("/changelog")
def changelog():
    try:
        with open(CHANGELOG_PATH, encoding="utf-8") as f:
            md = f.read()
    except Exception:
        md = "# Changelog\n\nChangelog indisponible."
    # The escaped <pre> is the no-JS / offline fallback (readable raw markdown);
    # marked (CDN) upgrades it to rendered HTML when available.
    page = (
        "<!DOCTYPE html>\n"
        '<html lang="fr"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        "<title>Changelog — SankeyApplication</title>"
        "<style>"
        "body{font-family:Arial,sans-serif;margin:2rem auto;max-width:900px;"
        "padding:0 1rem;color:#222;line-height:1.5}"
        "h1,h2,h3{color:#333}h2{margin-top:2rem;border-bottom:1px solid #eee;padding-bottom:.2rem}"
        "pre{background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto}"
        "code{background:#f0f0f0;padding:1px 4px;border-radius:3px}"
        "a{color:#2b6cb0}"
        ".toc{margin:0 0 1.5rem;padding:.6rem .8rem;background:#f5f5f5;"
        "border-radius:4px;line-height:1.9}.toc a{margin-right:.2rem}"
        "</style></head><body>"
        '<div id="content"></div>'
        '<pre id="raw">' + html.escape(md) + "</pre>"
        '<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>'
        # After rendering, build a version index from the h2 headings (each
        # "## [X.Y.Z]" section) and prepend it as an anchor list at the top.
        """<script>(function(){
var raw=document.getElementById('raw');
var content=document.getElementById('content');
if(!window.marked||!raw){return;}
content.innerHTML=window.marked.parse(raw.textContent);
raw.style.display='none';
var hs=content.querySelectorAll('h2');
if(!hs.length){return;}
var nav=document.createElement('div');
nav.className='toc';
var s='<strong>Versions :</strong> ';
for(var i=0;i<hs.length;i++){
var id='s'+i;hs[i].id=id;
s+=(i?' · ':'')+'<a href="#'+id+'">'+hs[i].textContent.trim()+'</a>';
}
nav.innerHTML=s;
content.insertBefore(nav,content.firstChild);
})();</script>"""
        "</body></html>"
    )
    return Response(page, mimetype="text/html")


@sankeyapp.route("/versions")
def versions():
    """List archived version slots so the topbar info popover can link to them.

    Each archived version is deployed by archive_version.sh as a self-contained
    slot dir ~/<env>_v<X.Y.Z>_opensankey served under /v<X.Y.Z>/. We discover
    them by globbing those dirs — archiving a version makes it appear here with
    no manual registry to keep in sync. Returns [{version, url}] newest-first.

    Versions hosted on another server (e.g. a version only kept on a backup
    host, not archived as a local slot) can be added via the env var
    EXTRA_VERSION_LINKS, a comma/semicolon-separated list of "<version>=<url>"
    pairs, e.g. "1.1.5=https://backup.open-sankey.fr/". An explicit link there
    overrides the local slot for the same version.
    """
    import glob
    import re

    env = os.environ.get("ENV", "prod")
    home = os.path.expanduser("~")
    # version -> url ; local archived slots first, then env overrides/adds.
    links = {}
    for d in glob.glob(os.path.join(home, f"{env}_v*_opensankey")):
        m = re.search(rf"{re.escape(env)}_v(\d+\.\d+\.\d+[^_/]*)_opensankey$", d)
        if m:
            links[m.group(1)] = f"/v{m.group(1)}/"
    for pair in re.split(r"[,;]", os.environ.get("EXTRA_VERSION_LINKS", "")):
        if "=" in pair:
            ver, _, url = pair.partition("=")
            ver, url = ver.strip(), url.strip()
            if ver and url:
                links[ver] = url
    # Semantic descending sort (1.1.10 > 1.1.9), tolerant of pre-release suffixes.
    ordered = sorted(links, key=lambda v: [int(x) for x in re.findall(r"\d+", v)], reverse=True)
    return jsonify([{"version": v, "url": links[v]} for v in ordered])


# ---------------------------------------------------------------
# Publication d'une étude en site statique autonome (zip)
# template_folder pointe déjà sur client/build (assets compilés). Le pipeline
# (server/publish.py) recopie tout le build statique pour un zip portable.
def _publish_data_root():
    """Racine des dossiers publiables côté serveur (études déjà déployées).

    Les noms de variable diffèrent selon l'environnement (serveur = `MFAData`,
    launcher local = `MFADATA`, scripts = `MFADataDir`) et Linux est sensible à
    la casse : on cherche donc, insensible à la casse, toute variable nommée
    MFAData ou MFADataDir pointant sur un dossier existant."""
    wanted = {"mfadata", "mfadatadir"}
    for key, value in os.environ.items():
        if key.lower() in wanted and value and os.path.isdir(value):
            return value
    return None


def _reconstruct_client_folder():
    """Reconstruit dans un dossier temporaire l'arborescence d'un dossier uploadé
    depuis le navigateur (input webkitdirectory). Renvoie (temp_dir, folder_name)
    ou (None, None) si aucun fichier. Le 1er segment du chemin (= nom du dossier
    sélectionné) est retiré pour que index.html retombe à la racine."""
    files = request.files.getlist("files")
    if not files:
        return None, None
    raw_paths = request.form.get("paths")
    try:
        rel_paths = json.loads(raw_paths) if raw_paths else []
    except Exception:
        rel_paths = []
    base = tempfile.mkdtemp(prefix="sankey_client_")
    folder_name = None
    for i, f in enumerate(files):
        rel = (rel_paths[i] if i < len(rel_paths) else None) or f.filename or ""
        rel = rel.replace("\\", "/")
        parts = [p for p in rel.split("/") if p not in ("", ".", "..")]
        if not parts:
            continue
        if folder_name is None and len(parts) > 1:
            folder_name = parts[0]
        if len(parts) > 1:
            parts = parts[1:]  # retirer le nom du dossier sélectionné
        dest = os.path.join(base, *parts)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        f.save(dest)
    return base, folder_name


def _safe_under(root, folder):
    """Résout folder sous root en refusant toute évasion de chemin."""
    root_p = os.path.realpath(root)
    target = os.path.realpath(os.path.join(root_p, folder))
    if target != root_p and not target.startswith(root_p + os.sep):
        return None
    return target


class _PublishError(Exception):
    """Erreur métier publish avec code HTTP associé."""
    def __init__(self, message, code=400):
        super().__init__(message)
        self.code = code


def _read_bool_field(name):
    """Lit un booléen depuis le form (multipart) ou le corps JSON."""
    if request.content_type and "multipart/form-data" in request.content_type:
        return request.form.get(name) in ("1", "true", "True", "on")
    data = request.get_json(silent=True) or {}
    return bool(data.get(name))


def _build_folder_artifact(project_dir, publish_name, tree):
    """Publie un dossier en mode étude unique ou arborescence (portfolio)."""
    if tree:
        return publish_lib.publish_tree(project_dir, template_folder, publish_name=publish_name)
    return publish_lib.publish_folder(project_dir, template_folder, publish_name=publish_name)


def _resolve_publish_folder():
    """Détermine le dossier source à publier selon la requête :
    - multipart avec fichiers (upload navigateur) -> reconstruction temp ;
    - JSON {folder} -> dossier de la racine serveur MFADATA.
    Renvoie (project_dir, publish_name). Lève _PublishError sinon."""
    is_multipart = request.content_type and "multipart/form-data" in request.content_type
    if is_multipart and request.files.getlist("files"):
        project_dir, folder_name = _reconstruct_client_folder()
        if not project_dir:
            raise _PublishError("Dossier vide", 400)
        publish_name = request.form.get("publish_name") or folder_name or "sankey_site"
        return project_dir, publish_name
    # Dossier serveur (JSON)
    root = _publish_data_root()
    if not root or not os.path.isdir(root):
        raise _PublishError("Aucune racine de données configurée", 400)
    data = request.get_json(silent=True) or {}
    folder = (data.get("folder") or "").strip()
    if not folder:
        raise _PublishError("Dossier non spécifié", 400)
    project_dir = _safe_under(root, folder)
    if not project_dir or not os.path.isdir(project_dir):
        raise _PublishError("Dossier introuvable", 404)
    publish_name = data.get("publish_name") or os.path.basename(folder.rstrip("/\\"))
    return project_dir, publish_name


@sankeyapp.route("/api/publish/folders")
@api_login_required
def publish_folders():
    """Liste les dossiers serveur publiables + disponibilité du déploiement en ligne."""
    root = _publish_data_root()
    folders = []
    available = bool(root and os.path.isdir(root))
    if available:
        try:
            folders = publish_lib.find_index_folders(root)
        except Exception:
            traceback.print_exc()
            folders = []
    deploy_cfg = publish_lib.get_deploy_config()
    return jsonify({
        "available": available,
        "folders": folders,
        "deploy_available": deploy_cfg is not None,
        "deploy_url_base": deploy_cfg["url_base"] if deploy_cfg else None,
    })


@sankeyapp.route("/api/publish/browse")
@api_login_required
def publish_browse():
    """Navigation dans l'arbre des dossiers serveur (explorateur). Renvoie les
    sous-dossiers immédiats de `path` (relatif à la racine MFAData), pour permettre
    de remonter/descendre et sélectionner n'importe quel dossier — y compris un
    conteneur sans index.html, pour déployer toute son arborescence."""
    root = _publish_data_root()
    if not root or not os.path.isdir(root):
        return jsonify({"available": False, "entries": []})
    rel = (request.args.get("path") or "").strip().strip("/\\")
    cur = _safe_under(root, rel) if rel else os.path.realpath(root)
    if not cur or not os.path.isdir(cur):
        return jsonify({"error": "Dossier introuvable"}), 404

    def _listed_subdirs(d):
        out = []
        try:
            for name in os.listdir(d):
                if name.startswith(".") or name in publish_lib._EXCLUDED_DIRS:
                    continue
                if os.path.isdir(os.path.join(d, name)):
                    out.append(name)
        except OSError:
            pass
        return out

    entries = []
    for name in sorted(_listed_subdirs(cur), key=lambda s: s.lower()):
        full = os.path.join(cur, name)
        child_rel = (rel + "/" + name) if rel else name
        entries.append({
            "name": name,
            "path": child_rel,
            "has_index": os.path.isfile(os.path.join(full, "index.html")),
            "has_children": len(_listed_subdirs(full)) > 0,
        })
    parent = None if not rel else "/".join(rel.replace("\\", "/").split("/")[:-1])
    return jsonify({
        "available": True,
        "path": rel,
        "parent": parent,
        "has_index": os.path.isfile(os.path.join(cur, "index.html")),
        "entries": entries,
    })


@sankeyapp.route("/api/publish/folder", methods=["POST"])
@api_login_required
def publish_folder_route():
    """Publie un dossier et renvoie le site autonome en zip. Deux modes :
    - multipart (upload navigateur webkitdirectory) : dossier reconstruit en temp.
    - JSON {folder} : dossier de la racine serveur MFADATA."""
    try:
        project_dir, publish_name = _resolve_publish_folder()
    except _PublishError as e:
        return jsonify({"error": str(e)}), e.code
    tree = _read_bool_field("tree")
    try:
        artifact = _build_folder_artifact(project_dir, publish_name, tree)
        zip_path = publish_lib.zip_artifact(artifact, publish_lib.sanitize_filename(publish_name))
    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Erreur interne du serveur"}), 500
    resp = send_file(
        zip_path,
        mimetype="application/zip",
        as_attachment=True,
        download_name=os.path.basename(zip_path),
    )
    # Build jetable : supprimé une fois le zip entièrement streamé au client.
    resp.call_on_close(lambda: publish_lib.cleanup_build_dir(artifact))
    return resp


@sankeyapp.route("/api/publish/current", methods=["POST"])
@api_login_required
def publish_current_route():
    """Publie l'étude ouverte (JSON envoyé par le front) en site autonome zip.

    Accepte du JSON ({diagram, options}) ou un multipart form (diagram, options,
    logo) pour permettre l'upload d'un logo binaire.
    """
    options = {}
    diagram = None
    if request.content_type and "multipart/form-data" in request.content_type:
        diagram = request.form.get("diagram")
        raw_opts = request.form.get("options")
        if raw_opts:
            try:
                options = json.loads(raw_opts)
            except Exception:
                options = {}
        logo = request.files.get("logo")
        if logo and logo.filename:
            options["logo_filename"] = publish_lib.sanitize_filename(logo.filename)
            options["logo_bytes"] = logo.read()
    else:
        data = request.get_json(silent=True) or {}
        diagram = data.get("diagram")
        options = data.get("options") or {}

    if not diagram:
        return jsonify({"error": "Diagramme manquant"}), 400
    try:
        artifact = publish_lib.publish_current_study(diagram, template_folder, options=options)
        base = publish_lib.sanitize_filename(options.get("publish_name") or "sankey_site")
        zip_path = publish_lib.zip_artifact(artifact, base)
    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Erreur interne du serveur"}), 500
    resp = send_file(
        zip_path,
        mimetype="application/zip",
        as_attachment=True,
        download_name=os.path.basename(zip_path),
    )
    # Build jetable : supprimé une fois le zip entièrement streamé au client.
    resp.call_on_close(lambda: publish_lib.cleanup_build_dir(artifact))
    return resp


@sankeyapp.route("/api/publish/deploy", methods=["POST"])
@api_login_required
def publish_deploy_route():
    """Publie l'étude (ouverte ou dossier serveur) PUIS l'envoie en ligne (scp/ssh)
    vers le serveur de portfolios. Renvoie l'URL publique. Mêmes payloads que
    /api/publish/current et /api/publish/folder, plus un champ 'folder' pour la
    source dossier."""
    cfg = publish_lib.get_deploy_config()
    if not cfg:
        return jsonify({"error": "Déploiement en ligne non configuré sur ce serveur"}), 400

    is_multipart = request.content_type and "multipart/form-data" in request.content_type
    # Étude courante : multipart avec 'diagram', ou JSON {diagram} (sans 'folder').
    json_data = None if is_multipart else (request.get_json(silent=True) or {})
    if is_multipart:
        force = request.form.get("force") in ("1", "true", "True", "on")
        update = request.form.get("update") in ("1", "true", "True", "on")
    else:
        force = bool(json_data.get("force"))
        update = bool(json_data.get("update"))
    is_current = (
        (is_multipart and request.form.get("diagram"))
        or (json_data is not None and not json_data.get("folder") and json_data.get("diagram"))
    )
    artifact = None
    try:
        if is_current:
            if is_multipart:
                diagram = request.form.get("diagram")
                try:
                    options = json.loads(request.form.get("options") or "{}")
                except Exception:
                    options = {}
                logo = request.files.get("logo")
                if logo and logo.filename:
                    options["logo_filename"] = publish_lib.sanitize_filename(logo.filename)
                    options["logo_bytes"] = logo.read()
            else:
                diagram = json_data.get("diagram")
                options = json_data.get("options") or {}
            artifact = publish_lib.publish_current_study(diagram, template_folder, options=options)
            publish_name = options.get("publish_name") or "sankey"
        else:
            # Dossier client (upload) ou dossier serveur (JSON), étude unique ou arborescence.
            project_dir, publish_name = _resolve_publish_folder()
            artifact = _build_folder_artifact(project_dir, publish_name, _read_bool_field("tree"))
        url = publish_lib.deploy_artifact_to_server(
            artifact, publish_name, cfg, force=force, update=update)
    except _PublishError as e:
        return jsonify({"error": str(e)}), e.code
    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Erreur interne du serveur"}), 500
    finally:
        # Build jetable : supprimé une fois le déploiement terminé (réussi ou non).
        if artifact:
            publish_lib.cleanup_build_dir(artifact)
    return jsonify({"url": url})


@sankeyapp.route("/<path:path>")
def goto(path):
    try:
        # First possibility - return a template
        return render_template(path)
    except Exception:
        try:
            # Second possibility return a file from public folder
            return send_from_directory(template_folder, path)
        except Exception:
            # Otherwise return index
            return redirect("/", 301)


def solve_optimisation_problem_unified(
    input_source: dict,  # ← Dict avec toutes les infos nécessaires
    output_filename: str,
    input_options: dict,
    output_options: dict,
    logname: str,
    t_start: float,
    solver_options: dict = None,
    zip_bundle_path: str = None,
    process_label: str = None,
):
    """
    Fonction unifiée pour l'optimisation.

    Parameters
    ----------
    input_source : dict
        Dictionnaire contenant soit:
        - {'type': 'json_string', 'data': sankey_json_str}
        - {'type': 'file', 'path': input_filename, 'format': 'excel'|'json'}
    process_label : str, optional
        Libellé localisé de l'opération (« Réconciliation », « Complétion »)
        fourni par le dialogue, utilisé pour l'en-tête de log. Le statut machine
        (<logname>.status) pilote l'arrêt du polling côté client.
    """
    trace.logger_init(logname, "a")
    write_process_status(logname, PROCESS_STATUS_RUNNING)
    trace.logger.info("-- " + (process_label or "Start optimisation"))
    t_prev = time.time()
    solver_options = solver_options or {}

    # ========== PARTIE 1: CHARGEMENT (dans le thread) ==========
    # try:
    if input_source['type'] == 'json_string':
        # Cas 1: Charger depuis un JSON string
        trace.logger.info("-- Loading sankey from JSON string")
        sankey_json = json.loads(input_source['data'])
        io_input = IOJson()
        # Forward the eight symmetric input options so the JSON load path
        # enforces the same false=abort / true=fix contract as the Excel one.
        ok, msg = io_input.load_sankey_from_json(sankey_json, True, **input_options)
        if not ok:
            trace.logger.error(f"-- ERROR loading sankey from JSON: {msg}")
            trace.logger.info("{:-<{w}}".format(" [FAILED] Could not load sankey", w=MAX_LINE_LENGTH))
            write_process_status(logname, PROCESS_STATUS_FAILED)
            return
        io_input.sankey.autocompute_mat_balance()
        model_name = sankey_json.get("model_name", "model")

    elif input_source['type'] == 'file':
        # Cas 2: Charger depuis un fichier
        input_filename = input_source['path']
        input_format = input_source['format']
        trace.logger.info(f"-- Loading sankey from file: {input_filename} (format: {input_format})")

        if input_format == 'excel':
            io_input = IOExcel()
        elif input_format == 'json':
            io_input = IOJson()
        else:
            trace.logger.error(f"-- Unknown input format: {input_format}")
            trace.logger.info("{:-<{w}}".format(" [FAILED] Unknown format", w=MAX_LINE_LENGTH))
            write_process_status(logname, PROCESS_STATUS_FAILED)
            return
        input_options['do_coherence_checks'] = True
        # preserve_extra_columns est exposé dans l'onglet "Options de sortie"
        # côté UI (la décision est sémantiquement une décision d'écriture),
        # mais le stash des colonnes inconnues doit être armé pendant la
        # lecture. On propage donc le flag à input_options avant load_sankey.
        if "preserve_extra_columns" in output_options:
            input_options.setdefault(
                "preserve_extra_columns",
                output_options["preserve_extra_columns"],
            )
        # Pipeline MFA : les fluxTags des lignes de données sont des
        # annotations (source, méthode, traduction, ...) qui varient par
        # ligne — ils ne doivent pas fragmenter un flux physique en N
        # variables solveur déconnectées (issue #168). La convention
        # OpenSankey « N Links par (o,d) » reste le défaut partout ailleurs.
        if input_format == 'excel':
            input_options.setdefault("split_flux_by_fluxtags", False)
        ok, msg = io_input.load_sankey(input_filename, **input_options)
        if not ok:
            trace.logger.error("ERROR in input file.")
            for line in msg.split("\n"):
                trace.logger.error(f"ERROR {line}")
            trace.logger.info(
                "{:-<{w}}".format("[FAILED] Could not extract datas from input file", w=MAX_LINE_LENGTH))
            write_process_status(logname, PROCESS_STATUS_FAILED)
            return

        model_name = os.path.splitext(os.path.basename(input_filename))[0]
    else:
        trace.logger.error(f"-- Unknown input source type: {input_source['type']}")
        write_process_status(logname, PROCESS_STATUS_FAILED)
        return

    # except Exception as e:
    #     trace.logger.error("-- UNEXPECTED ERROR when loading sankey")
    #     trace.logger.error("-- Please report this issue to support@open-sankey.fr")
    #     trace.logger.debug(f"-- UNEXPECTED ERROR {e}")
    #     trace.logger.debug(traceback.format_exc())
    #     trace.logger.info("{:-<{w}}".format(" [FAILED] Could not load sankey", w=MAX_LINE_LENGTH))
    #     return

    t = time.time()
    trace.logger.info("{:-<{w}}".format("[OK] Loaded Datas succesfully ", w=MAX_LINE_LENGTH))
    trace.logger.debug("Took {} / {} sec".format(round((t - t_prev), 2), round((t - t_start), 2)))
    t_prev = t

    # ========== PARTIE 2: OPTIMISATION (dans le thread) ==========
    optim_kwargs = {}

    # POC dual-output: two independent flags drive the optimisation passes.
    #   with_reconciled (default True) → standard reconciliation pass
    #   with_completed  (default False) → no-redundancy pass (measured values kept as-is)
    # When both are True we run two passes: the first writes data_value
    # (reconciled), the second writes completed_value on the same alterego.
    # Legacy remove_redundancy is mapped to "completed only" for backward compat.
    with_reconciled = bool(solver_options.get("with_reconciled", True))
    with_completed = bool(solver_options.get("with_completed", False))
    if (
        solver_options.get("remove_redundancy")
        and "with_reconciled" not in solver_options
        and "with_completed" not in solver_options
    ):
        with_reconciled = False
        with_completed = True
    if not with_reconciled and not with_completed:
        trace.logger.error("-- both with_reconciled and with_completed are False, nothing to do")
        trace.logger.info("{:-<{w}}".format(" [FAILED] no solver pass requested", w=MAX_LINE_LENGTH))
        write_process_status(logname, PROCESS_STATUS_FAILED)
        return

    # Monte-Carlo (uncertainty) — driven from the dialog's Solveur group.
    # ``enable_uncertainty`` toggles the analysis; ``nb_realisations`` sets
    # the draw count. Mirrors bin/run_reconciliation.py.
    uncertainty = bool(solver_options.get("enable_uncertainty", False))
    nb_realisations = int(solver_options.get("nb_realisations", 0)) if uncertainty else 0

    # Debug — write the Ai constraint matrix sheet and a constraints_summary.txt
    # next to the output file (same dir). Mirrors bin/run_reconciliation.py.
    if solver_options.get("debug_mode"):
        optim_kwargs["dbg_constraints__summary_xl_table"] = []
        optim_kwargs["dbg_constraints__summary_txt_filename"] = os.path.join(
            os.path.dirname(output_filename) or ".", "constraints_summary.txt"
        )

    # Skip RREF — direct CVX minimisation on the raw constraint matrix. Faster
    # but disables interval computation and Monte-Carlo. Mirrors --skip_rref in
    # bin/run_reconciliation.py.
    skip_rref = bool(solver_options.get("skip_rref", False))

    def _run_pass(remove_redundancy_flag: bool, target_field: str, skip_reset: bool):
        pass_kwargs = {**optim_kwargs}
        if remove_redundancy_flag:
            pass_kwargs["remove_redundancy"] = True
        if target_field != "data_value":
            pass_kwargs["target_field"] = target_field
        if skip_reset:
            pass_kwargs["skip_reset_results"] = True
        return mfa_problem_main.optimisation(
            model_name, io_input.sankey, uncertainty, nb_realisations, False,
            skip_rref=skip_rref, **pass_kwargs,
        )

    try:
        if with_reconciled:
            ok = _run_pass(remove_redundancy_flag=False, target_field="data_value", skip_reset=False)
            if ok and with_completed:
                # Second pass: results go into alterego.completed_value, alterego
                # already exists from the first pass — don't reset.
                ok = _run_pass(
                    remove_redundancy_flag=True, target_field="completed_value", skip_reset=True,
                )
        else:
            # Only the completed pass requested. Standard single-pass write into
            # data_value (preserves the legacy "Compléter le diagramme" UX).
            ok = _run_pass(remove_redundancy_flag=True, target_field="data_value", skip_reset=False)
    except Exception as e:
        trace.logger.error("-- UNEXPECTED ERROR in optimisation process.")
        trace.logger.error("-- Please report this issue to support@open-sankey.fr")
        trace.logger.debug(f"-- UNEXPECTED ERROR {e}")
        trace.logger.debug(traceback.format_exc())
        trace.logger.info("{:-<{w}}".format(" [FAILED] Optimization was not successful", w=MAX_LINE_LENGTH))
        write_process_status(logname, PROCESS_STATUS_FAILED)
        return

    if not ok:
        trace.logger.error("-- ERROR in optimisation process.")
        trace.logger.info("{:-<{w}}".format(" [FAILED] Optimization was not successful", w=MAX_LINE_LENGTH))
        write_process_status(logname, PROCESS_STATUS_FAILED)
        return

    t = time.time()
    trace.logger.debug("-- Optimisation process completed")
    trace.logger.debug(
        "-- Optimisation process took {0} / {1} sec --".format(round((t - t_prev), 2), round((t - t_start), 2))
    )
    t_prev = t

    # Bridge MC simulations recording flag : the frontend packs it into
    # ``solver_options`` (SOLVER_OPTION_KEYS, cf. opensankey#1227) but the
    # writer reads it from ``output_options`` — forward it explicitly.
    # Default False : the Simulations sheet can blow up to 1000+ columns,
    # users opt in via the checkbox in the dialog Solveur group.
    output_options["record_simulations"] = bool(solver_options.get("record_simulations", False))

    try:
        if output_filename.split('.')[1] == 'xlsx':
            io_excel = IOExcel(io_input.sankey)
            output_options["mode"] = "a"
            io_excel.write_sankey(file_name=output_filename, **output_options)
        else:
            io_json = IOJson(io_input.sankey)
            io_json.write_sankey(file_name=output_filename, **output_options)

        # Debug mode: bundle the produced output + constraints_summary.txt into a
        # single zip so retrieve_result can hand it back as one download.
        # ``zip_bundle_path`` is computed and stashed in the session state by
        # launch_optim (request context) before this thread starts — we cannot
        # mutate the Flask session from this background thread, so the path is
        # pre-decided at request time. Only triggers when the txt file actually
        # exists (cheap guard against broken / older MFAProblem versions).
        debug_txt = optim_kwargs.get("dbg_constraints__summary_txt_filename")
        if zip_bundle_path and debug_txt and os.path.exists(debug_txt):
            import zipfile
            with zipfile.ZipFile(zip_bundle_path, "w", zipfile.ZIP_DEFLATED) as zf:
                zf.write(output_filename, arcname=os.path.basename(output_filename))
                zf.write(debug_txt, arcname=os.path.basename(debug_txt))
    except Exception as e:
        trace.logger.error("-- UNEXPECTED ERROR in output file writing.")
        trace.logger.error("-- Please report this issue to support@open-sankey.fr")
        trace.logger.debug(f"-- UNEXPECTED ERROR {e}")
        trace.logger.debug(traceback.format_exc())
        trace.logger.info(
            "{:-<{w}}".format(
                " [FAILED] Optimization was successful, but an error occured when retrieving results",
                w=MAX_LINE_LENGTH,
            )
        )
        write_process_status(logname, PROCESS_STATUS_FAILED)
        return

    t = time.time()
    trace.logger.info("-- Write results to json")
    trace.logger.debug("-- Write results took {0} / {1} sec --".format(round((t - t_prev), 2), round((t - t_start), 2)))
    trace.logger.info(
        "{:-<{w}}".format(
            " [COMPLETED] Overall optimisation process succesfully ended, took {0} sec".format(round(t - t_start, 2)),
            w=MAX_LINE_LENGTH,
        )
    )
    write_process_status(logname, PROCESS_STATUS_FINISHED)
    return


# @sankeyapp.route("/optimize/launch_optim_sankey", methods=["POST"])
# def launch_optim_sankey():
#     """
#     Launch optimisation process from JSON data (Sankey object)
#     Tout le traitement lourd est threadé.
#     """
#     try:

#         # Créer les répertoires temporaires
#         tmp_dir = tempfile.mkdtemp()
#         log_dir = tempfile.mkdtemp()
#         log_filename = log_dir + os.path.sep + "rollover.log"
#         trace.logger_init(log_filename, "w")

#         output_file_name = os.path.join(tmp_dir, "tutu.pkl")
#         input_options = json.loads(request.form.get('input_options', '{}'))
#         output_options = json.loads(request.form.get('output_options', '{}'))
#         # Récupérer le JSON string (rapide, juste lecture)
#         sankey_json_str = request.form["sankey_data"]

#         # Stocker l'état
#         set_process_state(
#             process_started=True,
#             tmp_dir=tmp_dir,
#             logname=log_filename,
#             output_file_name=output_file_name,
#             output_json_file_abspath=os.path.join(tmp_dir, "output.json")
#         )

#     except Exception as e:
#         trace.logger.error("UNEXPECTED ERROR when reading params.")
#         trace.logger.error(f"UNEXPECTED ERROR {e}")
#         trace.logger.error(traceback.format_exc())

#         err_msg = f"ERROR: launch_optim_sankey - erreur fatale. {e}"
#         return Response(json.dumps({"output": err_msg}), status=500, mimetype="application/json")

#     # ========== LANCEMENT DU THREAD ==========
#     t_start = time.time()
#     trace.logger.info("{:-<{w}}".format("[STARTING] Optimisation process ", w=MAX_LINE_LENGTH))
#     trace.logger.debug(f"Temporary datas are in {tmp_dir}")

#     # Préparer les données pour le thread
#     input_source = {
#         'type': 'json_string',
#         'data': sankey_json_str
#     }

#     # Lancer le thread
#     thread = Thread(
#         target=solve_optimisation_problem_unified,
#         args=(
#             input_source,
#             output_file_name,
#             input_options,
#             output_options,
#             log_filename,
#             t_start,
#         )
#     )
#     thread.daemon = True
#     trace.logger.debug("Optimisation thread created")
#     thread.start()

#     # Réponse immédiate
#     return Response(json.dumps({"output": "OK"}), status=200, mimetype="application/json")

@sankeyapp.route("/optimize/launch_optim", methods=["POST"])
@api_login_required
def launch_optim():
    """
    Launch optimisation process from uploaded file
    Tout le traitement lourd est threadé.
    """
    try:
        # Créer les répertoires temporaires
        tmp_dir = tempfile.mkdtemp()
        log_dir = tempfile.mkdtemp()
        log_filename = log_dir + os.path.sep + "rollover.log"
        trace.logger_init(log_filename, "w")

        input_format = request.form.get("input_format", "excel")
        if input_format == "excel":
            # Sauvegarder le fichier uploadé (rapide)
            input_file = request.files["file"]
            # secure_filename : le nom vient du client et est joint à un chemin
            # disque → sans nettoyage, un « ../ » ou un nom absolu permettrait
            # d'écrire hors du répertoire temporaire (path traversal). Repli sur
            # un nom neutre si secure_filename renvoie une chaîne vide.
            safe_filename = secure_filename(input_file.filename) or "input.xlsx"
            input_filename = os.path.join(tmp_dir, safe_filename)
            input_file.save(input_filename)
            output_file_name = input_filename
            # Préparer les données pour le thread
            input_source = {
                'type': 'file',
                'path': input_filename,
                'format': input_format
            }
        elif input_format == "blob":
            sankey_json_str = request.form["data"]
            input_filename = os.path.join(tmp_dir, "input.json")
            output_file_name = os.path.join(tmp_dir, "output.json")
            # Préparer les données pour le thread
            input_source = {
                'type': 'json_string',
                'data': sankey_json_str
            }

        input_options = json.loads(request.form.get('input_options', '{}'))
        output_options = json.loads(request.form.get('output_options', '{}'))
        solver_options = json.loads(request.form.get('solver_options', '{}'))
        # Libellé localisé fourni par le dialogue (Réconciliation / Complétion)
        # pour contextualiser le bandeau de log ; None => libellé technique.
        process_label = request.form.get('process_label') or None

        # Debug mode: pre-compute the zip bundle path now (request context).
        # The optimisation thread cannot mutate the Flask session, so the path
        # is decided here. We keep the original output_file_name in state too;
        # retrieve_result picks the zip if it exists at handoff time and falls
        # back to the original output otherwise (covers MFAProblem failures
        # that prevent the zip from being created).
        zip_bundle_path = None
        if solver_options.get("debug_mode"):
            zip_bundle_path = os.path.splitext(output_file_name)[0] + "_debug.zip"

        # Stocker l'état
        set_process_state(
            process_started=True,
            tmp_dir=tmp_dir,
            logname=log_filename,
            output_file_name=output_file_name,
            debug_zip_path=zip_bundle_path,
            input_filename=input_filename,
            input_format=input_format,
            output_json_file_abspath=os.path.join(tmp_dir, "tutu.json")
        )

    except Exception as e:
        trace.logger.error("UNEXPECTED ERROR when reading params.")
        trace.logger.error(f"UNEXPECTED ERROR {e}")
        trace.logger.error(traceback.format_exc())

        err_msg = f"ERROR: launch_optim - erreur fatale. {e}"
        return Response(json.dumps({"output": err_msg}), status=500, mimetype="application/json")

    # ========== LANCEMENT DU THREAD ==========
    t_start = time.time()
    trace.logger.info("{:-<{w}}".format((process_label or "[STARTING] Optimisation process") + " ", w=MAX_LINE_LENGTH))
    trace.logger.debug(f"Temporary datas are in {tmp_dir}")

    thread = Thread(
        target=solve_optimisation_problem_unified,
        args=(
            input_source,
            output_file_name,
            input_options,
            output_options,
            log_filename,
            t_start,
            solver_options,
            zip_bundle_path,
            process_label,
        ),
    )
    thread.daemon = True
    trace.logger.debug("Optimisation thread created")
    thread.start()

    # Réponse immédiate
    return Response(json.dumps({"output": "OK"}), status=200, mimetype="application/json")


# ==================================================================================================
# OpenSankey+ free-trial analytics — anonymous, file-based counters
# --------------------------------------------------------------------------------------------------
# Stores aggregate counts in plain text files under ./cache. No PII (no IP, no UA), only an
# anonymous client-generated UUID. The UUID lets us correlate "started" with "converted" without
# ever knowing who the user is.
#
# Files written:
#   - cache/trial_counter.txt  : single integer, total number of trial starts (incremented in place)
#   - cache/trial_events.jsonl : append-only JSONL, one event per line
#                                {"event": "started"|"converted", "uuid": "...", "ts": <ms>}
#
# A module-level threading.Lock serialises writes within a single Flask process. Multi-worker
# deployments (gunicorn, uwsgi) may very rarely lose a count under heavy concurrency, which is an
# acceptable tradeoff for a soft analytics counter.
# ==================================================================================================

_TRIAL_LOCK = Lock()
_TRIAL_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "cache",
)
_TRIAL_COUNTER_FILE = os.path.join(_TRIAL_DIR, "trial_counter.txt")
_TRIAL_EVENTS_FILE = os.path.join(_TRIAL_DIR, "trial_events.jsonl")
_TRIAL_NOTIFY_RECIPIENT = "julien.alapetite@terriflux.fr"


def _trial_send_notification(app, uuid: str, started_at_ms: int, total_count: int) -> None:
    """
    Background-thread email notifier. Sends a short heads-up to the trial admin every time
    someone starts the OpenSankey+ free trial. Best-effort: any error is swallowed and logged.
    Runs inside an explicit app context so flask_mail can resolve the configured server.
    """
    try:
        from logincomponent.server.mailing import send, MAIL_SENDING_ADRESS
        from flask_mail import Message
    except Exception as exc:  # pragma: no cover - import-time failures only
        trace.logger.warning("trial: cannot import mailing module (%s)", exc)
        return

    started_iso = datetime.utcfromtimestamp(started_at_ms / 1000).strftime("%Y-%m-%d %H:%M:%S UTC")
    body = (
        "Une nouvelle personne vient de démarrer la période d'essai OpenSankey+.\n\n"
        f"  UUID anonyme : {uuid}\n"
        f"  Démarré le   : {started_iso}\n"
        f"  Total essais : {total_count}\n\n"
        "Détail complet : cache/trial_events.jsonl\n"
        "Stats           : python scripts/trial_stats.py\n"
    )
    msg = Message(
        subject="[OpenSankey+] Nouvel essai démarré",
        sender=("Contact TerriFlux", MAIL_SENDING_ADRESS) if MAIL_SENDING_ADRESS else None,
        recipients=[_TRIAL_NOTIFY_RECIPIENT],
        body=body,
    )
    try:
        with app.app_context():
            send(msg)
    except Exception as exc:
        trace.logger.warning("trial: failed to send notification email (%s)", exc)


def _trial_record_event(event: str, payload: dict) -> int:
    """
    Append an event line to trial_events.jsonl and, for "started" events, increment the
    counter file. Returns the new counter value (or -1 if not a started event).
    """
    os.makedirs(_TRIAL_DIR, exist_ok=True)
    line = json.dumps({"event": event, **payload}, ensure_ascii=False)
    with _TRIAL_LOCK:
        with open(_TRIAL_EVENTS_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
        if event != "started":
            return -1
        try:
            with open(_TRIAL_COUNTER_FILE, "r", encoding="utf-8") as f:
                current = int(f.read().strip() or "0")
        except (FileNotFoundError, ValueError):
            current = 0
        new_value = current + 1
        with open(_TRIAL_COUNTER_FILE, "w", encoding="utf-8") as f:
            f.write(str(new_value))
        return new_value


def _trial_get_uuid() -> str:
    """Read a UUID string from the request body, returning '' if missing/invalid."""
    try:
        data = request.get_json(silent=True) or {}
        uuid = data.get("uuid", "")
        if isinstance(uuid, str) and 0 < len(uuid) <= 64:
            return uuid
    except Exception:
        pass
    return ""


@sankeyapp.route("/api/trial/started", methods=["POST"])
def trial_started():
    """
    Anonymous notification: a browser has just started the OpenSankey+ free trial.
    Body: {"uuid": "<client-generated uuid>", "started_at": <ms>, "catchup"?: true}
    """
    uuid = _trial_get_uuid()
    if not uuid:
        return jsonify({"ok": False, "error": "missing uuid"}), 400
    data = request.get_json(silent=True) or {}
    payload = {
        "uuid": uuid,
        "ts": int(data.get("started_at") or (time.time() * 1000)),
    }
    is_catchup = bool(data.get("catchup"))
    if is_catchup:
        payload["catchup"] = True
    new_total = _trial_record_event("started", payload)

    # Heads-up email to the trial admin. Skip catchup pings to avoid noise on existing users
    # whose browsers replay the start event after the analytics endpoint went live. Fire-and-forget.
    if not is_catchup:
        try:
            app = current_app._get_current_object()
            Thread(
                target=_trial_send_notification,
                args=(app, uuid, payload["ts"], new_total),
                daemon=True,
            ).start()
        except Exception as exc:
            trace.logger.warning("trial: could not spawn notification thread (%s)", exc)

    return jsonify({"ok": True}), 200


@sankeyapp.route("/api/trial/converted", methods=["POST"])
def trial_converted():
    """
    Anonymous notification: a browser whose trial UUID is <uuid> has converted to a paid licence.
    Body: {"uuid": "<client-generated uuid>", "converted_at": <ms>}
    """
    uuid = _trial_get_uuid()
    if not uuid:
        return jsonify({"ok": False, "error": "missing uuid"}), 400
    data = request.get_json(silent=True) or {}
    _trial_record_event("converted", {
        "uuid": uuid,
        "ts": int(data.get("converted_at") or (time.time() * 1000)),
    })
    return jsonify({"ok": True}), 200


# ---------------------------------------------------------------
# Vision import : extraire la structure d'un diagramme Sankey depuis une image
# ---------------------------------------------------------------
# Modèle par défaut (vision haute résolution, meilleure lecture des chiffres et
# des croisements de flux). Surchargeable par l'environnement.
VISION_MODEL = os.environ.get("VISION_MODEL", "claude-opus-4-8")

# Quota mensuel d'imports par utilisateur quand on consomme la clé TerriFlux
# (modèle A). 0 => illimité. Les utilisateurs is_developer et ceux qui
# fournissent leur propre clé (modèle B / BYOK) ne sont pas comptés.
VISION_MONTHLY_QUOTA = int(os.environ.get("VISION_MONTHLY_QUOTA", "50"))
_VISION_USAGE_LOCK = Lock()
_VISION_USAGE_FILE = os.path.join(_TRIAL_DIR, "vision_usage.json")

# Types d'images acceptés par l'API Anthropic.
_VISION_MEDIA_TYPES = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
    "webp": "image/webp",
}

# Schéma de sortie structurée : le modèle DOIT renvoyer cette forme exacte.
VISION_SANKEY_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "tags": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "color": {"type": "string"},
                },
                "required": ["name", "color"],
                "additionalProperties": False,
            },
        },
        "nodes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "color": {"type": "string"},
                    "is_stock": {"type": "boolean"},
                },
                "required": ["name", "color", "is_stock"],
                "additionalProperties": False,
            },
        },
        "flux": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "source": {"type": "string"},
                    "target": {"type": "string"},
                    "value": {"type": "number"},
                    "estimated": {"type": "boolean"},
                },
                "required": ["source", "target", "value", "estimated"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["nodes", "flux"],
    "additionalProperties": False,
}

VISION_PROMPT = (
    "Tu analyses un diagramme de Sankey (flux de matières/énergie). Extrais sa "
    "structure :\n"
    "- nodes : tous les noeuds (boîtes/colonnes). is_stock=true pour un noeud de "
    "type stock/réservoir (souvent encadré), sinon false. color = couleur "
    "dominante hex (#rrggbb) ou ''.\n"
    "- flux : chaque flux orienté source -> target avec sa valeur numérique. "
    "Vérifie la conservation : à chaque noeud intermédiaire, somme des entrées = "
    "somme des sorties. estimated=true si la valeur n'est pas lisible directement "
    "et que tu l'as déduite, sinon false.\n"
    "- tags : la légende couleur si présente (name + color hex).\n"
    "N'invente pas de noeuds. Utilise exactement les libellés lus sur l'image."
)


def _vision_usage_key(user_id):
    """Clé de comptage = utilisateur + mois courant (quota glissant mensuel)."""
    return f"{user_id}:{datetime.utcnow().strftime('%Y-%m')}"


def _vision_usage_get(user_id):
    """Nombre d'imports déjà consommés ce mois par cet utilisateur."""
    try:
        with open(_VISION_USAGE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return int(data.get(_vision_usage_key(user_id), 0))
    except (FileNotFoundError, ValueError, json.JSONDecodeError):
        return 0


def _vision_usage_incr(user_id):
    """Incrémente (atomiquement) le compteur mensuel et renvoie la nouvelle valeur."""
    os.makedirs(_TRIAL_DIR, exist_ok=True)
    key = _vision_usage_key(user_id)
    with _VISION_USAGE_LOCK:
        try:
            with open(_VISION_USAGE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (FileNotFoundError, ValueError, json.JSONDecodeError):
            data = {}
        data[key] = int(data.get(key, 0)) + 1
        with open(_VISION_USAGE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f)
        return data[key]


def _vision_parse_json(text):
    """Extrait un objet JSON depuis la réponse du modèle, tolérant aux fences
    markdown et au texte autour. Renvoie un dict ou None."""
    if not text:
        return None
    candidates = [text.strip()]
    stripped = text.strip()
    if stripped.startswith("```"):
        # Retire un éventuel bloc ```json ... ```
        inner = stripped.strip("`")
        if inner.lower().startswith("json"):
            inner = inner[4:]
        candidates.append(inner.strip())
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidates.append(text[start:end + 1])
    for cand in candidates:
        try:
            data = json.loads(cand)
            if isinstance(data, dict):
                return data
        except (json.JSONDecodeError, TypeError):
            continue
    return None


def _vision_build_workbook(structure):
    """Construit un classeur openpyxl (Noeuds + matrice IO) à partir de la
    structure validée, au format lu par SankeyExcelParser."""
    from openpyxl import Workbook

    nodes = structure.get("nodes") or []
    flux = structure.get("flux") or []

    # Ordre des noeuds : ceux déclarés, plus tout noeud référencé par un flux
    # mais absent de la liste (robustesse).
    node_names = []
    seen = set()
    for n in nodes:
        name = (n.get("name") or "").strip()
        if name and name not in seen:
            seen.add(name)
            node_names.append(name)
    for f in flux:
        for key in ("source", "target"):
            name = (f.get(key) or "").strip()
            if name and name not in seen:
                seen.add(name)
                node_names.append(name)

    color_by_name = {
        (n.get("name") or "").strip(): (n.get("color") or "")
        for n in nodes
    }

    flow_map = {}
    for f in flux:
        s = (f.get("source") or "").strip()
        t = (f.get("target") or "").strip()
        if s and t:
            flow_map[(s, t)] = f.get("value")

    wb = Workbook()

    ws_nodes = wb.active
    ws_nodes.title = "Noeuds"
    ws_nodes.append(["Niveau d'agrégation", "Noeuds", "Couleur"])
    for name in node_names:
        ws_nodes.append([1, name, color_by_name.get(name, "")])

    # Matrice entrées-sorties : définit la STRUCTURE (présence des flux).
    ws_io = wb.create_sheet("Table entrées-sorties")
    ws_io.append([None] + node_names)
    for origin in node_names:
        row = [origin]
        for dest in node_names:
            row.append(flow_map.get((origin, dest)))
        ws_io.append(row)

    # Onglet Données : porte les VALEURS des flux (la matrice IO seule ne les
    # transmet pas — vérifié end-to-end via load_sankey).
    ws_data = wb.create_sheet("Données")
    ws_data.append(["Origine", "Destination", "Valeur"])
    for (origin, dest), val in flow_map.items():
        if val is not None:
            ws_data.append([origin, dest, val])

    return wb


@sankeyapp.route("/api/vision/extract", methods=["POST"])
@api_login_required
def vision_extract():
    """Reçoit une image (multipart, champ 'image') et renvoie la structure
    Sankey extraite par Claude (vision). Forme : {"ok": True, "structure": {...}}.
    L'utilisateur valide/corrige cette structure avant l'import (route /build).

    Modèle économique hybride :
    - BYOK : si le client fournit `anthropic_key`, on l'utilise telle quelle,
      sans quota ni authentification (l'utilisateur paie sa propre conso).
    - Sinon (clé TerriFlux) : authentification requise + quota mensuel par
      utilisateur (bypass pour is_developer)."""
    byok_key = (request.form.get("anthropic_key") or "").strip()

    metered = False
    user_id = None
    if byok_key:
        api_key = byok_key
    else:
        if not getattr(current_user, "is_authenticated", False):
            return jsonify({
                "ok": False,
                "error": "connexion requise (ou fournissez votre propre clé Anthropic)",
            }), 401
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            return jsonify({"ok": False, "error": "ANTHROPIC_API_KEY non configurée côté serveur"}), 503
        user_id = current_user.get_id()
        metered = not bool(getattr(current_user, "is_developer", False))
        if metered and VISION_MONTHLY_QUOTA > 0:
            used = _vision_usage_get(user_id)
            if used >= VISION_MONTHLY_QUOTA:
                return jsonify({
                    "ok": False,
                    "error": "quota mensuel d'imports atteint",
                    "quota": {"used": used, "limit": VISION_MONTHLY_QUOTA},
                }), 402

    image_file = request.files.get("image")
    if image_file is None or not image_file.filename:
        return jsonify({"ok": False, "error": "aucune image fournie"}), 400

    ext = os.path.splitext(image_file.filename)[1].lstrip(".").lower()
    media_type = _VISION_MEDIA_TYPES.get(ext)
    if media_type is None:
        return jsonify({
            "ok": False,
            "error": "format d'image non supporté (png, jpg, gif, webp)",
        }), 400

    b64 = base64.standard_b64encode(image_file.read()).decode("utf-8")

    try:
        import anthropic
    except ImportError:
        return jsonify({
            "ok": False,
            "error": "le paquet 'anthropic' n'est pas installé côté serveur",
        }), 503

    image_block = {
        "type": "image",
        "source": {"type": "base64", "media_type": media_type, "data": b64},
    }
    try:
        client = anthropic.Anthropic(api_key=api_key)
        try:
            # Sortie structurée (recommandée) : le modèle est contraint au schéma.
            resp = client.messages.create(
                model=VISION_MODEL,
                max_tokens=16000,
                output_config={"format": {"type": "json_schema", "schema": VISION_SANKEY_SCHEMA}},
                messages=[{
                    "role": "user",
                    "content": [image_block, {"type": "text", "text": VISION_PROMPT}],
                }],
            )
        except TypeError:
            # SDK anthropic trop ancien pour `output_config` : repli sur une
            # consigne JSON stricte + extraction manuelle.
            resp = client.messages.create(
                model=VISION_MODEL,
                max_tokens=16000,
                messages=[{
                    "role": "user",
                    "content": [
                        image_block,
                        {"type": "text", "text": VISION_PROMPT + "\n\nRéponds UNIQUEMENT "
                         "avec un objet JSON valide conforme à ce schéma (sans texte "
                         "autour) : " + json.dumps(VISION_SANKEY_SCHEMA)},
                    ],
                }],
            )
    except Exception as exc:
        trace.logger.error(f"vision_extract: appel Anthropic échoué: {exc}")
        return jsonify({"ok": False, "error": "appel modèle échoué"}), 502

    if getattr(resp, "stop_reason", None) == "refusal":
        return jsonify({"ok": False, "error": "extraction refusée par le modèle"}), 422

    text = next((b.text for b in resp.content if getattr(b, "type", None) == "text"), "")
    structure = _vision_parse_json(text)
    if structure is None:
        trace.logger.error("vision_extract: JSON non parseable depuis la réponse du modèle")
        return jsonify({"ok": False, "error": "réponse du modèle non parseable"}), 502

    usage = getattr(resp, "usage", None)
    usage_out = None
    if usage is not None:
        usage_out = {
            "input_tokens": getattr(usage, "input_tokens", None),
            "output_tokens": getattr(usage, "output_tokens", None),
        }

    quota_out = None
    if metered:
        new_used = _vision_usage_incr(user_id)
        quota_out = {"used": new_used, "limit": VISION_MONTHLY_QUOTA}

    return jsonify({
        "ok": True,
        "structure": structure,
        "usage": usage_out,
        "quota": quota_out,
    }), 200


@sankeyapp.route("/api/vision/build", methods=["POST"])
@api_login_required
def vision_build():
    """Reçoit une structure Sankey validée (JSON : {"structure": {...}}), la
    matérialise en classeur Excel, la charge via SankeyExcelParser et renvoie le
    JSON Sankey au même format que le chargement Excel (consommable par
    app_data.fromJSON)."""
    body = request.get_json(silent=True) or {}
    structure = body.get("structure")
    if not isinstance(structure, dict) or not structure.get("flux"):
        return jsonify({"ok": False, "error": "structure invalide ou vide"}), 400

    tmp_dir = tempfile.mkdtemp()
    log_dir = tempfile.mkdtemp()
    log_filename = os.path.join(log_dir, "rollover.log")
    trace.logger_init(log_filename, "w")

    try:
        wb = _vision_build_workbook(structure)
        xlsx_path = os.path.join(tmp_dir, "vision_import.xlsx")
        wb.save(xlsx_path)

        io_input = IOExcel()
        ok, msg = io_input.load_sankey(
            xlsx_path,
            do_coherence_checks=False,
            split_flux_by_fluxtags=False,
        )
        if not ok:
            return jsonify({"ok": False, "error": f"échec du parsing: {msg}"}), 422

        json_path = os.path.join(tmp_dir, "vision_import.json")
        io_output = IOJson(io_input.sankey)
        io_output.write_sankey(json_path)

        with open(json_path, "r", encoding="utf-8") as f:
            sankey_json = json.load(f)

        return jsonify({"ok": True, "sankey": sankey_json}), 200

    except Exception as exc:
        trace.logger.error(f"vision_build: {exc}")
        return jsonify({"ok": False, "error": "construction du diagramme échouée"}), 500
