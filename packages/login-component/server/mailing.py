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
if "MAIL_SENDING_ADRESS" in os.environ:
    MAIL_SENDING_ADRESS = os.environ["MAIL_SENDING_ADRESS"]
    MAIL_SENDING_PWD = os.environ["MAIL_SENDING_PWD"]
    MAIL_SERVER = os.environ["MAIL_SERVER"]
    MAIL_PORT = os.environ["MAIL_PORT"]
    MAIL_USE_TLS = os.environ["MAIL_USE_TLS"] == "True"
    MAIL_USE_SSL = os.environ["MAIL_USE_SSL"] == "True"

    DBG_MODE = os.environ["MAIL_DBG_MODE"] == "Activate"

    CLIENT_ROOT_URL = os.environ["CLIENT_ROOT_URL"]
else:
    MAIL_SENDING_ADRESS = None
    MAIL_SENDING_PWD = None
    MAIL_SERVER = None
    MAIL_PORT = None
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False

    DBG_MODE = True

    CLIENT_ROOT_URL = None

# Essai gratuit — liens utilisés dans les emails d'essai.
# - RDV « essai accompagné » SankeySuite (30 min avec Julien) : lien de prise de
#   rendez-vous (Calendly ou équivalent), surchargeable par l'environnement.
# - Devis / contact : mailto de repli (pas de nouveau tunnel pour l'instant).
TRIAL_SUITE_MEETING_URL = os.environ.get(
    "TRIAL_SUITE_MEETING_URL", "https://calendly.com/terriflux/sankeysuite-30min"
)
TRIAL_CONTACT_EMAIL = os.environ.get("TRIAL_CONTACT_EMAIL", "contact@terriflux.fr")
# Destinataire des notifications admin « nouvel essai démarré » (surchargeable).
TRIAL_NOTIFY_RECIPIENT = os.environ.get("TRIAL_NOTIFY_RECIPIENT", "julien.alapetite@terriflux.fr")


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
    regex_mail = r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$)"
    return re.match(regex_mail, mail_to_check) is not None


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
    app.config["MAIL_SERVER"] = MAIL_SERVER
    app.config["MAIL_PORT"] = MAIL_PORT
    app.config["MAIL_USERNAME"] = MAIL_SENDING_ADRESS
    app.config["MAIL_PASSWORD"] = MAIL_SENDING_PWD
    app.config["MAIL_USE_TLS"] = MAIL_USE_TLS
    app.config["MAIL_USE_SSL"] = MAIL_USE_SSL
    mail.init_app(app)


def send(msg):
    if not DBG_MODE:
        mail.send(msg)
    else:
        print("To : {0}\nSubject: {1}\nBody: \n{2}".format(msg.recipients, msg.subject, msg.body))


def _attach_logos(msg):
    """Attache les logos OpenSankey / TerriFlux en inline (cid) au message."""
    path = os.path.dirname(os.path.abspath(__file__))
    msg.attach(
        "logo_OS.jpg",
        "image/jpg",
        open(path + "/templates/logo_OS.jpg", "rb").read(),
        "inline",
        headers={"Content-ID": "<logo_OS>"},
    )
    msg.attach(
        "logo_TerriFlux.jpg",
        "image/jpg",
        open(path + "/templates/logo_TerriFlux.jpg", "rb").read(),
        "inline",
        headers={"Content-ID": "<logo_TerriFlux>"},
    )


def _normalize_lang(language):
    language = (language or "fr").split("-")[0]
    return language if language in ("en", "fr") else "fr"


def send_account_confirm_mail(user_infos, confirm_sub_url):
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
    if not is_email_valid(user_infos["email"]):
        return
    if user_infos["lang"] not in ["en", "fr"]:
        user_infos["lang"] = "en"
    # Mail object
    subject = {}
    subject["en"] = "[OpenSankey] Welcome"
    subject["fr"] = "[OpenSankey] Bienvenue"
    # Instanciate msg
    msg = Message(
        subject=subject[user_infos["lang"]],
        sender=("Contact TerriFlux", MAIL_SENDING_ADRESS),
        recipients=[user_infos["email"]],
    )
    # Add body to msg
    file = "register_mail/account_confirm_{}".format(user_infos["lang"])
    confirm_url = "{0}{1}".format(CLIENT_ROOT_URL, confirm_sub_url)
    msg.body = render_template(file + ".txt", first_name=user_infos["firstname"], confirm_url=confirm_url)
    msg.html = render_template(
        file + ".html",
        logo_OS="cid:logo_OS",
        logo_TerriFlux="cid:logo_TerriFlux",
        first_name=user_infos["firstname"],
        confirm_url=confirm_url,
    )
    # Get abs path
    path = os.path.dirname(os.path.abspath(__file__))
    # Add openSankey logo
    msg.attach(
        "logo_OS.jpg",
        "image/jpg",
        open(path + "/templates/logo_OS.jpg", "rb").read(),
        "inline",
        headers={"Content-ID": "<logo_OS>"},
    )
    # Add TerriFlux logo
    msg.attach(
        "logo_TerriFlux.jpg",
        "image/jpg",
        open(path + "/templates/logo_TerriFlux.jpg", "rb").read(),
        "inline",
        headers={"Content-ID": "<logo_TerriFlux>"},
    )
    # Send mail
    send(msg)


