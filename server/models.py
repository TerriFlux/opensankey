# coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de création : 25/01/2023

# ---------------------------------------------------------------

from datetime import datetime
from functools import wraps

# Flask imports
from flask import Blueprint
from flask import current_app
from flask import jsonify
from flask import request

# Flask_login imports
from flask_login import current_user
from flask_login import UserMixin

# SQLAlchemy
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.associationproxy import association_proxy

# Werkzeug
from werkzeug.security import check_password_hash

# Itsdangerous - serialize URLs for secured API transactions
from itsdangerous import URLSafeTimedSerializer as Serializer


# ---------------------------------------------------------------
# Shared variables

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
    # Primary keys are required by SQLAlchemy
    id = db.Column(db.Integer, primary_key=True)
    # User infos entries
    email = db.Column(db.String(128), unique=True)
    password = db.Column(db.String(256))
    firstname = db.Column(db.String(64))
    name = db.Column(db.String(64))
    # Old Licenses infos - TODO remove
    license_opensankeyplus = db.Column(db.String(1024))
    license_sankeysuite = db.Column(db.String(1024))
    is_developer = db.Column(db.Boolean)
    # Customer infos
    creation = db.Column(db.String(128))
    stripe_id = db.Column(db.String(1024), unique=True)
    # Relationships
    # Cascade - delete entries in UserLicense if this db entry is deleted
    user_licenses = db.relationship(
        'UserLicences',
        back_populates='user',
        cascade="all, delete")
    licenses = association_proxy('user_licenses', 'license')

    def is_from_terriflux(self):
        # Get related license to terriflux
        license = License.query.filter_by(name='terriflux').first()
        # Check if user is related to this specific license
        return (
            UserLicences.query.filter_by(
                license=license,
                user=self).first() is not None)

    def get_license_expiry(self, license_name):
        # If from Terriflux - skip all process
        if self.is_from_terriflux():
            return 'never'
        # Get related license to given name
        license = License.query.filter_by(name=license_name).first()
        if license is None:
            return None
        # Get relation between license and user
        this_license = UserLicences.query.filter_by(
            license=license,
            user=self).first()
        # Check if this relation exists and return its validty
        if this_license is not None:
            return this_license.expiry
        # Otherwise return None
        return None

    def get_license_activation(self, license_name):
        # If from Terriflux - skip all process
        if self.is_from_terriflux():
            return True
        # Get related license to given name
        license = License.query.filter_by(name=license_name).first()
        if license is None:
            return False
        # Get relation between license and user
        this_license = UserLicences.query.filter_by(
            license=license,
            user=self).first()
        # Check if this relation exists and return its validty
        if this_license is not None:
            return this_license.activated
        return False

    def is_license_valid(self, license_name):
        # Check if this relation exsits and its validity
        expiry = self.get_license_expiry(license_name)
        activated = self.get_license_activation(license_name)
        if (expiry is not None) and (activated):
            if expiry == 'never':
                return True
            cur_time = datetime.now()
            try:
                exp_time = datetime.fromisoformat(expiry)
            except Exception:
                return False
            return (exp_time >= cur_time)
        # Otherwise not valid
        return False

    def get_pwd_reset_token(self):
        """
        Create a random token for password reset

        Returns
        -------
        :return: Timed serialized token
        :rtype: string
        """
        serializer = Serializer(current_app.config['SECRET_KEY'])
        return serializer.dumps(self.id)

    @staticmethod
    def verify_pwd_reset_token(token):
        """
        Verify the validity of given token

        Parameters
        ----------
        :param token: Timed serialized token
        :type token: string

        Optional parameters
        -------------------
        Returns
        -------
        :return: User id that correspond to given token
        :rtype: db.Integer
        """
        serializer = Serializer(current_app.config['SECRET_KEY'])
        try:
            user_id = serializer.loads(token, max_age=900)  # valid for 15min
        except Exception:
            return None
        return User.query.get(user_id)


