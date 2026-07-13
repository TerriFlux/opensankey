# coding: utf-8
"""
Mode admin — campagnes de mail (/admin/campaigns), issue #270.

Même moule que server/admin_users.py, dont ce module réutilise le châssis (CSS,
layout, CSRF, `guard_write` qui exige une confirmation et prend un backup SQLite
avant toute écriture en prod). Réservé aux comptes `is_developer`.

Le parcours est volontairement en trois temps, pour qu'on ne puisse pas envoyer
500 mails d'un geste distrait :

  1. **Prévisualiser un segment** — combien de personnes, et surtout combien sont
     écartées et pourquoi.
  2. **Créer la campagne** — la liste des destinataires est figée en base, avec un
     token par personne. Rien n'est envoyé.
  3. **Envoyer** — bouton explicite, envoi throttlé en tâche de fond. Un envoi
     interrompu se reprend sans jamais renvoyer à quelqu'un de déjà servi.

`MAIL_DBG_MODE=Activate` (le défaut en local) court-circuite tout envoi réel :
les mails partent dans la sortie standard. C'est le mode dans lequel on répète.
"""
from datetime import datetime

from flask import current_app, flash, redirect, request, url_for, Blueprint
from flask_login import current_user

from logincomponent.server.models import db, Campaign, CampaignRecipient, PURGE_GRACE_DAYS
from logincomponent.server.mailing import DBG_MODE

from .admin_auth import dev_required
from .admin_users import check_csrf, guard_write, render
from . import campaign_engine as engine

admin_campaign = Blueprint("admin_campaign", __name__)


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------

HOME = """
<div class=card>
  <h1>Campagnes de mail</h1>
  <p class=meta>
    Envoi {% if dbg %}<span class="badge off">SIMULÉ (MAIL_DBG_MODE actif — rien ne part)</span>
    {% else %}<span class="badge ok">RÉEL</span>{% endif %}
    · un mail toutes les {{ interval }} s · purge des comptes supprimés à J+{{ grace }}
  </p>
</div>

<div class=card>
  <h2>Campagnes</h2>
  {% if campaigns %}
  <table><tr><th>#</th><th>Nom</th><th>Segment</th><th>Statut</th>
      <th>Envoyés</th><th>Gardés</th><th>Désinscrits</th><th>Erreurs</th></tr>
  {% for c in campaigns %}
    <tr>
      <td>{{ c.id }}</td>
      <td><a href="{{ url_for('admin_campaign.detail', cid=c.id) }}">{{ c.name }}</a></td>
      <td class=meta>{{ c.segment }}</td>
      <td><span class=badge>{{ c.status }}</span></td>
      <td>{{ c._c.sent }} / {{ c._c.total }}</td>
      <td>{{ c._c.kept }}</td>
      <td>{{ c._c.unsubscribed }}</td>
      <td>{% if c._c.errors %}<span class="badge off">{{ c._c.errors }}</span>{% else %}—{% endif %}</td>
    </tr>
  {% endfor %}
  </table>
  {% else %}<p class=meta>Aucune campagne pour l'instant.</p>{% endif %}
</div>

<div class=card>
  <h2>Nouvelle campagne</h2>
  <form method=post action="{{ url_for('admin_campaign.preview') }}">
    <input type=hidden name=_csrf value="{{ csrf }}">
    <div class=row>
      <div class=col>
        <label>Nom (usage interne)</label>
        <input name=name value="{{ form.name or '' }}" placeholder="Nettoyage été 2026"
               required style="width:100%">
      </div>
      <div class=col>
        <label>Segment</label>
        <select name=segment style="width:100%">
          {% for key, seg in segments.items() %}
          <option value="{{ key }}" {{ 'selected' if form.segment == key }}>{{ seg.label }}</option>
          {% endfor %}
        </select>
      </div>
      <div class=col>
        <label>Template</label>
        <select name=template style="width:100%">
          {% for t in templates %}<option value="{{ t }}">{{ t }}</option>{% endfor %}
        </select>
      </div>
    </div>
    <div style="margin-top:12px"><button class=ghost>Prévisualiser les destinataires</button></div>
  </form>

  {% for key, seg in segments.items() %}
  <p class=meta style="margin-top:10px"><strong>{{ seg.label }}</strong> — {{ seg.help }}</p>
  {% endfor %}
</div>

{% if preview %}
<div class=card>
  <h2>Aperçu — {{ preview.count }} destinataire(s)</h2>
  {% if preview.count %}
  <p>{{ preview.count }} personne(s) recevront « {{ form.name }} ».</p>
  {% else %}
  <p class=meta>Personne ne correspond à ce segment. Rien à envoyer.</p>
  {% endif %}

  <p class=meta>Écartés :
    {{ preview.skipped.protected }} protégés (licence, essai, Stripe, développeur, déjà désinscrit) ·
    {{ preview.skipped.already_contacted }} déjà contactés par ce template ·
    {{ preview.skipped.deactivated }} déjà désactivés ·
    {{ preview.skipped.bad_email }} adresse invalide
  </p>

  <table><tr><th>#</th><th>Email</th><th>Nom</th><th>Créé</th><th>Dernière connexion</th></tr>
  {% for u in preview.sample %}
    <tr><td>{{ u.id }}</td><td>{{ u.email }}</td>
        <td>{{ (u.firstname or '') }} {{ (u.name or '') }}</td>
        <td class=meta>{{ (u.creation or '—')[:10] }}</td>
        <td class=meta>{{ (u.last_login or 'jamais')[:10] }}</td></tr>
  {% endfor %}
  </table>
  {% if preview.count > preview.sample|length %}
  <p class=meta>… et {{ preview.count - preview.sample|length }} autres.</p>
  {% endif %}

  {% if preview.count %}
  <form method=post action="{{ url_for('admin_campaign.create') }}" style="margin-top:14px">
    <input type=hidden name=_csrf value="{{ csrf }}">
    <input type=hidden name=name value="{{ form.name }}">
    <input type=hidden name=segment value="{{ form.segment }}">
    <input type=hidden name=template value="{{ form.template }}">
    {{ confirm_box|safe }}
    <button>Créer la campagne ({{ preview.count }} destinataires, sans envoyer)</button>
  </form>
  {% endif %}
</div>
{% endif %}
"""

