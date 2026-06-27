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

import React, { MutableRefObject, useEffect, useLayoutEffect, useRef, useState } from 'react'

import Draggable, { DraggableProps } from 'react-draggable'

// react-draggable : les typings embarqués rendent les props optionnelles, mais
// @types/react-draggable (tiré par la résolution fraîche du CI) les rend requises.
// On relâche le type ici pour que le build passe quelle que soit la source des typings.
const DraggableComponent = Draggable as unknown as React.ComponentClass<Partial<DraggableProps>>

import {
  Box,
  Button,
  ButtonGroup,
  CloseButton,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  Text
} from '@chakra-ui/react'

import { ApplyLayoutDialog } from '../dialogs/SankeyMenuDialogs'
import {
  DrawerSequenceDataTagg, ToolBarBottom,
  ComponentMouseMode, ComponentPositionMode, ComponetStretchButtons
} from './MenuBottom'
import { useMainZone, mainZoneRightReservedPx } from '../spreadsheet/MainZoneTabs'
import { modalResolutionPNG, modalResolutionPDF } from './SankeyExports'
import { MenuTopNavBar } from './MenuTop'
import { IType_DictHookRefSetterShowDialogComponents, keyTypeConfig, keyTypeElements, Type_AdditionalMenus, TOOLS_COLUMN_WIDTH_PX } from '../../types/MenuConfig'
import { DrawingAreaConfig, LegendConfig, TitleConfig } from '../configmenus/SankeyMenuConfigurationLayout'
import { LinkValueTypeSelector, MenuConfigurationLinksData } from '../configmenus/SankeyMenuConfigurationLinksData'
import { SankeyContainerSelection, SankeyNodeSelection } from '../configmenus/MenuElementsSelection'
import { MenuConfigurationAppearance } from '../configmenus/MenuElementsAppearance'
import { WrapperContentConfig } from '../configmenus/MenuCommon'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { OSTooltip } from '../configmenus/MenuCommon'
import { UniversalFileConverter } from '../dialogs/PersistenceProcessDialog'
import { FormatConfigStructure, } from '../dialogs/PersistenceProcessDialogConfigs'
import { LabelRichTextEditor } from '../dialogs/RichTextEditor'
//import { MenuUnit } from '../configmenus/MenuElementsLabelValue'

export const menu_config_width = 20
export const menu_config_min_width_px = 420

/**
 * Description placeholder
 *
 * @param {{ data: any; set_data: any;right_menu: any; settings_edition: any; settings_edition_node_tags: any; settings_edition_link_tags: any; settings_edition_data_tags: any; ... 39 more ...; launch: any; }}
 *
 * @returns
 */
