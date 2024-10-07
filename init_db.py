#  coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de création : 27/02/2023

from server import db, create_app


app = create_app()
with app.app_context():
    db.create_all()
