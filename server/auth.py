# coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de création : 25/01/2023

# ---------------------------------------------------------------
# System imports
import requests
from datetime import datetime

# Flask imports
from flask import Blueprint
from flask import current_app
from flask import jsonify
from flask import request
from flask import Response
from flask_cors import cross_origin
from flask_login import current_user
from flask_login import login_user
from flask_login import LoginManager
from flask_login import logout_user

# Werkzeug
from werkzeug.security import generate_password_hash
from werkzeug.security import check_password_hash

# Itsdangerous - serialize URLs for secured API transactions
from itsdangerous import URLSafeTimedSerializer as Serializer

# ---------------------------------------------------------------
# Local imports
from .mailing import send_account_confirm_mail
from .mailing import send_welcome_mail
from .mailing import send_pw_reset_email
from .mailing import is_email_valid
from .models import User
from .models import login_required
from .models import licence_required
from .models import db

# ---------------------------------------------------------------
# Create auth blue print

domain_url = 'http://localhost:3000/#/'  # TODO use OS.environ

auth_blueprint = Blueprint('auth_blueprint', __name__)
login_manager = LoginManager()


# ---------------------------------------------------------------
# Define specific functions

def init_logging_manager(app):
    """
    Init logging manager

    Parameters
    ----------
    :param app: _description_
    :type app: _type_

    Optional parameters
    -------------------
    """
    login_manager.login_view = 'auth_blueprint.login_post'
    login_manager.init_app(app)


# ---------------------------------------------------------------
# Define all routes

@login_manager.user_loader
def load_user(user_id):
    # since the user_id is just the primary key of our user table,
    # use it in the query for the user
    return User.query.get(int(user_id))


@auth_blueprint.route('/auth/signup/create', methods=['POST'])
@cross_origin(supports_credentials=True)
def signup_post():
    '''
    HTTP POST request for user registering in database

    Input JSON request
    - 'email' (String) : user's email
    - 'password' (String) : user's account password
    - 'firstname' (String) : user's firstname
    - 'lastname' (String) : user's lastname
    - 'lang' (String) : App language

    Output JSON response
    - 'is_registered' (Boolean) : True if registration succeeded
    - 'message' (String) : Error / Success message if needed
    '''
    # Read request
    user_infos = request.get_json()

    # Prepare response
    response = {
        'message': 'ok'
    }

    # Check if email is valid
    if not is_email_valid(user_infos['email']):
        response['message'] = 'err_email_invalid'
        return jsonify(response), 200

    # if this returns a user, then the email already exists in database
    user = User.query.filter_by(email=user_infos['email']).first()
    if user:
        # if a user is found, we want to redirect back to signup page
        # so user can try again
        response['message'] = 'err_email_exists'
        return jsonify(response), 200

    # Create validation token
    serializer = Serializer(current_app.config['SECRET_KEY'])
    token = serializer.dumps(user_infos)

    # Send confirm mail
    try:
        send_account_confirm_mail(
            user_infos,
            domain_url + 'register?t={}'.format(token))
    except Exception as e:
        return 'Error on send confirm mail : ' + e, 500

    # Return response
    return jsonify(response), 200


@auth_blueprint.route('/auth/signup/check_captcha', methods=['POST'])
def check_captcha():
    token = request.json.get('token')
    res = requests.post('https://www.google.com/recaptcha/api/siteverify?secret=6Les5JwmAAAAAK2qIlZsNkiEKsvHLmPoK1JiQcOD&response='+token)  # noqa
    return res.json(), res.status_code


@auth_blueprint.route('/auth/signup/confirm', methods=['POST'])
def signup_confirm():
    # Prepare response
    response = {'message': 'ok'}

    # Retrieve user infos
    try:
        token = request.json.get('token')
        serializer = Serializer(current_app.config['SECRET_KEY'])
        user_infos = serializer.loads(token, max_age=900)  # valid for 15min
    except Exception:
        response['message'] = 'token_invalid'
        return 'token_invalid', 400

    # Check if email is valid
    if not is_email_valid(user_infos['email']):
        return jsonify(response), 400

    # if this returns a user, then the email already exists in database
    existing_user = User.query.filter_by(email=user_infos['email']).first()
    if existing_user:
        response['message'] = 'account_already_created'
        return jsonify(response), 200

    # create a new user with the form data. Hash the password so the plaintext
    # version isn't saved.
    new_user = User(
        email=user_infos['email'],
        password=generate_password_hash(
            user_infos['password'],
            method='sha256'),
        firstname=user_infos['firstname'],
        name=user_infos['lastname'])

    # add the new user to the database
    db.session.add(new_user)
    db.session.commit()

    # Send welcome mail
    send_welcome_mail(
        new_user,
        user_infos['lang'])

    # Log new_user in order to pursuit checkout
    login_user(new_user)

    # Return response
    return jsonify(response), 200