def send_welcome_mail(user, language="fr"):
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
    if language not in ["en", "fr"]:
        language = "en"
    # Mail object
    subject = {}
    subject["en"] = "[OpenSankey] Welcome"
    subject["fr"] = "[OpenSankey] Bienvenue"
    # Instanciate msg
    msg = Message(
        subject=subject[language],
        sender=("Contact TerriFlux", MAIL_SENDING_ADRESS),
        recipients=[user.email],
    )
    # Add body to msg
    file = "register_mail/welcome_mail_{}".format(language)
    login_url = "{0}login".format(CLIENT_ROOT_URL)
    msg.body = render_template(file + ".txt", first_name=user.firstname, login_url=login_url)
    msg.html = render_template(
        file + ".html",
        logo_OS="cid:logo_OS",
        logo_TerriFlux="cid:logo_TerriFlux",
        first_name=user.firstname,
        login_url=login_url,
    )
    # Get abs path
    path = os.path.dirname(os.path.abspath(__file__))
    # Add openSankey logo
    msg.attach(
        "logo_OS.jpg",
        "image/jpg",
        open(path + "/templates/logo_OS.jpg", "rb").read(),
        "inline",
        headers={"Content-ID": "<logo_OS>"},
    )
    # Add TerriFlux logo
    msg.attach(
        "logo_TerriFlux.jpg",
        "image/jpg",
        open(path + "/templates/logo_TerriFlux.jpg", "rb").read(),
        "inline",
        headers={"Content-ID": "<logo_TerriFlux>"},
    )
    # Send mail
    send(msg)


def send_pw_reset_email(user, language="fr"):
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
    if language not in ["en", "fr"]:
        language = "en"
    # Get reseting token
    token = user.get_pwd_reset_token()
    # Mail object
    subject = {}
    subject["en"] = "[OpenSankey] Your password reset request"
    subject["fr"] = "[OpenSankey] Votre demande de reinitialisation du mot de passe"
    # Instanciate msg
    msg = Message(
        subject=subject[language],
        sender=("Contact TerriFlux", MAIL_SENDING_ADRESS),
        recipients=[user.email],
    )
    # Add body to msg
    file = "password_reset_mail/password_reset_mail_{}".format(language)
    url = "{0}login/reset/{1}".format(CLIENT_ROOT_URL, token)
    msg.body = render_template(file + ".txt", first_name=user.firstname, reset_url=url)
    msg.html = render_template(
        file + ".html",
        logo_OS="cid:logo_OS",
        logo_TerriFlux="cid:logo_TerriFlux",
        first_name=user.firstname,
        reset_url=url,
    )
    # Get abs path
    path = os.path.dirname(os.path.abspath(__file__))
    # Add openSankey logo
    msg.attach(
        "logo_OS.jpg",
        "image/jpg",
        open(path + "/templates/logo_OS.jpg", "rb").read(),
        "inline",
        headers={"Content-ID": "<logo_OS>"},
    )
    # Add TerriFlux logo
    msg.attach(
        "logo_TerriFlux.jpg",
        "image/jpg",
        open(path + "/templates/logo_TerriFlux.jpg", "rb").read(),
        "inline",
        headers={"Content-ID": "<logo_TerriFlux>"},
    )
    # Send mail
    send(msg)


