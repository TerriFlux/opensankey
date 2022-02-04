# coding: utf-8
from flask import request
from flask import Response
from flask import send_file
from flask import render_template

import pandas as pd
import cloudconvert
import numpy as np
from shutil import copyfile
from os import listdir

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

def write_mfa_problem_output_to_excel(
    output_file_name: str,
    mfa_problem_output: dict
):
    with pd.ExcelWriter(output_file_name, engine='openpyxl', mode='w') as writer:
        for tab_name, tab_content in mfa_problem_output.items():
            sheet_content = tab_content
            if type(sheet_content) is dict:
                df = pd.Series(sheet_content).to_frame()
            else:
                df = pd.DataFrame(sheet_content)
            df.to_excel(writer, sheet_name=tab_name, index=False, header=False)

@opensankey.route('/sankey/save_excel', methods=['POST'])
def save_excel():
    cwd = os.getcwd()
    excel_file = os.path.join(cwd, "tutu.xlsx")
    sankey_data =  request.get_data().decode("utf-8")
    mfa_output = parser_excel.save_simple_excel(json.loads(sankey_data))
    write_mfa_problem_output_to_excel(excel_file,mfa_output)
    return send_file(excel_file, as_attachment=True)

@opensankey.route('/sankey/clean_excel', methods=['POST'])
def clean_excel():
    cwd = os.getcwd()
    excel_file = os.path.join(cwd, "tutu.xlsx")
    os.remove(excel_file)
    response = Response(
        status=200
    )
    return response

@opensankey.route('/sankey/upload_simple_excel', methods=['POST'])
def upload_data():
    excel_input_file = request.files['file']
    sankey_data = parser_excel.parse_simple_excel(excel_input_file)
    # context = {
    #     'nodes': nodes,
    #     'links': links
    # }
    try:
        json_data = json.dumps(sankey_data)
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
    data_folder = os.environ.get('MFAData')
    #exemples_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'exemples')
    exemple = request.get_data().decode("utf-8")
    exemple_file_path = os.path.join(data_folder, exemple)
    exemple_folder = os.path.dirname(exemple_file_path)
    error=''
    extension = os.path.splitext(exemple_file_path)[1]
    if extension == ".xlsx":
        sankey_data = parser_excel.parse_simple_excel(exemple_file_path)
        # context = {
        #     'version': '0.6',
        #     'error'  : error,
        #     'nodes'  : nodes,
        #     'links'  : links,
        #     'h_space': 500,
        #     'v_space': 250
        # }
        json_data = json.dumps(sankey_data)
    elif exemple == "Energie/sankeys_territoire_.csv":
        sankey_dict = parser_excel.parse_sankey_energie_csv(exemple_file_path)
        layout_file_name = os.path.join(exemple_folder, "sankey","energie_layout.json")
        layout_file = open(layout_file_name,encoding="utf-8", mode= "r")
        layout_data = json.load(layout_file)
        sankey_dict["layout"] = layout_data
        sankey_dict['version'] = '0.6'
        json_data = json.dumps(sankey_dict)
    elif extension == ".json":
        json_file_name = os.path.join(data_folder, exemple)
        json_file = open(json_file_name,encoding="utf-8", mode= "r")
        data = json.load(json_file)
        json_data = json.dumps(data)        

    response = Response(
        response=json_data,
        status=200,
        mimetype='application/json'
    )
    return response

@opensankey.route('/sankey/download_examples', methods=['POST'])
def download_examples():
    data_folder = os.environ.get('MFAData')
    #exemples_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'exemples')
    exemple = request.get_data().decode("utf-8")
    exemple_file_path = os.path.join(data_folder, exemple)
    if os.path.exists(exemple_file_path):
        return send_file(exemple_file_path, as_attachment=True)
    return Response(exemple_file_path, status=400, mimetype='text')

def parse_folder(current_dir,menus,artefacts,key=None):
    folder_content = listdir(current_dir)
    folder_content.sort()
    exemple_found = False
    artefact_found = False
    for file_or_folder in folder_content:
        if 'sankeylayout' in file_or_folder or '.git' in file_or_folder or '.md' in file_or_folder or 'Archive' in file_or_folder or '.vscode' in file_or_folder:
            continue
        if 'artefacts' in file_or_folder:
            file_names = listdir(os.path.join(current_dir, file_or_folder))
            file_names.sort()
            for file_name in file_names:
                if 'open-sankey' not in file_name:
                    continue
                if key not in artefacts or type(artefacts[key]) is dict:
                    artefacts[key] = []
                artefacts[key].append(file_name)
                artefact_found = True
            continue
        if 'simple.xlsx' in file_or_folder:
            if key not in menus:
                menus[key] = []
            menus[key].append(file_or_folder)
            exemple_found = True
            continue
        if os.path.isfile(os.path.join(current_dir,file_or_folder)):
            continue
        if file_or_folder != 'sankey':
            child_key = file_or_folder
            if key != None:
                if key not in menus:
                    menus[key] = {}
                if key not in artefacts:
                    artefacts[key] = {}
                folder_found,art_found = parse_folder(os.path.join(current_dir,file_or_folder),menus[key],artefacts[key],child_key)
                if folder_found:
                    exemple_found = True
                if art_found:
                    artefact_found = True
            else:
                folder_found,art_found = parse_folder(os.path.join(current_dir,file_or_folder),menus,artefacts,child_key)
                if folder_found:
                    exemple_found = True
                if art_found:
                    artefact_found = True              
        else:
            file_names = listdir(os.path.join(current_dir, file_or_folder))
            file_names.sort()
            for file_name in file_names:
                if 'auto_layout' in file_name:
                    continue
                if 'layout.json' not in file_name and 'simple.xlsx' not in file_name:
                    continue
                if key not in menus or type(menus[key]) is dict:
                    menus[key] = []
                menus[key].append(file_name)
                exemple_found = True
    if not exemple_found and key in menus:
        del menus[key]
    if not artefact_found and key in artefacts:
        del artefacts[key]
    return exemple_found,artefact_found

@opensankey.route('/sankey/menu_examples', methods=['POST'])
def menus_examples():
    data_folder = os.environ.get('MFAData')
    menus = {}
    artefacts = {}
    # try:
    parse_folder(data_folder,menus,artefacts)
    context = {
        'exemples_menu'    : menus,
        'artefacts_menu': artefacts 
    }
    json_data = json.dumps(context)
    response = Response(
        response=json_data,
        status=200,
        mimetype='application/json'
    )
    # except Exception as expt:
    #     response = Response(
    #         response=str(expt),
    #         status=500,
    #         mimetype='application/json'
    #     )  
    return response

@opensankey.route('/')
def start():
    return render_template(
        'index.html',
        filename='',
        static_site='false'
    )     

      
