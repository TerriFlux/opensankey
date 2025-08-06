#!python
# coding: utf-8

# ---------------------------------------------------------------
# External libs
import flaskfilemanager
import os

# Local libs
try:
    from opensankey.server import create_app
except Exception:
    from .server import create_app
try:
    from opensankey.doc import doc as doc_blueprint
except Exception:
    from .doc import doc as doc_blueprint

# --------------------------------------------------------------
app = create_app()
app.register_blueprint(doc_blueprint, url_prefix="/doc")
app.secret_key = "super secret key"
app.config["SESSION_TYPE"] = "filesystem"
mfa_data_dir = os.environ.get("MFAData")
app.config["FLASKFILEMANAGER_FILE_PATH"] = os.path.join(mfa_data_dir)
flaskfilemanager.init(app)

if __name__ == "__main__":
    app.run(debug=True)
