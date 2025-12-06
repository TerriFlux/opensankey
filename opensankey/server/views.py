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
# flake8: noqa

import tempfile
import os
import json
import time

from SankeyExcelParser.io_base import conversion_thread

from .views_utils import clean_file, handle_json_or_compressed, parse_folder
import requests

from threading import Thread, Lock

# Flask modules imports
from flask import abort, make_response
from flask import Blueprint
from flask import current_app
from flask import render_template
from flask import request
from flask import Response
from flask import send_file
from flask import session

import SankeyExcelParser.su_trace as trace
from SankeyExcelParser.io_base import IOExcel, IOJson
from . import sankeymatic

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

opensankey = Blueprint(
    "opensankey",
    __name__,
    static_folder=static_folder,
    template_folder=template_folder,
    static_url_path="/static/opensankey",
)

image_template_folder = os.path.join(
    os.path.join(
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "client"),
        "src",
    ),
    "images",
)


def get_process_state():  # ← Plus de paramètre session_id
    """Récupère l'état depuis Flask session"""
    return session.get('process_state', {
        'process_started': False,
        'logname': None,
        'output_file_name': None,
        'input_format': None,
        'output_format': None
    })


def set_process_state(**kwargs):  # ← Plus de paramètre session_id
    """Stocke l'état dans Flask session"""
    if 'process_state' not in session:
        session['process_state'] = {}
    session['process_state'].update(kwargs)
    session.modified = True  # ← IMPORTANT !


@opensankey.route("/")
def start():
    return render_template("index.html", filename="", static_site="false")


@opensankey.route("/<adress>")
def goto(adress):
    return render_template(adress)

# @opensankey.route("/excel/save", methods=["POST"])
# def save_excel():
#     """
#     HTTP POST request to save Sankey as Excel

#     Request :
#         - Sankey data as JSON

#     Response :
#         - 200 : OK
#         - 401 : Error when saving sankey data
#         - 402 : Error when saving mfa data
#     """
#     # Extract Sankey structure from JSON
#     # try:
#     data = request.form["data"]
#     sankey_as_data = data
#     sankey_as_json = json.loads(sankey_as_data)
#     io_json = IOJson()
#     ok, log = io_json.load_sankey_from_json(sankey_as_json, do_coherence_checks=False)
#     #sankey = extract_sankey_from_json(sankey_as_json)
#     options = request.form["options"]
#     options_save_excel = json.loads(options)
#     # except Exception as excpt:
#     #     return Response(
#     #         response='save_excel: ' + str(excpt),
#     #         status=500)
#     # Save Sankey structure in Excel
#     # try:
#     cwd = os.getcwd()
#     excel_filename = os.path.join(cwd, "tutu.xlsx")
#     io_excel = IOExcel()
#     io_excel.write_sankey(excel_filename, mode="w", **options_save_excel)
#     if options_save_excel["layout"]:
#         # Ajoute le fichier json dans un onglet layout
#         wb = openpyxl.load_workbook(excel_filename)
#         layout_sheet = wb.create_sheet()
#         layout_sheet.title = "layout"
#         splitted_layout = cut_layout(sankey_as_data)
#         cpt = 1
#         for i in splitted_layout:
#             layout_sheet["A" + str(cpt)].value = i
#             cpt = cpt + 1
#         wb.save("tutu.xlsx")
#     return send_file(excel_filename, as_attachment=True)
#     # except Exception as excpt:
#     #     response = Response(response="write_sankey : " + str(excpt), status=500)
#     #     return response
#     return Response(status=200)

# @opensankey.route("/excel/save/post_clean", methods=["POST"])
# def clean_excel():
#     cwd = os.getcwd()
#     excel_filename = os.path.join(cwd, "tutu.xlsx")
#     os.remove(excel_filename)
#     response = Response(status=200)
#     return response


