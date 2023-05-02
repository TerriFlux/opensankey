# coding: utf-8

# Flask imports
from flask import abort
from flask import Blueprint
from flask import current_app
from flask import request
from flask import Response
from flask import send_file
from flask import render_template
from flask import session

# System imports
import openpyxl
import tempfile
import os
import json

try:
    import pythoncom
    pythoncom.CoInitialize()
except Exception:
    pass

from cairosvg import svg2png, svg2pdf
from threading import Thread

# Sankey modules imports
import SankeyExcelParser.io_excel as io_excel
import SankeyExcelParser.su_trace as trace

# Local imports
from . import parser_excel


# Create opensankey app blueprint
template_folder = os.path.join(
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'client'),
    'build'
)
static_folder = os.path.join(
    os.path.join(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'client'), 'build'),
    'static'
)
opensankey = Blueprint(
    'opensankey',
    __name__,
    static_folder=static_folder,
    template_folder=template_folder,
    static_url_path='/static/opensankey'
)
image_template_folder = os.path.join(
    os.path.join(
        os.path.join(
            os.path.dirname(
                os.path.dirname(
                    os.path.abspath(__file__)
                )
            ),
            'client'),
        'src'),
    'images')


@opensankey.route('/sankey/save_png', methods=['POST'])
def save_png():
    '''
    HTTP POST request to save current sankey as PNG

    Input : Data as html (current page)

    Output : Send png file
    '''
    # Get current working directory
    cwd = os.getcwd()
    # Extract svg data
    data_content = request.files['svg'].read().decode('UTF-8')
    # Launch conversion with cairo
    filename = "tutu.png"
    try:
        svg2png(bytestring=data_content, write_to=filename)
    except Exception as e:
        current_app.logger.error('SAVE_PNG | {0}'.format(e))
        abort(500)
    return send_file(os.path.join(cwd, filename), as_attachment=True)


# Create opensanker app routes
@opensankey.route('/sankey/save_pdf', methods=['POST'])
def save_pdf():
    '''
    HTTP POST request to save current sankey as PDF

    Input : Data as html (current page)

    Output : Send pdf file
    '''
    # Get current working directory
    cwd = os.getcwd()
    # Extract svg data
    data_content = request.files['svg'].read().decode('UTF-8')
    # Launch conversion with cairo
    filename = "tutu.pdf"
    try:
        svg2pdf(bytestring=data_content, write_to=filename)
    except Exception as e:
        current_app.logger.error('SAVE_PDF | {0}'.format(e))
        abort(500)
    return send_file(os.path.join(cwd, filename), as_attachment=True)


@opensankey.route('/sankey/clean_png', methods=['POST'])
def clean_png():
    '''
    HTTP POST request to remove remaining generated png image

    Input : None

    Output :
        - Response 200 : OK
        - Response 500 : Unknown exception
    '''
    return clean_file("tutu.png", "CLEAN_PNG")


@opensankey.route('/sankey/clean_pdf', methods=['POST'])
def clean_pdf():
    '''
    HTTP POST request to remove remaining generated pdf image

    Input : None

    Output :
        - Response 200 : OK
        - Response 500 : Unknown exception
    '''
    return clean_file("tutu.pdf", "CLEAN_PDF")


def clean_file(filename, fctname):
    '''
    Delete a given file from server.

    Input :
        - filename (String) : File to be delete
        - fctname (String) : Name of the calling function for error logging

    Output :
        - 200 : OK
        - 500 : Unknown exception
    '''
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


