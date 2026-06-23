// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import React, { useState, useEffect, useRef, MutableRefObject, ChangeEvent, Fragment } from 'react'
import ReactCountryFlag from 'react-country-flag'
import { ChevronDownIcon, InfoOutlineIcon } from '@chakra-ui/icons'
import parse from 'html-react-parser'
import {
  Box,
  Button,
  Menu as ChakraMenu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuGroup,
  MenuDivider,
  Input,
  ButtonGroup,
  FormControl,
  Select,
  Image,
  Text,
  Divider,
  Menu,
  Portal,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  IconButton,
  Link,
  VStack,
  HStack,
  Badge
} from '@chakra-ui/react'
import {
  faCheck,
  faExclamation,
  faDiagramProject,
  faTable,
  faFileLines,
  faShareNodes,
  faBan,
  faImage,
  faCircleQuestion
} from '@fortawesome/free-solid-svg-icons'
import {
  FontAwesomeIcon
} from '@fortawesome/react-fontawesome'
import { useTour } from '@reactour/tour'

import { Type_JSON } from '../../types/Utils'

import { clickSaveSVG } from './SankeyExports'
import { ModalTemplate } from './SankeyTemplates'
import { ModalExcelTemplate } from './ExcelTemplateModal'
import { ModalImageImport } from './ImageImportModal'
import {
  loadUniversalJSON,
} from '../../Persistence/UniversalJSONCompression'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { BaseApplicationDataType } from '../SankeyMenuTypes'
import { OSTooltip } from '../configmenus/MenuCommon'
import { Type_AdditionalMenus } from '../../types/MenuConfig'
import { useMainZone } from '../spreadsheet/MainZoneTabs'
import { CONVERTER_CONFIGS } from '../dialogs/PersistenceProcessDialogConfigs'

/*************************************************************************************************/

export const setDiagram = (
  diagram_url: string,
  app_data: Class_ApplicationData
) => {
  if (!window.sankey) return
  const sankey = window.sankey
  const diagrams = sankey.diagrams_list ?? sankey.sous_filieres
  if (!diagrams) return
  if (sankey[diagram_url]) {
    const diagram_config = sankey[diagram_url]
    if (diagram_config && typeof diagram_config === 'object' && 'data_type' in diagram_config) {
      const data_type_value = (diagram_config as { data_type?: boolean }).data_type
      sankey.data_type = data_type_value
    }
  }
  loadUniversalJSON(diagrams[diagram_url] + '.gz').then(data => {
    app_data.fromJSON(data as Type_JSON)
    app_data.file_name = sankey.diagram as string
  }).catch(e => console.log(e))
  app_data.menu_configuration.ref_toolbar.current()
}

export const GoToUserDoc = () => {
  const path = window.location.origin
  const url = path + '/doc'
  fetch(url, {
    method: 'GET'
  }).then((response) => {
    if (response.redirected) {
      return window.open(response.url, '_blank')
    }
  }).then(win => win?.focus())
}


/*************************************************************************************************/

/**
 * Topbar "document state" buttons: undo / redo / save-in-cache.
 * Grouped together because they all act on the current edit state of the
 * diagram. Styled in the neutral grey of the menu (like the info button) —
 * except the small check/exclamation overlay on the save button, which keeps
 * its saved/unsaved colour semantics (green/red). Not present in static mode.
 *
 * The buttons re-render on every history change because their parent
 * (SankeyMenu) subscribes to ref_to_menu_updater, which applyUndo/applyRedo/
 * saveUndo/saveRedo all trigger — so can_undo / can_redo stay fresh.
 */
const topbar_state_btn_style = {
  size: 'sm' as const,
  boxSize: '1.6rem',
  minWidth: '1.6rem',
  fontSize: '0.85rem',
  bg: 'transparent',
  bgColor: 'transparent',
  borderColor: 'transparent',
  color: 'gray.700',
  _hover: { bg: 'gray.100', bgColor: 'gray.100', color: 'gray.900' },
  _active: { bg: 'gray.200', bgColor: 'gray.200' },
  _disabled: { color: 'gray.300', bg: 'transparent', bgColor: 'transparent', cursor: 'not-allowed' },
}

// Boutons bascule de la grande zone (Diagramme / Tableur) : icône + petit texte, neutres (gris),
// surlignés en gris quand actifs (pas de vert).
const main_zone_btn_style = (active: boolean) => ({
  size: 'sm' as const,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.05rem',
  height: 'auto',
  minWidth: '2.7rem',
  padding: '0.15rem 0.3rem',
  fontSize: '1rem',
  borderColor: 'transparent',
  color: active ? 'gray.900' : 'gray.700',
  bg: active ? 'gray.200' : 'transparent',
  bgColor: active ? 'gray.200' : 'transparent',
  _hover: { bg: 'gray.100', bgColor: 'gray.100', color: 'gray.900' },
  _active: { bg: 'gray.200', bgColor: 'gray.200' },
})

/**
 * Bouton « Unit. » (sankey unitaire) de la grande zone, à côté de Diagramme/Tableur/Doc.
 * La feature est portée par OS+ : le bouton n'apparaît que si OS+ a renseigné
 * `menu_configuration.unitary_tab_available`. Le clic toggle le modal unitaire (singleton),
 * et le bouton se surligne tant que le modal est ouvert. Réutilisé en édition
 * (TopBarStateButtons) et en publish (MenuTopNavBar, derrière l'option `unitary`).
 */
export const UnitaryTabButton = ({ new_data }: BaseApplicationDataType) => {
  const { unitaryTabAvailable, showUnitary, showDiagram, showSpreadsheet, showDoc, setShowUnitary } = useMainZone(new_data)
  if (!unitaryTabAvailable) return <></>
  // Bascule en gardant toujours au moins un panneau affiché (diagramme / tableur / doc / unitaire).
  const toggleUnitary = () => {
    const next = !showUnitary
    if (!next && !(showDiagram || showSpreadsheet || showDoc)) return
    setShowUnitary(next)
  }
  return <OSTooltip placement='bottom' label='Sankey unitaire'>
    <Button
      aria-label='Unit.'
      className='topbar_button_main_zone_unitary'
      onClick={toggleUnitary}
      {...main_zone_btn_style(showUnitary)}
    >
      <FontAwesomeIcon icon={faShareNodes} style={{ height: '0.95rem', width: '0.95rem' }} />
      <Box as='span' style={{ fontSize: '0.5rem', lineHeight: 1 }}>Unit.</Box>
    </Button>
  </OSTooltip>
}