DETAIL = """
<p><a href="{{ url_for('admin_campaign.home') }}">← campagnes</a></p>

<div class=card>
  <h1>#{{ c.id }} · {{ c.name }}</h1>
  <div class=grid2 style="margin-top:10px">
    <div class=meta>Statut</div><div><span class=badge>{{ c.status }}</span></div>
    <div class=meta>Segment</div><div>{{ c.segment }}</div>
    <div class=meta>Template</div><div><code>{{ c.template }}</code></div>
    <div class=meta>Créée</div><div>{{ (c.created_at or '—')[:19] }} par {{ c.created_by }}</div>
  </div>
</div>

<div class=card>
  <h2>Avancement</h2>
  <p><strong>{{ n.sent }}</strong> envoyés · <strong>{{ n.pending }}</strong> en attente ·
     <strong>{{ n.errors }}</strong> en erreur — sur {{ n.total }}</p>
  <p><strong>{{ n.kept }}</strong> ont gardé leur compte ·
     <strong>{{ n.unsubscribed }}</strong> se sont désinscrits ·
     {{ n.no_reply }} sans réponse</p>

  {% if dbg %}
  <p class=meta><span class="badge off">MAIL_DBG_MODE actif</span> — l'envoi n'expédie rien,
     les mails sont écrits dans les logs. Décommenter l'envoi réel côté environnement.</p>
  {% endif %}

  <form method=post action="{{ url_for('admin_campaign.test', cid=c.id) }}" style="display:inline">
    <input type=hidden name=_csrf value="{{ csrf }}">
    <button class=ghost>M'envoyer un test ({{ me }})</button>
  </form>

  {% if n.pending %}
  <form method=post action="{{ url_for('admin_campaign.send', cid=c.id) }}"
        style="display:inline; margin-left:8px"
        onsubmit="return confirm('Envoyer à {{ n.pending }} destinataire(s) ?');">
    <input type=hidden name=_csrf value="{{ csrf }}">
    {{ confirm_box|safe }}
    <button {{ 'disabled' if c.status == 'sending' }}>
      {% if c.status == 'sending' %}Envoi en cours…
      {% elif n.sent %}Reprendre l'envoi ({{ n.pending }} restants)
      {% else %}Envoyer ({{ n.pending }} destinataires){% endif %}
    </button>
  </form>
  {% endif %}

  {% if c.status == 'sending' %}
  <p class=meta style="margin-top:8px">
    <a href="{{ url_for('admin_campaign.detail', cid=c.id) }}">↻ rafraîchir</a>
    — l'envoi tourne en tâche de fond, une adresse toutes les {{ interval }} s.</p>
  {% endif %}
</div>

<div class=card>
  <h2>Destinataires</h2>
  <table><tr><th>Email</th><th>Envoyé</th><th>Réponse</th><th>Erreur</th></tr>
  {% for r in recipients %}
    <tr>
      <td>{{ r.email }}</td>
      <td class=meta>{{ (r.sent_at or '—')[:19] }}</td>
      <td>{% if r.action == 'kept' %}<span class="badge ok">gardé</span>
          {% elif r.action == 'unsubscribed' %}<span class="badge off">désinscrit</span>
          {% else %}—{% endif %}</td>
      <td class=meta>{{ r.error or '' }}</td>
    </tr>
  {% endfor %}
  </table>
  {% if truncated %}<p class=meta>… {{ truncated }} lignes non affichées.</p>{% endif %}
</div>

<div class=card>
  <h2>Zone dangereuse</h2>
  <p class=meta>Supprimer la campagne efface aussi la trace des personnes contactées :
     elles pourraient être re-sollicitées par une campagne ultérieure. Les comptes
     désactivés, eux, restent désactivés (purge à J+{{ grace }}).</p>
  <form method=post action="{{ url_for('admin_campaign.delete', cid=c.id) }}"
        onsubmit="return confirm('Supprimer la campagne #{{ c.id }} et son historique ?');">
    <input type=hidden name=_csrf value="{{ csrf }}">
    {{ confirm_box|safe }}
    <button class=danger>Supprimer la campagne</button>
  </form>
</div>
"""