@opensankey.route('/sankey/save_excel', methods=['POST'])
def save_excel():
    try:
        cwd = os.getcwd()
        excel_file = os.path.join(cwd, "tutu.xlsx")
        sankey_data = request.get_data().decode("utf-8")
        mfa_output, _ = parser_excel.save_excel(json.loads(sankey_data), False)
    except Exception as excpt:
        response = Response(
            response='save_excel: ' + str(excpt),
            status=401
        )
        return response
    try:
        io_excel.write_mfa_problem_output_to_excel(excel_file, [], mfa_output, 'w', verbosity=2)
        # AJoute le fichier json dans un onglet layout
        wb = openpyxl.load_workbook(excel_file)
        layout_sheet = wb.create_sheet()
        layout_sheet.title = 'layout'
        splitted_layout = cut_layout(sankey_data)
        cpt = 1
        for i in splitted_layout:
            layout_sheet['A'+str(cpt)].value = i
            cpt = cpt + 1
        wb.save('tutu.xlsx')
        return send_file(excel_file, as_attachment=True)
    except Exception as excpt:
        response = Response(
            response='write_mfa_problem_output_to_excel' + str(excpt),
            status=402
        )
        return response


def cut_layout(layout):
    '''
    Split the layout string to substring in an array, each substring is as long as 32767 character maximum wich
      is the maximum number of character a cell in excel can contains

    Input :
        - layout (String) : json_data of the sankey as string

    Output :
        - tab_layout (Array of string) : Array of the json_data splitted
    '''
    return [layout[i: i + 32767] for i in range(0, len(layout), 32767)]


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
    trace.logger_init(logname, "w")
    session['base_filename'] = trace.base_filename()
    trace.logger.debug(session['base_filename'])
    excel_input_file = request.files['file']
    output_directory = tempfile.mkdtemp()
    input_file_name = os.path.join(output_directory,  'tutu.xlsx')
    excel_input_file.save(input_file_name)
    session['output_file_name'] = os.path.join(output_directory,  'tutu.json')
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
        except Exception as excpt:
            trace.logger.debug('upload_excel_thread failed: ' + str(excpt))
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
    trace.logger_init(log_name,  'a')
    trace.logger.info('Loading Excel.')
    trace.logger.debug(exemple_file_path)
    try:
        mfa_input, _ = io_excel.load_mfa_excel(exemple_file_path)
        trace.logger.info('Loading Excel Succeeded: ')
    except Exception as expt:
        trace.logger.error('Loading Excel Failed: ' + str(expt))
        trace.logger.error('Construct Diagram Failed: ' + str(expt))
        trace.logger.error('-- FAILED --')
        return
    trace.logger.info('Construct Diagram.')
    try:
        sankey_data = parser_excel.parse_excel(mfa_input)
        trace.logger.info('Construct Diagram Succeeded: ')
    except Exception as expt:
        trace.logger.error('Construct Diagram Failed: ' + str(expt))
        trace.logger.error('-- FAILED --')
        return
    if '_reconciled' in base_file_name:
        layout_file_name = os.path.splitext(base_file_name)[0].replace('_reconciled',  '_layout')+'.json'
    else:
        layout_file_name = os.path.splitext(base_file_name)[0] + '_layout.json'
    if use_layout:
        sankey_folder = os.path.join(os.path.dirname(exemple_file_path),  'sankey')
        layout_file_name = os.path.join(sankey_folder, layout_file_name)
        if os.path.exists(layout_file_name):
            layout_file = open(layout_file_name, encoding="utf-8", mode="r")
            layout_data = json.load(layout_file)
            sankey_data['layout'] = layout_data
        sankey_data['file_name'] = layout_file_name
    try:
        json_data = json.dumps(sankey_data)
        with open(output_file_name, "w") as outfile:
            outfile.write(json_data)
        trace.logger.info('-- FINISHED --')
    except Exception as expt:
        trace.logger.error('Writing JSON failed: ' + str(expt))
        trace.logger.info('-- FAILED --')


