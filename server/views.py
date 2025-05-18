#  coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de modification : 26/09/2024

# ---------------------------------------------------------------
# External libs
import os
import time
import tempfile
import json

# External modules
from threading import Thread

# Flask imports
from flask import Blueprint
from flask import jsonify
from flask import render_template
from flask import request
from flask import redirect
from flask import send_from_directory
from flask import session
from flask import Response
from flask import send_file

from opensankey.server.converter import extract_json_from_sankey
from opensankey.server.converter import extract_sankey_from_json

# Sankey libs
import SankeyExcelParser.su_trace as trace
# Sankey modules
from SankeyExcelParser.io_excel import IOExcel
from SankeyExcelParser.classes.sankey import Sankey

# CONSTANTS -----------------------------------------------------
MAX_LINE_LENGTH = 120

import mfa_problem.mfa_problem_main as mfa_problem_main
# ---------------------------------------------------------------
# Local imports
from logincomponent.server.models import update_metrics

# ---------------------------------------------------------------
# Create sankey_app app blueprint

template_folder = os.path.join(
    os.path.join(
        os.path.dirname(
            os.path.dirname(
                os.path.abspath(__file__))),
        'client'),
    'build'
)
static_folder = os.path.join(
    os.path.join(
        os.path.join(
            os.path.dirname(
                os.path.dirname(
                    os.path.abspath(__file__))),
            'client'),
        'build'),
    'static'
)
sankeyapp = Blueprint(
    'sankeyapp',
    __name__,
    static_folder=static_folder,
    template_folder=template_folder,
    static_url_path='/static/sankeyapp'
)


# ---------------------------------------------------------------
# Define all routes

@sankeyapp.route('/')
def index():
    # Update website frequentation metrics
    update_metrics(request.environ.get(
        'HTTP_X_FORWARDED_FOR',
        request.remote_addr))
    # Render site
    return render_template(
        'index.html',
        filename='',
        static_site='false'
    )


@sankeyapp.route('/fr')
def index_fr():
    return render_template(
        'index_fr.html',
        filename='',
        static_site='false'
    )


@sankeyapp.route('/<path:path>')
def goto(path):
    try:
        # First possibility - return a template
        return render_template(path)
    except Exception:
        try:
            # Second possibility return a file from public folder
            return send_from_directory(template_folder, path)
        except Exception:
            # Otherwise return index
            return redirect('/', 301)


@sankeyapp.route('/api/edd_license', methods=['POST'])
def check_license():
    '''
    HTTP GET to get licences informations

    Input JSON request
    - 'action' (String) : type of action to perform
        ('check_license' | 'activate_license' )
    - 'license_id' (String) : licence id to check
    - 'app_name' (String) : App name related to licence

    Output JSON
    - edd license json response
    '''
    # # Construct request for EDD
    # req_dict = {
    #     'edd_action': request.json.get('action'),
    #     'license': request.json.get('license_id'),  # License key
    #     'item_name': request.json.get('app_name'),  # Product ID
    #     'url': 'open-sankey.fr'  # Domain the request is coming from.
    # }
    # # Send POST request
    # res = requests.post('https://terriflux.com/edd-sl/', req_dict)
    # # Return EDD response as JSON
    # return res.json()
    res = {
        'success': False,
        'license': 'disabled'
    }
    # Return EDD response as JSON
    return jsonify(res), 400


