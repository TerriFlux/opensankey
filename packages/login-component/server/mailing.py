# coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de création : 26/09/2024

# ---------------------------------------------------------------
# External imports
import os
import re

# Flask imports
from flask_mail import Mail, Message
from flask import render_template


# ---------------------------------------------------------------
# CONSTANTS FROM ENV
if 'MAIL_SENDING_ADRESS' in os.environ:
    MAIL_SENDING_ADRESS = os.environ['MAIL_SENDING_ADRESS']
    MAIL_SENDING_PWD = os.environ['MAIL_SENDING_PWD']
    MAIL_SERVER = os.environ['MAIL_SERVER']
    MAIL_PORT = os.environ['MAIL_PORT']
    MAIL_USE_TLS = (os.environ['MAIL_USE_TLS'] == 'True')
    MAIL_USE_SSL = (os.environ['MAIL_USE_SSL'] == 'True')

    DBG_MODE = (os.environ['MAIL_DBG_MODE'] == 'Activate')

    CLIENT_ROOT_URL = os.environ['CLIENT_ROOT_URL']
else:
    MAIL_SENDING_ADRESS = None
    MAIL_SENDING_PWD = None
    MAIL_SERVER = None
    MAIL_PORT = None
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False

    DBG_MODE = True

    CLIENT_ROOT_URL = None


# ---------------------------------------------------------------
# Shared variables

mail = Mail()


# ---------------------------------------------------------------
def is_email_valid(mail_to_check):
    """
    Check if mail is valid

    Parameters
    ----------
    :param mail_to_check: _description_
    :type mail_to_check: _type_

    Optional parameters
    -------------------
    Returns
    -------
    :return: _description_
    :rtype: _type_
    """
    # regex : https://emailregex.com/
    regex_mail = r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]{2,4}$)"
    return re.fullmatch(regex_mail, mail_to_check) is not None


def init_mailing(app):
    """
    Initialize mail service for app

    Parameters
    ----------
    :param app: _description_
    :type app: _type_

    Optional parameters
    -------------------
    """
    # Config for mailing
    app.config['MAIL_SERVER'] = MAIL_SERVER
    app.config['MAIL_PORT'] = MAIL_PORT
    app.config['MAIL_USERNAME'] = MAIL_SENDING_ADRESS
    app.config['MAIL_PASSWORD'] = MAIL_SENDING_PWD
    app.config['MAIL_USE_TLS'] = MAIL_USE_TLS
    app.config['MAIL_USE_SSL'] = MAIL_USE_SSL
    mail.init_app(app)


def send(msg):
    if (not DBG_MODE):
        mail.send(msg)
    else:
        print('To : {0}\nSubject: {1}\nBody: \n{2}'.format(
            msg.recipients,
            msg.subject,
            msg.body
        ))


def send_account_confirm_mail(
    user_infos,
    confirm_sub_url
):
    """
    Send welcome mail for newly created user

    Parameters
    ----------
    :param user_infos: _description_
    :type user_infos: _type_

    :param confirm_sub_url: _description_
    :type confirm_sub_url: _type_
    """
    # Protections
    if not is_email_valid(user_infos['email']):
        return
    if user_infos['lang'] not in ['en', 'fr']:
        user_infos['lang'] = 'en'
    # Mail object
    subject = {}
    subject['en'] = "[OpenSankey] Welcome"
    subject['fr'] = "[OpenSankey] Bienvenue"
    # Instanciate msg
    msg = Message(
        subject=subject[user_infos['lang']],
        sender=("Contact TerriFlux", MAIL_SENDING_ADRESS),
        recipients=[user_infos['email']])
    # Add body to msg
    file = 'register_mail/account_confirm_{}'.format(user_infos['lang'])
    confirm_url = '{0}{1}'.format(CLIENT_ROOT_URL, confirm_sub_url)
    msg.body = render_template(
        file + '.txt',
        first_name=user_infos['firstname'],
        confirm_url=confirm_url)
    msg.html = render_template(
        file + '.html',
        logo_OS='cid:logo_OS',
        logo_TerriFlux='cid:logo_TerriFlux',
        first_name=user_infos['firstname'],
        confirm_url=confirm_url)
    # Get abs path
    path = os.path.dirname(os.path.abspath(__file__))
    # Add openSankey logo
    msg.attach(
        'logo_OS.jpg',
        'image/jpg',
        open(path + "/templates/logo_OS.jpg", 'rb').read(),
        'inline',
        headers={'Content-ID': '<logo_OS>'})
    # Add TerriFlux logo
    msg.attach(
        'logo_TerriFlux.jpg',
        'image/jpg',
        open(path + "/templates/logo_TerriFlux.jpg", 'rb').read(),
        'inline',
        headers={'Content-ID': '<logo_TerriFlux>'})
    # Send mail
    send(msg)


