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

import React, { MutableRefObject, useLayoutEffect, useRef, useState } from 'react'

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
import { TemplateGalleryPanel } from './SankeyTemplates'
import { IType_DictHookRefSetterShowDialogComponents, keyTypeConfig, keyTypeElements, Type_AdditionalMenus, TOOLS_COLUMN_WIDTH_PX, MENU_CONFIG_WIDTH_PCT, MENU_CONFIG_MIN_WIDTH_PX } from '../../types/MenuConfig'
import { DrawingAreaConfig, LegendConfig, TitleConfig } from '../configmenus/SankeyMenuConfigurationLayout'
import { LinkValueTypeSelector, MenuConfigurationLinksData } from '../configmenus/SankeyMenuConfigurationLinksData'
import { SankeyContainerSelection, SankeyNodeSelection } from '../configmenus/MenuElementsSelection'
import { MenuConfigurationAppearance } from '../configmenus/MenuElementsAppearance'
import { WrapperContentConfig } from '../configmenus/MenuCommon'
import { InspectorPanel } from '../configmenus/inspector/InspectorPanel'
import { default_font_size } from '../../css/Theme'
import { useModelBinding } from '../../hooks/useModelBinding'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { OSTooltip } from '../configmenus/MenuCommon'
import { UniversalFileConverter } from '../dialogs/PersistenceProcessDialog'
import { FormatConfigStructure, } from '../dialogs/PersistenceProcessDialogConfigs'
import { LabelRichTextEditor, TooltipRichTextEditor } from '../dialogs/RichTextEditor'
//import { MenuUnit } from '../configmenus/MenuElementsLabelValue'