@opensankey.route("/upload/check_process", methods=["POST"])
def check_process():
    state = get_process_state()
    if not state['process_started']:
        if 'logname' not in state:
            return Response(json.dumps({}), status=200, mimetype="application/json")
        trace.logger.debug(state["logname"])
        trace.logger.debug("not started")
        return Response(json.dumps({"not_started": True}), status=200, mimetype="application/json")
    try:
        trace.logger.debug(state['logname'])
        trace.logger.debug('open')
        logname = state['logname']
        if os.path.isfile(logname):
            trace.logger.debug('is file')
            f = open(logname, "r")
            trace.logger.debug('opened')
            results = f.read()
            f.close()  # ← AJOUT: fermer le fichier
            trace.logger.debug('read')
            results_dict = {
                "log_name": logname,
                "output": results
            }
            json_data = json.dumps(results_dict)
            # trace.logger.debug('dumps')
            return Response(json_data, status=200, mimetype="application/json")
        else:
            return Response(
                json.dumps({"output": "ERROR: /upload/check_process: le fichier tmp_log n'existe pas."}),
                status=500,
                mimetype="application/json",
            )
    except json.JSONDecodeError:
        return Response(
            json.dumps({"output": "ERROR: /upload/check_process: le fichier tmp_log ne peut pas être ouvert."}),
            status=500,
            mimetype="application/json",
        )


@opensankey.route("/upload/retrieve_result", methods=["POST"])
def retrieve_result():
    """
    Route générique pour récupérer le fichier résultat d'un traitement.
    Gère automatiquement le mimetype selon l'extension du fichier.
    Fonctionne pour :
    - Conversions (Excel, Pickle, JSON)
    - Chargements Excel/Pickle → JSON
    """
    state = get_process_state()

    # Marquer le processus comme terminé
    set_process_state(process_started=False)

    try:
        output_file_name = state.get("output_file_name")
        json_gz_path = output_file_name
        if output_file_name.endswith(".json"):
            json_gz_path = output_file_name + ".gz"

        if not output_file_name:
            return Response(
                json.dumps({"error": "No active session"}),
                status=400,
                mimetype="application/json"
            )

        if not os.path.exists(output_file_name) and not os.path.exists(json_gz_path):
            return Response(
                json.dumps({"error": "Output file not found"}),
                status=404,
                mimetype="application/json"
            )
        # Déterminer l'extension et le mimetype
        root_file_name, ext = os.path.splitext(output_file_name)
        ext = ext.lower()
        output_format = request.form.get("output_format", "json")
        if output_format == 'excel' and ext == '.json':
            io_json = IOJson()
            ok, msg = io_json.load_sankey(output_file_name)
            if not ok:
                trace.logger.error(f"-- ERROR loading sankey from Pickle: {msg}")
                trace.logger.info("{:-<{w}}".format(" [FAILED] Could not load sankey", w=120))
                return Response(
                    json.dumps({"error": "Output file not found"}),
                    status=405,
                    mimetype="application/json"
                )
            io_excel = IOExcel(io_json.sankey)
            io_excel.write_sankey(_ + ".xlsx")
            ext = "xlsx"
            output_file_name = _ + ".xlsx"

        # Mapping extensions → mimetypes
        mimetype_map = {
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.pkl': 'application/octet-stream',
            '.json': 'application/json',
            '.csv': 'text/csv',
            '.txt': 'text/plain'
        }

        # Mapping extensions → noms de téléchargement
        download_name_map = {
            '.xlsx': root_file_name + '.xlsx',
            '.json': root_file_name + '.json',
            '.csv': root_file_name + '.csv',
            '.txt': root_file_name + '.txt'
        }

        mimetype = mimetype_map.get(ext, 'application/octet-stream')
        download_name = download_name_map.get(ext, root_file_name + ext)

        trace.logger.info(f"Envoi du fichier: {output_file_name} ({mimetype})")
        output_file_name = handle_json_or_compressed(output_file_name)
        return send_file(
            output_file_name,
            as_attachment=True,
            download_name=download_name,
            mimetype=mimetype
        )

    except Exception as excpt:
        trace.logger.error(f"retrieve_result failed: {str(excpt)}")
        return Response(
            json.dumps({"error": str(excpt)}),
            status=500,
            mimetype="application/json"
        )


