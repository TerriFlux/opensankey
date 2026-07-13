# coding: utf-8
"""
Mode admin du site — gestion des utilisateurs (/admin/users).

Interface web d'administration des comptes, intégrée à l'appli et réservée aux
comptes `is_developer`. Une instance par environnement, servie par l'appli déjà
déployée : dev.opensankey.fr/admin/users, …/admin/users (test),
open-sankey.fr/admin/users (prod). Chaque instance pointe automatiquement sur SA
base — pas de tunnel, pas de process séparé.

Complète le mini-dashboard lecture seule /admin/metrics (issue #256) : ici on
gère (créer/éditer/supprimer, licences, essais, mot de passe, exclusion des
stats). Réutilise `dev_required` (server/admin_metrics.py) pour l'auth et les
modèles SQLAlchemy pour que chaque écriture passe par la vraie logique métier
(hash_password, start_trial, cascades).

L'environnement (dev|test|prod) est déduit du chemin de la base ; sur PROD,
toute écriture exige de cocher la confirmation et déclenche un backup
automatique préalable. Un jeton CSRF de session protège tous les formulaires
(en plus du cookie SameSite=Lax posé par create_app).
"""
import os
import secrets
import shutil
import string
import subprocess
from datetime import datetime

from flask import (
    Blueprint,
    flash,
    redirect,
    render_template_string,
    request,
    session,
    url_for,
)
from sqlalchemy import func, or_

from logincomponent.server.models import (
    db,
    User,
    License,
    UserLicences,
    hash_password,
    user_excluded_from_metrics,
)

# Auth commune aux surfaces d'admin : 401 si anonyme, 403 si connecté mais
# non-développeur. Définie une seule fois dans admin_auth (cf. #256).
from .admin_auth import dev_required

try:
    from logincomponent.server.models import TRIAL_PLANS
except ImportError:
    TRIAL_PLANS = ("plus", "suite")

try:
    from logincomponent.server.models import validate_password
except ImportError:
    def validate_password(pwd):
        return isinstance(pwd, str) and len(pwd) >= 8


admin_users = Blueprint("admin_users", __name__)


# ---------------------------------------------------------------------------
# CSRF
# ---------------------------------------------------------------------------

def csrf_token():
    tok = session.get("_adminusers_csrf")
    if not tok:
        tok = secrets.token_hex(16)
        session["_adminusers_csrf"] = tok
    return tok


def check_csrf():
    return bool(session.get("_adminusers_csrf")) and (
        request.form.get("_csrf") == session.get("_adminusers_csrf")
    )


# ---------------------------------------------------------------------------
# Environnement, base, garde-fous
# ---------------------------------------------------------------------------

def db_file_path():
    try:
        path = db.engine.url.database
    except Exception:  # noqa
        return None
    return os.path.abspath(path) if path else None


def detect_env():
    p = (db_file_path() or "").replace("\\", "/").lower()
    for env in ("prod", "test", "dev"):
        if "/{}_opensankey/".format(env) in p:
            return env
    return "local"


def do_backup():
    src = db_file_path()
    if not src or not os.path.exists(src):
        raise RuntimeError("Aucun fichier de base à sauvegarder ({}).".format(src))
    bk_dir = os.path.join(os.path.dirname(src), "db.sqlite.bk")
    os.makedirs(bk_dir, exist_ok=True)
    stamp = datetime.now().isoformat().replace(":", "-")
    dst = os.path.join(bk_dir, "db_adminusers_{}.sqlite".format(stamp))
    if shutil.which("sqlite3"):
        subprocess.run(["sqlite3", src, ".backup '{}'".format(dst)], check=True)
    else:
        shutil.copy2(src, dst)
    return dst