@opensankey.route('/sankey/upload_examples', methods=['POST'])
def upload_exemple():
    session['load_started'] = True
    tmp_dir = tempfile.mkdtemp()
    logname = tmp_dir + os.path.sep + "rollover.log"
    session['logname'] = logname
    trace.logger_init(logname, "w")
    session['base_filename'] = trace.base_filename()
    data_folder = os.environ.get('MFAData')
    # exemples_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'exemples')
    exemple = request.get_data().decode("utf-8")
    exemple_file_path = os.path.join(data_folder, exemple)
    # exemple_folder = os.path.dirname(exemple_file_path)
    base_file_name = os.path.basename(exemple_file_path)
    # error=''
    extension = os.path.splitext(exemple_file_path)[1]
    output_directory = tempfile.mkdtemp()
    trace.logger.debug(exemple_file_path)
    session['output_file_name'] = os.path.join(output_directory,  'tutu.json')
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
            except Exception as excpt:
                trace.logger.debug('upload_excel_thread failed: ' + str(excpt))
                return Response(
                    response='{}',
                    status=500,
                    mimetype='application/json'
                )
    elif extension == ".json":
        json_file_name = os.path.join(data_folder, exemple)
        json_file = open(json_file_name, encoding="utf-8", mode="r")
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
    # exemples_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'exemples')
    exemple = request.get_data().decode("utf-8")
    exemple_file_path = os.path.join(data_folder, exemple)
    if os.path.exists(exemple_file_path):
        return send_file(exemple_file_path, as_attachment=True)
    return Response(exemple_file_path, status=400, mimetype='text')


def parse_folder(current_dir, menus, key=None):
    folder_content = os.listdir(current_dir)
    folder_content.sort()
    exemple_found = False
    #  artefact_found = False
    for file_or_folder in folder_content:
        if '.gitkeep' in file_or_folder or 'mfadata' in file_or_folder or 'not_tested' in file_or_folder\
            or 'sankeylayout' in file_or_folder or '.git' in file_or_folder or '.md' in file_or_folder\
                or 'Archive' in file_or_folder or 'new' in file_or_folder or 'prev' in file_or_folder:
            continue
        if 'artefacts' in file_or_folder:
            file_names = os.listdir(os.path.join(current_dir, file_or_folder))
            file_names.sort()
            for file_name in file_names:
                if '.gitkeep' in file_name or '.opensankey' in file_name:
                    continue
                if key not in menus:
                    menus[key] = {}
                if 'artefacts' not in menus[key]:
                    menus[key]['artefacts'] = []
                menus[key]['artefacts'].append(file_name)
                #  artefact_found = True
            continue
        if '.xlsx' in file_or_folder and 'old.' not in file_or_folder:
            if key not in menus:
                menus[key] = {}
            if 'Files' not in menus[key]:
                menus[key]['Files'] = []
            reconciled_file = os.path.splitext(file_or_folder)[0]+'_reconciled.xlsx'
            reconciled_path = os.path.join(current_dir, reconciled_file)
            if os.path.isfile(reconciled_path):
                continue
            menus[key]['Files'].append(file_or_folder)
            menus[key]['Files'].sort()
            exemple_found = True
            continue
        if os.path.isfile(os.path.join(current_dir, file_or_folder)):
            continue
        if file_or_folder != 'sankey':
            child_key = file_or_folder
            if key is not None:
                if key not in menus:
                    menus[key] = {}
                #  if key not in artefacts:
                #      artefacts[key] = {}
                folder_found = parse_folder(os.path.join(current_dir, file_or_folder), menus[key], child_key)
                if folder_found:
                    exemple_found = True
            else:
                folder_found = parse_folder(os.path.join(current_dir, file_or_folder), menus, child_key)
                if folder_found:
                    exemple_found = True
        else:
            file_names = os.listdir(os.path.join(current_dir, file_or_folder))
            file_names.sort()
            for file_name in file_names:
                if 'auto_layout' in file_name:
                    continue
                if 'layout.json' not in file_name:
                    continue
                if key not in menus:
                    menus[key] = {}
                if 'Files' not in menus[key]:
                    menus[key]['Files'] = []
                menus[key]['Files'].append(file_name)
                menus[key]['Files'].sort()
                exemple_found = True
            # Save name of image in menu dict
            if (os.path.split(current_dir)[1] == 'OpenSankey' and 'image_preview' in folder_content):
                file_names = os.listdir(os.path.join(current_dir, 'image_preview'))
                for file_name in file_names:
                    if key not in menus:
                        menus[key] = {}
                    if 'Image' not in menus[key]:
                        menus[key]['Image'] = []
                    # blob=send_file(file_name,mimetype='image/png')
                    menus[key]['Image'].append(file_name)
                    menus[key]['Image'].sort()
            # Save template sorted in difficulty
            if (os.path.split(current_dir)[1] == 'OpenSankey' and 'easy_template' in folder_content):
                file_names = os.listdir(os.path.join(current_dir, 'easy_template'))
                for file_name in file_names:
                    if key not in menus:
                        menus[key] = {}
                    if 'easy_template' not in menus[key]:
                        menus[key]['easy_template'] = []
                    menus[key]['easy_template'].append(file_name)
                    menus[key]['easy_template'].sort()

            if (os.path.split(current_dir)[1] == 'OpenSankey' and 'expert_template' in folder_content):
                file_names = os.listdir(os.path.join(current_dir, 'expert_template'))
                for file_name in file_names:
                    if key not in menus:
                        menus[key] = {}
                    if 'expert_template' not in menus[key]:
                        menus[key]['expert_template'] = []
                    menus[key]['expert_template'].append(file_name)
                    menus[key]['expert_template'].sort()
    if not exemple_found and key in menus:
        del menus[key]
    #  if not artefact_found and key in artefacts:
    #      del artefacts[key]
    return exemple_found


