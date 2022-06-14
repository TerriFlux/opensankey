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

import mfa_problem.io_excel as io_excel
from . import parser_excel

try:
    from . import opensankey
except Exception:
    import opensankey

try:
    import xlwings as xl
    import pythoncom
    pythoncom.CoInitialize()   
except Exception as excpt:
    pass


@opensankey.route('/sankey/save_pdf', methods=['POST'])
def save_pdf():
    cwd = os.getcwd()
    data_content = request.files['svg'].read().decode('UTF-8') 
    #data_file.save("tutu.svg")
    cloudconvert.configure(api_key = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiZWUwZDA5Mjg2NmY0OGZhZTQ5NTk1Y2M1YzViZDg2YmIwZWU3ZjE0MGRiMGFmZjY2NDAxYTI5MzU3MzBkOTUyNDRhNjMxNjI3MzRmZGRhYTIiLCJpYXQiOjE2NDQ4MTUzNjYuNjIxODYyLCJuYmYiOjE2NDQ4MTUzNjYuNjIxODY0LCJleHAiOjQ4MDA0ODg5NjYuNjE3NzYyLCJzdWIiOiIzNjYwMDY0NCIsInNjb3BlcyI6WyJ1c2VyLnJlYWQiLCJ1c2VyLndyaXRlIiwidGFzay5yZWFkIiwidGFzay53cml0ZSIsIndlYmhvb2sucmVhZCIsIndlYmhvb2sud3JpdGUiLCJwcmVzZXQucmVhZCIsInByZXNldC53cml0ZSJdfQ.RtQx3edfk3Zu74rn71Soi5H-dNEpNjaVoSgrxHkuqq1K082v3nncIpe_0qo9KXJc-KrdsWWD5V_OLZsFdS1kU_Y9VzAtqg-ozTZzywXaNPZ6TlZA5AdYa33Jg24cUQSc1c5tcBl2TqcWlTO87Nj53pLO7pKpU5VsNvYqA0POXExUdgeBfruOcjjnMS-_M0ovY1kxV3hsm302bF2By4QdaYiH5ixz5vCBKPvYOvcqo1WhpgVQlcYWHyj-XBnLwTJ1X7gbrnHY3KKsnuZXhkNc9CRtL97yz1yIhWztcwNyMNUs20NJ1f2XDvEAmeLoB-pB0WodLrseihyo1uJUicjIch7No3G6xt3BlzSnzleuMIMBEv2MLBCLRo7QQXCxwrVreQQZZrjYrGLL8ZP-iGJ9eOmfgmNYKWYn37_h69CDC1cvz2Ln4A7k6N-HvDHGHRTqHDc9-fUC-GL7vZUFRHQLgZd8btFZyBvfj4RjDlYcgWMDqJ_5a4Q3-FLnnUwgWAy2EJHI68MwbQ9NTfEIfj2l7bi3En9EQv0_iU5Vn-9srL0zJ6u2nCL52wn8F6ZaO203EQcjymjQ1PhjXeE556HQtdJ9EF_dSHom8ox-lFfBVZHmFtqfH-gFvlb0P5d9ueqR3woeKCFj7onf2OuCsdx-m4EvRN51P1Rit8m51431gIo')

    tutu = cloudconvert.Job.create(payload={
        "tasks": {
            "import-2": {
                "operation": "import/raw",
                "file": data_content,
                "filename": "tutu.svg"
            },
            "task-1": {
                "operation": "convert",
                "input_format": "svg",
                "output_format": "pdf",
                "engine": "inkscape",
                "input": [
                    "import-2"
                ],
                "text_to_path": False,
                "engine_version": "1.1.1"
            },
            "export-1": {
                "operation": "export/url",
                "input": [
                    "task-1"
                ]
            }
        }
    })
    exported_url_task_id = tutu['tasks'][2]['id']
    res = cloudconvert.Task.wait(id=exported_url_task_id)
    file = res.get("result").get("files")[0]
    res = cloudconvert.download(filename=file['filename'], url=file['url'])
    #os.remove("tutu.svg")
    filename = "tutu.pdf"
    return send_file(os.path.join(cwd, filename), as_attachment=True)


@opensankey.route('/sankey/clean_pdf', methods=['POST'])
def clean_pdf():
    os.remove("tutu.pdf")
    response = Response(
        status=200
    )
    return response

@opensankey.route('/sankey/save_excel', methods=['POST'])
def save_excel():
    cwd = os.getcwd()
    excel_file = os.path.join(cwd, "tutu.xlsx")
    sankey_data =  request.get_data().decode("utf-8")
    mfa_output,_ = parser_excel.save_simple_excel(json.loads(sankey_data))
    io_excel.write_mfa_problem_output_to_excel(excel_file,[],mfa_output,'w',verbosity=1)
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

@opensankey.route('/sankey/upload_excel', methods=['POST'])
def upload_excel():
    excel_input_file = request.files['file']
    mfa_input,_ = io_excel.load_mfa_excel(excel_input_file)
    sankey_data = parser_excel.parse_excel(mfa_input)
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
    base_file_name = os.path.basename(exemple_file_path)
    error=''
    extension = os.path.splitext(exemple_file_path)[1]
    if extension == ".xlsx":
        mfa_input,_ = io_excel.load_mfa_excel(exemple_file_path)
        sankey_data = parser_excel.parse_excel(mfa_input)
        layout_file_name = os.path.splitext(base_file_name)[0].replace('_reconciled','_layout')+'.json'
        sankey_folder = os.path.join(os.path.dirname(exemple_file_path),'sankey')
        layout_file_name = os.path.join(sankey_folder,layout_file_name)
        if os.path.exists(layout_file_name):
            layout_file = open(layout_file_name,encoding="utf-8", mode= "r")
            layout_data = json.load(layout_file) 
            sankey_data['layout'] = layout_data
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
        if 'not_tested' in file_or_folder or 'sankeylayout' in file_or_folder or '.git' in file_or_folder or '.md' in file_or_folder or 'Archive' in file_or_folder or '.vscode' in file_or_folder:
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
        if 'simple.xlsx' in file_or_folder or 'reconciled.xlsx' in file_or_folder:
            if key not in menus:
                menus[key] = {}
            if 'Excel' not in menus[key]:
                menus[key]['Excel'] = []           
            menus[key]['Excel'].append(file_or_folder)
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
                if 'layout.json' not in file_name:
                    continue
                if key not in menus:
                    menus[key] = {}
                if 'JSON' not in menus[key]:
                    menus[key]['JSON'] = []   
                menus[key]['JSON'].append(file_name)
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
    try:
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
    except Exception as expt:
        response = Response(
            response=str(expt),
            status=500,
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


