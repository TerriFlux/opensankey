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


def create_welcome_mail_fr(dest_mail):
    """
    Create welcome mail in French

    Parameters
    ----------
    :param dest_mail: _description_
    :type dest_mail: _type_

    Optional parameters
    -------------------
    """
    # Instanciate msg
    msg = Message(
        subject="Bienvenue sur OpenSankey",
        sender=("Contact TerriFlux", sending_mail),
        recipients=[dest_mail],
    )
    # Add body to msg
    msg.body = render_template('welcome_mail/welcome_mail_fr.txt')
    msg.html = render_template(
        'welcome_mail/welcome_mail_fr.html',
        logo_OS='cid:logo_OS',
        logo_TerriFlux='cid:logo_TerriFlux',
        first_name='michel')
    # Add attached images
    path = os.path.dirname(os.path.abspath(__file__))
    msg.attach(
        'logo_OS.jpg',
        'image/jpg',
        open(path + "/templates/welcome_mail/image001.jpg", 'rb').read(),
        'inline',
        headers={'Content-ID': '<logo_OS>'})
    msg.attach(
        'logo_TerriFlux.jpg',
        'image/jpg',
        open(path + "/templates/welcome_mail/image003.jpg", 'rb').read(),
        'inline',
        headers={'Content-ID': '<logo_TerriFlux>'})
    return msg


def create_welcome_mail_en(dest_mail):
    """
    Create welcome mail in English

    Parameters
    ----------
    :param dest_mail: _description_
    :type dest_mail: _type_

    Optional parameters
    -------------------
    """
    # Instanciate msg
    msg = Message(
        subject="Welcome to OpenSankey",
        sender=("Contact TerriFlux", sending_mail),
        recipients=[dest_mail],
    )
    # Add body to msg
    msg.body = "This is a mailing test"
    return msg
