# coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de création : 25/01/2023

# ---------------------------------------------------------------
# External imports
import os
import requests
import time
import hashlib

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

    def get_license_expiry(self):
        """
        Return expiry date in ISO format or specific keyword

        Returns
        -------
        :return: Expiry date
        :rtype: str | None
        """
        # By default, expiry is None
        expiry = None
        # Check all licenses
        for user_license in self.user_licenses:
            # License is None
            if user_license is None:
                continue
            # Expiry is not set
            if user_license.expiry is None:
                continue
            # Expiry is set to never
            if user_license.expiry == 'never':
                return 'never'
            # Save expiry date
            if expiry is None:
                expiry = user_license.expiry
                continue
            # Otherwise keep max expiry date
            expiry = max(
                datetime.fromisoformat(expiry),
                datetime.fromisoformat(user_license.expiry))\
                .isoformat()
        # Return
        return expiry

    def has_valid_license(self):
        """
        Check if license is valid = active & not expired

        Returns
        -------
        :return: True if user has at least one valid license
        :rtype: boolean
        """
        # By default, license is not OK
        ok_license = False
        # Check all licenses
        for user_license in self.user_licenses:
            # License is None
            if user_license is None:
                continue
            # Check expiration
            ok_expiry = False
            if (user_license.expiry is not None):
                if (user_license.expiry == 'never'):
                    ok_expiry = True
                else:
                    cur_time = datetime.now()
                    try:
                        exp_time = datetime.fromisoformat(user_license.expiry)
                        ok_expiry = (exp_time >= cur_time)
                    except Exception as e:
                        print('Error - has_valid_license - {}'.format(e))
            # Ok if activated and not expired
            if (ok_expiry and user_license.activated):
                ok_license = True
                break
        return ok_license

    def replace_legacy_opensankeyplus_license(self):
        """
        TODO _summary_
        """
        if (self.license_opensankeyplus is not None):
            req_dict = {
                'edd_action': 'check_license',
                'license': self.license_opensankeyplus,  # License key
                'item_name': "OpenSankey+",  # Product ID
                'url': 'open-sankey.fr'  # Domain the request is coming from.
            }
            # Send POST request
            res = requests.post(
                'https://terriflux.com/edd-sl/',
                req_dict).json()
            # If valid set license
            if (res['success'] is True) and (res['license'] == 'valid'):
                # Get corrsponding new license
                license = License.query\
                    .filter_by(name='opensankeyplus_legacy')\
                    .first()
                if (license is None):
                    license = License(name='opensankeyplus_legacy')
                    db.session.add(license)
                # Check if user have license
                if (license not in self.licenses):
                    expiry = (
                        'never'
                        if (res['expires'] == 'lifetime')
                        else datetime
                        .fromisoformat(res['expires'])
                        .isoformat())
                    user_license = UserLicences(
                        license=license,
                        user=self,
                        creation=datetime.now(),
                        activated=True,
                        expiry=expiry)
                    db.session.add(user_license)
                # Remove legacy license
                self.license_opensankeyplus = None
                db.session.commit()

    def replace_legacy_sankeysuite_license(self):
        """
        TODO _summary_
        """
        if (self.license_sankeysuite is not None):
            req_dict = {
                'edd_action': 'check_license',
                'license': self.license_sankeysuite,  # License key
                'item_name': "SankeySuite",  # Product ID
                'url': 'open-sankey.fr'  # Domain the request is coming from.
            }
            # Send POST request
            res = requests.post(
                'https://terriflux.com/edd-sl/',
                req_dict).json()
            # If valid set license
            if (res['success'] is True) and (res['license'] == 'valid'):
                # Get corrsponding new license
                license = License.query\
                    .filter_by(name='sankeysuite_legacy')\
                    .first()
                if (license is None):
                    license = License(name='sankeysuite_legacy')
                    db.session.add(license)
                # Check if user have license
                if (license not in self.licenses):
                    expiry = (
                        'never'
                        if (res['expires'] == 'lifetime')
                        else datetime
                        .fromisoformat(res['expires'])
                        .isoformat())
                    user_license = UserLicences(
                        license=license,
                        user=self,
                        creation=datetime.now(),
                        activated=True,
                        expiry=expiry)
                    db.session.add(user_license)
                # Remove legacy license
                self.license_sankeysuite = None
                db.session.commit()

    def replace_developper_token(self):
        """
        """
        if (self.is_developer is not None):
            # Get corrsponding new license
            license = License.query\
                .filter_by(name='terriflux')\
                .first()
            if (license is None):
                license = License(name='terriflux')
                db.session.add(license)
            # Check if user have license
            if (license not in self.licenses):
                user_license = UserLicences(
                    license=license,
                    user=self,
                    creation=datetime.now(),
                    activated=True,
                    expiry='never')
                db.session.add(user_license)
            # Remove legacy license
            self.is_developer = None
            db.session.commit()

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


