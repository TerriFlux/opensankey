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


# ---------------------------------------------------------------
# Constants
STRIPE_KEYS = {
    'secret_key': None,
    'publishable_key': None,
    'price_id_osplusmensuel': None,
    'endpoint_secret': None}
CLIENT_ROOT_URL = None
if 'STRIPE_SECRET_KEY' in os.environ:
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


@stripe_blueprint.route(
    '/stripe/create-checkout-session/osplus',
    methods=['POST'])
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
            allow_promotion_codes=True,
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


@stripe_blueprint.route('/stripe/create-customer-portal', methods=['GET'])
@login_required
def create_customer_portal():
    if current_user.stripe_id is not None:
        billing_session = stripe.billing_portal.Session.create(
            customer=current_user.stripe_id,
            return_url=(
                CLIENT_ROOT_URL +
                'account'),
        )
        return jsonify(url=billing_session.url), 200
    else:
        return 'not_a_client', 400


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
    # Get data
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')

    # Stripe checks
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_KEYS['endpoint_secret'])
    except ValueError:
        # Invalid payload
        return 'Invalid payload', 400
    except stripe.error.SignatureVerificationError:
        # Invalid signature
        return 'Invalid signature', 400

    # Defaut outputs
    msg, ok = 'ok', True

    # Defaut function
    def pass_defaut(_session):
        return msg, ok

    # Event dispatcher
    event_dispatcher = {
        'customer.created': handle_customer_creation,
        'customer.updated': pass_defaut,
        'customer.deleted': handle_customer_deletion,
        'customer.subscription.created': handle_subscription_creation_session,
        'customer.subscription.updated': handle_subscription_update_session,
        'customer.subscription.deleted': handle_subscription_delete_session,
        'product.created': handle_product_creation,
        'product.updated': handle_product_update,
        'product.deleted': handle_product_deletion,
        'checkout.session.completed': handle_checkout_session,
        'invoice.created': handle_invoice_created,
        'invoice.paid': handle_invoice_paid}

    # Dispatch events
    if (event['type'] in event_dispatcher):
        try:
            f = event_dispatcher[event['type']]
            msg, ok = f(event['data'])
        except Exception as e:
            return 'Error dispatching {0} : {1}'.format(event['type'], e), 400

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
    object = session['object']
    user_name = object['name'].split()
    return create_user_from_stripe(
        object['email'],
        user_name[0],
        ' '.join(user_name[1:]),
        object['id'])


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
    object = session['object']
    return delete_user_from_stripe(
        object['email'],
        object['id'])


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
    object = session['object']
    items = object['items']
    if (items['total_count'] != 1):
        return 'Total items mismatch', False
    item = items['data'][0]
    if (item['quantity'] != 1):
        return 'Item quantity mismatch', False
    if (item['object'] != 'subscription_item'):
        return 'Item type mismatch', False
    # Add subscription
    return create_user_license_subscription(
        item['plan']['product'],
        object['id'],
        datetime.fromtimestamp(object['created']).isoformat())


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
    object = session['object']
    if (object['object'] == 'subscription'):
        return update_user_license_subscription(
            object['id'],
            datetime.fromtimestamp(object['current_period_end']).isoformat())
    return 'Nothing done', False


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
    object = session['object']
    if (object['object'] == 'subscription'):
        return delete_user_license_subscription(object['id'])
    return 'Nothing done', False


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
    object = session['object']
    return create_license_from_stripe(
        object['name'],
        object['id'])


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
    if ('name' in session['previous_attributes']):
        object = session['object']
        return update_license_name_from_stripe(
            object['name'],
            object['id'])
    if ('active' in session['previous_attributes']):
        object = session['object']
        if (object['active'] is False):
            # TODO : deactivate instead ?
            return delete_license_from_stripe(
                object['id'])
    return 'Nothing done', True


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
    object = session['object']
    return delete_license_from_stripe(
        object['id'])


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
    object = session['object']
    if (object['payment_status'] == 'paid'):
        return set_licence_checkout_completed(
            object['client_reference_id'],
            object['customer_email'],
            object['customer'],
            object['subscription'])
    return 'Not paid', False


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
    object = session['object']
    # Check number of lines in invoice
    lines = object['lines']
    if (lines['total_count'] != 1):
        return 'Total lines mismatch', False
    # Check number of items for given line
    item = lines['data'][0]
    if (item['quantity'] != 1):
        return 'Item quantity mismatch', False
    # Get product id
    prod_id = item['price']['product']
    # Check if it's about a subscription
    sub_id = item['subscription']
    if sub_id is None:
        sub_id = object['id']
    # Create / update user_license object
    return set_license_invoice_created(
        object['customer_email'],
        object['customer'],
        prod_id,
        sub_id)


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
    object = session['object']
    if (object['paid'] is True):
        # Check number of lines in invoice
        lines = object['lines']
        if (lines['total_count'] != 1):
            return 'Total lines mismatch', False
        # Check number of items for given line
        item = lines['data'][0]
        if (item['quantity'] != 1):
            return 'Item quantity mismatch', False
        # Get product id
        prod_id = item['price']['product']
        # Check if it's about a subscription
        sub_id = item['subscription']
        if (sub_id is not None):
            return set_licence_invoice_paid(
                object['customer'],
                prod_id,
                sub_id)
        else:
            return set_licence_invoice_paid(
                object['customer'],
                prod_id,
                object['id'])
    return 'Not paid', False


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