@opensankey.route("/upload/retrieve_json", methods=["POST"])
def retrieve_json():
    """
    Route générique pour récupérer le fichier résultat d'un traitement.
    """
    state = get_process_state()

    log_dir = tempfile.mkdtemp()
    log_filename = log_dir + os.path.sep + "rollover.log"
    trace.logger_init(log_filename, "w")

    set_process_state(
        process_started=True,
        logname=log_filename
    )

    try:
        input_file_name = state.get("output_file_name")

        if not input_file_name:
            return Response(
                json.dumps({"error": "No active session"}),
                status=400,
                mimetype="application/json"
            )

        if not os.path.exists(input_file_name):
            return Response(
                json.dumps({"error": "Output file not found"}),
                status=404,
                mimetype="application/json"
            )

        output_file_name = os.path.join(os.path.dirname(input_file_name), "output.json")

        input_format = state.get('input_format', 'excel')
        logname = state.get('logname')

        # Mettre à jour l'état
        set_process_state(
            input_filename=input_file_name,
            output_file_name=output_file_name,
            input_format=input_format,
            output_format='json'
        )

        # Use threading for large files
        thread = Thread(
            target=conversion_thread,
            args=(
                input_file_name,
                output_file_name,
                input_format,
                'json',
                {},
                {},
                logname
            ),
        )
        thread.daemon = True
        thread.start()
        trace.logger.debug("Conversion thread launched")

        return Response(response="{}", status=200, mimetype="application/json")

    except Exception as excpt:
        trace.logger.error(f"launch_conversion failed: {str(excpt)}")
        return Response(
            json.dumps({"error": str(excpt)}),
            status=500,
            mimetype="application/json"
        )


@opensankey.route("/convert/launch", methods=["POST"])
def launch_conversion():
    """
    Route universelle pour lancer une conversion de format.
    Paramètres attendus dans le formulaire :
    - file : fichier à convertir
    - input_format : 'excel' ou 'json'
    - output_format : 'excel' ou 'json'
    """
    try:
        tmp_dir = tempfile.mkdtemp()  # diff
        log_dir = tempfile.mkdtemp()
        log_filename = log_dir + os.path.sep + "rollover.log"
        # session["logname"] = log_filename
        trace.logger_init(log_filename, "w")

        input_format = request.form.get("input_format", "excel")
        output_format = request.form.get("output_format", "json")

        input_options = json.loads(request.form.get('input_options', '{}'))
        output_options = json.loads(request.form.get('output_options', '{}'))

        ext_map = {
            'excel': '.xlsx',
            'json': '.json',
            'blob': '.json'
        }
        if input_format != "example_excel" and input_format != "example_json":
            input_file_name = os.path.join(tmp_dir, f"input{ext_map[input_format]}")
        output_file_name = os.path.join(tmp_dir, f"output{ext_map[output_format]}")

        if input_format == "example_excel" or input_format == "example_json":
            data_folder = os.environ.get("MFAData")
            exemple = request.form["file_name"]
            input_file_name = os.path.join(data_folder, exemple)
            extension = os.path.splitext(input_file_name)[1]
            if extension == '.xlsx':
                input_format = 'excel'
            else:
                # input_format = 'json'
                output_file_name = input_file_name
                set_process_state(
                    process_started=True,
                    input_filename=input_file_name,
                    output_file_name=output_file_name,
                    input_format=input_format,
                    output_format=output_format,
                    logname=log_filename
                )
                trace.logger.info("{:->{w}}".format(" CONVERSION TERMINÉE", w=50))
                return Response(response="{}", status=200, mimetype="application/json")
                # return handle_json_or_compressed(data_folder, exemple, input_file_name)

        elif input_format != 'example_excel' and input_format != 'example_json' and input_format != 'blob':
            input_file = request.files["file"]
            input_file.save(input_file_name)

        # Stocker l'état dans le stockage global
        set_process_state(
            process_started=True,
            input_filename=input_file_name,
            output_file_name=output_file_name,
            input_format=input_format,
            output_format=output_format,
            logname=log_filename
        )

        if (input_format == "blob"):
            data = request.form["data"]
            sankey_as_data = data
            sankey_as_json = json.loads(sankey_as_data)
            io_json = IOJson()
            ok, log = io_json.load_sankey_from_json(sankey_as_json, do_coherence_checks=False)
            if not ok:
                trace.logger.error(f"FAILED load_sankey_from_json failed: {log}")
                return Response(
                    json.dumps({"error": str(log)}),
                    status=500,
                    mimetype="application/json"
                )
            io_json.write_sankey(input_file_name)
            input_format = "json"

        # Decide threading based on file size
        # file_stats = os.stat(input_file_name)
        # use_thread = file_stats.st_size > 500000  # 500KB threshold

        # if use_thread:
        # Use threading for large files
        thread = Thread(
            target=conversion_thread,
            args=(
                input_file_name,
                output_file_name,
                input_format,
                output_format,
                input_options,
                output_options,
                log_filename,
            ),
        )
        thread.daemon = True

        thread.start()
        trace.logger.debug("Conversion thread launched")

        return Response(response="{}", status=200, mimetype="application/json")

    except Exception as excpt:
        trace.logger.error(f"launch_conversion failed: {str(excpt)}")
        return Response(
            json.dumps({"error": str(excpt)}),
            status=500,
            mimetype="application/json"
        )


