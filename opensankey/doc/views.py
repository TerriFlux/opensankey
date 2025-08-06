from flask import render_template
from flask import redirect
from . import doc


@doc.route("/")
def index():
    return redirect("user.html")


@doc.route("/<adress>")
def goto(adress):
    return render_template(adress)


@doc.route("/_images/<path>")
def image(path):
    return doc.send_static_file(path)
