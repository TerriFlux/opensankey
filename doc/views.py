import os
from flask import abort, redirect, send_from_directory
from . import doc, build_root


DEFAULT_LANG = 'fr'
SUPPORTED_LANGS = ('fr', 'en')


@doc.route('/')
def index():
    return redirect(f'/doc/{DEFAULT_LANG}/index.html')


@doc.route('/<lang>/')
def lang_index(lang):
    if lang not in SUPPORTED_LANGS:
        abort(404)
    return redirect(f'/doc/{lang}/index.html')


@doc.route('/<lang>/<path:filename>')
def serve(lang, filename):
    if lang not in SUPPORTED_LANGS:
        abort(404)
    return send_from_directory(os.path.join(build_root, lang), filename)


@doc.route('/<path:legacy_path>')
def legacy_redirect(legacy_path):
    first_segment = legacy_path.split('/', 1)[0]
    if first_segment in SUPPORTED_LANGS:
        abort(404)
    return redirect(f'/doc/{DEFAULT_LANG}/{legacy_path}')
