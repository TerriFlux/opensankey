#  coding: utf-8
from flask import render_template
from flask import request
import requests

try:
    from . import sankeyapp
except Exception:
    import sankeyapp


@sankeyapp.route('/')
def start():
    return render_template(
        'index.html',
        filename='',
        static_site='false'
    )


@sankeyapp.route('/<adress>')
def goto(adress):
    return render_template(adress)


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
