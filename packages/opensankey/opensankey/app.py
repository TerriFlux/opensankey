try:
    from .server import create_app
except Exception:
    from server import create_app
import flaskfilemanager
import os

app = create_app()
app.secret_key = 'super secret key'
app.config['SESSION_TYPE'] = 'filesystem'
mfa_data_dir = os.environ.get('MFAData')
#parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
app.config['FLASKFILEMANAGER_FILE_PATH'] = os.path.join(mfa_data_dir)
flaskfilemanager.init(app)

if __name__ == "__main__":
    app.run(debug=True)