@auth_blueprint.route('/auth/login', methods=['POST'])
def login_post():
    '''
    HTTP POST request to check if credentials are valid

    Input JSON request
    - 'email' (String) : user's email
    - 'password' (String) : user's account password
    - 'remember' (None) : if exists, then create a "remember me" cookie

    Output JSON response
    - 'is_connected' (Boolean) : True if connection succeeded
    - 'message' (String) : Error / Success message if needed
    '''
    # Read request
    email = request.json.get('email')
    password = request.json.get('password')
    remember = True if request.json.get('remember') else False

    # Get user id from mail
    user = User.query.filter_by(email=email).first()

    # Prepare response
    response = {'message': 'ok'}

    # Check if the user actually exists
    # Take the user-supplied password, hash it, and compare it to
    # the hashed password in the database
    if not user or not check_password_hash(user.password, password):
        response['message'] = 'err_login'
        return jsonify(response), 200

    # if the above check passes,
    # then we know the user has the right credentials
    login_user(user, remember=remember)

    # Clear secret token if needed
    if (
        (user.secret_token is not None) and
        (user.secret_expiry is not None)
    ):
        date_expiry = datetime.fromisoformat(user.secret_expiry)
        date_now = datetime.now()
        if (date_expiry < date_now):
            user.secret_token = None
            user.secret_expiry = None
            db.session.commit()

    # Return
    return jsonify(response), 200


@auth_blueprint.route('/auth/logout')
@login_required
def logout():
    '''
    HTTP GET request to logout user

    Output Boolean (always true)
    '''
    logout_user()  # Log out and clean rememberme cookie.
    return 'ok', 200


@auth_blueprint.route('/auth/connected')
@login_required
def is_connected():
    return 'ok', 200


@auth_blueprint.route('/auth/license/<license_name>')
@licence_required
def has_license(license_name):
    return 'ok : {}'.format(license_name), 200


@auth_blueprint.route('/auth/forgot_pw', methods=['POST'])
def forgot():
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
    # Reponse type
    response = {}
    response['user_exists'] = False
    response['user_is_authenticated'] = False
    # Protection - Check fist if user is currently authentificated
    if current_user.is_authenticated:
        response['user_exists'] = True
        response['user_is_authenticated'] = True
    # Verify email - if OK create reseting url
    else:
        try:
            email = request.json.get('email')
            if is_email_valid(email):
                user = User.query.filter_by(email=email).first()
                if (user is not None):
                    response['user_exists'] = True
                    send_pw_reset_email(user, request.json.get("lang"))
        except Exception as excpt:
            response = Response(
                response='forgot_pw : ' + str(excpt),
                status=500)
            return response
    # Return
    return jsonify(response), 200


@auth_blueprint.route('/auth/reset_pw/<token>', methods=['POST'])
def reset(token):
    """
    Reset password for user if token match

    Parameters
    ----------
    :param token: _description_
    :type token: _type_

    Optional parameters
    -------------------
    Returns
    -------
    :return: _description_
    :rtype: _type_
    """
    # Reponse type
    response = {}
    response['passwd_is_updated'] = False
    response['user_is_authenticated'] = False
    # Check fist if user is currently authentificated
    if current_user.is_authenticated:
        response['user_is_authenticated'] = True
    # Verify token
    else:
        try:
            user = User.verify_pwd_reset_token(token)
            if user is not None:
                user.password = generate_password_hash(
                    request.json.get('password'),
                    method='sha256')
                db.session.commit()
                response['passwd_is_updated'] = True
        except Exception as excpt:
            response = Response(
                response='reset_pw : ' + str(excpt).replace(token, '<token>'),
                status=500)
            return response
    # Return
    return jsonify(response), 200
