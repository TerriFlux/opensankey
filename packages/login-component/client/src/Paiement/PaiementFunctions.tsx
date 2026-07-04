/**
 * Get stripe config code
 * @return {*}
 */
export async function getStripeConfig(): Promise<{ publicKey: string, pricingTableId: string }> {
  const url = window.location.origin + '/stripe/config'
  return fetch(url)
    .then(response => {
      if (response.ok)
        return response.json()
      else
        return Promise.reject(response)
    })
}

export async function getStripePublishableKey(){
  return getStripeConfig().then(cfg => cfg.publicKey)
}

export type LicenseType = 'osplusmensuel' | 'osplusannuel'
/**
 * Get stripe subscription infos
 * @return {*}
 */
// export async function createSubscription(license:LicenseType){
//   // Get server api url
//   const path = window.location.origin
//   const url = path + `/stripe/create-checkout-session/${license}`
//   // use server as proxy to fetch informations
//   // -> Avoid "Same-Origin" problem with CORS
//   return fetch(url, { method: 'POST' })
//     .then(response => {
//       if (response.ok)
//         return response.json()
//       else
//         return Promise.reject(response)
//     })
//     .then(response_json => {
//       return response_json.clientSecret
//     })
// }

