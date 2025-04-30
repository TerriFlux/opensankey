# coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de création : 25/01/2023

# ---------------------------------------------------------------

import hashlib
import json
import random
import secrets
import string
import os

from datetime import datetime
from datetime import timedelta

# Flask imports
from flask import Blueprint, Response
from flask import jsonify
from flask import request

# Flask_login imports
from flask_login import current_user
from flask_login import logout_user

# SQLAlchemy
from sqlalchemy import func

# Werkzeug
from werkzeug.security import check_password_hash
from werkzeug.security import generate_password_hash
# Sankey libs
import SankeyExcelParser.su_trace as trace

# ---------------------------------------------------------------
# Local imports

from .models import db
from .models import User
from .models import login_required
from .models import license_required
from .mailing import send_pw_modification_email
from .stripe import cancel_subscription

# ---------------------------------------------------------------
# Shared variables

connected_user = Blueprint('connected_user', __name__)


# ---------------------------------------------------------------
# Routes

@connected_user.route('/user/infos')
@login_required
def user_infos():
    """
    HTTP GET request to get user's infos

    Output JSON response
    - 'email' (String) : User's email
    - 'firstname' (String) : User's firstname
    - 'name' (String) : User's name
    - 'license_legacy_opensankeyplus' (String) : License number for OpenSankey+
    - 'license_legacy_sankeysuite' (String) : License number for SankeySuite
    - 'license_opensankeyplus_validity' (boolean): Is license valid ?
    - 'license_opensankeyplus_expiry' (String): Expiration date for license
    """
    # Parse expiration date
    license_exp = current_user.get_license_expiry()
    try:
        license_exp = datetime\
            .fromisoformat(license_exp)\
            .strftime('%a %d %b %Y')
    except Exception:
        pass
    # Prepare response
    response = {
        'email': current_user.email,
        'name': current_user.name,
        'firstname': current_user.firstname,
        'license_legacy_opensankeyplus': current_user.license_opensankeyplus,
        'license_legacy_sankeysuite': current_user.license_sankeysuite,
        'license_opensankeyplus_validity': current_user.has_valid_license(),
        'license_opensankeyplus_expiry': license_exp
    }
    # Send back response
    return jsonify(response)


@connected_user.route('/user/infos/modify/email', methods=['POST'])
@login_required
def modify_email():
    """
    HTTP Post request to change email of current user

    Input JSON Request
    - 'email' (String) : User's current email
    - 'new_email' (String) : User's new email
    - 'password' (String) : User's password for confirmation
    """
    # Read request
    email = request.json.get('email')
    new_email = request.json.get('new_email')
    password = request.json.get('password')

    # Check if other user already have this email
    other_user = User.query\
        .filter(func.lower(User.email) == func.lower(new_email))\
        .first()
    if other_user is not None:
        return 'email_in_use', 400

    # Check if email is coherent
    if (
        (current_user.email.lower() == email.lower()) and
        (check_password_hash(current_user.password, password))
    ):
        current_user.email = new_email
        db.session.commit()
        return 'ok', 200

    # Send back response
    return 'request_error', 400


@connected_user.route('/user/infos/modify/pwd/trigger', methods=['POST'])
@login_required
def trigger_modify_pwd():
    """
    Trigger password reseting

    Input JSON request
    - 'email' (String) : user's email
    - 'lang' (String) : Selected language for mail

    Returns
    -------
    :return: _description_
    :rtype: _type_
    """
    # Verify email - if OK create reseting url
    try:
        if current_user.email.lower() == request.json.get('email').lower():
            current_user.secret_token = \
                ''.join(secrets.choice(string.digits) for i in range(6))
            current_user.secret_expiry = \
                (datetime.now() + timedelta(minutes=10)).isoformat()
            send_pw_modification_email(current_user, request.json.get("lang"))
            db.session.commit()
    except Exception as e:
        return 'err:' + str(e), 500
    # Return
    return 'ok', 200


@connected_user.route('/user/infos/modify/pwd', methods=['POST'])
@login_required
def modify_pwd():
    """
    Apply password reseting

    Input JSON request
    - 'new_password' (String) : user's email
    - 'token' (String): token to validate

    Returns
    -------
    :return: _description_
    :rtype: _type_
    """
    # Verify token
    if (current_user.secret_token != request.json.get('token')):
        return 'token_invalid', 400

    # Verify token expiry
    if (datetime.now() > datetime.fromisoformat(current_user.secret_expiry)):
        return 'token_expired', 400

    # Ok token, apply new password
    current_user.password = generate_password_hash(
        request.json.get('new_password'),
        method='sha256')

    # Clear token
    current_user.secret_token = None
    current_user.secret_expiry = None
    db.session.commit()

    # Return
    return 'ok', 200


