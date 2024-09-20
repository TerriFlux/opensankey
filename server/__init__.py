import os
# Flask imports
from flask import redirect
from flask import Blueprint
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_cors import CORS
from opensankey.server.views import opensankey
# from opensankey.doc import doc as opensankey_doc
# from sankeytools.server import sankeytools
# from SankeyDev import sankeydev

# Global variables
db = SQLAlchemy()

# Create sankey_suite app blueprint
template_folder = os.path.join(
    os.path.join(
        os.path.dirname(
            os.path.dirname(
                os.path.abspath(__file__))),
        'client'),
    'build'
)
static_folder = os.path.join(
    os.path.join(
        os.path.join(
            os.path.dirname(
                os.path.dirname(
                    os.path.abspath(__file__))),
            'client'),
        'build'),
    'static'
)
sankeyapp = Blueprint(
    'sankeyapp',
    __name__,
    static_folder=static_folder,
    template_folder=template_folder,
    static_url_path='/static/sankeyapp'
)

from . import views # noqa


# Global functions
def create_app():
    app = Flask(__name__)
    CORS(app, support_credentials=True)

    # Init SQL Database
    app.config['SECRET_KEY'] = 'secret-key-goes-here'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite'
    db.init_app(app)

    # Init login manager
    login_manager = LoginManager()
    login_manager.login_view = 'auth.login_post'
    login_manager.init_app(app)

    from .models import User

    @login_manager.user_loader
    def load_user(user_id):
        # since the user_id is just the primary key of our user table,
        # use it in the query for the user
        return User.query.get(int(user_id))

    # BluePrint for auth part of app
    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)

    # BluePrint for user_connected part of app
    from .models import connected_user as connected_user_blueprint
    app.register_blueprint(connected_user_blueprint)

    # Blueprint for OpenSankey part of app
    from . import sankeyapp as main_blueprint
    app.register_blueprint(main_blueprint)
    app.register_blueprint(opensankey, url_prefix='/opensankey')
    # app.register_blueprint(sankeytools, url_prefix='/sankeytools')
    # app.register_blueprint(sankeydev, url_prefix='/sankeydev')
    # app.register_blueprint(opensankey_doc, url_prefix='/doc')

    # 404 handler
    def page_not_found(e):
        try:
            return redirect("/")
        except Exception:
            return '404 not found'
    app.register_error_handler(404, page_not_found)

    return app
