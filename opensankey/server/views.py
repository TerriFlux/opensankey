"""
==================================================================================================
The MIT License (MIT)
==================================================================================================
Copyright (c) 2025 TerriFlux

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
==================================================================================================
Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
==================================================================================================
"""

# coding: utf-8

# ---------------------------------------------------------------
# External libs
import gzip
import openpyxl
import tempfile
import os
import json
import imgkit
import pdfkit
import re
import pandas as pd
from io import BytesIO
import requests

try:
    import pythoncom

    pythoncom.CoInitialize()
except Exception:
    pass

# External modules
from PIL import Image
from threading import Thread

# Flask modules imports
from flask import abort
from flask import Blueprint
from flask import current_app
from flask import render_template
from flask import request
from flask import Response
from flask import send_file
from flask import session

# ---------------------------------------------------------------
# Sankey libs
import SankeyExcelParser.su_trace as trace

# Sankey modules
from SankeyExcelParser.io_excel import IOExcel

# Local modules
from . import sankeymatic

# ---------------------------------------------------------------
# Shared vars
converter_funct = {"extract_sankey_from_json": None, "extract_json_from_sankey": None}

template_folder = os.path.join(
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "client"),
    "build",
)

static_folder = os.path.join(
    os.path.join(
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "client"
        ),
        "build",
    ),
    "static",
)

opensankey = Blueprint(
    "opensankey",
    __name__,
    static_folder=static_folder,
    template_folder=template_folder,
    static_url_path="/static/opensankey",
)

image_template_folder = os.path.join(
    os.path.join(
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "client"
        ),
        "src",
    ),
    "images",
)


# ---------------------------------------------------------------
# Define all routes


@opensankey.route("/")
def start():
    return render_template("index.html", filename="", static_site="false")


@opensankey.route("/<adress>")
def goto(adress):
    return render_template(adress)


@opensankey.route("/excel/save", methods=["POST"])
def save_excel():
    """
    HTTP POST request to save Sankey as Excel

    Request :
        - Sankey data as JSON

    Response :
        - 200 : OK
        - 401 : Error when saving sankey data
        - 402 : Error when saving mfa data
    """
    # Extract Sankey structure from JSON
    # try:
    data = request.form["data"]
    sankey_as_data = data
    sankey_as_json = json.loads(sankey_as_data)
    sankey = converter_funct["extract_sankey_from_json"](sankey_as_json)
    options = request.form["options"]
    options_save_excel = json.loads(options)
    # except Exception as excpt:
    #     return Response(
    #         response='save_excel: ' + str(excpt),
    #         status=500)
    # Save Sankey structure in Excel
    try:
        cwd = os.getcwd()
        excel_filename = os.path.join(cwd, "tutu.xlsx")
        io_excel = IOExcel()
        io_excel.write_excel_from_sankey(
            excel_filename, sankey, mode="w", **options_save_excel
        )
        # Ajoute le fichier json dans un onglet layout
        wb = openpyxl.load_workbook(excel_filename)
        layout_sheet = wb.create_sheet()
        layout_sheet.title = "layout"
        splitted_layout = cut_layout(sankey_as_data)
        cpt = 1
        for i in splitted_layout:
            layout_sheet["A" + str(cpt)].value = i
            cpt = cpt + 1
        wb.save("tutu.xlsx")
        return send_file(excel_filename, as_attachment=True)
    except Exception as excpt:
        response = Response(
            response="write_excel_from_sankey : " + str(excpt), status=500
        )
        return response
    return Response(status=200)


@opensankey.route("/excel/save/post_clean", methods=["POST"])
def clean_excel():
    cwd = os.getcwd()
    excel_filename = os.path.join(cwd, "tutu.xlsx")
    os.remove(excel_filename)
    response = Response(status=200)
    return response


def cut_layout(layout):
    """
    Split the layout string to substring in an array, each substring is as long as 32767 character maximum wich
      is the maximum number of character a cell in excel can contains

    Input :
        - layout (String) : json_data of the sankey as string

    Output :
        - tab_layout (Array of string) : Array of the json_data splitted
    """
    return [layout[i: i + 32767] for i in range(0, len(layout), 32767)]


