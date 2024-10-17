
import * as d3 from 'd3'
import React, { FunctionComponent, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

import { Class_ApplicationDataSA } from '../../ApplicationData'
import { returnToApp } from '../../SankeyAppSA'
import {
  checkLicenseOpenOSP,
  registerNewLicenseOpenOSP,
  // registerNewLicenseSankeySuite
} from '../Register/RegisterFunctions'
import {
  activateLicensesTokens,
} from '../Login/LoginFunctions'
import { LoginOutButton } from '../Login/Login'
import { email_regex_str, name_regex_str } from '../Register/Register'
import i18next from 'i18next'

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
  new_data_app: Class_ApplicationDataSA,
  blocker_suite_sankey: { [_: string]: JSX.Element }
}

const Account: FunctionComponent<AccountTypes> = ({
  new_data_app,
  blocker_suite_sankey,
}) => {

  // Initialise traduction function
  const { t, logo } = new_data_app

  // Define navigation behaviour to return to App
  const navigate = useNavigate()

  //If we acces this page without being logged, it is resent to the application
  if (!new_data_app.has_account) {
    returnToApp(new_data_app, navigate)
  }

  //If we are logged the the following behaviors are defined
  //Return to Dashboard
  const returnToDashboard = () => {
    navigate('/dashboard')
  }

  // Email modal : checks password for e-mail modification
  const {
    isOpen: isEmailChangeModalOpen,
    onOpen: onEmailChangeModalOpen,
    onClose: onEmailChangeModalClose
  } = useDisclosure()
  const [password, setPassword] = useState('')
  const [show_password, setShowPassword] = useState(false)

  const {
    isOpen: isPwdChangeModalOpen,
    onOpen: onPwdChangeModalOpen,
    onClose: onPwdChangeModalClose
  } = useDisclosure()
  const [secret, setSecret] = useState('')

  // Subcription stop modal questions
  const {
    isOpen: isStopSubscriptionModalOpen,
    onOpen: onStopSubscriptionModalOpen,
    onClose: onStopSubscriptionModalClose
  } = useDisclosure()
  const [feedback, setFeedback] = useState('')
  const [comment, setComment] = useState('')

  // User informations
  const [user_data, setUserData] = useState(user_data_default)
  const [user_new_email, setUserNewEmail] = useState('')
  const [user_new_firstname, setUserNewFirstName] = useState('')
  const [user_new_lastname, setUserNewLastName] = useState('')

  // Messages
  const [msgs_login_modification, setMsgsLoginModification] = useState(structuredClone(log_default))
  const [msgs_userdata_modification, setMsgsUserdataModification] = useState(structuredClone(log_default))
  const [msgs_license_modification, setMsgsLicenseModification] = useState(structuredClone(log_default))

  // Activate and save a new license OpenSankey+
  const signupNewLicenseOpenOSP = () => {
    // Check licence and activate from EDD
    if (newLicenseOpenOSPToCheck) {
      registerNewLicenseOpenOSP(newLicenseOpenOSP)
        .then(() => {
          // Save in db
          const path = window.location.origin
          const url = path + '/user/infos/license_opensankeyplus'
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
            // console.log('POST /user/infos/license_opensankeyplus : SUCCESS - ', data.message)
            const userData_ = user_data
            userData_.loading_legacy_opensankeyplus = true
            userData_.license_legacy_opensankeyplus_id = newLicenseOpenOSP
            userData_.license_legacy_opensankeyplus_active = ''
            userData_.license_legacy_opensankeyplus_validity = ''
            setUserData(userData_)
            setReqCount(1)
            activateLicensesTokens(new_data_app) //Update tokens
            // setSuiteApplicationContext({...suiteApplicationContext})
          }).catch(error =>
            console.log('POST /user/infos/license_opensankeyplus : ERROR - ', error)
          )
        })
        .catch(error => {
          console.log('signupNewLicenseOpenOSP : ERROR - ', error)
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
   * Trigger current user email modification
   */
  const verifyEmail = () => {
    if (user_new_email.match(email_regex_str) != null) {
      onEmailChangeModalOpen()
      clearMsgsForLoginModification()
    }
    else {
      setErrMsgForLoginModification(t('UserPages.login_modify.msgs.err_email_regex'))
    }
  }

  /**
   * Submit Email modification
   */
  const submitEmail = () => {
    if (user_new_email.match(email_regex_str) != null) {
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
            setErrMsgForLoginModification(t('UserPages.login_modify.msgs.err_email_failed'))
          }
        })
      setInfoMsgForLoginModification(t('UserPages.login_modify.msgs.prs_email'))
    }
    else {
      setErrMsgForLoginModification(t('UserPages.login_modify.msgs.err_email_regex'))
    }
    // Close modal and update
    onEmailChangeModalClose()
  }

  /**
   * Trigger Password change - send email with token
   */
  const triggerPasswordChange = () => {
    clearMsgsForLoginModification()
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
  }

  const submitPassword = () => {
    clearMsgsForLoginModification()
    const path = window.location.origin
    const url = path + '/user/infos/modify/pwd'
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        new_password: password,
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
  }

  /**
   * Trigger Password change - send email with token
   */
  const triggerDeleteAccount = () => {
    clearMsgsForLoginModification()
    const path = window.location.origin
    const url = path + '/user/delete/account'
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
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
        setTimeout(
          () => {
            navigate('/')
          },
          2000)
        setInfoMsgForLoginModification(t('UserPages.login_modify.msgs.ok_del'))
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
    clearMsgsForUserDataModification()
    if (user_new_firstname.match(name_regex_str) != null) {
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
            setErrMsgForUserDataModification(t('UserPages.infos_modify.msgs.err_firstname'))
          }
        })
    }
    else {
      setErrMsgForUserDataModification(t('UserPages.infos_modify.msgs.err_firstname'))
    }
  }

  const submitLastnameChange = () => {
    clearMsgsForUserDataModification()
    if (user_new_lastname.match(name_regex_str) != null) {
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
            setErrMsgForUserDataModification(t('UserPages.infos_modify.msgs.err_lastname'))
          }
        })
    }
    else {
      setErrMsgForUserDataModification(t('UserPages.infos_modify.msgs.err_lastname'))
    }
  }

  // Licenses modifications ----------------------------------------------------------------

  /**
   * Add info message on license modification
   * @param {string} s
   */
  const setInfoMsgForLicenseModification = (s: string) => {
    msgs_license_modification.info = s
    msgs_license_modification.err = ''
    setMsgsLicenseModification(msgs_license_modification)
  }

  /**
   * Add err message on license modification
   * @param {string} s
   */
  const setErrMsgForLicenseModification = (s: string) => {
    msgs_license_modification.info = ''
    msgs_license_modification.err = s
    setMsgsLicenseModification(msgs_license_modification)
  }

  /**
   * Clear all messages on license modification
   * @param {string} s
   */
  const clearMsgsForLicenseModification = () => {
    msgs_license_modification.info = ''
    msgs_license_modification.err = ''
    setMsgsLicenseModification(msgs_login_modification)
  }

  const summitStopSubscription = () => {
    clearMsgsForLicenseModification()
    fetch(window.location.origin + '/user/delete/license/opensankeyplus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: comment,
        feedback: feedback,
        password: password
      })
    })
      .then(response => {
        if (response.ok) {
          setInfoMsgForLicenseModification(t('UserPages.license.confirm_modal.msgs.ok'))
          // Reset password on modal
          setPassword('')
          setShowPassword(false)
          // Close modal and update
          setTimeout(
            onStopSubscriptionModalClose,
            2000)
        }
        else {
          setErrMsgForLicenseModification(t('UserPages.license.confirm_modal.msgs.err'))
        }
      })
    setInfoMsgForLicenseModification(t('UserPages.license.confirm_modal.msgs.prs'))
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
          // Erreur fetch user data
          console.log('user_info : ERROR', error)
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
          gridTemplateColumns='minmax(7vw, 150px) auto'
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
              onClick={() => returnToApp(new_data_app, navigate)}
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
              onClick={() => returnToApp(new_data_app, navigate)}
            >
              {t('UserNav.to_app')}
            </Button>
            <Button
              variant='btn_lone_navigation'
              onClick={() => returnToDashboard()}
            >
              {t('UserNav.to_acc')}
            </Button>
            <LoginOutButton
              new_data_app={new_data_app}
            />
          </Box>
        </Box>
      </Box>

      <div>
        <Card variant='card_account' >
          <CardHeader
            style={{ 'textAlign': 'left' }}
          >
            {t('UserPages.win_acc_infos')}
          </CardHeader>
          <CardBody>
            {user_data.loading ? (
              <Spinner />
            ) : (
              <Box
                layerStyle='menuconfigpanel_grid'
              >

                {/* Id modification ---------------------------------------------------------------- */}

                <FormControl
                  isInvalid={(msgs_login_modification.err.length > 0)}
                  border='1px solid'
                  borderRadius='6px'
                  padding='3px'
                >
                  <FormLabel>
                    <Text textStyle='h2'>{t('UserPages.login_modify.title')}</Text>
                  </FormLabel>
                  <InputGroup
                    variant='register_input'
                  >
                    <InputLeftAddon
                      width='25%'
                    >
                      {t('Login.id.label')}
                    </InputLeftAddon>
                    <Input
                      isRequired
                      type='email'
                      placeholder={user_data.email}
                      onChange={e => setUserNewEmail(e.target.value)}
                    />
                    <InputRightElement
                      width='25%'
                    >
                      <Button
                        onClick={verifyEmail}
                      >
                        {t('UserPages.login_modify.btns.set_email')}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  <Button
                    onClick={triggerPasswordChange}
                  >
                    {t('UserPages.login_modify.btns.set_pwd')}
                  </Button>
                  <Button
                    onClick={triggerDeleteAccount}
                  >
                    {t('UserPages.login_modify.btns.del_account')}
                  </Button>
                  <FormErrorMessage>{msgs_login_modification.err}</FormErrorMessage>
                  <FormHelperText>{msgs_login_modification.info}</FormHelperText>
                </FormControl>

                {/* Modal de confirmation de modification E-Mail */}
                <Modal
                  isOpen={isEmailChangeModalOpen}
                  onClose={onEmailChangeModalClose}
                >
                  <ModalContent>
                    <ModalHeader>{t('UserPages.login_modify.email_modal.title')}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                      <FormControl>
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
                      <Box
                        display='grid'
                        gridAutoFlow='row'
                        gridRowGap='0,25rem'
                      >
                        <Button
                          variant='btn_lone_navigation_tertiary'
                          type="submit"
                          onClick={submitEmail}
                        >
                          {t('UserPages.login_modify.email_modal.btn')}
                        </Button>
                      </Box>
                    </ModalBody>
                  </ModalContent>
                </Modal>

                {/* Modal de confirmation de modification mot de passe */}
                <Modal
                  isOpen={isPwdChangeModalOpen}
                  onClose={onPwdChangeModalClose}
                >
                  <ModalContent>
                    <ModalHeader>{t('UserPages.login_modify.pwd_modal.title')}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                      <FormControl>
                        <InputGroup variant='register_input'>
                          <InputLeftAddon>
                            {t('UserPages.login_modify.pwd_modal.input_pwd')}
                          </InputLeftAddon>
                          <Input
                            isRequired
                            type={show_password ? 'text' : 'password'}
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
                      <Box
                        display='grid'
                        gridAutoFlow='row'
                        gridRowGap='0,25rem'
                      >
                        <Button
                          variant='btn_lone_navigation_tertiary'
                          type="submit"
                          onClick={submitPassword}
                        >
                          {t('UserPages.login_modify.pwd_modal.btn')}
                        </Button>
                      </Box>
                    </ModalBody>
                  </ModalContent>
                </Modal>

                {/* Infos utilisateur  --------------------------------------------------------- */}

                <FormControl
                  isInvalid={(msgs_userdata_modification.err.length > 0)}
                  border='1px solid'
                  borderRadius='6px'
                  padding='3px'
                >
                  <FormLabel>
                    <Text textStyle='h2'>{t('UserPages.infos_modify.title')}</Text>
                  </FormLabel>

                  {/* First name  */}
                  <InputGroup
                    variant='register_input'
                  >
                    <InputLeftAddon
                      width='25%'
                    >
                      {t('Register.account.fn')}
                    </InputLeftAddon>
                    <Input
                      type='text'
                      placeholder={user_data.firstname}
                      onChange={e => setUserNewFirstName(e.target.value)}
                    />
                    <InputRightElement
                      width='25%'
                    >
                      <Button
                        onClick={submitFirstnameChange}
                      >
                        {t('UserPages.infos_modify.btns.set_fn')}
                      </Button>
                    </InputRightElement>
                  </InputGroup>

                  {/* Last name */}
                  <InputGroup
                    variant='register_input'
                  >
                    <InputLeftAddon
                      width='25%'
                    >
                      {t('Register.account.ln')}
                    </InputLeftAddon>
                    <Input
                      type='text'
                      placeholder={user_data.name}
                      onChange={e => setUserNewLastName(e.target.value)}
                    />
                    <InputRightElement
                      width='25%'
                    >
                      <Button
                        onClick={submitLastnameChange}
                      >
                        {t('UserPages.infos_modify.btns.set_ln')}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{msgs_userdata_modification.err}</FormErrorMessage>
                  <FormHelperText>{msgs_userdata_modification.info}</FormHelperText>
                </FormControl>

                {/* Infos licenses --------------------------------------------------------------------  */}

                <Box
                  border='1px solid'
                  borderRadius='6px'
                  padding='3px'
                >
                  <Text textStyle='h2'>{t('UserPages.license.title')}</Text>

                  {
                    user_data.license_legacy_opensankeyplus_validity ?
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
                      </Box> :
                      <></>
                  }

                  <Box layerStyle='account_row'>
                    <Box>
                      {t('UserPages.OS+_lic')}
                    </Box>
                    <>
                      <Text>{user_data.license_opensankeyplus_active ? 'Active' : 'Non-Active'}</Text>
                      {
                        user_data.license_opensankeyplus_active ?
                          <Box as='span'>
                            <Text>
                              {t('UserPages.license.exp_until') + user_data.license_opensankeyplus_expiry}
                            </Text>
                            <Button
                              variant='menuconfigpanel_option_button'
                              onClick={onStopSubscriptionModalOpen}
                              isDisabled={!user_data.license_opensankeyplus_active}
                            >
                              {t('UserPages.license.btns.stop_sub')}
                            </Button>
                          </Box>
                          :
                          <></>
                      }
                    </>
                  </Box>
                </Box>

                <Modal
                  isOpen={isStopSubscriptionModalOpen}
                  onClose={onStopSubscriptionModalClose}
                >
                  <ModalContent>
                    <ModalHeader>{t('UserPages.license.confirm_modal.title')}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                      <FormControl
                        isInvalid={(msgs_license_modification.err.length > 0)}
                      >

                        <FormLabel>{t('UserPages.license.confirm_modal.fdback')}</FormLabel>
                        <Select
                          placeholder={t('UserPages.license.confirm_modal.fdback_default')}
                          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                            setFeedback(evt.target.value)
                          }}
                        >
                          {
                            possible_feedback.map((s: string) => {
                              return <option value={s}>
                                {t('UserPages.license.confirm_modal.fdback_' + s)}
                              </option>
                            })
                          }
                        </Select>

                        <FormLabel>{t('UserPages.license.confirm_modal.comment')}</FormLabel>
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

                        <FormLabel>{t('UserPages.license.confirm_modal.pwd_confirm')}</FormLabel>
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
                        <FormErrorMessage>{msgs_license_modification.err}</FormErrorMessage>
                        <FormHelperText>{msgs_license_modification.info}</FormHelperText>
                      </FormControl>
                      <Box
                        display='grid'
                        gridAutoFlow='row'
                        gridRowGap='0,25rem'
                      >
                        <Button
                          variant='btn_lone_navigation_tertiary'
                          type="submit"
                          disabled={password.length === 0}
                          onClick={() => summitStopSubscription()}
                        >
                          {t('UserPages.license.confirm_modal.btn_confirm')}
                        </Button>
                        <Button
                          variant='btn_lone_navigation_tertiary'
                          type="submit"
                          onClick={onStopSubscriptionModalClose}
                        >
                          {t('UserPages.license.confirm_modal.btn_cancel')}
                        </Button>
                      </Box>
                    </ModalBody>
                  </ModalContent>
                </Modal>

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




