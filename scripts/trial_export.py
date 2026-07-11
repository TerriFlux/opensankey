#!/usr/bin/env python
# coding: utf-8
"""
Export CSV des événements d'essai gratuit (mesure de conversion).

Colonnes : created_at, event, plan, utm_campaign, user_id, user_email

Usage (CWD = racine de l'app pour db.sqlite) :
    python scripts/trial_export.py            # -> stdout
    python scripts/trial_export.py out.csv    # -> fichier
"""
import csv
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server import create_app  # noqa: E402
from logincomponent.server.models import User, TrialEvent  # noqa: E402

FIELDS = ["created_at", "event", "plan", "utm_campaign", "user_id", "user_email"]


def run(out_path=None):
    app = create_app()
    with app.app_context():
        rows = []
        for ev in TrialEvent.query.order_by(TrialEvent.created_at).all():
            email = ""
            if ev.user_id is not None:
                user = User.query.get(ev.user_id)
                email = user.email if user is not None else ""
            rows.append(
                {
                    "created_at": ev.created_at,
                    "event": ev.event,
                    "plan": ev.plan,
                    "utm_campaign": ev.utm_campaign or "",
                    "user_id": ev.user_id if ev.user_id is not None else "",
                    "user_email": email,
                }
            )

    if out_path:
        f = open(out_path, "w", newline="", encoding="utf-8")
    else:
        f = sys.stdout
    try:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    finally:
        if out_path:
            f.close()
    if out_path:
        print("trial_export: {0} événements -> {1}".format(len(rows), out_path))


if __name__ == "__main__":
    run(sys.argv[1] if len(sys.argv) > 1 else None)