export const TopBarStateButtons = ({ new_data }: BaseApplicationDataType) => {
  const { t, icon_library, history } = new_data
  const {
    showDiagram, showSpreadsheet, showDoc, showUnitary,
    setShowDiagram, setShowSpreadsheet, setShowDoc
  } = useMainZone(new_data)
  // Bascule en gardant toujours au moins un panneau affiché (diagramme / tableur / doc / unitaire).
  // L'unitaire compte : on peut donc masquer le diagramme et ne garder que le panneau unitaire.
  const others = (...flags: boolean[]) => flags.some(Boolean)
  const toggleDiagram = () => { const next = !showDiagram; if (!next && !others(showSpreadsheet, showDoc, showUnitary)) return; setShowDiagram(next) }
  const toggleSpreadsheet = () => { const next = !showSpreadsheet; if (!next && !others(showDiagram, showDoc, showUnitary)) return; setShowSpreadsheet(next) }
  const toggleDoc = () => { const next = !showDoc; if (!next && !others(showDiagram, showSpreadsheet, showUnitary)) return; setShowDoc(next) }

  const [save_boolean, setSaveBoolean] = useState(true)
  new_data.menu_configuration.ref_to_save_in_cache_indicator.current = (b: boolean) => {
    new_data.menu_configuration.ref_to_save_in_cache_indicator_value.current = b
    setSaveBoolean(b)
  }
  new_data.menu_configuration.ref_to_save_in_cache_indicator_value.current = save_boolean

  // Session toggle "ne jamais enregistrer la vue" : driven from the "Vue non
  // enregistrée" modal, surfaced/reset here on the cache cloud button.
  const [never_save_session, setNeverSaveSession] = useState(false)
  new_data.menu_configuration.ref_to_never_save_view_session.current = (b: boolean) => {
    new_data.menu_configuration.ref_to_never_save_view_session_value.current = b
    setNeverSaveSession(b)
  }
  new_data.menu_configuration.ref_to_never_save_view_session_value.current = never_save_session

  if (new_data.is_static) return <></>

  const ok_saved = save_boolean
  const indicator_saved_data = <Box color={never_save_session ? 'tertiaire.1' : (ok_saved ? 'tertiaire.3' : 'tertiaire.1')}>
    <FontAwesomeIcon
      style={{ 'height': '0.75em', 'width': '0.75rem' }}
      icon={never_save_session ? faBan : (ok_saved ? faCheck : faExclamation)} />
  </Box>

  return <ButtonGroup spacing='0.1rem' alignItems='center'>
    <OSTooltip placement='bottom' label={t('Menu.undo')}>
      <IconButton
        aria-label={t('Menu.undo')}
        className='topbar_button_undo'
        icon={icon_library.icon_undo}
        isDisabled={!history.can_undo}
        onClick={() => history.applyUndo()}
        {...topbar_state_btn_style}
      />
    </OSTooltip>
    <OSTooltip placement='bottom' label={t('Menu.redo')}>
      <IconButton
        aria-label={t('Menu.redo')}
        className='topbar_button_redo'
        icon={icon_library.icon_redo}
        isDisabled={!history.can_redo}
        onClick={() => history.applyRedo()}
        {...topbar_state_btn_style}
      />
    </OSTooltip>
    <OSTooltip placement='bottom' label={never_save_session ? t('Menu.tooltips.reactivate_view_save') : t('Menu.tooltips.checkpoint')}>
      <Button
        aria-label={t('Menu.tooltips.checkpoint')}
        className='topbar_button_save_in_cache'
        onClick={() => {
          // If the session "ne jamais enregistrer la vue" mode is on, a click
          // re-enables the "Vue non enregistrée" dialog. The checkpoint save runs
          // on the same click.
          if (new_data.menu_configuration.ref_to_never_save_view_session_value.current) {
            new_data.menu_configuration.ref_to_never_save_view_session.current(false)
          }
          const ev = document; const tmp = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
          if (ev.onkeydown) {
            ev.onkeydown(tmp)
          }
        }}
        {...topbar_state_btn_style}
      >
        <Box position='relative' display='flex'>
          {icon_library.icon_save_in_cache}
          <Box
            position='absolute'
            bottom='-0.2rem'
            right='-0.3rem'
          >
            {indicator_saved_data}
          </Box>
        </Box>
      </Button>
    </OSTooltip>
    <OSTooltip placement='bottom' label='Diagramme'>
      <Button
        aria-label='Diagramme'
        className='topbar_button_main_zone_diagram'
        onClick={toggleDiagram}
        {...main_zone_btn_style(showDiagram)}
      >
        <FontAwesomeIcon icon={faDiagramProject} style={{ height: '0.95rem', width: '0.95rem' }} />
        <Box as='span' style={{ fontSize: '0.5rem', lineHeight: 1 }}>Diagramme</Box>
      </Button>
    </OSTooltip>
    <OSTooltip placement='bottom' label='Tableur'>
      <Button
        aria-label='Tableur'
        className='topbar_button_main_zone_spreadsheet'
        onClick={toggleSpreadsheet}
        {...main_zone_btn_style(showSpreadsheet)}
      >
        <FontAwesomeIcon icon={faTable} style={{ height: '0.95rem', width: '0.95rem' }} />
        <Box as='span' style={{ fontSize: '0.5rem', lineHeight: 1 }}>Tableur</Box>
      </Button>
    </OSTooltip>
    <OSTooltip placement='bottom' label='Doc'>
      <Button
        aria-label='Doc'
        className='topbar_button_main_zone_doc'
        onClick={toggleDoc}
        {...main_zone_btn_style(showDoc)}
      >
        <FontAwesomeIcon icon={faFileLines} style={{ height: '0.95rem', width: '0.95rem' }} />
        <Box as='span' style={{ fontSize: '0.5rem', lineHeight: 1 }}>Doc</Box>
      </Button>
    </OSTooltip>
    <UnitaryTabButton new_data={new_data} />
  </ButtonGroup>
}

/**
 * Buttons present in navbar when application is not static
 *
 * @param {*} {
 *   new_data,
 *   additionalMenus
 * }
 * @return {*}
 */
