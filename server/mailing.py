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
mail = Mail()
sending_mail = 'contact@terriflux.fr'


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
    app.config['MAIL_SERVER'] = 'ssl0.ovh.net'
    app.config['MAIL_PORT'] = 465
    app.config['MAIL_USERNAME'] = sending_mail
    app.config['MAIL_PASSWORD'] = '8GzJneYkaaWhiaW7FF9e'
    app.config['MAIL_USE_TLS'] = False
    app.config['MAIL_USE_SSL'] = True
    mail.init_app(app)


def send_account_confirm_mail(
    user_infos,
    confirm_url
):
    """
    Send welcome mail for newly created user

    Parameters
    ----------
    :param user_infos: _description_
    :type user_infos: _type_

    :param confirm_url: _description_
    :type confirm_url: _type_
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
        sender=("Contact TerriFlux", sending_mail),
        recipients=[user_infos['email']])
    # Add body to msg
    file = 'register_mail/account_confirm_{}'.format(user_infos['lang'])
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
    mail.send(msg)


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
        sender=("Contact TerriFlux", sending_mail),
        recipients=[user.email])
    # Add body to msg
    file = 'register_mail/welcome_mail_{}'.format(language)
    msg.body = render_template(
        file + '.txt',
        first_name=user.firstname)
    msg.html = render_template(
        file + '.html',
        logo_OS='cid:logo_OS',
        logo_TerriFlux='cid:logo_TerriFlux',
        first_name=user.firstname)
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
    mail.send(msg)


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
        sender=("Contact TerriFlux", sending_mail),
        recipients=[user.email])
    # Add body to msg
    file = 'password_reset_mail/password_reset_mail_{}'.format(language)
    url = 'https://open-sankey.fr/#/login/reset/' + token
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
    mail.send(msg)
