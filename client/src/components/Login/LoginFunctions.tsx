import * as d3 from 'd3'

import {
  activateLicenseToken,
  app_name_opensankeyplus,
} from '../Register/RegisterFunctions'
import { Class_ApplicationDataSA } from '../../ApplicationData'

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

// Activate license Tokens if licenses are valid
export function activateLicensesTokens(
  new_data_app: Class_ApplicationDataSA
  // update: boolean,
  // set_update: (_: boolean) => void
) {
  // // Check AFM license
  // activateLicenseToken(
  //   app_name_sankeysuite,
  //   '/user/infos/legacy/license_sankeysuite',
  //   () => {
  //     set_update(!update)
  //   }
  // )
  // Check OpenSankey+ licence
  activateLicenseToken(
    app_name_opensankeyplus,
    '/user/infos/legacy/license_opensankeyplus',
    () => { new_data_app.checkTokens() }
  )
  // // Check if has dev acc
  // fetch('/user/infos/legacy/is_developer',)
  //   .then(response => {
  //     if (response.ok) {
  //       return response.json()
  //     } else {
  //       return Promise.reject(response)
  //     }
  //   }).then(data => {
  //     if (data.is_dev) {
  //       sessionStorage.setItem('SankeyDev', LZString.compress(JSON.stringify(true)))
  //     }
  //     //set_update(!update)
  //   })
}

// Check if login if valid
export async function loginUser(
  new_data_app: Class_ApplicationDataSA,
  credentials: {
    email: string;
    password: string;
    remember: boolean;
  },
  callbackSuccess: () => void
) {
  const { t } = new_data_app
  // Remove all errors from screen
  resetLogs()
  // Fetch Login
  const path = window.location.origin
  const url = path + '/auth/login'
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  })
    .then(response => {
      if (response.ok) {
        return response.json()
      }
      else {
        logError(t('Login.err_server'))
        return Promise.reject(response)
      }
    })
    .then(response => {
      if (response['message'] === 'ok') {
        logInfo(t('Login.msg.ok'))
        return
      }
      else {
        logError(t('Login.msg.' + response['message']))
        return Promise.reject(response)
      }
    })
    .then(() => {
      return new_data_app.checkTokens(true)
    })
    .then(() => {
      callbackSuccess()
    })
    .catch(error => {
      console.error('Error in loginUser - ' + error.toString())
    })

}

//Logout
export function loginOut(
  new_data_app: Class_ApplicationDataSA,
  callback = () => { }
) {
  // LogOut on server
  const path = window.location.origin
  const url = path + '/auth/logout'
  return fetch(url)
    .then(() => {
      // Check that we are effectivly disconnected
      return new_data_app.checkTokens(true)
    })
    .then(callback)
}

/**
 * Send API request to trigger reset user password
 * @export
 * @param {Class_ApplicationDataSA} new_data_app
 * @param {{
 *     email: string,
 *     lang: string,
 *   }} infos
 * @param {() => void} callbackSuccess
 * @return {*}
 */
export async function triggerPasswordReset(
  new_data_app: Class_ApplicationDataSA,
  infos: {
    email: string,
    lang: string,
  },
  callbackSuccess: () => void
) {
  const { t } = new_data_app
  // Remove all errors from screen
  resetLogs()
  // Fetch Login
  const path = window.location.origin
  const url = path + '/auth/forgot_pw'
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(infos)
  })
    .then(response => {
      if (response.ok) {
        return response.json()
      }
      else {
        logError(t('Login.forgot.msg.err_server'))
        return Promise.reject(response)
      }
    })
    .then(data => {
      if (data['user_is_authenticated'] === true) {
        logError(t('Login.forgot.msg.err_user_already_connected'))
      }
      else if (data['user_exists'] === false) {
        logError(t('Login.forgot.msg.err_user_inexistant'))
      }
      else {
        logInfo(t('Login.forgot.msg.mail_sent'))
        setTimeout(
          callbackSuccess,
          3000
        )
      }
    })
    .catch(error => {
      console.error('Error in triggerPasswordReset - ' + error.toString())
    })
}

/**
 * Send API request to effectively change password in database
 * based on given request token
 *
 * @export
 * @param {Class_ApplicationDataSA} new_data_app
 * @param {{
 *     token: string,
 *     password: string,
 *     lang: string,
 *   }} infos
 * @param {() => void} callbackSuccess
 * @return {*}
 */
export async function applyPasswordReset(
  new_data_app: Class_ApplicationDataSA,
  token: string,
  infos: {
    password: string,
    lang: string,
  },
  callbackSuccess: () => void
) {
  const { t } = new_data_app
  // Remove all errors from screen
  d3.select('.LogError').selectAll('*').remove()
  // Fetch Login
  const path = window.location.origin
  const url = path + '/auth/reset_pw/' + token
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(infos)
  })
    .then(response => {
      if (response.ok) {
        return response.json()
      } else {
        d3.select('.LogError').append('p').text(t('Login.forgot.msg.err_server'))
        return Promise.reject(response)
      }
    })
    .then(data => {
      if (data['user_is_authenticated'] === true) {
        d3.select('.LogError').append('p').text(t('Login.forgot.msg.err_user_already_connected'))
        return
      }
      if (data['passwd_is_updated'] === true) {
        d3.select('.LogInfo').append('p').text(t('Login.forgot.msg.ok'))
        setTimeout(
          callbackSuccess,
          3000
        )
        return
      }
      d3.select('.LogError').append('p').text(t('Login.forgot.msg.err_token_expire'))
    })
    .catch(error => {
      console.error('Error in applyPasswordReset - ' + error.toString())
    })
}