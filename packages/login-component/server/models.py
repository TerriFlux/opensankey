# coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de création : 25/01/2023

# ---------------------------------------------------------------
# External imports
import os
import time
import hashlib
import secrets

# System
from datetime import datetime
from datetime import timedelta
from functools import wraps

# Flask imports
from flask import Blueprint
from flask import current_app

# Flask_login imports
from flask_login import current_user
from flask_login import UserMixin

# SQLAlchemy
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func
from sqlalchemy.ext.associationproxy import association_proxy

# Werkzeug
from werkzeug.security import generate_password_hash

# Itsdangerous - serialize URLs for secured API transactions
from itsdangerous import URLSafeTimedSerializer as Serializer

# ---------------------------------------------------------------
# Local imports

# ---------------------------------------------------------------
# Shared variables

connected_user = Blueprint("connected_user", __name__)
db = SQLAlchemy()


# ---------------------------------------------------------------
# Free trial (essai gratuit) — géré en base, jamais dans Stripe.
#
# Un essai « plus » débloque OpenSankey+ ; un essai « suite » débloque
# SankeySuite (qui inclut OpenSankey+). Sans carte bancaire, un seul essai par
# plan et par compte, à vie. À expiration, on retombe sur le plan gratuit :
# aucune donnée n'est supprimée (le front passe les projets payants en lecture
# seule). Les vérifications de droits lisent ces champs EN PLUS de la licence
# Stripe — on n'interroge jamais Stripe pour autoriser une fonctionnalité.
TRIAL_PLANS = ("plus", "suite")
TRIAL_DURATION_DAYS = 30

# Nom de la licence débloquée par chaque plan d'essai (identique aux produits
# Stripe, cf. RegisterFunctions.tsx). Un essai « suite » couvre aussi « plus ».
TRIAL_PLAN_LICENSES = {
    "plus": ("OpenSankey+",),
    "suite": ("SankeySuite", "OpenSankey+"),
}


# ---------------------------------------------------------------
# Campagnes de mail (issue #270) — nettoyage de la base de comptes.
#
# Un compte désactivé par l'utilisateur n'est PAS supprimé tout de suite : il est
# marqué (`deactivated_at`) et purgé physiquement `PURGE_GRACE_DAYS` plus tard par
# scripts/purge_deactivated.py. Cette fenêtre est la parade au fait qu'un lien GET
# dans un mail est pré-chargé par les scanners de sécurité (Outlook SafeLinks,
# antivirus, proxys) : sans elle, une campagne de quelques centaines d'adresses
# supprimerait des comptes que personne n'a jamais cliqués, sans retour arrière.
# Une reconnexion pendant la fenêtre annule aussi la désactivation.
PURGE_GRACE_DAYS = 30

# Actions possibles d'un destinataire de campagne, en réponse au mail.
CAMPAIGN_ACTIONS = ("kept", "unsubscribed")


# ---------------------------------------------------------------
# Password hashing & policy
#
# Historique : les mots de passe étaient hashés avec method="sha256"
# (HMAC-SHA256 à une seule itération, sans key-stretching, et supprimé de
# Werkzeug 3.0). On passe à pbkdf2:sha256 avec 600000 itérations et on
# ré-hashe de façon transparente les anciens hashes au login (voir auth.py).

PWD_HASH_METHOD = "pbkdf2:sha256:600000"

# Politique de force minimale : longueur seule (aucune règle de composition,
# conformément à NIST 800-63B et à la relâche client volontaire). 8 caractères
# minimum. Ne s'applique qu'au signup/reset/modify : les comptes existants ne
# sont pas impactés.
MIN_PASSWORD_LENGTH = 8


def hash_password(password: str) -> str:
    """Hash un mot de passe avec la méthode courante (pbkdf2:sha256)."""
    return generate_password_hash(password, method=PWD_HASH_METHOD)


def password_needs_rehash(stored_hash: str) -> bool:
    """
    True si le hash stocké utilise un schéma obsolète (legacy sha256) et doit
    être ré-hashé avec la méthode courante lors d'une authentification réussie.
    """
    return not (stored_hash or "").startswith("pbkdf2:")


def validate_password(password) -> bool:
    """
    Validation serveur minimale : le mot de passe doit être une chaîne non
    vide (après strip). Renvoie True si acceptable.
    """
    return isinstance(password, str) and len(password.strip()) >= MIN_PASSWORD_LENGTH


def stripe_event_already_processed(event_id: str) -> bool:
    """
    True si l'événement Stripe a déjà été traité (idempotence webhook).

    Best-effort : l'idempotence est une protection contre les rejeux Stripe,
    pas un prérequis au traitement. Si la table `stripe_events_processed`
    est absente (base non migrée) ou toute autre erreur DB survient, on
    rollback la session (pour ne pas casser le commit du handler qui suit)
    et on considère l'événement comme non traité — le webhook continue.
    """
    if not event_id:
        return False
    try:
        return ProcessedStripeEvent.query.get(event_id) is not None
    except Exception as e:  # noqa: BLE001 — dégradation volontaire, cause loggée
        db.session.rollback()
        print(
            "WARN stripe idempotence check skipped ({0}: {1}) — "
            "table 'stripe_events_processed' absente ? webhook traité sans "
            "protection anti-rejeu".format(type(e).__name__, e)
        )
        return False


