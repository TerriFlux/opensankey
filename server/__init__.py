# coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de modification : 26/09/2024

# ---------------------------------------------------------------
# Flask imports
from flask import redirect
from flask import Flask
from flask_cors import CORS

# ---------------------------------------------------------------
# Global functions
def create_app():
    # Instanciate app
    app = Flask(__name__, template_folder='./templates')

    # Set up CORS (Cross-Origin)
    CORS(app, support_credentials=True)

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
    from opensankey.server.views import converter_funct
    from opensankey.server.converter import extract_json_from_sankey
    from opensankey.server.converter import extract_sankey_from_json
    converter_funct['extract_json_from_sankey'] = extract_json_from_sankey
    converter_funct['extract_sankey_from_json'] = extract_sankey_from_json
    app.register_blueprint(opensankey, url_prefix='/opensankey')
    # from opensankey.doc import doc as opensankey_doc
    # app.register_blueprint(opensankey_doc, url_prefix='/doc')

    # TODO quoi faire avec ça ?
    # app.register_blueprint(sankeytools, url_prefix='/sankeytools')
    # app.register_blueprint(sankeydev, url_prefix='/sankeydev')

    # 404 handler
    def page_not_found(e):
        try:
            return redirect("/")
        except Exception:
            return '404 not found'
    app.register_error_handler(404, page_not_found)

    return app
