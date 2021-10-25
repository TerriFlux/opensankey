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


@opensankey.route('/sankey/upload_data', methods=['POST'])
def upload_data():
    excel_input_file = request.files['file']
    error, nodes, links, subchains, tooltip_names, units_names, trade,periods = \
        parser_excel.parse_output_excel_data(excel_input_file)
    context = {
        'nodes': nodes,
        'links': links,
        'subchains': subchains,
        'tooltip_names': tooltip_names,
        'units_names': units_names,
        'trade': trade,
        'periods' : periods,
        'error': error
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


@opensankey.route('/sankey/upload_input_excel_data', methods=['POST'])
def upload_input_excel_data():
    excel_input_file = request.files['file']
    excel_file = pd.ExcelFile(excel_input_file)
    error, nodes, links, subchains, links_dict, trade = parser_excel.parse_input_excel_data(excel_file)
    context = {
        'nodes': nodes,
        'links': links,
        'trade': trade,
        'subchains': subchains,
        'error': error
    }
    json_data = json.dumps(context)
    response = Response(
        response=json_data,
        status=200,
        mimetype='application/json'
    )
    return response


@opensankey.route('/sankey/upload_exemple', methods=['POST'])
def upload_exemple():
    exemples_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'exemples')
    exemple = request.get_data().decode("utf-8")
    exemple_file_path = os.path.join(exemples_folder, exemple)
    if exemple == "pommes_poires.xlsx" or exemple == "soja_v2.0.xlsx":
        error, nodes, links, _, tooltip_names, units_names, _, _ = \
            parser_excel.parse_output_excel_data(exemple_file_path)
    elif exemple == "sankeys_territoire_.csv":
        sankey_dict = parser_excel.parse_sankey_energie_csv(exemple_file_path)
        nodes = sankey_dict[200042935]['nodes']
        links = sankey_dict[200042935]['links']
        tooltip_names = []
        units_names = []
        error=''
    context = {
        'error': error,
        'nodes': nodes,
        'links': links,
        'tooltip_names': tooltip_names,
        'units_names': units_names,
    }
    json_data = json.dumps(context)
    response = Response(
        response=json_data,
        status=200,
        mimetype='application/json'
    )
    return response

@opensankey.route('/sankey/download_examples', methods=['POST'])
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


@opensankey.route('/sankey/download_excel', methods=['POST'])
def download_excel():
    excel_file = request.get_data().decode("utf-8")
    parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    ))))))
    users_folders_dir = os.path.join(parent_dir, 'users-folders')
    excel_file = os.path.join(users_folders_dir, excel_file)
    if os.path.exists(excel_file):
        return send_file(excel_file, as_attachment=True)
    return Response(excel_file, status=400, mimetype='text')

@opensankey.route('/sankey/publish', methods=['POST'])
def publish():
    json_file = request.form['file_name']
    data = request.form['data']
    parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    ))))))
    users_folders_dir = os.path.join(parent_dir, 'users-folders')
    file_name = os.path.join(users_folders_dir,json_file)
    if os.path.exists(file_name):
      copyfile(file_name, file_name + time.strftime("%Y%m%d-%H%M%S"))
    f=open(file_name, "w")
    f.write(data)
    response = Response(
        response='',
        status=200,
        mimetype='application/json'
    )
    return response


@opensankey.route('/')
def start():
    return render_template(
        'index.html',
        filename='',
        static_site='false'
    )     

      
