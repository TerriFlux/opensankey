# coding: utf-8
"""
Garde d'authentification commune aux surfaces d'administration (issue #256).

`dev_required` vivait dans `admin_metrics.py` et était ré-importé par
`admin_users.py` avec un fallback qui en dupliquait tout le corps. Les deux
blueprints d'admin partagent désormais cette unique définition : une seule
politique d'accès, pas de dérive possible.
"""
import json
from functools import wraps

from flask import Response
from flask_login import current_user


def dev_required(view):
    """Réserve l'accès aux comptes développeur : 401 si anonyme, 403 sinon.

    Réponses en JSON (et non une redirection vers la page de login) : ces
    surfaces sont consommées aussi bien en navigation qu'en fetch.
    """
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not current_user.is_authenticated:
            return Response(
                json.dumps({"error": "authentication required"}),
                status=401,
                mimetype="application/json",
            )
        if not bool(getattr(current_user, "is_developer", False)):
            return Response(
                json.dumps({"error": "forbidden"}),
                status=403,
                mimetype="application/json",
            )
        return view(*args, **kwargs)
    return wrapped
