// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// All rights reserved for TerriFlux
// ==================================================================================================

// External imports =================================================================================

import React, { MutableRefObject, useEffect, useRef, useState } from 'react'
import { HashRouter, Navigate, NavigateFunction, Route, Routes } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

import {
  Center,
  ChakraProvider,
  Spinner
} from '@chakra-ui/react'


// OpenSankey imports ===============================================================================

import OpenSankeyApp from '@terriflux/opensankey/src/App'

// OpenSankey+ imports ===============================================================================

import {
  initializeAdditionalMenusOSP,
  moduleDialogsOSP,
} from '@terriflux/opensankey-plus/src/ModulesOSP'
import { ModalWelcomeBuilderSA } from './components/ModalWelcomeSA'
import {
  createZDDModifierPlus, createNodeModifierPlus,
  createZDDMenuConfigPlus, createLinkMenuConfigPlus, createNodeMenuConfigPlus,
  createStaticNodeMenuConfigPlus
} from '@terriflux/opensankey-plus/src/components/ContextMenuConfigs'

import { Class_ApplicationDataSA } from './ApplicationDataSA'
import { Theme_SankeyApplication } from './chakra/Theme'
import Account from '@terriflux/login-component/src/UserPages/Account'
import Dashboard from '@terriflux/login-component/src/UserPages/Dashboard'
import Register from '@terriflux/login-component/src/Register/Register'
import { Login } from '@terriflux/login-component/src/Login/Login'
import { PasswordResetFromMail, PasswordResetFromToken } from '@terriflux/login-component/src/Login/PasswordReset'
import { PublicRoute } from '@terriflux/login-component/src/Routes/PublicRoutes'
import { PaiementCheckout, PaiementPage, PaiementReturn, PaiementTrial } from '@terriflux/login-component/src/Paiement/Paiement'
import { consumePendingTrial } from '@terriflux/login-component/src/Paiement/trialFlow'
import { EMPTY_TRIAL_STATE } from '@terriflux/login-component/src/LoginComponent'
import { MetaTags } from './components/MetaTags'
import { logo_sankeytheque, ModalSankeyTheque } from './components/SankeyTheque'
import { UserPagesButtons } from '@terriflux/login-component/src/UserPages/UserPages'
import { FType_ModuleDialogs } from '@terriflux/opensankey/src/Modules'
import { Type_AdditionalMenus } from '@terriflux/opensankey/src/types/MenuConfig'
import { createLinkModifier } from '@terriflux/opensankey/src/components/dialogs/ContextLinkConfig'
import { PrivateRoute } from '@terriflux/login-component/src/Routes/PrivateRoutes'
import { Class_ApplicationData } from '@terriflux/opensankey/src/types/ApplicationData'
import { OSP_INPUT_ATTRIBUTES_CONFIG, OSP_OUTPUT_ATTRIBUTES_CONFIG } from '@terriflux/opensankey-plus/src/components/UniversalConverterDialogConfig'
import { ButtonOpenUSerPreference, ModalPreference } from './components/Preferences'


// Specific methods ==================================================================================

type FType_InitializeAdditionalMenusSA = (
  additional_menus: MutableRefObject<Type_AdditionalMenus>,
  new_data: Class_ApplicationDataSA,
  setLicenses: React.MutableRefObject<() => void>
) => void
/**
 * Since AdditionalMenus is an OS var specially created to add external element in menus
 * we don't have to recast initializeAdditionalMenusType for more var or overwritting parameter types
 * @param {*} additionalMenus
 * @param {*} new_data_app
 */
