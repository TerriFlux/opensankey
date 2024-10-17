# coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de création : 25/01/2023

# ---------------------------------------------------------------
# External imports

# System
from datetime import datetime
from functools import wraps

# Flask imports
from flask import Blueprint
from flask import current_app

# Flask_login imports
from flask_login import current_user
from flask_login import UserMixin

# SQLAlchemy
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.associationproxy import association_proxy

# Itsdangerous - serialize URLs for secured API transactions
from itsdangerous import URLSafeTimedSerializer as Serializer

# ---------------------------------------------------------------
# Local imports

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
    # Security token
    secret_token = db.Column(db.String(64))
    secret_expiry = db.Column(db.String(128))
    # Relationships
    # Cascade - delete entries in UserLicense if this db entry is deleted
    user_licenses = db.relationship(
        'UserLicences',
        back_populates='user',
        cascade="all, delete")
    licenses = association_proxy('user_licenses', 'license')

    def delete(self):
        """
        Delete self for db

        Returns
        -------
        :return: _description_
        :rtype: _type_
        """
        for user_license in self.user_licenses:
            user_license.delete()
        db.session.delete(self)
        db.session.commit()

    def get_license(self, license_name):
        """
        Get user license object by its name

        Parameters
        ----------
        :param license_name: _description_
        :type license_name: _type_

        Optional parameters
        -------------------
        Returns
        -------
        :return: _description_
        :rtype: _type_
        """
        # Get related license to given name
        license = License.query.filter_by(name=license_name).first()
        if license is None:
            return None
        # Get relation between license and user
        return UserLicences.query.filter_by(
            license=license,
            user=self).first()

    def is_from_terriflux(self):
        """
        Return true if user has terriflux license

        Returns
        -------
        :rtype: boolean
        """
        # Get related license to terriflux
        this_license = self.get_license('terriflux')
        # Check if user is related to this specific license
        return (this_license is not None)

    def get_license_expiry(self, license_name):
        """
        Return expiry date in ISO format or specific keyword

        Parameters
        ----------
        :param license_name: Name of the license to check
        :type license_name: str

        Returns
        -------
        :return: Expiry date
        :rtype: str
        """
        # If from Terriflux - skip all process
        if self.is_from_terriflux():
            return 'never'
        # Get related license to given name
        this_license = self.get_license(license_name)
        # Check if this relation exists and return its validty
        if this_license is not None:
            return this_license.expiry
        # Otherwise return None
        return None

    def get_license_activation(self, license_name):
        """
        Check if license is active

        Parameters
        ----------
        :param license_name: Name of the license to check
        :type license_name: str

        Returns
        -------
        :return: True if license is active
        :rtype: bool
        """
        # If from Terriflux - skip all process
        if self.is_from_terriflux():
            return True
        # Get related license to given name
        this_license = self.get_license(license_name)
        # Check if this relation exists and return its validty
        if this_license is not None:
            return this_license.activated
        return False

    def is_license_valid(self, license_name):
        """
        Check if license is valid = active & not expired

        Parameters
        ----------
        :param license_name: license name to check
        :type license_name: str

        Returns
        -------
        :return: True is license is valid
        :rtype: boolean
        """
        # Check if this relation exists and its validity
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

    def delete(self):
        """
        Delete self for db

        Returns
        -------
        :return: _description_
        :rtype: _type_
        """
        db.session.delete(self)
        db.session.commit()


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


def licence_required(f):
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
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return "Not connected", 401
        if ('license_name' not in kwargs):
            return "License name is missing", 500
        if (not current_user.is_license_valid(kwargs['license_name'])):
            return "No valid license", 401
        return f(*args, **kwargs)
    return decorated_function


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