@opensankey.route('/sankey/menu_examples', methods=['POST'])
def menus_examples():
    data_folder = os.environ.get('MFAData')
    menus = {}
    try:
        parse_folder(data_folder, menus)
        context = {
                'exemples_menu': menus
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
    # Try to import images from MFAData/OpenSankey/image_preview to static/media
    try:
        current_folder = os.environ.get('MFAData')
        list_in_folder = os.listdir(current_folder)
        if ('MFAData' in list_in_folder and 'image_preview' in os.listdir(current_folder+'\\MFAData\\OpenSankey')):
            folder_image = current_folder + '\\MFAData\\OpenSankey\\image_preview'
            for i in os.listdir(folder_image):
                if (i not in os.listdir(image_template_folder)):
                    os.symlink(folder_image+'\\'+i, image_template_folder+'\\'+i)
    except Exception as expt:
        print(str(expt))
        response = Response(
            response=str(expt),
            status=500,
            mimetype='application/json'
        )
        return response

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
        json_file = open(session['output_file_name'], encoding="utf-8", mode="r")
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
            json.dumps('{}'),
            status=510,
            mimetype='application/json'
        )
        return response


@opensankey.route('/load_process', methods=['POST'])
def load_process():
    if "load_started" not in session or session["load_started"] is False:
        trace.logger.debug(session['base_filename'])
        trace.logger.debug('not started')
        return Response(
            json.dumps({}),
            status=200,
            mimetype='application/json'
        )
    try:
        # trace.logger.debug(session['base_filename'])
        # trace.logger.debug('open')
        if os.path.isfile(session['base_filename']):
            # trace.logger.debug('is file')
            f = open(session['base_filename'], "r")
            # trace.logger.debug('opened')
            results = f.read()
            # trace.logger.debug('read')
            results_dict = {"output": results}
            json_data = json.dumps(results_dict)
            # trace.logger.debug('dumps')
            return Response(
                json_data,
                status=200,
                mimetype='application/json'
            )
        else:
            return Response(
                json.dumps({'output':  'ERROR: load_process: le fichier tmp_log n\'existe pas.'}),
                status=500,
                mimetype='application/json'
            )
    except json.JSONDecodeError:
        return Response(
            json.dumps({'output':  'ERROR:load_process: le fichier tmp_log ne peut pas être ouvert.'}),
            status=500,
            mimetype='application/json')
