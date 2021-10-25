# coding: utf-8
from flask import request
from flask import Response
from flask import send_file
from flask import render_template

import pandas as pd
import cloudconvert
import numpy as np
from shutil import copyfile

import os
import json
import time

from . import parser_excel

try:
    from . import opensankey
except Exception:
    import opensankey


@opensankey.route('/sankey/save_pdf', methods=['POST'])
def save_pdf():
    cwd = os.getcwd()
    data_file = request.files['svg']
    data_file.save("tutu.svg")
    api = cloudconvert.Api('aYSafXTMawnwDr7I0rhviAKJSHLyzZBGbDpTD44Rwdst1r4Lr2YjJm75IG9v7C9u')
    process = api.createProcess({
      "inputformat": "svg",
      "outputformat": "pdf"
    })
    process.start({
        "input": "upload",
        "file": open("tutu.svg", 'rb'),
        "outputformat": "pdf"
    })
    process.wait()  # wait until conversion finished
    os.remove("tutu.svg")
    filename = "tutu.pdf"
    process.download(filename)  # download output file
    return send_file(os.path.join(cwd, filename), as_attachment=True)


@opensankey.route('/sankey/clean_pdf', methods=['POST'])
def clean_pdf():
    os.remove("tutu.pdf")
    response = Response(
        status=200
    )
    return response


@opensankey.route('/sankey/upload_simple_excel', methods=['POST'])
def upload_data():
    excel_input_file = request.files['file']
    nodes, links = parser_excel.parse_simple_excel(excel_input_file)
    context = {
        'nodes': nodes,
        'links': links
    }
    try:
        json_data = json.dumps(context)
        response = Response(
            response=json_data,
            status=200,
            mimetype='application/json'
        )
    except Exception as expt:
        print(expt)
        response = Response(
            response=json_data,
            status=400
        )

    return response


@opensankey.route('/sankey/upload_examples', methods=['POST'])
def upload_exemple():
    exemples_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'exemples')
    exemple = request.get_data().decode("utf-8")
    exemple_file_path = os.path.join(exemples_folder, exemple)
    if exemple == "pommes_poires.xlsx":
        nodes, links = parser_excel.parse_simple_excel(exemple_file_path)
    elif exemple == "sankeys_territoire_.csv":
        sankey_dict = parser_excel.parse_sankey_energie_csv(exemple_file_path)
        nodes = sankey_dict[200042935]['nodes']
        links = sankey_dict[200042935]['links']
    error=''
    context = {
        'error': error,
        'nodes': nodes,
        'links': links
    }
    json_data = json.dumps(context)
    response = Response(
        response=json_data,
        status=200,
        mimetype='application/json'
    )
    return response

@opensankey.route('/sankey/download_opensankey_examples', methods=['POST'])
def download_examples():
    exemples_folder = os.path.join(
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'server'
        ),
        'exemples'
    )
    exemple = request.get_data().decode("utf-8")
    exemple_file_path = os.path.join(exemples_folder, exemple)
    if os.path.exists(exemple_file_path):
        return send_file(exemple_file_path, as_attachment=True)
    return Response(exemple_file_path, status=400, mimetype='text')

@opensankey.route('/')
def start():
    return render_template(
        'index.html',
        filename='',
        static_site='false'
    )     

      
