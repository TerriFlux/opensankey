import LZString from 'lz-string'

export const app_name_opensankeyplus = 'OpenSankey+'
export const app_name_sankeysuite = 'SankeySuite'

// Check a license status
async function checkLicense(
  app_name: string,
  license_id: string
){
  // Get server api url
  const path = window.location.origin
  const url = path + '/api/edd_license'
  // use server as proxy to fetch informations
  // -> Avoid "Same-Origin" problem with CORS
  const data =  fetch(url,
    { method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'action': 'check_license',
        'app_name': app_name,
        'license_id': license_id
      })
    })
    .then( response => response.json() )
    .then( response_json => {
      return response_json
    })
  return data
}

export async function checkLicenseOpenOSP(
  license_id: string
){
  const data = await checkLicense(
    app_name_opensankeyplus,
    license_id)
    .then(_ => {
      return _
    })
  return data
}

export async function checkLicenseSankeySuite(
  license_id: string
){
  const data = await checkLicense(
    app_name_sankeysuite,
    license_id)
    .then(_ => {
      return _
    })
  return data
}

// Activate a new license
async function activateLicense(
  app_name: string,
  license_id: string
) {
  // Get server api url
  const path = window.location.origin
  const url = path + '/api/edd_license'
  // use server as proxy to fetch informations
  // -> Avoid "Same-Origin" problem with CORS
  const data =  fetch(url,
    { method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'action': 'activate_license',
        'app_name': app_name,
        'license_id': license_id
      })
    })
    .then( response => response.json() )
    .then( response_json => {
      return response_json
    })
  return data
}

// Register a new license
async function registerNewLicense(
  app_name: string,
  license_id: string
){
  return new Promise((resolve, reject) => {
    checkLicense(
      app_name,
      license_id)
      .then(data_edd_check => {
        if (data_edd_check.success) {
          activateLicense(app_name, license_id)
            .then(data_edd_activate => {
              if (data_edd_activate.success) {
                resolve('Activation succeeded')
              }
              else {
                reject('Failed to activate licence')
              }
            })
            .catch( error => {
              // Erreur activate license
              reject('Error in activate licence - ' + error.toString())
            })
        } else {
          reject('Failed to check licence')
        }
      }).catch( error => {
        // Erreur fetch license
        reject('Error in check licence - ' + error.toString())
      })
  })
}

export async function registerNewLicenseOpenOSP(
  license_id: string
){
  return new Promise((resolve, reject) => {
    registerNewLicense(
      app_name_opensankeyplus,
      license_id)
      .then(_ => {
        resolve(_)
      })
      .catch( error => {
        reject(error)
      })
  })
}

export async function registerNewLicenseSankeySuite(
  license_id: string
){
  return new Promise((resolve, reject) => {
    registerNewLicense(
      app_name_sankeysuite,
      license_id)
      .then(_ => {
        resolve(_)
      })
      .catch( error => {
        reject(error)
      })
  })
}

export async function activateLicenseToken(
  app_name: string,
  req_url: string,
  setLicenseToken:()=>void)
{
  // Check AFM license
  fetch(req_url)
    .then(response => {
      if ( response.ok ) {
        return response.json()
      } else {
        return Promise.reject( response )
      }
    }).then(data => {
      checkLicense(
        app_name,
        data.license_id
      ).then(data_edd => {
        if (data_edd.success && data_edd.license === 'valid') {
          sessionStorage.setItem(app_name, LZString.compress(JSON.stringify(true)))
          setLicenseToken()
        }
      })
    })
}