class UserLicences(db.Model):
    """
    Define the user-license association table

    Parameters
    ----------
    :param db: _description_
    :type db: _type_
    """
    __tablename__ = 'user_licenses'
    # primary keys are required by SQLAlchemy
    id = db.Column(db.Integer(), primary_key=True)
    # Db relation for user - at least one entry is needed + relationship
    user_id = db.Column(
        db.Integer(),
        db.ForeignKey('user.id', ondelete='CASCADE'))
    user = db.relationship('User', back_populates='user_licenses')
    # Db relation for license - at least one entry is needed + relationship
    license_id = db.Column(
        db.Integer(), db.ForeignKey('license.id', ondelete='CASCADE'))
    license = db.relationship('License', back_populates='user_licenses')
    # Db extra entries
    creation = db.Column(db.String(128))
    expiry = db.Column(db.String(128))
    activated = db.Column(db.Boolean)
    stripe_id = db.Column(db.String(1024), unique=True)


class License(db.Model):
    """
    Define the license data model

    Parameters
    ----------
    :param db: _description_
    :type db: _type_
    """
    __tablename__ = 'license'
    # primary keys are required by SQLAlchemy
    id = db.Column(db.Integer(), primary_key=True)
    # Db entries
    name = db.Column(db.String(64), unique=True)
    stripe_id = db.Column(db.String(1024), unique=True)
    # Relationships
    # Cascade - delete entries in UserLicense if this db entry is deleted
    user_licenses = db.relationship(
        'UserLicences',
        back_populates='license',
        cascade="all, delete")
    users = association_proxy('user_licenses', 'user')


