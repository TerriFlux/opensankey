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
  CloseButton,
  Divider,
  Text
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'

import { ApplyLayoutDialog } from '../dialogs/SankeyMenuDialogs'
import {
  DrawerSequenceDataTagg, ToolBarBottom,
  ComponentMouseMode, ComponentPositionMode, ComponetStretchButtons, ComponentZoomControl
} from './MenuBottom'
import { useMainZone, mainZoneRightReservedPx } from '../spreadsheet/MainZoneTabs'
import { modalResolutionPNG, modalResolutionPDF } from './SankeyExports'
import { MenuTopNavBar } from './MenuTop'
import { TemplateGalleryPanel } from './SankeyTemplates'
import { IType_DictHookRefSetterShowDialogComponents, Type_AdditionalMenus, TOOLS_COLUMN_WIDTH_PX, MENU_CONFIG_WIDTH_PCT, MENU_CONFIG_MIN_WIDTH_PX } from '../../types/MenuConfig'
import { LinkValueTypeSelector } from '../configmenus/SankeyMenuConfigurationLinksData'
import { InspectorPanel } from '../configmenus/inspector/InspectorPanel'
import { PanelShell } from '../panels/PanelShell'
import { PANELS_TOPIC } from '../../types/EventBus'
import { default_font_size } from '../../css/Theme'
import { useModelBinding } from '../../hooks/useModelBinding'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { OSTooltip } from '../configmenus/MenuCommon'
import { UniversalFileConverter } from '../dialogs/PersistenceProcessDialog'
import { FormatConfigStructure, } from '../dialogs/PersistenceProcessDialogConfigs'
import { LabelRichTextEditor, TooltipRichTextEditor } from '../dialogs/RichTextEditor'
import { UnitsEditorDialog } from '../dialogs/UnitsEditor'
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
  // #247 — re-render piloté par le modèle : slot du menu, + slot de la colonne d'outils quand
  // elle est affichée (mode édition). Cleanup des deux au démontage.
  const refreshThis = useModelBinding(
    app_data.is_static
      ? [menu_configuration.ref_to_menu_updater]
      : [menu_configuration.ref_to_menu_updater, menu_configuration.ref_to_toolbar_bottom_updater]
  )
  // OS#300 — re-render quand un panneau change (ouverture/fermeture/mode) : la
  // config est un « panneau » piloté par le modèle, plus un useState local.
  useModelBinding(undefined, (r) => menu_configuration.subscribe(PANELS_TOPIC, r))
  // Ouverture de la config = présence du panneau 'config' dans le modèle.
  const show_nav = menu_configuration.panels.isOpen('config')

  // Ouvre/ferme la config (panneau unifié 'config'). Centralise tous les chemins
  // (bouton, raccourcis, ouverture auto depuis le canvas) qui passent par
  // ref_menu_opened.current[1], pour un comportement uniforme. Aucune exclusivité
  // manuelle avec les autres menus : seule la barre latérale est exclusive (gérée
  // par panels) ; les pop-ups/info-bulles se superposent.
  const setConfigOpen = (open: boolean) => {
    // OS#300 — la config est un « panneau » unifié (id 'config') : ouvrir =
    // l'ajouter au modèle dans son dernier contenant (barre latérale par défaut),
    // fermer = l'en retirer. Le modèle notifie panneaux + grande zone (recadrage
    // du dessin quand la barre latérale change).
    const panels = menu_configuration.panels
    const already_open = panels.isOpen('config')
    if (open) {
      // OS#300 — plus d'exclusivité manuelle config/filtres : dans le modèle
      // unifié, un menu en pop-up cohabite avec un autre (superposition), et
      // seule la BARRE LATÉRALE est exclusive (ancrer l'un éjecte l'autre, géré
      // par panels). La config et le filtre peuvent donc rester ouverts ensemble.
      if (!already_open) {
        // OS#300 — contenant par défaut selon le contexte : barre latérale si elle
        // est affichée, sinon pop-up (cf. panels.defaultOpenMode).
        const mode = menu_configuration.panels.defaultOpenMode()
        // Pop-up config : position par défaut au bord droit (proche de l'ancien
        // tiroir), sans recouvrir le centre du dessin. La barre latérale, elle,
        // se cale d'elle-même à droite.
        const opts = mode === 'popup'
          ? { geometry: {
            w: 400,
            h: Math.min(560, window.innerHeight - app_data.drawing_area.getNavBarHeight()
              - app_data.drawing_area.getBottomBarHeight() - 24),
            x: Math.max(0, window.innerWidth - 400 - menu_configuration.getToolsColumnWidthPx() - 16),
            y: app_data.drawing_area.getNavBarHeight() + 8
          } }
          : undefined
        panels.setMode('config', mode, opts)
      }
    } else {
      panels.close('config')
    }
    // Miroir de compatibilité lu par GuidedTour / MenuTop / Toolbar / ApplicationData.
    menu_configuration.ref_menu_opened.current = [open, setConfigOpen]
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

  // OS#300 — Recadrage du dessin quand la RÉSERVE de barre latérale change
  // (ancrage/détachement/fermeture d'un menu ancré). Une notification MAIN_ZONE
  // seule ne refit pas le diagramme : on déclenche explicitement areaAutoFit +
  // draw, comme la bascule de la colonne d'outils (cf. MenuTop). N'est PAS
  // déclenché par les pop-ups/info-bulles (qui se superposent, réserve nulle).
  const sidebar_reserve = menu_configuration.panels.getSidebarReservedPx()
  const prev_sidebar_reserve = useRef(sidebar_reserve)
  useLayoutEffect(() => {
    if (prev_sidebar_reserve.current !== sidebar_reserve) {
      prev_sidebar_reserve.current = sidebar_reserve
      app_data.drawing_area.areaAutoFit()
      app_data.draw()
    }
  })
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
      // OS#300 Lot 2 — barre d'outils TOUJOURS visible (l'ancien toggle est
      // requalifié en bascule de barre latérale).
      display='flex'
      flexDirection='column'
      alignItems='center'
      gap='0.3rem'
      paddingY='0.3rem'
      overflowY='auto'
      overflowX='hidden'
    >
      {/* #1243 — l'axe « élément » est porté par la SÉLECTION : le sélecteur
          d'éléments de la matrice a disparu de la colonne avec elle. Ne restent
          ici que les outils de canvas (cluster collé en bas). */}
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
        {/* OS#1273 — recherche d'élément (nœud / flux / zone). Bascule la barre de
            recherche (même slot que le raccourci Ctrl+F). */}
        <OSTooltip placement='left' label={t('search.tooltip')}>
          <Button
            id='buttonOpenElementSearch'
            variant='toolbar_button_open_filter'
            size='sizeToolbarButton'
            position='relative'
            aria-label={t('search.title')}
            onClick={() => menu_configuration.ref_toggle_search.current()}
          >
            <SearchIcon />
          </Button>
        </OSTooltip>
        <Divider />
        <ComponentMouseMode app_data={app_data} updateParentComponent={refreshToolsColumn} />
        {/* Zone de texte : à côté de l'outil de tracé (mode édition). Active le mode
            « placer une zone de texte » — glisser un rectangle sur le fond pose la ZDT
            à cette position/taille (cf. DrawingArea.enterPlaceContainerMode). Re-clic =
            sortie du mode. Seule porte d'entrée restante pour créer une ZDT depuis l'UI. */}
        <OSTooltip placement='left' label={t('Banner.create_text_zone')}>
          <Button
            id='button_create_text_zone'
            variant={app_data.drawing_area.isInPlaceContainerMode()
              && app_data.drawing_area.place_container_shape !== 'line'
              ? 'toolbar_button_mouse_mode_activated'
              : 'toolbar_button_mouse_mode'}
            size='sizeToolbarButton'
            onClick={() => {
              if (app_data.drawing_area.isInPlaceContainerMode()
                && app_data.drawing_area.place_container_shape !== 'line') {
                app_data.drawing_area.exitPlaceContainerMode()
              } else {
                app_data.drawing_area.enterPlaceContainerMode('rect')
              }
              refreshToolsColumn()
            }}
          >
            {icon_library.icon_object}
          </Button>
        </OSTooltip>
        {/* OS#1276 — ligne libre : même mode « placement » que la zone de texte, mais
            le glisser pose un trait décoratif (diagonale de la boîte tracée). */}
        <OSTooltip placement='left' label={t('Banner.create_line')}>
          <Button
            id='button_create_line'
            variant={app_data.drawing_area.isInPlaceContainerMode()
              && app_data.drawing_area.place_container_shape === 'line'
              ? 'toolbar_button_mouse_mode_activated'
              : 'toolbar_button_mouse_mode'}
            size='sizeToolbarButton'
            onClick={() => {
              if (app_data.drawing_area.isInPlaceContainerMode()
                && app_data.drawing_area.place_container_shape === 'line') {
                app_data.drawing_area.exitPlaceContainerMode()
              } else {
                app_data.drawing_area.enterPlaceContainerMode('line')
              }
              refreshToolsColumn()
            }}
          >
            {icon_library.icon_line_shape}
          </Button>
        </OSTooltip>
        <ComponentPositionMode app_data={app_data} updateParentComponent={refreshToolsColumn} />
        {/* hide_fullscreen : le plein écran est dans la barre du haut en éditeur. */}
        <ComponetStretchButtons app_data={app_data} updateParentComponent={refreshToolsColumn} hide_fullscreen />
        {/* Indicateur de zoom + boutons -/+ (molette = Ctrl/Cmd+scroll). */}
        <ComponentZoomControl app_data={app_data} />
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
          // #298 — la colonne d'outils de droite (`.tools_column`, dont le bas porte le zoom) flotte
          // au-dessus du coin bas-droit. Sans réserve, la frise de séquence (`width:100%`) passe
          // dessous et se chevauche avec le zoom. On recadre la frise en réservant à sa droite la
          // largeur de la colonne d'outils (0 en publish / quand la colonne est fermée → pas de régression).
          paddingRight={menu_configuration.getToolsColumnWidthPx() + 'px'}
        >
          <DrawerSequenceDataTagg new_data={app_data} />
        </Box>
      }

      {/* OS#300 — La Configuration (= Inspecteur) est un « panneau » unifié
          (id 'config') : barre latérale ancrée (recadre le dessin) ou pop-up
          déplaçable, au choix via l'en-tête uniforme. Le contenu (ConfigMenu)
          est identique quel que soit le contenant. Remplace l'ancien couple
          Drawer overlay (#1243) / panneau épinglé docké (#1258). */}
      {app_data.is_editable ? (
        <PanelShell
          app_data={app_data}
          id='config'
          title={t('panel.config_title', { defaultValue: 'Configuration' })}
          allowedModes={['popup', 'sidebar']}
        >
          <ConfigMenu
            app_data={app_data}
          />
        </PanelShell>
      ) : <></>}


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

      {/* Badge « Made with OpenSankey » sur les pages publiées (window.sankey.badge,
          désactivable dans le dialogue de publication) : lien vers le site TerriFlux,
          dans la langue de l'UI. Volontairement sans rel=nofollow (backlink). */}
      {(app_data.is_static && app_data.publish_options.badge) ? (
        <a
          href={'https://terriflux.com/'
            + ((app_data.language ?? '').startsWith('fr') ? 'fr/' : '')
            + '?utm_source=opensankey&utm_medium=badge&utm_campaign=published-diagram'}
          target='_blank'
          rel='noopener'
          style={{
            position: 'fixed',
            bottom: '4px',
            left: '8px',
            zIndex: 15,
            fontSize: '11px',
            lineHeight: '18px',
            color: '#456',
            background: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid rgba(0, 0, 0, 0.15)',
            borderRadius: '6px',
            padding: '1px 8px',
            textDecoration: 'none',
          }}
        >
          {'Made with '}<b>OpenSankey</b>
        </a>
      ) : <></>}

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
      {/* OS#1286 — éditeur du registre d'unités (grandeurs/unités/défauts),
          ouvert depuis le sélecteur d'unité de l'onglet Valeur. */}
      <UnitsEditorDialog app_data={app_data} />

      {modal_support}
      {modal_resolution_png}
      {modal_resolution_pdf}
    </>
  )
}

