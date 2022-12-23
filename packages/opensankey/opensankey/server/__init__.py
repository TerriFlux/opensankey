from flask import Flask
from flask import Blueprint
import os
from . import views
views  # silence linter

template_folder = os.path.join(
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'client'),
    'build'
)
static_folder = os.path.join(
    os.path.join(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'client'), 'build'),
    'static'
)
opensankey = Blueprint(
    'opensankey',
    __name__,
    static_folder=static_folder,
    template_folder=template_folder,
    static_url_path='/static/opensankey'
)


def create_app():
    app = Flask(__name__)
    from . import opensankey as main_blueprint
    app.register_blueprint(main_blueprint)
    return app
