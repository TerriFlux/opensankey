# coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de création : 03/10/2023

# ---------------------------------------------------------------
# System imports
import os
from datetime import datetime

# Strip imports
import stripe

# Flask imports
from flask import jsonify
from flask import request
from flask import Blueprint

# Flask_login imports
from flask_login import current_user


# ---------------------------------------------------------------
# Local imports
from .models import login_required
from .models import create_user_from_stripe
from .models import delete_user_from_stripe
from .models import update_license_name_from_stripe
from .models import delete_license_from_stripe
from .models import create_user_license_subscription
from .models import update_user_license_subscription
from .models import delete_user_license_subscription
from .models import create_license_from_stripe
from .models import set_licence_checkout_completed
from .models import set_license_invoice_created
from .models import set_licence_invoice_paid
from .models import stripe_event_already_processed
from .models import mark_stripe_event_processed


# ---------------------------------------------------------------
# Constants
STRIPE_KEYS = {
    "secret_key": None,
    "publishable_key": None,
    "price_id_osplusmensuel": None,
    "price_id_osplusannuel": None,
    "endpoint_secret": None,
}
CLIENT_ROOT_URL = None
if "STRIPE_SECRET_KEY" in os.environ:
    STRIPE_KEYS = {
        "secret_key": os.environ["STRIPE_SECRET_KEY"],
        "publishable_key": os.environ["STRIPE_PUBLISHABLE_KEY"],
        "price_id_osplusmensuel": os.environ["STRIPE_PRICE_ID_OSPLUSMENSUEL"],
        "price_id_osplusannuel": os.environ["STRIPE_PRICE_ID_OSPLUSANNUEL"],
        "endpoint_secret": os.environ["STRIPE_ENDPOINT_SECRET"],
        "pricing_table_id": os.environ.get("STRIPE_PRICING_TABLE_ID", ""),
    }
    CLIENT_ROOT_URL = os.environ["CLIENT_ROOT_URL"]


# ---------------------------------------------------------------
# Create stripe blue print
stripe_blueprint = Blueprint("stripe_blueprint", __name__)
stripe.api_key = STRIPE_KEYS["secret_key"]


def _expected_livemode():
    """
    Environnement Stripe attendu, déduit du préfixe de la clé secrète.

    Returns
    -------
    :return: True (live), False (test), ou None si indéterminé (pas d'enforce)
    :rtype: bool | None
    """
    key = STRIPE_KEYS.get("secret_key") or ""
    if key.startswith("sk_live") or key.startswith("rk_live"):
        return True
    if key.startswith("sk_test") or key.startswith("rk_test"):
        return False
    return None


# ---------------------------------------------------------------
# Define all routes
@stripe_blueprint.route("/stripe/config")
@login_required
def get_publishable_key():
    """
    Return the public key to configurate Stripe client

    Returns
    -------
    :return: Jsonified publicKey
    :rtype: json
    """
    stripe_config = {
        "publicKey": STRIPE_KEYS["publishable_key"],
        "pricingTableId": STRIPE_KEYS["pricing_table_id"],
    }
    return jsonify(stripe_config)


# @stripe_blueprint.route("/stripe/create-checkout-session/<license_type>", methods=["POST"])
# def create_checkout_session(license_type):
#     """
#     Create and return a checkout object for stripe client.

#     Parameters
#     ----------
#     license_type : str
#         Type de licence (osplusmensuel ou osplusannuel)

#     Returns
#     -------
#     :return: JSON avec clientSecret ou erreur
#     :rtype: dict
#     """
#     # Mapping des types de licences vers les price_id
#     price_mapping = {
#         "osplusmensuel": STRIPE_KEYS["price_id_osplusmensuel"],
#         "osplusannuel": STRIPE_KEYS["price_id_osplusannuel"]
#     }

#     # Vérifier que le type de licence est valide
#     if license_type not in price_mapping:
#         return jsonify(error="Type de licence invalide"), 400

#     stripe.api_key = STRIPE_KEYS["secret_key"]

#     try:
#         checkout_session = stripe.checkout.Session.create(
#             ui_mode="embedded",
#             client_reference_id=current_user.id,
#             customer_email=current_user.email,
#             billing_address_collection="required",
#             return_url=(CLIENT_ROOT_URL + "license/return?session_id={CHECKOUT_SESSION_ID}"),
#             payment_method_types=["card"],
#             mode="subscription",
#             allow_promotion_codes=True,
#             line_items=[
#                 {
#                     "price": price_mapping[license_type],
#                     "quantity": 1,
#                 }
#             ],
#         )
#         return jsonify(clientSecret=checkout_session.client_secret)
#     except Exception as e:
#         return jsonify(error=str(e)), 500


