# coding: utf-8
"""Journal des actions métier — « les gens se servent-ils de l'outil ? ».

La table `metrics` compte des *visites* : elle dit qu'une page a été chargée,
jamais qu'on s'en est servi. Or c'est l'usage qui nous intéresse. On journalise
donc ici les actions qui ont un sens métier — importer un fichier, lancer une
résolution MFA, publier un site, extraire un diagramme depuis une image.

Deux propriétés en découlent, et ce sont elles qui justifient le module :

- **Aucun robot n'y figure.** Un crawler charge des pages ; il n'importe pas un
  classeur Excel et ne lance pas de solveur. Le bruit disparaît par construction,
  sans filtre d'User-Agent ni liste noire à maintenir.
- **On ne dépend pas du front.** L'enregistrement se fait dans un `after_request`
  branché sur les routes de traitement (cf. ROUTE_EVENTS). Les actions passent
  déjà par le serveur : inutile d'aller instrumenter chaque composant React —
  et cela capte aussi les routes servies par le paquet `opensankey`, sans créer
  de dépendance de ce paquet vers la couche SaaS.

Ne double PAS `user.last_seen_at` / `last_login` (#257, #270) : ces colonnes
disent qu'un compte s'est CONNECTÉ, cette table dit qu'il a FAIT quelque chose.
Un compte qui ouvre l'app sans jamais rien importer est « actif » au sens de
last_seen_at, et n'utilise pourtant pas le produit. Les segments de campagne
(`server/campaign_engine.py`) peuvent s'appuyer là-dessus pour viser juste.

DONNÉES PERSONNELLES — à lire avant de toucher à ce module.

Deux identifiants d'acteur sont stockés, et ils n'ont pas le même statut :

- `visitor_hash` : HMAC de l'IP, clé par un secret serveur (cf.
  `models.hash_visitor_ip`). Pseudonyme, non réversible sans la clé.
- `user_id` : l'utilisateur authentifié, quand il y en a un. Donnée
  **nominative** : elle permet de savoir qui se sert de l'outil et qui a cessé.

Toute sollicitation par email doit passer par le moteur de campagnes (#270-#272),
qui porte déjà le droit d'opposition (`User.mail_optout`), la déduplication et
les exclusions dures. Ne pas réimplémenter un envoi ici.

Conservation : cf. PURGE_AFTER_DAYS — conserver des données nominatives sans
finalité est une infraction en soi (RGPD art. 5.1.e).

Limite assumée : les actions purement front (export PNG/PDF, rendu local) ne
touchent pas le serveur et restent invisibles ici. Les ajouter demanderait un
beacon explicite côté client.
"""
import time

from flask import request
from flask_login import current_user

from logincomponent.server.models import (
    db,
    hash_visitor_ip,
    user_excluded_from_metrics,
)

# ---------------------------------------------------------------
# Routes de traitement dont l'appel vaut « action utilisateur ».
#
# Clé = chemin exact (le blueprint OpenSankey est monté sous /opensankey).
# Valeur = nom d'événement stocké. On ne journalise que les réponses < 400 :
# un import qui échoue en 4xx/5xx n'est pas un usage réussi.
ROUTE_EVENTS = {
    "/opensankey/convert/launch": "import",
    "/optimize/launch_optim": "mfa_solve",
    "/api/publish/deploy": "publish",
    "/api/vision/extract": "vision_extract",
}

# Longueur max du champ `detail` (tronqué plutôt que rejeté : une métrique ne
# doit jamais faire échouer la requête qu'elle observe).
DETAIL_MAX_LEN = 64

# Durée de conservation. La CNIL retient 13 mois pour la mesure d'audience ; on
# s'y tient, d'autant qu'on stocke ici un `user_id` (donnée nominative). Au-delà,
# une ligne n'a plus d'utilité opérationnelle : la garder serait une conservation
# sans finalité, ce que le RGPD interdit. Purge : `purge_old_events()`.
PURGE_AFTER_DAYS = 395  # 13 mois