def solve_optimisation_problem(
    model_name: str,
    sankey: Sankey,
    uncertainty: bool,
    nb_realizations: int,
    downscale: bool,
    json_output_filename: str,
    excel_output_filename: str,
    excel_sheets_to_remove: list,
    write_mode: str,
    log_name,
    t_start
):
    # Init pythoncom - Excel interfacing
    # TODO : mettre ailleurs
    try:
        import xlwings  # noqa
        import pythoncom
        pythoncom.CoInitialize()
    except Exception:
        pass
    # Interface log init
    trace.logger_init(log_name, 'a')
    trace.logger.info('-- Start optimisation')
    # Optimisation process
    t_prev = time.time()
    try:
        ok = mfa_problem_main.optimisation(
            model_name,
            sankey,
            uncertainty,
            nb_realizations,
            downscale)
    except Exception as e:
        trace.logger.error('-- UNEXPECTED ERROR in optimisation process.')
        trace.logger.error('-- Please report this issue to support@open-sankey.fr')
        trace.logger.debug('-- UNEXPECTED ERROR {}'.format(e))
        trace.logger.info('{:-<{w}}'.format(
            ' [FAILED] Optimization was not successful', w=MAX_LINE_LENGTH))
        return
    if not ok:
        trace.logger.error('-- ERROR in optimisation process.')
        trace.logger.info('{:-<{w}}'.format(
            ' [FAILED] Optimization was not successful', w=MAX_LINE_LENGTH))
        return
    t = time.time()
    trace.logger.debug(
        '-- Optimisation process completed')
    trace.logger.debug(
        '-- Optimisation process took {0} / {1} sec --'
        .format(round((t-t_prev), 2), round((t-t_start), 2)))
    t_prev = t
    # Write output in Excel
    try:
        io_excel = IOExcel()
        io_excel.write_excel_from_sankey(
            excel_output_filename,
            sankey,
            sheets_to_remove__names=excel_sheets_to_remove,
            mode=write_mode)
    except Exception as e:
        trace.logger.error('-- UNEXPECTED ERROR in output excel file writing.')
        trace.logger.error('-- Please report this issue to support@open-sankey.fr')
        trace.logger.debug('-- UNEXPECTED ERROR {}'.format(e))
        trace.logger.info('{:-<{w}}'.format(
            ' [FAILED] Optimization was successful, but an error occured when retrieving results',
            w=MAX_LINE_LENGTH))
        return
    t = time.time()
    trace.logger.info(
        '-- Write results to excel')
    trace.logger.debug(
        '-- Write results took {0} / {1} sec --'
        .format(round((t-t_prev), 2), round((t-t_start), 2)))
    # JSON
    try:
        sankey_json = extract_json_from_sankey(sankey)
        json_data = json.dumps(sankey_json)
        with open(json_output_filename, "w") as json_output_file:
            json_output_file.write(json_data)
    except Exception as e:
        trace.logger.error('-- UNEXPECTED ERROR in output json file writing.')
        trace.logger.error('-- Please report this issue to support@open-sankey.fr')
        trace.logger.debug('-- UNEXPECTED ERROR {}'.format(e))
        trace.logger.info('{:-<{w}}'.format(
            ' [FAILED] Optimization was successful, but an error occured when retrieving results',
            w=MAX_LINE_LENGTH))
        return
    # Ending
    trace.logger.info('{:-<{w}}'.format(
        ' [COMPLETED] Overall optimisation process succesfully ended, took {0} sec'
        .format(round(t-t_start, 2)),
        w=MAX_LINE_LENGTH))
    return


