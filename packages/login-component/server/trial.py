# coding: utf-8
#
# Essai gratuit 30 jours (OpenSankey+ / SankeySuite) — géré en base, sans carte.
# Le déclenchement et l'état d'essai vivent ici ; les droits d'accès sont lus
# depuis les colonnes trial_* du modèle User (jamais depuis Stripe).

# ---------------------------------------------------------------
# Flask imports
from flask import Blueprint
from flask import jsonify
from flask import request
from flask_login import current_user

# Local imports
from .models import db
from .models import record_trial_event
from .mailing import send_trial_welcome_mail
from .mailing import send_trial_admin_notification

# ---------------------------------------------------------------
# Blueprint
trial_blueprint = Blueprint("trial_blueprint", __name__)


@trial_blueprint.route("/trial/start", methods=["POST"])
def trial_start():
    """
    Démarre un essai gratuit de 30 jours pour le plan demandé (sans carte).

    Requiert un compte connecté (le bouton du site redirige vers l'app, qui
    invite à créer/se connecter puis rappelle cette route en conservant l'UTM).

    Input JSON
    - 'plan' (String) : 'plus' | 'suite'
    - 'lang' (String) : langue de l'email de bienvenue ('fr' | 'en')

    Output JSON
    - 'ok' (Boolean) : True si l'essai vient d'être démarré
    - 'reason' (String) : 'ok' | 'invalid_plan' | 'already_used' | 'has_license'
    - 'trial' (Object) : état d'essai à jour
    """
    if not current_user.is_authenticated:
        return jsonify({"ok": False, "reason": "auth_required"}), 401

    data = request.get_json(silent=True) or {}
    plan = data.get("plan")
    lang = data.get("lang", "fr")

    ok, reason = current_user.start_trial(plan)
    if not ok:
        return jsonify({"ok": False, "reason": reason, "trial": current_user.trial_state()}), 200

    # Journalise l'événement de mesure (plan + UTM d'origine du compte)
    record_trial_event(current_user, "started", plan)

    # Email J0 (bienvenue). Pour SankeySuite : propose le créneau accompagné.
    try:
        send_trial_welcome_mail(current_user, plan, lang)
    except Exception as excpt:  # noqa: BLE001 — l'email ne doit pas bloquer le démarrage
        print("send_trial_welcome_mail error : " + str(excpt))

    # Notification admin (best-effort) : « nouvel essai démarré »
    try:
        send_trial_admin_notification(current_user, plan)
    except Exception as excpt:  # noqa: BLE001 — l'email ne doit pas bloquer le démarrage
        print("send_trial_admin_notification error : " + str(excpt))

    return jsonify({"ok": True, "reason": "ok", "trial": current_user.trial_state()}), 200


@trial_blueprint.route("/trial/state", methods=["GET"])
def trial_state():
    """
    État d'essai du compte connecté (bandeau, boutons, droits front).
    Répond un état neutre (pas d'essai) si aucun compte n'est connecté.
    """
    if not current_user.is_authenticated:
        return jsonify(
            {
                "plan": None,
                "ends_at": None,
                "days_remaining": 0,
                "active_plus": False,
                "active_suite": False,
                "used_plus": False,
                "used_suite": False,
                "can_start_plus": False,
                "can_start_suite": False,
            }
        ), 200
    return jsonify(current_user.trial_state()), 200


@trial_blueprint.route("/trial/converted", methods=["POST"])
def trial_converted():
    """
    Journalise la conversion d'un essai en abonnement payant (mesure).
    Appelée depuis le flux de retour de paiement quand un essai est actif.
    Best-effort, idempotence assurée côté appelant.
    """
    if not current_user.is_authenticated:
        return jsonify({"ok": False, "reason": "auth_required"}), 401
    plan = current_user.trial_plan
    record_trial_event(current_user, "converted", plan)
    db.session.commit()
    return jsonify({"ok": True}), 200
