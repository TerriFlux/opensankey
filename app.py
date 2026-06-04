#  coding: utf-8
import flaskfilemanager
import os
import secrets

# SankeyData (tutoriels/templates servis) est le submodule a la racine de ce
# checkout. opensankey etant installe (copie) en site-packages cote serveur, il
# ne peut pas deduire ce chemin depuis son propre __file__ ; on le lui transmet
# via l'env SANKEY_DATA. setdefault => un vrai env pose a la main reste prioritaire.
os.environ.setdefault(
    "SANKEY_DATA",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "SankeyData"),
)

try:
    from .server import create_app
except Exception:
    from server import create_app

try:
    from .doc import doc as doc_blueprint
except Exception:
    from doc import doc as doc_blueprint

app = create_app()
app.register_blueprint(doc_blueprint, url_prefix="/doc")
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or secrets.token_urlsafe(64)
app.config["SESSION_TYPE"] = "filesystem"
mfa_data_dir = os.environ.get("MFAData")
app.config["FLASKFILEMANAGER_FILE_PATH"] = os.path.join(mfa_data_dir)
flaskfilemanager.init(app)

if __name__ == "__main__":
    app.run(debug=True)