@sankeyapp.route('/optimize/launch', methods=['POST'])
def optimize_launch():
    """
    Launch optimisation process for given inputs

    Returns
    -------
    :return: _description_
    :rtype: _type_
    """
    # Options default values
    session['reg'] = False
    session['uncertainty'] = False
    session['create_ter'] = False
    session['check_input_data'] = False
    session['optim_started'] = False
    # Create temporary directory
    session['tmp_dir'] = tempfile.mkdtemp()
    # Init new temporary log file
    session['trace_file_abspath'] = os.path.join(session['tmp_dir'], "rollover.log")
    trace.logger_init(session['trace_file_abspath'], "w")
    # Read options from POST request
    try:
        # Read options from POST request
        session['optim_sankey'] = request.form['optim_sankey'] == 'true'
        session['create_empty_ter'] = request.form['create_empty_ter'] == 'true'
        session['check_excel'] = request.form['check_excel'] == 'true'
        session['uncertainty'] = request.form['uncertainty_analysis'] == 'true'
        session['nb_realizations'] = int(request.form['nb_realizations'])
        # Get files from request
        if session['optim_sankey'] is False:
            # Get Excel file and save it in temp dir
            excel_input_file = request.files['input_file']
            session['input_excel_file_abspath'] = os.path.join(session['tmp_dir'], excel_input_file.filename)
            excel_input_file.save(session['input_excel_file_abspath'])
            session['model_name'] = excel_input_file.filename
            # Get Excel upper region file and save it in temp dir
            session['reg'] = 'upper_level_file' in request.files
            if session['reg']:
                excel_upper_level_file = request.files['upper_level_file']
                session['input_upper_level_file_abspath'] = os.path.join(
                    session['tmp_dir'], excel_upper_level_file.filename)
                excel_upper_level_file.save(session['input_upper_level_file_abspath'])
        else:
            # Optimize directly from json data -> no Excel to save
            # But prepare the excel filename for output later
            session['input_excel_file_abspath'] = os.path.join(session['tmp_dir'], 'tutu.xlsx')
            session['model_name'] = 'local sankey model'
        # output files
        session['output_excel_file_abspath'] = session['input_excel_file_abspath']
        # Ready to start optim
        session['optim_started'] = True
    except Exception as e:
        # Logging unexpected error
        trace.logger.error('UNEXPECTED ERROR when reading params.')
        trace.logger.error('Please report this issue to support@open-sankey.fr')
        trace.logger.debug('UNEXPECTED ERROR {}'.format(e))
        trace.logger.info('{:-<{w}}'.format(
            ' [FAILED] Internal error', w=MAX_LINE_LENGTH))
        # TODO : Comment ça se passe si ça plante ici ? Il n'y a pas de log pour le client
        err_msg = "ERROR: "
        err_msg += "optimize_prod_init - erreur fatale. "
        err_msg += "{}. ".format(e)
        err_msg += "Le dossier courant est {}".format(session['tmp_dir'])
        return Response(
            json.dumps({'output': err_msg}),
            status=500,
            mimetype='application/json'
        )

    # Start process
    t_start = time.time()
    t_prev = time.time()
    trace.logger.info('{:-<{w}}'.format(
        '[INITIALIZING] Loading datas ', w=MAX_LINE_LENGTH))
    trace.logger.debug('Temporary datas are in {}'.format(session['tmp_dir']))

    # Load Sankey data
    if session['optim_sankey'] is False:
        # Load from input excel file
        excel_sheets_to_remove = []
        do_coherence_checks = not session['create_empty_ter']
        try:
            io_excel = IOExcel()
            ok, msg = io_excel.load_sankey_from_excel_file(
                session['input_excel_file_abspath'],
                do_coherence_checks=do_coherence_checks,
                sheet_to_remove_names=excel_sheets_to_remove)
            sankey = io_excel.sankey
        except Exception as e:
            # Logging unexpected error
            trace.logger.error('UNEXPECTED ERROR in input file')
            trace.logger.error('Please report this issue to support@open-sankey.fr')
            trace.logger.debug('UNEXPECTED ERROR {}'.format(e))
            trace.logger.info('{:-<{w}}'.format(
                '[FAILED] Could not extract datas from input file ', w=MAX_LINE_LENGTH))
            # Return response
            err_msg = "UNEXPECTED ERROR: "
            err_msg += "load_sankey_from_excel_file - erreur fatale. "
            err_msg += "{}".format(e)
            return Response(
                json.dumps({'output': err_msg}),
                status=500,
                mimetype='application/json')
        if not ok:
            # logging error that are anticipated
            trace.logger.error('ERROR in input file.')
            for _ in msg.split('\n'):
                trace.logger.error('ERROR {}'.format(_))
            trace.logger.info('{:-<{w}}'.format(
                '[FAILED] Could not extract datas from input file ', w=MAX_LINE_LENGTH))
            # Return response
            err_msg = "ERROR: "
            err_msg += "load_sankey_from_excel_file - "
            err_msg += "{}".format(msg)
            return Response(
                json.dumps({'output': err_msg}),
                status=500,
                mimetype='application/json')
    else:
        # Load from input json data
        excel_sheets_to_remove = []
        try:
            sankey_json = json.loads(request.form['sankey_data'])
            sankey = extract_sankey_from_json(sankey_json)
            sankey.autocompute_mat_balance()
        except Exception as e:
            # Logging unexpected error
            trace.logger.error('UNEXPECTED ERROR in datas extraction')
            trace.logger.error('Please report this issue to support@open-sankey.fr')
            trace.logger.debug('UNEXPECTED ERROR {}'.format(e))
            trace.logger.info('{:-<{w}}'.format(
                '[FAILED] Could not read datas from Sankey ', w=MAX_LINE_LENGTH))
            # Return response
            err_msg = "UNEXPECTED ERROR: "
            err_msg += "extract_sankey_from_json - erreur fatale. "
            err_msg += "{}".format(e)
            return Response(
                json.dumps({'output': err_msg}),
                status=500,
                mimetype='application/json')

    # Time logging
    t = time.time()
    trace.logger.info('{:-<{w}}'.format(
        '[OK] Loaded Datas succesfully ', w=MAX_LINE_LENGTH))
    trace.logger.debug(
        'Took {} / {} sec'
        .format(round((t-t_prev), 2), round((t-t_start), 2)))
    t_prev = t

    # # 2. Reconciliation
    # # 2.1 load geographical upper level results
    # if session['reg']:
    #     # Init vectors
    #     upper_level_solved_vector = None
    #     upper_level_classification = None
    #     upper_level_index2name = None
    #     input_montecarlo_results = None
    #     # Check specific file for upper levels
    #     if not os.path.isfile(session['input_upper_level_file_abspath']):
    #         return Response(
    #             json.dumps({'output': 'ERROR - Loading geographical upper level excel file does not exist.'}),
    #             status=500,
    #             mimetype='application/json')
    #     # Load specific file for upper levels
    #     try:
    #         xls = pd.ExcelFile(session['input_upper_level_file_abspath'])
    #         df_results = pd.read_excel(xls, 'Results')
    #     except Exception as e:
    #         err_msg = 'UNEXPECTED ERROR: Loading geographical '
    #         err_msg += 'upper level excel file failed : {}'.format(e)
    #         return Response(
    #             json.dumps({'output': err_msg}),
    #             status=500,
    #             mimetype='application/json')
    #     # Update vectors
    #     upper_level_solved_vector = df_results['valeur out'].to_numpy()
    #     upper_level_classification = df_results['classif'].to_numpy()
    #     upper_level_id = df_results[[
    #         'id',
    #         'table',
    #         'produit',
    #         'secteur',
    #         'origine',
    #         'destination']].to_numpy()
    #     upper_level_index2name = []
    #     for e in upper_level_id:
    #         upper_level_index2name.append({
    #             't': e[1],
    #             'o': e[4],
    #             'd': e[5],
    #             'p': e[2],
    #             's': e[3]})
    #     if session['uncertainty']:
    #         simulation_results = pd.read_excel(xls, 'Simulations')
    #         input_montecarlo_results = simulation_results.to_numpy()
    #     trace.logger.debug('Reconciled geographical upper level results loaded')

    #     # Time logging
    #     t = time.time()
    #     trace.logger.info(
    #         '-- RECONCILED GEOGRAPHICAL UPPER LEVEL LOADED, TOOK {} / {} sec'
    #         .format(round((t-t_prev), 2), round((t-t_start), 2)))
    #     t_prev = t

    # 2.2 Only excel check
    if session['check_excel']:
        # Time logging
        t = time.time()
        trace.logger.info('{:-<{w}}'.format(
            '[COMPLETED] Check input file finished, took {} sec '
            .format(round((t-t_start), 2)),
            w=MAX_LINE_LENGTH))
        # Ending here
        return Response(
            json.dumps({}),
            status=200,
            mimetype='application/json'
        )

    # 2.3 Create empty TER
    if session['create_empty_ter']:
        # Rewrite
        try:
            io_excel.write_excel_from_sankey(
                session['output_excel_file_abspath'],
                sankey,
                sheets_to_remove__names=excel_sheets_to_remove)
        except Exception as e:
            # Logging unexpected error
            trace.logger.error('UNEXPECTED ERROR when writing output file.')
            trace.logger.debug('{}'.format(e))
            trace.logger.info('{:-<{w}}'.format(
                '[FAILED] Could not generate the output file ', w=MAX_LINE_LENGTH))
            # Return response
            err_msg = "UNEXPECTED ERROR: "
            err_msg += "write_excel_from_sankey - erreur fatale. "
            err_msg += "{}".format(e)
            return Response(
                json.dumps({'output': err_msg}),
                status=500,
                mimetype='application/json')
        # Json output
        session['output_json_file_abspath'] = os.path.join(session['tmp_dir'], "tutu.json")
        try:
            sankey_json = extract_json_from_sankey(sankey)
            json_data = json.dumps(sankey_json)
            with open(session['output_json_file_abspath'], "w") as json_output_file:
                json_output_file.write(json_data)
        except Exception as e:
            trace.logger.error('-- UNEXPECTED ERROR in output json file writing.')
            trace.logger.error('-- Please report this issue to support@open-sankey.fr')
            trace.logger.debug('-- UNEXPECTED ERROR {}'.format(e))
            trace.logger.info('{:-<{w}}'.format(
                ' [FAILED] Optimization was successful, but an error occured when retrieving results',
                w=MAX_LINE_LENGTH))
            return
        # Time logging
        t = time.time()
        trace.logger.info(
            'Updated tables in excel file')
        trace.logger.debug(
            'Took {} / {} sec'
            .format(round((t-t_prev), 2), round((t-t_start), 2)))
        trace.logger.info('{:-<{w}}'.format(
            '[COMPLETED] Tables creation finished, took {} sec '
            .format(round((t-t_start), 2)),
            w=MAX_LINE_LENGTH))
        # Return Updated file
        return Response(
            json.dumps({'output': 'OK'}),
            status=200,
            mimetype='application/json')

    # 2.4 reconciliation
    write_mode = 'a'
    if session['optim_sankey'] is True:
        write_mode = 'w'
    session['output_json_file_abspath'] = os.path.join(session['tmp_dir'], "tutu.json")
    trace.logger.info('{:-<{w}}'.format(
        '[STARTING] Optimisation process ', w=MAX_LINE_LENGTH))
    thread = Thread(
        target=solve_optimisation_problem,
        args=(
            session['model_name'],
            sankey,
            session['uncertainty'],
            session['nb_realizations'],
            session['reg'],
            session['output_json_file_abspath'],
            session['output_excel_file_abspath'],
            excel_sheets_to_remove,
            write_mode,
            session['trace_file_abspath'],
            t_start))
    thread.daemon = True
    trace.logger.debug('Optimisation thread created')
    thread.start()
    # Return Updated file
    return Response(
        json.dumps({'output': 'OK'}),
        status=200,
        mimetype='application/json')