class Metrics(db.Model):
    """
    Define the site metrics model

    Parameters
    ----------
    :param db: _description_
    :type db: _type_
    """
    __tablename__ = 'metrics'
    # primary keys are required by SQLAlchemy
    id = db.Column(db.String(64), primary_key=True)
    nb_visits = db.Column(db.Integer())
    last_visit = db.Column(db.Integer())

    def new_visit(self):
        epoch = int(time.time()/(24*60*60)) - int(os.environ['REF_EPOCH'])
        if (epoch != self.last_visit):
            # Increase number of visits for given id
            if self.nb_visits:
                self.nb_visits = self.nb_visits + 1
            else:
                self.nb_visits = 1
            # Update last visits time
            self.last_visit = epoch


# ---------------------------------------------------------------
# Define decorators

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


def license_required(f):
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
        if (not current_user.has_valid_license()):
            return "No valid license", 401
        return f(*args, **kwargs)
    return decorated_function


# ---------------------------------------------------------------
# Functions

def update_metrics(ip: str):
    """
    Update metrics table

    Parameters
    ----------
    :param ip: Ip of visitor
    :type ip: str

    Optional parameters
    -------------------
    """
    id = hashlib.sha256(ip.encode()).hexdigest()
    metric = Metrics.query.filter_by(id=id).first()
    if metric is None:
        metric = Metrics(id=id)
        db.session.add(metric)
    metric.new_visit()
    db.session.commit()


def create_user_from_stripe(
    user_email: str,
    user_firstname: str,
    user_lastname: str,
    user_stripe_id: str,
):
    """
    Create user if needed from stripe infos

    Parameters
    ----------
    :param user_email: User email
    :type user_email: str

    :param user_stripe_id: Stripe customer id
    :type user_stripe_id: str

    Returns
    -------
    :return: (response message, ok)
    :rtype: (str, boolean)
    """
    # Get user related to mail
    user_by_email = User.query\
        .filter_by(email=user_email)\
        .first()

    # Get user related to stripe id
    user_by_stripe_id = User.query\
        .filter_by(stripe_id=user_stripe_id)\
        .first()

    # Case 1 : no email related user nor stripe related customer
    if (user_by_email is None) and (user_by_stripe_id is None):
        User(
            email=user_email,
            firstname=user_firstname,
            name=user_lastname,
            creation=datetime.now().isoformat(),
            stripe_id=user_stripe_id)
        db.session.commit()
    # Case 2 : Got email related user but no stripe related customer
    elif (user_by_email is not None) and (user_by_stripe_id is None):
        user_by_email.stripe_id = user_stripe_id
        db.session.commit()

    # Return
    return 'ok', True


def delete_user_from_stripe(
    user_email: str,
    user_stripe_id: str,
):
    """
    _summary_

    Parameters
    ----------
    :param user_email: email of user
    :type user_email: str

    :param user_stripe_id: stripe id of user
    :type user_stripe_id: str

    Returns
    -------
    :return: (response message, ok)
    :rtype: (str, boolean)
    """
    # Get user related to mail
    user = User.query\
        .filter_by(email=user_email, stripe_id=user_stripe_id)\
        .first()

    # Update user if it exists
    if user is not None:
        # Remove related id
        user.stripe_id = None
        # Remove stripe related licenses
        for user_license in user.user_licenses:
            if user_license.license.stripe_id is not None:
                user_license.delete()
        # Commit
        db.session.commit()

    # Return
    return 'ok', True


def create_license_from_stripe(
    license_name: str,
    license_stripe_id: str
):
    """
    Create license entry in db

    Parameters
    ----------
    :param license_name: Name of license
    :type license_name: str

    :param license_stripe_id: Stripe id of license
    :type license_stripe_id: str

    Returns
    -------
    :return: (response message, ok)
    :rtype: (str, boolean)
    """
    # Get license related to stripe id
    license = License.query\
        .filter_by(stripe_id=license_stripe_id)\
        .first()

    # If no license, create
    if (license is None):
        license = License(
            name=license_name,
            stripe_id=license_stripe_id)
        db.session.add(license)
        db.session.commit()

    # Return
    return 'ok', True


def update_license_name_from_stripe(
    license_name: str,
    license_stripe_id: str
):
    """
    Update license entry in db

    Parameters
    ----------
    :param license_name: Name of license
    :type license_name: str

    :param license_stripe_id: Stripe id of license
    :type license_stripe_id: str

    Returns
    -------
    :return: (response message, ok)
    :rtype: (str, boolean)
    """
    # Get license related to stripe id
    license = License.query\
        .filter_by(stripe_id=license_stripe_id)\
        .first()

    # If no license, error
    if (license is None):
        return 'no_matching_id', False

    # Update
    license.name = license_name
    db.session.commit()

    # Return
    return 'ok', True


def delete_license_from_stripe(
    license_stripe_id: str
):
    """
    Delete license from stripe

    Parameters
    ----------
    :param license_stripe_id: _description_
    :type license_stripe_id: str
    """
    # Get license related to stripe id
    license = License.query\
        .filter_by(stripe_id=license_stripe_id)\
        .first()

    # If no license, error
    if (license is None):
        return 'no_matching_id', False

    # Delete license
    license.delete()

    # Return
    return 'ok', True