def mark_stripe_event_processed(event_id: str, event_type: str = "") -> None:
    """
    Marque un événement Stripe comme traité (no-op si déjà présent).

    Best-effort comme [stripe_event_already_processed] : une erreur ici ne
    doit pas invalider un webhook dont le handler a réussi (compte/licence
    déjà créés). On rollback et on loggue, sans propager.
    """
    if not event_id:
        return
    try:
        if ProcessedStripeEvent.query.get(event_id) is not None:
            return
        db.session.add(
            ProcessedStripeEvent(
                event_id=event_id,
                event_type=event_type,
                processed_at=datetime.now().isoformat(),
            )
        )
        db.session.commit()
    except Exception as e:  # noqa: BLE001 — dégradation volontaire, cause loggée
        db.session.rollback()
        print(
            "WARN stripe idempotence mark skipped ({0}: {1}) — "
            "table 'stripe_events_processed' absente ?".format(type(e).__name__, e)
        )


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
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///db.sqlite"
    db.init_app(app)

    path_directory_user_pref = ""
    # Check if dir of pref user exist, if not then create it
    if "USER_PREF_REP" in os.environ:
        path_directory_user_pref = os.environ["USER_PREF_REP"]
        if not os.path.exists(path_directory_user_pref):
            os.mkdir(path_directory_user_pref)


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
    dir = db.Column(db.String(1024))
    # Old Licenses infos - TODO remove
    license_opensankeyplus = db.Column(db.String(1024))
    license_sankeysuite = db.Column(db.String(1024))
    is_developer = db.Column(db.Boolean)
    # Visites internes (équipe) : quand ce flag est posé, les passages de cet
    # utilisateur sur la page d'accueil ne sont PAS comptés dans la table
    # `metrics` (issue #256). Les comptes `is_developer` sont exclus d'office ;
    # ce flag permet d'exclure aussi un compte non-développeur (collègue, démo).
    exclude_from_metrics = db.Column(db.Boolean)
    # Customer infos
    creation = db.Column(db.String(128))
    # Dernière activité observée (date ISO). Alimentée au login ET sur toute
    # requête authentifiée (cf. touch_last_seen) : sans ce second canal, un
    # utilisateur en session « remember me » — actif tous les jours mais qui ne
    # se reconnecte jamais — paraîtrait inactif et serait purgé à tort (#257).
    # NULL = compte antérieur à l'instrumentation, jamais revu depuis.
    last_seen_at = db.Column(db.String(128))
    stripe_id = db.Column(db.String(1024), unique=True)
    # Security token
    secret_token = db.Column(db.String(64))
    secret_expiry = db.Column(db.String(128))
    # Free trial (essai gratuit en base, sans carte). Voir TRIAL_* ci-dessus.
    trial_plan = db.Column(db.String(16))          # 'plus' | 'suite' | None
    trial_ends_at = db.Column(db.String(128))      # date ISO de fin de l'essai courant
    trial_used_plus = db.Column(db.Boolean)        # essai « plus » déjà consommé (à vie)
    trial_used_suite = db.Column(db.Boolean)       # essai « suite » déjà consommé (à vie)
    trial_reminded_j7 = db.Column(db.Boolean)      # rappel J-7 envoyé pour l'essai courant
    trial_reminded_j0 = db.Column(db.Boolean)      # rappel J-0 envoyé pour l'essai courant
    trial_expired_handled = db.Column(db.Boolean)  # événement 'expired' déjà journalisé
    # Acquisition — utm_campaign transmis par le site à la création du compte
    utm_campaign = db.Column(db.String(256))
    # Cycle de vie du compte (issue #270). Alimentés par les campagnes de mail et
    # par le login. Voir CampaignRecipient pour le flux complet.
    # - last_login : dernière connexion réussie (ISO). NULL = jamais connecté DEPUIS
    #   la migration #270 — ce n'est PAS « jamais connecté » tout court, la colonne
    #   n'existait pas avant. Ne pas cibler dessus tant qu'elle n'a pas quelques mois.
    # - mail_optout : l'utilisateur ne veut plus de mail de campagne. Définitif :
    #   même une réactivation du compte ne le lève pas.
    # - deactivated_at / purge_after : suppression en deux temps. Le clic sur le lien
    #   de désinscription désactive immédiatement ; le cron scripts/purge_deactivated.py
    #   supprime physiquement une fois purge_after dépassé. La fenêtre existe parce
    #   qu'un GET dans un mail est déclenché par les scanners (SafeLinks, antivirus,
    #   proxys) : sans elle, on perdrait des comptes que personne n'a cliqués.
    last_login = db.Column(db.String(128))
    mail_optout = db.Column(db.Boolean)
    deactivated_at = db.Column(db.String(128))
    purge_after = db.Column(db.String(128))
    # Relationships
    # Cascade - delete entries in UserLicense if this db entry is deleted
    user_licenses = db.relationship("UserLicences", back_populates="user", cascade="all, delete")
    licenses = association_proxy("user_licenses", "license")

    def delete(self):
        """
        Delete self for db

        Returns
        -------
        :return: _description_
        :rtype: _type_
        """
        # Les lignes qui référencent ce compte en ON DELETE SET NULL (campagnes,
        # événements d'essai) sont censées lui survivre en perdant le lien. Mais
        # SQLite n'applique PAS les clés étrangères par défaut (PRAGMA foreign_keys
        # est OFF) : sans ce nettoyage explicite, elles gardent l'ancien user_id.
        # Or les id sont réattribués — un nouvel inscrit peut hériter de l'id d'un
        # compte purgé et se retrouver rattaché à ses lignes. Dans le cas d'une
        # campagne, un vieux token encore valide désactiverait alors le compte de
        # quelqu'un d'autre. On coupe donc le lien à la main, avant la suppression.
        CampaignRecipient.query.filter_by(user_id=self.id).update({"user_id": None})
        TrialEvent.query.filter_by(user_id=self.id).update({"user_id": None})
        for user_license in self.user_licenses:
            user_license.delete()
        db.session.delete(self)
        db.session.commit()

    def get_is_dev(self):
        """
        Return True if user is a developer

        Returns
        -------
        :return: True if user is developer, False otherwise
        :rtype: boolean
        """
        return bool(self.is_developer)

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
        return UserLicences.query.filter_by(license=license, user=self).first()

    def is_from_terriflux(self):
        """
        Return true if user has terriflux license

        Returns
        -------
        :rtype: boolean
        """
        # Get related license to terriflux
        this_license = self.get_license("terriflux")
        # Check if user is related to this specific license
        return this_license is not None

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
            if user_license.expiry == "never":
                return "never"
            # Save expiry date
            if expiry is None:
                expiry = user_license.expiry
                continue
            # Otherwise keep max expiry date
            expiry = max(
                datetime.fromisoformat(expiry),
                datetime.fromisoformat(user_license.expiry),
            ).isoformat()
        # Return
        return expiry

    def has_valid_license(self, license_name):
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
            if user_license.license.name != license_name:
                continue
            # Check expiration
            ok_expiry = False
            if user_license.expiry is not None:
                if user_license.expiry == "never":
                    ok_expiry = True
                else:
                    cur_time = datetime.now()
                    try:
                        exp_time = datetime.fromisoformat(user_license.expiry)
                        ok_expiry = exp_time >= cur_time
                    except Exception as e:
                        print("Error - has_valid_license - {}".format(e))
            # Ok if activated and not expired
            if ok_expiry and user_license.activated:
                ok_license = True
                break
        return ok_license

    # -----------------------------------------------------------
    # Cycle de vie du compte (issue #270) — désactivation / purge différée

    def has_any_valid_license(self):
        """True si au moins une licence est active et non expirée."""
        for user_license in self.user_licenses:
            if user_license is None or user_license.license is None:
                continue
            if self.has_valid_license(user_license.license.name):
                return True
        return False

    def is_deactivated(self):
        """True si le compte a été désactivé (en attente de purge)."""
        return bool(self.deactivated_at)

    def deactivate(self, grace_days=PURGE_GRACE_DAYS):
        """
        Désactive le compte et programme sa purge physique dans `grace_days`.
        Idempotent : ne repousse pas la date de purge si déjà désactivé.
        """
        if self.is_deactivated():
            return
        now = datetime.now()
        self.deactivated_at = now.isoformat()
        self.purge_after = (now + timedelta(days=grace_days)).isoformat()

    def reactivate(self):
        """
        Annule une désactivation en cours (clic « annuler », ou simple reconnexion).
        Ne lève PAS `mail_optout` : qui a demandé à ne plus être contacté ne doit pas
        se remettre à recevoir des mails parce qu'il s'est reconnecté une fois.
        """
        self.deactivated_at = None
        self.purge_after = None

    def is_purge_due(self, now=None):
        """True si la fenêtre de rétractation est écoulée et le compte purgeable."""
        if not self.purge_after:
            return False
        try:
            return datetime.fromisoformat(self.purge_after) <= (now or datetime.now())
        except (TypeError, ValueError):
            return False

    def campaign_protection(self):
        """
        Raison pour laquelle ce compte ne doit JAMAIS recevoir de mail de campagne
        ni pouvoir être désactivé en un clic, ou None s'il est éligible.

        Ces exclusions sont dures : un compte payant supprimé d'un clic laisserait
        un abonnement Stripe orphelin, et un compte développeur est un compte
        interne. Elles sont vérifiées à la constitution du segment ET au moment du
        clic — la base peut avoir changé entre l'envoi et le clic.

        :rtype: str | None — 'developer' | 'licensed' | 'trialing' | 'stripe' | 'optout'
        """
        if self.is_developer:
            return "developer"
        if self.has_any_valid_license():
            return "licensed"
        if self.has_active_trial():
            return "trialing"
        if self.stripe_id:
            return "stripe"
        if self.mail_optout:
            return "optout"
        return None

    # -----------------------------------------------------------
    # Free trial (essai gratuit) — helpers

    def has_active_trial(self, plan=None):
        """
        True si un essai gratuit est en cours (optionnellement pour un plan
        donné). Un essai « suite » couvre aussi les fonctionnalités « plus ».

        :param plan: 'plus' | 'suite' | None (n'importe quel essai)
        :rtype: boolean
        """
        if not self.trial_plan or not self.trial_ends_at:
            return False
        # Expiré ?
        try:
            if datetime.fromisoformat(self.trial_ends_at) < datetime.now():
                return False
        except Exception:
            return False
        if plan is None:
            return True
        if self.trial_plan == plan:
            return True
        # Un essai « suite » débloque aussi « plus »
        return plan == "plus" and self.trial_plan == "suite"

    def trial_grants_license(self, license_name):
        """True si l'essai en cours débloque la licence nommée (ex. 'OpenSankey+')."""
        if not self.has_active_trial():
            return False
        return license_name in TRIAL_PLAN_LICENSES.get(self.trial_plan, ())

    def trial_days_remaining(self):
        """Nombre de jours entiers restants avant la fin de l'essai (0 si aucun/expiré)."""
        if not self.trial_ends_at:
            return 0
        try:
            remaining = (datetime.fromisoformat(self.trial_ends_at) - datetime.now()).total_seconds()
        except Exception:
            return 0
        if remaining <= 0:
            return 0
        # Arrondi au jour supérieur (« il reste 1 jour » tant qu'il reste du temps)
        return int(remaining // 86400) + (1 if remaining % 86400 else 0)

    def trial_already_used(self, plan):
        """True si l'essai de ce plan a déjà été consommé (à vie)."""
        if plan == "suite":
            return bool(self.trial_used_suite)
        return bool(self.trial_used_plus)

    def can_start_trial(self, plan):
        """
        True si l'utilisateur peut démarrer un essai pour ce plan : plan valide,
        essai jamais consommé, pas déjà une licence réelle pour ce plan.
        """
        if plan not in TRIAL_PLANS:
            return False
        if self.trial_already_used(plan):
            return False
        # Inutile de proposer un essai à qui possède déjà la licence réelle
        for license_name in TRIAL_PLAN_LICENSES[plan]:
            if self.has_valid_license(license_name):
                return False
        return True

    def start_trial(self, plan):
        """
        Démarre un essai gratuit de 30 jours pour le plan donné (sans carte).
        Un seul essai par plan et par compte, à vie.

        :return: (ok, reason) — reason ∈ {'ok','invalid_plan','already_used','has_license'}
        :rtype: (boolean, str)
        """
        if plan not in TRIAL_PLANS:
            return False, "invalid_plan"
        if self.trial_already_used(plan):
            return False, "already_used"
        for license_name in TRIAL_PLAN_LICENSES[plan]:
            if self.has_valid_license(license_name):
                return False, "has_license"
        now = datetime.now()
        self.trial_plan = plan
        self.trial_ends_at = (now + timedelta(days=TRIAL_DURATION_DAYS)).isoformat()
        # Réinitialise le suivi des rappels pour ce nouvel essai
        self.trial_reminded_j7 = False
        self.trial_reminded_j0 = False
        self.trial_expired_handled = False
        if plan == "suite":
            self.trial_used_suite = True
        else:
            self.trial_used_plus = True
        db.session.commit()
        return True, "ok"

    def trial_state(self):
        """État d'essai sérialisable pour le front (bandeau, boutons, droits)."""
        return {
            "plan": self.trial_plan if self.has_active_trial() else None,
            "ends_at": self.trial_ends_at if self.has_active_trial() else None,
            "days_remaining": self.trial_days_remaining(),
            "active_plus": self.has_active_trial("plus"),
            "active_suite": self.has_active_trial("suite"),
            "used_plus": bool(self.trial_used_plus),
            "used_suite": bool(self.trial_used_suite),
            "can_start_plus": self.can_start_trial("plus"),
            "can_start_suite": self.can_start_trial("suite"),
        }

    def get_pwd_reset_token(self):
        """
        Create a random token for password reset

        Returns
        -------
        :return: Timed serialized token
        :rtype: string
        """
        serializer = Serializer(current_app.config["SECRET_KEY"])
        return serializer.dumps(self.id)

    def get_welcome_token(self):
        """
        Create a token for initial password setup (account created after an
        anonymous Stripe checkout). Same reset page/endpoint as the classic
        reset token, but with a long validity window : the customer may open
        the welcome email days after paying.

        Returns
        -------
        :return: Timed serialized token
        :rtype: string
        """
        serializer = Serializer(current_app.config["SECRET_KEY"])
        return serializer.dumps({"welcome": self.id})

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
        serializer = Serializer(current_app.config["SECRET_KEY"])
        # Welcome token (payload dict) : valid for 7 days
        try:
            payload = serializer.loads(token, max_age=60 * 60 * 24 * 7)
        except Exception:
            return None
        if isinstance(payload, dict):
            if "welcome" not in payload:
                return None
            return User.query.get(payload["welcome"])
        # Classic reset token (plain user id) : valid for 15min
        try:
            user_id = serializer.loads(token, max_age=900)
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

    __tablename__ = "user_licenses"
    # primary keys are required by SQLAlchemy
    id = db.Column(db.Integer(), primary_key=True)
    # Db relation for user - at least one entry is needed + relationship
    user_id = db.Column(db.Integer(), db.ForeignKey("user.id", ondelete="CASCADE"))
    user = db.relationship("User", back_populates="user_licenses")
    # Db relation for license - at least one entry is needed + relationship
    license_id = db.Column(db.Integer(), db.ForeignKey("license.id", ondelete="CASCADE"))
    license = db.relationship("License", back_populates="user_licenses")
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

    __tablename__ = "license"
    # primary keys are required by SQLAlchemy
    id = db.Column(db.Integer(), primary_key=True)
    # Db entries
    name = db.Column(db.String(64), unique=True)
    stripe_id = db.Column(db.String(1024), unique=True)
    # Relationships
    # Cascade - delete entries in UserLicense if this db entry is deleted
    user_licenses = db.relationship("UserLicences", back_populates="license", cascade="all, delete")
    users = association_proxy("user_licenses", "user")

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

    __tablename__ = "metrics"
    # primary keys are required by SQLAlchemy
    id = db.Column(db.String(64), primary_key=True)
    nb_visits = db.Column(db.Integer())
    last_visit = db.Column(db.Integer())

    def new_visit(self):
        epoch = int(time.time() / (24 * 60 * 60)) - int(os.environ["REF_EPOCH"])
        if epoch != self.last_visit:
            # Increase number of visits for given id
            if self.nb_visits:
                self.nb_visits = self.nb_visits + 1
            else:
                self.nb_visits = 1
            # Update last visits time
            self.last_visit = epoch


class ProcessedStripeEvent(db.Model):
    """
    Idempotence des webhooks Stripe : chaque event.id traité est enregistré
    ici pour qu'un rejeu Stripe (retries) ne ré-exécute pas la logique
    (double activation de licence, doublons...).
    """

    __tablename__ = "stripe_events_processed"
    # Stripe garantit l'unicité de event.id
    event_id = db.Column(db.String(255), primary_key=True)
    event_type = db.Column(db.String(128))
    processed_at = db.Column(db.String(128))


class TrialEvent(db.Model):
    """
    Journal des événements d'essai gratuit (mesure de conversion).

    Un événement par ligne : 'started' | 'converted' | 'expired', avec le plan
    et l'UTM d'origine du compte. Un simple export (scripts/trial_stats.py) suffit.
    """

    __tablename__ = "trial_events"
    id = db.Column(db.Integer, primary_key=True)
    # SET NULL : on garde l'événement même si le compte est supprimé
    user_id = db.Column(db.Integer, db.ForeignKey("user.id", ondelete="SET NULL"), nullable=True)
    event = db.Column(db.String(32))          # 'started' | 'converted' | 'expired'
    plan = db.Column(db.String(16))           # 'plus' | 'suite'
    utm_campaign = db.Column(db.String(256))  # UTM d'origine du compte, copié au moment de l'event
    created_at = db.Column(db.String(128))


class Campaign(db.Model):
    """
    Une campagne de mail envoyée à un segment de comptes (issue #270).

    Le premier usage est le nettoyage de la base : demander aux comptes dormants
    s'ils veulent garder leur compte. La table garde le nécessaire pour reprendre
    un envoi interrompu et pour lire les résultats a posteriori.
    """

    __tablename__ = "campaign"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128))
    # Nom du dossier de template sous server/templates/campaign_mail/
    template = db.Column(db.String(64))
    # 'draft' : destinataires figés, rien d'envoyé — 'sending' : envoi en cours
    # 'done' : envoi terminé — 'failed' : le thread d'envoi est mort
    status = db.Column(db.String(16), default="draft")
    created_at = db.Column(db.String(128))
    created_by = db.Column(db.String(128))
    # Description lisible du segment qui a servi à constituer les destinataires
    segment = db.Column(db.String(256))
    recipients = db.relationship(
        "CampaignRecipient", back_populates="campaign", cascade="all, delete"
    )

    def counts(self):
        """Compteurs d'avancement, pour l'UI d'admin."""
        total = sent = errors = kept = unsubscribed = 0
        for r in self.recipients:
            total += 1
            if r.error:
                errors += 1
            elif r.sent_at:
                sent += 1
            if r.action == "kept":
                kept += 1
            elif r.action == "unsubscribed":
                unsubscribed += 1
        return {
            "total": total,
            "sent": sent,
            "errors": errors,
            "pending": total - sent - errors,
            "kept": kept,
            "unsubscribed": unsubscribed,
            "no_reply": sent - kept - unsubscribed,
        }