export const initializeAdditionalMenusSA: FType_InitializeAdditionalMenusSA = (
  additionalMenus,
  new_data_app,
  setLicenses
) => {
  initializeAdditionalMenusOSP(
    additionalMenus,
    new_data_app
  )
  if (new_data_app.is_static) {
    return
  }

  // Check if user is connected ----------------------------------------------------------



  // New modules -------------------------------------------------------------------------

  additionalMenus.current.additional_nav_item.push(
    <UserPagesButtons
      t={new_data_app.t}
      logo={new_data_app.logo}
      icon_user={new_data_app.icon_library.icon_user}
      show_splashscreen={new_data_app.menu_configuration.show_splashscreen}
      login_component={new_data_app.login_component}
      setLicenses={setLicenses}
      returnToApp={returnToApp}
    />
  )
  // Bottom-bar subscription banner is now provided by BannerTrialOSP, pushed by
  // initializeAdditionalMenusOSP above. It is state-aware (offer trial / N days left /
  // expired → unlock) and hidden for real licence holders.

  // Sankeythèque -> injected into the OS "Aide" dropdown (extra_help_menu_items).
  // Préférences -> moved out of the menu block into the right-cluster meta icons
  // (additional_nav_item, rendered next to language/account/info) as a compact
  // gear button. Both free horizontal space in the topbar on small screens.
  const idx_st = new_data_app.menu_configuration.menu_top_order.findIndex(el => el.includes('sankeytheque'))
  const idx_reg = new_data_app.menu_configuration.menu_top_order.findIndex(el => el.includes('setting'))
  // Defensive: drop any legacy standalone 'sankeytheque' / 'setting' groups.
  if (idx_st !== -1) new_data_app.menu_configuration.menu_top_order.splice(idx_st, 1)
  if (idx_reg !== -1) new_data_app.menu_configuration.menu_top_order.splice(idx_reg, 1)
  if (new_data_app.has_sankey_plus) {
    // Compact (gear-only) Préférences, prepended so it sits right after the flag.
    additionalMenus.current.additional_nav_item.unshift(
      <ButtonOpenUSerPreference compact new_data={new_data_app} />
    )

    new_data_app.menu_configuration.extra_help_menu_items = [
      {
        key: 'sankeytheque',
        label: new_data_app.t('Menu.sankeytheque'),
        icon: logo_sankeytheque,
        onClick: () => new_data_app.menu_configuration_sa.dict_setter_show_dialog_SA.ref_setter_show_modal_sankeytheque.current(true),
      },
    ]
  } else {
    new_data_app.menu_configuration.extra_help_menu_items = undefined
  }
}

export const moduleDialogsSA: FType_ModuleDialogs = (
  new_data,
  additional_menus,
  menu_configuration_nodes_attributes
) => {
  // OpenSankey Menu
  const dialogDialogsOSP = moduleDialogsOSP(
    new_data,
    additional_menus,
    menu_configuration_nodes_attributes
  )

  // Cast type
  const new_data_SA = new_data as unknown as Class_ApplicationDataSA

  const moduleDialogsSA: JSX.Element[] = []

  if (new_data_SA.has_sankey_plus) {
    moduleDialogsSA.push(
      <ModalSankeyTheque new_data={new_data_SA} />,
      <ModalPreference new_data={new_data_SA} additionalMenus={additional_menus} />
    )
  }

  return [
    ...dialogDialogsOSP,
    ...moduleDialogsSA
  ]
}