@stripe_blueprint.route("/stripe/create-customer-portal", methods=["GET"])
@login_required
def create_customer_portal():
    if current_user.stripe_id is not None:
        billing_session = stripe.billing_portal.Session.create(
            customer=current_user.stripe_id,
            return_url=(CLIENT_ROOT_URL + "account"),
        )
        return jsonify(url=billing_session.url), 200
    else:
        return "not_a_client", 400


@stripe_blueprint.route("/stripe/session-status", methods=["GET"])
@login_required
def session_status():
    """
    Verify status of current checkout - called from server

    Returns
    -------
    :return: _description_
    :rtype: _type_
    """
    checkout_session = stripe.checkout.Session.retrieve(request.args.get("session_id"))
    return jsonify(
        status=checkout_session.status,
        customer_email=checkout_session.customer_details.email,
    )


@stripe_blueprint.route("/stripe/webhook", methods=["POST"])
def stripe_webhook():
    """
    Handle all webhooks sent by stripe.
    Allows to follow all evant related to subscription and customers paiements
    via stripe.

    Returns
    -------
    :return: _description_
    :rtype: _type_
    """
    # Get data
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get("Stripe-Signature")

    # Stripe checks
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_KEYS["endpoint_secret"])
    except ValueError:
        # Invalid payload
        return "Invalid payload", 400
    except stripe.error.SignatureVerificationError:
        # Invalid signature
        return "Invalid signature", 400

    # Reject events coming from the wrong Stripe environment (test vs live)
    expected_livemode = _expected_livemode()
    if expected_livemode is not None and bool(event.get("livemode")) != expected_livemode:
        # 200 pour que Stripe ne retente pas indéfiniment
        return "ignored (livemode mismatch)", 200

    # Idempotence : ne pas re-traiter un event déjà vu (rejeu Stripe)
    event_id = event.get("id")
    if stripe_event_already_processed(event_id):
        return "ok (already processed)", 200

    # Defaut outputs
    msg, ok = "ok", True

    # Defaut function
    def pass_defaut(_session):
        return msg, ok

    # Event dispatcher
    event_dispatcher = {
        "customer.created": handle_customer_creation,
        "customer.updated": pass_defaut,
        "customer.deleted": handle_customer_deletion,
        "customer.subscription.created": handle_subscription_creation_session,
        "customer.subscription.updated": handle_subscription_update_session,
        "customer.subscription.deleted": handle_subscription_delete_session,
        "product.created": handle_product_creation,
        "product.updated": handle_product_update,
        "product.deleted": handle_product_deletion,
        "checkout.session.completed": handle_checkout_session,
        "invoice.created": handle_invoice_created,
        "invoice.paid": handle_invoice_paid,
    }

    # Dispatch events
    if event["type"] in event_dispatcher:
        try:
            f = event_dispatcher[event["type"]]
            msg, ok = f(event["data"])
        except Exception as e:
            return "Error dispatching {0} : {1}".format(event["type"], e), 400

    # Record the event as processed once handled successfully (idempotence)
    if ok:
        mark_stripe_event_processed(event_id, event.get("type", ""))

    # Return
    return msg, 200 if ok else 400


def handle_customer_creation(session):
    """
    _summary_


    Parameters
    ----------
    :param session: Session object stripe
    :type session: {}

    Returns
    -------
    :return: msg, ok
    :rtype: (str, boolean)
    """
    object = session["object"]
    user_name = object["name"].split()
    return create_user_from_stripe(object["email"], user_name[0], " ".join(user_name[1:]), object["id"])


def handle_customer_deletion(session):
    """
    _summary_


    Parameters
    ----------
    :param session: Session object stripe
    :type session: {}

    Returns
    -------
    :return: msg, ok
    :rtype: (str, boolean)
    """
    object = session["object"]
    return delete_user_from_stripe(object["email"], object["id"])


def handle_subscription_creation_session(session):
    """
    Handle checkout session on webhook trigger

    Parameters
    ----------
    :param session: Session object stripe
    :type session: {}

    Returns
    -------
    :return: msg, ok
    :rtype: (str, boolean)
    """
    # Check associated product
    object = session["object"]
    items = object["items"]
    if items["total_count"] != 1:
        return "Total items mismatch", False
    item = items["data"][0]
    if item["quantity"] != 1:
        return "Item quantity mismatch", False
    if item["object"] != "subscription_item":
        return "Item type mismatch", False
    # Add subscription
    return create_user_license_subscription(
        item["plan"]["product"],
        object["id"],
        datetime.fromtimestamp(object["created"]).isoformat(),
        datetime.fromtimestamp(object["current_period_end"]).isoformat(),
    )


def handle_subscription_update_session(session):
    """
    Handle subscription updates session on webhook trigger

    Parameters
    ----------
    :param session: Session object stripe
    :type session: {}

    Returns
    -------
    :return: msg, ok
    :rtype: (str, boolean)
    """
    object = session["object"]
    if object["object"] == "subscription":
        return update_user_license_subscription(
            object["id"],
            datetime.fromtimestamp(object["current_period_end"]).isoformat(),
        )
    return "Nothing done", False