@opensankey.route("/excel/upload/check_process", methods=["POST"])
def excel_check_process():
    if "load_started" not in session or session["load_started"] is False:
        trace.logger.debug(session["base_filename"])
        trace.logger.debug("not started")
        return Response(json.dumps({}), status=200, mimetype="application/json")
    try:
        # trace.logger.debug(session['base_filename'])
        # trace.logger.debug('open')
        if os.path.isfile(session["base_filename"]):
            # trace.logger.debug('is file')
            f = open(session["base_filename"], "r")
            # trace.logger.debug('opened')
            results = f.read()
            # trace.logger.debug('read')
            results_dict = {"output": results}
            json_data = json.dumps(results_dict)
            # trace.logger.debug('dumps')
            return Response(json_data, status=200, mimetype="application/json")
        else:
            return Response(
                json.dumps(
                    {
                        "output": "ERROR: excel/upload/check_process: le fichier tmp_log n'existe pas."
                    }
                ),
                status=500,
                mimetype="application/json",
            )
    except json.JSONDecodeError:
        return Response(
            json.dumps(
                {
                    "output": "ERROR: excel/upload/check_process: le fichier tmp_log ne peut pas être ouvert."
                }
            ),
            status=500,
            mimetype="application/json",
        )


@opensankey.route("/excel/upload/retrieve_results", methods=["POST"])
def load_retrieves_result():
    session["load_started"] = False
    try:
        json_file = open(session["output_file_name"], encoding="utf-8", mode="r")
        json_data = json.load(json_file)
        json_file.close()
        response = Response(
            json.dumps(json_data), status=200, mimetype="application/json"
        )
        return response
    except Exception:
        trace.logger.error("load_retrieves_result failed")
        response = Response(json.dumps("{}"), status=510, mimetype="application/json")
        return response


@opensankey.route("/excel/upload/launch", methods=["POST"])
def upload_excel():
    """
    HTTP POST request to upload Sankey from Excel file

    Request :
        - file (string) : file to load

    Response :
        - 200 : Always
    """
    # Inform about starting
    session["load_started"] = True
    # Create logfile for debug
    log_dir = tempfile.mkdtemp()  # Temporary dir
    log_filename = log_dir + os.path.sep + "rollover.log"
    session["logname"] = log_filename
    # Init trace for user
    trace.logger_init(log_filename, "w")
    session["base_filename"] = trace.base_filename()
    # trace.logger.debug(session['base_filename'])
    # Get input Excel filename
    excel_input_file = request.files["file"]
    # Create conversion files
    tmp_dir = tempfile.mkdtemp()  # Tempory dir for conversion
    excel_input_filename = os.path.join(tmp_dir, "tutu.xlsx")
    excel_input_file.save(excel_input_filename)
    session["output_file_name"] = os.path.join(tmp_dir, "tutu.json")
    # trace.logger.debug(session['output_file_name'])
    # Use threads depending on input Excel file size
    file_stats = os.stat(excel_input_filename)
    if file_stats.st_size > 1000000:  # Excel > 1mo
        thread = Thread(
            target=upload_excel_thread,
            args=(
                excel_input_filename,
                session["base_filename"],
                log_filename,
                session["output_file_name"],
                False,
            ),
        )
        thread.daemon = True
        thread.start()
        trace.logger.debug("thread launched")
    else:  # Excel <= 1mo
        try:
            upload_excel_thread(
                excel_input_filename,
                session['base_filename'],
                log_filename,
                session['output_file_name'],
                False
            )
        except Exception as excpt:
            trace.logger.debug('upload_excel_thread failed: ' + str(excpt))
    # response
    response = Response(response="{}", status=200, mimetype="application/json")
    return response


