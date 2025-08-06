import os
from flask import Blueprint


template_folder = os.path.join(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "build"), "html"
)
static_folder = os.path.join(
    os.path.join(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "build"), "html"
    ),
    "_static",
)
doc = Blueprint(
    "doc", __name__, static_folder=static_folder, template_folder=template_folder
)

from . import views  # noqa
