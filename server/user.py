# coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de création : 25/01/2023

# ---------------------------------------------------------------

import secrets
import string

from datetime import datetime
from datetime import timedelta

# Flask imports
from flask import Blueprint
from flask import jsonify
from flask import request

# Flask_login imports
from flask_login import current_user
from flask_login import logout_user

# SQLAlchemy
from flask_sqlalchemy import SQLAlchemy

# Werkzeug
from werkzeug.security import check_password_hash
from werkzeug.security import generate_password_hash


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
    other_user = User.query.filter_by(email=new_email).first()
    if other_user is not None:
        return 'email_in_use', 400

    # Check if email is coherent
    if (
        (current_user.email == email) and
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
        if current_user.email == request.json.get('email'):
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
    import pdb; pdb.set_trace()
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
