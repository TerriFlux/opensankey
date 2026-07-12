# coding: utf-8
"""
Mini-dashboard d'observabilité (issue #256, volet 3).

Rend enfin exploitable la table `metrics` — jusqu'ici **write-only** : alimentée
à chaque visite de la page d'accueil par `update_metrics()`, mais jamais relue
nulle part — et agrège les événements d'essai gratuit
(`cache/trial_events.jsonl`, écrits par les endpoints /api/trial/*).

Lecture seule, réservé aux comptes développeur (`is_developer`). Aucune donnée
nominative n'est exposée : un « visiteur » est un hash SHA-256 d'IP (cf.
`update_metrics`), et un essai est identifié par un UUID généré côté navigateur.
"""
import json
import os
import time

from flask import Blueprint, jsonify, render_template
from sqlalchemy import func

from logincomponent.server.models import db, Metrics, User

# Garde d'accès commune aux surfaces d'admin (cf. #256).
from .admin_auth import dev_required

# Source unique des chemins de stockage des essais (définis dans views.py).
from .views import _TRIAL_COUNTER_FILE, _TRIAL_EVENTS_FILE

admin_metrics = Blueprint("admin_metrics", __name__)

# Nombre d'événements d'essai les plus récents remontés dans le dashboard.
RECENT_EVENTS_LIMIT = 20
# Profondeur de la série journalière des démarrages d'essai.
DAILY_SERIES_DAYS = 30


def _current_epoch_day():
    """Jour courant dans le référentiel de `Metrics.last_visit`.

    Doit rester aligné sur `Metrics.new_visit()` (models.py), qui stocke
    `int(time.time() / 86400) - REF_EPOCH`. REF_EPOCH est requis par l'app ; on
    reste tolérant ici pour qu'un dashboard ne casse jamais le serveur.
    """
    try:
        ref = int(os.environ["REF_EPOCH"])
    except (KeyError, ValueError):
        return None
    return int(time.time() / (24 * 60 * 60)) - ref


def _metrics_summary():
    """Agrégats de la table `metrics` (une ligne = une IP hashée)."""
    total_visitors = db.session.query(func.count(Metrics.id)).scalar() or 0
    total_visits = db.session.query(
        func.coalesce(func.sum(Metrics.nb_visits), 0)
    ).scalar() or 0

    # Comptes dont les visites ne sont plus comptées (équipe) : développeurs
    # d'office + comptes marqués exclude_from_metrics (cf. views._visitor_is_internal).
    excluded_accounts = db.session.query(func.count(User.id)).filter(
        db.or_(User.is_developer.is_(True), User.exclude_from_metrics.is_(True))
    ).scalar() or 0

    summary = {
        # Nombre d'IP distinctes (hashées) ayant chargé la page d'accueil.
        "total_visitors": int(total_visitors),
        # `nb_visits` n'est incrémenté qu'UNE fois par jour et par IP
        # (cf. new_visit) : c'est donc un cumul de visites-jours, pas de hits.
        "total_visits": int(total_visits),
        "active_7d": None,
        "active_30d": None,
        "excluded_accounts": int(excluded_accounts),
    }

    today = _current_epoch_day()
    if today is not None:
        for label, days in (("active_7d", 7), ("active_30d", 30)):
            summary[label] = int(
                db.session.query(func.count(Metrics.id))
                .filter(Metrics.last_visit >= today - days)
                .scalar() or 0
            )
    return summary


def _read_trial_events():
    """Lit `trial_events.jsonl`. Renvoie (événements, nb_lignes_illisibles)."""
    events = []
    malformed = 0
    if not os.path.exists(_TRIAL_EVENTS_FILE):
        return events, malformed
    with open(_TRIAL_EVENTS_FILE, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                event = json.loads(line)
            except ValueError:
                # Ligne tronquée (écriture concurrente interrompue) : on la
                # compte sans faire échouer tout le dashboard.
                malformed += 1
                continue
            if isinstance(event, dict) and event.get("uuid"):
                events.append(event)
    return events, malformed


def _trials_summary():
    """Agrégats des essais gratuits, dérivés du journal d'événements."""
    events, malformed = _read_trial_events()

    # Premier timestamp vu par UUID, par type d'événement (un navigateur peut
    # rejouer un « started » : on ne compte l'essai qu'une fois).
    started, converted = {}, {}
    for event in events:
        uuid, ts = event.get("uuid"), event.get("ts")
        if event.get("event") == "started":
            started.setdefault(uuid, ts)
        elif event.get("event") == "converted":
            converted.setdefault(uuid, ts)

    nb_started, nb_converted = len(started), len(converted)

    # Compteur historique maintenu par _trial_record_event : il compte les
    # événements « started » (rejeux inclus), donc il peut dépasser le nombre
    # d'UUID distincts. On l'expose tel quel, à titre de recoupement.
    counter = None
    if os.path.exists(_TRIAL_COUNTER_FILE):
        try:
            with open(_TRIAL_COUNTER_FILE, encoding="utf-8") as f:
                counter = int(f.read().strip() or "0")
        except (ValueError, OSError):
            counter = None

    # Série journalière des démarrages (jours pleins, du plus ancien au plus récent).
    day_ms = 24 * 60 * 60 * 1000
    today_index = int(time.time() * 1000) // day_ms
    per_day = {}
    for ts in started.values():
        if not isinstance(ts, (int, float)):
            continue
        day = int(ts) // day_ms
        if today_index - DAILY_SERIES_DAYS < day <= today_index:
            per_day[day] = per_day.get(day, 0) + 1
    daily = [
        {
            "date": time.strftime("%Y-%m-%d", time.gmtime(day * day_ms / 1000)),
            "started": per_day.get(day, 0),
        }
        for day in range(today_index - DAILY_SERIES_DAYS + 1, today_index + 1)
    ]

    recent = sorted(
        (e for e in events if isinstance(e.get("ts"), (int, float))),
        key=lambda e: e["ts"],
        reverse=True,
    )[:RECENT_EVENTS_LIMIT]
    recent = [
        {
            "event": e.get("event"),
            "uuid": e.get("uuid"),
            "at": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(int(e["ts"]) / 1000)),
            "catchup": bool(e.get("catchup")),
        }
        for e in recent
    ]

    return {
        "started": nb_started,
        "converted": nb_converted,
        "conversion_rate": (nb_converted / nb_started) if nb_started else None,
        "started_events_counter": counter,
        "malformed_lines": malformed,
        "daily": daily,
        "recent": recent,
    }


def _summary():
    return {"metrics": _metrics_summary(), "trials": _trials_summary()}


@admin_metrics.route("/api/admin/metrics")
@dev_required
def api_admin_metrics():
    """Agrégats bruts (JSON) — sert aussi de source au dashboard HTML."""
    return jsonify(_summary()), 200


@admin_metrics.route("/admin/metrics")
@dev_required
def admin_metrics_page():
    """Mini-dashboard HTML (lecture seule)."""
    data = _summary()
    return render_template(
        "admin_metrics.html",
        metrics=data["metrics"],
        trials=data["trials"],
    )