def back_home():
    return redirect(url_for("admin_campaign.home"))


def with_counts(campaigns):
    for c in campaigns:
        c._c = c.counts()
    return campaigns


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@admin_campaign.route("/admin/campaigns")
@dev_required
def home():
    campaigns = with_counts(Campaign.query.order_by(Campaign.id.desc()).all())
    return render(
        HOME,
        campaigns=campaigns,
        segments=engine.SEGMENTS,
        templates=list(engine.TEMPLATES),
        form={"name": "", "segment": "no_license", "template": "account_review"},
        preview=None,
        dbg=DBG_MODE,
        interval=engine.SEND_INTERVAL,
        grace=PURGE_GRACE_DAYS,
    )


@admin_campaign.route("/admin/campaigns/preview", methods=["POST"])
@dev_required
def preview():
    """
    Compte les destinataires d'un segment sans rien écrire. C'est le garde-fou :
    on voit qui recevra, et surtout ce qui est écarté, avant de figer quoi que ce soit.
    """
    if not check_csrf():
        flash("Jeton de session invalide (recharge la page).", "error")
        return back_home()

    form = {
        "name": (request.form.get("name") or "").strip(),
        "segment": request.form.get("segment") or "no_license",
        "template": request.form.get("template") or "account_review",
    }
    try:
        users, skipped = engine.eligible_users(form["segment"], form["template"])
    except ValueError as e:
        flash(str(e), "error")
        return back_home()

    return render(
        HOME,
        campaigns=with_counts(Campaign.query.order_by(Campaign.id.desc()).all()),
        segments=engine.SEGMENTS,
        templates=list(engine.TEMPLATES),
        form=form,
        preview={"count": len(users), "sample": users[:50], "skipped": skipped},
        dbg=DBG_MODE,
        interval=engine.SEND_INTERVAL,
        grace=PURGE_GRACE_DAYS,
    )


@admin_campaign.route("/admin/campaigns/create", methods=["POST"])
@dev_required
def create():
    ok, msg = guard_write()
    if not ok:
        flash(msg, "error")
        return back_home()

    name = (request.form.get("name") or "").strip()
    if not name:
        flash("Nom de campagne requis.", "error")
        return back_home()

    try:
        c, skipped = engine.create_campaign(
            name=name,
            template=request.form.get("template") or "account_review",
            segment_key=request.form.get("segment") or "no_license",
            created_by=current_user.email,
        )
    except ValueError as e:
        flash(str(e), "error")
        return back_home()

    flash(
        "Campagne #{0} créée : {1} destinataires figés. Rien n'est encore parti.".format(
            c.id, c.counts()["total"]
        ),
        "ok",
    )
    return redirect(url_for("admin_campaign.detail", cid=c.id))


