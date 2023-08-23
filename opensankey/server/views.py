# coding: utf-8

# ---------------------------------------------------------------
# External libs
import openpyxl
import tempfile
import os
import json
import imgkit
import pdfkit
import re
try:
    import pythoncom
    pythoncom.CoInitialize()
except Exception:
    pass

# External modules
from threading import Thread

# Flask modules imports
from flask import abort
from flask import Blueprint
from flask import current_app
from flask import request
from flask import Response
from flask import send_file
from flask import render_template
from flask import session

# ---------------------------------------------------------------
# Sankey libs
import SankeyExcelParser.io_excel as io_excel
import SankeyExcelParser.su_trace as trace

# Sankey modules
from SankeyExcelParser.sankey import Sankey

# Local modules
from . import converter


# ---------------------------------------------------------------
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


# ---------------------------------------------------------------
# Define all routes
@opensankey.route('/sankey/save_svg', methods=['POST'])
def save_svg():
    '''
    HTTP POST request to save current sankey as PNG

    Input : Data as html (current page)

    Output : Send png file
    '''
    # Launch conversion
    filename = "tutu.svg"
    try:
        svg_str = request.files['svg'].read().decode('UTF-8')
        svg_str = svg_str.replace('\n', '<br/>')
        svg_str = svg_str.replace('<br>', '<br/>')
        svg_str = svg_str.replace(';=""', '')
        imgs_balises = re.findall('<img [a-zA-Z0-9=":/_.%-]+>', svg_str)
        for _ in set(imgs_balises):
            svg_str = svg_str.replace(_, _+'</img>')
        for _ in \
            ['div', 'b', 'i', 'p', 's', 'a',
             'li', 'ul', 'ol'
             'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
             'img', 'center']:
            svg_str = svg_str.replace('<'+_+' ', '<xhtml:'+_+' ')
            svg_str = svg_str.replace('<'+_+'>', '<xhtml:'+_+'>')
            svg_str = svg_str.replace('</'+_+' ', '</xhtml:'+_+' ')
            svg_str = svg_str.replace('</'+_+'>', '</xhtml:'+_+'>')
        with open(filename, 'w') as f:
            f.write(svg_str)
    except Exception as e:
        current_app.logger.error('SAVE_SVG | {0}'.format(e))
        abort(500)
    return send_file(os.path.join(os.getcwd(), filename), as_attachment=True)


@opensankey.route('/sankey/save_png', methods=['POST'])
def save_png():
    '''
    HTTP POST request to save current sankey as PNG

    Input : Data as html (current page)

    Output : Send png file
    '''
    # Launch conversion
    filename = "tutu.png"
    try:
        imgkit.from_string(request.files['html'].read().decode('UTF-8'), filename)
    except Exception as e:
        current_app.logger.error('SAVE_PNG | {0}'.format(e))
        abort(500)
    return send_file(os.path.join(os.getcwd(), filename), as_attachment=True)


# Create opensanker app routes
@opensankey.route('/sankey/save_pdf', methods=['POST'])
def save_pdf():
    '''
    HTTP POST request to save current sankey as PDF

    Input : Data as html (current page)

    Output : Send pdf file
    '''
    # Launch conversion with cairo
    filename = "tutu.pdf"
    try:
        options = {
            'margin-top': '1cm',
            'margin-right': '1cm',
            'margin-bottom': '1cm',
            'margin-left': '1cm',
            'orientation': 'Landscape',
            'disable-smart-shrinking': '',
            'page-height': request.form['height']+'px',
            'page-width': request.form['width']+'px'}
        pdfkit.from_string(
            '<meta charset="utf-8">' + request.files['html'].read().decode('UTF-8'),
            filename, options=options)
    except Exception as e:
        current_app.logger.error('SAVE_PDF | {0}'.format(e))
        abort(500)
    return send_file(os.path.join(os.getcwd(), filename), as_attachment=True)


@opensankey.route('/sankey/clean_svg', methods=['POST'])
def clean_svg():
    '''
    HTTP POST request to remove remaining generated png image

    Input : None

    Output :
        - Response 200 : OK
        - Response 500 : Unknown exception
    '''
    return clean_file("tutu.svg", "CLEAN_SVG")


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
    '''
    HTTP POST request to save Sankey as Excel

    Request :
        - Sankey data as JSON

    Response :
        - 200 : OK
        - 401 : Error when saving sankey data
        - 402 : Error when saving mfa data
    '''
    # Extract Sankey structure from JSON
    try:
        sankey_as_data = request.get_data().decode("utf-8")
        sankey_as_json = json.loads(sankey_as_data)
        sankey = converter.extract_sankey_from_json(sankey_as_json)
    except Exception as excpt:
        return Response(
            response='save_excel: ' + str(excpt),
            status=401)
    # Save Sankey structure in Excel
    try:
        cwd = os.getcwd()
        excel_filename = os.path.join(cwd, "tutu.xlsx")
        io_excel.write_mfa_excel(excel_filename, sankey, mode='w')
        # Ajoute le fichier json dans un onglet layout
        wb = openpyxl.load_workbook(excel_filename)
        layout_sheet = wb.create_sheet()
        layout_sheet.title = 'layout'
        splitted_layout = cut_layout(sankey_as_data)
        cpt = 1
        for i in splitted_layout:
            layout_sheet['A'+str(cpt)].value = i
            cpt = cpt + 1
        wb.save('tutu.xlsx')
        return send_file(excel_filename, as_attachment=True)
    except Exception as excpt:
        response = Response(
            response='write_mfa_excel' + str(excpt),
            status=402
        )
        return response
    return Response(status=200)


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
    excel_filename = os.path.join(cwd, "tutu.xlsx")
    os.remove(excel_filename)
    response = Response(
        status=200
    )
    return response