class CampaignRecipient(db.Model):
    """
    Un destinataire d'une campagne, et sa réponse.

    `token` est un secret aléatoire par destinataire (pas un token auto-porteur
    signé type itsdangerous) : il est ainsi révocable, et le clic est traçable
    sans exposer d'identifiant de compte dans l'URL du mail.

    `email` est recopié ici car le compte peut être purgé : on veut garder trace
    du fait qu'une adresse a été contactée et s'est désinscrite, pour ne jamais
    la re-contacter par erreur.
    """

    __tablename__ = "campaign_recipient"
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey("campaign.id", ondelete="CASCADE"))
    campaign = db.relationship("Campaign", back_populates="recipients")
    # SET NULL : la ligne survit à la purge du compte
    user_id = db.Column(db.Integer, db.ForeignKey("user.id", ondelete="SET NULL"), nullable=True)
    email = db.Column(db.String(128))
    token = db.Column(db.String(64), unique=True, index=True)
    sent_at = db.Column(db.String(128))
    error = db.Column(db.String(256))
    clicked_at = db.Column(db.String(128))
    action = db.Column(db.String(16))  # 'kept' | 'unsubscribed' | None


def new_campaign_token():
    """Secret d'URL d'un destinataire (43 caractères, 256 bits d'entropie)."""
    return secrets.token_urlsafe(32)