export const MenuTopButtons = ({ new_data, additionalMenus }: {
  new_data: Class_ApplicationData,
  additionalMenus: MutableRefObject<Type_AdditionalMenus>,
}) => {
  const { t } = new_data
  // Tour launcher — used by the "Aide" dropdown's Visite guidée item. Safe to
  // call here: MenuTopButtons renders inside the @reactour TourProvider.
  const { setIsOpen } = useTour()
  const {
    ref_setter_show_modal_templates_lib,
    ref_setter_show_modal_file_converter,
    ref_setter_png_saver_res_h, ref_setter_png_saver_res_v, ref_setter_show_modal_png_saver,
    ref_setter_show_modal_pdf_saver,
    ref_setter_show_modal_apply_layout,
  } = new_data.menu_configuration.dict_setter_show_dialog
  // Hook -----------------------------------
  const _load_json = useRef<HTMLInputElement>(null)
  const _load_sankeymatic = useRef<HTMLInputElement>(null)

  // State for Excel template modal
  const [show_excel_template, set_show_excel_template] = useState(false)
  // State for image import modal (extraction de structure depuis une image)
  const [show_image_import, set_show_image_import] = useState(false)

  // Liste des tutoriels disponibles dans SankeyData/tutorials, peuplée par le
  // sous-menu « Tutoriels » de l'Aide (endpoint /menus/tutorials, lit index.json).
  const [tutorials_list, setTutorialsList] = useState<{ file: string, title: string }[]>([])
  const [tuto_submenu_open, setTutoSubmenuOpen] = useState(false)
  const tutorials_fetched = useRef(false)
  const fetch_tutorials_list = () => {
    if (tutorials_fetched.current) return
    tutorials_fetched.current = true
    fetch(window.location.origin + '/opensankey//menus/tutorials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(response => response.json())
      .then(json_data => setTutorialsList(json_data.tutorials ?? []))
      .catch((error) => {
        // En cas d'échec on retombe sur le tutoriel historique unique.
        tutorials_fetched.current = false
        console.error('Error in fetch_tutorials_list - ' + error.toString())
      })
  }

  // Ouvrir un dropdown du menu du haut (Fichier, Exporter, …) ferme le tiroir de
  // filtres de gauche, sinon les deux se chevauchent à l'écran.
  const closeFilterDrawer = () => new_data.menu_configuration.ref_close_filter_drawer.current?.(false)

  // Helper used by the Fichier/Édition menus to reset the universal converter
  // dialog with a given config and open it. Centralizes the two boilerplate
  // calls so each menu item stays a one-liner.
  const open_converter_with = (config_key: keyof typeof CONVERTER_CONFIGS) => {
    new_data.menu_configuration.ref_universal_converter_set_config.current(
      CONVERTER_CONFIGS[config_key], '', false
    )
    ref_setter_show_modal_file_converter.current!(true)
  }

  // Charge un tutoriel de SankeyData/tutorials via le universal converter, sans
  // modale de navigation par dossiers. file = nom de fichier dans tutorials/.
  const open_tutorial_file = (file: string = 'Tutoriel.json.gz') => {
    new_data.menu_configuration.ref_universal_converter_set_config.current(
      CONVERTER_CONFIGS['load_tutorial'], 'tutorials/' + file, true
    )
    ref_setter_show_modal_file_converter.current!(true)
  }

  // Button reset DA & start either from empty sankey or template
  const button_resetDA = <ChakraMenu
    variant='menu_button_subnav_style'
    placement='bottom-start' id='nouveau'
    onOpen={closeFilterDrawer}
  >
    <OSTooltip
      placement='bottom'
      label={t('Menu.tooltips.new')}
      isAlwaysOpen={new_data.menu_configuration.show_splashscreen}
    >
      <MenuButton className='menutop_button_new'>
        <Box
          gridColumn='1'
          gridColumnEnd='span 2'
          gridRow='1'
        >
          {new_data.icon_library.icon_new_da}
        </Box>
        <Box
          gridColumn='1'
          gridRow='2'
        >
          {t('Menu.new')}
        </Box>
        <Box
          gridColumn='2'
          gridRow='2'
          height='1rem'
          width='1rem'
        >
          <ChevronDownIcon
            style={{ 'height': '1rem', 'width': '1rem' }} />
        </Box>
      </MenuButton>
    </OSTooltip>
    <MenuList>
      <MenuItem onClick={() => { new_data.reinitialization() }}>
        {new_data.icon_library.icon_new_da}
        {t('Menu.from_new')}
      </MenuItem>
      <MenuItem onClick={() => { ref_setter_show_modal_templates_lib.current!(true) }}>
        {new_data.icon_library.icon_new_da}
        {t('Menu.from_model')}
      </MenuItem>
      <MenuItem onClick={() => { set_show_excel_template(true) }}>
        {new_data.icon_library.icon_open_sankey_excel}
        {t('Menu.new_excel_template')}
      </MenuItem>
    </MenuList>
  </ChakraMenu>

  // Button to import sankey from data format (json,excel)
  const button_open_sankey = <ChakraMenu
    variant='menu_button_subnav_style'
    placement='bottom-start' id='ouvrir'
    onOpen={closeFilterDrawer}
  >
    <OSTooltip placement='bottom' label={t('Menu.tooltips.ouvrir')}>
      <MenuButton className='menutop_button_open'>
        <Box
          gridColumn='1'
          gridColumnEnd='span 2'
          gridRow='1'
        >
          {new_data.icon_library.icon_open_sankey}

        </Box>
        <Box
          gridColumn='1'
          gridRow='2'
        >
          {t('Menu.ouvrir')}
        </Box>
        <Box
          gridColumn='2'
          gridRow='2'
          height='1rem'
          width='1rem'
        >
          <ChevronDownIcon
            style={{ 'height': '1rem', 'width': '1rem' }} />
        </Box>
      </MenuButton>
    </OSTooltip>
    <MenuList>
      <MenuItem onClick={() => {
        new_data.menu_configuration.ref_universal_converter_set_config.current(
          CONVERTER_CONFIGS['load_json'], '', false
        )
        ref_setter_show_modal_file_converter.current!(true)
      }}>
        {new_data.icon_library.icon_open_sankey_json}
        {t('Menu.open_json')}
      </MenuItem>
      <MenuItem
        onClick={() => {
          new_data.menu_configuration.ref_universal_converter_set_config.current(
            CONVERTER_CONFIGS['load_excel'], '', false
          )
          ref_setter_show_modal_file_converter.current!(true)
        }}
      >
        {new_data.icon_library.icon_open_sankey_excel}
        {t('Menu.open_excel')}
      </MenuItem>
      <MenuItem onClick={() => { set_show_image_import(true) }}>
        <Box as='span' mr='0.5em'><FontAwesomeIcon icon={faImage} /></Box>
        {t('Menu.import_image')}
      </MenuItem>
      <MenuItem
        onClick={() => {
          if (_load_sankeymatic.current) {
            _load_sankeymatic.current.name = ''
            _load_sankeymatic.current.click()
          }
        }}
      >
        {/* TODO : find a better icon when we'll use FontAwesome pro */}
        {new_data.icon_library.icon_open_sankey_sankeymatic}
        {t('Menu.open_sankeymatic')}
      </MenuItem>
      <Input
        accept='.txt'
        type='file'
        ref={_load_sankeymatic}
        style={{ display: 'none' }}
        onChange={(evt: ChangeEvent) => {
          const files = (evt.target as HTMLFormElement).files
          const reader = new FileReader()
          const path = window.location.origin
          const url = path + '/opensankey/open_sankeymatic'

          reader.onload = (() => {
            return (e: ProgressEvent<FileReader>) => {

              const file_content = String((e.target as FileReader).result)

              const blob = new Blob([file_content], { type: 'text/plain' })
              const form_data = new FormData()
              form_data.append('file_content', blob)

              fetch(url, {
                method: 'POST',
                body: form_data
              }).then(response => {
                response
                  .text()
                  .then(text => {
                    const json_data = JSON.parse(text)
                    new_data.fromJSON(json_data)
                  })
                  .catch((error) => {
                    console.error('Error in fetchExamples - ' + error.toString())

                  })
              })
            }
          })()
          reader.readAsText(files[0])
        }} />
      <MenuItem
        onClick={() => {
          new_data.menu_configuration.ref_universal_converter_set_config.current(
            CONVERTER_CONFIGS['universal'], '', false
          )
          ref_setter_show_modal_file_converter.current!(true)
        }
        }>
        {new_data.icon_library.icon_open_sankey_pickle}
        {t('Menu.format_converter')}
      </MenuItem>
    </MenuList>
  </ChakraMenu>

  // Button to export sankey in data format (json,excel)
  const button_save_sankey = <ChakraMenu
    placement='bottom-start'
    variant='menu_button_subnav_style'
    id='enregistrer'
    onOpen={closeFilterDrawer}
  >
    <OSTooltip placement='bottom' label={t('Menu.tooltips.enregistrer')}>
      <MenuButton className='menutop_button_save'>
        <Box
          gridColumn='1'
          gridColumnEnd='span 2'
          gridRow='1'
        >
          {new_data.icon_library.icon_save_sankey}

        </Box>
        <Box
          gridColumn='1'
          gridRow='2'
        >
          {t('Menu.enregistrer')}
        </Box>
        <Box
          gridColumn='2'
          gridRow='2'
          height='1rem'
          width='1rem'
        >
          <ChevronDownIcon
            style={{ 'height': '1rem', 'width': '1rem' }} />
        </Box>
      </MenuButton>
    </OSTooltip>
    <MenuList>
      <MenuItem onClick={() => {
        new_data.menu_configuration.ref_universal_converter_set_config.current(
          CONVERTER_CONFIGS['save_json'], '', false
        )
        ref_setter_show_modal_file_converter.current!(true)
      }}>
        {new_data.icon_library.icon_save_sankey_json}
        {t('Menu.open_json')}
      </MenuItem>
      <MenuItem
        onClick={() => {
          new_data.menu_configuration.ref_universal_converter_set_config.current(
            CONVERTER_CONFIGS['save_excel'], '', false
          )
          ref_setter_show_modal_file_converter.current(true)
        }}
      >
        {new_data.icon_library.icon_save_sankey_excel}
        {t('Menu.open_excel')}
      </MenuItem>
    </MenuList>
  </ChakraMenu>

  // Button to export sankey in visual format (png,pdf, svg)
  const button_export_sankey = <ChakraMenu
    placement='bottom-start'
    variant='menu_button_subnav_style'
    id='exporter'
    onOpen={closeFilterDrawer}
  >
    <OSTooltip placement='bottom' label={t('Menu.tooltips.export')}>
      <MenuButton className='menutop_button_export'>
        <Box
          gridColumn='1'
          gridColumnEnd='span 2'
          gridRow='1'
        >
          {new_data.icon_library.icon_export_sankey}
        </Box>
        <Box
          gridColumn='1'
          gridRow='2'
        >
          {t('Menu.exporter')}
        </Box>
        <Box
          gridColumn='2'
          gridRow='2'
          height='1rem'
          width='1rem'
        >
          <ChevronDownIcon
            style={{ 'height': '1rem', 'width': '1rem' }} />
        </Box>
      </MenuButton>
    </OSTooltip>
    <MenuList minW='9rem'>
      <MenuItem onClick={() => {
        ref_setter_png_saver_res_h.current(parseInt(String(new_data.drawing_area.width)))
        ref_setter_png_saver_res_v.current(parseInt(String(new_data.drawing_area.height)))
        ref_setter_show_modal_png_saver.current!(true)
      }}>
        {new_data.icon_library.icon_export_sankey_png}
        PNG
      </MenuItem>
      <MenuItem
        onClick={() => ref_setter_show_modal_pdf_saver.current!(true)}
      >
        {new_data.icon_library.icon_export_sankey_pdf}
        PDF
      </MenuItem>
      <MenuItem
        onClick={() => clickSaveSVG(new_data)}
      >
        SVG
      </MenuItem>
      {(new_data.menu_configuration.extra_export_menu_items ?? []).map((item) => {
        const renderItem = (entry: {
          key: string
          label: string
          icon?: React.ReactNode
          onClick: () => void
          disabled?: () => boolean
          tooltip?: () => string
        }) => {
          const tooltip_text = entry.tooltip ? entry.tooltip() : ''
          const menu_item = (
            <MenuItem
              isDisabled={entry.disabled ? entry.disabled() : false}
              onClick={entry.onClick}
            >
              {entry.icon}
              {entry.label}
            </MenuItem>
          )
          // OSTooltip needs a non-disabled child to capture hover; wrap in <Box> so the tooltip
          // still appears even when the MenuItem is greyed out (the Box stays interactive).
          return tooltip_text
            ? <OSTooltip key={entry.key} placement='right' label={tooltip_text}><Box>{menu_item}</Box></OSTooltip>
            : <Fragment key={entry.key}>{menu_item}</Fragment>
        }

        if (item.type === 'group') {
          return (
            <Fragment key={item.key}>
              <MenuDivider />
              <MenuGroup title={item.label}>
                {item.children.map(renderItem)}
              </MenuGroup>
            </Fragment>
          )
        }
        return renderItem(item)
      })}
    </MenuList>
  </ChakraMenu>



  // Button to open sankey formating
  const button_mep = <OSTooltip
    placement='bottom'
    label={t('Menu.tooltips.amp')}
  >
    <Button
      variant='menutop_button'
      className='menutop_button_mep'
      size='sizeMenuTopButton'
      onClick={() => ref_setter_show_modal_apply_layout.current!(true)}
    >
      <Box
        layerStyle='menutop_button_style'
      >
        <Box
          gridRow='1'
        >
          {new_data.icon_library.icon_mep}
        </Box>
        <Box
          gridRow='2'
        >
          {t('Menu.Transformation.amp_short')}
        </Box>
      </Box>
    </Button>
  </OSTooltip>

  // Button to open welcome modale

  // Button to open tutorials
  const button_tutoriel = <OSTooltip
    placement='bottom'
    label={t('Menu.tooltips.tuto')}
  >
    <Button
      variant='menutop_button'
      size='sizeMenuTopButton'
      onClick={() => open_tutorial_file()}
      className='tutorials_button'
    >
      <Box
        layerStyle='menutop_button_style'
      >
        <Box
          gridRow='1'
        >
          {new_data.icon_library.icon_tuto}
        </Box>
        <Box
          gridRow='2'
        >
          {t('Menu.formation')}
        </Box>
      </Box>
    </Button>
  </OSTooltip>

  // Button to launch tour of application
  const button_tour = <ButtonLaunchGuide new_data={new_data} />

  // Consolidated "Fichier" dropdown — replaces the four side-by-side buttons
  // (Nouveau / Ouvrir / Enregistrer / Exporter) with a single dropdown using
  // MenuGroup sections. The original buttons stay registered in
  // dict_components_menu_top below for retro-compat with custom menu_top_order
  // arrays maintained outside this repo.
  const button_fichier = <ChakraMenu
    variant='menu_button_subnav_style'
    placement='bottom-start' id='fichier'
    onOpen={closeFilterDrawer}
  >
    <OSTooltip placement='bottom' label={t('Menu.tooltips.fichier')}>
      <MenuButton className='menutop_button_fichier'>
        <Box gridColumn='1' gridColumnEnd='span 2' gridRow='1'>
          {new_data.icon_library.icon_open_sankey}
        </Box>
        <Box gridColumn='1' gridRow='2'>
          {t('Menu.fichier_short')}
        </Box>
        <Box gridColumn='2' gridRow='2' height='1rem' width='1rem'>
          <ChevronDownIcon style={{ 'height': '1rem', 'width': '1rem' }} />
        </Box>
      </MenuButton>
    </OSTooltip>
    <MenuList>
      <MenuGroup title={t('Menu.new')}>
        <MenuItem onClick={() => { new_data.reinitialization() }}>
          {new_data.icon_library.icon_new_da}
          {t('Menu.from_new')}
        </MenuItem>
        <MenuItem onClick={() => { ref_setter_show_modal_templates_lib.current!(true) }}>
          {new_data.icon_library.icon_new_da}
          {t('Menu.from_model')}
        </MenuItem>
        <MenuItem onClick={() => { set_show_excel_template(true) }}>
          {new_data.icon_library.icon_open_sankey_excel}
          {t('Menu.new_excel_template')}
        </MenuItem>
      </MenuGroup>
      <MenuDivider />
      <MenuGroup title={t('Menu.ouvrir')}>
        <MenuItem onClick={() => open_converter_with('load_json')}>
          {new_data.icon_library.icon_open_sankey_json}
          {t('Menu.open_json')}
        </MenuItem>
        <MenuItem onClick={() => open_converter_with('load_excel')}>
          {new_data.icon_library.icon_open_sankey_excel}
          {t('Menu.open_excel')}
        </MenuItem>
        <MenuItem onClick={() => { set_show_image_import(true) }}>
          <Box as='span' mr='0.5em'><FontAwesomeIcon icon={faImage} /></Box>
          {t('Menu.import_image')}
        </MenuItem>
        <MenuItem onClick={() => {
          if (_load_sankeymatic.current) {
            _load_sankeymatic.current.name = ''
            _load_sankeymatic.current.click()
          }
        }}>
          {new_data.icon_library.icon_open_sankey_sankeymatic}
          {t('Menu.open_sankeymatic')}
        </MenuItem>
      </MenuGroup>
      <MenuDivider />
      <MenuGroup title={t('Menu.enregistrer')}>
        <MenuItem onClick={() => open_converter_with('save_json')}>
          {new_data.icon_library.icon_save_sankey_json}
          {t('Menu.open_json')}
        </MenuItem>
        <MenuItem onClick={() => open_converter_with('save_excel')}>
          {new_data.icon_library.icon_save_sankey_excel}
          {t('Menu.open_excel')}
        </MenuItem>
      </MenuGroup>
    </MenuList>
  </ChakraMenu>

  // New "Édition" dropdown — groups MEP (formerly standalone), the spreadsheet
  // editor (formerly buried as the last item of the Open menu under "format
  // converter"), and two pre-configured shortcuts for the Index-driven Excel
  // workflow (Create Index, Create TER/TES). Reuses icon_mep as requested.
  const button_edition = <ChakraMenu
    variant='menu_button_subnav_style'
    placement='bottom-start' id='edition'
    onOpen={closeFilterDrawer}
  >
    <OSTooltip placement='bottom' label={t('Menu.tooltips.edit')}>
      <MenuButton className='menutop_button_edition'>
        <Box gridColumn='1' gridColumnEnd='span 2' gridRow='1'>
          {new_data.icon_library.icon_mep}
        </Box>
        <Box gridColumn='1' gridRow='2'>
          {t('Menu.edit_short')}
        </Box>
        <Box gridColumn='2' gridRow='2' height='1rem' width='1rem'>
          <ChevronDownIcon style={{ 'height': '1rem', 'width': '1rem' }} />
        </Box>
      </MenuButton>
    </OSTooltip>
    <MenuList>
      <MenuItem onClick={() => ref_setter_show_modal_apply_layout.current!(true)}>
        {new_data.icon_library.icon_mep}
        {t('Menu.Transformation.amp')}
      </MenuItem>
      <MenuItem onClick={() => open_converter_with('universal')}>
        {new_data.icon_library.icon_open_sankey_pickle}
        {t('Menu.spreadsheet_editor')}
      </MenuItem>
      <MenuDivider />
      <MenuItem onClick={() => open_converter_with('create_index')}>
        {new_data.icon_library.icon_open_sankey_excel}
        {t('Menu.create_index')}
      </MenuItem>
      <MenuItem onClick={() => open_converter_with('create_ter_tes')}>
        {new_data.icon_library.icon_open_sankey_excel}
        {t('Menu.create_ter_tes')}
      </MenuItem>
    </MenuList>
  </ChakraMenu>

  // Consolidated "Aide" dropdown — groups the formerly standalone Visite guidée
  // (tour) and Tutoriels buttons, and any extra_help_menu_items injected by
  // upper layers (SA pushes Sankeythèque here). Frees horizontal space in the
  // topbar on small screens. Legacy 'tour'/'tutoriel' keys stay in the dict.
  // The source icons have heterogeneous sizes (logo_tour / logo_sankeytheque are
  // 2rem topbar SVGs, icon_tuto is a 1em FA glyph) — normalize them to a uniform
  // box so the menu rows line up cleanly.
  const helpMenuIcon = (node: React.ReactNode) =>
    <Box
      display='inline-flex'
      alignItems='center'
      justifyContent='center'
      boxSize='1.2rem'
      sx={{ '& svg': { width: '1.1rem', height: '1.1rem' } }}
    >
      {node}
    </Box>
  const button_aide = <ChakraMenu
    variant='menu_button_subnav_style'
    placement='bottom-start' id='aide'
    onOpen={() => { closeFilterDrawer(); fetch_tutorials_list() }}
    onClose={() => setTutoSubmenuOpen(false)}
  >
    <OSTooltip placement='bottom' label={t('Menu.tooltips.aide')}>
      <MenuButton className='menutop_button_aide'>
        <Box gridColumn='1' gridColumnEnd='span 2' gridRow='1'>
          {new_data.icon_library.icon_tuto}
        </Box>
        <Box gridColumn='1' gridRow='2'>
          {t('Menu.aide')}
        </Box>
        <Box gridColumn='2' gridRow='2' height='1rem' width='1rem'>
          <ChevronDownIcon style={{ 'height': '1rem', 'width': '1rem' }} />
        </Box>
      </MenuButton>
    </OSTooltip>
    <MenuList>
      <MenuItem
        icon={helpMenuIcon(<FontAwesomeIcon icon={faCircleQuestion} />)}
        onClick={() => new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_welcome.current!(true)}
      >
        {t('Menu.aide_navigation')}
      </MenuItem>
      <MenuItem
        icon={helpMenuIcon(logo_tour)}
        onClick={() => { new_data.setSteps(); setIsOpen(true) }}
      >
        {t('guide.guide')}
      </MenuItem>
      {tutorials_list.length > 1
        ? (
          // Plusieurs tutoriels : sous-menu flyout listant tutorials/index.json.
          // Chakra v2 n'a pas de sous-menu natif : on contrôle l'ouverture au
          // survol (le clic sur un MenuItem-bouton fermerait le menu parent).
          <Box
            onMouseEnter={() => setTutoSubmenuOpen(true)}
            onMouseLeave={() => setTutoSubmenuOpen(false)}
          >
            <Menu isOpen={tuto_submenu_open} placement='right-start' gutter={0} offset={[0, 0]}>
              <MenuButton
                as={MenuItem}
                closeOnSelect={false}
              >
                <Box display='flex' alignItems='center' justifyContent='space-between'>
                  <Box display='flex' alignItems='center' gap='0.75rem'>
                    {helpMenuIcon(new_data.icon_library.icon_tuto)}
                    {t('Menu.formation')}
                  </Box>
                  <ChevronDownIcon style={{ height: '1rem', width: '1rem', transform: 'rotate(-90deg)' }} />
                </Box>
              </MenuButton>
              <Portal>
                <MenuList
                  onMouseEnter={() => setTutoSubmenuOpen(true)}
                  onMouseLeave={() => setTutoSubmenuOpen(false)}
                >
                  {tutorials_list.map((tuto) => (
                    <MenuItem
                      key={tuto.file}
                      onClick={() => open_tutorial_file(tuto.file)}
                    >
                      {tuto.title}
                    </MenuItem>
                  ))}
                </MenuList>
              </Portal>
            </Menu>
          </Box>
        )
        : (
          // Un seul tutoriel (ou liste non chargée) : chargement direct.
          <MenuItem
            icon={helpMenuIcon(new_data.icon_library.icon_tuto)}
            onClick={() => open_tutorial_file(tutorials_list[0]?.file)}
          >
            {t('Menu.formation')}
          </MenuItem>
        )}
      {(new_data.menu_configuration.extra_help_menu_items ?? []).map((item) => {
        const tooltip_text = item.tooltip ? item.tooltip() : ''
        const menu_item = (
          <MenuItem
            icon={helpMenuIcon(item.icon)}
            isDisabled={item.disabled ? item.disabled() : false}
            onClick={item.onClick}
          >
            {item.label}
          </MenuItem>
        )
        // OSTooltip needs a non-disabled child to capture hover; wrap in <Box>
        // so the tooltip still appears when the MenuItem is greyed out.
        return tooltip_text
          ? <OSTooltip key={item.key} placement='right' label={tooltip_text}><Box>{menu_item}</Box></OSTooltip>
          : <Fragment key={item.key}>{menu_item}</Fragment>
      })}
    </MenuList>
  </ChakraMenu>

  // Dict containing buttons of OpenSankey that will be displayed in order of menu_top_order
  const dict_components_menu_top: { [x: string]: React.JSX.Element; } = {
    // New consolidated entries (default menu_top_order uses these)
    'fichier': button_fichier,
    'edition': button_edition,
    'aide': button_aide,
    // Legacy granular entries kept for retro-compat with custom menu_top_order
    // arrays that referenced the original split buttons.
    'resetDA': button_resetDA,
    'open_sankey': button_open_sankey,
    'save_sankey': button_save_sankey,
    'export_sankey': button_export_sankey,
    'mep': button_mep,
    // Help buttons
    // 'welcome': button_welcome,
    'tour': button_tour,
    'tutoriel': button_tutoriel,
    ...additionalMenus.current.external_top_buttons_item
  }
  return <>
    <Box
      display='grid'
      gridAutoFlow='column'
      gridTemplateColumns={'repeat(' + String(new_data.menu_configuration.menu_top_order.length) + ', max-content 3px)'}
    >
      {
        new_data.menu_configuration.menu_top_order
          .map((arr, i) => {
            return <Fragment key={'top_grp_' + i}>
              <ButtonGroup
                marginRight='0.35rem'
                marginLeft='0.35rem'
                spacing='0'
              >
                {
                  arr.map((k, i) => {
                    return <React.Fragment
                      key={'menutop_button_' + i}>
                      {dict_components_menu_top[k]}
                    </React.Fragment>
                  })
                }
              </ButtonGroup>
              {
                (i < (new_data.menu_configuration.menu_top_order.length)) ?
                  <Divider
                    orientation='vertical'
                    margin='0'
                  />
                  :
                  <></>
              }
            </Fragment>
          })
      }
    </Box>
    <ModalTemplate
      new_data={new_data}
      additionalMenu={additionalMenus}
    />
    <ModalExcelTemplate
      new_data={new_data}
      show={show_excel_template}
      setShow={set_show_excel_template}
    />
    <ModalImageImport
      new_data={new_data}
      show={show_image_import}
      setShow={set_show_image_import}
    />
  </>
}

/**
 * Buttons present in navbar when application is static
 *
 * @param {*} { new_data, additionalMenus }
 * @return {*}
 */
export const MenuTopButtonsStatic = ({ new_data, additionalMenus }: {
  new_data: Class_ApplicationData,
  additionalMenus: MutableRefObject<Type_AdditionalMenus>,
}) => {
  const [, setUpdate] = useState(0)
  new_data.menu_configuration.ref_to_submenu_updater.current = () => setUpdate(b => b + 1)


  const diagrams_list = window.sankey
    ? (window.sankey.diagrams_list ?? window.sankey.sous_filieres)
    : undefined

  let is_split = false
  const diagrams: { [keys: string]: string[]; } = {}

  if (diagrams_list) {
    is_split = Object.keys(diagrams_list)[0].includes('/')
    if (is_split) {
      Object.keys(diagrams_list).forEach(s => {
        const path = s.split('/')
        if (!(path[0] in diagrams)) {
          diagrams[path[0]] = [path[1]]
        } else {
          diagrams[path[0]].push(path[1])
        }
      })
    } else {
      Object.keys(diagrams_list).forEach(s => diagrams[s] = [s])
    }
  }
  const [s_diagram, sDiagram] = useState(Object.keys(diagrams).length > 0 ? Object.keys(diagrams)[0] : '')
  const [s_diagram_2, sDiagram2] = useState(Object.keys(diagrams).length > 0 ? Object.values(diagrams)[0][0] : '')

  let diagrams_element = (new_data.is_static && diagrams_list && !is_split) ?
    <Box
      margin='0.25rem'
      alignSelf='center'
      justifySelf='center'
    >
      <FormControl key={'1'}>
        <Select style={{ width: '200px', color: 'black' }}
          onChange={evt => {
            sDiagram(evt.target.value)
            setDiagram(evt.target.value, new_data)
          }}
          value={s_diagram}>
          {Object.keys(diagrams_list).map((name, i) => <option key={i} value={name}>{name}</option>)}
        </Select>
      </FormControl>
    </Box> :
    <React.Fragment key={'1'} />

  if (new_data.is_static && diagrams_list && is_split) {
    diagrams_element = <Box
      margin='0.25rem'
      alignSelf='center'
      justifySelf='center'
    >
      <FormControl key={'1'}>
        <Select style={{ width: '200px', color: 'black' }}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            sDiagram(evt.target.value)
            const diagram_path = evt.target.value + '/' + diagrams[evt.target.value][0]
            setDiagram(diagram_path, new_data)
          }}
          value={s_diagram}>
          {Object.keys(diagrams).map((name, i) => <option key={i} value={name}>{name}</option>)}
        </Select>
      </FormControl>
      {is_split ?
        (<FormControl key={'2'}>
          <Select style={{ width: '200px', color: 'black' }}
            onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
              sDiagram2(evt.target.value)
              const diagram_path = s_diagram + '/' + evt.target.value
              setDiagram(diagram_path, new_data)
            }}
            value={s_diagram_2}>
            {diagrams[s_diagram] ? (Object.values(diagrams[s_diagram]).map((name, i) => <option key={i} value={name}>{name}</option>)) : (<React.Fragment key={'dshfjhfsdkjh'}></React.Fragment>)}
          </Select></FormControl>) : (<React.Fragment key={'sqtyutsugh'} />)}
    </Box>

  }

  const edit_button = <OSTooltip
    placement='bottom'
    label={'Editer le diagramme dans OpenSankey'}
  >
    <Button
      variant='menutop_button'
      size='sizeMenuTopButton'
      onClick={() => {
        // Si vous êtes sur: https://terriflux.com/portfolios/SOCLE/Cereales/diagrams.html
        // Et que new_data.file_name = "SOCLE_FR_Cereales_Ble_tendre."

        const currentPath = window.location.pathname // "/portfolios/SOCLE/Cereales/diagrams.html"
        const basePath = currentPath.substring(0, currentPath.lastIndexOf('/')) // "/portfolios/SOCLE/Cereales"
        const fileUrl = window.location.origin + basePath + '/' + new_data.file_name
        const url = 'https://open-sankey.fr/?url=' + fileUrl

        window.open(url, '_blank')
      }}
    >
      <Box
        layerStyle='menutop_button_style'
      >
        <Box
          gridRow='1'
        >
          <Image src='logo_opensankey.png' />
        </Box>
        <Box
          gridRow='2'
        >
          {'Éditer'}
        </Box>
      </Box>
    </Button>
  </OSTooltip>

  const help_button =
    <OSTooltip
      placement={new_data.is_static ? 'left' : 'top'} // Changement du placement du tooltip vers la gauche
      label={new_data.t('Banner.tooltipHelp')}
      isAlwaysOpen={!new_data.is_static && new_data.menu_configuration.show_splashscreen}
    >
      <Button
        variant='info'
        onClick={() => new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_welcome.current!(true)}
      >
        <b>Aide à la navigation</b>
      </Button>
    </OSTooltip>

  let dict_components_menu_top: { [x: string]: React.JSX.Element; } = {}
  if (new_data.is_static && diagrams_list) dict_components_menu_top['diagrams'] = diagrams_element
  dict_components_menu_top = { ...dict_components_menu_top, ...additionalMenus.current.external_top_buttons_item }
  if (new_data.is_static && new_data.publish_options.edit_button) dict_components_menu_top['edit'] = edit_button
  // Onglet « Unit. » (sankey unitaire OS+) : aligné avec les boutons statiques (à côté
  // d'« Éditer »), pas dans le bloc méta de droite (sinon retour à la ligne). Le bouton se
  // masque de lui-même si OS+ est absent.
  if (new_data.is_static && new_data.publish_options.unitary) {
    dict_components_menu_top['unitary'] = <UnitaryTabButton new_data={new_data} />
  }
  dict_components_menu_top['help'] = help_button

  return <Box
    display='grid'
    gridAutoFlow='column'
    gridTemplateColumns={'repeat(' + String(Object.values(dict_components_menu_top).length) + ', max-content 3px)'}
  >
    {
      Object.values(dict_components_menu_top)
        .map((c, i) => {
          return <Fragment key={'top_grp_' + i}>
            <ButtonGroup
              marginRight='1rem'
              marginLeft='1rem'
            >
              {c}
            </ButtonGroup>
            {
              (i < (Object.values(dict_components_menu_top).length)) ?
                <Divider
                  orientation='vertical'
                  margin='0'
                />
                :
                <></>
            }
          </Fragment>
        })
    }
  </Box>
}

