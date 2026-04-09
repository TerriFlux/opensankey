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

# External modules
from threading import Thread
import traceback

from flask import Blueprint
from flask import render_template
from flask import request
from flask import redirect
from flask import send_from_directory
from flask import Response
from flask import jsonify
from threading import Lock
from opensankey.server.views import set_process_state
from SankeyExcelParser.io_base import IOJson, IOExcel
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
    options,
    logname: str,
    t_start: float
):
    """
    Fonction unifiée pour l'optimisation.

    Parameters
    ----------
    input_source : dict
        Dictionnaire contenant soit:
        - {'type': 'json_string', 'data': sankey_json_str}
        - {'type': 'file', 'path': input_filename, 'format': 'excel'|'json'}
    """
    trace.logger_init(logname, "a")
    trace.logger.info("-- Start optimisation")
    t_prev = time.time()

    # ========== PARTIE 1: CHARGEMENT (dans le thread) ==========
    try:
        if input_source['type'] == 'json_string':
            # Cas 1: Charger depuis un JSON string
            trace.logger.info("-- Loading sankey from JSON string")
            sankey_json = json.loads(input_source['data'])
            io_input = IOJson()
            ok, msg = io_input.load_sankey_from_json(sankey_json, True)
            if not ok:
                trace.logger.error(f"-- ERROR loading sankey from JSON: {msg}")
                trace.logger.info("{:-<{w}}".format(" [FAILED] Could not load sankey", w=MAX_LINE_LENGTH))
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
                return
            options['do_coherence_checks'] = True
            ok, msg = io_input.load_sankey(input_filename, **options)
            if not ok:
                trace.logger.error("ERROR in input file.")
                for line in msg.split("\n"):
                    trace.logger.error(f"ERROR {line}")
                trace.logger.info(
                    "{:-<{w}}".format("[FAILED] Could not extract datas from input file", w=MAX_LINE_LENGTH))
                return

            model_name = os.path.splitext(os.path.basename(input_filename))[0]
        else:
            trace.logger.error(f"-- Unknown input source type: {input_source['type']}")
            return

    except Exception as e:
        trace.logger.error("-- UNEXPECTED ERROR when loading sankey")
        trace.logger.error("-- Please report this issue to support@open-sankey.fr")
        trace.logger.debug(f"-- UNEXPECTED ERROR {e}")
        trace.logger.debug(traceback.format_exc())
        trace.logger.info("{:-<{w}}".format(" [FAILED] Could not load sankey", w=MAX_LINE_LENGTH))
        return

    t = time.time()
    trace.logger.info("{:-<{w}}".format("[OK] Loaded Datas succesfully ", w=MAX_LINE_LENGTH))
    trace.logger.debug("Took {} / {} sec".format(round((t - t_prev), 2), round((t - t_start), 2)))
    t_prev = t

    # ========== PARTIE 2: OPTIMISATION (dans le thread) ==========
    try:
        ok = mfa_problem_main.optimisation(model_name, io_input.sankey, False, 0, False)
    except Exception as e:
        trace.logger.error("-- UNEXPECTED ERROR in optimisation process.")
        trace.logger.error("-- Please report this issue to support@open-sankey.fr")
        trace.logger.debug(f"-- UNEXPECTED ERROR {e}")
        trace.logger.debug(traceback.format_exc())
        trace.logger.info("{:-<{w}}".format(" [FAILED] Optimization was not successful", w=MAX_LINE_LENGTH))
        return

    if not ok:
        trace.logger.error("-- ERROR in optimisation process.")
        trace.logger.info("{:-<{w}}".format(" [FAILED] Optimization was not successful", w=MAX_LINE_LENGTH))
        return

    t = time.time()
    trace.logger.debug("-- Optimisation process completed")
    trace.logger.debug(
        "-- Optimisation process took {0} / {1} sec --".format(round((t - t_prev), 2), round((t - t_start), 2))
    )
    t_prev = t

    try:
        if output_filename.split('.')[1] == 'xlsx':
            io_excel = IOExcel(io_input.sankey)
            options["mode"] = "a"
            io_excel.write_sankey(file_name=output_filename, **options)
        else:
            io_json = IOJson(io_input.sankey)
            io_json.write_sankey(file_name=output_filename, **options)
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

        # input_options = json.loads(request.form.get('input_options', '{}'))
        # output_options = json.loads(request.form.get('output_options', '{}'))
        options = {**json.loads(request.form.get('input_options', '{}')), **
                   json.loads(request.form.get('output_options', '{}'))}
        # Stocker l'état
        set_process_state(
            process_started=True,
            tmp_dir=tmp_dir,
            logname=log_filename,
            output_file_name=output_file_name,
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
    trace.logger.info("{:-<{w}}".format("[STARTING] Optimisation process ", w=MAX_LINE_LENGTH))
    trace.logger.debug(f"Temporary datas are in {tmp_dir}")

    thread = Thread(
        target=solve_optimisation_problem_unified,
        args=(
            input_source,
            output_file_name,
            options,
            log_filename,
            t_start,
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
    if data.get("catchup"):
        payload["catchup"] = True
    _trial_record_event("started", payload)
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