def record_trial_event(user, event, plan):
    """
    Journalise un événement d'essai. Best-effort : une erreur ici ne doit
    jamais casser le flux appelant (démarrage d'essai, webhook, cron).
    """
    try:
        db.session.add(
            TrialEvent(
                user_id=(user.id if user is not None else None),
                event=event,
                plan=plan,
                utm_campaign=(user.utm_campaign if user is not None else None),
                created_at=datetime.now().isoformat(),
            )
        )
        db.session.commit()
    except Exception as e:  # noqa: BLE001 — dégradation volontaire, cause loggée
        db.session.rollback()
        print("WARN record_trial_event skipped ({0}: {1})".format(type(e).__name__, e))


def record_trial_conversion(user):
    """
    Journalise une conversion essai → abonnement payant, une seule fois par compte.
    Appelée à l'activation d'une licence (webhook Stripe) : ne fait rien si le compte
    n'a jamais eu d'essai ou si la conversion a déjà été enregistrée.
    """
    if user is None or not user.trial_plan:
        return
    try:
        already = TrialEvent.query.filter_by(user_id=user.id, event="converted").first()
        if already is not None:
            return
    except Exception:  # noqa: BLE001 — table absente / base non migrée : on abandonne
        db.session.rollback()
        return
    record_trial_event(user, "converted", user.trial_plan)


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
        found = False
        for user_license in current_user.user_licenses:
            if current_user.has_valid_license(user_license.license.name):
                found = True
        if not found:
            return "No valid license", 401
        return f(*args, **kwargs)

    return decorated_function


