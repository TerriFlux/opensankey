
import React, { Dispatch, FunctionComponent, SetStateAction, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  FaUser
} from 'react-icons/fa'

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardFooter,
  CardHeader,
  Divider,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'

// OpenSankey imports
import { Type_AdditionalMenus } from './deps/OpenSankey+/deps/OpenSankey/types/Types'
import { OSTooltip, Type_JSON } from './deps/OpenSankey+/deps/OpenSankey/types/Utils'
import { FType_ModuleDialogs } from './deps/OpenSankey+/deps/OpenSankey/types/FunctionTypes'
import { UploadExemple } from './deps/OpenSankey+/deps/OpenSankey/components/dialogs/SankeyPersistence'

// OpenSankey+ imports
import { initializeAdditionalMenusOSP, moduleDialogsOSP } from './deps/OpenSankey+/ModulesOSP'

// Local imports
import { Class_ApplicationDataSA } from './types/ApplicationDataSA'
import { LoginOutButton } from './components/Login/Login'

const logo_sankeytheque = <svg
  xmlns='http://www.w3.org/2000/svg'
  viewBox='0 0 1000 1000'
  height='2.05rem'
  width='2.05rem'
>
  <path
    d='M 82.159501,925.17844 C 77.714125,921.94216 59.003818,903.77603 40.581041,884.80923 1.743255,844.8246 -0.68039764,840.44542 0.94761636,813.19731 1.9922164,795.71381 6.5584625,784.54436 16.533654,775.07244 c 8.025538,-7.62063 16.565803,-9.80315 38.359812,-9.80315 h 18.147326 l 0.01157,-251.28049 c 0.0072,-157.0418 0.770274,-254.01142 2.03462,-258.56236 3.505149,-12.61656 15.172006,-29.57797 25.931448,-37.69948 18.70625,-14.11995 22.16979,-14.73959 87.55958,-15.66416 l 58.54576,-0.82781 v -20.93755 c 0,-24.40014 3.46744,-33.98658 16.57691,-45.83021 13.7161,-12.39166 22.68839,-13.84909 83.93528,-13.63424 l 53.88282,0.18903 1.42059,-9.7291 c 2.10254,-14.399632 11.22394,-27.678793 24.46735,-35.620172 l 11.23221,-6.735354 h 60.77875 c 60.62752,0 60.80402,0.01304 70.9434,5.150833 5.59056,2.832956 12.52513,8.245532 15.41013,12.027945 10.86714,14.247628 11.59085,18.535668 11.59085,68.675908 v 46.61193 l 136.26138,0.60213 136.26138,0.60212 11.78844,4.76397 c 14.68936,5.93628 30.40659,20.5887 38.23877,35.64815 l 5.92803,11.39828 0.55004,255.42531 0.55001,255.42532 h 18.11541 c 9.96348,0 21.31284,0.917 25.2208,2.0378 16.72358,4.79627 29.13454,26.31602 29.13454,50.51737 0,23.93716 -3.09037,29.10419 -40.16731,67.1589 -18.37194,18.85642 -37.04062,36.93824 -41.48599,40.18182 l -8.08252,5.89743 H 499.95854 90.242007 Z M 926.69257,859.20992 957.96256,826.73316 V 816.72538 806.71761 H 791.42087 624.8792 l -1.09415,12.06643 c -1.79899,19.83959 -13.13254,36.77638 -30.34481,45.34705 -6.8326,3.40222 -14.88265,3.72282 -93.4817,3.72282 -78.59903,0 -86.64908,-0.3206 -93.48169,-3.72282 -17.21226,-8.57067 -28.54581,-25.50746 -30.3448,-45.34705 L 375.0379,806.71761 H 208.49622 41.954547 v 10.00777 10.00778 l 31.269978,32.47676 31.269985,32.47676 H 499.95854 895.42261 Z M 579.06529,824.01197 c 2.2327,-2.02057 3.78991,-6.27819 3.78991,-10.3621 v -6.93226 H 499.95854 417.0619 v 6.57216 c 0,3.6147 1.54341,8.27765 3.42982,10.36211 3.20346,3.53978 8.42413,3.78991 79.10675,3.78991 67.50988,0 76.08593,-0.37016 79.46682,-3.42982 z M 246.61366,504.66294 246.08757,244.05657 193.45199,243.50225 c -49.764,-0.52409 -53.12333,-0.31821 -61.57623,3.77378 -4.91738,2.38046 -10.84102,7.40292 -13.16366,11.16102 -4.18793,6.77621 -4.22298,8.90789 -4.22298,256.83259 v 249.99965 h 66.32531 66.32534 z M 402.555,537.3035 V 309.33768 H 344.52733 286.49968 V 537.3035 765.26929 h 58.02765 58.02767 z m -90.42569,193.20673 c -10.60166,-8.58769 -11.76204,-20.16828 -3.00306,-29.97125 l 6.04725,-6.76805 h 29.35383 29.35382 l 6.04725,6.76805 c 8.75896,9.80297 7.5986,21.38356 -3.00307,29.97125 -3.70044,2.99747 -8.97704,3.58065 -32.398,3.58065 -23.42097,0 -28.69756,-0.58318 -32.39802,-3.58065 z M 557.47628,510.88019 556.94999,256.49107 h -56.99145 -56.99143 l -0.5263,254.38912 -0.52628,254.3891 h 58.04401 58.04403 z m -89.91572,219.63004 c -10.6017,-8.58769 -11.76206,-20.16828 -3.00309,-29.97125 l 6.04724,-6.76805 h 29.35383 29.35385 l 6.04725,6.76805 c 8.75896,9.80297 7.5986,21.38356 -3.0031,29.97125 -3.70044,2.99747 -8.97703,3.58065 -32.398,3.58065 -23.42094,0 -28.69754,-0.58318 -32.39798,-3.58065 z m 199.095,-104.61093 c -35.71263,-76.65351 -65.85854,-140.76888 -66.99089,-142.47863 -1.37423,-2.07499 -2.09934,44.26639 -2.18066,139.37001 l -0.12188,142.47861 h 67.11278 67.11275 z m 165.82215,118.36139 c 34.43598,-16.1758 44.98023,-22.02786 45.83643,-25.43924 0.76123,-3.03293 -17.62755,-44.62141 -58.29095,-131.8321 -32.67162,-70.07081 -59.532,-127.50368 -59.68967,-127.62862 -0.37463,-0.29679 -101.62199,47.0073 -102.52727,47.90209 -0.60742,0.60038 105.74324,230.02531 115.99719,250.23491 2.9152,5.74561 5.24747,7.77156 8.94647,7.77156 2.75186,0 25.12935,-9.45387 49.7278,-21.0086 z m -52.51484,-19.08398 c -9.61578,-5.52957 -12.89813,-16.81956 -8.00938,-27.54916 3.32736,-7.30275 44.91594,-27.68941 56.48611,-27.68941 15.46185,0 25.09339,18.29741 16.26575,30.90071 -3.91405,5.58804 -42.71495,24.8091 -52.96047,26.23536 -3.76303,0.52385 -9.05282,-0.32808 -11.78201,-1.8975 z M 880.37079,257.3427 c -9.77017,-14.76373 -6.73525,-14.48795 -152.44644,-13.8517 l -129.52603,0.56557 -0.56191,40.93024 c -0.35259,25.68426 0.19335,40.93023 1.46564,40.93023 1.11514,0 19.08716,-8.01396 39.93782,-17.80877 44.52373,-20.91552 55.44013,-23.21292 73.46155,-15.4603 20.83589,8.96334 14.00848,-3.79098 121.0121,226.06419 l 50.67827,108.86227 0.52949,-181.27767 0.52951,-181.27767 z M 679.90912,451.03678 c 21.27916,-9.83231 44.03726,-20.5632 50.57359,-23.84638 l 11.88425,-5.96943 -5.25969,-11.90279 c -2.89283,-6.54652 -6.04659,-12.69291 -7.00836,-13.65864 -1.54388,-1.5502 -98.47332,42.08142 -101.88084,45.86044 -1.45319,1.61164 9.5597,27.39378 11.70129,27.39378 0.71523,0 18.71062,-8.04465 39.98976,-17.87698 z m -18.27077,-71.59366 c 55.24053,-25.70365 52.06088,-22.72203 42.71551,-40.05537 -2.75537,-5.11053 -6.20122,-8.53783 -8.9851,-8.93672 -5.64852,-0.80933 -89.47834,37.75434 -94.2856,43.37359 -2.54676,2.9769 -3.0308,5.39864 -1.73472,8.67888 5.69465,14.41249 8.65769,20.09294 10.48085,20.09294 1.12724,0 24.4413,-10.41899 51.80906,-23.15332 z m -259.51067,-127.61498 0.60888,-15.02501 h -58.11845 -58.11843 v 14.1615 c 0,7.78884 0.63638,14.79793 1.41424,15.57574 0.77781,0.77785 26.65709,1.16643 57.50955,0.86352 l 56.09531,-0.55074 z m 155.43122,-52.84661 -0.60891,-15.02504 h -56.99145 -56.99143 l -0.60891,15.02504 -0.6089,15.02502 h 58.20924 58.20926 z m -156.06815,-17.8031 c -0.0414,-19.44462 1.34592,-18.98231 -56.96342,-18.98231 -37.49492,0 -49.82907,0.64589 -52.72129,2.76074 -2.49085,1.82134 -4.12283,6.37521 -4.79623,13.38327 -1.76166,18.33412 -5.90367,17.15328 57.9834,16.52996 l 56.52557,-0.5515 -0.0281,-13.14016 z m 156.12094,-53.1714 c -0.47158,-7.40572 -2.02572,-14.63327 -3.4537,-16.06123 -3.73042,-3.73044 -104.66846,-3.73044 -108.39888,0 -1.42798,1.42796 -2.98212,8.65551 -3.4537,16.06123 l -0.85735,13.46493 h 58.51048 58.5105 z'
  />