/**
 * Component for the top nav bar containing application logo, buttons for application edition & other general functionnalities
 *
 * @param {*} { new_data, additionalMenus }
 * @return {*}
 */
export const MenuTopNavBar = ({ new_data, additionalMenus }: {
  new_data: Class_ApplicationData,
  additionalMenus: MutableRefObject<Type_AdditionalMenus>,
}) => {
  const { logo } = new_data
  const langToFlag: Record<string, string> = { fr: 'fr', en: 'gb', es: 'es', de: 'de', it: 'it' }
  const [flag, setFlag] = useState(langToFlag[new_data.i18n.language] ?? 'gb')
  // En statique, la .TopMenu a 3 ou 4 enfants : logo, (header optionnel), boutons, bloc méta
  // (info). Avec un header, il faut 4 colonnes sinon le bloc méta déborde sur une 2e ligne
  // (info mal placé). Sans header (3 enfants), 3 colonnes suffisent.
  const menutop_grid_template = new_data.is_static
    ? (new_data.publish_options.header ? '100px 30fr auto auto' : '100px 30fr auto')
    : 'minmax(7vw, 100px) auto auto'

  // Format variable so if it's an list of Element, wrap these element in <React.Fragment/> with key to ensure no warning in console
  const constent_additional_nav_item = <>
    {additionalMenus.current.additional_nav_item.map((el, i) => {
      return <React.Fragment key={'add_menu' + i}>{el}</React.Fragment>
    })}
  </>

  const changeLang = (lang: string) => {
    new_data.language = lang
    new_data.saveInCache() // Save data in cache because change language re-render the app from index
    new_data.i18n.changeLanguage(lang)
    new_data.menu_configuration.updateAllMenuComponents()
    new_data.draw()
  }

  return <Box
    zIndex='1'
    position='fixed'
    top='0'
    width='100%'
  >
    <Box
      className='TopMenu'
      layerStyle='menutop_layout_style'
      gridTemplateColumns={menutop_grid_template}
      onClick={() => {
        new_data.drawing_area.node_contextualised = undefined
        new_data.menu_configuration.ref_to_menu_context_nodes_updater.current()

        new_data.drawing_area.link_contextualised = undefined
        new_data.menu_configuration.ref_to_menu_context_links_updater.current()

        new_data.drawing_area.is_drawing_area_contextualised = false
        new_data.menu_configuration.ref_to_menu_context_drawing_area_updater.current()

      }}>

      {
        // Application image that indicate which module is activated.
        // Logo is height-constrained and contain-fitted so OS and SS logos
        // render with consistent visual weight despite different aspect ratios.
        <Box
          alignSelf='center'
          justifySelf='start'
          display='flex'
          alignItems='center'
          height='100%'
          paddingLeft='0.5rem'
        >
          {logo ? (
            <Image
              src={logo}
              objectFit='contain'
              maxHeight='2.1rem'
              width='auto'
            />
          ) : null}
        </Box>}
      {
        // When application is static, search for a header (title of the project)
        new_data.is_static && new_data.publish_options.header ?
          <Box
            margin='0.25rem'
            alignSelf='center'
            justifySelf='center'
          >
            <Text
              fontWeight='bold'
              fontSize='24px'
            >
              {parse(new_data.publish_options.header)}
            </Text>
          </Box> :
          <></>}
      {
        // Top menu buttons to access general appliaction functionnalities
        new_data.is_static ?
          <MenuTopButtonsStatic new_data={new_data} additionalMenus={additionalMenus} /> :
          <MenuTopButtons new_data={new_data} additionalMenus={additionalMenus} />}
      <Box
        margin='0.25rem'
        alignSelf='center'
        justifySelf='end'
        display='flex'
        flexDirection='row'
        alignItems='center'
        gap='0.25rem'
        width='unset'
      >
        {/* Document-state block (undo / redo / save-in-cache) — its own group
            separated from the language/info meta controls by a divider. */}
        {!new_data.is_static ? <>
          <TopBarStateButtons new_data={new_data} />
          <Divider orientation='vertical' height='1.5rem' borderColor='gray.300' margin='0 0.25rem' />
        </> : <></>}
        {constent_additional_nav_item}
        <AppInfoPopover new_data={new_data} />
        {/* Language selector kept as the right-most control of the topbar. */}
        {!new_data.is_static ? <Menu variant='selector_lang'>
          <MenuButton>
            <ReactCountryFlag countryCode={flag} svg style={{ height: '0.7rem', width: '1rem', margin: 'auto' }} title={flag} />
            <ChevronDownIcon boxSize='0.8rem' />
          </MenuButton>
          <Portal>
            <MenuList>
              <MenuItem onClick={() => { setFlag('fr'); changeLang('fr') }}><ReactCountryFlag countryCode={'fr'} svg />Français</MenuItem>
              <MenuItem onClick={() => { setFlag('gb'); changeLang('en') }}><ReactCountryFlag countryCode={'gb'} svg />English</MenuItem>
              <MenuItem onClick={() => { setFlag('es'); changeLang('es') }}><ReactCountryFlag countryCode={'es'} svg />Español</MenuItem>
              <MenuItem onClick={() => { setFlag('de'); changeLang('de') }}><ReactCountryFlag countryCode={'de'} svg />Deutsch</MenuItem>
              <MenuItem onClick={() => { setFlag('it'); changeLang('it') }}><ReactCountryFlag countryCode={'it'} svg />Italiano</MenuItem>
            </MenuList>
          </Portal>
        </Menu> : <></>}
      </Box>
    </Box>
  </Box>
}

