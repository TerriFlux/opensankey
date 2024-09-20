import * as d3 from 'd3'
import LZString from 'lz-string'

import {
  activateLicenseToken,
  app_name_opensankeyplus,
  app_name_sankeysuite
} from '../Register/LicenseFunctions'
import { Type_GenericApplicationDataOSP } from '../../deps/OpenSankey+/types/TypesOSP'

// Activate license Tokens if licenses are valid
export function activateLicensesTokens(
  new_data: Type_GenericApplicationDataOSP
  // update: boolean,
  // set_update: (_: boolean) => void
) {
  // // Check AFM license
  // activateLicenseToken(
  //   app_name_sankeysuite,
  //   '/user_infos/license_sankeysuite',
  //   () => {
  //     set_update(!update)
  //   }
  // )
  // Check OpenSankey+ licence
  activateLicenseToken(
    app_name_opensankeyplus,
    '/user_infos/license_opensankeyplus',
    () => {new_data.activateSankeyPlus()}
  )
  // // Check if has dev acc
  // fetch('/user_infos/is_developer',)
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
  new_data_plus: Type_GenericApplicationDataOSP,
  credentials: {
    email: string;
    password: string;
    remember: boolean;
  },
  navigate: (route: string) => void
) {
  const { t } = new_data_plus
  // Remove all errors from screen
  d3.select('.LogError').selectAll('*').remove()
  // Fetch Login
  const path = window.location.origin
  const url = path + '/auth/login'
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  })
    .then(response => {
      if (response.ok) {
        return response.json()
      } else {
        d3.select('.LogError').append('p').text(t('Login.err_appel_serveur'))
        return Promise.reject(response)
      }
    })
    .then(data => {
      if (data['is_connected']) {

        sessionStorage.setItem('token', LZString.compress(JSON.stringify(true)))
        activateLicensesTokens(new_data_plus)

        const path = window.location.origin
        const url = path + '/user_infos'
        fetch(url)
          .then(response => {
            if (response.ok) {
              return response.json()
            } else {
              return Promise.reject(response)
            }
          }).then(data => {
            // User data
            if (data.firstname) {
              sessionStorage.setItem('username', LZString.compress(data.firstname))
              //set_update(!update)
            }
          })

        navigate('/')
      } else {
        d3.select('.LogError').append('p').text(t('Login.err_login'))
      }
    })
}

// Properly logOut user
export async function logOutUser(
  logOut: () => void
) {
  // Set all tokens to false
  logOut()
  // LogOut on server
  const path = window.location.origin
  const url = path + '/auth/logout'
  return fetch(url)
}

//Logout
export const loginOut = (
  unsetTokens: () => void,
  returnToApp: () => void
) => {
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('username')
  sessionStorage.removeItem(app_name_opensankeyplus)
  sessionStorage.removeItem(app_name_sankeysuite)
  sessionStorage.removeItem('SankeyDev')
  logOutUser(unsetTokens)
  returnToApp()
}