#!/usr/bin/env python
# coding: utf-8
"""
Rappels d'essai gratuit (J-7, J-0) + journalisation de l'expiration.

À exécuter une fois par jour via cron (le serveur uWSGI n'a pas de scheduler
in-process). Best-effort et idempotent : chaque rappel n'est envoyé qu'une fois
par essai (colonnes trial_reminded_j7 / trial_reminded_j0), et l'événement
'expired' n'est journalisé qu'une fois (trial_expired_handled).

Exemple crontab (utilisateur applicatif, CWD = racine de l'app pour db.sqlite) :

    # tous les jours à 08:00
    0 8 * * *  cd /var/www/sankeyapp && \
        venv/bin/python scripts/trial_reminders.py >> logs/trial_reminders.log 2>&1
"""
import os
import sys

# Racine du repo dans le path pour importer `server`
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server import create_app  # noqa: E402
from logincomponent.server.models import db, User, record_trial_event  # noqa: E402
from logincomponent.server.mailing import send_trial_reminder_mail  # noqa: E402

# Seuil du rappel J-7 : on envoie dès qu'il reste 7 jours ou moins (résilient à
# un cron manqué), tant que l'essai est encore actif et que J-7 n'a pas été envoyé.
J7_THRESHOLD_DAYS = 7


def run():
    app = create_app()
    sent_j7 = 0
    sent_j0 = 0
    expired = 0
    with app.app_context():
        # Seuls les comptes ayant (eu) un essai nous intéressent
        users = User.query.filter(User.trial_plan.isnot(None)).all()
        for user in users:
            if not user.trial_ends_at:
                continue
            active = user.has_active_trial()
            days = user.trial_days_remaining()

            # Rappel J-7 : essai actif, il reste <= 7 jours, pas encore envoyé
            if active and days <= J7_THRESHOLD_DAYS and not user.trial_reminded_j7:
                try:
                    send_trial_reminder_mail(user, days, "fr")
                    user.trial_reminded_j7 = True
                    db.session.commit()
                    sent_j7 += 1
                except Exception as e:  # noqa: BLE001
                    db.session.rollback()
                    print("WARN J-7 reminder failed for user {0}: {1}".format(user.id, e))

            # Rappel J-0 : essai terminé (ou se terminant aujourd'hui), pas encore envoyé
            if (not active) and (not user.trial_reminded_j0):
                try:
                    send_trial_reminder_mail(user, 0, "fr")
                    user.trial_reminded_j0 = True
                    db.session.commit()
                    sent_j0 += 1
                except Exception as e:  # noqa: BLE001
                    db.session.rollback()
                    print("WARN J-0 reminder failed for user {0}: {1}".format(user.id, e))

            # Événement d'expiration (mesure) : une seule fois
            if (not active) and (not user.trial_expired_handled):
                record_trial_event(user, "expired", user.trial_plan)
                user.trial_expired_handled = True
                db.session.commit()
                expired += 1

    print("trial_reminders: J-7={0} J-0={1} expired={2}".format(sent_j7, sent_j0, expired))


if __name__ == "__main__":
    run()