def send_set_password_email(user, language="fr"):
    """
    Welcome mail after an anonymous Stripe checkout : the account was created
    by webhook without password, invite the customer to set it (link doubles
    as email verification). Uses the long-lived welcome token (7 days).

    Parameters
    ----------
    :param user: User to send the mail to
    :type user: User
    """
    # Protection
    if not is_email_valid(user.email):
        return
    language = (language or "fr").split("-")[0]
    if language not in ["en", "fr"]:
        language = "fr"
    # Get long-lived setup token
    token = user.get_welcome_token()
    # Mail object
    subject = {}
    subject["en"] = "[OpenSankey] Your licence is active — set your password"
    subject["fr"] = "[OpenSankey] Votre licence est active — definissez votre mot de passe"
    # Instanciate msg
    msg = Message(
        subject=subject[language],
        sender=("Contact TerriFlux", MAIL_SENDING_ADRESS),
        recipients=[user.email],
    )
    # Add body to msg
    file = "set_password_mail/set_password_mail_{}".format(language)
    url = "{0}login/reset/{1}".format(CLIENT_ROOT_URL, token)
    msg.body = render_template(file + ".txt", first_name=user.firstname, reset_url=url)
    msg.html = render_template(
        file + ".html",
        logo_OS="cid:logo_OS",
        logo_TerriFlux="cid:logo_TerriFlux",
        first_name=user.firstname,
        reset_url=url,
    )
    # Get abs path
    path = os.path.dirname(os.path.abspath(__file__))
    # Add openSankey logo
    msg.attach(
        "logo_OS.jpg",
        "image/jpg",
        open(path + "/templates/logo_OS.jpg", "rb").read(),
        "inline",
        headers={"Content-ID": "<logo_OS>"},
    )
    # Add TerriFlux logo
    msg.attach(
        "logo_TerriFlux.jpg",
        "image/jpg",
        open(path + "/templates/logo_TerriFlux.jpg", "rb").read(),
        "inline",
        headers={"Content-ID": "<logo_TerriFlux>"},
    )
    # Send mail
    send(msg)


# ---------------------------------------------------------------
# Free trial (essai gratuit) — emails J0 / J-7 / J-0


def send_trial_welcome_mail(user, plan, language="fr"):
    """
    Email J0 : bienvenue dans l'essai gratuit 30 jours. Pour SankeySuite, propose
    un créneau de 30 min offert avec Julien (« essai accompagné »).

    :param plan: 'plus' | 'suite'
    """
    if not is_email_valid(user.email):
        return
    language = _normalize_lang(language)
    is_suite = plan == "suite"
    product = "SankeySuite" if is_suite else "OpenSankey+"
    subject = {
        "fr": "[{0}] Votre essai gratuit de 30 jours est activé".format(product),
        "en": "[{0}] Your 30-day free trial is active".format(product),
    }
    msg = Message(
        subject=subject[language],
        sender=("Contact TerriFlux", MAIL_SENDING_ADRESS),
        recipients=[user.email],
    )
    file = "trial_mail/trial_welcome_{}".format(language)
    login_url = "{0}login".format(CLIENT_ROOT_URL)
    ctx = dict(
        first_name=user.firstname,
        login_url=login_url,
        product=product,
        is_suite=is_suite,
        meeting_url=TRIAL_SUITE_MEETING_URL,
    )
    msg.body = render_template(file + ".txt", **ctx)
    msg.html = render_template(
        file + ".html",
        logo_OS="cid:logo_OS",
        logo_TerriFlux="cid:logo_TerriFlux",
        **ctx,
    )
    _attach_logos(msg)
    send(msg)


def send_trial_reminder_mail(user, days_remaining, language="fr"):
    """
    Email de rappel pendant l'essai (J-7 puis J-0). Rappelle le décompte et le
    bouton d'abonnement pour ne pas perdre l'accès aux fonctions payantes.
    """
    if not is_email_valid(user.email):
        return
    language = _normalize_lang(language)
    is_suite = user.trial_plan == "suite"
    product = "SankeySuite" if is_suite else "OpenSankey+"
    ending = days_remaining <= 0
    if ending:
        subject = {
            "fr": "[{0}] Votre essai gratuit se termine aujourd'hui".format(product),
            "en": "[{0}] Your free trial ends today".format(product),
        }
    else:
        subject = {
            "fr": "[{0}] Plus que {1} jours d'essai gratuit".format(product, days_remaining),
            "en": "[{0}] {1} days left in your free trial".format(product, days_remaining),
        }
    msg = Message(
        subject=subject[language],
        sender=("Contact TerriFlux", MAIL_SENDING_ADRESS),
        recipients=[user.email],
    )
    file = "trial_mail/trial_reminder_{}".format(language)
    ctx = dict(
        first_name=user.firstname,
        login_url="{0}login".format(CLIENT_ROOT_URL),
        product=product,
        is_suite=is_suite,
        days_remaining=days_remaining,
        ending=ending,
        meeting_url=TRIAL_SUITE_MEETING_URL,
        contact_email=TRIAL_CONTACT_EMAIL,
    )
    msg.body = render_template(file + ".txt", **ctx)
    msg.html = render_template(
        file + ".html",
        logo_OS="cid:logo_OS",
        logo_TerriFlux="cid:logo_TerriFlux",
        **ctx,
    )
    _attach_logos(msg)
    send(msg)