@opensankey.route('/sankey/upload_excel', methods=['POST'])
def upload_excel():
    '''
    HTTP POST request to upload Sankey from Excel file

    Request :
        - file (string) : file to load

    Response :
        - 200 : Always
    '''
    # Inform about starting
    session['load_started'] = True
    # Create logfile for debug
    log_dir = tempfile.mkdtemp()  # Temporary dir
    log_filename = log_dir + os.path.sep + "rollover.log"
    session['logname'] = log_filename
    # Init trace for user
    trace.logger_init(log_filename, "w")
    session['base_filename'] = trace.base_filename()
    # trace.logger.debug(session['base_filename'])
    # Get input Excel filename
    excel_input_file = request.files['file']
    # Create conversion files
    tmp_dir = tempfile.mkdtemp()  # Tempory dir for conversion
    excel_input_filename = os.path.join(tmp_dir,  'tutu.xlsx')
    excel_input_file.save(excel_input_filename)
    session['output_file_name'] = os.path.join(tmp_dir,  'tutu.json')
    # trace.logger.debug(session['output_file_name'])
    # Use threads depending on input Excel file size
    file_stats = os.stat(excel_input_filename)
    if file_stats.st_size > 1000000:  # Excel > 1mo
        thread = Thread(
            target=upload_excel_thread,
            args=(
                excel_input_filename,
                session['base_filename'],
                log_filename,
                session['output_file_name'],
                False
            )
        )
        thread.daemon = True
        thread.start()
        trace.logger.debug('thread launched')
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
    response = Response(
        response='{}',
        status=200,
        mimetype='application/json'
    )
    return response


def upload_excel_thread(
    excel_input_filename,
    trace_filename,
    log_filename,
    json_output_filename,
    use_layout
):
    '''
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
    use_layout: bool
        read layout from input file or not.

    Returns
    -------
    None
    '''
    # Init trace for user
    trace.logger_init(log_filename,  'a')
    max_line_length = 50
    # Step 1 : Open and read Excel
    trace.logger.info('{:-<{w}}'.format('Loading excel ', w=max_line_length))
    trace.logger.debug("File to load : {}".format(excel_input_filename.split('/')[-1]))
    # Parse to sankey struct
    sankey = Sankey()
    ok_load, log_load = io_excel.load_sankey_from_excel_file(excel_input_filename, sankey)
    if (ok_load):
        trace.logger.info('{:->{w}}'.format(' Success', w=max_line_length))
    else:
        for _ in log_load.split('\n'):
            trace.logger.error(_)
        trace.logger.error('{:->{w}}'.format(' FAILED', w=max_line_length))
        return
    # Step 2 : Extract sankey data
    trace.logger.info('{:-<{w}}'.format('Extract diagram structure ', w=max_line_length))
    try:
        sankey_json = converter.extract_json_from_sankey(sankey)
        trace.logger.info('{:->{w}}'.format(' Success', w=max_line_length))
    except Exception as expt:
        trace.logger.error('Extract Diagram Structure Failed: ' + str(expt))
        trace.logger.error('{:->{w}}'.format(' FAILED', w=max_line_length))
        return
    # Step 3 : Extract layout
    if '_reconciled' in trace_filename:
        layout_filename = os.path.splitext(trace_filename)[0].replace('_reconciled',  '_layout')+'.json'
    else:
        layout_filename = os.path.splitext(trace_filename)[0] + '_layout.json'
    if use_layout:
        trace.logger.info('{:-<{w}}'.format('Extract diagram layout ', w=max_line_length))
        sankey_folder = os.path.join(os.path.dirname(excel_input_filename),  'sankey')
        layout_filename = os.path.join(sankey_folder, layout_filename)
        if os.path.exists(layout_filename):
            layout_file = open(layout_filename, encoding="utf-8", mode="r")
            layout_json = json.load(layout_file)
            sankey_json['layout'] = layout_json
        sankey_json['file_name'] = layout_filename
    # Step 4 : Dump everything in local json for display
    trace.logger.info('{:-<{w}}'.format('Loading diagram display ', w=max_line_length))
    try:
        json_data = json.dumps(sankey_json)
        with open(json_output_filename, "w") as outfile:
            outfile.write(json_data)
        trace.logger.info('{:->{w}}'.format(' FINISHED', w=max_line_length))
        return
    except Exception as expt:
        trace.logger.error('Loading diagram display: ' + str(expt))
        trace.logger.error('{:->{w}}'.format(' FAILED', w=max_line_length))
        return


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
    # trace.logger.debug(exemple_file_path)
    session['output_file_name'] = os.path.join(output_directory,  'tutu.json')
    # trace.logger.debug(session['output_file_name'])
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
            # Save name of image for carousel welcome in menu dict
            if (os.path.split(current_dir)[1] == 'OpenSankey' and 'image_carousel' in folder_content):
                file_names = os.listdir(os.path.join(current_dir, 'image_carousel'))
                for file_name in file_names:
                    if key not in menus:
                        menus[key] = {}
                    if 'carousel_img' not in menus[key]:
                        menus[key]['carousel_img'] = []
                    # blob=send_file(file_name,mimetype='image/png')
                    menus[key]['carousel_img'].append(file_name)
                    menus[key]['carousel_img'].sort()
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
