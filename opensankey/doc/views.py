from flask import render_template
from . import doc

@doc.route('/')
def index():
    return render_template('index.html')

@doc.route('/<adress>')
def goto(adress):
    return render_template(adress)

@doc.route('/_images/<path>')
def image(path):
    return doc.send_static_file(path)

