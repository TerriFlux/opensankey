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

import gzip
import os
import json

from flask import current_app
from flask import Response

import SankeyExcelParser.su_trace as trace


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


def find_json_serialization_error(obj, path="root", max_depth=20, current_depth=0):
    """
    Trouve récursivement l'élément qui pose problème pour la sérialisation JSON.

    Returns:
        tuple: (success: bool, error_path: str, error_details: dict)
    """
    if current_depth > max_depth:
        return True, None, None

    try:
        # Test de sérialisation de l'objet actuel
        json.dumps(obj)
        return True, None, None
    except (TypeError, ValueError) as e:
        # L'objet n'est pas sérialisable, trouver le coupable

        if isinstance(obj, dict):
            # Tester les clés
            for key in obj.keys():
                try:
                    json.dumps(key)
                except (TypeError, ValueError):
                    return False, path, {
                        "type": "dict_key",
                        "key": repr(key)[:100],
                        "key_type": type(key).__name__,
                        "error": str(e)
                    }

            # Tester les valeurs récursivement
            for key, value in obj.items():
                success, error_path, details = find_json_serialization_error(
                    value,
                    f"{path}[{repr(key)[:50]}]",
                    max_depth,
                    current_depth + 1
                )
                if not success:
                    return False, error_path, details

        elif isinstance(obj, (list, tuple)):
            for i, item in enumerate(obj):
                success, error_path, details = find_json_serialization_error(
                    item,
                    f"{path}[{i}]",
                    max_depth,
                    current_depth + 1
                )
                if not success:
                    return False, error_path, details

        # Si on arrive ici, c'est l'objet lui-même qui pose problème
        return False, path, {
            "type": "value",
            "value": repr(obj)[:100],
            "value_type": type(obj).__name__,
            "error": str(e)
        }


def handle_json_or_compressed(exemple_file_path):
    """
    Gère les fichiers JSON et JSON.GZ avec compression à la volée si nécessaire

    Args:
        exemple (str): Nom du fichier demandé
        exemple_file_path (str): Chemin complet vers le fichier

    Returns:
        Response: Fichier compressé en gzip
    """
    try:
        # Déterminer les chemins des fichiers JSON et JSON.GZ

        if exemple_file_path.endswith(".json.gz"):
            # Cas 1: Fichier .json.gz demandé
            json_gz_path = exemple_file_path
            json_path = exemple_file_path.replace(".json.gz", ".json")
        elif exemple_file_path.endswith(".gz"):
            # Cas 1: Fichier .json.gz demandé
            json_gz_path = exemple_file_path
            json_path = exemple_file_path.replace(".gz", ".json")
        elif exemple_file_path.endswith(".json"):
            # Cas 2: Fichier .json demandé, mais on veut retourner du .json.gz
            json_path = exemple_file_path
            json_gz_path = exemple_file_path + ".gz"
        else:
            return False

        trace.logger.debug(f"Demande: {exemple_file_path}")
        trace.logger.debug(f"JSON path: {json_path}")
        trace.logger.debug(f"JSON.GZ path: {json_gz_path}")

        # Vérifier si le fichier .json.gz existe déjà
        if os.path.exists(json_gz_path):
            trace.logger.debug(f"Fichier compressé trouvé: {json_gz_path}")
            return json_gz_path

        # Si pas de .json.gz, vérifier si le .json existe
        elif os.path.exists(json_path):
            trace.logger.debug(f"Fichier JSON trouvé, compression à la volée: {json_path}")
            return compress_and_serve_json(json_path, json_gz_path)

        else:
            # Aucun fichier trouvé
            error_msg = f"Fichier non trouvé: {exemple_file_path} (ni {json_path} ni {json_gz_path})"
            trace.logger.error(error_msg)
            return Response(
                response=json.dumps({"error": error_msg}),
                status=404,
                mimetype="application/json",
            )

    except Exception as e:
        trace.logger.error(f"Erreur dans handle_json_or_compressed: {str(e)}")
        return False


# def serve_compressed_file(json_gz_path):
#     """
#     Sert un fichier JSON.GZ avec headers corrects pour GZIP
#     """
#     try:
#         with open(json_gz_path, "rb") as f:
#             compressed_data = f.read()

#         file_size = len(compressed_data)
#         trace.logger.debug(f"Fichier compressé servi: {json_gz_path} ({file_size} bytes)")

#         return True, compressed_data

    except Exception as e:
        trace.logger.error(f"Erreur lecture fichier compressé {json_gz_path}: {str(e)}")
        return False, None


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

        trace.logger.debug(f"Compression: {original_size} → {compressed_size} bytes ({ratio:.1f}% économie)")

        # Sauvegarder
        try:
            with open(json_gz_path, "wb") as f:
                f.write(compressed_data)
            trace.logger.debug(f"Fichier compressé sauvegardé: {json_gz_path}")
        except Exception as save_error:
            trace.logger.warning(f"Impossible de sauvegarder {json_gz_path}: {str(save_error)}")

        # ✅ HEADERS CORRIGÉS :
        return json_gz_path

    except json.JSONDecodeError as json_error:
        trace.logger.error(f"Erreur JSON dans {json_path}: {str(json_error)}")
        return False
    except Exception as e:
        trace.logger.error(f"Erreur compression {json_path}: {str(e)}")
        return False


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
        if ".json" in file_or_folder or ".json.gz" in file_or_folder or ".gz" in file_or_folder:
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
            folder_found = parse_folder(os.path.join(current_dir, file_or_folder), menus[key], child_key)
            if folder_found:
                exemple_found = True
        else:
            folder_found = parse_folder(os.path.join(current_dir, file_or_folder), menus, child_key)
            if folder_found:
                exemple_found = True

    if not exemple_found and key in menus:
        del menus[key]
    return exemple_found


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
        os.abort(500)
    # Everything is fine
    return Response(status=200)