def send_welcome_mail(
    user,
    language='fr'
):
    """
    Send welcome mail for newly created user

    Parameters
    ----------
    :param user: _description_
    :type user: _type_

    Optional parameters
    -------------------
    :param language: _description_
    :type language: str, optional (defaults to 'fr')
    """
    # Protections
    if not is_email_valid(user.email):
        return
    if language not in ['en', 'fr']:
        language = 'en'
    # Mail object
    subject = {}
    subject['en'] = "[OpenSankey] Welcome"
    subject['fr'] = "[OpenSankey] Bienvenue"
    # Instanciate msg
    msg = Message(
        subject=subject[language],
        sender=("Contact TerriFlux", MAIL_SENDING_ADRESS),
        recipients=[user.email])
    # Add body to msg
    file = 'register_mail/welcome_mail_{}'.format(language)
    login_url = '{0}login'.format(CLIENT_ROOT_URL)
    msg.body = render_template(
        file + '.txt',
        first_name=user.firstname,
        login_url=login_url)
    msg.html = render_template(
        file + '.html',
        logo_OS='cid:logo_OS',
        logo_TerriFlux='cid:logo_TerriFlux',
        first_name=user.firstname,
        login_url=login_url)
    # Get abs path
    path = os.path.dirname(os.path.abspath(__file__))
    # Add openSankey logo
    msg.attach(
        'logo_OS.jpg',
        'image/jpg',
        open(path + "/templates/logo_OS.jpg", 'rb').read(),
        'inline',
        headers={'Content-ID': '<logo_OS>'})
    # Add TerriFlux logo
    msg.attach(
        'logo_TerriFlux.jpg',
        'image/jpg',
        open(path + "/templates/logo_TerriFlux.jpg", 'rb').read(),
        'inline',
        headers={'Content-ID': '<logo_TerriFlux>'})
    # Send mail
    send(msg)


def send_pw_reset_email(
    user,
    language='fr'
):
    """
    Create custom mail for password reseting

    Parameters
    ----------
    :param user: _description_
    :type user: _type_

    Optional parameters
    -------------------
    """
    # Protection
    if not is_email_valid(user.email):
        return
    if language not in ['en', 'fr']:
        language = 'en'
    # Get reseting token
    token = user.get_pwd_reset_token()
    # Mail object
    subject = {}
    subject['en'] = "[OpenSankey] Your password reset request"
    subject['fr'] = \
        "[OpenSankey] Votre demande de reinitialisation du mot de passe"
    # Instanciate msg
    msg = Message(
        subject=subject[language],
        sender=("Contact TerriFlux", MAIL_SENDING_ADRESS),
        recipients=[user.email])
    # Add body to msg
    file = 'password_reset_mail/password_reset_mail_{}'.format(language)
    url = '{0}login/reset/{1}'.format(CLIENT_ROOT_URL, token)
    msg.body = render_template(
        file + '.txt',
        first_name=user.firstname,
        reset_url=url)
    msg.html = render_template(
        file + '.html',
        logo_OS='cid:logo_OS',
        logo_TerriFlux='cid:logo_TerriFlux',
        first_name=user.firstname,
        reset_url=url)
    # Get abs path
    path = os.path.dirname(os.path.abspath(__file__))
    # Add openSankey logo
    msg.attach(
        'logo_OS.jpg',
        'image/jpg',
        open(path + "/templates/logo_OS.jpg", 'rb').read(),
        'inline',
        headers={'Content-ID': '<logo_OS>'})
    # Add TerriFlux logo
    msg.attach(
        'logo_TerriFlux.jpg',
        'image/jpg',
        open(path + "/templates/logo_TerriFlux.jpg", 'rb').read(),
        'inline',
        headers={'Content-ID': '<logo_TerriFlux>'})
    # Send mail
    send(msg)


def send_pw_modification_email(
    user,
    language='fr'
):
    """
    Create custom mail for password reseting

    Parameters
    ----------
    :param user: _description_
    :type user: _type_

    Optional parameters
    -------------------
    """
    # Protection
    if not is_email_valid(user.email):
        return
    if language not in ['en', 'fr']:
        language = 'en'
    # Mail object
    subject = {}
    subject['en'] = "[OpenSankey] Your password modification request"
    subject['fr'] = \
        "[OpenSankey] Votre demande de modication du mot de passe"
    # Instanciate msg
    msg = Message(
        subject=subject[language],
        sender=("Contact TerriFlux", MAIL_SENDING_ADRESS),
        recipients=[user.email])
    # Add body to msg
    file = 'password_modification_mail/password_modification_mail_{}'\
        .format(language)
    msg.body = render_template(
        file + '.txt',
        first_name=user.firstname,
        token=user.secret_token)
    msg.html = render_template(
        file + '.html',
        logo_OS='cid:logo_OS',
        logo_TerriFlux='cid:logo_TerriFlux',
        first_name=user.firstname,
        token=user.secret_token)
    # Get abs path
    path = os.path.dirname(os.path.abspath(__file__))
    # Add openSankey logo
    msg.attach(
        'logo_OS.jpg',
        'image/jpg',
        open(path + "/templates/logo_OS.jpg", 'rb').read(),
        'inline',
        headers={'Content-ID': '<logo_OS>'})
    # Add TerriFlux logo
    msg.attach(
        'logo_TerriFlux.jpg',
        'image/jpg',
        open(path + "/templates/logo_TerriFlux.jpg", 'rb').read(),
        'inline',
        headers={'Content-ID': '<logo_TerriFlux>'})
    # Send mail
    send(msg)
