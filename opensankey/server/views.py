# coding: utf-8
from flask import request
from flask import Response
from flask import send_file
from flask import render_template
from flask import session

import cloudconvert
import tempfile
from os import listdir

import os
import json
import time

import mfa_problem.io_excel as io_excel
import mfa_problem.mfa_problem_main as mfa_problem_main
import mfa_problem.su_trace as trace
from threading import Thread
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
    try:
        cwd = os.getcwd()
        excel_file = os.path.join(cwd, "tutu.xlsx")
        sankey_data =  request.get_data().decode("utf-8")
        mfa_output,_ = parser_excel.save_excel(json.loads(sankey_data))
    except Exception as excpt:
        response = Response(
            response='save_excel : ' + str(excpt),
            status=401
        )
        return response   
    try:
        if io_excel.NODES_SHEET in mfa_output and io_excel.NODE_TYPE in mfa_output[io_excel.NODES_SHEET].columns:
            verbosity=2
        else:
            verbosity=1        
        io_excel.write_mfa_problem_output_to_excel(excel_file,[],mfa_output,'w',verbosity=verbosity)
        return send_file(excel_file, as_attachment=True)
    except Exception as excpt:
        response = Response(
            response='write_mfa_problem_output_to_excel' + str(excpt),
            status=402
        )
        return response     

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
    session['load_started'] = True
    tmp_dir = tempfile.mkdtemp()
    logname = tmp_dir + os.path.sep + "rollover.log"
    session['logname'] = logname
    trace.logger_init(logname,"w")
    session['base_filename'] = trace.base_filename()
    trace.logger.debug(session['base_filename'])
    excel_input_file = request.files['file']
    output_directory = tempfile.mkdtemp()
    input_file_name = os.path.join(output_directory,'tutu.xlsx')
    excel_input_file.save(input_file_name)
    session['output_file_name'] = os.path.join(output_directory,'tutu.json')
    trace.logger.debug(session['output_file_name'])
    file_stats = os.stat(input_file_name)
    if file_stats.st_size > 1000000:
        thread = Thread(
            target=upload_excel_thread, 
            args=(
                input_file_name,
                session['base_filename'],
                logname,
                session['output_file_name'],
                False
            )
        )
        thread.daemon = True
        thread.start()
        trace.logger.debug('thread launched')
    else:
        try:
            upload_excel_thread(
                input_file_name,
                session['base_filename'],
                logname,
                session['output_file_name'],
                False
            )
        except excpt:
            trace.logger.debug('upload_excel_thread failed : ' + str(excpt))
        
    response = Response(
        response='{}',
        status=200,
        mimetype='application/json'
    )

    return response


def upload_excel_thread(
    exemple_file_path,
    base_file_name,
    log_name,
    output_file_name,
    use_layout
):
    mfa_problem_main.su_trace.logger_init(log_name,'a')
    trace.logger.info('Loading Excel.')
    trace.logger.debug(exemple_file_path)
    try:
        mfa_input,_ = io_excel.load_mfa_excel(exemple_file_path)
        trace.logger.info('Loading Excel Succeeded: ')
    except Exception as expt:
        trace.logger.error('Loading Excel Failed: '    + str(expt))
        trace.logger.error('Construct Diagram Failed: '    + str(expt))
        trace.logger.error('-- FAILED --')
        return
    trace.logger.info('Construct Diagram.')
    try:            
        sankey_data = parser_excel.parse_excel(mfa_input)
        trace.logger.info('Construct Diagram Succeeded: ')
    except Exception as expt:
        trace.logger.error('Construct Diagram Failed: '    + str(expt))
        trace.logger.error('-- FAILED --')
        return
    if '_reconciled' in base_file_name:
        layout_file_name = os.path.splitext(base_file_name)[0].replace('_reconciled','_layout')+'.json'
    else:
        layout_file_name = os.path.splitext(base_file_name)[0] + '_layout.json'
    if use_layout:
        sankey_folder = os.path.join(os.path.dirname(exemple_file_path),'sankey')
        layout_file_name = os.path.join(sankey_folder,layout_file_name)
        if os.path.exists(layout_file_name):
            layout_file = open(layout_file_name,encoding="utf-8", mode= "r")
            layout_data = json.load(layout_file) 
            sankey_data['layout'] = layout_data
        sankey_data['file_name'] = layout_file_name
    try: 
        json_data = json.dumps(sankey_data)
        with open(output_file_name, "w") as outfile:
            outfile.write(json_data)
        trace.logger.info('-- FINISHED --')
    except Exception as expt:
        trace.logger.error('Writing JSON failed: '    + str(expt))
        trace.logger.info('-- FAILED --')

