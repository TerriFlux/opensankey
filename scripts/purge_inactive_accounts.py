#!/usr/bin/env python
# coding: utf-8
"""
Comptes inactifs — RAPPORT SEUL, aucune suppression (issue #257).

Ce script N'EFFACE RIEN et n'en a pas les moyens : il ne fait que lire. C'est
délibéré. La purge n'a de sens qu'appuyée sur une trace d'activité fiable, or
`last_seen_at` vient tout juste d'être instrumentée (#257) : tant qu'elle n'a pas
tourné plusieurs mois, la seule information disponible sur un compte ancien est
sa date de création — sur laquelle supprimer reviendrait à effacer des comptes
parfaitement actifs.

On mesure d'abord, on supprimera ensuite, quand les données le permettront.

Usage :
    python scripts/purge_inactive_accounts.py [--months N] [--json]

    --months N   Seuil d'inactivité en mois (défaut : 24).
    --json       Sortie machine (pour un futur cron / dashboard).

Lecture de la base via la même config que l'app (fichier `env`).
"""
import argparse
import json
import os
import sys
from datetime import datetime, timedelta

# Rendre l'app importable quel que soit le répertoire d'appel.
_APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _APP_DIR not in sys.path:
    sys.path.insert(0, _APP_DIR)


def _parse_iso(value):
    """Date ISO (ou datetime ISO) -> datetime, ou None si illisible/absente."""
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value))
    except ValueError:
        return None


def _classify(user, cutoff):
    """Renvoie (statut, dernière_activité_connue).

    - `actif`        : vu après le seuil.
    - `inactif`      : vu avant le seuil (candidat à la purge).
    - `jamais_vu`    : aucune trace d'activité. On retombe sur la date de
      création, mais on NE LE TRAITE PAS comme un inactif : ces comptes sont
      antérieurs à l'instrumentation, on ne sait tout simplement RIEN d'eux.
    """
    last_seen = _parse_iso(getattr(user, "last_seen_at", None))
    if last_seen is None:
        return "jamais_vu", _parse_iso(getattr(user, "creation", None))
    return ("inactif" if last_seen < cutoff else "actif"), last_seen


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--months", type=int, default=24,
                        help="Seuil d'inactivité en mois (défaut : 24)")
    parser.add_argument("--json", action="store_true", help="Sortie JSON")
    args = parser.parse_args()

    from app import app  # charge l'env + la config comme le serveur
    from logincomponent.server.models import User

    cutoff = datetime.now() - timedelta(days=30 * args.months)

    with app.app_context():
        users = User.query.all()

    buckets = {"actif": [], "inactif": [], "jamais_vu": []}
    for user in users:
        status, seen = _classify(user, cutoff)
        buckets[status].append({
            "id": user.id,
            "email": user.email,
            "last_seen_at": getattr(user, "last_seen_at", None),
            "creation": getattr(user, "creation", None),
            "reference": seen.isoformat() if seen else None,
        })

    if args.json:
        print(json.dumps({
            "seuil_mois": args.months,
            "cutoff": cutoff.isoformat(),
            "total": len(users),
            "counts": {k: len(v) for k, v in buckets.items()},
            "inactifs": buckets["inactif"],
            "jamais_vus": buckets["jamais_vu"],
        }, indent=2, ensure_ascii=False))
        return

    print("=== Comptes inactifs — RAPPORT (aucune suppression) ===")
    print("Seuil : %d mois (avant %s)\n" % (args.months, cutoff.date().isoformat()))
    print("  total       : %d" % len(users))
    print("  actifs      : %d" % len(buckets["actif"]))
    print("  INACTIFS    : %d   (candidats à une purge future)" % len(buckets["inactif"]))
    print("  jamais vus  : %d   (antérieurs à l'instrumentation — on ne sait rien d'eux)"
          % len(buckets["jamais_vu"]))

    if buckets["inactif"]:
        print("\n--- Candidats (inactifs depuis plus de %d mois) ---" % args.months)
        for u in sorted(buckets["inactif"], key=lambda x: x["reference"] or ""):
            print("  #%-5s %-40s vu le %s" % (u["id"], u["email"], (u["reference"] or "?")[:10]))

    if buckets["jamais_vu"]:
        print("\n--- Sans trace d'activité (créés avant l'instrumentation) ---")
        print("    Ces comptes ne sont PAS des candidats : leur absence de trace ne")
        print("    prouve pas l'inactivité. Ils en deviendront après quelques mois de")
        print("    mesure, s'ils ne réapparaissent pas.")
        for u in sorted(buckets["jamais_vu"], key=lambda x: x["reference"] or "")[:20]:
            print("  #%-5s %-40s créé le %s" % (u["id"], u["email"], (u["reference"] or "?")[:10]))
        if len(buckets["jamais_vu"]) > 20:
            print("  … et %d autres" % (len(buckets["jamais_vu"]) - 20))

    print("\nAucun compte n'a été supprimé — ce script ne sait pas le faire.")


if __name__ == "__main__":
    main()