/**
 * Topbar info popover: shows app version, release channel, build/commit info,
 * a support mailto and a link to the changelog. All values are inlined at build
 * time by the consumer's bundler from REACT_APP_* (see the consumer's
 * craco/webpack config); this component stays generic and only renders a
 * field/link when its variable is provided.
 *   - REACT_APP_VERSION         display version, channel suffix already applied
 *   - REACT_APP_RELEASE_CHANNEL 'alpha' | 'beta' | 'stable'
 *   - REACT_APP_RELEASE_DATE    build date (YYYY-MM-DD)
 *   - REACT_APP_GIT_COMMIT      short commit hash
 *   - REACT_APP_GIT_COMMIT_DATE commit date (YYYY-MM-DD)
 *   - REACT_APP_CHANGELOG_URL   link to the changelog (lists current + previous versions)
 *   - REACT_APP_VERSIONS_URL    endpoint returning archived versions [{ version, url }]
 */
const AppInfoPopover = ({ new_data }: { new_data: Class_ApplicationData }) => {
  const version = process.env.REACT_APP_VERSION ?? ''
  const channel = process.env.REACT_APP_RELEASE_CHANNEL ?? ''
  const release_date = process.env.REACT_APP_RELEASE_DATE ?? ''
  const git_commit = process.env.REACT_APP_GIT_COMMIT ?? ''
  const git_commit_date = process.env.REACT_APP_GIT_COMMIT_DATE ?? ''
  const changelog_url = process.env.REACT_APP_CHANGELOG_URL ?? ''
  const versions_url = process.env.REACT_APP_VERSIONS_URL ?? ''

  // Archived versions are discovered at runtime: the list grows after each
  // deploy, so it can't be inlined at build time like the fields above. Only
  // fetched when the consumer provides REACT_APP_VERSIONS_URL; the endpoint
  // returns [{ version, url }]. Any failure is swallowed — the section just
  // stays hidden (e.g. offline, static export, endpoint absent).
  const [prev_versions, setPrevVersions] = useState<{ version: string, url: string }[]>([])
  useEffect(() => {
    if (!versions_url) return
    let cancelled = false
    fetch(versions_url)
      .then(r => (r.ok ? r.json() : []))
      .then(list => { if (!cancelled && Array.isArray(list)) setPrevVersions(list) })
      .catch(() => { /* hide the section on failure */ })
    return () => { cancelled = true }
  }, [versions_url])

  // Deployed build's bare version (channel suffix .a/.b stripped) so we can
  // flag the current one if it's already among the archived slots.
  const current_bare = version.replace(/\.[ab]$/, '')

  return <Popover placement='bottom-end' trigger='hover' openDelay={150}>
    <PopoverTrigger>
      <IconButton
        aria-label='Informations'
        icon={<InfoOutlineIcon />}
        size='sm'
        boxSize='2rem'
        fontSize='1rem'
        bg='transparent'
        bgColor='transparent'
        borderColor='transparent'
        color='gray.700'
        _hover={{ bg: 'gray.100', bgColor: 'gray.100', color: 'gray.900' }}
        _active={{ bg: 'gray.200', bgColor: 'gray.200' }}
      />
    </PopoverTrigger>
    <Portal>
      <PopoverContent width='auto' minWidth='13rem'>
        <PopoverArrow />
        <PopoverBody>
          <VStack align='start' spacing='0.25rem' fontSize='sm'>
            <HStack spacing='0.4rem' alignSelf='center'>
              <Text color='gray.500'>Édité par</Text>
              <Link href='https://terriflux.fr' isExternal>
                <Image src={new_data.logo_terriflux} height='1rem' objectFit='contain' alt='TerriFlux' />
              </Link>
            </HStack>
            <Divider my='0.25rem' />
            {version && <HStack spacing='0.4rem'>
              <Text>Version {version}</Text>
              {channel === 'alpha' && <Badge colorScheme='orange'>alpha</Badge>}
              {channel === 'beta' && <Badge colorScheme='purple'>beta</Badge>}
            </HStack>}
            {release_date && <Text color='gray.500'>Build {release_date}</Text>}
            {git_commit && <Text color='gray.500'>
              Commit {git_commit}{git_commit_date && ` · ${git_commit_date}`}
            </Text>}
            {prev_versions.length > 0 && <Divider my='0.25rem' />}
            {prev_versions.length > 0 && <Text color='gray.500' fontSize='xs'>Versions précédentes</Text>}
            {prev_versions.map(v => (
              v.version === current_bare
                ? <Text key={v.version} fontWeight='semibold'>v{v.version} (actuelle)</Text>
                : <Link key={v.version} href={v.url} color='blue.500'>v{v.version}</Link>
            ))}
            {changelog_url && <Divider my='0.25rem' />}
            {changelog_url && <Link href={changelog_url} color='blue.500' isExternal>
              Changelog
            </Link>}
            <Link href='https://terriflux.fr' color='blue.500' isExternal>
              terriflux.fr
            </Link>
            <Link href='mailto:support@terriflux.fr' color='blue.500'>
              support@terriflux.fr
            </Link>
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Portal>
  </Popover>
}