def guard_write():
    """Vérifie CSRF, et sur prod exige la confirmation + backup. Retourne (ok, msg)."""
    if not check_csrf():
        return False, "Jeton de session invalide (recharge la page)."
    if detect_env() == "prod":
        if request.form.get("confirm_prod") != "on":
            return False, "Écriture PROD refusée : coche « Je confirme (PROD) »."
        try:
            dst = do_backup()
        except Exception as e:  # noqa
            return False, "Backup prod impossible, écriture annulée : {}".format(e)
        flash("Backup prod pris avant modification : {}".format(os.path.basename(dst)), "info")
    return True, ""


def gen_password(n=14):
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(n))


# ---------------------------------------------------------------------------
# Sérialisation
# ---------------------------------------------------------------------------

def user_licenses_rows(user):
    out = []
    for ul in user.user_licenses:
        if ul is None or ul.license is None:
            continue
        out.append(
            {
                "name": ul.license.name,
                "activated": bool(ul.activated),
                "expiry": ul.expiry,
                "valid": user.has_valid_license(ul.license.name),
            }
        )
    return out


# La règle d'exclusion vit dans models.user_excluded_from_metrics (source unique,
# partagée avec server/views.py qui décide de ne pas compter la visite).
excluded_from_metrics = user_excluded_from_metrics


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------

BASE_CSS = """
:root { --fg:#1a1a1a; --muted:#666; --line:#e2e2e2; --accent:#2563eb; --bg:#fafafa; }
* { box-sizing:border-box; }
body { font-family:-apple-system,Segoe UI,Roboto,sans-serif; margin:0; color:var(--fg);
       background:var(--bg); font-size:14px; }
a { color:var(--accent); text-decoration:none; } a:hover { text-decoration:underline; }
code { background:#eef1f6; padding:1px 5px; border-radius:4px; }
.env-banner { padding:8px 20px; font-weight:600; color:#fff; letter-spacing:.5px;
              display:flex; justify-content:space-between; }
.env-banner a { color:#fff; text-decoration:underline; opacity:.9; }
.env-dev   { background:#0891b2; } .env-test { background:#ca8a04; }
.env-prod  { background:#dc2626; } .env-local{ background:#475569; }
.wrap { max-width:1000px; margin:0 auto; padding:20px; }
.card { background:#fff; border:1px solid var(--line); border-radius:10px; padding:18px; margin-bottom:18px; }
h1 { font-size:20px; margin:0 0 4px; } h2 { font-size:15px; margin:0 0 12px; color:var(--muted);
     text-transform:uppercase; letter-spacing:.5px; }
table { width:100%; border-collapse:collapse; }
th,td { text-align:left; padding:8px 10px; border-bottom:1px solid var(--line); }
th { color:var(--muted); font-weight:600; font-size:12px; text-transform:uppercase; }
tr:hover td { background:#f6f8ff; }
input,select { padding:7px 9px; border:1px solid var(--line); border-radius:7px; font-size:14px; }
label { display:block; margin:8px 0 3px; color:var(--muted); font-size:12px; }
button { padding:8px 14px; border:0; border-radius:7px; background:var(--accent); color:#fff;
         font-size:14px; cursor:pointer; } button:hover { opacity:.9; }
button.ghost { background:#eef1f6; color:var(--fg); } button.danger { background:#dc2626; }
.badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:12px; background:#eef1f6; }
.badge.ok { background:#dcfce7; color:#166534; } .badge.off { background:#fee2e2; color:#991b1b; }
.flash { padding:10px 14px; border-radius:8px; margin-bottom:10px; }
.flash.info { background:#e0f2fe; color:#075985; } .flash.error { background:#fee2e2; color:#991b1b; }
.flash.ok { background:#dcfce7; color:#166534; }
.row { display:flex; gap:20px; flex-wrap:wrap; } .col { flex:1; min-width:240px; }
.confirm { margin:10px 0; padding:8px; background:#fef2f2; border:1px solid #fecaca; border-radius:7px; }
.meta { color:var(--muted); font-size:12px; }
.grid2 { display:grid; grid-template-columns:1fr 1fr; gap:8px 16px; }
"""