@connected_user.route('/user/infos/modify/firstname', methods=['POST'])
@login_required
def modify_firstname():
    """
    HTTP Post request to change firstname of current user

    Input JSON Request
    - 'firstname' (String) : User's new firstname
    """
    # Apply modif
    current_user.firstname = request.json.get('firstname')
    db.session.commit()
    return 'ok', 200


@connected_user.route('/user/infos/modify/lastname', methods=['POST'])
@login_required
def modify_lastname():
    """
    HTTP Post request to change lastname of current user

    Input JSON Request
    - 'lastname' (String) : User's new lastname
    """
    # Apply modif
    current_user.name = request.json.get('lastname')
    db.session.commit()
    return 'ok', 200


@connected_user.route('/user/delete/license/<license_name>', methods=['POST'])
@license_required
def delete_license(license_name):
    """
    Delete susbcription if present

    Returns
    -------
    :return: _description_
    :rtype: _type_
    """
    # Get related license
    user_license = current_user.get_license(license_name)
    if user_license is None:
        return 'license_inexistant', 400
    # Cancel subscription
    try:
        ok_cancel = cancel_subscription(
            user_license.stripe_id,
            request.json.get('comment'),
            request.json.get('feedback'))
    except Exception as e:
        return 'err_in_cancel : {}'.format(e), 500
    if not ok_cancel:
        return 'failed_to_cancel', 500
    # Set subscription as deactivated
    user_license.active = False
    db.session.commit()
    # Return
    return 'ok', 200


@connected_user.route('/user/delete/account', methods=['POST'])
@login_required
def delete_account():
    """
    Delete account and susbcription if present

    Returns
    -------
    :return: _description_
    :rtype: _type_
    """
    try:
        # Check password
        if (
            not check_password_hash(
                current_user.password,
                request.json.get('password'))
        ):
            return 'request_error', 400

        # Unsubscribe to licenses
        msg = ''
        for user_license in current_user.user_licenses:
            try:
                cancel_subscription(
                    user_license.stripe_id,
                    request.json.get('comment'),
                    request.json.get('feedback'))
            except Exception as e:
                msg += 'Could not delete sub - {}.'.format(e)
            user_license.activated = False

        # Delete account
        current_user.delete()
        db.session.commit()

        # force Logout user
        logout_user()
    except Exception as e:
        return 'err : {}'.format(e), 500
    return 'ok', 200


@connected_user.route('/user/infos/legacy/license_opensankeyplus')
@login_required
def user_infos_license_opensankeyplus():
    """
    HTTP GET request to get user's OpenSankey+ license

    Output JSON response
    - 'license_id' (String) : License number for OpenSankey+
    """
    # Prepare response
    response = {
        'license_id': current_user.license_opensankeyplus
    }
    # Send back response
    return jsonify(response)


@connected_user.route(
    '/user/infos/legacy/license_opensankeyplus',
    methods=['POST'])
@login_required
def user_set_license_opensankeyplus():
    """
    HTTP POST request to set user's OpenSankey+ license

    Input JSON request
    - 'license_id' (String) : License number for OpenSankey+

    Output JSON response
    - 'message' (String) : Error / Success message if needed
    """
    # Read request
    current_user.license_opensankeyplus = request.json.get('license_id')
    db.session.commit()
    # Prepare response
    response = {
        'message': 'OK'
    }
    # Send back response
    return jsonify(response)


@connected_user.route('/user/infos/legacy/license_sankeysuite')
@login_required
def user_infos_license_mfasankey():
    """
    HTTP GET request to get user's infos

    Output JSON response
    - 'license_id' (String) : License number for SankeySuite
    """
    # Prepare response
    response = {
        'license_id': current_user.license_sankeysuite
    }
    # Send back response
    return jsonify(response)


@connected_user.route(
    '/user/infos/legacy/license_sankeysuite',
    methods=['POST'])
@login_required
def user_set_license_mfasankey():
    """
    HTTP POST request to set user's SankeySuite license

    Input JSON request
    - 'license_id' (String) : License number for SankeySuite

    Output JSON response
    - 'message' (String) : Error / Success message if needed
    """
    # Read request
    current_user.license_sankeysuite = request.json.get('license_id')
    db.session.commit()
    # Prepare response
    response = {
        'message': 'OK'
    }
    # Send back response
    return jsonify(response)