def handle_subscription_delete_session(session):
    """
    Handle subscription updates session on webhook trigger

    Parameters
    ----------
    :param session: Session object stripe
    :type session: {}

    Returns
    -------
    :return: msg, ok
    :rtype: (str, boolean)
    """
    object = session["object"]
    if object["object"] == "subscription":
        return delete_user_license_subscription(object["id"])
    return "Nothing done", False


def handle_product_creation(session):
    """
    Handle product creation on webhook trigger

    Parameters
    ----------
    :param session: Session object stripe
    :type session: {}

    Returns
    -------
    :return: msg, ok
    :rtype: (str, boolean)
    """
    object = session["object"]
    return create_license_from_stripe(object["name"], object["id"])


def handle_product_update(session):
    """
    Handle product update on webhook trigger

    Parameters
    ----------
    :param session: Session object stripe
    :type session: {}

    Returns
    -------
    :return: msg, ok
    :rtype: (str, boolean)
    """
    if "name" in session["previous_attributes"]:
        object = session["object"]
        return update_license_name_from_stripe(object["name"], object["id"])
    if "active" in session["previous_attributes"]:
        object = session["object"]
        if object["active"] is False:
            # TODO : deactivate instead ?
            return delete_license_from_stripe(object["id"])
    return "Nothing done", True


def handle_product_deletion(session):
    """
    Handle product deletion on webhook trigger

    Parameters
    ----------
    :param session: Session object stripe
    :type session: {}

    Returns
    -------
    :return: msg, ok
    :rtype: (str, boolean)
    """
    object = session["object"]
    return delete_license_from_stripe(object["id"])


def handle_checkout_session(session):
    """
    Handle checkout session on webhook trigger

    Parameters
    ----------
    :param session: Session object stripe
    :type session: {}

    Returns
    -------
    :return: msg, ok
    :rtype: (str, boolean)
    """
    object = session["object"]
    if object["payment_status"] == "paid":
        return set_licence_checkout_completed(
            object["client_reference_id"],
            object["customer_email"],
            object["customer"],
            object["subscription"],
        )
    return "Not paid", False


def handle_invoice_created(session):
    """
    Handle invoice creation session on webhook trigger


    Parameters
    ----------
    :param session: Session object stripe
    :type session: {}

    Returns
    -------
    :return: msg, ok
    :rtype: (str, boolean)
    """
    object = session["object"]
    # Check number of lines in invoice
    lines = object["lines"]
    if lines["total_count"] != 1:
        return "Total lines mismatch", False
    # Check number of items for given line
    item = lines["data"][0]
    if item["quantity"] != 1:
        return "Item quantity mismatch", False
    # Get product id
    prod_id = item["price"]["product"]
    # Check if it's about a subscription
    sub_id = item["subscription"]
    if sub_id is None:
        sub_id = object["id"]
    # Create / update user_license object
    return set_license_invoice_created(object["customer_email"], object["customer"], prod_id, sub_id)


def handle_invoice_paid(session):
    """
    Handle paid invoice session on webhook trigger


    Parameters
    ----------
    :param session: Session object stripe
    :type session: {}

    Returns
    -------
    :return: msg, ok
    :rtype: (str, boolean)
    """
    # Check if it has been paid
    object = session["object"]
    if object["paid"] is True:
        # Check number of lines in invoice
        lines = object["lines"]
        if lines["total_count"] != 1:
            return "Total lines mismatch", False
        # Check number of items for given line
        item = lines["data"][0]
        if item["quantity"] != 1:
            return "Item quantity mismatch", False
        # Get product id
        prod_id = item["price"]["product"]
        # Check if it's about a subscription
        sub_id = item["subscription"]
        if sub_id is not None:
            return set_licence_invoice_paid(object["customer"], prod_id, sub_id)
        else:
            return set_licence_invoice_paid(object["customer"], prod_id, object["id"])
    return "Not paid", False


def cancel_subscription(id, comment, feedback):
    """
    Cancel a subscription using its stripe id.

    Returns
    -------
    :return: True if cancelation is ok
    :rtype: boolean
    """
    # Create cancel details
    cancel_details = {"comment": comment}
    possible_feedback = [
        "customer_service",
        "low_quality",
        "missing_features",
        "other",
        "switched_service",
        "too_complex",
        "too_expensive",
        "unused",
    ]
    if feedback in possible_feedback:
        cancel_details["feedback"] = feedback
    # Cancel subscription
    stripe.api_key = STRIPE_KEYS["secret_key"]
    resp = stripe.Subscription.cancel(id, cancellation_details=cancel_details)
    return resp["status"] == "canceled"