@opensankey.route('/sankey/upload_examples', methods=['POST'])
def upload_exemple():
    session['load_started'] = True
    tmp_dir = tempfile.mkdtemp()
    logname = tmp_dir + os.path.sep + "rollover.log"
    session['logname'] = logname
    trace.logger_init(logname,"w")
    session['base_filename'] = trace.base_filename()
        
    data_folder = os.environ.get('MFAData')
    #exemples_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'exemples')
    exemple = request.get_data().decode("utf-8")
    exemple_file_path = os.path.join(data_folder, exemple)
    #exemple_folder = os.path.dirname(exemple_file_path)
    base_file_name = os.path.basename(exemple_file_path)
    #error=''
    extension = os.path.splitext(exemple_file_path)[1]
    output_directory = tempfile.mkdtemp()
    trace.logger.debug(exemple_file_path)
    session['output_file_name'] = os.path.join(output_directory,'tutu.json')
    trace.logger.debug(session['output_file_name'])
    if extension == ".xlsx":
        file_stats = os.stat(exemple_file_path)
        if file_stats.st_size > 1000000:
            thread = Thread(
                target=upload_excel_thread, 
                args=(
                    exemple_file_path,
                    base_file_name,
                    logname,
                    session['output_file_name'],
                    True
                )
            )
            thread.daemon = True
            thread.start()
            trace.logger.debug('thread launched')
            return Response(
                response='{}',
                status=200,
                mimetype='application/json'
            )
        else:
            try:
                upload_excel_thread(
                    exemple_file_path,
                    base_file_name,
                    logname,
                    session['output_file_name'],
                    True
                )
                return Response(
                    response='{}',
                    status=200,
                    mimetype='application/json'
                )
            except excpt:
                trace.logger.debug('upload_excel_thread failed : ' + str(excpt))
                return Response(
                    response='{}',
                    status=500,
                    mimetype='application/json'
                )
    elif extension == ".json":
        json_file_name = os.path.join(data_folder, exemple)
        json_file = open(json_file_name,encoding="utf-8", mode= "r")
        data = json.load(json_file)
        data['file_name'] = exemple_file_path
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

def parse_folder(current_dir,menus,key=None):
    folder_content = listdir(current_dir)
    folder_content.sort()
    exemple_found = False
    # artefact_found = False
    for file_or_folder in folder_content:
        if '.gitkeep' in file_or_folder or 'mfadata' in file_or_folder or 'not_tested' in file_or_folder or 'sankeylayout' in file_or_folder or '.git' in file_or_folder or '.md' in file_or_folder or 'Archive' in file_or_folder or '.vscode' in file_or_folder:
            continue
        if 'artefacts' in file_or_folder:
            file_names = listdir(os.path.join(current_dir, file_or_folder))
            file_names.sort()
            for file_name in file_names:
                if '.gitkeep' in file_name or '.opensankey' in file_name:
                    continue
                if key not in menus:
                    menus[key] = {}
                if 'artefacts' not in menus[key]:
                    menus[key]['artefacts'] = []  
                menus[key]['artefacts'].append(file_name)
                # artefact_found = True
            continue
        if '.xlsx' in file_or_folder and not 'old.' in file_or_folder:
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
                # if key not in artefacts:
                #     artefacts[key] = {}
                folder_found = parse_folder(os.path.join(current_dir,file_or_folder),menus[key],child_key)
                if folder_found:
                    exemple_found = True
            else:
                folder_found = parse_folder(os.path.join(current_dir,file_or_folder),menus,child_key)  
                if folder_found:
                    exemple_found = True         
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
                if 'Sankey' not in menus[key]:
                    menus[key]['Sankey'] = []   
                menus[key]['Sankey'].append(file_name)
                exemple_found = True
    if not exemple_found and key in menus:
        del menus[key]
    # if not artefact_found and key in artefacts:
    #     del artefacts[key]
    return exemple_found

@opensankey.route('/sankey/menu_examples', methods=['POST'])
def menus_examples():     
    data_folder = os.environ.get('MFAData')
    menus = {}
    try:
        parse_folder(data_folder,menus)
        context = {
                'exemples_menu'    : menus
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

@opensankey.route('/sankey/publish', methods=['POST'])
def publish():
    sankey_data_str =  request.get_data().decode("utf-8")
    sankey_data = json.loads(sankey_data_str)
    file_name = sankey_data['file_name']
    # del sankey_data['file_name']
    # sankey_data_str = json.dumps(sankey_data,indent=2)
    data_folder = os.environ.get('MFAData')
    with open(os.path.join(data_folder,file_name), 'w',encoding='utf-8') as outfile:
        outfile.write(sankey_data_str)
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

@opensankey.route('/loads_retrieves_result', methods=['POST'])
def load_retrieves_result():
    session['load_started'] = False
    try:
        json_file = open(session['output_file_name'],encoding="utf-8", mode= "r")
        json_data = json.load(json_file)
        json_file.close()
        response = Response(
            json.dumps(json_data),
            status=200,
            mimetype='application/json'
        )
        return response
    except Exception:
        trace.logger.error('load_retrieves_result failed')
        response = Response(
            json.dumps(json_data),
            status=510,
            mimetype='application/json'
        )
        return response

@opensankey.route('/load_process', methods=['POST'])
def load_process():
    if not "load_started" in session or session["load_started"] == False:
        trace.logger.debug(session['base_filename'])
        trace.logger.debug('not started')
        return Response(
            json.dumps({}),
            status=200,
            mimetype='application/json'
        )        
    try:
        #trace.logger.debug(session['base_filename'])
        #trace.logger.debug('open')
        if os.path.isfile(session['base_filename']):
            #trace.logger.debug('is file')
            f=open(session['base_filename'], "r")
            #trace.logger.debug('opened')
            results = f.read()
            #trace.logger.debug('read')
            results_dict = { "output" : results }
            json_data = json.dumps(results_dict)
            #trace.logger.debug('dumps')
            return Response(
                json_data,
                status=200,
                mimetype='application/json'
            )
        else:
            return Response(
                json.dumps({'output':'ERROR: load_process: le fichier tmp_log n\'existe pas.'}),
                status=500,
                mimetype='application/json'
            )            
    except:
        return Response(
            json.dumps({'output':'ERROR:load_process: le fichier tmp_log ne peut pas être ouvert.'}),
            status=500,
            mimetype='application/json'
        )