def upload_excel_thread(
    excel_input_filename,
    trace_filename,
    log_filename,
    json_output_filename,
    use_layout_file,
):
    """
    Excel convertion thread function.

    Parameters
    ----------
    excel_input_filename : string
        input excel file name (with full path)
    trace_filename : string
        user trace file name (with full path).
    log_filename: string
        debug logs file name (with full path)
    json_output_filename : string
        output json file name (with full path)
    use_layout_file: bool
        read layout from input file or not.

    Returns
    -------
    None
    """
    # Init trace for user
    trace.logger_init(log_filename, "a")
    max_line_length = 50
    # Step 1 : Open and read Excel
    trace.logger.info("{:-<{w}}".format("Loading excel ", w=max_line_length))
    trace.logger.debug("File to load : {}".format(excel_input_filename.split("/")[-1]))
    # Parse to sankey struct
    io_excel = IOExcel()
    ok_load, log_load = io_excel.load_sankey_from_excel_file(excel_input_filename)
    if ok_load:
        trace.logger.info("{:->{w}}".format(" Success", w=max_line_length))
    else:
        for _ in log_load.split("\n"):
            trace.logger.error(_)
        trace.logger.error("{:->{w}}".format(" FAILED", w=max_line_length))
        return
    # Step 2 : Extract sankey data
    sankey = io_excel.sankey
    trace.logger.info(
        "{:-<{w}}".format("Extract diagram structure ", w=max_line_length)
    )
    try:
        sankey_json = converter_funct["extract_json_from_sankey"](sankey)
        trace.logger.info("{:->{w}}".format(" Success", w=max_line_length))
    except Exception as expt:
        trace.logger.error("Extract Diagram Structure Failed: " + str(expt))
        trace.logger.error("{:->{w}}".format(" FAILED", w=max_line_length))
        return
    # Step 3 : Extract layout
    if use_layout_file:
        # Try to get layout from another file
        if "_reconciled" in trace_filename:
            layout_filename = (
                os.path.splitext(trace_filename)[0].replace("_reconciled", "_layout")
                + ".json"
            )
        else:
            layout_filename = os.path.splitext(trace_filename)[0] + "_layout.json"
        # Start extracting layout
        trace.logger.info(
            "{:-<{w}}".format("Extract diagram layout ", w=max_line_length)
        )
        try:
            sankey_folder = os.path.join(
                os.path.dirname(excel_input_filename), "sankey"
            )
            layout_filename = os.path.join(sankey_folder, layout_filename)
            if os.path.exists(layout_filename):
                layout_file = open(layout_filename, encoding="utf-8", mode="r")
                layout_json = json.load(layout_file)
                sankey_json["layout"] = layout_json
            sankey_json["file_name"] = layout_filename
            trace.logger.info("{:->{w}}".format(" Success", w=max_line_length))
        except Exception as expt:
            trace.logger.error("Extract diagram layout Failed: " + str(expt))
            trace.logger.error("{:->{w}}".format(" FAILED", w=max_line_length))
            return
    else:
        # Try to read layout directly from excel file
        layout_table_present = False
        try:
            # If it has been read before, we will never have any issue here
            layout_table = pd.read_excel(excel_input_filename, "layout")
            layout_table_present = True
            trace.logger.info(
                "{:-<{w}}".format("Extract diagram layout ", w=max_line_length)
            )
            layout_json_str = layout_table.columns[0] + "".join(
                [layout_table.iloc[_][0] for _ in layout_table.index]
            )
            layout_json = json.loads(layout_json_str)
            sankey_json["layout"] = layout_json
            trace.logger.info("{:->{w}}".format(" Success", w=max_line_length))
        except Exception as expt:
            if layout_table_present:
                trace.logger.error("Extract diagram layout Failed: " + str(expt))
                trace.logger.error("{:->{w}}".format(" FAILED", w=max_line_length))
            pass
    # Step 4 : Dump everything in local json for display
    trace.logger.info("{:-<{w}}".format("Loading diagram display ", w=max_line_length))
    try:
        json_data = json.dumps(sankey_json)
        with open(json_output_filename, "w") as outfile:
            outfile.write(json_data)
        trace.logger.info("{:->{w}}".format(" FINISHED", w=max_line_length))
        return
    except Exception as expt:
        trace.logger.error("Loading diagram display: " + str(expt))
        trace.logger.error("{:->{w}}".format(" FAILED", w=max_line_length))
        return


