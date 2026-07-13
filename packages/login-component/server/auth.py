# coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de création : 25/01/2023

# ---------------------------------------------------------------
# System imports
from datetime import datetime

# Flask imports
from flask import Blueprint
from flask import jsonify
from flask import request
from flask import Response
from flask_cors import cross_origin
from flask_login import current_user
from flask_login import login_user
from flask_login import logout_user
from flask_login import LoginManager

# Werkzeug
from werkzeug.security import check_password_hash

# SQLAlchemy
from sqlalchemy import func

from .mailing import send_welcome_mail
from .mailing import send_pw_reset_email
from .mailing import is_email_valid
from .models import User
from .models import login_required
from .models import db
from .models import touch_last_seen
from .models import hash_password
from .models import password_needs_rehash
from .models import validate_password

# ---------------------------------------------------------------
# Create auth blue print

auth_blueprint = Blueprint("auth_blueprint", __name__)
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
    login_manager.login_view = "auth_blueprint.login_post"
    login_manager.init_app(app)


# ---------------------------------------------------------------
# Define all routes


@login_manager.user_loader
def load_user(user_id):
    # since the user_id is just the primary key of our user table,
    # use it in the query for the user
    return User.query.get(int(user_id))


@auth_blueprint.route("/auth/signup/create", methods=["POST"])
@cross_origin(supports_credentials=True)
def signup_post():
    """
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
    """
    # Read request
    user_infos = request.get_json()

    # Prepare response
    response = {"message": "ok"}

    # Check if email is valid
    if not is_email_valid(user_infos["email"]):
        response["message"] = "err_email_invalid"
        return jsonify(response), 200

    # if this returns a user, then the email already exists in database
    existing_user = User.query.filter_by(email=user_infos["email"]).first()
    if existing_user:
        response["message"] = "account_already_created"
        return jsonify(response), 200

    # Check password policy (server-side)
    if not validate_password(user_infos.get("password")):
        response["message"] = "err_password_invalid"
        return jsonify(response), 200

    # create a new user with the form data. Hash the password so the plaintext
    # version isn't saved. On persiste l'UTM d'origine (utm_campaign) transmis
    # par le site, pour l'attribution des essais/conversions.
    utm_campaign = user_infos.get("utm_campaign")
    if isinstance(utm_campaign, str):
        utm_campaign = utm_campaign[:256]
    else:
        utm_campaign = None
    new_user = User(
        email=user_infos["email"].lower(),
        password=hash_password(user_infos["password"]),
        firstname=user_infos["firstname"],
        name=user_infos["lastname"],
        creation=datetime.now().isoformat(),
        utm_campaign=utm_campaign,
    )

    # add the new user to the database
    db.session.add(new_user)
    db.session.commit()

    # Send welcome mail
    try:
        send_welcome_mail(new_user, user_infos["lang"])
    except Exception as excpt:  # noqa
        print("send_welcome_mail error : " + str(excpt))

    # Log new_user in order to pursuit checkout
    login_user(new_user)

    # Return response
    return jsonify(response), 200


# @auth_blueprint.route("/auth/signup/check_captcha", methods=["POST"])
# def check_captcha():
#     token = request.json.get("token")
#     res = requests.post(
#         "https://www.google.com/recaptcha/api/siteverify?secret=6Les5JwmAAAAAK2qIlZsNkiEKsvHLmPoK1JiQcOD&response="
#         + token
#     )  # noqa
#     return res.json(), res.status_code


# @auth_blueprint.route("/auth/signup/confirm", methods=["POST"])
# def signup_confirm():
#     # Prepare response
#     response = {"message": "ok"}

#     # Retrieve user infos
#     try:
#         token = request.json.get("token")
#         serializer = Serializer(current_app.config["SECRET_KEY"])
#         user_infos = serializer.loads(token, max_age=900)  # valid for 15min
#     except Exception:
#         response["message"] = "token_invalid"
#         return "token_invalid", 400