# ---------------------------------------------------------------
# Functions


def touch_last_seen(user) -> bool:
    """Note que ce compte a été vu aujourd'hui (#257). Renvoie True si écrit.

    Appelé au login ET sur toute requête authentifiée. Écriture au plus UNE FOIS
    PAR JOUR et par utilisateur : on ne compare que la partie DATE, donc une
    session active ne provoque pas une écriture DB à chaque requête.

    Ne lève jamais : une trace d'activité ne doit pas pouvoir casser une requête
    utilisateur (ni un login). En cas d'échec, on perd au pire un jour de trace.
    """
    today = datetime.now().date().isoformat()
    try:
        current = getattr(user, "last_seen_at", None)
        # `creation` et `last_seen_at` sont des datetime ISO : les 10 premiers
        # caractères en donnent la date (YYYY-MM-DD).
        if current and str(current)[:10] == today:
            return False
        user.last_seen_at = datetime.now().isoformat()
        db.session.commit()
        return True
    except Exception:
        db.session.rollback()
        return False


def user_excluded_from_metrics(user) -> bool:
    """Règle CANONIQUE : ce compte doit-il être exclu du décompte de fréquentation ?

    Un compte est exclu s'il est développeur (`is_developer`, exclusion d'office)
    ou explicitement marqué (`exclude_from_metrics`, pour un collègue ou un compte
    de démo non-développeur). Cf. issue #256.

    Source unique de la règle : `server/views.py` (pour ne pas compter la visite)
    et `server/admin_users.py` (pour l'afficher dans l'admin) l'utilisent tous
    les deux. Ne pas la redéfinir ailleurs.

    Le `getattr` tolère un objet sans la colonne (base non encore migrée).
    """
    return bool(getattr(user, "is_developer", False)) or bool(
        getattr(user, "exclude_from_metrics", False)
    )


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
    user_by_email = User.query.filter(func.lower(User.email) == func.lower(user_email)).first()

    # Get user related to stripe id
    user_by_stripe_id = User.query.filter_by(stripe_id=user_stripe_id).first()

    # Case 1 : no email related user nor stripe related customer
    if (user_by_email is None) and (user_by_stripe_id is None):
        new_user = User(
            email=user_email.lower(),
            firstname=user_firstname,
            name=user_lastname,
            creation=datetime.now().isoformat(),
            stripe_id=user_stripe_id,
        )
        db.session.add(new_user)
        db.session.commit()
    # Case 2 : Got email related user but no stripe related customer
    elif (user_by_email is not None) and (user_by_stripe_id is None):
        user_by_email.stripe_id = user_stripe_id
        db.session.commit()

    # Return
    return "ok", True


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
    user = User.query.filter(
        func.lower(User.email) == func.lower(user_email),
        User.stripe_id == user_stripe_id,
    ).first()

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
    return "ok", True