@opensankey.route("/example/upload", methods=["POST"])
def upload_exemple():
    session["load_started"] = True
    tmp_dir = tempfile.mkdtemp()
    logname = tmp_dir + os.path.sep + "rollover.log"
    session["logname"] = logname
    trace.logger_init(logname, "w")
    session["base_filename"] = trace.base_filename()
    data_folder = os.environ.get("MFAData")

    exemple = request.get_data().decode("utf-8")
    exemple_file_path = os.path.join(data_folder, exemple)
    base_file_name = os.path.basename(exemple_file_path)
    extension = os.path.splitext(exemple_file_path)[1]
    output_directory = tempfile.mkdtemp()
    session["output_file_name"] = os.path.join(output_directory, "tutu.json")

    if extension == ".xlsx":
        file_stats = os.stat(exemple_file_path)
        if file_stats.st_size > 1000000:
            thread = Thread(
                target=upload_excel_thread,
                args=(
                    exemple_file_path,
                    base_file_name,
                    logname,
                    session["output_file_name"],
                    True,
                ),
            )
            thread.daemon = True
            thread.start()
            trace.logger.debug("thread launched")
            return Response(response="{}", status=200, mimetype="application/json")
        else:
            try:
                upload_excel_thread(
                    exemple_file_path,
                    base_file_name,
                    logname,
                    session["output_file_name"],
                    True,
                )
                return Response(response="{}", status=200, mimetype="application/json")
            except Exception as excpt:
                trace.logger.debug("upload_excel_thread failed: " + str(excpt))
                return Response(response="{}", status=500, mimetype="application/json")

    elif extension == ".json" or extension == ".gz":
        return handle_json_or_compressed(data_folder, exemple, exemple_file_path)

    else:
        return Response(
            response=json.dumps({"error": f"Extension {extension} non supportée"}),
            status=400,
            mimetype="application/json",
        )


def handle_json_or_compressed(data_folder, exemple, exemple_file_path):
    """
    Gère les fichiers JSON et JSON.GZ avec compression à la volée si nécessaire

    Args:
        data_folder (str): Dossier racine des données
        exemple (str): Nom du fichier demandé
        exemple_file_path (str): Chemin complet vers le fichier

    Returns:
        Response: Fichier compressé en gzip
    """
    try:
        # Déterminer les chemins des fichiers JSON et JSON.GZ
        if exemple.endswith(".json.gz"):
            # Cas 1: Fichier .json.gz demandé
            json_gz_path = exemple_file_path
            json_path = exemple_file_path.replace(".json.gz", ".json")
        elif exemple.endswith(".json"):
            # Cas 2: Fichier .json demandé, mais on veut retourner du .json.gz
            json_path = exemple_file_path
            json_gz_path = exemple_file_path + ".gz"
        else:
            return Response(
                response=json.dumps({"error": "Format de fichier non supporté"}),
                status=400,
                mimetype="application/json",
            )

        trace.logger.debug(f"Demande: {exemple}")
        trace.logger.debug(f"JSON path: {json_path}")
        trace.logger.debug(f"JSON.GZ path: {json_gz_path}")

        # Vérifier si le fichier .json.gz existe déjà
        if os.path.exists(json_gz_path):
            trace.logger.debug(f"Fichier compressé trouvé: {json_gz_path}")
            return serve_compressed_file(json_gz_path)

        # Si pas de .json.gz, vérifier si le .json existe
        elif os.path.exists(json_path):
            trace.logger.debug(
                f"Fichier JSON trouvé, compression à la volée: {json_path}"
            )
            return compress_and_serve_json(json_path, json_gz_path)

        else:
            # Aucun fichier trouvé
            error_msg = (
                f"Fichier non trouvé: {exemple} (ni {json_path} ni {json_gz_path})"
            )
            trace.logger.error(error_msg)
            return Response(
                response=json.dumps({"error": error_msg}),
                status=404,
                mimetype="application/json",
            )

    except Exception as e:
        trace.logger.error(f"Erreur dans handle_json_or_compressed: {str(e)}")
        return Response(
            response=json.dumps({"error": f"Erreur serveur: {str(e)}"}),
            status=500,
            mimetype="application/json",
        )


