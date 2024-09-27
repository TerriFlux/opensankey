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
from flask import Response

# ---------------------------------------------------------------
# Local imports
from .mailing import mail
from .mailing import create_welcome_mail

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


@sankeyapp.route('/mail/send_welcome', methods=['POST'])
def mail_send_welcome():
    """
    Send welcome message

    Input JSON request
    - 'email' (String) : user's email
    - 'firstname' (String) : user's firstname
    - 'lang' (String) : Selected language for mail

    Returns
    -------
    :return: _description_
    :rtype: _type_
    """
    try:
        msg = create_welcome_mail(
            request.json.get("email"),
            request.json.get("firstname"),
            request.json.get("lang"))
        mail.send(msg)
    except Exception as excpt:
        response = Response(
            response='mail_send_welcome : ' + str(excpt),
            status=402)
        return response
    return Response(status=200)