class UsageEvent(db.Model):
    """Une ligne = une action métier réussie.

    Volontairement dénormalisé et sans index composite : la volumétrie attendue
    est de l'ordre de quelques milliers de lignes par mois, l'agrégation se fait
    par `count`/`group by` à la lecture (cf. admin_metrics).
    """

    __tablename__ = "usage_events"

    id = db.Column(db.Integer, primary_key=True)
    # Epoch en secondes (UTC). Indépendant de REF_EPOCH, contrairement à
    # Metrics.last_visit : pas de référentiel implicite à retrouver plus tard.
    ts = db.Column(db.Integer, nullable=False, index=True)
    event = db.Column(db.String(48), nullable=False, index=True)
    # HMAC de l'IP (cf. models.hash_visitor_ip) — pseudonyme, même convention
    # que `metrics`. Seul identifiant disponible pour un visiteur non connecté.
    visitor_hash = db.Column(db.String(64), nullable=False, index=True)
    # Utilisateur authentifié, si session ouverte. NOMINATIF (cf. en-tête) :
    # c'est ce qui permet de dire « ce client n'est pas revenu depuis 3 mois ».
    # Pas de ForeignKey : la suppression d'un compte ne doit pas faire échouer
    # l'insert d'une métrique, et un id orphelin est simplement ignoré à la
    # lecture (jointure interne). Nullable = visiteur anonyme.
    user_id = db.Column(db.Integer, nullable=True, index=True)
    # Redondant avec user_id, mais conservé : permet de compter les actions
    # « connecté vs anonyme » sans jointure, et reste vrai après purge d'un compte.
    authenticated = db.Column(db.Boolean, nullable=False, default=False)
    # Précision libre et courte : pour un import, le format d'entrée
    # (excel / json / example_excel...). Permet de distinguer un vrai import
    # utilisateur du chargement d'un exemple de la sankeythèque.
    detail = db.Column(db.String(DETAIL_MAX_LEN), nullable=True)


def _visitor_hash() -> str:
    ip = request.environ.get("HTTP_X_FORWARDED_FOR", request.remote_addr) or ""
    return hash_visitor_ip(ip)


def _is_internal() -> bool:
    """Visite de l'équipe (cf. views._visitor_is_internal) : non comptée.

    Même règle que pour `metrics`, via la source unique
    `models.user_excluded_from_metrics`.
    """
    if not current_user.is_authenticated:
        return False
    return user_excluded_from_metrics(current_user)


def _detail_for(path: str):
    """Contexte utile de l'action, quand il y en a un."""
    if path == "/opensankey/convert/launch":
        value = request.form.get("input_format", "") or ""
        return value[:DETAIL_MAX_LEN] or None
    return None


def record_event(event: str, detail=None) -> None:
    """Enregistre une action. Best-effort : ne doit jamais casser la requête."""
    try:
        authenticated = bool(current_user.is_authenticated)
        db.session.add(
            UsageEvent(
                ts=int(time.time()),
                event=event,
                visitor_hash=_visitor_hash(),
                user_id=current_user.id if authenticated else None,
                authenticated=authenticated,
                detail=detail,
            )
        )
        db.session.commit()
    except Exception:
        # Une métrique qui plante ne doit pas faire échouer l'action de
        # l'utilisateur (ni laisser la session SQLAlchemy en vrac pour la suite).
        db.session.rollback()


def purge_old_events() -> int:
    """Supprime les événements au-delà de PURGE_AFTER_DAYS. Renvoie le nb supprimé.

    Conserver indéfiniment des données nominatives sans finalité est une
    infraction en soi (RGPD art. 5.1.e) : cette purge n'est pas une optimisation
    de place, c'est une obligation. À appeler depuis un cron / une commande de
    maintenance.
    """
    cutoff = int(time.time()) - PURGE_AFTER_DAYS * 86400
    try:
        deleted = (
            db.session.query(UsageEvent).filter(UsageEvent.ts < cutoff).delete()
        )
        db.session.commit()
        return int(deleted or 0)
    except Exception:
        db.session.rollback()
        return 0


def install_usage_tracking(app) -> None:
    """Branche le `after_request` qui journalise les actions de ROUTE_EVENTS."""

    @app.after_request
    def _record_usage(response):
        event = ROUTE_EVENTS.get(request.path)
        if event and response.status_code < 400 and not _is_internal():
            record_event(event, _detail_for(request.path))
        return response