def create_license_from_stripe(license_name: str, license_stripe_id: str):
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
    license = License.query.filter_by(stripe_id=license_stripe_id).first()

    # If no license, create
    if license is None:
        license = License(name=license_name, stripe_id=license_stripe_id)
        db.session.add(license)
        db.session.commit()

    # Return
    return "ok", True


def update_license_name_from_stripe(license_name: str, license_stripe_id: str):
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
    license = License.query.filter_by(stripe_id=license_stripe_id).first()

    # If no license, error
    if license is None:
        return "no_matching_id", False

    # Update
    license.name = license_name
    db.session.commit()

    # Return
    return "ok", True


def delete_license_from_stripe(license_stripe_id: str):
    """
    Delete license from stripe

    Parameters
    ----------
    :param license_stripe_id: _description_
    :type license_stripe_id: str
    """
    # Get license related to stripe id
    license = License.query.filter_by(stripe_id=license_stripe_id).first()

    # If no license, error
    if license is None:
        return "no_matching_id", False

    # Delete license
    license.delete()

    # Return
    return "ok", True


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
    license = License.query.filter_by(stripe_id=license_stripe_id).first()
    if license is None:
        license = License(name="unknown_{}".format(license_stripe_id), stripe_id=license_stripe_id)
        db.session.add(license)

    # Get or create user license
    user_license = UserLicences.query.filter_by(stripe_id=user_license_stripe_id).first()
    if user_license is None:
        user_license = UserLicences(stripe_id=user_license_stripe_id, activated=False)
        db.session.add(user_license)

    # Update infos
    user_license.creation = user_license_creation_date
    user_license.license = license
    user_license.expiry = user_license_expiry

    # Apply modification to database
    db.session.commit()

    # Return
    return "ok", True


