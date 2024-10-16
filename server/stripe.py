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
from .models import set_licence_subscription
from .models import set_licence_checkout_completed
from .models import set_or_update_licence_subscription


# ---------------------------------------------------------------
# Constants
STRIPE_KEYS = {
    'secret_key': os.environ['STRIPE_SECRET_KEY'],
    'publishable_key': os.environ['STRIPE_PUBLISHABLE_KEY'],
    'price_id_osplusmensuel': os.environ['STRIPE_PRICE_ID_OSPLUSMENSUEL'],
    'endpoint_secret': os.environ['STRIPE_ENDPOINT_SECRET']}
CLIENT_ROOT_URL = os.environ['CLIENT_ROOT_URL']


# ---------------------------------------------------------------
# Create stripe blue print
stripe_blueprint = Blueprint('stripe_blueprint', __name__)
stripe.api_key = STRIPE_KEYS['secret_key']


# ---------------------------------------------------------------
# Define all routes
@stripe_blueprint.route('/stripe/config')
@login_required
def get_publishable_key():
    '''
    Return the public key to configurate Stripe client

    Returns
    -------
    :return: Jsonified publicKey
    :rtype: json
    '''
    stripe_config = {'publicKey': STRIPE_KEYS['publishable_key']}
    return jsonify(stripe_config)


@stripe_blueprint.route('/stripe/create-checkout-session', methods=['POST'])
def create_checkout_session():
    """
    Create and return a checkout object for stripe client.

    Returns
    -------
    :return: _description_
    :rtype: _type_
    """
    stripe.api_key = STRIPE_KEYS['secret_key']
    try:
        checkout_session = stripe.checkout.Session.create(
            ui_mode='embedded',
            client_reference_id=current_user.id,
            customer_email=current_user.email,
            billing_address_collection='required',
            return_url=(
                CLIENT_ROOT_URL +
                'license/return?session_id={CHECKOUT_SESSION_ID}'),
            payment_method_types=['card'],
            mode='subscription',
            line_items=[
                {
                    'price': STRIPE_KEYS['price_id_osplusmensuel'],
                    'quantity': 1,
                }
            ]
        )
        # return jsonify({url: checkout_session.url}), 200
        return jsonify(clientSecret=checkout_session.client_secret)
    except Exception as e:
        return jsonify(error=str(e)), 500


@stripe_blueprint.route('/stripe/session-status', methods=['GET'])
@login_required
def session_status():
    """
    Verify status of current checkout - called from server

    Returns
    -------
    :return: _description_
    :rtype: _type_
    """
    checkout_session = stripe.checkout.Session.retrieve(
        request.args.get('session_id'))
    return jsonify(
        status=checkout_session.status,
        customer_email=checkout_session.customer_details.email)


@stripe_blueprint.route('/stripe/webhook', methods=['POST'])
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
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_KEYS['endpoint_secret'])
    except ValueError:
        # Invalid payload
        return 'Invalid payload', 400
    except stripe.error.SignatureVerificationError:
        # Invalid signature
        return 'Invalid signature', 400

    # Handle all events
    msg, ok = 'ok', True
    if (event['type'] == 'customer.subscription.created'):
        session = event['data']['object']
        try:
            msg, ok = handle_subscription_creation_session(session)
        except Exception as e:
            return 'Error subscription creation : {}'.format(e), 400
    # Handle checkout completed
    elif (event['type'] == 'checkout.session.completed'):
        session = event['data']['object']
        try:
            msg, ok = handle_checkout_session(session)
        except Exception as e:
            return 'Error checkout handler : {}'.format(e), 400
    # Handle subscription
    elif (event['type'] == 'customer.subscription.updated'):
        session = event['data']['object']
        try:
            msg, ok = handle_subscription_update_session(session)
        except Exception as e:
            return 'Error subscription handler : {}'.format(e), 400

    if (ok):
        return msg, 200
    else:
        return msg, 400


def handle_subscription_creation_session(session):
    """
    Handle checkout session on webhook trigger

    Parameters
    ----------
    :param session: Session object stripe
    :type session: _type_

    Returns
    -------
    :return: msg, ok
    :rtype: (str, boolean)
    """
    # Check associated product
    items = session['items']
    if (items['total_count'] != 1):
        return 'Total items mismatch', False
    item = items['data'][0]
    if (item['quantity'] != 1):
        return 'Item quantity mismatch', False
    if (item['object'] != 'subscription_item'):
        return 'Item type mismatch', False
    # Add subscription
    return set_licence_subscription(
        item['plan']['product'],
        session['id'],
        datetime.fromtimestamp(session['created']).isoformat())


def handle_checkout_session(session):
    """
    Handle checkout session on webhook trigger

    Parameters
    ----------
    :param session: Session object stripe
    :type session: _type_

    Returns
    -------
    :return: msg, ok
    :rtype: (str, boolean)
    """
    if (session['payment_status'] == 'paid'):
        return set_licence_checkout_completed(
            session['client_reference_id'],
            session['customer_email'],
            session['customer'],
            session['subscription'])
    return 'Not paid', False


def handle_subscription_update_session(session):
    """
    Handle subscription updates session on webhook trigger

    Parameters
    ----------
    :param session: Session object stripe
    :type session: _type_

    Returns
    -------
    :return: msg, ok
    :rtype: (str, boolean)
    """
    if (session['object'] == 'subscription'):
        return set_or_update_licence_subscription(
            session['id'],
            datetime.fromtimestamp(session['current_period_end']).isoformat())
    return 'Nothing done', False


def cancel_subscription(
    id,
    comment,
    feedback
):
    """
    Cancel a subscription using its stripe id.

    Returns
    -------
    :return: True if cancelation is ok
    :rtype: boolean
    """
    # Create cancel details
    cancel_details = {
        'comment': comment
    }
    possible_feedback = [
        'customer_service',
        'low_quality',
        'missing_features',
        'other',
        'switched_service',
        'too_complex',
        'too_expensive',
        'unused']
    if feedback in possible_feedback:
        cancel_details['feedback'] = feedback
    # Cancel subscription
    stripe.api_key = STRIPE_KEYS['secret_key']
    resp = stripe.Subscription.cancel(
        id,
        cancellation_details=cancel_details)
    return (resp['status'] == 'canceled')
