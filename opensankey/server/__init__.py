# Flask imports
from flask import Flask
from flask import redirect


# Global functions
def create_app():
    app = Flask(__name__)

    # Init SQL Database
    app.config["SECRET_KEY"] = "secret-key-goes-here"

    # Blueprint for OpenSankey part of app
    from .views import opensankey
    app.register_blueprint(opensankey)

    # 404 handler
    def page_not_found(e):
        try:
            return redirect("/")
        except Exception:
            return "404 not found"

    app.register_error_handler(404, page_not_found)

    return app