LAYOUT = """
<!doctype html><html lang=fr><head><meta charset=utf-8>
<meta name=viewport content="width=device-width, initial-scale=1">
<title>Admin comptes — {{ env|upper }}</title><style>{{ css }}</style></head><body>
<div class="env-banner env-{{ env }}">
  <span>BASE : {{ env|upper }} · {{ db_path }} · {{ counts.users }} comptes</span>
  <span><a href="{{ url_for('admin_users.home') }}">comptes</a> ·
        <a href="/admin/campaigns">campagnes ↗</a> ·
        <a href="/admin/metrics">métriques ↗</a></span>
</div>
<div class=wrap>
  {% with msgs = get_flashed_messages(with_categories=true) %}
    {% for cat, m in msgs %}<div class="flash {{ cat }}">{{ m }}</div>{% endfor %}
  {% endwith %}
  {{ body|safe }}
</div></body></html>
"""

HOME = """
<div class=card>
  <h1>Administration des comptes</h1>
  <p class=meta><a href="{{ url_for('admin_users.home') }}">↻ rafraîchir</a> ·
     {{ counts.users }} comptes · {{ counts.licenses }} licences ·
     <form method=post action="{{ url_for('admin_users.backup') }}" style="display:inline">
       <input type=hidden name=_csrf value="{{ csrf }}">
       {% if env=='prod' %}
       <label style="display:inline"><input type=checkbox name=confirm_prod> confirmer</label>
       {% endif %}
       <button class=ghost>Backup base</button></form>
  </p>
  <form method=get action="{{ url_for('admin_users.home') }}">
    <input name=q value="{{ q or '' }}" placeholder="chercher email / nom…" style="width:280px">
    <button>Chercher</button>
  </form>
</div>

<div class=card>
  <h2>Comptes {% if q %}(filtre : « {{ q }} »){% endif %} — {{ users|length }} affichés</h2>
  <table><tr><th>#</th><th>Email</th><th>Nom</th><th>Licences valides</th>
      <th>Essai</th><th>Dev</th><th>Hors stats</th></tr>
  {% for u in users %}
    <tr>
      <td>{{ u.id }}</td>
      <td><a href="{{ url_for('admin_users.user', uid=u.id) }}">{{ u.email }}</a></td>
      <td>{{ (u.firstname or '') }} {{ (u.name or '') }}</td>
      <td>{% for l in u._lics %}{% if l.valid %}<span class="badge ok">{{ l.name }}</span> {% endif %}{% endfor %}</td>
      <td>{% if u._trial %}<span class=badge>{{ u._trial }}</span>{% else %}—{% endif %}</td>
      <td>{{ 'oui' if u.is_developer else '' }}</td>
      <td>{% if u._excluded %}✓{% endif %}</td>
    </tr>
  {% endfor %}
  </table>
</div>

<div class=card>
  <h2>Créer un compte</h2>
  <form method=post action="{{ url_for('admin_users.create') }}">
    <input type=hidden name=_csrf value="{{ csrf }}">
    <div class=row>
      <div class=col><label>Email</label><input name=email required style="width:100%"></div>
      <div class=col><label>Prénom</label><input name=firstname required style="width:100%"></div>
      <div class=col><label>Nom</label><input name=lastname required style="width:100%"></div>
    </div>
    <label>Mot de passe <span class=meta>(vide = généré et affiché)</span></label>
    <input name=password style="width:280px">
    <label style="display:inline;margin-left:8px"><input type=checkbox name=developer> développeur</label>
    {% if env=='prod' %}
    <div class=confirm><label><input type=checkbox name=confirm_prod> Je confirme (PROD)</label></div>
    {% endif %}
    <div style="margin-top:10px"><button>Créer</button></div>
  </form>
</div>
"""

