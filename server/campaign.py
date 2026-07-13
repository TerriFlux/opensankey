# coding: utf-8
"""
Routes publiques des campagnes de mail (issue #270) — /campaign/<token>/...

Ce sont les liens cliqués depuis un mail : ils ne peuvent pas exiger d'être
connecté (la personne visée ne se connecte justement plus). L'autorisation
repose entièrement sur le secret d'URL `CampaignRecipient.token`
(256 bits, aléatoire, unique par destinataire).

Modèle de suppression — pourquoi ce n'est pas un DELETE immédiat
---------------------------------------------------------------
Un GET destructeur dans un mail se déclenche tout seul : Outlook SafeLinks, les
antivirus et les proxys d'entreprise pré-chargent les URLs pour les scanner. Sur
une campagne de plusieurs centaines d'adresses, un `unsubscribe` qui supprime
vraiment ferait disparaître des comptes que personne n'a cliqués.

Le clic désactive donc immédiatement (l'utilisateur, lui, voit bien « c'est
fait ») et programme la purge physique à J+30 (scripts/purge_deactivated.py).
Trois choses annulent la purge pendant cette fenêtre : le lien « annuler » de la
page de confirmation, une simple reconnexion (auth.py), ou une intervention
admin. Au-delà, le compte est réellement supprimé.

Les comptes protégés (développeur, licence valide, essai en cours, client Stripe)
ne peuvent pas être désactivés par ce chemin, même avec un token valide : la base
a pu changer entre l'envoi du mail et le clic — quelqu'un a pu s'abonner entre
temps, et supprimer son compte laisserait sa facturation orpheline.
"""
from datetime import datetime

from flask import Blueprint, render_template_string, request

from logincomponent.server.models import db, CampaignRecipient, User, PURGE_GRACE_DAYS

campaign = Blueprint("campaign", __name__)


# ---------------------------------------------------------------------------
# Rendu
# ---------------------------------------------------------------------------

PAGE = """
<!doctype html><html lang=fr><head><meta charset=utf-8>
<meta name=viewport content="width=device-width, initial-scale=1">
<title>{{ title }} — OpenSankey</title>
<style>
  body { font-family:-apple-system,Segoe UI,Roboto,sans-serif; background:#fafafa;
         color:#1a1a1a; margin:0; display:flex; align-items:center;
         justify-content:center; min-height:100vh; padding:20px; }
  .card { background:#fff; border:1px solid #e2e2e2; border-radius:12px;
          padding:32px 36px; max-width:520px; }
  h1 { font-size:20px; margin:0 0 14px; }
  p { line-height:1.55; color:#444; margin:0 0 12px; }
  .muted { color:#888; font-size:13px; }
  a.btn { display:inline-block; margin-top:10px; padding:10px 18px; border-radius:7px;
          background:#2563eb; color:#fff; text-decoration:none; font-size:14px; }
  a.btn.ghost { background:#eef1f6; color:#1a1a1a; }
</style></head><body>
  <div class=card>
    <h1>{{ title }}</h1>
    {{ body|safe }}
  </div>
</body></html>
"""


def page(title, body, status=200):
    """Page publique, jamais mise en cache (elle reflète un état qui vient de changer)."""
    html = render_template_string(PAGE, title=title, body=body)
    return html, status, {"Cache-Control": "no-store"}


def unknown_token():
    """
    Token inconnu, expiré ou déjà purgé. Page neutre et volontairement vague :
    inutile d'indiquer à un curieux si un token a existé ou non.
    """
    return page(
        "Lien expiré",
        "<p>Ce lien n'est plus valide. Si vous vouliez supprimer votre compte, "
        "écrivez-nous à <a href='mailto:contact@terriflux.fr'>contact@terriflux.fr</a> "
        "et nous le ferons.</p>",
        status=404,
    )


def find_recipient(token):
    return CampaignRecipient.query.filter_by(token=token).first()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@campaign.route("/campaign/<token>/keep", methods=["GET"])
