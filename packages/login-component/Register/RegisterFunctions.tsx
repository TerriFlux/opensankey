
import * as d3 from 'd3'
import LZString from 'lz-string'
import i18next from 'i18next'
import { NavigateFunction } from 'react-router-dom'
import { LoginComponent } from '../LoginComponent'

export const app_name_opensankeyplus = 'OpenSankey+'
export const app_name_sankeysuite = 'SankeySuite'


const resetLogs = () => {
  d3.select('.LogInfo').selectAll('*').remove()
  d3.select('.LogError').selectAll('*').remove()
}

export const logInfo = (info: string) => {
  d3.select('.LogInfo').append('p').text(info)
}

export const logError = (err: string) => {
  d3.select('.LogError').append('p').text(err)
}

// Check Licence and register account if everything is Ok
export async function userSignUp(
  email: string,
  password: string,
  firstname: string,
  lastname: string,
  callback: (ok: boolean) => void
) {
  resetLogs()
  fetch(window.location.origin + '/auth/signup/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      password: password,
      firstname: firstname,
      lastname: lastname,
      lang: i18next.language
    })
  })
    .then((response) => {
      if (response.ok)
        return response.json()
      else
        logError(i18next.t('Register.account.msg.nok'))
      return Promise.reject(response)
    })
    .then((response) => {
      if (response) {
        if (response['message'] === 'ok') {
          logInfo(i18next.t('Register.account.msg.ok'))
          callback(true)
        }
        else {
          logError(i18next.t('Register.account.msg.' + response['message']))
          callback(false)
        }
      }
    })
    .catch(error => {
      console.error('Error in userSignUp - ' + error.toString())
    })

}

// Check Licence and register account if everything is Ok
export async function userValidate(
  token: string,
  loginComponent:()=>LoginComponent,
  navigate: NavigateFunction
) {
  resetLogs()

  // Enregistrement dans la base de donnée utilisateur
  fetch(window.location.origin + '/auth/signup/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: token
    })
  })
    .then((response) => {
      if (response.ok)
        return response.json()
      else {
        logError(i18next.t('Register.validation.msg.nok'))
        return Promise.reject(response)
      }
    })
    .then((response) => {
      logInfo(i18next.t('Register.validation.msg.' + response['message']))
    })
    .then(() => {
      return loginComponent().checkTokens(true)
    })
    .then(() => {
      let next_page
      if (loginComponent().has_account) {
        logInfo(i18next.t('Register.validation.msg.redirect'))
        next_page = '/license/checkout'
      }
      else {
        next_page = '/login'
      }
      setTimeout(
        () => navigate(next_page),
        3000
      )
    })
    .catch(error => {
      console.error('Error in userValidate - ' + error.toString())
    })

}

// Check a license status
async function checkLicense(
  app_name: string,
  license_id: string
) {
  // Get server api url
  const path = window.location.origin
  const url = path + '/api/edd_license'
  // use server as proxy to fetch informations
  // -> Avoid "Same-Origin" problem with CORS
  const data = fetch(url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'action': 'check_license',
        'app_name': app_name,
        'license_id': license_id
      })
    })
    .then(response => response.json())
    .then(response_json => {
      return response_json
    })
  return data
}

export async function checkLicenseOpenOSP(
  license_id: string
) {
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
) {
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
  const data = fetch(url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'action': 'activate_license',
        'app_name': app_name,
        'license_id': license_id
      })
    })
    .then(response => response.json())
    .then(response_json => {
      return response_json
    })
  return data
}

// Register a new license
async function registerNewLicense(
  app_name: string,
  license_id: string
) {
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
            .catch(error => {
              // Erreur activate license
              reject('Error in activate licence - ' + error.toString())
            })
        } else {
          reject('Failed to check licence')
        }
      })
      .catch(error => {
        // Erreur fetch license
        reject('Error in check licence - ' + error.toString())
      })
  })
}

export async function registerNewLicenseOpenOSP(
  license_id: string
) {
  return new Promise((resolve, reject) => {
    registerNewLicense(
      app_name_opensankeyplus,
      license_id)
      .then(_ => {
        resolve(_)
      })
      .catch(error => {
        reject(error)
      })
  })
}

export async function registerNewLicenseSankeySuite(
  license_id: string
) {
  return new Promise((resolve, reject) => {
    registerNewLicense(
      app_name_sankeysuite,
      license_id)
      .then(_ => {
        resolve(_)
      })
      .catch(error => {
        reject(error)
      })
  })
}

export async function activateLicenseToken(
  app_name: string,
  req_url: string,
  setLicenseToken: () => void) {
  // Check AFM license
  fetch(req_url)
    .then(response => {
      if (response.ok) {
        return response.json()
      } else {
        return Promise.reject(response)
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