def serve_compressed_file(json_gz_path):
    """
    Sert un fichier JSON.GZ avec headers corrects pour GZIP
    """
    try:
        with open(json_gz_path, "rb") as f:
            compressed_data = f.read()

        file_size = len(compressed_data)
        trace.logger.debug(
            f"Fichier compressé servi: {json_gz_path} ({file_size} bytes)"
        )

        return Response(
            response=compressed_data,
            status=200,
            # ✅ CORRECTIONS :
            headers={
                # ESSAI 1: Dire que c'est du binaire, pas du JSON compressé
                "Content-Type": "application/octet-stream",  # ← Changé !
                # 'Content-Encoding': 'gzip',  # ← SUPPRIMÉ temporairement
                "Content-Length": str(file_size),
                "Cache-Control": "public, max-age=3600",
                "Content-Disposition": "inline",  # ← Bonus: indique comment traiter
            },
        )

    except Exception as e:
        trace.logger.error(f"Erreur lecture fichier compressé {json_gz_path}: {str(e)}")
        return Response(
            response=json.dumps({"error": f"Erreur lecture fichier: {str(e)}"}),
            status=500,
            mimetype="application/json",
        )


def compress_and_serve_json(json_path, json_gz_path):
    """
    Compresse un fichier JSON à la volée avec headers corrects
    """
    try:
        # Lire et valider le JSON
        with open(json_path, "r", encoding="utf-8") as f:
            json_data = json.load(f)

        # Ajouter le chemin du fichier dans les métadonnées
        json_data["file_name"] = json_path

        # Sérialiser en JSON compact
        json_string = json.dumps(json_data, separators=(",", ":"), ensure_ascii=False)
        json_bytes = json_string.encode("utf-8")

        # Compresser
        compressed_data = gzip.compress(json_bytes)

        # Statistiques
        original_size = len(json_bytes)
        compressed_size = len(compressed_data)
        ratio = (1 - compressed_size / original_size) * 100

        trace.logger.debug(
            f"Compression: {original_size} → {compressed_size} bytes ({ratio:.1f}% économie)"
        )

        # Sauvegarder
        try:
            with open(json_gz_path, "wb") as f:
                f.write(compressed_data)
            trace.logger.debug(f"Fichier compressé sauvegardé: {json_gz_path}")
        except Exception as save_error:
            trace.logger.warning(
                f"Impossible de sauvegarder {json_gz_path}: {str(save_error)}"
            )

        # ✅ HEADERS CORRIGÉS :
        return Response(
            response=compressed_data,
            status=200,
            headers={
                "Content-Type": "application/json",  # ← Type décompressé
                "Content-Encoding": "gzip",  # ← Compression
                "Content-Length": str(compressed_size),
                "X-Original-Size": str(original_size),
                "X-Compression-Ratio": f"{ratio:.1f}%",
            },
            # PAS de mimetype='application/gzip' pour éviter la confusion
        )

    except json.JSONDecodeError as json_error:
        trace.logger.error(f"Erreur JSON dans {json_path}: {str(json_error)}")
        return Response(
            response=json.dumps({"error": f"Fichier JSON invalide: {str(json_error)}"}),
            status=400,
            mimetype="application/json",
        )
    except Exception as e:
        trace.logger.error(f"Erreur compression {json_path}: {str(e)}")
        return Response(
            response=json.dumps({"error": f"Erreur compression: {str(e)}"}),
            status=500,
            mimetype="application/json",
        )


@opensankey.route("/example/download", methods=["POST"])
def download_examples():
    data_folder = os.environ.get("MFAData")
    # exemples_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'exemples')
    exemple = request.get_data().decode("utf-8")
    exemple_file_path = os.path.join(data_folder, exemple)
    if os.path.exists(exemple_file_path):
        return send_file(exemple_file_path, as_attachment=True)
    return Response(exemple_file_path, status=400, mimetype="text")