def send_trial_admin_notification(user, plan):
    """
    Notifie l'admin (TRIAL_NOTIFY_RECIPIENT) qu'un essai gratuit vient de démarrer.
    Best-effort : email texte simple (client, plan, UTM). Ne bloque jamais l'appelant.

    :param plan: 'plus' | 'suite'
    """
    if not TRIAL_NOTIFY_RECIPIENT:
        return
    product = "SankeySuite" if plan == "suite" else "OpenSankey+"
    body = (
        "Un nouvel essai gratuit vient de démarrer.\n\n"
        "  Produit : {0}\n"
        "  Client  : {1}\n"
        "  UTM     : {2}\n\n"
        "Détail / export : python scripts/trial_export.py\n"
    ).format(
        product,
        getattr(user, "email", "?"),
        getattr(user, "utm_campaign", None) or "-",
    )
    msg = Message(
        subject="[{0}] Nouvel essai démarré".format(product),
        sender=("Contact TerriFlux", MAIL_SENDING_ADRESS) if MAIL_SENDING_ADRESS else None,
        recipients=[TRIAL_NOTIFY_RECIPIENT],
        body=body,
    )
    send(msg)


# ---------------------------------------------------------------
# Campagnes (issue #270)


def send_account_review_mail(user, token, language="fr"):
    """
    Campagne « Gardez-vous votre compte ? » — demande à un compte dormant s'il
    souhaite le conserver, avec deux liens explicites :

      - garder    → /campaign/<token>/keep
      - supprimer → /campaign/<token>/unsubscribe (désactive, purge à J+30)

    Sans clic, il ne se passe rien : on ne supprime jamais un compte par défaut.

    :param token: secret d'URL du destinataire (CampaignRecipient.token)
    """
    if not is_email_valid(user.email):
        return
    language = _normalize_lang(language)
    subject = {
        "fr": "[OpenSankey] Souhaitez-vous conserver votre compte ?",
        "en": "[OpenSankey] Do you want to keep your account?",
    }
    msg = Message(
        subject=subject[language],
        sender=("Contact TerriFlux", MAIL_SENDING_ADRESS),
        recipients=[user.email],
    )
    file = "campaign_mail/account_review_{}".format(language)
    ctx = dict(
        first_name=user.firstname,
        keep_url="{0}campaign/{1}/keep".format(CLIENT_ROOT_URL, token),
        unsubscribe_url="{0}campaign/{1}/unsubscribe".format(CLIENT_ROOT_URL, token),
        login_url="{0}login".format(CLIENT_ROOT_URL),
        contact_email=TRIAL_CONTACT_EMAIL,
    )
    msg.body = render_template(file + ".txt", **ctx)
    msg.html = render_template(
        file + ".html",
        logo_OS="cid:logo_OS",
        logo_TerriFlux="cid:logo_TerriFlux",
        **ctx,
    )
    # En-tête standard RFC 8058 : les clients mail affichent un bouton natif
    # « Se désabonner », et les filtres anti-spam pénalisent moins un envoi de
    # masse qui l'expose. List-Unsubscribe-Post permet le désabonnement en un
    # clic sans quitter le client mail (le POST atterrit sur la même route).
    msg.extra_headers = {
        "List-Unsubscribe": "<{0}>".format(ctx["unsubscribe_url"]),
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    }
    _attach_logos(msg)
    send(msg)


def send_pw_modification_email(user, language="fr"):
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
    if language not in ["en", "fr"]:
        language = "en"
    # Mail object
    subject = {}
    subject["en"] = "[OpenSankey] Your password modification request"
    subject["fr"] = "[OpenSankey] Votre demande de modication du mot de passe"
    # Instanciate msg
    msg = Message(
        subject=subject[language],
        sender=("Contact TerriFlux", MAIL_SENDING_ADRESS),
        recipients=[user.email],
    )
    # Add body to msg
    file = "password_modification_mail/password_modification_mail_{}".format(language)
    msg.body = render_template(file + ".txt", first_name=user.firstname, token=user.secret_token)
    msg.html = render_template(
        file + ".html",
        logo_OS="cid:logo_OS",
        logo_TerriFlux="cid:logo_TerriFlux",
        first_name=user.firstname,
        token=user.secret_token,
    )
    # Get abs path
    path = os.path.dirname(os.path.abspath(__file__))
    # Add openSankey logo
    msg.attach(
        "logo_OS.jpg",
        "image/jpg",
        open(path + "/templates/logo_OS.jpg", "rb").read(),
        "inline",
        headers={"Content-ID": "<logo_OS>"},
    )
    # Add TerriFlux logo
    msg.attach(
        "logo_TerriFlux.jpg",
        "image/jpg",
        open(path + "/templates/logo_TerriFlux.jpg", "rb").read(),
        "inline",
        headers={"Content-ID": "<logo_TerriFlux>"},
    )
    # Send mail
    send(msg)