// #1243 — source de vérité déplacée dans MenuConfig (le mode épinglé calcule
// sa réserve de largeur côté modèle) ; réexport pour compatibilité.
export const menu_config_width = MENU_CONFIG_WIDTH_PCT
export const menu_config_min_width_px = MENU_CONFIG_MIN_WIDTH_PX

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
  // #247 — re-render piloté par le modèle : slot du menu, + slot de la colonne d'outils quand
  // elle est affichée (mode édition). Cleanup des deux au démontage.
  const refreshThis = useModelBinding(
    app_data.is_static
      ? [menu_configuration.ref_to_menu_updater]
      : [menu_configuration.ref_to_menu_updater, menu_configuration.ref_to_toolbar_bottom_updater]
  )

  // Ouvre/ferme la config. Le panneau est un OVERLAY au-dessus de toute la grande zone
  // (diagramme, tableur, doc…) : il ne touche PAS à l'état doc/tableur ni au cadrage.
  // Seule exclusivité conservée : le panneau de filtres (même emplacement à droite).
  // Centralise tous les chemins (bouton, Drawer onClose, raccourcis, filtre) qui passent
  // par ref_menu_opened.current[1], pour un comportement uniforme.
  const setConfigOpen = (open: boolean) => {
    // #1243 — l'exclusivité config/filtres n'existait que parce que les deux
    // sont des overlays au MÊME coin. Épinglé, le panneau est docké et réserve
    // sa largeur : le tiroir de filtres se place à sa gauche, les deux
    // cohabitent (indispensable à « Filtres > Sélectionner » qui alimente
    // l'inspecteur — sinon on sélectionne à l'aveugle).
    if (open && open !== show_nav && !menu_configuration.config_panel_pinned) {
      menu_configuration.ref_close_filter_drawer.current(false)
    }
    set_show_nav(open)
    // #1243 — en mode épinglé, ouvrir/fermer change la RÉSERVE de largeur :
    // pose l'état tout de suite (le render l'écrasera à l'identique) puis
    // notifie la grande zone pour que le diagramme se recadre.
    if (menu_configuration.config_panel_pinned) {
      menu_configuration.ref_menu_opened.current = [open, setConfigOpen]
      menu_configuration.notifyMainZone()
    }
  }

  menu_configuration.ref_menu_opened.current = [show_nav, setConfigOpen]

  // getNavBarHeight() lit le DOM via getBoundingClientRect sur .TopMenu, qui
  // n'existe pas encore au tout premier render -> fallback (~5rem) trop bas.
  // Force un re-render apres mount (et re-mesure le navbar si sa taille change)
  // pour que le bouton orange et le drawer aient le bon top immediatement.
  useLayoutEffect(() => {
    refreshThis()
    const navbar = document.getElementsByClassName('TopMenu')[0]
    if (!navbar || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => refreshThis())
    ro.observe(navbar)
    return () => ro.disconnect()
  }, [])
  // Largeur réservée à droite par le tableur (split) : on décale le chrome droite (bouton config
  // flottant publish, toolbar publish) vers la gauche d'autant, comme si l'écran rétrécissait.
  // useMainZone -> re-render au toggle/redimension.
  useMainZone(app_data)
  const rightReserve = mainZoneRightReservedPx(app_data)
  // Le PANNEAU de config, lui, est un overlay au-dessus de TOUTE la grande zone (tableur/doc
  // compris, zIndex 30 > panneaux 20-25) : il ne s'écarte que de la colonne d'outils (zIndex 35,
  // extrême droite), pas des réserves tableur/doc.
  const toolsReserve = menu_configuration.getToolsColumnWidthPx()
  const drawer_width_css = 'max(' + menu_config_width + '%, ' + menu_config_min_width_px + 'px)'
  const posBtnOpenConfig = menu_configuration.ref_menu_opened.current[0]
    ? 'calc(' + drawer_width_css + ' + ' + (app_data.drawing_area.fit_margin + toolsReserve) + 'px)'
    : (app_data.drawing_area.fit_margin + rightReserve)
  //Switch the variable value that handle opening and closing the configuration menu
  const toggleShow = () => setConfigOpen(!show_nav)

  // Aligned with the floating config toggle button (same top as the wrench).
  // The legacy +1.75rem offset was for the now-removed file_name Editable.
  const posTopMenuConfig = app_data.drawing_area.getNavBarHeight() + app_data.drawing_area.fit_margin

  // Colonne d'outils rétractable (éditeur uniquement). On déclare sa disponibilité ici (à chaque
  // rendu) pour que la réserve de largeur droite (getToolsColumnWidthPx) soit nulle en publish.
  menu_configuration.tools_column_enabled = !app_data.is_static

  // Panneau de config en OVERLAY : il flotte par-dessus la zone de dessin (comme en publish),
  // sans réserver de largeur ni re-fitter le diagramme — ouvrir/fermer la config ne doit
  // jamais faire bouger le dessin. Idem pour le panneau de filtres (cf. Toolbar).
  // Rafraîchit la colonne sur les changements externes de modes (ex. switchMode au clavier) qui
  // appelaient l'updater de l'ancienne ToolBarBottom flottante.
  const refreshToolsColumn = refreshThis

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
      {/* #1243 — en mode inspecteur (dev), l'axe « élément » est porté par la
          sélection : le sélecteur n'a plus de rôle et disparaît de la colonne. */}
      {show_nav && !app_data.has_sankey_dev ? (
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

      {/* #1243 — mode ÉPINGLÉ : le panneau se docke à droite (comme le tableur)
          et réserve sa largeur — la zone de dessin se recadre à gauche. Pour
          l'édition intense ; le mode survol (Drawer overlay) reste le défaut. */}
      {app_data.is_editable && menu_configuration.config_panel_pinned && show_nav ? (
        <Box
          className='config_panel_pinned'
          position='fixed'
          right={toolsReserve + 'px'}
          top={app_data.drawing_area.getNavBarHeight() + 'px'}
          bottom={app_data.drawing_area.getBottomBarHeight() + 'px'}
          width={drawer_width_css}
          zIndex={26}
          bg='white'
          borderLeft='1px solid #e2e8f0'
          overflowY='auto'
          overflowX='hidden'
          padding='0.2rem'
        >
          <ConfigMenu
            app_data={app_data}
            additional_menus={additionalMenus}
          />
        </Box>
      ) : <></>}

      {
        app_data.is_editable && !menu_configuration.config_panel_pinned ? <>
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
                right: app_data.drawing_area.fit_margin / 2 + toolsReserve,
                marginTop: posTopMenuConfig,
                // Panneau en overlay au-dessus du dessin : ombre portée pour le détacher visuellement
                // (le variant du thème met boxShadow:unset, hérité de l'époque panneau docké).
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                borderRadius: '4px'
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

      {/* Galerie de modèles à l'arrivée (diagramme vide) : vitrine pour le nouveau
          visiteur, s'efface dès qu'il travaille (cf. TemplateGalleryPanel). */}
      {(!app_data.is_static && app_data.is_editable) ? (
        <TemplateGalleryPanel
          new_data={app_data}
          additionalMenu={additionalMenus}
        />
      ) : <></>}

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
      {/* #1243 — éditeur d'infobulle : le MÊME Rich Text Editor que les
          libellés, pointé sur tooltip_text, en panneau draggable. L'onglet
          Infobulle de l'inspecteur n'embarque qu'un texte simple + le bouton. */}
      <TooltipRichTextEditor app_data={app_data} />

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
  // #247 — re-render piloté par le modèle (lie le slot updater + cleanup au démontage).
  useModelBinding(app_data.menu_configuration.ref_to_menu_config_updater)

  const sizeBtn = document.getElementsByClassName('buttonGroupTypeConfig')[0]?.getBoundingClientRect().height ?? 30
  // Hauteur bornée à l'espace écran restant (panneau ancré).
  const maxHConfig = 'calc(' + (window.innerHeight - (app_data.drawing_area.getNavBarHeight() + app_data.drawing_area.getBottomBarHeight() + sizeBtn + (app_data.drawing_area.fit_margin * 2))) + 'px - 0.8rem)'

  // #1243 — Bascule dev : l'inspecteur piloté par la sélection remplace la matrice
  // type×élément. Gardé derrière has_sankey_dev le temps de valider l'ergonomie
  // (prototype Nœud + Vue) avant de basculer par défaut et déposer la matrice.
  // PAS de layerStyle 'config_menu_layout' ici : cette grille réserve une colonne
  // « sidebar » (8fr 1fr) pour le sélecteur d'éléments et un fond thémé par type —
  // deux concepts que l'inspecteur supprime (bande vide + fond bleu sinon).
  if (app_data.has_sankey_dev) {
    return <Box style={{
      background: 'white',
      borderRadius: '5px',
      padding: '0.4rem',
      height: '100%',
      fontSize: default_font_size,
      color: '#444'
    }}>
      <Box
        style={{ maxHeight: maxHConfig, overflowY: 'auto', overflowX: 'hidden' }}
        onMouseDownCapture={() => {
          if (app_data.drawing_area.isInEditionMode()) {
            app_data.drawing_area.switchMode()
          }
        }}
      >
        <InspectorPanel app_data={app_data} />
      </Box>
    </Box>
  }

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