</svg>


// TYPES FUNCTIONCOMPONENT =============================================================

export type ExempleMenuTypes = { [_: string]: ExempleMenuTypes | string[] }

type FType_InitializeAdditionalMenusSA = (
  additional_menus: Type_AdditionalMenus,
  new_data: Class_ApplicationDataSA,
) => void

type FCType_ModalSankeyTheque = {
  new_data: Class_ApplicationDataSA
}
type FCType_SankeyThequeAccordionGenerator = {
  new_data: Class_ApplicationDataSA,
  theque_tree: object,
  path: string[],
  setPathToCard: Dispatch<SetStateAction<string[]>>
}

type FCType_SankeyThequeCardsGenerator = {
  new_data: Class_ApplicationDataSA,
  theque_tree: object,
  path: string[],
}

type FCType_UserPagesButtons = {
  new_data_app: Class_ApplicationDataSA
}

// FUNCTIONCOMPONENT =============================================================


/**
 * Overrides : OS initializeApplicationData
 * Init data with JSON cache data if present.
 *
 * @param {Class_ApplicationDataSA} new_data_app
 * @param {(Type_JSON | undefined)} initial_data
 * @return {*}
 */
export const initializeApplicationDataSA = (
  new_data_app: Class_ApplicationDataSA,
  initial_data: Type_JSON | undefined,

) => {
  // Read data from cache if it exist
  if (initial_data !== undefined) {
    new_data_app.fromJSON(initial_data)
  }
  return new_data_app
}