USER = """
<p><a href="{{ url_for('admin_users.home') }}">← retour</a></p>
<div class=card>
  <h1>#{{ u.id }} · {{ u.email }}</h1>
  <div class=grid2 style="margin-top:10px">
    <div class=meta>Créé</div><div>{{ u.creation or '—' }}</div>
    <div class=meta>Stripe</div><div>{{ u.stripe_id or '—' }}</div>
    <div class=meta>UTM</div><div>{{ u.utm_campaign or '—' }}</div>
    <div class=meta>Essai</div><div>{{ trial }}</div>
    <div class=meta>Dernière connexion</div><div>{{ u.last_login or 'jamais (ou avant #270)' }}</div>
    <div class=meta>Compte</div>
    <div>{% if u.deactivated_at %}<span class="badge off">désactivé</span>
           <span class=meta>purge prévue le {{ (u.purge_after or '')[:10] }}</span>
         {% else %}<span class="badge ok">actif</span>{% endif %}</div>
    <div class=meta>Mails de campagne</div>
    <div>{% if u.mail_optout %}<span class="badge off">désinscrit</span>
         {% else %}<span class="badge ok">accepte</span>{% endif %}</div>
    <div class=meta>Compté dans les stats ?</div>
    <div>{% if excluded %}<span class="badge off">non (exclu)</span>
         {% else %}<span class="badge ok">oui</span>{% endif %}</div>
  </div>
  {% if u.deactivated_at %}
  <form method=post action="{{ url_for('admin_users.reactivate', uid=u.id) }}" style="margin-top:12px">
    <input type=hidden name=_csrf value="{{ csrf }}">
    {% if env=='prod' %}<input type=hidden name=confirm_prod value=on>{% endif %}
    <button class=ghost>Rétablir ce compte (annuler la purge)</button>
  </form>
  {% endif %}
</div>

<div class=card>
  <h2>Modifier</h2>
  <form method=post action="{{ url_for('admin_users.edit', uid=u.id) }}">
    <input type=hidden name=_csrf value="{{ csrf }}">
    <div class=row>
      <div class=col><label>Email</label><input name=email value="{{ u.email }}" style="width:100%"></div>
      <div class=col><label>Prénom</label>
        <input name=firstname value="{{ u.firstname or '' }}" style="width:100%"></div>
      <div class=col><label>Nom</label><input name=lastname value="{{ u.name or '' }}" style="width:100%"></div>
    </div>
    <label style="display:inline">
      <input type=checkbox name=developer {{ 'checked' if u.is_developer }}> développeur</label>
    <div style="margin-top:6px">
      <label style="display:inline"><input type=checkbox name=exclude_from_metrics {{ 'checked' if u_excl_flag }}>
        Exclure des statistiques de fréquentation</label>
      <span class=meta>(visites internes / équipe / démo
        {% if u.is_developer %} — déjà exclu d'office car développeur{% endif %})</span>
    </div>
    {{ confirm_box|safe }}
    <div style="margin-top:10px"><button>Enregistrer</button></div>
  </form>
</div>

<div class=card>
  <h2>Mot de passe</h2>
  <form method=post action="{{ url_for('admin_users.passwd', uid=u.id) }}">
    <input type=hidden name=_csrf value="{{ csrf }}">
    <input name=password placeholder="vide = généré" style="width:280px">
    {{ confirm_box|safe }}
    <button class=ghost>Réinitialiser</button>
  </form>
</div>

<div class=card>
  <h2>Licences</h2>
  <table><tr><th>Nom</th><th>Activée</th><th>Expiration</th><th>Valide</th><th></th></tr>
  {% for l in lics %}
    <tr>
      <td>{{ l.name }}</td>
      <td>{% if l.activated %}<span class="badge ok">oui</span>
          {% else %}<span class="badge off">non</span>{% endif %}</td>
      <td>{{ l.expiry or '—' }}</td>
      <td>{% if l.valid %}✓{% else %}✗{% endif %}</td>
      <td>
        <form method=post action="{{ url_for('admin_users.lic_revoke', uid=u.id) }}" style="display:inline">
          <input type=hidden name=_csrf value="{{ csrf }}">
          <input type=hidden name=license_name value="{{ l.name }}">
          {% if env=='prod' %}<input type=hidden name=confirm_prod value=on>{% endif %}
          <button class=ghost>désactiver</button>
        </form>
      </td>
    </tr>
  {% endfor %}
  </table>
  <form method=post action="{{ url_for('admin_users.lic_grant', uid=u.id) }}" style="margin-top:12px">
    <input type=hidden name=_csrf value="{{ csrf }}">
    <label>Accorder une licence</label>
    <input name=license_name list=lics_list placeholder="OpenSankey+" required>
    <datalist id=lics_list>{% for name in all_license_names %}<option value="{{ name }}">{% endfor %}</datalist>
    <input name=expiry value="never" title="never ou date ISO" style="width:110px">
    <label style="display:inline;margin-left:6px"><input type=checkbox name=create_license> créer si absente</label>
    {{ confirm_box|safe }}
    <button>Accorder</button>
  </form>
</div>

<div class=card>
  <h2>Essai gratuit</h2>
  <p class=meta>État : {{ trial }}</p>
  <form method=post action="{{ url_for('admin_users.trial_grant', uid=u.id) }}" style="display:inline">
    <input type=hidden name=_csrf value="{{ csrf }}">
    <select name=plan>{% for p in trial_plans %}<option value="{{ p }}">{{ p }}</option>{% endfor %}</select>
    {% if env=='prod' %}<input type=hidden name=confirm_prod value=on>{% endif %}
    <button>Démarrer un essai</button>
  </form>
  <form method=post action="{{ url_for('admin_users.trial_expire', uid=u.id) }}" style="display:inline">
    <input type=hidden name=_csrf value="{{ csrf }}">
    {% if env=='prod' %}<input type=hidden name=confirm_prod value=on>{% endif %}
    <button class=ghost>Terminer l'essai</button>
  </form>
</div>

<div class=card>
  <h2>Zone dangereuse</h2>
  <form method=post action="{{ url_for('admin_users.delete', uid=u.id) }}"
        onsubmit="return confirm('Supprimer définitivement #{{ u.id }} {{ u.email }} ?');">
    <input type=hidden name=_csrf value="{{ csrf }}">
    {{ confirm_box|safe }}
    <button class=danger>Supprimer ce compte</button>
  </form>
</div>
"""


