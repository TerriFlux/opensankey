# coding: utf-8
"""
Moteur de campagne (issue #270) — cibler, figer, envoyer, reprendre.

Le transport (SMTP OVH via Flask-Mail) existe déjà dans
`logincomponent.server.mailing`. Ce module apporte la couche au-dessus :
constituer un segment, figer la liste des destinataires, envoyer par lots sans
se faire blacklister, et reprendre proprement un envoi interrompu.

Trois invariants
----------------
1. **Les destinataires sont figés à la création de la campagne.** Un
   `CampaignRecipient` par personne, avec son token. Un envoi interrompu (redémarrage
   uWSGI, exception) reprend exactement là où il s'est arrêté : on n'envoie qu'aux
   lignes dont `sent_at` et `error` sont vides. Personne ne reçoit deux fois.

2. **Les exclusions dures ne sont pas contournables.** `User.campaign_protection()`
   est la source unique : compte développeur, licence valide, essai en cours, client
   Stripe, ou refus de mail déjà exprimé. Vérifié à la constitution du segment ET au
   moment du clic (server/campaign.py) — la base change entre les deux.

3. **Une adresse déjà contactée par le même template ne l'est jamais deux fois**,
   même dans une nouvelle campagne. C'est ce qui protège des envois en double après
   une erreur de manipulation.

Délivrabilité
-------------
Envoyer quelques centaines de mails d'un coup depuis un SMTP transactionnel est le
meilleur moyen de finir en spam, voire de faire suspendre le compte OVH. D'où le
throttle (`CAMPAIGN_SEND_INTERVAL`, 2 s par défaut) et la taille de lot. Avant le
premier envoi réel : vérifier SPF et DKIM sur terriflux.fr. Si le volume grandit,
c'est `mailing.send()` qu'il faudra brancher sur un service dédié (Brevo, Mailjet) —
rien d'autre dans ce module n'a besoin de bouger.
"""
import os
import threading
import time
from datetime import datetime, timedelta

from sqlalchemy import or_

from logincomponent.server.models import (
    db,
    User,
    Campaign,
    CampaignRecipient,
    new_campaign_token,
)
from logincomponent.server.mailing import send_account_review_mail, is_email_valid

# Délai entre deux envois, en secondes. Volontairement lent : on préfère qu'une
# campagne de 500 adresses prenne 17 minutes plutôt que de brûler la réputation
# d'expéditeur du domaine.
SEND_INTERVAL = float(os.environ.get("CAMPAIGN_SEND_INTERVAL", "2.0"))

# Templates disponibles → fonction d'envoi. Ajouter une campagne = ajouter une
# entrée ici et les 4 fichiers de template (html/txt × fr/en).
TEMPLATES = {
    "account_review": send_account_review_mail,
}


# ---------------------------------------------------------------------------
# Segments
# ---------------------------------------------------------------------------

def _iso_months_ago(months):
    return (datetime.now() - timedelta(days=30 * months)).isoformat()


SEGMENTS = {
    "no_license": {
        "label": "Comptes sans licence ni essai",
        "help": (
            "Tous les comptes qui n'ont jamais rien payé ni essayé. C'est le segment "
            "du premier nettoyage : on demande à tout le monde, faute de savoir qui "
            "est réellement dormant."
        ),
        "filter": lambda q: q,  # les exclusions dures font déjà tout le travail
    },
    "dormant_6m": {
        "label": "Inactifs depuis 6 mois",
        "help": (
            "Dernière connexion il y a plus de 6 mois. ATTENTION : `last_login` n'existe "
            "que depuis la migration #270 — les comptes qui ne se sont pas reconnectés "
            "depuis ont un last_login vide, et on retombe alors sur leur date de création. "
            "Ce segment ne devient fiable qu'après quelques mois de collecte."
        ),
        "filter": lambda q: q.filter(
            or_(
                User.last_login < _iso_months_ago(6),
                (User.last_login.is_(None)) & (User.creation < _iso_months_ago(6)),
            )
        ),
    },
    "never_logged": {
        "label": "Jamais connectés depuis la migration",
        "help": (
            "`last_login` vide. Utile seulement une fois que la colonne aura vécu : "
            "juste après la migration, elle est vide pour TOUT LE MONDE."
        ),
        "filter": lambda q: q.filter(User.last_login.is_(None)),
    },
}


