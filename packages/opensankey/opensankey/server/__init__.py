# Flask imports
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_cors import CORS


# Global variables
db = SQLAlchemy()


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
        # since the user_id is just the primary key of our user table, use it in the query for the user
        return User.query.get(int(user_id))

    # BluePrint for auth part of app
    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)

    # BluePrint for user_connected part of app
    from .models import connected_user as connected_user_blueprint
    app.register_blueprint(connected_user_blueprint)

    # Blueprint for OpenSankey part of app
    from .views import opensankey as main_blueprint
    app.register_blueprint(main_blueprint)
    return app