@connected_user.route('/user/infos/legacy/is_developer')
@login_required
def user_infos_is_developer():
    """
    HTTP GET request to check if current user has developer acces

    Output JSON response
    - 'is_dev' (Bool) : True if user is developer
    """
    # Prepare response
    response = {
        'is_dev': current_user.is_developer
    }
    # Send back response
    return jsonify(response)


@connected_user.route('/user/set_preference', methods=['POST'])
@login_required
def set_preference():
    """
    HTTP POST to set user preference info

    Input JSON containg elements from user
    -
    Output JSON response
    - ok
    """
    path_dir_user = check_user_has_pref_dir()
    # Dump user preference in files

    # Dump user palette
    if ('palette' in request.json):
        with open(os.path.join(path_dir_user,
                               'palette.json'), 'w') as file:
            json.dump(request.json.get('palette'), file)

    # Dump user icon catalog
    if ('icon_catalog' in request.json):
        with open(os.path.join(path_dir_user,
                               'icon.json'), 'w') as file:
            json.dump(request.json.get('icon_catalog'), file)

    # Dump user taggs
    with open(os.path.join(path_dir_user, 'taggs.json'), 'w') as file:
        taggs = {}
        if ('node_taggs' in request.json):
            taggs['node_taggs'] = request.json.get('node_taggs')
        if ('flow_taggs' in request.json):
            taggs['flow_taggs'] = request.json.get('flow_taggs')
        if ('data_taggs' in request.json):
            taggs['data_taggs'] = request.json.get('data_taggs')

        json.dump(taggs, file)

    # Dump user style
    with open(os.path.join(path_dir_user, 'style.json'), 'w') as file:
        style = {}
        if ('style_node' in request.json):
            style['style_node'] = request.json.get('style_node')
        if ('style_link' in request.json):
            style['style_link'] = request.json.get('style_link')
        json.dump(style, file)

    # Send back response
    return 'ok', 200


@login_required
def check_user_has_pref_dir():
    """
   Function that check if user preference directory exist, \
    if not then create it

    Output str
    - user_pref_dir : path to user preference directory
    """
    if (current_user.dir is None):
        # Create a user directory name with name of user + a random suffix
        user_id: str = current_user.name.replace(
            ' ', '_')+''.join(random.choice(string.ascii_lowercase) for i
                              in range(5))
        current_user.dir = hashlib.sha256(user_id.encode()).hexdigest()
        db.session.commit()  # update database with new dir path

    name_directory_user_pref = os.environ['USER_PREF_REP']
    user_pref_dir = os.path.join(name_directory_user_pref, current_user.dir)
    if (not os.path.exists(user_pref_dir)):
        # create a directory for user if not present
        os.mkdir(user_pref_dir)
    # Return path to user dir
    return user_pref_dir


@connected_user.route('/user/get_preference', methods=['POST'])
@login_required
def get_preference():
    """
    HTTP POST to set user preference info

    Input JSON containing elements from user
    -
    Output JSON response
    - json containing user peference
    """
    path_dir_user = check_user_has_pref_dir()
    preference = {}
    try:
        path_palette = os.path.join(path_dir_user, 'palette.json')
        path_icon = os.path.join(path_dir_user, 'icon.json')
        path_taggs = os.path.join(path_dir_user, 'taggs.json')
        path_style = os.path.join(path_dir_user, 'style.json')

        # Get user palette if file exist
        if (os.path.exists(path_palette)):
            with open(path_palette, 'r') as file:
                preference['palette'] = json.load(file)

        # Get user icon catalog if file exist
        if (os.path.exists(path_icon)):
            with open(path_icon, 'r') as file:
                preference['icon_catalog'] = json.load(file)

        # Get user taggs if file exist
        if (os.path.exists(path_taggs)):
            with open(path_taggs, 'r') as file:
                taggs = json.load(file)
                for key, value in taggs.items():
                    preference[key] = value

        # Get user style if file exist
        if (os.path.exists(path_style)):
            with open(path_style, 'r') as file:
                style = json.load(file)
                for key, value in style.items():
                    preference[key] = value

        # Send back response
        return Response(
            json.dumps(preference),
            status=200,
            mimetype='application/json'
        )
    except Exception:
        trace.logger.error('get user preference failed')
        response = Response(
            json.dumps('{}'),
            status=500,
            mimetype='application/json'
        )
        return response