def update_user_license_subscription(user_license_stripe_id, user_license_expiry):
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
    user_license = UserLicences.query.filter_by(stripe_id=user_license_stripe_id).first()
    if user_license is None:
        return "Invalid subscription id", False

    # Update infos
    user_license.expiry = user_license_expiry

    # Apply modification to database
    db.session.commit()
    return "ok", True


def delete_user_license_subscription(user_license_stripe_id):
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
    user_license = UserLicences.query.filter_by(stripe_id=user_license_stripe_id).first()
    if user_license is None:
        return "Invalid subscription id", False

    # Update infos
    user_license.delete()

    # Apply modification to database
    db.session.commit()
    return "ok", True


def set_licence_checkout_completed(user_id, user_email, user_stripe_id, user_license_stripe_id):
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
    # Get user. client_reference_id (user_id) n'existe que si l'acheteur était
    # connecté au moment du checkout ; pour un checkout anonyme (pricing table),
    # on retombe sur l'email saisi chez Stripe puis sur le customer id
    # (le compte a été créé par le webhook customer.created).
    user = None
    if user_id is not None:
        user = User.query.filter(func.lower(User.email) == func.lower(user_email), User.id == user_id).first()
    if (user is None) and user_email:
        user = User.query.filter(func.lower(User.email) == func.lower(user_email)).first()
    if (user is None) and user_stripe_id:
        user = User.query.filter_by(stripe_id=user_stripe_id).first()
    # L'ordre d'arrivée des webhooks Stripe n'est pas garanti : checkout.session
    # .completed peut être traité avant customer.created. Si le compte n'existe
    # pas encore, on le crée ici à partir de l'email du checkout (sans mot de
    # passe). create_user_from_stripe est idempotent -> pas de doublon quand
    # customer.created arrivera.
    if (user is None) and user_email:
        create_user_from_stripe(user_email, "", "", user_stripe_id)
        user = User.query.filter(func.lower(User.email) == func.lower(user_email)).first()
    if user is None:
        return "Invalid user", False

    # Get subcription license
    user_license = UserLicences.query.filter_by(stripe_id=user_license_stripe_id).first()
    if user_license is None:
        user_license = UserLicences(creation=datetime.now().isoformat(), stripe_id=user_license_stripe_id)
        db.session.add(user_license)

    # Update infos
    user.stripe_id = user_stripe_id
    user_license.user = user
    user_license.activated = True

    # Apply modification to database
    db.session.commit()

    # Mesure : si ce compte était en essai, journaliser la conversion (une seule fois)
    record_trial_conversion(user)

    return "ok", True


