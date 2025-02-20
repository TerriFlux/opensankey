/**
 * Get stripe config code
 * @return {*}
 */
export async function getStripePublishableKey(){
  // Get server api url
  const path = window.location.origin
  const url = path + '/stripe/config'
  // use server as proxy to fetch informations
  // -> Avoid "Same-Origin" problem with CORS
  return fetch(url)
    .then(response => {
      if (response.ok)
        return response.json()
      else
        return Promise.reject(response)
    })
    .then( response_json => {
      return response_json.publicKey
    })
}

/**
 * Get stripe subscription infos
 * @return {*}
 */
export async function createSubscription(){
  // Get server api url
  const path = window.location.origin
  const url = path + '/stripe/create-checkout-session/osplus'
  // use server as proxy to fetch informations
  // -> Avoid "Same-Origin" problem with CORS
  return fetch(url, { method: 'POST' })
    .then(response => {
      if (response.ok)
        return response.json()
      else
        return Promise.reject(response)
    })
    .then(response_json => {
      return response_json.clientSecret
    })
}