def parse_folder(current_dir, menus, key=None):
    if os.path.isfile(current_dir):
        return
    folder_content = os.listdir(current_dir)
    folder_content.sort()
    exemple_found = False

    extension_to_avoid = [
        ".gitkeep",
        ".vscode",
        "mfadata",
        "not_tested",
        "sankeylayout",
        ".git",
        ".md",
        "Archive",
        "new",
        "prev",
        "artifacts",
        "Old",
        "old",
        "Matériaux",
        "Documents",
        "Clients",
        "public",
    ]

    for file_or_folder in folder_content:
        if any([_ in file_or_folder for _ in extension_to_avoid]):
            continue
        if ".xlsx" in file_or_folder and "old." not in file_or_folder:
            if key not in menus:
                menus[key] = {}
            if "Files" not in menus[key]:
                menus[key]["Files"] = []
            reconciled_file = os.path.splitext(file_or_folder)[0] + "_reconciled.xlsx"
            reconciled_path = os.path.join(current_dir, reconciled_file)
            if os.path.isfile(reconciled_path):
                continue
            menus[key]["Files"].append(file_or_folder)
            menus[key]["Files"].sort()
            exemple_found = True
            continue
        if ".json" in file_or_folder or ".json.gz" in file_or_folder:
            if key not in menus:
                menus[key] = {}
            if "Files" not in menus[key]:
                menus[key]["Files"] = []
            menus[key]["Files"].append(file_or_folder)
            menus[key]["Files"].sort()
            exemple_found = True
            continue
        if os.path.isfile(os.path.join(current_dir, file_or_folder)):
            continue
        child_key = file_or_folder
        if key is not None:
            if key not in menus:
                menus[key] = {}
            folder_found = parse_folder(
                os.path.join(current_dir, file_or_folder), menus[key], child_key
            )
            if folder_found:
                exemple_found = True
        else:
            folder_found = parse_folder(
                os.path.join(current_dir, file_or_folder), menus, child_key
            )
            if folder_found:
                exemple_found = True

    if not exemple_found and key in menus:
        del menus[key]
    return exemple_found


@opensankey.route("/menus/templates", methods=["POST"])
def menus_templates():
    """
    Return data from MFAData/Modèles/Template

    Returns
    -------
    :return: _description_
    :rtype: _type_
    """
    data_folder = os.environ.get("MFAData")
    data_folder += "/Modèles/Template/"
    data_index = {}
    with open(data_folder + "index.json") as file_index:
        data_index = json.load(file_index)
    response = Response(
        response=json.dumps(data_index), status=200, mimetype="application/json"
    )
    return response


@opensankey.route("/menus/examples", methods=["POST"])
def menus_examples():
    """
    _summary_

    Returns
    -------
    :return: _description_
    :rtype: _type_
    """
    data_folder = os.environ.get("MFAData")
    menus = {}
    # try:
    parse_folder(data_folder, menus)
    context = {"exemples_menu": menus}
    json_data = json.dumps(context)
    response = Response(response=json_data, status=200, mimetype="application/json")
    # except Exception as expt:
    #     response = Response(
    #         response=str(expt),
    #         status=500,
    #         mimetype='application/json'
    #     )
    # Try to import images from MFAData/OpenSankey/image_preview to static/media
    try:
        current_folder = os.environ.get("MFAData")
        list_in_folder = os.listdir(current_folder)
        if "MFAData" in list_in_folder and "image_preview" in os.listdir(
            current_folder + "\\MFAData\\Formations\\Démos\\OpenSankey\\"
        ):
            folder_image = (
                current_folder
                + "\\MFAData\\Formations\\Démos\\OpenSankey\\image_preview"
            )
            for i in os.listdir(folder_image):
                if i not in os.listdir(image_template_folder):
                    os.symlink(
                        folder_image + "\\" + i, image_template_folder + "\\" + i
                    )
    except Exception as expt:
        print(str(expt))
        response = Response(response=str(expt), status=500, mimetype="application/json")
        return response

    return response


@opensankey.route("/menus/tutorials", methods=["POST"])
def data_tuto():
    """
    Return data from MFAData/Formation/Tutoriels

    Returns
    -------
    :return: object formated for Component ModalTuto
    :rtype: object
    """
    data_folder = os.environ.get("MFAData")
    data_folder += "/Formations/Tutoriels"
    menus = {}
    parse_folder(data_folder, menus)
    context = menus
    json_data = json.dumps(context)
    response = Response(response=json_data, status=200, mimetype="application/json")

    return response


