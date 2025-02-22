
import * as d3 from 'd3'
import React, { FunctionComponent, useState, useEffect } from 'react'
import { useNavigate, NavigateFunction } from 'react-router-dom'
import i18next from 'i18next'
import { TFunction } from 'i18next'
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Editable,
  EditableInput,
  EditablePreview,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Image,
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  Select,
  Spinner,
  Text,
  useDisclosure
} from '@chakra-ui/react'

import {
  checkLicenseOpenOSP,
  registerNewLicenseOpenOSP,
  // registerNewLicenseSankeySuite
} from '../Register/RegisterFunctions'
import {
  activateLicensesTokens,
} from '../Login/LoginFunctions'
import { LoginOutButton } from '../Login/Login'
import { email_regex_str, name_regex_str, pwd_regex_str } from '../Register/Register'
import { LoginComponent } from '../LoginComponent'

// Interfaces ---------------------------------------------------------------------------

interface IType_Log {
  info: string,
  err: string
}

interface IType_UserData {
  count: number,
  loading: boolean,
  email: string,
  firstname: string,
  name: string,
  // Legacy license
  loading_legacy_opensankeyplus: boolean,
  license_legacy_opensankeyplus_id: string,
  license_legacy_opensankeyplus_active: string,
  license_legacy_opensankeyplus_validity: string,
  // New license
  license_opensankeyplus_active: boolean,
  license_opensankeyplus_expiry: string,
}

// Constants ---------------------------------------------------------------------------

const log_default: IType_Log = {
  info: '',
  err: ''
}

const user_data_default: IType_UserData = {
  count: 0,
  loading: true,
  email: '-',
  firstname: '-',
  name: '-',
  loading_legacy_opensankeyplus: true,
  license_legacy_opensankeyplus_id: '',
  license_legacy_opensankeyplus_active: '',
  license_legacy_opensankeyplus_validity: '',
  license_opensankeyplus_active: false,
  license_opensankeyplus_expiry: '',
}

const possible_feedback: string[] = [
  'customer_service',
  'low_quality',
  'missing_features',
  'switched_service',
  'too_complex',
  'too_expensive',
  'unused',
  'other'
]

// Account
export type AccountTypes = {
  t:TFunction,
  logo:string,
  logo_sankey_plus:string,
  returnToApp: (navigate: NavigateFunction) => void,
  loginComponent:()=>LoginComponent,
  noLicenceAccountRequired: boolean,
  blocker_suite_sankey: { [_: string]: JSX.Element },
  setUpdate:React.MutableRefObject<() => void>
}