#     # Check if email is valid
#     if not is_email_valid(user_infos["email"]):
#         return jsonify(response), 400

#     # if this returns a user, then the email already exists in database
#     existing_user = User.query.filter_by(email=user_infos["email"]).first()
#     if existing_user:
#         response["message"] = "account_already_created"
#         return jsonify(response), 200

#     # create a new user with the form data. Hash the password so the plaintext
#     # version isn't saved.
#     new_user = User(
#         email=user_infos["email"].lower(),
#         password=generate_password_hash(user_infos["password"], method="sha256"),
#         firstname=user_infos["firstname"],
#         name=user_infos["lastname"],
#         creation=datetime.now().isoformat(),
#     )

#     # add the new user to the database
#     db.session.add(new_user)
#     db.session.commit()

#     # Send welcome mail
#     send_welcome_mail(new_user, user_infos["lang"])

#     # Log new_user in order to pursuit checkout
#     login_user(new_user)

#     # Return response
#     return jsonify(response), 200


@auth_blueprint.route("/auth/login", methods=["POST"])
def login_post():
    """
    HTTP POST request to check if credentials are valid

    Input JSON request
    - 'email' (String) : user's email
    - 'password' (String) : user's account password
    - 'remember' (None) : if exists, then create a "remember me" cookie

    Output JSON response
    - 'is_connected' (Boolean) : True if connection succeeded
    - 'message' (String) : Error / Success message if needed
    """
    # Read request
    email = request.json.get("email")
    password = request.json.get("password")
    remember = True if request.json.get("remember") else False

    # Get user id from mail
    user = User.query.filter(func.lower(User.email) == func.lower(email)).first()

    # Prepare response
    response = {"message": "ok"}

    # Check if the user actually exists
    # Take the user-supplied password, hash it, and compare it to
    # the hashed password in the database
    if not user or not check_password_hash(user.password, password):
        response["message"] = "err_login"
        return jsonify(response), 200

    # if the above check passes,
    # then we know the user has the right credentials
    login_user(user, remember=remember)

    # #257 — Trace d'activité : ce compte vient d'être utilisé.
    touch_last_seen(user)

    # Upgrade legacy password hashes transparently on successful login
    if password_needs_rehash(user.password):
        user.password = hash_password(password)
        db.session.commit()

    # Clear secret token if needed
    if (user.secret_token is not None) and (user.secret_expiry is not None):
        date_expiry = datetime.fromisoformat(user.secret_expiry)
        date_now = datetime.now()
        if date_expiry < date_now:
            user.secret_token = None
            user.secret_expiry = None
            db.session.commit()

    # Return
    return jsonify(response), 200


@auth_blueprint.route("/auth/logout")
@login_required
def logout():
    """
    HTTP GET request to logout user

    Output Boolean (always true)
    """
    logout_user()  # Log out and clean rememberme cookie.
    return "ok", 200


@auth_blueprint.route("/auth/connected")
@login_required
def is_connected():
    return "ok", 200


@auth_blueprint.route("/auth/license", methods=["POST"])
def has_license():
    try:
        if not current_user.is_authenticated:
            return (
                jsonify({"error": "User not authenticated", "code": "AUTH_REQUIRED"}),
                401,
            )

        response = {}

        # État d'essai gratuit — renvoyé À PART des licences réelles pour que le
        # front distingue « licence réelle » (has_real_*) de « accès par essai ».
        # Toujours présent, même sans aucune licence Stripe (un compte en essai
        # n'a pas d'entrée user_licenses).
        trial = current_user.trial_state()

        # Licences réelles (Stripe). Peut être vide pour un compte en essai seul.
        if hasattr(current_user, "user_licenses") and current_user.user_licenses:
            for user_license in current_user.user_licenses:
                try:
                    license_name = user_license.license.name if hasattr(user_license, "license") else str(user_license)
                    response[license_name] = current_user.has_valid_license(user_license.license.name)
                except AttributeError as e:
                    return (
                        jsonify(
                            {
                                "error": f"License structure error: {str(e)}",
                                "code": "LICENSE_STRUCTURE_ERROR",
                            }
                        ),
                        500,
                    )
        if current_user.get_is_dev():
            response['dev'] = True

        return jsonify({"licenses": response, "trial": trial, "message": "Success"}), 200

    except AttributeError as e:
        return (
            jsonify(
                {
                    "error": f"User attribute error: {str(e)}",
                    "code": "USER_ATTRIBUTE_ERROR",
                }
            ),
            500,
        )

    except Exception as e:
        # Log l'erreur complète côté serveur
        print(f"Unexpected error in has_license: {str(e)}")
        return (
            jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}),
            500,
        )