@opensankey.route("/open_sankeymatic", methods=["POST"])
def open_sankeymatic():

    try:
        # Get input Excel filename
        text_input_file = request.files["file_content"]

        # Create conversion files
        tmp_dir = tempfile.mkdtemp()  # Tempory dir for conversion
        text_input_filename = os.path.join(tmp_dir, "toto.txt")
        text_input_file.save(text_input_filename)

        ok, msg, json_obj = sankeymatic.parse_sankeymatic_file(text_input_filename)
        if not ok:
            print(msg)
        clean_file(text_input_filename, "Clean_TXT")

        response = Response(
            response=json.dumps(json_obj), status=200, mimetype="application/json"
        )
        return response
    except Exception as e:
        current_app.logger.error("OPEN SANKEY MATIC | {0}".format(e))
        abort(500)
    return Response(
        json.dumps({"output": "ERROR: load_process: le fichier tmp_log n'existe pas."}),
        status=500,
        mimetype="application/json",
    )


def _html_to_image(
    html_file,
    output_filename,
    output_format,
    output_height_px=None,
    output_width_px=None,
):
    # Get html page as str
    html_as_str = '<meta charset="utf-8">' + html_file.read().decode("UTF-8")
    # Deal with Textpaths
    for match in re.finditer(r"<textPath[ A-zÀ-ú0-9\"\'\(\)\-=#%_]*", html_as_str):
        match_str = match[0]
        new_str = match_str.replace("href", "xlink:href")
        html_as_str = html_as_str.replace(match_str, new_str)
    # Keep css style when exporting
    css = []
    # If find css file then add it before convert to image
    if os.path.exists(os.getcwd() + "/" + "client/build/static"):
        tmp = os.listdir("client/build/static/css")
        for s in tmp:
            if "main" in s:
                css.append("client/build/static/css/" + s)
    elif os.path.exists(os.getcwd() + "/" + "client/build/static/sankeyapp"):
        tmp = os.listdir("client/build/static/sankeyapp/css")
        for s in tmp:
            if "main" in s:
                css.append("client/build/static/sankeyapp/css/" + s)
    elif os.path.exists(os.getcwd() + "/" + "client/build/static/flowapp"):
        tmp = os.listdir("client/build/static/flowapp/css")
        for s in tmp:
            if "main" in s:
                css.append("client/build/static/flowapp/css/" + s)

    # Common options for conversions
    options = {"enable-local-file-access": ""}
    if output_height_px is not None:
        options["page-height"] = output_height_px + "px"
    if output_width_px is not None:
        options["page-width"] = output_width_px + "px"
    # Convert as png
    if output_format == "png":
        imgkit.from_string(html_as_str, output_filename, css=css, options=options)
    else:
        # Options for pdf / svg conversions
        options.update(
            {
                "margin-top": "1cm",
                "margin-right": "1cm",
                "margin-bottom": "1cm",
                "margin-left": "1cm",
            }
        )
        if output_height_px is not None:
            options["page-height"] = output_height_px + "px"
        if output_width_px is not None:
            options["page-width"] = output_width_px + "px"
        if output_format == "pdf":
            pdfkit.from_string(html_as_str, output_filename, css=css, options=options)
        else:
            pdfkit.from_string(
                html_as_str, output_filename + ".pdf", css=css, options=options
            )
            os.system(
                "inkscape "
                + "--export-filename={0} {1}".format(
                    output_filename, output_filename + ".pdf"
                )
            )
            os.remove(output_filename + ".pdf")


@opensankey.route("/save/svg", methods=["POST"])
def save_svg():
    """
    HTTP POST request to save current sankey as PNG

    Input : Data as html (current page)

    Output : Send png file
    """
    # Launch conversion
    filename = "tutu.svg"
    try:
        _html_to_image(request.files["html"], filename, "svg")
    except Exception as e:
        current_app.logger.error("SAVE_SVG | {0}".format(e))
        abort(500)
    return send_file(os.path.join(os.getcwd(), filename), as_attachment=True)