export const SankeyMenu = (
  {
    app_data,
    additionalMenus,
    input_config,
    output_config
  }: {
    app_data: Class_ApplicationData,
    additionalMenus: MutableRefObject<Type_AdditionalMenus>,
    input_config: FormatConfigStructure,
    output_config: FormatConfigStructure
  }
) => {
  const { t, icon_library, menu_configuration } = app_data
  const { icon_open_close_config } = icon_library
  const [show_nav, set_show_nav] = useState(false)
  const [, setCount] = useState(0)
  // Intention d'affichage de la zone principale (doc/tableur) mémorisée à l'ouverture de la config :
  // config et zone partagent la colonne droite -> ouvrir la config masque la zone ; on restaure
  // l'intention à la fermeture. null = rien à restaurer.
  const savedZoneRef = useRef<{ doc: boolean, spreadsheet: boolean } | null>(null)

  // Ouvre/ferme la config en gérant à la fois l'exclusivité avec la zone principale (doc/tableur)
  // et sa MÉMORISATION : à l'ouverture on sauvegarde l'état doc/tableur puis on les masque ; à la
  // fermeture on les rouvre. Centralise tous les chemins (bouton, Drawer onClose, raccourcis,
  // filtre) qui passent par ref_menu_opened.current[1], pour un comportement uniforme.
  const setConfigOpen = (open: boolean) => {
    if (open !== show_nav) {
      if (open) {
        // Panneau latéral droit unique : ouvrir la config ferme le filtre.
        menu_configuration.ref_close_filter_drawer.current(false)
        // Mémoriser l'état doc/tableur puis les masquer (colonne droite partagée) ; garder le diagramme.
        savedZoneRef.current = {
          doc: menu_configuration.main_zone_show_doc,
          spreadsheet: menu_configuration.main_zone_show_spreadsheet
        }
        menu_configuration.main_zone_show_spreadsheet = false
        menu_configuration.main_zone_show_doc = false
        menu_configuration.main_zone_show_diagram = true
      } else if (savedZoneRef.current) {
        // Restaurer l'intention doc/tableur mémorisée à l'ouverture.
        if (savedZoneRef.current.spreadsheet) menu_configuration.main_zone_show_spreadsheet = true
        if (savedZoneRef.current.doc) menu_configuration.main_zone_show_doc = true
        savedZoneRef.current = null
      }
    }
    set_show_nav(open)
  }

  menu_configuration.ref_to_menu_updater.current = () => setCount(a => a + 1)
  menu_configuration.ref_menu_opened.current = [show_nav, setConfigOpen]

  // getNavBarHeight() lit le DOM via getBoundingClientRect sur .TopMenu, qui
  // n'existe pas encore au tout premier render -> fallback (~5rem) trop bas.
  // Force un re-render apres mount (et re-mesure le navbar si sa taille change)
  // pour que le bouton orange et le drawer aient le bon top immediatement.
  useLayoutEffect(() => {
    setCount(a => a + 1)
    const navbar = document.getElementsByClassName('TopMenu')[0]
    if (!navbar || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setCount(a => a + 1))
    ro.observe(navbar)
    return () => ro.disconnect()
  }, [])
  // Largeur réservée à droite par le tableur (split) : on décale tout le chrome droite vers la
  // gauche d'autant, comme si l'écran rétrécissait. useMainZone -> re-render au toggle/redimension.
  useMainZone(app_data)
  const rightReserve = mainZoneRightReservedPx(app_data)
  const drawer_width_css = 'max(' + menu_config_width + '%, ' + menu_config_min_width_px + 'px)'
  const posBtnOpenConfig = menu_configuration.ref_menu_opened.current[0]
    ? 'calc(' + drawer_width_css + ' + ' + (app_data.drawing_area.fit_margin + rightReserve) + 'px)'
    : (app_data.drawing_area.fit_margin + rightReserve)
  //Switch the variable value that handle opening and closing the configuration menu
  const toggleShow = () => setConfigOpen(!show_nav)

  // Aligned with the floating config toggle button (same top as the wrench).
  // The legacy +1.75rem offset was for the now-removed file_name Editable.
  const posTopMenuConfig = app_data.drawing_area.getNavBarHeight() + app_data.drawing_area.fit_margin

  // Colonne d'outils rétractable (éditeur uniquement). On déclare sa disponibilité ici (à chaque
  // rendu) pour que la réserve de largeur droite (getToolsColumnWidthPx) soit nulle en publish.
  menu_configuration.tools_column_enabled = !app_data.is_static

  // Panneau de config docké : quand ouvert, sa largeur est réservée par le diagramme
  // (cf. DrawingArea.side_panel_reserved) → il dock à droite au lieu de recouvrir la zone de dessin.
  menu_configuration.side_panel_config_open = !app_data.is_static && show_nav
  // Re-fit du diagramme à l'ouverture/fermeture du panneau de config (la largeur réservée change).
  const sidePanelDidMount = useRef(false)
  useEffect(() => {
    if (!sidePanelDidMount.current) { sidePanelDidMount.current = true; return }
    app_data.drawing_area.areaAutoFit()
    app_data.draw()
  }, [show_nav])
  // Rafraîchit la colonne sur les changements externes de modes (ex. switchMode au clavier) qui
  // appelaient l'updater de l'ancienne ToolBarBottom flottante.
  const refreshToolsColumn = () => setCount(a => a + 1)
  if (!app_data.is_static) {
    menu_configuration.ref_to_toolbar_bottom_updater.current = refreshToolsColumn
  }

  // Barre verticale d'outils rétractable, ancrée à l'extrême droite. Outils du CANVAS uniquement :
  // ouverture des panneaux (config, filtres) + modes souris / position / ajustement (ex-ToolBarBottom
  // flottante). Tout le cluster est collé EN BAS (marginTop auto). Les actions document (undo/redo/save)
  // et le plein écran vivent désormais dans la barre du haut. Sa largeur est réservée par le diagramme
  // via getToolsColumnWidthPx (cf. MainZoneTabs).
  const tools_column = !app_data.is_static ? (
    <Box
      className='tools_column'
      position='fixed'
      right='0'
      top={app_data.drawing_area.getNavBarHeight() + 'px'}
      bottom={app_data.drawing_area.getBottomBarHeight() + 'px'}
      width={TOOLS_COLUMN_WIDTH_PX + 'px'}
      zIndex={35}
      bg='white'
      borderLeft='1px solid #e2e8f0'
      display={menu_configuration.tools_column_open ? 'flex' : 'none'}
      flexDirection='column'
      alignItems='center'
      gap='0.3rem'
      paddingY='0.3rem'
      overflowY='auto'
      overflowX='hidden'
    >
      {/* Sélecteur d'éléments à configurer (Flow/Node/Areas) — CONTEXTUEL : visible seulement quand
          le panneau de config est ouvert. Ancré EN HAUT de la colonne, aligné avec le panneau de
          config (ce sont des éléments « quoi configurer », distincts des outils canvas du bas) ; le
          marginTop:auto du cluster ci-dessous crée volontairement un espace entre les deux.
          extra_updater rafraîchit la colonne (surlignage) en plus du contenu du panneau. */}
      {show_nav ? (
        <ConfigMenuElementToConfig
          app_data={app_data}
          additional_menus={additionalMenus}
          extra_updater={refreshToolsColumn}
        />
      ) : <></>}
      {/* Cluster collé en bas (marginTop auto) : panneaux (config/filtre) + outils canvas. */}
      <Box
        marginTop='auto'
        display='flex'
        flexDirection='column'
        alignItems='center'
        gap='0.3rem'
      >
        {/* Configuration (roue crantée). */}
        <OSTooltip
          placement='left'
          label={t('Banner.open_configuration_menu')}
          isAlwaysOpen={app_data.menu_configuration.show_splashscreen}
        >
          <Button
            id='toggle-check'
            variant='toolbar_button_open_filter'
            size='sizeToolbarButton'
            // Le variant impose position:fixed (ancien bouton flottant) : on le ramène dans le flux de
            // la colonne pour qu'il ne flotte plus par-dessus le diagramme.
            position='relative'
            bg={show_nav ? 'tertiaire.1' : 'primaire.1'}
            borderColor='secondaire.1'
            _hover={{ bg: 'tertiaire.1', borderColor: 'secondaire.1' }}
            _active={{ bg: 'tertiaire.1', borderColor: 'secondaire.1' }}
            onClick={toggleShow}
          >
            {icon_open_close_config}
          </Button>
        </OSTooltip>
        {/* Filtres : pilote le drawer de ToolbarFilter via ref (le bouton flottant est masqué en éditeur). */}
        {menu_configuration.filter_bar_available ? <OSTooltip placement='left' label={t('Banner.fdn')}>
          <Button
            id='buttonOpenFilterDrawerTools'
            variant='toolbar_button_open_filter'
            size='sizeToolbarButton'
            position='relative'
            onClick={() => menu_configuration.ref_toggle_filter_drawer.current()}
          >
            {icon_library.icon_filter_tags}
          </Button>
        </OSTooltip> : <></>}
        <Divider />
        <ComponentMouseMode app_data={app_data} updateParentComponent={refreshToolsColumn} />
        <ComponentPositionMode app_data={app_data} updateParentComponent={refreshToolsColumn} />
        {/* hide_fullscreen : le plein écran est dans la barre du haut en éditeur. */}
        <ComponetStretchButtons app_data={app_data} updateParentComponent={refreshToolsColumn} hide_fullscreen />
      </Box>
    </Box>
  ) : <></>

  // JSX.Elements for the component ----------------------------------------------------------------

  const modal_resolution_png = modalResolutionPNG(app_data)
  const modal_resolution_pdf = modalResolutionPDF(app_data)

  const content_support = <>
    <Text
      fontStyle='h3'
    >
      {t('Menu.rth_support')}:
    </Text>
    <Text
      fontStyle='h4'
    >
      {t('Menu.support_explication').split('[]')[0]}
      <a href='mailto:support@terriflux.fr	'>support@terriflux.fr</a>
      {t('Menu.support_explication').split('[]')[1]}
    </Text>
  </>


  const modal_support = <MenuDraggable
    dict_hook_ref_setter_show_dialog_components={app_data.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_modal_support'}
    content={content_support}
    title={t('Menu.c_support')}
  />


  // Save-in-cache button lives in the topbar document-state block
  // (TopBarStateButtons in MenuTop). file_name Editable removed entirely.

  return (
    <>
      {/* Top Navbar with navigation and edition elements */}
      {(!app_data.is_static || app_data.publish_options.topbar) ?
        <MenuTopNavBar new_data={app_data} additionalMenus={additionalMenus} /> : <></>}

      {/* Bottom Navbar — kept only for the data-tag sequence drawer (visible
          when sequence groups exist). Footer with version/support/trial info
          has been moved to the topbar (see MenuTopNavBar). */}
      {
        <Box
          className='BottomMenu'
          zIndex='1'
          position='fixed'
          bottom='0'
          layerStyle='menubottom_layout_style'
        >
          <DrawerSequenceDataTagg new_data={app_data} />
        </Box>
      }

      {
        app_data.is_editable ? <>
          <Drawer
            blockScrollOnMount={false}
            isOpen={show_nav}
            placement='right'
            onClose={() => setConfigOpen(false)}
            onEsc={() => {
              // Override drawer onEscape() to use Class_applicationData 'escape' keyEvent & not the one by default from the <Drawer> component
              const ev = document
              const tmp = new KeyboardEvent('keydown', { key: 'Escape' })
              if (ev.onkeydown) {
                ev.onkeydown(tmp as KeyboardEvent)
              }
            }}
            variant='drawer_menu_config'
            id='drawer_config'
            trapFocus={false}
          >
            {/* We have to set the width of the component here (and not in the theme)
            because for some reason a style is directly applied to this component
            and we cannot override it in the theme */}
            <DrawerContent
              className='drawer_menu_config'
              style={{
                width: drawer_width_css,
                height: 'fit-content',
                right: app_data.drawing_area.fit_margin / 2 + rightReserve,
                marginTop: posTopMenuConfig
              }}
            >
              <DrawerBody style={{ overflowX: 'auto' }}>
                <ConfigMenu
                  app_data={app_data}
                  additional_menus={additionalMenus}
                />
              </DrawerBody>
            </DrawerContent>
          </Drawer></> :
          <></>}


      {/* Bouton config flottant conservé UNIQUEMENT en publish-éditable (static + editable) ; en
          éditeur normal il vit dans la colonne d'outils rétractable (cf. tools_column ci-dessous). */}
      {app_data.is_static && app_data.is_editable ? (
        <OSTooltip
          placement='left'
          label={t('Banner.open_configuration_menu')}
          isAlwaysOpen={app_data.menu_configuration.show_splashscreen}
        >
          <Button
            id='toggle-check'
            className='openMenu sideToolBar'
            variant='toolbar_button_open_filter'
            size='sizeToolbarButton'
            bg='primaire.1'
            borderColor='secondaire.1'
            _hover={{ bg: 'tertiaire.1', borderColor: 'secondaire.1' }}
            _active={{ bg: 'tertiaire.1', borderColor: 'secondaire.1' }}
            onClick={toggleShow}
            value='menuConfigButton'
            // Au-dessus de l'overlay tableur (zIndex 20) pour rester accessible en mode split/tableur.
            zIndex={30}
            style={{
              right: posBtnOpenConfig,
              top: app_data.drawing_area.getNavBarHeight() + app_data.drawing_area.fit_margin,
            }}
          >
            {icon_open_close_config}
          </Button>
        </OSTooltip>
      ) : (<></>)}


      {/* Barre verticale flottante conservée UNIQUEMENT en publish/statique ; en éditeur ses groupes
          sont rendus dans la colonne d'outils rétractable (tools_column). */}
      {(app_data.is_static && (app_data.publish_options.toolbar || app_data.publish_options.fit_toolbar || app_data.publish_options.fullscreen)) ? <ToolBarBottom
        new_data={app_data}
        right_offset={app_data.drawing_area.fit_margin + rightReserve}
      /> : <></>}

      {tools_column}

      {/* {
        processFunction.ref_processing.current ? (
          <Toast >
            <Button className='btn btn-sm btn-warning col-md-12'>
              <span className='glyphicon glyphicon-refresh glyphicon-refresh-animate'></span> Processing...
            </Button></Toast>) : (<></>)
      } */}
      <ApplyLayoutDialog
        new_data={app_data}
      />

      <UniversalFileConverter
        app_data={app_data}
        dialog_name={'ref_setter_show_modal_file_converter'}
        input_config={input_config}
        output_config={output_config}
      />
      <LabelRichTextEditor
        app_data={app_data}
      />
      <MenuDraggable
        dict_hook_ref_setter_show_dialog_components={app_data.menu_configuration.dict_setter_show_dialog}
        dialog_name={'ref_setter_show_value_type_editor'}
        content={<LinkValueTypeSelector app_data={app_data} t={t}/>}
        title={'Type de valeur'}
        minW={'25vw'}
        maxW={'25vw'}
      />

      {modal_support}
      {modal_resolution_png}
      {modal_resolution_pdf}
    </>
  )
}

const ConfigMenu = ({ app_data, additional_menus }: {
  app_data: Class_ApplicationData,
  additional_menus: MutableRefObject<Type_AdditionalMenus>,
}) => {
  const { type_menu_configuration_selected, style_config } = app_data.menu_configuration
  const [, setUpdate] = useState(false)

  app_data.menu_configuration.ref_to_menu_config_updater.current = () => setUpdate(a => !a)

  const sizeBtn = document.getElementsByClassName('buttonGroupTypeConfig')[0]?.getBoundingClientRect().height ?? 30
  // Hauteur bornée à l'espace écran restant (panneau ancré).
  const maxHConfig = 'calc(' + (window.innerHeight - (app_data.drawing_area.getNavBarHeight() + app_data.drawing_area.getBottomBarHeight() + sizeBtn + (app_data.drawing_area.fit_margin * 2))) + 'px - 0.8rem)'

  return <Box layerStyle='config_menu_layout' style={{
    background: (style_config[type_menu_configuration_selected].theme),
    height: '100%',
    gridTemplateRows: 'auto 1fr auto',
    alignContent: 'start'
  }}>
    <Box layerStyle='type_config_box' style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
      <ConfigMenuTypeConfig app_data={app_data} additional_menus={additional_menus} />
    </Box>
    <Box
      className='config_box'
      layerStyle='config_box'
      style={{
        maxHeight: maxHConfig,
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
      onMouseDownCapture={() => {
        // Auto-exit edition mode as soon as the user interacts with the configuration menu
        if (app_data.drawing_area.isInEditionMode()) {
          app_data.drawing_area.switchMode()
        }
      }}
    >
      <ConfigContent app_data={app_data} additional_menus={additional_menus} />
    </Box>
    {/* Sélecteur d'éléments : en éditeur il est rendu dans la colonne d'outils (contextuel) ; on ne le
        garde dans le panneau qu'en publish/statique (pas de colonne d'outils là). */}
    {app_data.is_static ? <Box layerStyle='element_box'>
      <ConfigMenuElementToConfig app_data={app_data} additional_menus={additional_menus} />
    </Box> : <></>}
  </Box>
}

/**
 * Buttons to choose what kind of configuration we want the menu to be.
 * For each kind of menu there is a set of configurable elements (node, flow, drawing area, ...)
 *
 * @param {*} { app_data, additional_menus }
 * @return {*}
 */
const ConfigMenuTypeConfig = ({ app_data, additional_menus }: {
  app_data: Class_ApplicationData,
  additional_menus: MutableRefObject<Type_AdditionalMenus>
}) => {
  const { t } = app_data
  const { type_menu_configuration_selected, ref_to_menu_config_updater } = app_data.menu_configuration
  // Changer de type (Data / Formatting / Présentation) : rafraîchir le panneau ET la colonne d'outils.
  // Le sélecteur d'éléments est rendu dans la colonne (contextuel) et ses boutons dépendent du type ;
  // sans ce second updater, la colonne afficherait les éléments de l'ancien type.
  const selectType = (key: keyTypeConfig) => {
    app_data.menu_configuration.type_menu_configuration_selected = key
    ref_to_menu_config_updater.current()
    app_data.menu_configuration.ref_to_menu_updater.current()
  }
  return <ButtonGroup className='buttonGroupTypeConfig' spacing='0.2rem' style={{
    border: '2px solid lightblue',
    borderRadius: '4px',
    background: 'white',
    width: '100%'
  }} >
    <Button
      className='button_type_config_data'
      variant={type_menu_configuration_selected == 'data' ? 'button_type_config_activated' : 'button_type_config'}
      onClick={() => selectType('data')}
    >
      {t('Menu.Config.type_data')}
    </Button>

    <Button
      className='button_type_config_style'
      variant={type_menu_configuration_selected == 'style' ? 'button_type_config_activated' : 'button_type_config'}
      onClick={() => selectType('style')}
    >
      {t('Menu.Config.type_style')}
    </Button>
    {/* <Button variant={type_menu_configuration_selected == 'context' ? 'button_type_config_activated' : 'button_type_config'}
      onClick={() => {
        app_data.menu_configuration.type_menu_configuration_selected = 'context'
        ref_to_menu_config_updater.current()
      }}
    >
      {t('Menu.Config.type_context')}
    </Button> */}
    {Object.entries(additional_menus.current.additional_menu_type).map((el, id) => {
      const keyType = el[0] as keyTypeConfig
      return <Button key={'additional_type_config_' + id} variant={type_menu_configuration_selected == keyType ? 'button_type_config_activated' : 'button_type_config'}
        onClick={() => selectType(keyType)}
      >
        {t('Menu.Config.' + el[1])}
      </Button>
    })}
  </ButtonGroup>
}


/**
 * Return the content of displayed sub menus from a type of configuration
 *
 * @param {*} { app_data, additional_menus }
 * @return {*}
 */
const ConfigContent = ({ app_data, additional_menus }:
  { app_data: Class_ApplicationData, additional_menus: MutableRefObject<Type_AdditionalMenus> }) => {
  const { t } = app_data
  const { type_menu_configuration_selected, elements_configurable_selected } = app_data.menu_configuration
  const elements_in_menu_configuration = elements_configurable_selected[type_menu_configuration_selected]

  const dict_config_windows: { [x: string]: { [x: string]: JSX.Element } } = {
    // Menus related to data config
    data: {
      // Le tableur (ex-reactgrid) a migré dans la grande zone (onglet "Tableur" de MainZoneTabs) ;
      // il n'est plus exposé dans le panneau de config.
      node: <WrapperContentConfig title={t('Menu.Config.title_node')}>
        <SankeyNodeSelection app_data={app_data} />
      </WrapperContentConfig>,

      flow: <WrapperContentConfig title={t('Menu.Config.title_flow')} >
        <MenuConfigurationLinksData app_data={app_data} />
      </WrapperContentConfig>,

      object: <WrapperContentConfig title={t('Menu.Config.element_object')}>
        <SankeyContainerSelection app_data={app_data} />
      </WrapperContentConfig>,
    },
    style: {
      DA: <WrapperContentConfig title={t('Menu.Config.title_graph')}>
        <>
          <DrawingAreaConfig
            app_data={app_data}
            extra_background_element={additional_menus.current.extra_background_element}
          />
        </>
      </WrapperContentConfig>,
      legend: <WrapperContentConfig title={t('Menu.Config.title_legend')}>
        <>
          <LegendConfig app_data={app_data} />
          <TitleConfig app_data={app_data} />
        </>
      </WrapperContentConfig>,
      element: <WrapperContentConfig title={t('Menu.Config.title_elements')}>
        <MenuConfigurationAppearance app_data={app_data} menu_for_style={false} />
      </WrapperContentConfig>,
    },

    presentation: {
      ...additional_menus.current.additional_new_menu_config_content.presentation
    }
  }
  const content_empty_config = elements_in_menu_configuration.length == 0 ?
    <>
      <Box layerStyle='empty_config_text' textStyle='h2'><span>{t('Menu.empty_config')}</span> </Box>
    </>
    : <></>
  return <>
    {content_empty_config}
    {elements_in_menu_configuration.map((el, i) => {
      return <React.Fragment key={'content_config_' + i}>{dict_config_windows[type_menu_configuration_selected][el]}</React.Fragment>
    })}
  </>
}


export type typeButtonElementConfigurable = { [x: string]: { text: string, icon: JSX.Element, disabled: boolean } }

/**
 * Component for selecting which configurable elements sub menu we want to display in <ConfigContent />
 *
 * @param {*} { app_data }
 * @return {*}
 */
const ConfigMenuElementToConfig = ({ app_data, additional_menus, extra_updater }:
  { app_data: Class_ApplicationData, additional_menus: MutableRefObject<Type_AdditionalMenus>, extra_updater?: () => void }) => {
  const { t } = app_data
  const { type_menu_configuration_selected, style_config, ref_to_menu_config_updater } = app_data.menu_configuration
  const elements_buttons = style_config[type_menu_configuration_selected].elements_configurable

  const dict_buttons_element_to_config: typeButtonElementConfigurable = {
    'element': { icon: app_data.icon_library.icon_object, text: t('Menu.Config.element_element'), disabled: false },
    'object': { icon: app_data.icon_library.icon_object, text: t('Menu.Config.element_object0'), disabled: false },
    'flow': { icon: app_data.icon_library.icon_flow, text: t('Menu.Config.element_flow'), disabled: false },
    'DA': { icon: app_data.icon_library.icon_graph, text: t('Menu.Config.element_graph'), disabled: false },
    'legend': { icon: app_data.icon_library.icon_graph, text: t('Menu.Config.element_legend'), disabled: false },
    'node': { icon: app_data.icon_library.icon_node, text: t('Menu.Config.element_node'), disabled: false },
    'data': { icon: app_data.icon_library.icon_tableau, text: t('Menu.Config.element_data'), disabled: false },

    ...additional_menus.current.additional_menu_button_element_configurable
  }

  return <ButtonGroup spacing='0.2rem' orientation='vertical' style={{
    border: 'none',
    borderRadius: '4px',
    background: 'white',
    width: '2.7rem',
    padding: '0.1rem',
  }}>
    {
      elements_buttons.filter(el => el in dict_buttons_element_to_config).map((el, i) => {
        const element_typed = el as keyTypeElements
        const activated = app_data.menu_configuration.elements_configurable_selected[type_menu_configuration_selected].includes(element_typed)
        return <Button
          key={'btn_element_' + i}
          isDisabled={dict_buttons_element_to_config[el].disabled}
          variant={activated ? 'button_config_element_activated' : 'button_config_element'}
          onClick={() => {
            app_data.menu_configuration.toggleElementInConfigEdition(type_menu_configuration_selected, element_typed)
            ref_to_menu_config_updater.current()
            extra_updater?.()
          }}
        >
          {dict_buttons_element_to_config[el].icon}
          <Box
            style={{ fontSize: '0.5rem'}}
            as='span'
            padding='0rem 0.0rem 0rem 0.0rem'
          >
            {dict_buttons_element_to_config[el].text}
          </Box>
        </Button>
      })
    }
  </ButtonGroup>
}

/**
 *
 *
 * @param {*} {
 *   dict_hook_ref_setter_show_dialog_components,
 *   dialog_name,
 *   content,
 *   title }
 * @return {*}
 */
export const MenuDraggable = ({
  dict_hook_ref_setter_show_dialog_components,
  dialog_name,
  content,
  title,
  minW = '10vw',
  maxW = '40vw',
  customPos,
}: {
  dict_hook_ref_setter_show_dialog_components: IType_DictHookRefSetterShowDialogComponents,
  dialog_name: keyof IType_DictHookRefSetterShowDialogComponents,
  content: JSX.Element | JSX.Element[],
  title: string,
  maxW?: string,
  minW?: string,
  customPos?: { x: number, y: number }
}
) => {
  const [display_menu, set_display_menu] = useState(false)
  const nodeRef = useRef(null) // nodeRef as node from DOM (not Sankey node)
  dict_hook_ref_setter_show_dialog_components[dialog_name].current = set_display_menu
  return <DraggableComponent
    nodeRef={nodeRef}
    handle='.title_menu'
    defaultPosition={customPos !== undefined ? customPos : { x: window.innerWidth / 4, y: window.innerHeight / 4 }}
    bounds={{ left: 0, top: 0 }}
  >
    <Box
      ref={nodeRef}
      layerStyle='menu_draggable_layout'
      hidden={!display_menu}
      position='absolute'
      minW={minW}
      maxW={maxW}
      zIndex='40'
    >
      <Box
        className='title_menu'
        layerStyle='menu_draggable_title_layout'
      >
        <Text
          justifySelf='start'
          fontStyle='h1'
          margin='0'
        >
          {title}
        </Text>
        <CloseButton
          justifySelf='end'
          onClick={() => { set_display_menu(false) }}
        />
      </Box>
      <Box layerStyle='menu_draggable_content_layout'>
        {content}
      </Box>
    </Box>
  </DraggableComponent>
}