/**
 * Button to launch tour of application
 *
 * @param {Class_ApplicationData} new_data
 * @return {*}  {JSX.Element}
 */
export const ButtonLaunchGuide = ({ new_data }: { new_data: Class_ApplicationData }) => {
  const { setIsOpen } = useTour()
  return <OSTooltip
    label={new_data.t('guide.tooltip.guide')}
    isAlwaysOpen={new_data.menu_configuration.show_splashscreen}
  >
    <Button
      variant='menutop_button'
      size='sizeMenuTopButton'
      onClick={() => {
        new_data.setSteps()
        setIsOpen(true)
      }}
    >
      <Box
        layerStyle='menutop_button_style'
      >
        <Box
          gridRow='1'
        >
          {logo_tour}
        </Box>
        <Box
          gridRow='2'
        >
          {new_data.t('guide.guide')}
        </Box>
      </Box>
    </Button>
  </OSTooltip>
}
const logo_tour = <svg
  xmlns='http://www.w3.org/2000/svg'
  viewBox='0 0 135 135'
  height='2.0rem'
  width='2.0rem'
>
  <path
    d='m 3.6387248,133.29711 c -0.469146,-0.52342 -0.487284,-1.19855 -0.487284,-18.13805 0,-15.987635 0.04112,-17.747655 0.450248,-19.272655 0.980112,-3.65327 3.261387,-7.23345 6.010647,-9.43298 2.7136142,-2.17101 4.3273232,-2.76468 14.1305242,-5.19848 8.507225,-2.11205 9.133187,-2.3066 9.912018,-3.08061 0.790864,-0.78596 0.831331,-0.92018 0.831331,-2.75742 v -1.93125 l -1.417588,-1.08033 c -5.548643,-4.22855 -9.068301,-10.7622 -9.500541,-17.63615 l -0.158295,-2.51738 h -0.938969 c -2.412964,0 -4.8803,-1.63152 -6.018483,-3.9797 -1.169907,-2.41363 -0.760113,-5.984749 0.891034,-7.764866 0.472296,-0.509187 0.471516,-0.550655 -0.03893,-2.06876 -1.058404,-3.14777 0.168767,-6.255966 3.049153,-7.722944 l 0.83133,-0.423395 v -7.943105 c 0,-6.264348 0.08226,-8.268339 0.389221,-9.48196 1.315818,-5.2023233 5.489092,-9.4615053 10.62152,-10.8401683 2.105106,-0.56547 28.104425,-0.556043 30.310205,0.01099 4.1299,1.061662 7.70054,4.010478 9.52988,7.870261 0.57208,1.2070523 1.16318,2.8840533 1.31355,3.7266693 0.15306,0.857715 0.2734,4.846618 0.2734,9.062708 v 7.530679 l 1.26093,0.791186 c 1.85251,1.162387 2.66762,2.551791 2.79111,4.757618 0.0704,1.257877 -0.0276,2.121827 -0.33184,2.926028 -0.42894,1.133687 -0.42749,1.146785 0.22115,2.005173 2.11505,2.798985 1.8351,6.964206 -0.6357,9.458176 -1.12337,1.1339 -3.15873,2.0797 -4.48237,2.08288 l -1.04882,0.003 -0.16424,2.25919 c -0.31297,4.30501 -1.83799,8.89124 -4.02193,12.09526 -1.23543,1.81247 -4.15139,4.82183 -5.74698,5.93106 -1.37045,0.95272 -1.39839,0.99725 -1.39839,2.22849 0,1.44027 0.4581,2.70342 1.23316,3.40027 0.4023,0.3617 2.17863,0.76293 7.10525,1.6049 3.61287,0.61744 7.15714,1.31694 7.87616,1.55443 3.13161,1.03437 5.96806,2.88567 8.3873,5.47425 1.95763,2.09465 2.13792,2.38567 6.10441,9.85349 1.62395,3.05745 3.06279,5.510215 3.19742,5.450585 0.13464,-0.0596 4.44622,-4.939465 9.581284,-10.844095 l 9.33648,-10.73576 0.1279,-28.84816 0.12789,-28.848158 0.78007,-0.787316 c 0.94234,-0.951104 2.31777,-1.24745 3.3543,-0.722706 0.39915,0.202068 3.78842,2.881942 7.53172,5.955276 7.10684,5.834874 7.50627,6.271029 7.50627,8.196397 0,1.940919 -0.37576,2.345272 -7.95479,8.560007 l -7.25276,5.9472 v 13.68052 13.68054 l 0.83133,-0.21416 c 0.45723,-0.11779 1.80974,-0.20344 3.00558,-0.19035 1.75452,0.0192 2.45464,0.15196 3.6267,0.68763 3.52245,1.60987 5.83768,5.28082 5.83768,9.25604 0,1.61894 -0.84771,4.30152 -1.7526,5.54608 -0.93899,1.29147 -17.51037,20.440855 -18.35838,21.214385 -1.33912,1.22151 -3.42207,0.36147 -3.42207,-1.41296 0,-0.67144 0.88128,-1.81573 5.52943,-7.17964 l 5.52944,-6.380895 -4.04169,-4.08557 c -2.22292,-2.24706 -4.13564,-4.02695 -4.25048,-3.95531 -0.11484,0.0716 -3.10243,3.46376 -6.63908,7.53805 -3.536664,4.074285 -6.845984,7.675505 -7.354064,8.002715 -0.7145,0.46015 -1.19163,0.57181 -2.10611,0.49291 -2.05858,-0.17762 -2.43823,-0.64949 -6.12284,-7.610125 -3.88979,-7.34826 -5.05732,-9.12782 -7.09015,-10.80693 -2.62122,-2.1651 -4.94661,-3.08484 -10.033,-3.96825 -2.46202,-0.42761 -4.54743,-0.77759 -4.63425,-0.77774 -0.0868,-1.5e-4 -0.48052,0.49352 -0.87489,1.09704 -1.89422,2.89887 -4.36857,5.15072 -7.54602,6.86748 -7.40645,4.00166 -16.794604,3.03502 -23.324422,-2.40159 -1.427445,-1.18847 -2.514841,-2.40428 -4.099378,-4.5835 -0.296588,-0.4079 -0.810432,-0.31691 -6.970835,1.23439 -3.657854,0.92111 -7.348702,2.00352 -8.201883,2.40536 -2.183973,1.02863 -4.6814402,3.46545 -5.8477522,5.70577 -1.656589,3.18206 -1.67231,3.38917 -1.677255,22.097525 l -0.0044,16.80208 -0.592023,0.56139 c -0.78595,0.74529 -2.225459,0.75414 -2.8855,0.0177 z M 123.14122,92.659695 c 2.70535,-3.12221 3.27261,-4.2739 3.12431,-6.34325 -0.22025,-3.07348 -2.67635,-5.41248 -5.66989,-5.39956 -2.10785,0.009 -3.15826,0.67169 -5.76442,3.63614 l -2.34188,2.66384 4.03353,4.07734 c 2.21844,2.24253 4.11188,4.04794 4.20764,4.01203 0.0958,-0.0359 1.18058,-1.22686 2.41071,-2.64654 z m -71.388914,-3.39274 c 2.60832,-0.67359 5.41528,-2.32787 7.54592,-4.44718 1.73944,-1.73018 1.87421,-1.93532 1.44431,-2.19837 -2.18344,-1.33602 -2.72695,-1.78925 -3.42951,-2.85986 -0.44122,-0.67238 -0.93141,-1.85063 -1.08931,-2.61835 -0.15789,-0.76771 -0.36525,-1.39434 -0.46079,-1.3925 -0.0955,0.002 -0.87584,0.22555 -1.734,0.49715 -4.00214,1.26666 -9.4006,1.23523 -13.499412,-0.0786 l -1.893267,-0.60686 -0.111,1.3189 c -0.195534,2.32331 -1.809824,4.73876 -3.744778,5.60329 -0.443217,0.19802 -0.805848,0.48055 -0.805848,0.62784 0,0.45351 2.862662,3.12073 4.348498,4.05161 2.318146,1.45233 4.009512,2.05294 7.418027,2.63418 1.06803,0.18212 4.38337,-0.11088 6.01116,-0.53125 z m 0.38369,-16.75429 c 0.91446,-0.2191 2.69863,-0.90908 3.96481,-1.5333 4.10936,-2.02588 7.11294,-5.09304 9.11062,-9.30352 1.74547,-3.67888 1.83875,-4.29007 1.95306,-12.79615 l 0.10257,-7.632289 -2.3857,-0.817245 c -5.58068,-1.911715 -9.7258,-2.651471 -15.83216,-2.825475 -7.002246,-0.199537 -11.935024,0.487197 -18.33578,2.552671 l -3.172423,1.023717 0.08898,7.923651 c 0.08883,7.91031 0.09019,7.92712 0.806163,9.98919 0.966457,2.78349 1.992421,4.66417 3.652982,6.69622 3.054723,3.73812 7.625841,6.34931 12.494948,7.13759 1.73367,0.28067 5.51566,0.0728 7.55193,-0.41506 z m -6.39858,-7.37596 c -1.812308,-0.25656 -3.660356,-1.05897 -4.187046,-1.81798 -0.808698,-1.1654 -0.379862,-2.53595 0.953602,-3.04769 0.540465,-0.20741 0.970048,-0.14717 2.025504,0.28405 0.84822,0.34654 1.90252,0.54729 2.87433,0.54729 0.97182,0 2.02612,-0.20075 2.87433,-0.54729 1.50852,-0.61632 2.29109,-0.48084 2.98312,0.51643 0.95398,1.37476 0.17768,2.63033 -2.16444,3.50074 -1.71504,0.63736 -3.50945,0.82635 -5.3594,0.56445 z m -9.912008,-13.66892 c -0.841611,-0.34128 -1.083405,-1.25714 -1.083405,-4.10364 0,-2.16888 0.07572,-2.62747 0.530153,-3.2106 0.408928,-0.524742 0.755626,-0.680304 1.516199,-0.680304 0.760573,0 1.107271,0.155562 1.516198,0.680304 0.462768,0.59383 0.530154,1.03837 0.530154,3.49734 0,2.64667 -0.03797,2.85536 -0.627859,3.45078 -0.650758,0.65687 -1.385798,0.76987 -2.38144,0.36612 z m 20.775358,-0.36612 c -0.59411,-0.59967 -0.62786,-0.79399 -0.62786,-3.6147 0,-3.47635 0.26867,-4.013724 2.00671,-4.013724 1.68541,0 1.9581,0.564204 1.9581,4.051454 0,2.92806 -0.009,2.97212 -0.7177,3.58759 -0.91646,0.79571 -1.82407,0.79203 -2.61925,-0.0106 z m -33.1137,-5.66324 v -2.682294 l -0.906461,-0.171647 c -1.545087,-0.292579 -2.352257,0.286272 -2.766422,1.983901 -0.382153,1.56641 1.18994,3.55233 2.8121,3.55233 h 0.860783 z m 50.5449,1.80443 c 0.73612,-0.74302 0.8697,-1.05965 0.8697,-2.06147 0,-0.93185 -0.1525,-1.35589 -0.71696,-1.993555 -0.65858,-0.743991 -0.80439,-0.795038 -1.79056,-0.626862 l -1.0736,0.183085 v 2.688332 2.68833 h 0.92086 c 0.70619,0 1.1236,-0.20464 1.79056,-0.87786 z m 48.913184,-7.365247 c 2.83892,-2.332614 5.16167,-4.321048 5.16167,-4.418743 0,-0.168362 -9.92592,-8.409013 -10.65452,-8.845543 -0.2863,-0.171535 -0.34462,1.327065 -0.34462,8.855938 0,7.441653 0.0604,9.025485 0.33789,8.855935 0.18585,-0.11356 2.66065,-2.114974 5.49958,-4.447587 z m -97.86603,-2.05564 c 7.393317,-2.961855 14.096274,-4.243972 22.196786,-4.245717 8.19588,-0.0018 14.28185,1.124353 21.693,4.013976 2.39776,0.934891 2.70732,0.998233 3.42073,0.699959 0.48839,-0.204192 0.92047,-0.656662 1.14496,-1.198994 0.77941,-1.882888 -0.49698,-2.818267 -6.74553,-4.943326 -3.10957,-1.05753 -3.56125,-1.284717 -3.87696,-1.950039 -0.44765,-0.943401 -0.16926,-1.835625 0.80003,-2.564044 l 0.70489,-0.529724 2.55648,0.79061 2.55648,0.790607 v -6.888863 c 0,-7.425712 -0.14752,-8.527537 -1.44052,-10.758967 -0.88139,-1.5210723 -3.19119,-3.6342533 -4.76974,-4.3637153 -0.74334,-0.343505 -2.15371,-0.74157 -3.13415,-0.884589 -2.17731,-0.31761 -23.105122,-0.341326 -25.505522,-0.0289 -3.685685,0.479705 -6.889625,2.809925 -8.457749,6.1513033 l -0.816784,1.740415 -0.07801,7.526183 -0.07801,7.526184 2.730808,-0.874747 c 6.491584,-2.07942 11.722868,-2.82301 19.679287,-2.79727 6.81283,0.02204 9.21403,0.304032 9.91201,1.164044 0.65384,0.805626 0.56565,1.94787 -0.21093,2.731726 -0.59261,0.598176 -0.79113,0.648686 -1.9824,0.504385 -0.72811,-0.0882 -3.51087,-0.233363 -6.18392,-0.322594 -6.707682,-0.22391 -11.94344,0.384064 -18.190674,2.1123 -3.689136,1.020561 -8.634004,2.900599 -9.321966,3.544209 -1.102102,1.03105 -0.834197,2.772055 0.534102,3.470919 0.832261,0.425078 0.727601,0.440258 2.863293,-0.415327 z m -2.085077,95.338492 c -0.510638,-0.65525 -0.530154,-0.97713 -0.530154,-8.74374 0,-7.76661 0.01952,-8.08848 0.530154,-8.74374 0.408926,-0.52474 0.755627,-0.6803 1.516199,-0.6803 0.760571,0 1.107272,0.15556 1.516198,0.6803 0.511011,0.65574 0.530154,0.97575 0.530154,8.86265 v 8.18235 l -0.592023,0.56139 c -0.86347,0.8188 -2.284098,0.76193 -2.970528,-0.11891 z m 54.510153,0.0827 c -0.54713,-0.58785 -0.55618,-0.73206 -0.55618,-8.86265 v -8.26507 l 0.59202,-0.5614 c 0.73595,-0.69786 1.96108,-0.728 2.76891,-0.0681 0.54812,0.44774 0.61155,0.72786 0.68695,3.03376 l 0.0831,2.54049 3.11435,3.19028 c 4.07019,4.16944 5.34837,4.77429 7.75664,3.67051 0.79637,-0.365 2.12567,-1.71691 5.32714,-5.41778 2.34628,-2.71228 4.479884,-5.04698 4.741334,-5.18821 0.64938,-0.3508 1.57058,-0.30899 2.09765,0.0952 0.63878,0.48986 0.99653,1.60994 0.73285,2.29448 -0.24993,0.64883 -7.756834,9.45961 -9.044044,10.6149 -1.48054,1.32881 -3.42459,2.07486 -5.42769,2.08294 -2.93036,0.0118 -4.18501,-0.57856 -6.93388,-3.26278 l -2.35779,-2.30234 -0.0863,2.95897 c -0.0721,2.46924 -0.167,3.04878 -0.57364,3.50167 -0.68547,0.76343 -2.18597,0.73525 -2.92135,-0.0549 z' />
</svg>
