
# Check input args
ci=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --ci)
      ci=true
      shift # past argument
      ;;
    *)
      echo 'Unknown option $1'
      echo ''
      echo 'Options: '
      echo '--ci : Gitlab CI mode'
      exit 1
      ;;
  esac
done

## SERVER VARS : remplacer sur le server par les variables de l'env selectionné
# Client url
if [ "$ci" = false ] ; then
    export CLIENT_ROOT_URL='http://localhost:3000/#/'
fi

# Mail
export MAIL_DBG_MODE='Activate'
export MAIL_SENDING_ADRESS='contact@terriflux.fr'
export MAIL_SENDING_PWD=''
export MAIL_SERVER='ssl0.ovh.net'
export MAIL_PORT=465
export MAIL_USE_TLS='False'
export MAIL_USE_SSL='True'

## STRIPE VARS : remplacer sur le serveur par les variables de l'environneemnt de prod
export STRIPE_SECRET_KEY='sk_test_51Q5ryr4D4FENxv0JCvVWWGNcfpFfxLH0gvKG6K6yNqfsyNEsfxOs0M9Qcs0Oc74MsGfQ5yLkhwxZeSq8k1hMPBV400qizlpXZC'
export STRIPE_PUBLISHABLE_KEY='pk_test_51Q5ryr4D4FENxv0JIoQGH543mTSaoIlI0xwkz1upHvNMJpeiHC8Ng2EmMTuB8Hvz0jy7eZTGgzDZdlVnuvr2Vokh00M0WXHCFg'
export STRIPE_PRICE_ID_OSPLUSMENSUEL='price_1Q5sHz4D4FENxv0JX8D4cF0S'
export STRIPE_ENDPOINT_SECRET='whsec_bd224d5114f66d5f29d5997b474c3444d86d0fccf69b2f497e90a6c467d8986a'