# @auth_blueprint.route("/auth/license", methods=["POST"])
# def has_license():
#     try:
#         if not current_user.is_authenticated:
#             return (
#                 jsonify({"error": "User not authenticated", "code": "AUTH_REQUIRED"}),
#                 401,
#             )

#         response = {}

#         # Vérifier si l'utilisateur a des licences
#         if not hasattr(current_user, "user_licenses") or not current_user.user_licenses:
#             return jsonify({"licenses": {}, "message": "No licenses found"}), 200

#         for user_license in current_user.user_licenses:
#             try:
#                 # Récupérer le nom de la licence selon votre structure de données
#                 license_name = user_license.license.name if hasattr(user_license, "license") else str(user_license)
#                 response[license_name] = current_user.has_valid_license(user_license.license.name)
#             except AttributeError as e:
#                 return (
#                     jsonify(
#                         {
#                             "error": f"License structure error: {str(e)}",
#                             "code": "LICENSE_STRUCTURE_ERROR",
#                         }
#                     ),
#                     500,
#                 )

#         return jsonify({"licenses": response, "message": "Success"}), 200

#     except AttributeError as e:
#         return (
#             jsonify(
#                 {
#                     "error": f"User attribute error: {str(e)}",
#                     "code": "USER_ATTRIBUTE_ERROR",
#                 }
#             ),
#             500,
#         )

#     except Exception as e:
#         # Log l'erreur complète côté serveur
#         print(f"Unexpected error in has_license: {str(e)}")
#         return (
#             jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}),
#             500,
#         )


@auth_blueprint.route("/auth/forgot_pw", methods=["POST"])
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
    response["user_exists"] = False
    response["user_is_authenticated"] = False
    # Protection - Check fist if user is currently authentificated
    if current_user.is_authenticated:
        response["user_exists"] = True
        response["user_is_authenticated"] = True
    # Verify email - if OK create reseting url
    else:
        # Anti-énumération : la réponse est identique qu'un compte existe ou
        # non ; on n'envoie le mail de reset que si le compte existe vraiment.
        response["user_exists"] = True
        try:
            email = request.json.get("email")
            if is_email_valid(email):
                user = User.query.filter(func.lower(User.email) == func.lower(email)).first()
                if user is not None:
                    send_pw_reset_email(user, request.json.get("lang"))
        except Exception:
            # Ne pas divulguer le détail de l'erreur au client (anti-énumération)
            return jsonify({"user_exists": True, "user_is_authenticated": False}), 200
    # Return
    return jsonify(response), 200


@auth_blueprint.route("/auth/reset_pw/<token>", methods=["POST"])
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
    response["passwd_is_updated"] = False
    response["user_is_authenticated"] = False
    # Check fist if user is currently authentificated
    if current_user.is_authenticated:
        response["user_is_authenticated"] = True
    # Verify token
    else:
        try:
            user = User.verify_pwd_reset_token(token)
            if user is not None:
                new_password = request.json.get("password")
                if not validate_password(new_password):
                    response["passwd_is_updated"] = False
                    return jsonify(response), 200
                user.password = hash_password(new_password)
                db.session.commit()
                response["passwd_is_updated"] = True
        except Exception as excpt:
            response = Response(
                response="reset_pw : " + str(excpt).replace(token, "<token>"),
                status=500,
            )
            return response
    # Return
    return jsonify(response), 200