// #1243 — Le panneau de configuration EST l'inspecteur piloté par la sélection.
// La matrice type×élément (boutons Data/Formatting/Présentation × sélecteur
// d'éléments + dict_config_windows) est déposée : son contenu vit désormais
// dans les onglets de l'inspecteur (éléments + Vue), le panneau Filtres
// (groupes de tags, vues, sélection par critères) et les gestes de canvas.
const ConfigMenu = ({ app_data }: {
  app_data: Class_ApplicationData,
}) => {
  // #247 — re-render piloté par le modèle (lie le slot updater + cleanup au démontage).
  useModelBinding(app_data.menu_configuration.ref_to_menu_config_updater)

  // Hauteur bornée à l'espace écran restant (panneau ancré).
  const maxHConfig = 'calc(' + (window.innerHeight - (app_data.drawing_area.getNavBarHeight() + app_data.drawing_area.getBottomBarHeight() + (app_data.drawing_area.fit_margin * 2))) + 'px - 0.8rem)'

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
        // Auto-exit edition mode as soon as the user interacts with the configuration menu
        if (app_data.drawing_area.isInEditionMode()) {
          app_data.drawing_area.switchMode()
        }
      }}
    >
      <InspectorPanel app_data={app_data} />
    </Box>
  </Box>
}


// #1243 — La matrice type×élément est DÉPOSÉE : ConfigMenuTypeConfig (boutons
// Data/Formatting/Présentation), ConfigContent (dict_config_windows),
// ConfigMenuElementToConfig (sélecteur d'éléments) et le type
// `typeButtonElementConfigurable` de ses boutons sont supprimés. Leur contenu
// vit dans l'inspecteur (onglets par cible), le panneau Filtres (groupes de
// tags, vues, sélection par critères) et les gestes de canvas.

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