def set_license_invoice_created(user_email, user_stripe_id, license_stripe_id, user_license_stripe_id):
    # Get user
    # - Matching email & stripe id
    user = User.query.filter(
        func.lower(User.email) == func.lower(user_email),
        User.stripe_id == user_stripe_id,
    ).first()
    # - Then priority on matching stripe id
    if user is None:
        user = User.query.filter_by(stripe_id=user_stripe_id).first()
    # - Or get user via email and set stripe id
    if user is None:
        user = User.query.filter(func.lower(User.email) == func.lower(user_email)).first()
        if user is not None:
            user.stripe_id = user_stripe_id
    if user is None:
        return "Could not find related user", False

    # Get license
    license = License.query.filter_by(stripe_id=license_stripe_id).first()
    if license is None:
        return "Could not find related license", False

    # Get subcription license
    user_license = UserLicences.query.filter_by(stripe_id=user_license_stripe_id).first()
    if user_license is None:
        user_license = UserLicences(creation=datetime.now().isoformat(), stripe_id=user_license_stripe_id)
        db.session.add(user_license)

    # Update infos
    user_license.user = user
    user_license.license = license

    # Apply modification to database
    db.session.commit()
    return "ok", True


def set_licence_invoice_paid(
    user_stripe_id: str,
    license_stripe_id: str,
    user_license_stripe_id: str,
    user_email: str = None,
):
    """
    Create a license at checkout for given user

    Parameters
    ----------
    :param user_stripe_id: Stripe customer ID
    :type user_stripe_id: str

    :param license_stripe_id: Stripe product ID
    :type license_stripe_id: str

    :param user_license_stripe_id: Stripe subscription ID
    :type user_license_stripe_id: str

    :param user_email: Email client (facture) — repli si le compte n'est pas
        encore relié au customer id (ordre des webhooks non garanti)
    :type user_email: str

    Returns
    -------
    :return: (message, success)
    :rtype: (str, bool)
    """
    # Get user. Repli sur l'email puis création si absent (webhooks hors ordre :
    # invoice.paid peut précéder customer.created). create_user_from_stripe est
    # idempotent.
    user = User.query.filter_by(stripe_id=user_stripe_id).first()
    if (user is None) and user_email:
        user = User.query.filter(func.lower(User.email) == func.lower(user_email)).first()
    if (user is None) and user_email:
        create_user_from_stripe(user_email, "", "", user_stripe_id)
        user = User.query.filter(func.lower(User.email) == func.lower(user_email)).first()
    if user is None:
        return "No user found for invoice", False

    # Get related license
    license = License.query.filter_by(stripe_id=license_stripe_id).first()
    if license is None:
        return "No license found for invoice", False

    # Try to find user_license with all 3 criteria (ideal case)
    user_license = UserLicences.query.filter_by(
        user=user,
        license=license,
        stripe_id=user_license_stripe_id
    ).first()

    if user_license is None:
        # Alternative 1: Search by stripe_id only (maybe user/license not yet set)
        user_license = UserLicences.query.filter_by(stripe_id=user_license_stripe_id).first()

        if user_license is not None:
            # Update the user and license links
            user_license.user = user
            user_license.license = license
        else:
            # Alternative 2: Search by user and license (maybe stripe_id not yet set)
            user_license = UserLicences.query.filter_by(
                user=user,
                license=license
            ).order_by(UserLicences.id.desc()).first()

            if user_license is not None:
                # Update the stripe_id
                user_license.stripe_id = user_license_stripe_id
            else:
                # Alternative 3: Create new entry if nothing found
                user_license = UserLicences(
                    user=user,
                    license=license,
                    stripe_id=user_license_stripe_id,
                    creation=datetime.now().isoformat(),
                    expiry="never",
                    activated=False
                )
                db.session.add(user_license)

    # Update infos - mark as activated and paid
    user_license.activated = True
    if user_license.expiry is None:
        user_license.expiry = "never"

    # Apply modification to database
    try:
        db.session.commit()
        return "ok", True
    except Exception:
        db.session.rollback()
        current_app.logger.exception("set_licence_invoice_paid: commit failed")
        return "Database error", False
