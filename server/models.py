# coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de création : 25/01/2023

# Flask imports
from flask import Blueprint
from flask import jsonify
from flask import request
from flask_login import UserMixin
from flask_login import login_required
from flask_login import current_user

# Local imports
from . import db

# Create user blue print
connected_user = Blueprint('connected_user', __name__)


class User(UserMixin, db.Model):
    """
    Define table 'user' in database
    - Cle primaire : user.id
    - Entrées :
        - email (String, unique)
        - password (String, chiffé)
        - firstname (String)
        - lastname (String)
        - license_opensankeyplus (String)
        - license_sankeysuite (String)
    """
    # primary keys are required by SQLAlchemy
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(100))
    firstname = db.Column(db.String(1000))
    name = db.Column(db.String(1000))
    license_opensankeyplus = db.Column(db.String(2000))
    license_sankeysuite = db.Column(db.String(2000))
    is_developer = db.Column(db.Boolean)


@connected_user.route('/user_infos')
@login_required
def user_infos():
    '''
    HTTP GET request to get user's infos

    Output JSON response
    - 'email' (String) : User's email
    - 'firstname' (String) : User's firstname
    - 'name' (String) : User's name
    - 'license_opensankeyplus' (String) : License number for OpenSankey+
    - 'license_sankeysuite' (String) : License number for SankeySuite
    '''
    # Prepare response
    response = {
        'email': current_user.email,
        'name': current_user.name,
        'firstname': current_user.firstname,
        'license_opensankeyplus': current_user.license_opensankeyplus,
        'license_sankeysuite': current_user.license_sankeysuite
    }
    # Send back response
    return jsonify(response)


@connected_user.route('/user_infos/license_opensankeyplus')
@login_required
def user_infos_license_opensankeyplus():
    '''
    HTTP GET request to get user's OpenSankey+ license

    Output JSON response
    - 'license_id' (String) : License number for OpenSankey+
    '''
    # Prepare response
    response = {
        'license_id': current_user.license_opensankeyplus
    }
    # Send back response
    return jsonify(response)


@connected_user.route('/user_infos/license_opensankeyplus', methods=['POST'])
@login_required
def user_set_license_opensankeyplus():
    '''
    HTTP POST request to set user's OpenSankey+ license

    Input JSON request
    - 'license_id' (String) : License number for OpenSankey+

    Output JSON response
    - 'message' (String) : Error / Success message if needed
    '''
    # Read request
    current_user.license_opensankeyplus = request.json.get('license_id')
    db.session.commit()
    # Prepare response
    response = {
        'message': 'OK'
    }
    # Send back response
    return jsonify(response)


@connected_user.route('/user_infos/license_sankeysuite')
@login_required
def user_infos_license_mfasankey():
    '''
    HTTP GET request to get user's infos

    Output JSON response
    - 'license_id' (String) : License number for SankeySuite
    '''
    # Prepare response
    response = {
        'license_id': current_user.license_sankeysuite
    }
    # Send back response
    return jsonify(response)


@connected_user.route('/user_infos/license_sankeysuite', methods=['POST'])
@login_required
def user_set_license_mfasankey():
    '''
    HTTP POST request to set user's SankeySuite license

    Input JSON request
    - 'license_id' (String) : License number for SankeySuite

    Output JSON response
    - 'message' (String) : Error / Success message if needed
    '''
    # Read request
    current_user.license_sankeysuite = request.json.get('license_id')
    db.session.commit()
    # Prepare response
    response = {
        'message': 'OK'
    }
    # Send back response
    return jsonify(response)


@connected_user.route('/user_infos/is_developer')
@login_required
def user_infos_is_developer():
    '''
    HTTP GET request to check if current user has developer acces

    Output JSON response
    - 'is_dev' (Bool) : True if user is developer
    '''
    # Prepare response
    response = {
        'is_dev': current_user.is_developer
    }
    # Send back response
    return jsonify(response)
