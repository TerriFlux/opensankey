# Flask imports
from flask import Flask


# Global functions
def create_app():
    app = Flask(__name__)

    # Init SQL Database
    app.config['SECRET_KEY'] = 'secret-key-goes-here'

    # Blueprint for OpenSankey part of app
    from .views import opensankey as main_blueprint
    app.register_blueprint(main_blueprint)
    return app
