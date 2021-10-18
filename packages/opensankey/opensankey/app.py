from server import create_app
import flaskfilemanager
import os

app = create_app()
app.secret_key = 'super secret key'
app.config['SESSION_TYPE'] = 'filesystem'
parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
app.config['FLASKFILEMANAGER_FILE_PATH'] = os.path.join(parent_dir, 'users-folders')
flaskfilemanager.init(app)

if __name__ == "__main__":
    app.run(debug=True)