def create_user_license_subscription(
    license_stripe_id,
    user_license_stripe_id,
    user_license_creation_date,
    user_license_expiry,
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
    license = License.query\
        .filter_by(stripe_id=license_stripe_id)\
        .first()
    if license is None:
        license = License(
            name='unknown_{}'.format(license_stripe_id),
            stripe_id=license_stripe_id)
        db.session.add(license)

    # Get or create user license
    user_license = UserLicences.query\
        .filter_by(stripe_id=user_license_stripe_id)\
        .first()
    if user_license is None:
        user_license = UserLicences(
            stripe_id=user_license_stripe_id,
            activated=False)
        db.session.add(user_license)

    # Update infos
    user_license.creation = user_license_creation_date
    user_license.license = license
    user_license.expiry = user_license_expiry

    # Apply modification to database
    db.session.commit()

    # Return
    return 'ok', True


def update_user_license_subscription(
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

    Returns
    -------
    :return: (response message, ok)
    :rtype: (str, boolean)
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
    return 'ok', True


def delete_user_license_subscription(
    user_license_stripe_id
):
    """
    Triggered for subscription deletion event

    Parameters
    ----------
    :param user_license_stripe_id: _description_
    :type user_license_stripe_id: _type_

    Returns
    -------
    :return: (response message, ok)
    :rtype: (str, boolean)
    """
    # Get subcription license
    user_license = UserLicences\
        .query.filter_by(stripe_id=user_license_stripe_id)\
        .first()
    if (user_license is None):
        return "Invalid subscription id", False

    # Update infos
    user_license.delete()

    # Apply modification to database
    db.session.commit()
    return 'ok', True


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
    # Get user
    user = User.query\
        .filter_by(
            id=user_id,
            email=user_email)\
        .first()
    if user is None:
        return "Invalid user", False

    # Get subcription license
    user_license = UserLicences.query\
        .filter_by(stripe_id=user_license_stripe_id)\
        .first()
    if (user_license is None):
        user_license = UserLicences(
            creation=datetime.now().isoformat(),
            stripe_id=user_license_stripe_id)
        db.session.add(user_license)

    # Update infos
    user.stripe_id = user_stripe_id
    user_license.user = user
    user_license.activated = True

    # Apply modification to database
    db.session.commit()
    return 'ok', True


def set_license_invoice_created(
    user_email,
    user_stripe_id,
    license_stripe_id,
    user_license_stripe_id
):
    # Get user
    # - Matching email & stripe id
    user = User.query\
        .filter_by(
            email=user_email,
            stripe_id=user_stripe_id)\
        .first()
    # - Then priority on matching stripe id
    if user is None:
        user = User.query\
            .filter_by(
                stripe_id=user_stripe_id)\
            .first()
    # - Or get user via email and set stripe id
    if user is None:
        user = User.query\
            .filter_by(
                email=user_email)\
            .first()
        if user is not None:
            user.stripe_id = user_stripe_id
    if user is None:
        return "Could not find related user", False

    # Get license
    license = License.query\
        .filter_by(
            stripe_id=license_stripe_id)\
        .first()
    if license is None:
        return "Could not find related license", False

    # Get subcription license
    user_license = UserLicences.query\
        .filter_by(stripe_id=user_license_stripe_id)\
        .first()
    if (user_license is None):
        user_license = UserLicences(
            creation=datetime.now().isoformat(),
            stripe_id=user_license_stripe_id)
        db.session.add(user_license)

    # Update infos
    user_license.user = user
    user_license.license = license

    # Apply modification to database
    db.session.commit()
    return 'ok', True


def set_licence_invoice_paid(
    user_stripe_id: str,
    license_stripe_id: str,
    user_license_stripe_id: str
):
    """
    Create a license at checkout for given user

    Parameters
    ----------
    :param user_stripe_id: _description_
    :type user_stripe_id: str

    :param license_stripe_id: _description_
    :type license_stripe_id: str

    :param user_license_stripe_id: _description_
    :type user_license_stripe_id: str

    Optional parameters
    -------------------
    :param user_license_expiry: _description_
    :type user_license_expiry: str, optional (defaults to 'never')

    Returns
    -------
    :return: _description_
    :rtype: _type_
    """
    # Get user
    user = User.query\
        .filter_by(stripe_id=user_stripe_id)\
        .first()
    if user is None:
        return "No user found for invoice", False

    # Get related license
    license = License.query\
        .filter_by(stripe_id=license_stripe_id)\
        .first()
    if license is None:
        return "No license found for invoice", False

    # Get subcription license
    user_license = UserLicences.query\
        .filter_by(
            user=user,
            license=license,
            stripe_id=user_license_stripe_id)\
        .first()
    if (user_license is None):
        return "Invalid invoice id for user and license", False

    # Update infos
    user_license.activated = True
    if user_license.expiry is None:
        user_license.expiry = 'never'

    # Apply modification to database
    db.session.commit()
    return 'ok', True
