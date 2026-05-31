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
from flask import Response
from flask import jsonify
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
from logincomponent.server.models import update_metrics

# CONSTANTS -----------------------------------------------------
MAX_LINE_LENGTH = 120
# ---------------------------------------------------------------
# Create sankey_app app blueprint

template_folder = os.path.join(
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "client"),
    "build",
)
static_folder = os.path.join(
    os.path.join(
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "client"),
        "build",
    ),
    "static",
)
sankeyapp = Blueprint(
    "sankeyapp",
    __name__,
    static_folder=static_folder,
    template_folder=template_folder,
    static_url_path="/static/sankeyapp",
)


@sankeyapp.route("/")
def index():
    # Update website frequentation metrics
    update_metrics(request.environ.get("HTTP_X_FORWARDED_FOR", request.remote_addr))
    # Render site
    return render_template("index.html", filename="", static_site="false")


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
            input_filename = os.path.join(tmp_dir, input_file.filename)
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
