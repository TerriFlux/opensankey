# coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de création : 25/01/2023

# ---------------------------------------------------------------

import datetime
from functools import wraps

# Flask imports
from flask import Blueprint
from flask import current_app
from flask import jsonify
from flask import request
from flask_login import current_user
from flask_login import login_required
from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy

# Itsdangerous - serialize URLs for secured API transactions
from itsdangerous import URLSafeTimedSerializer as Serializer


# ---------------------------------------------------------------
# Create user blue print

connected_user = Blueprint('connected_user', __name__)
db = SQLAlchemy()


# ---------------------------------------------------------------
# Define specific functions

def init_db(app):
    """
    Init database

    Parameters
    ----------
    :param app: _description_
    :type app: _type_

    Optional parameters
    -------------------
    """
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite'
    db.init_app(app)


# ---------------------------------------------------------------
# Define models

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
    # Db entries
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(100))
    firstname = db.Column(db.String(1000))
    name = db.Column(db.String(1000))
    license_opensankeyplus = db.Column(db.String(2000))
    license_sankeysuite = db.Column(db.String(2000))
    is_developer = db.Column(db.Boolean)
    # Relationships
    licenses = db.relationship('License', secondary='user_licenses')

    def get_reset_token(self):
        serializer = Serializer(current_app.config['SECRET_KEY'])
        return serializer.dumps(self.id)

    @staticmethod
    def verify_reset_token(token):
        serializer = Serializer(current_app.config['SECRET_KEY'])
        try:
            user_id = serializer.loads(token, max_age=1800)  # age in sec
        except Exception:
            return None
        return User.query.get(user_id)


class License(db.Model):
    """
    Define the license data model

    Parameters
    ----------
    :param db: _description_
    :type db: _type_

    Optional parameters
    -------------------
    """
    __tablename__ = 'license'
    # primary keys are required by SQLAlchemy
    id = db.Column(db.Integer(), primary_key=True)
    # Db entries
    name = db.Column(db.String(50), unique=True)


class UserLicences(db.Model):
    """
    Define the user-license association table

    Parameters
    ----------
    :param db: _description_
    :type db: _type_

    Optional parameters
    -------------------
    """
    __tablename__ = 'user_licenses'
    # primary keys are required by SQLAlchemy
    id = db.Column(db.Integer(), primary_key=True)
    # Db entries
    user_id = db.Column(db.Integer(), db.ForeignKey('user.id', ondelete='CASCADE'))
    license_id = db.Column(db.Integer(), db.ForeignKey('license.id', ondelete='CASCADE'))
    license_expiry = db.Column(db.String(50), unique=True)


def licence_required(license=''):
    """
    see: https://flask.palletsprojects.com/en/2.1.x/patterns/viewdecorators/
    """
    def wrapper(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return "Not connected"
            license_id = License.query.filter_by(name=license).first()
            if license_id not in current_user.licenses:
                return "No valid license"
            return f(*args, **kwargs)
        return decorated_function
    return wrapper

# ---------------------------------------------------------------
@connected_user.route('/test')
@licence_required('test')
def get_test():
    return 'OK license'

@connected_user.route('/set_test')
@login_required
def set_licence():
    # Get license id or create it
    license = License.query.filter_by(name='test').first()
    if license is None:
        license = License(name='test')

    import pdb; pdb.set_trace()

    # Get association or create it
    user_license = UserLicences.query.filter_by(
        user_id = current_user.id,
        license_id = license.id
    ).first()
    if (user_license is None):
        expiry = (datetime.datetime.now() + datetime.timedelta(days=365)).isoformat()
        user_license = UserLicences(
            user_id=current_user.id,
            license_id=license.id,
            license_expiry=expiry)

    # # Add licence if not here
    # current_user.licenses.append(license)

    # db.session.commit()
    return 'OK set licenses'


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