def eligible_users(segment_key, template="account_review"):
    """
    Les comptes à qui l'on peut légitimement écrire pour ce segment.

    Renvoie (users, skipped) où `skipped` compte les écarts par motif — l'UI
    l'affiche pour qu'on voie ce qu'on n'envoie pas, plutôt que de le découvrir après.
    """
    segment = SEGMENTS.get(segment_key)
    if segment is None:
        raise ValueError("Segment inconnu : {!r}".format(segment_key))

    # Adresses déjà sollicitées par ce template, quelle que soit la campagne.
    already = {
        row.email
        for row in db.session.query(CampaignRecipient.email)
        .join(Campaign)
        .filter(Campaign.template == template)
        .all()
        if row.email
    }

    users = segment["filter"](User.query).all()

    kept = []
    skipped = {"protected": 0, "already_contacted": 0, "bad_email": 0, "deactivated": 0}
    for user in users:
        if not user.email or not is_email_valid(user.email):
            skipped["bad_email"] += 1
            continue
        if user.is_deactivated():
            skipped["deactivated"] += 1
            continue
        if user.campaign_protection() is not None:
            skipped["protected"] += 1
            continue
        if user.email in already:
            skipped["already_contacted"] += 1
            continue
        kept.append(user)
    return kept, skipped


# ---------------------------------------------------------------------------
# Création et envoi
# ---------------------------------------------------------------------------

def create_campaign(name, template, segment_key, created_by):
    """
    Fige une campagne et ses destinataires, sans rien envoyer (status 'draft').
    L'envoi est une action séparée et explicite : on veut pouvoir relire la liste.
    """
    if template not in TEMPLATES:
        raise ValueError("Template inconnu : {!r}".format(template))

    users, skipped = eligible_users(segment_key, template)

    c = Campaign(
        name=name,
        template=template,
        status="draft",
        created_at=datetime.now().isoformat(),
        created_by=created_by,
        segment=SEGMENTS[segment_key]["label"],
    )
    db.session.add(c)
    db.session.flush()  # pour disposer de c.id

    for user in users:
        db.session.add(
            CampaignRecipient(
                campaign_id=c.id,
                user_id=user.id,
                email=user.email,
                token=new_campaign_token(),
            )
        )
    db.session.commit()
    return c, skipped


def pending_recipients(campaign_id):
    """Destinataires restant à traiter (ni envoyés, ni en erreur définitive)."""
    return (
        CampaignRecipient.query.filter_by(campaign_id=campaign_id)
        .filter(CampaignRecipient.sent_at.is_(None))
        .filter(CampaignRecipient.error.is_(None))
        .all()
    )


def _send_one(recipient, template):
    """
    Envoie à un destinataire. Renvoie None si OK, le message d'erreur sinon.
    Une erreur n'interrompt jamais la campagne : elle est notée sur la ligne et
    l'envoi continue (une adresse morte ne doit pas bloquer les 400 suivantes).
    """
    user = db.session.get(User, recipient.user_id) if recipient.user_id else None
    if user is None:
        return "compte supprimé entre-temps"

    # La base a pu changer depuis la constitution du segment : quelqu'un a pu
    # s'abonner ou se désinscrire entre la création de la campagne et l'envoi.
    protection = user.campaign_protection()
    if protection is not None:
        return "exclu ({})".format(protection)

    TEMPLATES[template](user, recipient.token, "fr")
    return None


def run_campaign(app, campaign_id):
    """
    Boucle d'envoi. Bloquante — appelée dans un thread par `start_campaign`.
    Idempotente : relancer une campagne interrompue ne renvoie qu'aux restants.
    """
    with app.app_context():
        c = db.session.get(Campaign, campaign_id)
        if c is None:
            return
        c.status = "sending"
        db.session.commit()

        try:
            for recipient in pending_recipients(campaign_id):
                try:
                    error = _send_one(recipient, c.template)
                except Exception as e:  # noqa: BLE001 — une adresse morte ne bloque pas la campagne
                    error = "{0}: {1}".format(type(e).__name__, e)[:255]

                if error:
                    recipient.error = error
                else:
                    recipient.sent_at = datetime.now().isoformat()
                db.session.commit()

                time.sleep(SEND_INTERVAL)

            c.status = "done"
            db.session.commit()
        except Exception as e:  # noqa: BLE001 — thread de fond : on trace, on ne relance pas
            db.session.rollback()
            c = db.session.get(Campaign, campaign_id)
            if c is not None:
                c.status = "failed"
                db.session.commit()
            print("ERROR campaign {0} failed: {1}".format(campaign_id, e))


def start_campaign(app, campaign_id):
    """
    Lance l'envoi en tâche de fond et rend la main tout de suite (l'UI d'admin ne
    doit pas rester bloquée 17 minutes sur une requête HTTP). Le thread est daemon :
    si le serveur redémarre en plein envoi, la campagne repart d'où elle en était au
    prochain « Reprendre » — c'est tout l'intérêt du statut par destinataire.
    """
    thread = threading.Thread(target=run_campaign, args=(app, campaign_id), daemon=True)
    thread.start()
    return thread