def render(body_tpl, **ctx):
    env = detect_env()
    counts = {"users": User.query.count(), "licenses": License.query.count()}
    confirm_box = ""
    if env == "prod":
        confirm_box = ('<div class=confirm><label><input type=checkbox name=confirm_prod> '
                       'Je confirme (PROD)</label></div>')
    body = render_template_string(
        body_tpl,
        env=env,
        counts=counts,
        csrf=csrf_token(),
        trial_plans=list(TRIAL_PLANS),
        confirm_box=confirm_box,
        **ctx,
    )
    return render_template_string(
        LAYOUT, css=BASE_CSS, env=env, db_path=db_file_path(), counts=counts, body=body
    )


def back_home():
    return redirect(url_for("admin_users.home"))


def back_to_user(uid):
    return redirect(url_for("admin_users.user", uid=uid))


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@admin_users.route("/admin/users")
@dev_required
def home():
    q = (request.args.get("q") or "").strip()
    query = User.query
    if q:
        like = "%{}%".format(q.lower())
        query = query.filter(
            or_(
                func.lower(User.email).like(like),
                func.lower(User.firstname).like(like),
                func.lower(User.name).like(like),
            )
        )
    users = query.order_by(User.id).limit(500).all()
    for u in users:
        u._lics = user_licenses_rows(u)
        u._trial = u.trial_plan if u.has_active_trial() else None
        u._excluded = excluded_from_metrics(u)
    return render(HOME, users=users, q=q)


@admin_users.route("/admin/users/<int:uid>")
@dev_required
def user(uid):
    u = User.query.get(uid)
    if u is None:
        flash("Compte introuvable.", "error")
        return back_home()
    return render(
        USER,
        u=u,
        lics=user_licenses_rows(u),
        all_license_names=[lic.name for lic in License.query.order_by(License.name).all()],
        trial=u.trial_state() if hasattr(u, "trial_state") else "n/a",
        excluded=excluded_from_metrics(u),
        u_excl_flag=bool(getattr(u, "exclude_from_metrics", False)),
    )