/**
 * Since AdditionalMenus is an OS var specially created to add external element in menus
 * we don't have to recast initializeAdditionalMenusType for more var or overwritting parameter types
 * @param {*} additionalMenus
 * @param {*} new_data_app
 */
export const initializeAdditionalMenusSA: FType_InitializeAdditionalMenusSA = (
  additionalMenus,
  new_data_app,
) => {

  // No initialisation if static --------------------------------------------------------

  if (new_data_app.is_static) {
    return
  }

  // OpenSankey+ initialisation ----------------------------------------------------------

  initializeAdditionalMenusOSP(
    additionalMenus,
    new_data_app
  )

  // Check if user is connected ----------------------------------------------------------

  new_data_app.checkTokens()

  // New modules -------------------------------------------------------------------------

  additionalMenus.additional_nav_item.push(
    <UserPagesButtons
      new_data_app={new_data_app}
    />
  )



  if (new_data_app.has_sankey_plus) {
    additionalMenus.external_file_item.push(<ButtonOpenModalSankeyTheque new_data={new_data_app} />)
  }
}


const UserPagesButtons: FunctionComponent<FCType_UserPagesButtons> = (
  { new_data_app }
) => {
  // Traduction
  const { t } = new_data_app

  // If windowSankey.SankeyToolsStatic is at true : we don't use the function useNavigate because we can't it use this function outside BrowserRouter
  // and if the app is in publication mode we aren't in one
  const navigate = useNavigate()

  const [count, setCount] = useState(0)
  const refreshThis = () => {
    setCount(count + 1)
  }
  new_data_app.menu_configuration.ref_to_additional_menus_updater.current = refreshThis

  // const indicateSankeyToSaveInCache = () => new_data_app.menu_configuration.ref_to_save_in_cache_indicator.current(false)

  // Either create a menu to select where we navigate to (login or register account)
  // or add a button to navigate to
  const user_navigation_bar_free = <Box
    layerStyle='menutop_layout_style'
    height='5rem'
    gridTemplateColumns='11rem 11rem'
  >
    <Button
      variant='btn_lone_navigation_primary'
      onClick={() => navigate('/register')}
    >
      {t('UserNav.to_buy')}
    </Button>
    <OSTooltip
    label={t('UserNav.tooltip.to_con')}
    isAlwaysOpen={new_data_app.show_documentation}>
    <Button
      variant='btn_lone_navigation_secondary'
      onClick={() => navigate('/login')}
    >
      {t('UserNav.to_con')}
    </Button>
    </OSTooltip>
  </Box>

  const user_navigation_bar_connected = <Box
    alignSelf='center'
    justifySelf='center'
    display='grid'
    gridTemplateColumns='1fr 1fr'
    gridColumnGap='0.25rem'
  >
    <Button
      variant={'menutop_button_goto_dashboard'}
      onClick={() => {
        navigate('/account')
        // Save current json before moving to login page
        const ev = document; const tmp = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
        if (ev.onkeydown) {
          ev.onkeydown(tmp)
        }
      }}>
      <FaUser />
    </Button>
    <LoginOutButton
      new_data_app={new_data_app}
    />
  </Box>


  return (!new_data_app.has_account ? user_navigation_bar_free : user_navigation_bar_connected)
}



