#  coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de modification : 26/09/2024

# ---------------------------------------------------------------
# External libs
import os
import requests

# Flask imports
from flask import Blueprint
from flask import render_template
from flask import request
from flask import redirect
from flask import send_from_directory

# ---------------------------------------------------------------
# Local imports
from .models import update_metrics

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
    # Construct request for EDD
    req_dict = {
        'edd_action': request.json.get('action'),
        'license': request.json.get('license_id'),  # License key
        'item_name': request.json.get('app_name'),  # Product ID
        'url': 'open-sankey.fr'  # Domain the request is coming from.
    }
    # Send POST request
    res = requests.post('https://terriflux.com/edd-sl/', req_dict)
    # Return EDD response as JSON
    return res.json()
