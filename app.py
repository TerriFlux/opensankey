#  coding: utf-8
import flaskfilemanager
import os

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
# FLASK_SECRET_KEY est OBLIGATOIRE : un fallback aléatoire invaliderait toutes les
# sessions à chaque redémarrage (déconnexion des utilisateurs) et masquerait une
# mauvaise config en prod. On échoue au boot si la clé n'est pas fournie.
_flask_secret_key = os.environ.get("FLASK_SECRET_KEY")
if not _flask_secret_key:
    raise RuntimeError(
        "FLASK_SECRET_KEY manquant : définir cette variable d'environnement "
        "(clé stable et secrète, ex. `python -c \"import secrets; "
        "print(secrets.token_urlsafe(64))\"`) avant de démarrer l'application."
    )
app.secret_key = _flask_secret_key
app.config["SESSION_TYPE"] = "filesystem"
mfa_data_dir = os.environ.get("MFAData")
app.config["FLASKFILEMANAGER_FILE_PATH"] = os.path.join(mfa_data_dir)
flaskfilemanager.init(app)

if __name__ == "__main__":
    app.run(debug=True)