@opensankey.route("/save/png", methods=["POST"])
def save_png():
    """
    HTTP POST request to save current sankey as PNG

    Input : Data as html (current page)

    Output : Send png file
    """
    # Launch conversion
    filename = "tutu.png"
    try:
        # Export
        _html_to_image(request.files["html"], filename, "png")
        # Resize
        size_str = request.form["size"]
        size_int = []
        if len(size_str.split()) == 2:
            size_int = list(map(lambda num: int(num), size_str.split()))
        if len(size_int) == 2:
            im = Image.open(filename)
            im_resized = im.resize(size_int)
            im_resized.save(filename, "PNG")
    except Exception as e:
        current_app.logger.error("SAVE_PNG | {0}".format(e))
        abort(500)
    return send_file(os.path.join(os.getcwd(), filename), as_attachment=True)


# Create opensanker app routes
@opensankey.route("/save/pdf", methods=["POST"])
def save_pdf():
    """
    HTTP POST request to save current sankey as PDF

    Input : Data as html (current page)

    Output : Send pdf file
    """
    # Launch conversion with pdfkit
    filename = "tutu.pdf"
    try:
        _html_to_image(
            request.files["html"],
            filename,
            "pdf",
            output_height_px=request.form["height"],
            output_width_px=request.form["width"],
        )
    except Exception as e:
        current_app.logger.error("SAVE_PDF | {0}".format(e))
        abort(500)
    return send_file(os.path.join(os.getcwd(), filename), as_attachment=True)


@opensankey.route("/save/svg/post_clean", methods=["POST"])
def clean_svg():
    """
    HTTP POST request to remove remaining generated png image

    Input : None

    Output :
        - Response 200 : OK
        - Response 500 : Unknown exception
    """
    return clean_file("tutu.svg", "CLEAN_SVG")


@opensankey.route("/save/png/post_clean", methods=["POST"])
def clean_png():
    """
    HTTP POST request to remove remaining generated png image

    Input : None

    Output :
        - Response 200 : OK
        - Response 500 : Unknown exception
    """
    return clean_file("tutu.png", "CLEAN_PNG")


@opensankey.route("/save/pdf/post_clean", methods=["POST"])
def clean_pdf():
    """
    HTTP POST request to remove remaining generated pdf image

    Input : None

    Output :
        - Response 200 : OK
        - Response 500 : Unknown exception
    """
    return clean_file("tutu.pdf", "CLEAN_PDF")


def clean_file(filename, fctname):
    """
    Delete a given file from server.

    Input :
        - filename (String) : File to be delete
        - fctname (String) : Name of the calling function for error logging

    Output :
        - 200 : OK
        - 500 : Unknown exception
    """
    # Try to remove file
    try:
        os.remove(filename)
    except FileNotFoundError:
        current_app.logger.debug("{0} | No file {1} found".format(fctname, filename))
    except Exception as e:
        current_app.logger.error("{0} | Error : {1}".format(fctname, e))
        abort(500)
    # Everything is fine
    return Response(status=200)


@opensankey.route("/url/load_json", methods=["POST"])
def url_load_json():
    """
    HTTP POST request to get json from url path

    Input : None

    Output : data (json) from url as string

    """
    try:
        url_front = request.form["url"]
        # Requête HTTP pour récupérer le fichier compressé
        response = requests.get(url_front)
        response.raise_for_status()  # Lève une exception en cas d'erreur HTTP

        # Décompression avec gzip via un flux mémoire
        with gzip.GzipFile(fileobj=BytesIO(response.content)) as fichier_gzip:
            contenu_json = fichier_gzip.read().decode("utf-8")  # Décodage en texte
            donnees = json.loads(contenu_json)  # Conversion en objet Python
            return donnees

    except requests.exceptions.RequestException as e:
        print(f"Erreur de requête : {e}")
    except gzip.BadGzipFile as e:
        print(f"Fichier Gzip invalide : {e}")
    except json.JSONDecodeError as e:
        print(f"Erreur de décodage JSON : {e}")
    except Exception as e:
        print(f"Erreur inattendue : {e}")

    return None