export const moduleDialogsSA: FType_ModuleDialogs = (
  new_data,
  additional_menus,
  menu_configuration_nodes_attributes,
  processFunctions
) => {

  // OpenSankey Menu
  const dialogDialogsOSP = moduleDialogsOSP(
    new_data,
    additional_menus,
    menu_configuration_nodes_attributes,
    processFunctions
  )

  // Cast type
  const new_data_SA = new_data as Class_ApplicationDataSA

  const moduleDialogsSA: JSX.Element[] = []

  if (new_data_SA.has_sankey_plus) {
    moduleDialogsSA.push(
      <ModalSankeyTheque new_data={new_data_SA} />
    )
  }

  return [
    ...dialogDialogsOSP,
    ...moduleDialogsSA
  ]
}

const ButtonOpenModalSankeyTheque: FunctionComponent<{ new_data: Class_ApplicationDataSA }> = ({ new_data }) => {

  return <Box>
    <Button
      variant='menutop_button'
      onClick={() => {
        new_data.menu_configuration.dict_setter_show_dialog_SA.ref_setter_show_modal_sankeytheque.current(true)
      }}
    >
      <Box
        layerStyle='menutop_button_style'
      >
        <Box
          gridRow='1'
          padding='0.1rem 0 0.1rem 0'
        >
          {logo_sankeytheque}
        </Box>
        <Box
          gridRow='2'
        >
          SankeyThèque
        </Box>
      </Box>
    </Button>
  </Box>
}


/**
 * Modal containing sankeytheque
 *
 * @param {*} { new_data, additionalMenu, Reinitialization }
 * @return {*}
 */
