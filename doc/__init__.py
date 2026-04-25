import os
from flask import Blueprint


build_root = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), 'build', 'html'
)

doc = Blueprint(
    'doc', __name__,
    static_folder=build_root,
    static_url_path='',
)

from . import views  # noqa