@admin_users.route("/admin/users/create", methods=["POST"])
@dev_required
def create():
    ok, msg = guard_write()
    if not ok:
        flash(msg, "error")
        return back_home()
    email = (request.form.get("email") or "").strip().lower()
    if not email:
        flash("Email requis.", "error")
        return back_home()
    if User.query.filter(User.email == email).first():
        flash("Un compte existe déjà pour {}.".format(email), "error")
        return back_home()
    password = request.form.get("password") or ""
    generated = False
    if not password:
        password = gen_password()
        generated = True
    if not validate_password(password):
        flash("Mot de passe trop court (min. 8).", "error")
        return back_home()
    u = User(
        email=email,
        password=hash_password(password),
        firstname=request.form.get("firstname"),
        name=request.form.get("lastname"),
        creation=datetime.now().isoformat(),
    )
    if request.form.get("developer") == "on":
        u.is_developer = True
    db.session.add(u)
    db.session.commit()
    flash("Compte #{} créé.".format(u.id) + (" Mot de passe : {}".format(password) if generated else ""), "ok")
    return back_to_user(u.id)


@admin_users.route("/admin/users/<int:uid>/edit", methods=["POST"])
@dev_required
def edit(uid):
    u = User.query.get(uid)
    if u is None:
        flash("Compte introuvable.", "error")
        return back_home()
    ok, msg = guard_write()
    if not ok:
        flash(msg, "error")
        return back_to_user(uid)
    u.email = (request.form.get("email") or u.email).strip().lower()
    u.firstname = request.form.get("firstname")
    u.name = request.form.get("lastname")
    u.is_developer = request.form.get("developer") == "on"
    # Colonne issue de #256 (peut être absente sur un schéma non migré) : on ne
    # l'écrit que si le modèle la porte.
    if hasattr(u, "exclude_from_metrics"):
        u.exclude_from_metrics = request.form.get("exclude_from_metrics") == "on"
    db.session.commit()
    flash("Compte #{} modifié.".format(u.id), "ok")
    return back_to_user(uid)


@admin_users.route("/admin/users/<int:uid>/passwd", methods=["POST"])
@dev_required
def passwd(uid):
    u = User.query.get(uid)
    if u is None:
        flash("Compte introuvable.", "error")
        return back_home()
    ok, msg = guard_write()
    if not ok:
        flash(msg, "error")
        return back_to_user(uid)
    password = request.form.get("password") or ""
    generated = False
    if not password:
        password = gen_password()
        generated = True
    if not validate_password(password):
        flash("Mot de passe trop court (min. 8).", "error")
        return back_to_user(uid)
    u.password = hash_password(password)
    db.session.commit()
    flash("Mot de passe réinitialisé." + (" Nouveau : {}".format(password) if generated else ""), "ok")
    return back_to_user(uid)


@admin_users.route("/admin/users/<int:uid>/delete", methods=["POST"])
@dev_required
def delete(uid):
    u = User.query.get(uid)
    if u is None:
        flash("Compte introuvable.", "error")
        return back_home()
    ok, msg = guard_write()
    if not ok:
        flash(msg, "error")
        return back_to_user(uid)
    email = u.email
    u.delete()
    flash("Compte #{} {} supprimé.".format(uid, email), "ok")
    return back_home()


@admin_users.route("/admin/users/<int:uid>/reactivate", methods=["POST"])
@dev_required
def reactivate(uid):
    """
    Annule une désactivation demandée via une campagne (issue #270), tant que la
    purge n'a pas eu lieu. Le recours quand quelqu'un écrit « je n'ai jamais cliqué
    sur ce lien » — ce qui arrive, les scanners de mail pré-chargent les URLs.
    `mail_optout` n'est pas levé : rétablir un compte n'est pas consentir à des mails.
    """
    u = User.query.get(uid)
    if u is None:
        flash("Compte introuvable.", "error")
        return back_home()
    ok, msg = guard_write()
    if not ok:
        flash(msg, "error")
        return back_to_user(uid)
    if not u.is_deactivated():
        flash("Ce compte n'est pas désactivé.", "info")
        return back_to_user(uid)
    u.reactivate()
    db.session.commit()
    flash("Compte #{} rétabli, la purge est annulée.".format(uid), "ok")
    return back_to_user(uid)