@opensankey.route("/upload/clean", methods=["POST"])
def clean():
    set_process_state(process_started=False)
    return Response(response="{}", status=200, mimetype="application/json")


@opensankey.route("/example/download", methods=["POST"])
def download_examples():
    data_folder = os.environ.get("MFAData")
    # exemples_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'exemples')
    exemple = request.get_data().decode("utf-8")
    exemple_file_path = os.path.join(data_folder, exemple)
    if os.path.exists(exemple_file_path):
        return send_file(exemple_file_path, as_attachment=True)
    return Response(exemple_file_path, status=400, mimetype="text")


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
    response = Response(response=json.dumps(data_index), status=200, mimetype="application/json")
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
            folder_image = current_folder + "\\MFAData\\Formations\\Démos\\OpenSankey\\image_preview"
            for i in os.listdir(folder_image):
                if i not in os.listdir(image_template_folder):
                    os.symlink(folder_image + "\\" + i, image_template_folder + "\\" + i)
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

        response = Response(response=json.dumps(json_obj), status=200, mimetype="application/json")
        return response
    except Exception as e:
        current_app.logger.error("OPEN SANKEY MATIC | {0}".format(e))
        abort(500)
    return Response(
        json.dumps({"output": "ERROR: load_process: le fichier tmp_log n'existe pas."}),
        status=500,
        mimetype="application/json",
    )


@opensankey.route("/url/load_json", methods=["POST"])
def url_load_json():
    """
    HTTP POST request to get file from url path
    Input : None
    Output : file content (raw, let browser handle decompression)
    """
    try:
        url_front = request.form["url"]
        # Requête HTTP pour récupérer le fichier
        response = requests.get(url_front)
        response.raise_for_status()

        # Retourner le contenu brut du fichier
        flask_response = make_response(response.content)

        # Important: NE PAS définir Content-Encoding: gzip
        # Laisser le navigateur gérer automatiquement la décompression
        if url_front.endswith(".gz"):
            flask_response.headers["Content-Type"] = "application/json"  # Type final attendu
        else:
            flask_response.headers["Content-Type"] = "application/json"

        return flask_response

    except Exception as e:
        print(f"Erreur : {e}")
        return {"error": str(e)}, 500


from . import views_export  # noqa
