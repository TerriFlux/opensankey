# coding: utf-8
"""
Configuration centralisée du logging serveur (issue #256 — observabilité).

Un seul point de configuration pour toute l'application :

- format structuré ``key=value`` grep-able (``ts=... level=... req_id=... msg=...``) ;
- niveau et destination pilotés par l'environnement
  (``LOG_LEVEL``, ``LOG_FILE`` + rotation, sinon stderr capté par uWSGI/systemd) ;
- un identifiant de requête (``request_id``) injecté dans CHAQUE ligne émise
  pendant le traitement d'une requête, pour relier entre elles toutes les traces
  d'un même appel (y compris celles des sous-modules via le logger racine).

Le request-id est posé sur ``flask.g`` par ``install_request_logging`` (hooks
before/after_request) et récupéré ici via un ``logging.Filter``.
"""
import logging
import os
import time
import uuid
from logging.handlers import RotatingFileHandler

from flask import g, has_request_context, request

# En-tête HTTP porteur du request-id (entrant : corrélation amont ; sortant :
# renvoyé au client pour qu'il puisse le citer dans un rapport de bug).
REQUEST_ID_HEADER = "X-Request-Id"

_CONFIGURED = False


class RequestIdFilter(logging.Filter):
    """Injecte ``record.request_id`` (``g.request_id`` en contexte requête, ``-`` sinon)."""

    def filter(self, record):
        if has_request_context():
            record.request_id = getattr(g, "request_id", "-")
        else:
            record.request_id = "-"
        return True


def _build_formatter():
    # Champs à valeur sans espace en tête (grep-ables), message libre en dernier.
    return logging.Formatter(
        "ts=%(asctime)s level=%(levelname)s logger=%(name)s "
        "req_id=%(request_id)s msg=%(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S%z",
    )


def configure_logging(app):
    """Configure le logger racine. Idempotent (create_app peut être rappelé en test)."""
    global _CONFIGURED
    if _CONFIGURED:
        return
    _CONFIGURED = True

    level_name = os.environ.get("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    log_file = os.environ.get("LOG_FILE", "").strip()
    if log_file:
        max_bytes = int(os.environ.get("LOG_MAX_BYTES", str(10 * 1024 * 1024)))
        backups = int(os.environ.get("LOG_BACKUP_COUNT", "5"))
        handler = RotatingFileHandler(
            log_file, maxBytes=max_bytes, backupCount=backups, encoding="utf-8"
        )
    else:
        # stderr : capté par uWSGI / systemd-journald en déploiement.
        handler = logging.StreamHandler()

    handler.setFormatter(_build_formatter())
    handler.addFilter(RequestIdFilter())

    root = logging.getLogger()
    root.setLevel(level)
    # Repartir d'un seul handler : évite l'empilement (double lignes) si la config
    # racine a déjà été touchée ailleurs (Flask, basicConfig d'un import, re-init).
    for existing in list(root.handlers):
        root.removeHandler(existing)
    root.addHandler(handler)

    # Werkzeug (serveur de dev) : même niveau, il hérite du handler racine.
    logging.getLogger("werkzeug").setLevel(level)

    app.logger.info(
        "logging configuré level=%s sink=%s",
        level_name, ("file:" + log_file) if log_file else "stderr",
    )


def install_request_logging(app):
    """Pose les hooks request-id + log d'accès (une ligne par requête terminée)."""

    @app.before_request
    def _assign_request_id():
        incoming = request.headers.get(REQUEST_ID_HEADER)
        g.request_id = incoming if incoming else uuid.uuid4().hex[:16]
        g._request_started_at = time.perf_counter()

    @app.after_request
    def _log_access(response):
        try:
            response.headers[REQUEST_ID_HEADER] = getattr(g, "request_id", "-")
            started = getattr(g, "_request_started_at", None)
            dur_ms = (time.perf_counter() - started) * 1000.0 if started else -1.0
            # HTTP_X_FORWARDED_FOR d'abord (derrière le reverse-proxy uWSGI/nginx).
            ip = request.environ.get("HTTP_X_FORWARDED_FOR", request.remote_addr) or "-"
            app.logger.info(
                "access method=%s path=%s status=%s dur_ms=%.1f ip=%s",
                request.method, request.path, response.status_code, dur_ms, ip,
            )
        except Exception:
            # Le logging ne doit jamais casser une réponse.
            pass
        return response
