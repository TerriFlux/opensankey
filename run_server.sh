#!/bin/bash

# Get script dir
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

if [ ! -f $SCRIPT_DIR/env ]; then
    cp $SCRIPT_DIR/env.example $SCRIPT_DIR/env
fi

cd $SCRIPT_DIR

export $(cat ./env)

sudo docker stop stripe_dev
sudo docker run --name stripe_dev --rm -d stripe/stripe-cli --api-key $STRIPE_SECRET_KEY listen --forward-to 0.0.0.0:${INTERNAL_HTTP_PORT}/stripe/webhook

python -m flask run