@admin_users.route("/admin/users/<int:uid>/license/grant", methods=["POST"])
@dev_required
def lic_grant(uid):
    u = User.query.get(uid)
    if u is None:
        flash("Compte introuvable.", "error")
        return back_home()
    ok, msg = guard_write()
    if not ok:
        flash(msg, "error")
        return back_to_user(uid)
    name = (request.form.get("license_name") or "").strip()
    license = License.query.filter_by(name=name).first()
    if license is None:
        if request.form.get("create_license") != "on":
            flash("Licence inconnue : {!r} (coche « créer si absente »).".format(name), "error")
            return back_to_user(uid)
        license = License(name=name)
        db.session.add(license)
    ul = u.get_license(name)
    if ul is None:
        ul = UserLicences(user=u, license=license)
        ul.creation = datetime.now().isoformat()
        db.session.add(ul)
    ul.activated = True
    ul.expiry = (request.form.get("expiry") or "never").strip()
    db.session.commit()
    flash("Licence {!r} accordée (expiry={}).".format(name, ul.expiry), "ok")
    return back_to_user(uid)


@admin_users.route("/admin/users/<int:uid>/license/revoke", methods=["POST"])
@dev_required
def lic_revoke(uid):
    u = User.query.get(uid)
    if u is None:
        flash("Compte introuvable.", "error")
        return back_home()
    ok, msg = guard_write()
    if not ok:
        flash(msg, "error")
        return back_to_user(uid)
    name = (request.form.get("license_name") or "").strip()
    ul = u.get_license(name)
    if ul is None:
        flash("Licence {!r} absente.".format(name), "error")
        return back_to_user(uid)
    ul.activated = False
    db.session.commit()
    flash("Licence {!r} désactivée.".format(name), "ok")
    return back_to_user(uid)


@admin_users.route("/admin/users/<int:uid>/trial/grant", methods=["POST"])
@dev_required
def trial_grant(uid):
    u = User.query.get(uid)
    if u is None:
        flash("Compte introuvable.", "error")
        return back_home()
    ok, msg = guard_write()
    if not ok:
        flash(msg, "error")
        return back_to_user(uid)
    plan = request.form.get("plan")
    ok2, reason = u.start_trial(plan)
    if ok2:
        flash("Essai {!r} démarré — fin {}.".format(plan, u.trial_ends_at), "ok")
    else:
        flash("Essai refusé : {}.".format(reason), "error")
    return back_to_user(uid)


@admin_users.route("/admin/users/<int:uid>/trial/expire", methods=["POST"])
@dev_required
def trial_expire(uid):
    u = User.query.get(uid)
    if u is None:
        flash("Compte introuvable.", "error")
        return back_home()
    ok, msg = guard_write()
    if not ok:
        flash(msg, "error")
        return back_to_user(uid)
    u.trial_plan = None
    u.trial_ends_at = None
    db.session.commit()
    flash("Essai terminé.", "ok")
    return back_to_user(uid)


@admin_users.route("/admin/users/backup", methods=["POST"])
@dev_required
def backup():
    if not check_csrf():
        flash("Jeton de session invalide (recharge la page).", "error")
        return back_home()
    if detect_env() == "prod" and request.form.get("confirm_prod") != "on":
        flash("Backup prod : coche la confirmation.", "error")
        return back_home()
    try:
        dst = do_backup()
        flash("Backup : {}".format(dst), "ok")
    except Exception as e:  # noqa
        flash("Backup impossible : {}".format(e), "error")
    return back_home()