@sankeyapp.route('/optimize/check_process', methods=['POST'])
def optimize_check_process():
    # Only if optimisation has been launched
    if ("optim_started" not in session) or \
       (session["optim_started"] is False):
        return Response(
            json.dumps({}),
            status=200,
            mimetype='application/json'
        )
    # Read and send logs
    try:
        if os.path.isfile(session['trace_file_abspath']):
            f = open(session['trace_file_abspath'], "r")
            results = f.read()
            results_dict = {"output": results}
            json_data = json.dumps(results_dict)
            return Response(
                json_data,
                status=200,
                mimetype='application/json'
            )
        else:
            return Response(
                json.dumps({'output': 'ERROR: /optimize/check_process: le fichier tmp_log n\'existe pas.'}),
                status=500,
                mimetype='application/json'
            )
    except Exception:
        return Response(
            json.dumps({'output': 'ERROR:/optimize/check_process: le fichier tmp_log ne peut pas être ouvert.'}),
            status=500,
            mimetype='application/json'
        )


@sankeyapp.route('/optimize/retrieve_results', methods=['POST'])
def optimize_retrieves_result():
    excel_file = session['output_excel_file_abspath']
    if excel_file == '':
        return Response(
            json.dumps({}),
            status=500,
            mimetype='application/json')
    return send_file(excel_file, as_attachment=True)