export const ModalSankeyTheque: FunctionComponent<FCType_ModalSankeyTheque> = ({ new_data }) => {
  const [show_sankeytheque, set_show_sankeytheque] = useState(false)
  const [firstRender, setFirstRender] = useState(true)
  const [sankeytheque, setSankeyTheque] = useState({})

  const [path_to_card, setPathToCard] = useState<string[]>([])

  new_data.menu_configuration.dict_setter_show_dialog_SA.ref_setter_show_modal_sankeytheque.current = set_show_sankeytheque


  const path = window.location.origin
  const url = path + '/opensankey//menus/examples'

  // On first render fetch sankeytheque data then re-render to have component with sankeytheque
  if (firstRender) {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
    })
      .then(response => {
        response
          .text()
          .then(text => {
            const json_data = JSON.parse(text)

            if (Object.keys(json_data.exemples_menu['Formations']).length > 0) {
              delete json_data.exemples_menu['Formations']['Tutoriels']
            }
            setSankeyTheque(json_data.exemples_menu)
            setFirstRender(false)
          })
          .catch((error) => {
            console.error('Error in fetchExamples - ' + error.toString())
            setFirstRender(false)
          })
      }).catch((err) => {
        console.error('Error in fetchExamples - ' + err.toString())

      })
  }



  return <Modal
    isOpen={show_sankeytheque}
    onClose={() => set_show_sankeytheque(false)}
    scrollBehavior='inside'
    variant='modal_sankeytheque'
  >
    <ModalOverlay />
    <ModalContent
      maxWidth='inherit'
    >
      <ModalHeader>{new_data.t('Menu.demo')}</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Box layerStyle='accordion_sankeytheque'>
          <SankeyThequeAccordionGenerator new_data={new_data} theque_tree={sankeytheque} path={[]} setPathToCard={setPathToCard} />
        </Box>
        <Box layerStyle='cards_sankeytheque'>
          <SankeyThequeCardsGenerator new_data={new_data} theque_tree={sankeytheque} path={path_to_card} />
        </Box>
      </ModalBody>
    </ModalContent>
  </Modal>
}

/**
 * Component to represent MFAData with accordeon menu
 *
 * @param {*} { new_data, theque_tree, path, setPathToCard }
 * @return {*}
 */
const SankeyThequeAccordionGenerator: FunctionComponent<FCType_SankeyThequeAccordionGenerator> = ({ new_data, theque_tree, path, setPathToCard }) => {
  const entries_tree = Object.entries(theque_tree)
  const sub_acc_item = entries_tree.filter(ent => ent[0] !== 'Files').map(ent => {
    let btn_open = <></>
    const child_etudes = Object.entries(ent[1]).filter(e=>e[0] =='Etude')
    if (child_etudes.length>0) {
      if (Object.keys(ent[1]['Etude']).length == 1) {
        return <AccordionItem>
          <Button
            variant='button_open_card_sankeytheque'
            rightIcon={<FontAwesomeIcon icon={faUpRightFromSquare} />}
            onClick={() => setPathToCard([...path, ent[0],'Etude'])}
          >
            {ent[0]}
          </Button>
        </AccordionItem>
      } 
    }
    const child_files = Object.entries(ent[1]).filter(e=>e[0] =='Files')
    if (child_files.length>0 && Object.keys(ent[1]).length==1) { 
      return <AccordionItem>
        <Button
          variant='button_open_card_sankeytheque'
          rightIcon={<FontAwesomeIcon icon={faUpRightFromSquare} />}
          onClick={() => setPathToCard([...path, ent[0]])}
        >
          {ent[0]}
        </Button>
      </AccordionItem>
    }
    if ('Files' in ent[1]) {
      btn_open = <Button
        variant='button_open_card_sankeytheque'
        rightIcon={<FontAwesomeIcon icon={faUpRightFromSquare} />}
        onClick={() => setPathToCard([...path, ent[0]])}
      >
        {ent[0]}
      </Button>
    }
    return <AccordionItem>
      <AccordionButton>
        {ent[0]}
        <AccordionIcon />
      </AccordionButton>
      <AccordionPanel>
        <SankeyThequeAccordionGenerator new_data={new_data} theque_tree={ent[1]} path={[...path, ent[0]]} setPathToCard={setPathToCard} />
        {btn_open}
      </AccordionPanel>

    </AccordionItem>
  })


  return sub_acc_item.length > 0 ? <Accordion variant='accordion_sankeytheque' allowToggle>
    {sub_acc_item}
  </Accordion> : <></>
}



const table_replace: [string, string][] = [
  ['_layout.json', ''],
  ['.json', ''],
  ['_reconciled.xlsx', ''],
  ['.xlsx', ''],
]

