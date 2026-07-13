#  coding: utf-8
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

# Gestionnaire de fichiers /fm (flaskfilemanager) RETIRÉ (#257) : il n'était plus
# utilisé par le front et exposait toute l'arborescence MFAData (données clients)
# SANS authentification — listage, téléchargement (/fm/userfiles/<chemin>) ET
# suppression étaient accessibles en anonyme (la lib ne protège rien par défaut,
# et sa route userfiles n'est de toute façon jamais gardée). On supprime la
# surface d'attaque plutôt que de la garder. MFAData reste servi/écrit par le
# reste de l'app (parser, solveur) via la variable d'environnement MFAData.

if __name__ == "__main__":
    app.run(debug=True)