def login_required(f):
    """
    Decorator that alow given function f to run if current user is connected

    Parameters
    ----------
    :param f: GET or POST function to run
    :type f: _type_

    Returns
    -------
    :return: HTTP response (text, status)
    :rtype: string, int
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return "Not connected", 401
        return f(*args, **kwargs)
    return decorated_function


def licence_required(license_name=''):
    """
    Decorator that alow given function f to run if current user has given
    license.

    see: https://flask.palletsprojects.com/en/2.1.x/patterns/viewdecorators/

    Parameters
    ----------
    :param f: GET or POST function to run
    :type f: _type_

    Returns
    -------
    :return: HTTP response (text, status)
    :rtype: string, int
    """
    def wrapper(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return "Not connected", 401
            if (not current_user.is_license_valid(license_name)):
                return "No valid license", 401
            return f(*args, **kwargs)
        return decorated_function
    return wrapper


# ---------------------------------------------------------------
def set_licence_subscription(
    license_stripe_id,
    user_license_stripe_id,
    user_license_creation_date
):
    """
    Set what type of license and creation date for a
    user_license corresponding db entry

    Parameters
    ----------
    :param license_stripe_id: Stripe subscription id
    :type license_stripe_id: str

    :param user_license_stripe_id: Stripe checkout id
    :type user_license_stripe_id: str

    :param user_license_creation_date: Creation date in isoformat
    :type user_license_creation_date: str

    Returns
    -------
    :return: (response message, ok)
    :rtype: (str, boolean)
    """
    # Get license
    license = License.query.filter_by(stripe_id=license_stripe_id).first()
    if license is None:
        return "Invalid license id", False

    # Get or create user license
    user_license = UserLicences\
        .query.filter_by(stripe_id=user_license_stripe_id)\
        .first()
    if user_license is None:
        user_license = UserLicences(
            stripe_id=user_license_stripe_id,
            activated=False)

    # Update infos
    user_license.creation = user_license_creation_date
    user_license.license = license

    # Apply modification to database
    db.session.commit()
    return 'OK', True


def set_licence_checkout_completed(
    user_id,
    user_email,
    user_stripe_id,
    user_license_stripe_id
):
    """
    Create a license at checkout for given user

    Parameters
    ----------
    :param user_id: _description_
    :type user_id: _type_

    :param user_email: _description_
    :type user_email: _type_

    :param user_stripe_id: _description_
    :type user_stripe_id: _type_

    :param user_license_stripe_id: _description_
    :type user_license_stripe_id: _type_

    Optional parameters
    -------------------
    Returns
    -------
    :return: _description_
    :rtype: _type_
    """
    # Get subcription license
    user_license = UserLicences\
        .query.filter_by(stripe_id=user_license_stripe_id)\
        .first()
    if (user_license is None):
        user_license = UserLicences(
            stripe_id=user_license_stripe_id)

    # Get user
    user = User.query.get(user_id)
    if user is None:
        return "Invalid user id", False
    if (user.email != user_email):
        return "Invalid user email", False

    # Update infos
    user.stripe_id = user_stripe_id
    user_license.user = user
    user_license.activated = True

    # Apply modification to database
    db.session.commit()
    return 'OK', True


def set_or_update_licence_subscription(
    user_license_stripe_id,
    user_license_expiry
):
    """
    Triggered for subscription update event

    Parameters
    ----------
    :param user_license_stripe_id: _description_
    :type user_license_stripe_id: _type_

    :param user_license_expiry: _description_
    :type user_license_expiry: _type_

    Optional parameters
    -------------------
    Returns
    -------
    :return: _description_
    :rtype: _type_
    """
    # Get subcription license
    user_license = UserLicences\
        .query.filter_by(stripe_id=user_license_stripe_id)\
        .first()
    if (user_license is None):
        return "Invalid subscription id", False

    # Update infos
    user_license.expiry = user_license_expiry

    # Apply modification to database
    db.session.commit()
    return 'OK', True


@connected_user.route('/user/infos')
@login_required
def user_infos():
    '''
    HTTP GET request to get user's infos

    Output JSON response
    - 'email' (String) : User's email
    - 'firstname' (String) : User's firstname
    - 'name' (String) : User's name
    - 'license_legacy_opensankeyplus' (String) : License number for OpenSankey+
    - 'license_legacy_sankeysuite' (String) : License number for SankeySuite
    - 'license_opensankeyplus_validity' (boolean): Is license valid ?
    - 'license_opensankeyplus_expiry' (String): Expiration date for license
    '''
    # Prepare response
    response = {
        'email': current_user.email,
        'name': current_user.name,
        'firstname': current_user.firstname,
        'license_legacy_opensankeyplus': current_user.license_opensankeyplus,
        'license_legacy_sankeysuite': current_user.license_sankeysuite,
        'license_opensankeyplus_validity': current_user.is_license_valid('opensankeyplus'),
        'license_opensankeyplus_expiry': current_user.get_license_expiry('opensankeyplus')
    }
    # Send back response
    return jsonify(response)


@connected_user.route('/user/infos/license_expiry/<license_name>')
@login_required
def get_license_expiry(license_name):
    expiry = current_user.get_license_expiry(license_name)
    if expiry is None:
        return 'No license', 401
    return expiry, 200


@connected_user.route('/user/infos/license_validity/<license_name>')
@licence_required(license_name='<license_name>')
def get_license_validity(license_name):
    return "OK", 200


@connected_user.route('/user/infos/modify/email', methods=['POST'])
@login_required
def modify_email():
    '''
    HTTP Post request to change email of current user

    Input JSON Request
    - 'email' (String) : User's current email
    - 'new_email' (String) : User's new email
    - 'password' (String) : User's password for confirmation
    '''
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


@connected_user.route('/user/infos/modify/firstname', methods=['POST'])
@login_required
def modify_firstname():
    '''
    HTTP Post request to change firstname of current user

    Input JSON Request
    - 'firstname' (String) : User's new firstname
    '''
    # Apply modif
    current_user.firstname =  request.json.get('firstname')
    db.session.commit()
    return 'ok', 200


@connected_user.route('/user/infos/modify/lastname', methods=['POST'])
@login_required
def modify_lastname():
    '''
    HTTP Post request to change lastname of current user

    Input JSON Request
    - 'lastname' (String) : User's new lastname
    '''
    # Apply modif
    current_user.name =  request.json.get('lastname')
    db.session.commit()
    return 'ok', 200


@connected_user.route('/user/infos/license_opensankeyplus')
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


@connected_user.route('/user/infos/license_opensankeyplus', methods=['POST'])
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


@connected_user.route('/user/infos/license_sankeysuite')
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


@connected_user.route('/user/infos/license_sankeysuite', methods=['POST'])
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


@connected_user.route('/user/infos/is_developer')
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