@admin_campaign.route("/admin/campaigns/<int:cid>")
@dev_required
def detail(cid):
    c = db.session.get(Campaign, cid)
    if c is None:
        flash("Campagne introuvable.", "error")
        return back_home()

    all_recipients = (
        CampaignRecipient.query.filter_by(campaign_id=cid)
        .order_by(CampaignRecipient.id)
        .all()
    )
    shown = all_recipients[:200]
    return render(
        DETAIL,
        c=c,
        n=c.counts(),
        recipients=shown,
        truncated=len(all_recipients) - len(shown),
        me=current_user.email,
        dbg=DBG_MODE,
        interval=engine.SEND_INTERVAL,
        grace=PURGE_GRACE_DAYS,
    )


@admin_campaign.route("/admin/campaigns/<int:cid>/send", methods=["POST"])
@dev_required
def send(cid):
    c = db.session.get(Campaign, cid)
    if c is None:
        flash("Campagne introuvable.", "error")
        return back_home()
    ok, msg = guard_write()
    if not ok:
        flash(msg, "error")
        return redirect(url_for("admin_campaign.detail", cid=cid))

    if c.status == "sending":
        flash("Un envoi est déjà en cours pour cette campagne.", "error")
        return redirect(url_for("admin_campaign.detail", cid=cid))

    pending = len(engine.pending_recipients(cid))
    if not pending:
        flash("Rien à envoyer : tous les destinataires ont été traités.", "info")
        return redirect(url_for("admin_campaign.detail", cid=cid))

    # _get_current_object : le thread survit à la requête, il ne peut pas travailler
    # sur le proxy de contexte.
    engine.start_campaign(current_app._get_current_object(), cid)
    flash(
        "Envoi lancé pour {0} destinataire(s), une adresse toutes les {1} s. "
        "Rafraîchis pour suivre.".format(pending, engine.SEND_INTERVAL),
        "ok",
    )
    return redirect(url_for("admin_campaign.detail", cid=cid))


@admin_campaign.route("/admin/campaigns/<int:cid>/test", methods=["POST"])
@dev_required
def test(cid):
    """
    Envoie le mail de la campagne à l'admin connecté, pour vérifier le rendu.
    Le token est factice : les liens du mail de test mèneront à la page « lien
    expiré ». C'est voulu — on ne veut pas qu'un test pollue les statistiques ni
    qu'il puisse désactiver un vrai compte.
    """
    c = db.session.get(Campaign, cid)
    if c is None:
        flash("Campagne introuvable.", "error")
        return back_home()
    if not check_csrf():
        flash("Jeton de session invalide (recharge la page).", "error")
        return redirect(url_for("admin_campaign.detail", cid=cid))

    try:
        engine.TEMPLATES[c.template](current_user, "test-" + datetime.now().strftime("%H%M%S"), "fr")
        flash(
            "Mail de test envoyé à {0}.".format(current_user.email)
            + (" (MAIL_DBG_MODE actif : rien n'est parti, voir les logs.)" if DBG_MODE else "")
            + " Les liens du test mènent à « lien expiré », c'est normal.",
            "ok",
        )
    except Exception as e:  # noqa: BLE001
        flash("Échec de l'envoi de test : {0}".format(e), "error")
    return redirect(url_for("admin_campaign.detail", cid=cid))


@admin_campaign.route("/admin/campaigns/<int:cid>/delete", methods=["POST"])
@dev_required
def delete(cid):
    c = db.session.get(Campaign, cid)
    if c is None:
        flash("Campagne introuvable.", "error")
        return back_home()
    ok, msg = guard_write()
    if not ok:
        flash(msg, "error")
        return redirect(url_for("admin_campaign.detail", cid=cid))
    if c.status == "sending":
        flash("Envoi en cours : impossible de supprimer la campagne maintenant.", "error")
        return redirect(url_for("admin_campaign.detail", cid=cid))

    db.session.delete(c)
    db.session.commit()
    flash("Campagne #{0} supprimée.".format(cid), "ok")
    return back_home()
