# coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de création : 25/01/2023

# Flask imports
from flask import Blueprint
from flask import jsonify
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
        - license_key (String)
    """
    id = db.Column(db.Integer, primary_key=True)  # primary keys are required by SQLAlchemy
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(100))
    firstname = db.Column(db.String(1000))
    name = db.Column(db.String(1000))
    license = db.Column(db.String(2000))


@connected_user.route('/user_infos')
@login_required
def user_infos():
    '''
    HTTP GET request to get user's infos

    Output JSON response
    - 'email' (Boolean) : True if connection succeeded
    - 'license' (String) : License number
    '''
    # Prepare response
    response = {
        'email': current_user.email,
        'license': current_user.license
    }
    # Send back response
    return jsonify(response)