def keep(token):
    """« Je garde mon compte » — enregistre la réponse, annule toute désactivation."""
    r = find_recipient(token)
    if r is None:
        return unknown_token()

    r.clicked_at = datetime.now().isoformat()
    r.action = "kept"
    user = db.session.get(User, r.user_id) if r.user_id else None
    if user is not None:
        user.reactivate()
    db.session.commit()

    return page(
        "C'est noté, votre compte est conservé",
        "<p>Merci. Nous ne vous redemanderons rien.</p>"
        "<p><a class=btn href='/login'>Ouvrir OpenSankey</a></p>",
    )


@campaign.route("/campaign/<token>/unsubscribe", methods=["GET", "POST"])
def unsubscribe(token):
    """
    « Supprimer mon compte » — désactive et programme la purge à J+30.

    Accepte aussi POST : c'est la cible de l'en-tête RFC 8058
    `List-Unsubscribe-Post`, le bouton « se désabonner » natif des clients mail.
    """
    r = find_recipient(token)
    if r is None:
        return unknown_token()

    user = db.session.get(User, r.user_id) if r.user_id else None

    r.clicked_at = datetime.now().isoformat()
    r.action = "unsubscribed"

    if user is None:
        # Compte déjà supprimé : on garde quand même la trace du refus, pour ne
        # jamais re-contacter cette adresse si elle recrée un compte plus tard.
        db.session.commit()
        return page("C'est fait", "<p>Votre compte n'existe plus. Vous ne recevrez plus de mail.</p>")

    # La base a pu changer entre l'envoi et le clic : quelqu'un a pu s'abonner
    # entre temps. On ne supprime jamais un compte payant par ce chemin, mais on
    # respecte quand même le refus de mail.
    protection = user.campaign_protection()
    if protection in ("licensed", "trialing", "stripe"):
        user.mail_optout = True
        db.session.commit()
        return page(
            "Vous ne recevrez plus de mail",
            "<p>Votre compte a une licence ou un abonnement en cours : nous ne le "
            "supprimons pas automatiquement, pour ne pas laisser votre facturation "
            "en suspens.</p>"
            "<p>Vous ne recevrez plus ce genre de message. Pour résilier et supprimer "
            "votre compte, écrivez-nous à "
            "<a href='mailto:contact@terriflux.fr'>contact@terriflux.fr</a>.</p>",
        )

    user.mail_optout = True
    user.deactivate()
    db.session.commit()

    # Réponse minimale pour le désabonnement en un clic du client mail (RFC 8058) :
    # il n'affiche aucune page, il attend juste un 200.
    if request.method == "POST":
        return "OK", 200, {"Cache-Control": "no-store"}

    return page(
        "C'est fait, votre compte est supprimé",
        "<p>Votre compte est désactivé et ne recevra plus aucun mail.</p>"
        "<p class=muted>La suppression devient définitive dans {days} jours. "
        "D'ici là, vous pouvez encore revenir en arrière.</p>"
        "<p><a class='btn ghost' href='/campaign/{token}/cancel'>"
        "Annuler, je garde mon compte</a></p>".format(days=PURGE_GRACE_DAYS, token=token),
    )


@campaign.route("/campaign/<token>/cancel", methods=["GET"])
def cancel(token):
    """
    « Annuler » — rétablit un compte désactivé, tant que la purge n'a pas eu lieu.
    C'est aussi la porte de sortie si le clic venait d'un scanner de mail.
    """
    r = find_recipient(token)
    if r is None:
        return unknown_token()

    user = db.session.get(User, r.user_id) if r.user_id else None
    if user is None:
        return page(
            "Trop tard",
            "<p>Ce compte a déjà été supprimé définitivement. Vous pouvez en "
            "<a href='/register'>créer un nouveau</a>.</p>",
            status=410,
        )

    user.reactivate()
    r.action = "kept"
    r.clicked_at = datetime.now().isoformat()
    db.session.commit()

    return page(
        "Votre compte est rétabli",
        "<p>La suppression est annulée, votre compte fonctionne normalement.</p>"
        "<p class=muted>Vous restez désinscrit de nos mails.</p>"
        "<p><a class=btn href='/login'>Ouvrir OpenSankey</a></p>",
    )