// try to compare to_determine & name without suffix to know if they have the same name & that this is a json
const is_json = (to_determine: string, name: string) => {
  let to_determine_name = to_determine
  table_replace.forEach(rep => {
    to_determine_name = to_determine_name.replaceAll(rep[0], rep[1])
  })
  return to_determine.includes('.json') && to_determine_name == name
}

// try to compare to_determine & name without suffix to know if they have the same name & that this is an excel file
const is_excel = (to_determine: string, name: string) => {
  let to_determine_name = to_determine
  table_replace.forEach(rep => {
    to_determine_name = to_determine_name.replaceAll(rep[0], rep[1])
  })
  return to_determine.includes('.xlsx') && (!to_determine.includes('_reconciled.xlsx')) && to_determine_name == name
}

// try to compare to_determine & name without suffix to know if they have the same name & that this is an excel file reconciled
const is_reconciled = (to_determine: string, name: string) => {
  let to_determine_name = to_determine
  table_replace.forEach(rep => {
    to_determine_name = to_determine_name.replaceAll(rep[0], rep[1])
  })
  return to_determine.includes('_reconciled.xlsx') && to_determine_name == name
}

// Transform content of MFAData files to a comprehensive structur to create cards
const FileToCardsStructur = (files: string[]) => {
  const cardStructur: { [x: string]: { is_json: string | undefined, is_excel: string | undefined, is_reconciled: string | undefined } } = {}

  files.forEach(file => {
    let key = file
    table_replace.forEach(rep => {
      key = key.replaceAll(rep[0], rep[1])
    })
    if (!(key in cardStructur))
      cardStructur[key] = {
        is_json: files.find(f => is_json(f, key)),
        is_excel: files.find(f => is_excel(f, key)),
        is_reconciled: files.find(f => is_reconciled(f, key)),
      }
  })
  return cardStructur
}

/**
 * Generate cards for files in a MFAData subtree
 *
 * @param {*} { new_data, theque_tree, path }
 * @return {*}
 */
const SankeyThequeCardsGenerator: FunctionComponent<FCType_SankeyThequeCardsGenerator> = ({ new_data, theque_tree, path }) => {
  const folder = getFilesFromkeys(theque_tree as Type_JSON, path)
  const files: string[] | undefined = folder.Files as string[] | undefined
  if (files !== undefined) {
    const cardsStructure = FileToCardsStructur(files)

    return Object.entries(cardsStructure).map((cardStruct, idx) => {
      return <Card key={idx} variant='cards_template'
      >
        <CardHeader>
          <Heading variant='heading_template_sankey'>{cardStruct[0].replaceAll('_', ' ')}</Heading>
          <Divider />
        </CardHeader>

        <CardFooter>
          <ButtonGroup
            //ButtonGroup don't have variants theming so we modify directly the style
            style={{
              margin: 'auto'
            }}>
            {cardStruct[1].is_json ? <Button
              variant='button_sankey_open_json'
              onClick={() => {
                // Button that open file in JSON version
                new_data.menu_configuration.dict_setter_show_dialog_SA.ref_setter_show_modal_sankeytheque.current(false)
                UploadExemple([...path, cardStruct[1].is_json].join('/'), new_data)
              }}>
              {new_data.t('useSankeyThequeJSON')}
            </Button> : <></>}

            {(cardStruct[1].is_reconciled || cardStruct[1].is_excel) ? <Button
              variant='button_sankey_open_excel'
              onClick={() => {
                // Button that open file in Excel version
                new_data.menu_configuration.dict_setter_show_dialog_SA.ref_setter_show_modal_sankeytheque.current(false)

                const file_name = cardStruct[1].is_reconciled ? cardStruct[1].is_reconciled : cardStruct[1].is_excel
                new_data.processFunction.launch([...path, file_name].join('/'))
                UploadExemple([...path, file_name].join('/'), new_data)
              }}>
              {new_data.t('useSankeyThequeEXCEL')}
            </Button> : <></>}

          </ButtonGroup>
        </CardFooter>
      </Card>
    })
  }
  return <></>
}

const getFilesFromkeys = (obj: Type_JSON, keys: string[]) => {
  if (keys.length === 0) return obj
  const [firstKey, ...restKeys] = keys
  const tmp = obj[firstKey] as Type_JSON
  return getFilesFromkeys(tmp, restKeys)
}


