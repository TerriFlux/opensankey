# coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de création : 26/09/2024

# ---------------------------------------------------------------
# External imports
import os

# Flask imports
from flask_mail import Mail, Message
from flask import render_template


# ---------------------------------------------------------------
mail = Mail()
sending_mail = 'contact@terriflux.fr'


# ---------------------------------------------------------------
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


def create_welcome_mail(
    dest_mail,
    dest_first_name,
    language='fr'
):
    """
    Create welcome mail in French

    Parameters
    ----------
    :param dest_mail: _description_
    :type dest_mail: _type_

    Optional parameters
    -------------------
    """
    # Protection
    if language not in ['en', 'fr']:
        language = 'en'
    # Mail object
    subject = {}
    subject['en'] = "Welcome on OpenSankey"
    subject['fr'] = "Bienvenue sur OpenSankey"
    # Instanciate msg
    msg = Message(
        subject=subject[language],
        sender=("Contact TerriFlux", sending_mail),
        recipients=[dest_mail],
    )
    # Add body to msg
    msg.body = render_template(
        'welcome_mail/welcome_mail_{}.txt'.format(language),
        first_name=dest_first_name)
    msg.html = render_template(
        'welcome_mail/welcome_mail_{}.html'.format(language),
        logo_OS='cid:logo_OS',
        logo_TerriFlux='cid:logo_TerriFlux',
        first_name=dest_first_name)
    # Get abs path
    path = os.path.dirname(os.path.abspath(__file__))
    # Add openSankey logo
    msg.attach(
        'logo_OS.jpg',
        'image/jpg',
        open(path + "/templates/welcome_mail/logo_OS.jpg", 'rb').read(),
        'inline',
        headers={'Content-ID': '<logo_OS>'})
    # Add TerriFlux logo
    msg.attach(
        'logo_TerriFlux.jpg',
        'image/jpg',
        open(path + "/templates/welcome_mail/logo_TerriFlux.jpg", 'rb').read(),
        'inline',
        headers={'Content-ID': '<logo_TerriFlux>'})
    return msg