@sankeyapp.route('/optimize/display_results', methods=['POST'])
def optimize_display_results():
    try:
        with open(
            session['output_json_file_abspath'],
            encoding="utf-8",
            mode="r"
        ) as json_file:
            json_data = json.load(json_file)
        response = Response(
            response=json.dumps(json_data),
            status=200,
            mimetype='application/json'
        )
        return response
    except Exception as e:
        err_msg = 'Json dumps failed: {}'.format(e)
        response = Response(
            response=json.dumps({'error': err_msg}),
            status=405,
            mimetype='application/json'
        )
        return response


@sankeyapp.route('/optimize/post_clean', methods=['POST'])
def optimize_prod_clean():
    session['optim_started'] = False
    errors_dict = {'output': []}
    # Delete useless files
    file_to_del = [
        'input_excel_file_abspath',
        'output_excel_file_abspath',
        'output_json_file_abspath',
        'trace_file_abspath']
    for _ in file_to_del:
        if _ in session:
            if os.path.isfile(session[_]):
                try:
                    os.remove(session[_])
                except Exception:
                    err_msg = "ERROR: "
                    err_msg += "Error when deleting {}. \n".format(session[_])
                    errors_dict['output'].append(err_msg)
    # Delete useless temp dir
    try:
        os.rmdir(session['tmp_dir'])
    except Exception:
        err_msg = "ERROR: "
        err_msg += "Error when deleting {}. \n".format(session['tmp_dir'])
        errors_dict['output'].append(err_msg)
    # End
    if len(errors_dict['output']) == 0:
        msg = 'DEBUG: Working directory cleaned'
        response = Response(
            response=json.dumps({'output': msg}),
            status=200,
            mimetype='application/json')
    else:
        json_data = json.dumps(errors_dict)
        response = Response(
            response=json_data,
            status=500,
            mimetype='application/json')
    return response
