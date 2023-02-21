# coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de création : 25/01/2023

# Flask imports
from flask import Blueprint
from flask import request
from flask import jsonify
from flask_login import login_user
from flask_login import logout_user
from flask_login import login_required
from flask_cors import cross_origin

# System imports
from werkzeug.security import generate_password_hash
from werkzeug.security import check_password_hash

# Local imports
from . import db
from .models import User

# Create auth blue print
auth = Blueprint('auth', __name__)


# @auth.route('/login')
# def login():
#     '''
#     Display login page
#     '''
#     return 'Login'


@auth.route('/auth/login', methods=['POST'])
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
    response = {
        'is_connected': False,
        'message': ' '
        # if the user doesn't exist or password is wrong, reload the page
    }

    # Check if the user actually exists
    # Take the user-supplied password, hash it, and compare it to the hashed password in the database
    if not user or not check_password_hash(user.password, password):
        response['message'] = 'Please check your login details and try again.'
        return jsonify(response)

    # if the above check passes, then we know the user has the right credentials
    login_user(user, remember=remember)
    response['is_connected'] = True
    return jsonify(response)


@auth.route('/auth/signup', methods=['POST'])
@cross_origin(supports_credentials=True)
def signup_post():
    '''
    HTTP POST request for user registering in database

    Input JSON request
    - 'email' (String) : user's email
    - 'password' (String) : user's account password
    - 'firstname' (String) : user's firstname
    - 'lastname' (String) : user's lastname
    - 'license_key' (String) : user's license key for application

    Output JSON response
    - 'is_registered' (Boolean) : True if registration succeeded
    - 'message' (String) : Error / Success message if needed
    '''
    # Read request
    email = request.json.get('email')
    password = request.json.get('password')
    firstname = request.json.get('firstname')
    lastname = request.json.get('lastname')
    license_key = request.json.get('license_key')

    # Prepare response
    response = {
        'is_registered': False,
        'message': ''
    }

    # if this returns a user, then the email already exists in database
    user = User.query.filter_by(email=email).first()

    if user:  # if a user is found, we want to redirect back to signup page so user can try again
        response['message'] = 'Email address already exists'
        return jsonify(response)

    # create a new user with the form data. Hash the password so the plaintext version isn't saved.
    new_user = User(
        email=email,
        password=generate_password_hash(password, method='sha256'),
        firstname=firstname,
        name=lastname,
        license=license_key)

    # add the new user to the database
    db.session.add(new_user)
    db.session.commit()

    response['is_registered'] = True
    return jsonify(response)


@auth.route('/auth/logout')
@login_required
def logout():
    '''
    HTTP GET request to logout user

    Output Boolean (always true)
    '''
    logout_user()  # Log out and clean rememberme cookie.
    return True