const Account: FunctionComponent<AccountTypes> = ({
  t,
  logo,
  logo_sankey_plus,
  returnToApp,
  loginComponent,
  noLicenceAccountRequired,
  blocker_suite_sankey,
  setUpdate
}) => {

  // Define navigation behaviour to return to App
  const navigate = useNavigate()

  //If we acces this page without being logged, it is resent to the application
  if (!loginComponent().has_account) {
    returnToApp(navigate)
  }

  // Email modal : checks password for e-mail modification
  const {
    isOpen: isEmailChangeModalOpen,
    onOpen: onEmailChangeModalOpen,
    onClose: onEmailChangeModalClose
  } = useDisclosure()
  const [user_new_email, setUserNewEmail] = useState('')
  const [user_new_email_valid, setUserNewEmailValid] = useState(true)
  const [password, setPassword] = useState('')
  const [show_password, setShowPassword] = useState(false)

  // Password change modal : check a secret to change
  const {
    isOpen: isPwdChangeModalOpen,
    onOpen: onPwdChangeModalOpen,
    onClose: onPwdChangeModalClose
  } = useDisclosure()
  const [new_password_valid, setNewPasswordValid] = useState(true)
  const [new_password, setNewPassword] = useState('')
  const [show_new_password, setShowNewPassword] = useState(false)
  const [secret, setSecret] = useState('')

  // Account deletion modal questions
  const {
    isOpen: isDeleteAccountModalOpen,
    onOpen: onDeleteAccountModalOpen,
    onClose: onDeleteAccountModalClose
  } = useDisclosure()
  const [err_delete, setErrDelete] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [comment, setComment] = useState('')

  // User informations
  const [user_data, setUserData] = useState(user_data_default)
  const [user_new_firstname, setUserNewFirstName] = useState('')
  const [user_new_firstname_valid, setUserNewFirstNameValid] = useState(true)
  const [user_new_lastname, setUserNewLastName] = useState('')
  const [user_new_lastname_valid, setUserNewLastNameValid] = useState(true)
  // Messages
  const [msgs_login_modification, setMsgsLoginModification] = useState(structuredClone(log_default))
  const [msgs_userdata_modification, setMsgsUserdataModification] = useState(structuredClone(log_default))
  const [msgs_modal_del_account, setMsgsLicenseModification] = useState(structuredClone(log_default))

  // Activate and save a new license OpenSankey+
  const signupNewLicenseOpenOSP = () => {
    // Check licence and activate from EDD
    if (newLicenseOpenOSPToCheck) {
      registerNewLicenseOpenOSP(newLicenseOpenOSP)
        .then(() => {
          // Save in db
          const path = window.location.origin
          const url = path + '/user/infos/legacy/license_opensankeyplus'
          fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              license_id: newLicenseOpenOSP,
            })
          })
            .then(response => {
              if (response.ok) {
                return response.json()
              } else {
                return Promise.reject(response)
              }
            })
            .then(() => {
              // console.log('POST /user/infos/legacy/license_opensankeyplus : SUCCESS - ', data.message)
              const userData_ = user_data
              userData_.loading_legacy_opensankeyplus = true
              userData_.license_legacy_opensankeyplus_id = newLicenseOpenOSP
              userData_.license_legacy_opensankeyplus_active = ''
              userData_.license_legacy_opensankeyplus_validity = ''
              setUserData(userData_)
              setReqCount(1)
              activateLicensesTokens(loginComponent,setUpdate) //Update tokens
              // setSuiteApplicationContext({...suiteApplicationContext})
            })
            .catch(error => {
              console.error('Error in registerNewLicenseOpenOSP - ' + error.toString())
            })
        })
        .catch(error => {
          console.error('Error in signupNewLicenseOpenOSP - ' + error.toString())
        })
    }
  }

  // Credentials modifications ----------------------------------------------------------

  /**
   * Add info message on login credential modification
   * @param {string} s
   */
  const setInfoMsgForLoginModification = (s: string) => {
    msgs_login_modification.info = s
    msgs_login_modification.err = ''
    setMsgsLoginModification(msgs_login_modification)
  }

  /**
   * Add err message on login credential modification
   * @param {string} s
   */
  const setErrMsgForLoginModification = (s: string) => {
    msgs_login_modification.info = ''
    msgs_login_modification.err = s
    setMsgsLoginModification(msgs_login_modification)
  }

  /**
   * Clear all messages on login credential modification
   * @param {string} s
   */
  const clearMsgsForLoginModification = () => {
    msgs_login_modification.info = ''
    msgs_login_modification.err = ''
    setMsgsLoginModification(msgs_login_modification)
  }


  /**
   * Add info message on license modification
   * @param {string} s
   */
  const setInfoMsgForAccountDeletion = (s: string) => {
    msgs_modal_del_account.info = s
    msgs_modal_del_account.err = ''
    setMsgsLicenseModification(msgs_modal_del_account)
  }

  /**
   * Add err message on license modification
   * @param {string} s
   */
  const setErrMsgForAccountDeletion = (s: string) => {
    msgs_modal_del_account.info = ''
    msgs_modal_del_account.err = s
    setMsgsLicenseModification(msgs_modal_del_account)
    setErrDelete(true)
  }

  /**
   * Clear all messages on license modification
   * @param {string} s
   */
  const clearMsgsForAccountDeletion = () => {
    msgs_modal_del_account.info = ''
    msgs_modal_del_account.err = ''
    setMsgsLicenseModification(msgs_login_modification)
    setErrDelete(false)
  }

  /**
   * Trigger current user email modification
   */
  const verifyEmail = () => {
    // Clear logs
    clearMsgsForLoginModification()
    setUserNewEmailValid(true)
    // Protection against unecessary msgs
    if (user_new_email.length === 0)
      return
    // Check modif
    if (user_new_email.match(email_regex_str) !== null) {
      onEmailChangeModalOpen()
    }
    else {
      setUserNewEmailValid(false)
      setErrMsgForLoginModification(t('UserPages.login_modify.msgs.err_email_regex'))
    }
  }

  /**
   * Submit Email modification
   */
  const submitEmail = () => {
    // Clear logs
    clearMsgsForLoginModification()
    setUserNewEmailValid(true)
    // Protection against unecessary msgs
    if (user_new_email.length === 0)
      return
    // Check modif
    if ((user_new_email.match(email_regex_str) !== null)) {
      if ((user_new_email !== user_data.email)) {
        fetch(window.location.origin + '/user/infos/modify/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user_data.email,
            new_email: user_new_email,
            password: password
          })
        })
          .then(response => {
            if (response.ok) {
              setInfoMsgForLoginModification(t('UserPages.login_modify.msgs.ok_email'))
              // Reset password on modal
              setPassword('')
              setShowPassword(false)
              // Update user_data
              user_data.email = user_new_email
              setUserData(user_data)
            }
            else {
              setUserNewEmailValid(false)
              setErrMsgForLoginModification(t('UserPages.login_modify.msgs.err_email_failed'))
            }
          })
        setInfoMsgForLoginModification(t('UserPages.login_modify.msgs.prs_email'))
      }
    }
    else {
      setUserNewEmailValid(false)
      setErrMsgForLoginModification(t('UserPages.login_modify.msgs.err_email_regex'))
    }
    // Close modal and update
    onEmailChangeModalClose()
  }

  /**
   * Trigger Password change - send email with token
   */
  const triggerPasswordChange = () => {
    // Clear logs
    clearMsgsForLoginModification()
    setNewPasswordValid(true)
    // Protection against unecessary msgs
    if (new_password.length === 0)
      return
    // Check modif
    if (new_password.match(pwd_regex_str) !== null) {
      const lang = i18next.language
      const email = user_data.email
      const path = window.location.origin
      const url = path + '/user/infos/modify/pwd/trigger'
      return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          lang: lang
        })
      })
        .then(response => {
          if (response.ok) {
            return response
          }
          else {
            setNewPasswordValid(false)
            setErrMsgForLoginModification(t('UserPages.login_modify.msgs.err_pwd_failed'))
            return Promise.reject(response)
          }
        })
        .then(() => {
          setPassword('')
          setSecret('')
          setTimeout(
            onPwdChangeModalOpen,
            2000)
          setInfoMsgForLoginModification(t('UserPages.login_modify.msgs.prs_pwd'))
        })
        .catch(error => {
          console.error('Error in triggerPasswordChange - ' + error.toString())
        })
    }
    else {
      setNewPasswordValid(false)
      setErrMsgForLoginModification(t('Register.account.pwd.error'))
    }
  }

  const submitPassword = () => {
    clearMsgsForLoginModification()
    // Protection against unecessary msgs
    if (new_password.length === 0)
      return
    // Set modif
    const path = window.location.origin
    const url = path + '/user/infos/modify/pwd'
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        new_password: new_password,
        token: secret
      })
    })
      .then(response => {
        if (response.ok) {
          return response
        }
        else {
          setErrMsgForLoginModification(t('UserPages.login_modify.msgs.err_pwd_failed'))
          return Promise.reject(response)
        }
      })
      .then(() => {
        setPassword('')
        setSecret('')
        onPwdChangeModalClose()
        setInfoMsgForLoginModification(t('UserPages.login_modify.msgs.ok_pwd'))
      })
      .catch(error => {
        console.error('Error in submitPassword - ' + error.toString())
      })
  }

  /**
   * Trigger Password change - send email with token
   */
  const triggerDeleteAccount = () => {
    clearMsgsForAccountDeletion()
    const path = window.location.origin
    const url = path + '/user/delete/account'
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        comment: comment,
        feedback: feedback,
        password: password
      })
    })
      .then(response => {
        if (response.ok) {
          return response
        }
        else {
          setErrMsgForAccountDeletion(t('UserPages.login_modify.msgs.err_del'))
          return Promise.reject(response)
        }
      })
      .then(() => {
        // Reset password on modal
        setPassword('')
        setShowPassword(false)
        setInfoMsgForAccountDeletion(t('UserPages.login_modify.msgs.ok_del'))
        // Close modal and return to app
        setTimeout(
          () => {
            onDeleteAccountModalClose()
            navigate('/')
          },
          2000)
      })
      .catch(error => {
        console.error('Error in triggerDeleteAccount - ' + error.toString())
      })
  }

  // User data modifications ----------------------------------------------------------

  /**
   * Add info message on user data modification
   * @param {string} s
   */
  const setInfoMsgForUserDataModification = (s: string) => {
    msgs_userdata_modification.info = s
    msgs_userdata_modification.err = ''
    setMsgsUserdataModification(msgs_userdata_modification)
  }

  /**
   * Add err message on user data modification
   * @param {string} s
   */
  const setErrMsgForUserDataModification = (s: string) => {
    msgs_userdata_modification.info = ''
    msgs_userdata_modification.err = s
    setMsgsUserdataModification(msgs_userdata_modification)
  }

  /**
   * Clear all messages on user data modification
   * @param {string} s
   */
  const clearMsgsForUserDataModification = () => {
    msgs_userdata_modification.info = ''
    msgs_userdata_modification.err = ''
    setMsgsUserdataModification(msgs_login_modification)
  }

  const submitFirstnameChange = () => {
    // Clear logs
    clearMsgsForUserDataModification()
    setUserNewFirstNameValid(true)
    // Protection against unecessary msgs
    if (user_new_firstname.length === 0)
      return
    // Check modif
    if (user_new_firstname.match(name_regex_str) !== null) {
      if (user_new_firstname !== user_data.firstname) {
        fetch(window.location.origin + '/user/infos/modify/firstname', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstname: user_new_firstname
          })
        })
          .then(response => {
            if (response.ok) {
              setInfoMsgForUserDataModification(t('UserPages.infos_modify.msgs.ok_firstname'))
            }
            else {
              setUserNewFirstNameValid(false)
              setErrMsgForUserDataModification(t('UserPages.infos_modify.msgs.err_firstname'))
            }
          })
      }
    }
    else {
      setUserNewFirstNameValid(false)
      setErrMsgForUserDataModification(t('UserPages.infos_modify.msgs.err_firstname'))
    }
  }

  const submitLastnameChange = () => {
    // Clear logs
    clearMsgsForUserDataModification()
    setUserNewLastNameValid(true)
    // Protection against unecessary msgs
    if (user_new_lastname.length === 0)
      return
    // Check modif
    if (user_new_lastname.match(name_regex_str) !== null) {
      if (user_new_lastname !== user_data.name) {
        fetch(window.location.origin + '/user/infos/modify/lastname', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lastname: user_new_lastname
          })
        })
          .then(response => {
            if (response.ok) {
              setInfoMsgForUserDataModification(t('UserPages.infos_modify.msgs.ok_lastname'))
            }
            else {
              setUserNewLastNameValid(false)
              setErrMsgForUserDataModification(t('UserPages.infos_modify.msgs.err_lastname'))
            }
          })
      }
    }
    else {
      setUserNewLastNameValid(false)
      setErrMsgForUserDataModification(t('UserPages.infos_modify.msgs.err_lastname'))
    }
  }

  // Licenses modifications ----------------------------------------------------------------

  const openCustomerPage = () => {
    fetch(window.location.origin + '/stripe/create-customer-portal')
      .then(response => {
        if (response.ok)
          return response.json()
        else
          return Promise.reject(response)
      })
      .then(response => {
        window.location.href = response.url
      })
      .catch(error => {
        console.error('Error in openCustomerPage - ' + error.toString())
      })
  }

  const openCheckoutPage = () => {
    navigate('/license/checkout')
  }

  // Hooks
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
    if (user_data.loading === true && reqCount < 20) {
      let reqCount_ = reqCount
      // Get user's infos
      const path = window.location.origin
      const url = path + '/user/infos'
      fetch(url)
        .then(response => {
          if (response.ok) {
            return response.json()
          } else {
            return Promise.reject(response)
          }
        })
        .then(data => {
          const userData_ = user_data
          // User login data
          userData_.email = data.email
          // User info data
          userData_.name = data.name
          userData_.firstname = data.firstname
          // User legacy license data
          if (
            data.license_legacy_opensankeyplus !== '' &&
            data.license_legacy_opensankeyplus !== '0000' &&
            typeof (data.license_legacy_opensankeyplus) !== 'undefined'
          )
            userData_.license_legacy_opensankeyplus_id = data.license_legacy_opensankeyplus
          else
            userData_.license_legacy_opensankeyplus_id = '-'
          // User OpenSankey+ license
          userData_.license_opensankeyplus_active = data.license_opensankeyplus_validity
          userData_.license_opensankeyplus_expiry = data.license_opensankeyplus_expiry
          // Loding indicator - for spinner
          userData_.loading = false
          setUserData(userData_)
          // Increase number of requests - Limit license check spaming
          reqCount_ = reqCount_ + 1
          setReqCount(reqCount_)
        })
        .catch(error => {
          console.error('Error in userInfos - ' + error.toString())
          // Erreur fetch user data
          d3.select('.LogError')
            .append('p')
            .style('color', 'red')
            .text(t('User.Pages.err_get_user_infos'))
          // Increase number of requests
          reqCount_ = reqCount_ + 1
          setReqCount(reqCount_)
        })
    }

    // User's OpenSankey+ licence data
    if (user_data.license_legacy_opensankeyplus_id === '-') {
      const userData_ = user_data
      userData_.loading_legacy_opensankeyplus = false
      userData_.license_legacy_opensankeyplus_active = t('UserPages.usr_no_lic')
      setUserData(userData_)
    }
    else {
      if (user_data.license_legacy_opensankeyplus_id !== '' &&
        user_data.loading_legacy_opensankeyplus === true &&
        reqCount < 10) {
        let reqCount_ = reqCount
        // Get license informations
        checkLicenseOpenOSP(user_data.license_legacy_opensankeyplus_id)
          .then(data_edd => {
            // Verify opensankeyplus license validity
            const userData_ = user_data
            if (data_edd.success) {
              userData_.license_legacy_opensankeyplus_validity = t('UserPages.usr_lic_validdate') + data_edd.expires.substring(0, 10)
              userData_.license_legacy_opensankeyplus_active = t('UserPages.usr_lic_valid') // active, inactive, expired, disabled
            }
            else {
              if (data_edd.license === 'invalid') {
                userData_.license_legacy_opensankeyplus_active = t('UserPages.usr_lic_invalid')
              } else if (data_edd.license === 'expired') {
                userData_.license_legacy_opensankeyplus_active = t('UserPages.usr_lic_expdate')
                userData_.license_legacy_opensankeyplus_validity = data_edd.expires.substring(0, 10)
              } else if (data_edd.license === 'disabled') {
                userData_.license_legacy_opensankeyplus_active = t('UserPages.usr_lic_deactivated')
              } else {
                userData_.license_legacy_opensankeyplus_active = t('UserPages.usr_lic_err')
              }
            }
            userData_.loading_legacy_opensankeyplus = false
            setUserData(userData_)
            // Increase number of requests
            reqCount_ = reqCount_ + 1
            setReqCount(reqCount_)
          })
          .catch(error => {
            // Erreur fetch license
            d3.select('.LogError').append('p').style('color', 'red').text(t('UserPages.err_get_OS+_infos'))
            console.log('check_license OpenSankey+ : ERROR', error)
            // Increase number of requests
            reqCount_ = reqCount_ + 1
            setReqCount(reqCount_)
          })
      }
    }
  }, [reqCount, user_data, t])

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
          layerStyle='menutop_layout_style'
          gridTemplateColumns='minmax(7vw, 150px) auto 11rem 6rem'
        >
          <Box
            margin='0.25rem'
            alignSelf='center'
            justifySelf='left'
          >
            <Image
              height='5rem'
              src={logo}
              alt='navigation logo'
              onClick={() => returnToApp(navigate)}
            />
          </Box>
          <Box></Box>
          <Button
            variant='btn_lone_navigation'
            onClick={() => returnToApp(navigate)}
          >
            {t('UserNav.to_app')}
          </Button>
          {/* <Button
            variant='btn_lone_navigation'
            onClick={() => returnToDashboard()}
          >
            {t('UserNav.to_acc')}
          </Button> */}
          <LoginOutButton
            t={t}
            logo={logo}
            returnToApp={returnToApp}
            loginComponent={loginComponent}
            setUpdate={setUpdate}
          />
        </Box>
      </Box>

      <div>
        <Card variant='card_account' >
          <CardHeader
            textAlign='left'
            textStyle='h1'
            background='secondaire.2'
            color='white'
          >
            {t('UserPages.win_acc_infos')}
          </CardHeader>
          <CardBody>
            {user_data.loading ? (
              <Spinner />
            ) : (
              <Box
                layerStyle='account_grid_col'
              >
                {/* Premiere colonne */}
                <Box
                  layerStyle='account_grid_row'
                >

                  {/* Infos utilisateur  --------------------------------------------------------- */}

                  <FormControl
                    isInvalid={(msgs_userdata_modification.err.length > 0)}
                    variant='form_account_page'
                  >
                    <FormLabel
                      layerStyle='account_card_title'
                    >
                      <Text textStyle='h2'>{t('UserPages.infos_modify.title')}</Text>
                    </FormLabel>
                    <Box
                      layerStyle='account_card_content'
                    >
                      {/* First name  */}
                      <Box
                        layerStyle='account_card_subcontent'
                        gridAutoFlow='row'
                      >
                        <Text
                          textStyle='h3'
                          margin='0px 0px 0px 3px'
                        >
                          {t('Register.account.fn')}
                        </Text>
                        <Input
                          type='text'
                          isInvalid={!user_new_firstname_valid}
                          placeholder={user_data.firstname}
                          onChange={e => setUserNewFirstName(e.target.value)}
                          onBlur={submitFirstnameChange}
                        />
                      </Box>

                      {/* Last name */}
                      <Box
                        layerStyle='account_card_subcontent'
                        gridAutoFlow='row'
                      >
                        <Text
                          textStyle='h3'
                          margin='0px 0px 0px 3px'
                        >
                          {t('Register.account.ln')}
                        </Text>
                        <Input
                          type='text'
                          isInvalid={!user_new_lastname_valid}
                          placeholder={user_data.name}
                          onChange={e => setUserNewLastName(e.target.value)}
                          onBlur={submitLastnameChange}
                        />
                      </Box>
                    </Box>
                    <FormErrorMessage>{msgs_userdata_modification.err}</FormErrorMessage>
                    <FormHelperText>{msgs_userdata_modification.info}</FormHelperText>
                  </FormControl>

                  {/* Infos licenses --------------------------------------------------------------------  */}
                  { !noLicenceAccountRequired ? <FormControl
                    variant='form_account_page'
                  >
                    <FormLabel
                      layerStyle='account_card_title'
                    >
                      <Text textStyle='h2'>{t('UserPages.license.title')}</Text>
                    </FormLabel>

                    <Box
                      layerStyle='account_card_subcontent'
                      gridAutoFlow='row'
                    >
                      <Text
                        textStyle='h3'
                        margin='0px 0px 0px 3px'
                      >
                        {t('UserPages.OS+_lic')}
                      </Text>
                      <Box
                        layerStyle='account_card_subcontent'
                        gridAutoFlow='column'
                        justifyItems='center'
                        alignItems='center'
                      >
                        <Text
                          justifySelf='left'
                          margin='0'
                        >
                          {user_data.license_opensankeyplus_active ? 'Active' : 'Non-Active'}
                        </Text>
                        {
                          user_data.license_opensankeyplus_active ?
                            <>
                              <Text
                                margin='0'
                              >
                                {t('UserPages.license.exp_until') + user_data.license_opensankeyplus_expiry}
                              </Text>
                              <Button
                                variant='btn_accountpage'
                                onClick={openCustomerPage}
                                maxWidth='inherit'
                                width='fit-content'
                                justifySelf='right'
                              >
                                {t('UserPages.license.btns.mng_sub')}
                              </Button>
                            </>
                            :
                            <Button
                              variant='btn_accountpage_negative'
                              onClick={openCheckoutPage}
                              maxWidth='inherit'
                              width='fit-content'
                              height='50px'
                              justifySelf='right'
                              textStyle='h2'
                            >
                              <Box
                                width='max-content'
                                height='90%'
                                display='grid'
                                gridAutoFlow='column'
                                gridColumnGap='6px'
                                alignItems='center'
                              >
                                <Image
                                  justifySelf='left'
                                  width='70px'
                                  src={logo_sankey_plus}
                                  alt='logo_osp'
                                />
                                <Text
                                  justifySelf='right'
                                  margin='0'
                                >
                                  {t('UserPages.license.btns.add_sub')}
                                </Text>
                              </Box>
                            </Button>
                        }
                      </Box>
                    </Box>
                  </FormControl>:<></>}
                </Box>

                {/* Seconde colonne */}

                <Box
                  layerStyle='account_grid_row'
                >

                  {/* Id modification ---------------------------------------------------------------- */}

                  <FormControl
                    isInvalid={!user_new_email_valid || !new_password_valid}
                    variant='form_account_page'
                  >
                    <FormLabel
                      layerStyle='account_card_title'
                    >
                      <Text textStyle='h2'>{t('UserPages.login_modify.title')}</Text>
                    </FormLabel>
                    <Box
                      layerStyle='account_card_content'
                    >
                      {/* Email modification */}
                      <Box
                        layerStyle='account_card_subcontent'
                        gridAutoFlow='row'
                      >
                        <Text
                          textStyle='h3'
                          margin='0px 0px 0px 3px'
                        >
                          {t('Login.id.label')}
                        </Text>
                        <Input
                          type='email'
                          isInvalid={!user_new_email_valid}
                          placeholder={user_data.email}
                          onChange={e => setUserNewEmail(e.target.value)}
                          onBlur={verifyEmail}
                        />
                      </Box>

                      {/* Password modification */}
                      <Box
                        layerStyle='account_card_subcontent'
                        gridAutoFlow='row'
                      >
                        <Text
                          textStyle='h3'
                          margin='0px 0px 0px 3px'
                        >
                          {t('UserPages.login_modify.pwd')}
                        </Text>
                        <InputGroup
                        >
                          <Input
                            type={show_new_password ? 'text' : 'password'}
                            isInvalid={!new_password_valid}
                            onChange={e => setNewPassword(e.target.value)}
                            onBlur={triggerPasswordChange}
                          />
                          <InputRightElement width='4.5rem' marginRight='0.25em'>
                            <Button
                              h='1.75rem'
                              size='sm'
                              border='0px'
                              bg='gray.50'
                              onClick={() => setShowNewPassword(!show_new_password)}
                            >
                              {show_new_password ? t('Login.pwd.hide') : t('Login.pwd.show')}
                            </Button>
                          </InputRightElement>
                        </InputGroup>
                      </Box>

                      {/* Account deletion */}
                      <Box
                        layerStyle='account_card_subcontent'
                        gridAutoFlow='row'
                      >
                        <Text
                          textStyle='h3'
                          margin='0px 0px 0px 3px'
                        >
                          {t('UserPages.login_modify.del')}
                        </Text>
                        <Button
                          variant='btn_accountpage_danger'
                          onClick={onDeleteAccountModalOpen}
                        >
                          {t('UserPages.login_modify.btns.del_account')}
                        </Button>
                      </Box>
                    </Box>
                    <FormErrorMessage textStyle='account_log_error'>{msgs_login_modification.err}</FormErrorMessage>
                    <FormHelperText textStyle='account_log_info'>{msgs_login_modification.info}</FormHelperText>
                  </FormControl>

                  {/* Infos licenses legacy --------------------------------------------------------------------  */}

                  {
                    user_data.license_legacy_opensankeyplus_validity ?
                      <FormControl
                        variant='form_account_page'
                      >
                        <FormLabel
                          layerStyle='account_card_title'
                        >
                          <Text textStyle='h2'>{t('UserPages.license.title') + ' (Legacy)'}</Text>
                        </FormLabel>

                        <Box layerStyle='account_row'>
                          <Box>
                            {has_blockers ? <>{blocker_suite_sankey['block_osp']}</> : <></>}
                            {t('UserPages.OS+_lic')}
                          </Box>
                          <Input
                            onChange={(e) => {
                              setNewLicenseOpenOSP(e.target.value)
                              setNewLicenseOpenOSPToCheck(true)
                            }}
                            placeholder={user_data.license_legacy_opensankeyplus_id} />
                          <Button
                            variant='menuconfigpanel_option_button'
                            onClick={() => signupNewLicenseOpenOSP()}
                            isDisabled={newLicenseOpenOSPToCheck === false}>
                            {t('UserPages.update_lic')}
                          </Button>
                          {user_data.loading_legacy_opensankeyplus ? (
                            <>
                              <Spinner animation="border" />
                              <Spinner animation="border" />
                            </>
                          ) : (
                            <>
                              <Text>{user_data.license_legacy_opensankeyplus_active}</Text>
                              <Text>{user_data.license_legacy_opensankeyplus_validity}</Text>
                            </>
                          )}
                        </Box>
                        <div className='LogError' style={{ 'color': 'red' }}></div>
                      </FormControl> :
                      <></>
                  }

                </Box>
              </Box>
            )}


            {/* Modal de confirmation de modification E-Mail */}
            <Modal
              isOpen={isEmailChangeModalOpen}
              onClose={onEmailChangeModalClose}
              variant='modal_account'
              trapFocus={false}
            >
              <ModalContent>
                <ModalHeader>{t('UserPages.login_modify.email_modal.title')}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <FormControl
                    variant='form_account_page'
                  >
                    <InputGroup variant='register_input'>
                      <InputLeftAddon>
                        {t('Login.pwd.label')}
                      </InputLeftAddon>
                      <Input
                        isRequired
                        type={show_password ? 'text' : 'password'}
                        placeholder={t('Login.pwd.placeholder')}
                        onChange={e => setPassword(e.target.value)}
                      />
                      <InputRightElement width='4.5rem' marginRight='0.25em'>
                        <Button
                          h='1.75rem'
                          size='sm'
                          border='0px'
                          bg='gray.50'
                          onClick={() => setShowPassword(!show_password)}
                        >
                          {show_password ? t('Login.pwd.hide') : t('Login.pwd.show')}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>
                  <Button
                    variant='btn_accountpage'
                    type="submit"
                    onClick={submitEmail}
                    maxWidth='inherit'
                    width='fit-content'
                  >
                    {t('UserPages.login_modify.email_modal.btn')}
                  </Button>
                </ModalBody>
              </ModalContent>
            </Modal>

            {/* Modal de confirmation de modification mot de passe */}
            <Modal
              isOpen={isPwdChangeModalOpen}
              onClose={onPwdChangeModalClose}
              variant='modal_account'
            >
              <ModalContent>
                <ModalHeader>{t('UserPages.login_modify.pwd_modal.title')}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <FormControl
                    variant='form_account_page'
                  >
                    <InputGroup variant='register_input'>
                      <InputLeftAddon>
                        {t('UserPages.login_modify.pwd_modal.input_token')}
                      </InputLeftAddon>
                      <Input
                        isRequired
                        type={'text'}
                        onChange={e => setSecret(e.target.value)}
                      />
                    </InputGroup>
                  </FormControl>
                  <Button
                    variant='btn_accountpage'
                    type="submit"
                    onClick={submitPassword}
                    maxWidth='inherit'
                    width='fit-content'
                  >
                    {t('UserPages.login_modify.pwd_modal.btn')}
                  </Button>
                </ModalBody>
              </ModalContent>
            </Modal>


            {/* Modal confirmation license */}
            <Modal
              isOpen={isDeleteAccountModalOpen}
              onClose={onDeleteAccountModalClose}
              variant='modal_account'
            >
              <ModalContent>
                <ModalHeader>{t('UserPages.login_modify.del_modal.title')}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <FormControl
                    isInvalid={err_delete}
                    variant='form_account_page'
                  >
                    <Box
                      layerStyle='account_card_content'
                    >

                      <Text
                        textStyle='h2'
                        // margin='0px 0px 0px 3px'
                        color='primaire.1'
                      >
                        {t('UserPages.login_modify.del_modal.desc')}
                      </Text>

                      {/* Feedback */}
                      <Box
                        layerStyle='account_card_subcontent'
                        gridAutoFlow='row'
                      >
                        <Text
                          textStyle='h3'
                          margin='0px 0px 0px 3px'
                        >
                          {t('UserPages.login_modify.del_modal.fdback')}
                        </Text>
                        <Select
                          placeholder={t('UserPages.login_modify.del_modal.fdback_default')}
                          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                            setFeedback(evt.target.value)
                          }}
                        >
                          {
                            possible_feedback.map((s: string) => {
                              return <option value={s}>
                                {t('UserPages.login_modify.del_modal.fdback_' + s)}
                              </option>
                            })
                          }
                        </Select>
                      </Box>

                      {/* Comment */}
                      <Box
                        layerStyle='account_card_subcontent'
                        gridAutoFlow='row'
                      >

                        <Text
                          textStyle='h3'
                          margin='0px 0px 0px 3px'
                        >
                          {t('UserPages.login_modify.del_modal.comment')}
                        </Text>
                        <Editable
                          border='1px solid'
                          borderRadius='3px'
                          height='5rem'
                          textAlign='start'
                          defaultValue='No Comment'
                          onChange={(nextValue) => {
                            setComment(nextValue)
                          }}
                        >
                          <EditablePreview
                            height='100%'
                          />
                          <EditableInput
                            height='100%'
                          />
                        </Editable>
                      </Box>

                      {/* Password confirmation */}
                      <Box
                        layerStyle='account_card_subcontent'
                        gridAutoFlow='row'
                      >
                        <Text
                          textStyle='h3'
                          margin='0px 0px 0px 3px'
                        >
                          {t('UserPages.login_modify.del_modal.pwd_confirm')}
                        </Text>
                        <InputGroup variant='register_input'>
                          <Input
                            isRequired
                            isInvalid={err_delete}
                            type={show_password ? 'text' : 'password'}
                            placeholder={t('Login.pwd.placeholder')}
                            onChange={e => setPassword(e.target.value)}
                          />
                          <InputRightElement width='4.5rem' marginRight='0.25em'>
                            <Button
                              h='1.75rem'
                              size='sm'
                              border='0px'
                              bg='gray.50'
                              onClick={() => setShowPassword(!show_password)}
                            >
                              {show_password ? t('Login.pwd.hide') : t('Login.pwd.show')}
                            </Button>
                          </InputRightElement>
                        </InputGroup>
                      </Box>
                      <FormErrorMessage>{msgs_modal_del_account.err}</FormErrorMessage>
                      <FormHelperText>{msgs_modal_del_account.info}</FormHelperText>
                    </Box>
                  </FormControl>
                  <Box
                    layerStyle='account_card_subcontent'
                    gridAutoFlow='column'
                  >
                    <Button
                      variant='btn_accountpage'
                      type="submit"
                      isDisabled={password.length === 0}
                      maxWidth='inherit'
                      width='fit-content'
                      onClick={() => triggerDeleteAccount()}
                    >
                      {t('UserPages.login_modify.del_modal.btn_confirm')}
                    </Button>
                    <Button
                      variant='btn_accountpage_danger'
                      type="submit"
                      maxWidth='inherit'
                      width='fit-content'
                      onClick={onDeleteAccountModalClose}
                    >
                      {t('UserPages.login_modify.del_modal.btn_cancel')}
                    </Button>
                  </Box>
                </ModalBody>
              </ModalContent>
            </Modal>

          </CardBody>
        </Card>

      </div>
    </div>
  )
}

export default Account