export const SankeyApp = ({ new_data_app }: { new_data_app: Class_ApplicationDataSA }) => {

  const setLicenses = useRef(() => {
    const log_component = new_data_app.login_component
    const has_account = log_component.has_account

    new_data_app.has_sankey_plus = has_account && log_component.has_licence_sankeyplus
    new_data_app.has_sankey_afm = has_account && log_component.has_licence_sankeysuite
    new_data_app.has_sankey_dev = has_account && log_component.has_licence_dev

    // Essai gratuit en base (à part des licences réelles) : débloque le plan
    // tant qu'il est actif, sans marquer la licence réelle (cf. has_real_*).
    new_data_app.trial = has_account ? log_component.trial : { ...EMPTY_TRIAL_STATE }

    // Reprise d'un essai déclenché depuis le site AVANT création/connexion du
    // compte (#/license/trial → register/login). consumePendingTrial efface
    // l'intention avant l'appel (pas de double démarrage) et ne relance la
    // vérification qu'en cas de succès (pas de récursion : la clé est déjà vidée).
    if (has_account) {
      consumePendingTrial(() => {
        log_component.checkTokens(setLicenses, true)
      })
    }

    // Debug : exposer app_data et le Sankey en globales pour l'inspection console.
    // C'est ICI et pas au `new` : `has_sankey_dev` dépend de la licence, donc vaut
    // encore false à la construction — la garde d'OpenSankey/index.tsx:95 n'était
    // jamais franchie et les globales n'existaient nulle part.
    if (new_data_app.has_sankey_dev) {
      const globals = window as unknown as Record<string, unknown>
      globals['app_data'] = new_data_app
      // ACCESSEUR, pas une valeur : `reset()` remplace la drawing_area (donc le
      // Sankey), et une référence capturée ici serait périmée dès le premier
      // chargement de fichier.
      Object.defineProperty(window, 'sankey_debug', {
        configurable: true,
        get: () => new_data_app.drawing_area.sankey,
      })
    }

    new_data_app.menu_configuration.updateAllMenuComponents()
    new_data_app.menu_configuration.ref_rerender_submodules_menus.current()
  })

  // Minimal app ------------------------------------------------------------------------------------
  const sankeyApp =
    <OpenSankeyApp
      initializeApplicationData={() => {
        document.onkeydown = new_data_app.keyboardEventListener(new_data_app)
        return new_data_app
      }}
      initializeAdditionalMenus={(additionalMenus, new_data) => {
        initializeAdditionalMenusSA(
          additionalMenus,
          new_data as Class_ApplicationDataSA,
          setLicenses
        )
      }}
      moduleDialogs={moduleDialogsSA}
      ModalWelcome={ModalWelcomeBuilderSA}
      createZDDModifier={(app_data) => createZDDModifierPlus(app_data as Class_ApplicationDataSA)}
      ZDD_MENU_CONFIG={createZDDMenuConfigPlus()}
      createLinkModifier={(app_data) => createLinkModifier(app_data as unknown as Class_ApplicationData)}
      LINK_MENU_CONFIG={createLinkMenuConfigPlus()}
      NODE_MENU_CONFIG={new_data_app.is_editable ? createNodeMenuConfigPlus() : createStaticNodeMenuConfigPlus()}
      createNodeModifier={(app_data) => createNodeModifierPlus(app_data as Class_ApplicationDataSA)}
      input_config={OSP_INPUT_ATTRIBUTES_CONFIG}
      output_config={OSP_OUTPUT_ATTRIBUTES_CONFIG}
    />

  if (new_data_app.is_static)
    return <ChakraProvider
      theme={Theme_SankeyApplication}
    >
      {sankeyApp}
    </ChakraProvider>

  // Full app ------------------------------------------------------------------------------------

  const [app, setApp] = useState(
    <HelmetProvider>
      <MetaTags
        new_data_app={new_data_app}
      />
      <ChakraProvider
        theme={Theme_SankeyApplication}
      >
        <Center height="100vh">
          <Spinner
            width='50px'
            height='50px'
            borderWidth='5px'
            color='primaire.2'
          />
        </Center>
      </ChakraProvider>
    </HelmetProvider>
  )
  const exemple_menu = {} as { [_: string]: JSX.Element }

  const blockers = {}

  useEffect(() => {
    setTimeout(() => {
      new_data_app.login_component.checkTokens(setLicenses)
        .then(() => setApp(
          <HelmetProvider>
            <MetaTags
              new_data_app={new_data_app}
            />
            <ChakraProvider
              theme={Theme_SankeyApplication}
            >
              <HashRouter>
                <Routes>
                  <Route
                    path='/register'
                    element={
                      <PublicRoute
                        component={
                          <Register
                            t={new_data_app.t}
                            logo={new_data_app.logo}
                            logo_sankey_plus={new_data_app.logo_sankey_plus}
                            loginComponent={new_data_app.login_component}
                            setLicenses={setLicenses}
                            returnToApp={returnToApp}
                            theme={Theme_SankeyApplication}
                          />
                        }
                        loginComponent={new_data_app.login_component}
                      />
                    }
                  />
                  <Route
                    path='/login'
                  >
                    <Route
                      index
                      element={
                        <PublicRoute
                          component={
                            <Login
                              t={new_data_app.t}
                              logo={new_data_app.logo}
                              loginComponent={new_data_app.login_component}
                              setLicenses={setLicenses}
                              returnToApp={returnToApp}
                            />
                          }
                          loginComponent={new_data_app.login_component}
                        />
                      }
                    />
                    <Route
                      path='forgot'
                      element={
                        <PublicRoute
                          component={
                            <PasswordResetFromMail
                              t={new_data_app.t}
                              logo={new_data_app.logo}
                              returnToApp={returnToApp}
                            />
                          }
                          loginComponent={new_data_app.login_component}
                        />
                      }
                    />
                    <Route
                      path='reset/:token'
                      element={
                        <PublicRoute
                          component={
                            <PasswordResetFromToken
                              t={new_data_app.t}
                              logo={new_data_app.logo}
                              returnToApp={returnToApp}
                            />
                          }
                          loginComponent={new_data_app.login_component}
                        />
                      }
                    />
                  </Route>
                  <Route
                    path='/dashboard'
                    element={
                      <PrivateRoute
                        component={
                          <Dashboard
                            t={new_data_app.t}
                            logo={new_data_app.logo}
                            returnToApp={returnToApp}
                            loginComponent={new_data_app.login_component}
                            setLicenses={setLicenses}
                            exemple_menu={exemple_menu}
                          />
                        }
                        loginComponent={new_data_app.login_component}
                      />
                    }
                  />
                  {/* Routes volontairement publiques : le checkout doit marcher sans compte
                      (email collecté par Stripe, compte créé par webhook après paiement) */}
                  <Route
                    path='/license'
                  >
                    <Route
                      index
                      element={
                        <PaiementPage
                          t={new_data_app.t}
                          logo={new_data_app.logo}
                          returnToApp={returnToApp}
                          logo_sankey_plus={new_data_app.logo_sankey_plus}
                        />
                      }
                    />
                    <Route
                      path='checkout'
                      element={
                        <PaiementCheckout />
                      }
                    />
                    <Route
                      path='return'
                      element={
                        <PaiementReturn />
                      }
                    />
                    <Route
                      path='trial'
                      element={
                        <PaiementTrial
                          loginComponent={new_data_app.login_component}
                          setLicenses={setLicenses}
                          logo={new_data_app.logo}
                          returnToApp={returnToApp}
                        />
                      }
                    />
                  </Route>
                  <Route
                    path='/account'
                    element={
                      <PrivateRoute
                        component={
                          <Account
                            t={new_data_app.t}
                            logo={new_data_app.logo}
                            logo_sankey_plus={new_data_app.logo_sankey_plus}
                            logo_osp={new_data_app.logo_osp}
                            returnToApp={returnToApp}
                            loginComponent={new_data_app.login_component}
                            setLicenses={setLicenses}
                            blocker_suite_sankey={blockers}
                          />
                        }
                        loginComponent={new_data_app.login_component}
                      />
                    }
                  />
                  <Route path='/' element={sankeyApp} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </HashRouter>
            </ChakraProvider>
          </HelmetProvider>
        ))
    }, 1000)
  }, [])

  return app
}

export const returnToApp = (
  navigate: NavigateFunction
) => {
  navigate('/')
}
