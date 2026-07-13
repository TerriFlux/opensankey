#!/usr/bin/env python
# coding: utf-8
"""
Purge des comptes désactivés dont la fenêtre de rétractation est écoulée (issue #270).

Un compte désactivé (clic sur « supprimer mon compte » dans un mail de campagne)
n'est pas supprimé sur-le-champ : il porte `deactivated_at` et `purge_after`
(J+30). Ce script fait la suppression physique une fois la date passée.

Pourquoi ce délai : un lien GET dans un mail est pré-chargé par les scanners de
sécurité (Outlook SafeLinks, antivirus, proxys d'entreprise). Sans fenêtre, une
campagne supprimerait des comptes que personne n'a cliqués, sans retour arrière.
Pendant les 30 jours, une reconnexion, le lien « annuler » ou l'admin rétablissent
le compte.

DRY-RUN PAR DÉFAUT : sans `--apply`, le script liste ce qu'il supprimerait et
ne touche à rien.

    # inspection
    venv/bin/python scripts/purge_deactivated.py

    # suppression réelle, une fois par jour (crontab de l'utilisateur applicatif,
    # CWD = racine de l'app pour trouver db.sqlite)
    30 3 * * *  cd /var/www/sankeyapp && \
        venv/bin/python scripts/purge_deactivated.py --apply >> logs/purge.log 2>&1

La ligne `campaign_recipient` du compte n'est PAS supprimée (FK ON DELETE SET NULL) :
on garde la trace qu'une adresse s'est désinscrite, pour ne jamais la re-solliciter.
"""
import os
import shutil
import sys
from datetime import datetime

# Racine du repo dans le path pour importer `server`
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server import create_app  # noqa: E402
from logincomponent.server.models import db, User  # noqa: E402


def backup_db():
    """
    Copie de la base avant toute suppression. Sans elle, pas de purge.

    Le chemin vient de `db.engine.url` et NON de SQLALCHEMY_DATABASE_URI :
    l'URI est relative (`sqlite:///db.sqlite`) et Flask-SQLAlchemy la résout par
    rapport à `instance_path`, pas au répertoire courant. La déduire du CWD
    donnerait un chemin qui n'existe pas — ou, pire, un fichier voisin.
    À appeler dans un app_context.
    """
    src = db.engine.url.database
    if not src:
        raise RuntimeError("Base non-SQLite : backup manuel requis.")
    src = os.path.abspath(src)
    if not os.path.exists(src):
        raise RuntimeError("Base introuvable : {}".format(src))
    bk_dir = os.path.join(os.path.dirname(src), "db.sqlite.bk")
    os.makedirs(bk_dir, exist_ok=True)
    stamp = datetime.now().isoformat().replace(":", "-")
    dst = os.path.join(bk_dir, "db_purge_{}.sqlite".format(stamp))
    shutil.copy2(src, dst)
    return dst


def run(apply_changes=False):
    app = create_app()
    with app.app_context():
        candidates = [
            u
            for u in User.query.filter(User.purge_after.isnot(None)).all()
            if u.is_purge_due()
        ]

        if not candidates:
            print("purge_deactivated: rien à purger.")
            return

        print("purge_deactivated: {0} compte(s) à purger".format(len(candidates)))
        for u in candidates:
            print(
                "  #{0} {1} (désactivé le {2}, purge due le {3})".format(
                    u.id, u.email, (u.deactivated_at or "")[:10], (u.purge_after or "")[:10]
                )
            )

        if not apply_changes:
            print("purge_deactivated: DRY-RUN — rien supprimé. Relancer avec --apply.")
            return

        print("purge_deactivated: backup -> {0}".format(backup_db()))

        purged = 0
        for u in candidates:
            # Dernière vérification : un compte qui a acquis une licence entre temps
            # (support, geste commercial) ne doit pas disparaître.
            protection = u.campaign_protection()
            if protection in ("licensed", "trialing", "stripe", "developer"):
                print("  #{0} épargné ({1}) — désactivation levée.".format(u.id, protection))
                u.reactivate()
                db.session.commit()
                continue
            uid, email = u.id, u.email
            try:
                u.delete()  # cascade sur user_licenses ; SET NULL sur campaign_recipient
                purged += 1
                print("  #{0} {1} supprimé.".format(uid, email))
            except Exception as e:  # noqa: BLE001 — un compte récalcitrant ne bloque pas les autres
                db.session.rollback()
                print("  WARN #{0} non supprimé : {1}".format(uid, e))

        print("purge_deactivated: {0} compte(s) supprimé(s).".format(purged))


if __name__ == "__main__":
    run(apply_changes="--apply" in sys.argv)
