
import * as d3 from 'd3'
import React, { FunctionComponent, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaPowerOff } from 'react-icons/fa'
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Image,
  Input,
  Spinner,
  Text
} from '@chakra-ui/react'

import { Type_GenericApplicationDataOSP } from '../../deps/OpenSankey+/types/TypesOSP'

import {
  checkLicenseOpenOSP,
  checkLicenseSankeySuite,
  registerNewLicenseOpenOSP,
  // registerNewLicenseSankeySuite
} from '../Register/LicenseFunctions'
import {
  logOutUser,
  activateLicensesTokens
} from '../Login/LoginFunctions'

// UserData interface
interface UserData {
  count: number
  loading: boolean
  firstname: string
  name: string,
  id: string
  loading_opensankeyplus: boolean
  license_opensankeyplus_id: string
  license_opensankeyplus_active: string
  license_opensankeyplus_validity: string
  loading_sankeysuite: boolean
  license_sankeysuite_id: string
  license_sankeysuite_active: string
  license_sankeysuite_validity: string
}

// Account
export type AccountTypes = {
  new_data_plus: Type_GenericApplicationDataOSP,
  blocker_suite_sankey: { [_: string]: JSX.Element }
}

const Account: FunctionComponent<AccountTypes> = ({
  new_data_plus,
  blocker_suite_sankey,
}) => {

  // Initialise traduction function
  const { t, logo } = new_data_plus

  // Define navigation behaviour to return to App
  const navigate = useNavigate()
  const returnToApp = () => {
    navigate('/')
  }

  //If we acces this page without being logged, it is resent to the application
  if (!new_data_plus.has_free_account) {
    returnToApp()
  }

  //If we are logged the the following behaviors are defined
  //Return to Dashboard
  const returnToDashboard = () => {
    navigate('/dashboard')
  }

  //Logout
  const loginOut = () => {
    logOutUser(new_data_plus.unsetTokens)
    returnToApp()
  }

  // Activate and save a new license OpenSankey+
  const signupNewLicenseOpenOSP = () => {
    // Check licence and activate from EDD
    if (newLicenseOpenOSPToCheck) {
      registerNewLicenseOpenOSP(newLicenseOpenOSP)
        .then(() => {
          // Save in db
          const path = window.location.origin
          const url = path + '/user_infos/license_opensankeyplus'
          fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              license_id: newLicenseOpenOSP,
            })
          }).then(response => {
            if (response.ok) {
              return response.json()
            } else {
              return Promise.reject(response)
            }
          }).then(() => {
            // console.log('POST /user_infos/license_opensankeyplus : SUCCESS - ', data.message)
            const userData_ = userData
            userData_.loading_opensankeyplus = true
            userData_.license_opensankeyplus_id = newLicenseOpenOSP
            userData_.license_opensankeyplus_active = ''
            userData_.license_opensankeyplus_validity = ''
            setUserData(userData_)
            setReqCount(1)
            activateLicensesTokens(new_data_plus) //Update tokens
            // setSuiteApplicationContext({...suiteApplicationContext})
          }).catch(error =>
            console.log('POST /user_infos/license_opensankeyplus : ERROR - ', error)
          )
        })
        .catch(error => {
          console.log('signupNewLicenseOpenOSP : ERROR - ', error)
        })
    }
  }

  // // Activate and save a new license SankeySuite
  // const signupNewLicenseSankeySuite = () => {
  //   // Check licence and activate from EDD
  //   registerNewLicenseSankeySuite(newLicenseSankeySuite)
  //     .then(() => {
  //       // Save in db
  //       const path = window.location.origin
  //       const url = path + '/user_infos/license_sankeysuite'
  //       fetch(url, {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({
  //           license_id: newLicenseSankeySuite,
  //         })
  //       }).then(response => {
  //         if (response.ok) {
  //           return response.json()
  //         } else {
  //           return Promise.reject(response)
  //         }
  //       }).then(() => {
  //         // console.log('POST /user_infos/license_sankeysuite : SUCCESS - ', data_resp.message)
  //         const userData_ = userData
  //         userData_.loading_sankeysuite = true
  //         userData_.license_sankeysuite_id = newLicenseSankeySuite
  //         userData_.license_sankeysuite_active = ''
  //         userData_.license_sankeysuite_validity = ''
  //         setUserData(userData_)
  //         setReqCount(1)
  //         activateLicensesTokens(update,set_update) //Update tokens
  //         // set_update(!update)
  //       }).catch(error =>
  //         console.log('POST /user_infos/license_sankeysuite : ERROR - ', error)
  //       )
  //     })
  //     .catch(error => {
  //       console.log('signupNewLicenseSankeySuite : ERROR - ', error)
  //     })
  // }

  const userDataDefault: UserData = {
    count: 0,
    loading: true,
    firstname: '-',
    name: '-',
    id: '-',
    loading_opensankeyplus: true,
    license_opensankeyplus_id: '',
    license_opensankeyplus_active: '',
    license_opensankeyplus_validity: '',
    loading_sankeysuite: true,
    license_sankeysuite_id: '',
    license_sankeysuite_active: '',
    license_sankeysuite_validity: ''
  }

  // Hooks
  const [userData, setUserData] = useState(userDataDefault)
  const [reqCount, setReqCount] = useState(1)
  const [newLicenseOpenOSP, setNewLicenseOpenOSP] = useState('')
  const [newLicenseOpenOSPToCheck, setNewLicenseOpenOSPToCheck] = useState(false)
  // const [newLicenseSankeySuite, setNewLicenseSankeySuite] = useState('')
  // const [newLicenseSankeySuiteToCheck, setNewLicenseSankeySuiteToCheck] = useState(false)

  // Get user's data
  useEffect(() => {
    // Display error on screen
    d3.select('.LogError').selectAll('*').remove()

    // Get user data if we dont have
    if (userData.loading === true && reqCount < 20) {
      let reqCount_ = reqCount
      // Get user's infos
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
          const userData_ = userData
          userData_.name = data.name
          userData_.firstname = data.firstname
          userData_.id = data.email
          if (data.license_opensankeyplus !== '' &&
            data.license_opensankeyplus !== '0000' &&
            typeof (data.license_opensankeyplus) !== 'undefined')
            userData_.license_opensankeyplus_id = data.license_opensankeyplus
          else
            userData_.license_opensankeyplus_id = '-'
          if (data.license_sankeysuite !== '' &&
            data.license_sankeysuite !== '0000' &&
            typeof (data.license_sankeysuite) !== 'undefined')
            userData_.license_sankeysuite_id = data.license_sankeysuite
          else
            userData_.license_sankeysuite_id = '-'
          userData_.loading = false
          setUserData(userData_)
          // Increase number of requests
          reqCount_ = reqCount_ + 1
          setReqCount(reqCount_)
        }).catch(error => {
          // Erreur fetch user data
          console.log('user_info : ERROR', error)
          d3.select('.LogError').append('p').style('color', 'red').text(t('User.Pages.err_get_user_infos'))
          // Increase number of requests
          reqCount_ = reqCount_ + 1
          setReqCount(reqCount_)
        })
    }

    // User's OpenSankey+ licence data
    if (userData.license_opensankeyplus_id === '-') {
      const userData_ = userData
      userData_.loading_opensankeyplus = false
      userData_.license_opensankeyplus_active = t('UserPages.usr_no_lic')
      setUserData(userData_)
    } else {
      if (userData.license_opensankeyplus_id !== '' &&
        userData.loading_opensankeyplus === true &&
        reqCount < 10) {
        let reqCount_ = reqCount
        // Get license informations
        checkLicenseOpenOSP(userData.license_opensankeyplus_id)
          .then(data_edd => {
            // Verify opensankeyplus license validity
            const userData_ = userData
            if (data_edd.success) {
              userData_.license_opensankeyplus_validity = t('UserPages.usr_lic_validdate') + data_edd.expires.substring(0, 10)
              userData_.license_opensankeyplus_active = t('UserPages.usr_lic_valid') // active, inactive, expired, disabled
            }
            else {
              if (data_edd.license === 'invalid') {
                userData_.license_opensankeyplus_active = t('UserPages.usr_lic_invalid')
              } else if (data_edd.license === 'expired') {
                userData_.license_opensankeyplus_active = t('UserPages.usr_lic_expdate')
                userData_.license_opensankeyplus_validity = data_edd.expires.substring(0, 10)
              } else if (data_edd.license === 'disabled') {
                userData_.license_opensankeyplus_active = t('UserPages.usr_lic_deactivated')
              } else {
                userData_.license_opensankeyplus_active = t('UserPages.usr_lic_err')
              }
            }
            userData_.loading_opensankeyplus = false
            setUserData(userData_)
            // Increase number of requests
            reqCount_ = reqCount_ + 1
            setReqCount(reqCount_)
          }).catch(error => {
            // Erreur fetch license
            d3.select('.LogError').append('p').style('color', 'red').text(t('UserPages.err_get_OS+_infos'))
            console.log('check_license OpenSankey+ : ERROR', error)
            // Increase number of requests
            reqCount_ = reqCount_ + 1
            setReqCount(reqCount_)
          })
      }
    }

    // User's SankeySuite licence data
    if (userData.license_sankeysuite_id === '-') {
      const userData_ = userData
      userData_.loading_sankeysuite = false
      userData_.license_sankeysuite_active = t('UserPages.usr_no_lic')
      setUserData(userData_)
    }
    else {
      if (userData.license_sankeysuite_id !== '' &&
        userData.loading_sankeysuite === true &&
        reqCount < 10) {
        let reqCount_ = reqCount
        // Get license informations
        checkLicenseSankeySuite(userData.license_sankeysuite_id)
          .then(data_edd => {
            // Verify MFA license validity
            const userData_ = userData
            if (data_edd.success) {
              userData_.license_sankeysuite_validity = t('UserPages.usr_lic_validdate') + data_edd.expires.substring(0, 10)
              userData_.license_sankeysuite_active = t('UserPages.usr_lic_valid') // active, inactive, expired, disabled
            }
            else {
              if (data_edd.license === 'invalid') {
                userData_.license_sankeysuite_active = t('UserPages.usr_lic_invalid')
              } else if (data_edd.license === 'expired') {
                userData_.license_sankeysuite_active = t('UserPages.usr_lic_expdate')
                userData_.license_sankeysuite_validity = data_edd.expires.substring(0, 10)
              } else if (data_edd.license === 'disabled') {
                userData_.license_sankeysuite_active = t('UserPages.usr_lic_deactivated')
              } else {
                userData_.license_sankeysuite_active = t('UserPages.usr_lic_err')
              }
            }
            userData_.loading_sankeysuite = false
            setUserData(userData_)
            // Increase number of requests
            reqCount_ = reqCount_ + 1
            setReqCount(reqCount_)
          }).catch(error => {
            // Erreur fetch license
            d3.select('.LogError').append('p').style('color', 'red').text(t('UserPages.err_get_SS_infos'))
            console.log('check_license SankeySuite : ERROR', error)
            // Increase number of requests
            reqCount_ = reqCount_ + 1
            setReqCount(reqCount_)
          })
      }
    }
  }, [reqCount, userData, t])

  const has_blockers = Object.keys(blocker_suite_sankey).length > 0

  return (
    <div>
      {/* Top Navbar */}
      <Box
        zIndex="1"
        position="fixed"
        top="0"
        width="100%"
      >
        <Box
          className='MenuNavigation'
          layerStyle='menutop_layout_style'
          gridTemplateColumns='minmax(7vw, 150px) auto'
        >
          <Box
            margin='0.25rem'
            alignSelf='center'
            justifySelf='left'
          >
            <Image
              height='4rem'
              src={logo}
              alt='navigation logo'
              onClick={() => returnToApp()}
            />
          </Box>
          <Box
            display='grid'
            gridTemplateColumns='3fr 3fr 1fr'
            alignSelf='center'
            justifySelf='right'
          >
            <Button
              variant='btn_lone_navigation'
              onClick={() => returnToApp()}
            >
              {t('UserPages.to_app')}
            </Button>
            <Button
              variant='btn_lone_navigation'
              onClick={() => returnToDashboard()}
            >
              {t('UserPages.to_acc')}
            </Button>
            <Button
              variant='menutop_button_logout'
              onClick={() => {
                loginOut()
              }}
            >
              <FaPowerOff />
            </Button>
          </Box>
        </Box>
      </Box>

      <div>
        <Card variant='card_account' >
          <CardHeader style={{ 'textAlign': 'left' }}>{t('UserPages.win_acc_infos')}</CardHeader>
          <CardBody>
            {userData.loading ? (
              <Spinner />
            ) : (
              <Box layerStyle='menuconfigpanel_grid'>
                {/* Infos utilisateur  --------------------------------------------------------- */}
                <Box layerStyle='account_row'>
                  <Text>{t('UserPages.pnom')}</Text>
                  <Text>{userData.firstname}</Text>
                </Box>
                <Box layerStyle='account_row'>
                  <Text>{t('UserPages.nom')}</Text>
                  <Text>{userData.name}</Text>
                </Box>
                <Box layerStyle='account_row' >
                  <Text>{t('UserPages.id')}</Text>
                  <Text>{userData.id}</Text>
                </Box>

                {/* Infos licence OpenSankey+  --------------------------------------------------------- */}
                <Box layerStyle='account_row'>
                  <Box>
                    {has_blockers ? <>{blocker_suite_sankey['block_osp']}</> : <></>}
                    {t('UserPages.OS+_lic')}
                  </Box>
                  <Input
                    onChange={(e) => {
                      setNewLicenseOpenOSP(e.target.value)
                      setNewLicenseOpenOSPToCheck(true)
                    }
                    }
                    placeholder={userData.license_opensankeyplus_id} />
                  <Button
                    variant='menuconfigpanel_option_button'
                    onClick={() => signupNewLicenseOpenOSP()}
                    isDisabled={newLicenseOpenOSPToCheck === false}>
                    {t('UserPages.update_lic')}
                  </Button>
                  {userData.loading_opensankeyplus ? (
                    <>
                      <Spinner animation="border" />
                      <Spinner animation="border" />
                    </>
                  ) : (
                    <>
                      <Text>{userData.license_opensankeyplus_active}</Text>
                      <Text>{userData.license_opensankeyplus_validity}</Text>
                    </>
                  )}
                </Box>

                {/* Infos licence SankeySuite  --------------------------------------------------------- */}
                {/* <Box layerStyle='account_row'>
                  <Box>
                    {has_blockers ? <>
                      {blocker_suite_sankey['block_ssm']}</>
                      : <></>}
                    {t('UserPages.SS_lic')}
                  </Box>
                  <Input
                    onChange={(e) => {
                      setNewLicenseSankeySuite(e.target.value)
                      setNewLicenseSankeySuiteToCheck(true)
                    }
                    }
                    placeholder={userData.license_sankeysuite_id} />
                  <Button
                    variant='menuconfigpanel_option_button'
                    onClick={() => signupNewLicenseSankeySuite()}
                    isDisabled={newLicenseSankeySuiteToCheck === false}>
                    {t('UserPages.update_lic')}
                  </Button>
                  {userData.loading_sankeysuite ? (
                    <>
                      <Spinner animation="border" />
                      <Spinner animation="border" />
                    </>
                  ) : (
                    <>
                      <Text>{userData.license_sankeysuite_active}</Text>
                      <Text>{userData.license_sankeysuite_validity}</Text>
                    </>
                  )}
                </Box> */}
              </Box>
            )}
            <div className='LogError' style={{ 'color': 'red' }}></div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default Account




