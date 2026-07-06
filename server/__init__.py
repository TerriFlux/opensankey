# coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de modification : 26/09/2024

# ---------------------------------------------------------------
# Flask imports
import json
import os
import re

from flask import redirect
from flask import Flask
from flask import jsonify
from flask_cors import CORS


# ---------------------------------------------------------------
# Helpers
def _app_version():
    """Version applicative (alignée sur client/package.json / le tag git).

    Lue paresseusement à chaque appel de /health, avec repli « unknown » : le
    health-check ne doit jamais échouer à cause d'un chemin manquant.
    """
    try:
        pkg = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "..", "packages", "sankeyapplication", "package.json"
        )
        with open(pkg, encoding="utf-8") as f:
            return json.load(f).get("version", "unknown")
    except Exception:
        return "unknown"


# ---------------------------------------------------------------
# Global functions
def create_app():
    # Sentry (S3 #19) — capture des erreurs serveur. Initialise AVANT la creation
    # de l'app (recommande pour FlaskIntegration). No-op si SENTRY_DSN absent
    # (dev/local) : on n'active rien tant qu'aucun DSN n'est fourni par l'env.
    sentry_dsn = os.environ.get("SENTRY_DSN", "").strip()
    if sentry_dsn:
        import sentry_sdk
        from sentry_sdk.integrations.flask import FlaskIntegration

        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=[FlaskIntegration()],
            environment=os.environ.get("SENTRY_ENVIRONMENT") or os.environ.get("ENV"),
            release=_app_version(),
            # Traces desactivees par defaut (surcout perf) ; activable par env.
            traces_sample_rate=float(os.environ.get("SENTRY_TRACES_SAMPLE_RATE", "0") or 0),
            send_default_pii=False,
        )

    # Instanciate app
    app = Flask(__name__, template_folder="./templates", static_folder=None)

    # Set up CORS (Cross-Origin).
    # - `supports_credentials` (et NON `support_credentials`, kwarg inexistant
    #   silencieusement ignoré jusqu'ici) : autorise l'envoi du cookie de session.
    # - Origins EXPLICITES par env (jamais `*` avec credentials : rejeté par les
    #   navigateurs, et faille sinon). CORS_ALLOWED_ORIGINS = liste séparée par
    #   des virgules/points-virgules, à définir par environnement (dev/test/prod
    #   + éventuel front cross-origin). Défaut = front de dev craco uniquement.
    cors_origins_env = os.environ.get("CORS_ALLOWED_ORIGINS", "").strip()
    if cors_origins_env:
        cors_origins = [o.strip() for o in re.split(r"[;,]", cors_origins_env) if o.strip()]
    else:
        cors_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
    CORS(app, origins=cors_origins, supports_credentials=True)

    # Cookies de session : SameSite=Lax (le front est same-origin en prod, servi
    # par Flask) + Secure activable par env (désactivable en dev http local).
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_COOKIE_SECURE"] = (
        os.environ.get("SESSION_COOKIE_SECURE", "true").lower() != "false"
    )

    # Init SQL Database
    from logincomponent.server.models import init_db

    init_db(app)

    # Init login manager
    from logincomponent.server.auth import init_logging_manager

    init_logging_manager(app)

    # Init mailing system
    from logincomponent.server.mailing import init_mailing

    init_mailing(app)

    # BluePrint for auth part of app
    from logincomponent.server.auth import auth_blueprint

    app.register_blueprint(auth_blueprint)

    # BluePrint for User registering / connection part of app
    from logincomponent.server.user import connected_user as connected_user_blueprint

    app.register_blueprint(connected_user_blueprint)

    # Blueprint for paiement part
    from logincomponent.server.stripe import stripe_blueprint

    app.register_blueprint(stripe_blueprint)

    # Blueprint for User interaction part of app
    from .views import sankeyapp as main_blueprint

    app.register_blueprint(main_blueprint)

    # Blueprint for OpenSankey part of app
    from opensankey.server.views import opensankey
    app.register_blueprint(opensankey, url_prefix="/opensankey")

    # Auth SaaS sur les endpoints de TRAITEMENT d'OpenSankey (conversion / import).
    # OpenSankey (open-source) reste inchangé : la politique d'auth vit ici, dans la
    # couche SaaS, via un before_request. On protège par liste explicite de préfixes
    # — le shell de l'app (/opensankey/, /opensankey/<adress>), les menus, exemples
    # et tutoriels restent publics. En mode publié (site statique) le serveur ne
    # tourne pas : ces routes ne sont jamais atteintes.
    #
    # NB : on ne protège PAS /opensankey/upload/* — ses 4 routes (check_process,
    # retrieve_result, retrieve_json, clean) sont des étapes de continuation /
    # nettoyage purement session-scoped (elles n'opèrent que sur l'état du process
    # de la session courante et ne reçoivent aucun fichier). Le vrai point d'entrée
    # d'un upload utilisateur est convert/launch (input_format excel/json), qui
    # reste protégé ci-dessous ; seul le chargement d'exemple public y est exempté.
    protected_prefixes = (
        "/opensankey/convert/",
        "/opensankey/open_sankeymatic",
        "/opensankey/url/load_json",
    )

    @app.before_request
    def _require_login_for_opensankey_processing():
        from flask import request
        from flask_login import current_user

        path = request.path
        if any(path.startswith(p) for p in protected_prefixes):
            # Chargement d'un exemple/tutoriel public (sankeythèque) : passe par
            # convert/launch mais reste accessible sans compte, conformément à la
            # politique « menus, exemples et tutoriels restent publics ».
            if path == "/opensankey/convert/launch":
                input_format = request.form.get("input_format", "")
                if input_format in ("example_json", "example_excel"):
                    return
            if not current_user.is_authenticated:
                return jsonify({"error": "authentication required"}), 401
    # from opensankey.doc import doc as opensankey_doc
    # app.register_blueprint(opensankey_doc, url_prefix='/doc')

    # TODO quoi faire avec ça ?
    # app.register_blueprint(sankeytools, url_prefix='/sankeytools')
    # app.register_blueprint(sankeydev, url_prefix='/sankeydev')

    # Health-check PUBLIC (jamais derrière @login_required) : consommé par le
    # `curl -f` de fin de job CI / restart_site.sh et par le monitoring externe.
    # Renvoie 200 seulement si la base répond (SELECT 1), sinon 503 → le deploy
    # échoue au lieu de laisser un site cassé en ligne.
    @app.route("/health")
    def health():
        from sqlalchemy import text
        from logincomponent.server.models import db

        payload = {"status": "ok", "version": _app_version()}
        try:
            db.session.execute(text("SELECT 1"))
        except Exception:
            db.session.rollback()
            payload["status"] = "error"
            payload["database"] = "unreachable"
            return jsonify(payload), 503
        return jsonify(payload), 200

    # 404 handler
    def page_not_found(e):
        try:
            return redirect("/")
        except Exception:
            return "404 not found"

    app.register_error_handler(404, page_not_found)

    return app
