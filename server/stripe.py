# coding: utf-8
#
# Auteur : Vincent LE DOZE
# Date de création : 03/10/2023

# ---------------------------------------------------------------
# System imports
# import os

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


# ---------------------------------------------------------------
# Constants

stripe_keys = {
    'secret_key': 'sk_test_51Q5ryr4D4FENxv0JCvVWWGNcfpFfxLH0gvKG6K6yNqfsyNEsfxOs0M9Qcs0Oc74MsGfQ5yLkhwxZeSq8k1hMPBV400qizlpXZC',  # os.environ['STRIPE_SECRET_KEY'],
    'publishable_key': 'pk_test_51Q5ryr4D4FENxv0JIoQGH543mTSaoIlI0xwkz1upHvNMJpeiHC8Ng2EmMTuB8Hvz0jy7eZTGgzDZdlVnuvr2Vokh00M0WXHCFg',  # os.environ['STRIPE_PUBLISHABLE_KEY'],
    'price_id_osplusmensuel': 'price_1Q5sHz4D4FENxv0JX8D4cF0S',  # os.environ['STRIPE_PRICE_ID'],
}

domain_url = 'http://localhost:3000/#/'

# ---------------------------------------------------------------
# Create stripe blue print

stripe_blueprint = Blueprint('stripe_blueprint', __name__)
stripe.api_key = stripe_keys['secret_key']


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
    stripe_config = {'publicKey': stripe_keys['publishable_key']}
    return jsonify(stripe_config)


@stripe_blueprint.route('/stripe/create-checkout-session', methods=['POST'])
def create_checkout_session():
    stripe.api_key = stripe_keys['secret_key']
    try:
        checkout_session = stripe.checkout.Session.create(
            ui_mode='embedded',
            client_reference_id=current_user.id,
            return_url=(domain_url + 'license/return?session_id={CHECKOUT_SESSION_ID}'),
            payment_method_types=['card'],
            mode='subscription',
            line_items=[
                {
                    'price': stripe_keys['price_id_osplusmensuel'],
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
    checkout_session = stripe.checkout.Session.retrieve(
        request.args.get('session_id'))
    return jsonify(
        status=checkout_session.status,
        customer_email=checkout_session.customer_details.email)
