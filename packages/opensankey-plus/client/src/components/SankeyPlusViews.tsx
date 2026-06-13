// Standard libs
import React, { ChangeEvent, FC, useEffect, useRef, useState } from 'react'
import Draggable, { DraggableProps } from 'react-draggable'

// react-draggable : les typings embarqués rendent les props optionnelles, mais
// @types/react-draggable (tiré par la résolution fraîche du CI) les rend requises.
// On relâche le type ici pour que le build passe quelle que soit la source des typings.
const DraggableComponent = Draggable as unknown as React.ComponentClass<Partial<DraggableProps>>

/**
 * Bornes draggable contraintes à la zone de dessin gauche. Quand le tableur/doc occupe la droite
 * (menu_configuration.main_zone_right_reserved), empêche de glisser une modale de vue sous le
 * panneau de droite. `right`/`bottom` sont des offsets de position (react-draggable n'y soustrait
 * pas la taille du noeud), d'où le retrait de offsetWidth/Height. Re-calculé à chaque rendu : les
 * modales concernées s'abonnent à addMainZoneListener pour se re-rendre au toggle du tableur.
 */
const drawingZoneDraggableBounds = (
  app_data: Class_ApplicationDataOSP,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodeRef: React.MutableRefObject<any>
): { left: number; top: number; right: number; bottom: number } => {
  const reserved = mainZoneRightReservedPx(app_data)
  const node_w = nodeRef.current?.offsetWidth ?? 0
  const node_h = nodeRef.current?.offsetHeight ?? 0
  return {
    left: 0,
    top: 0,
    right: Math.max(0, window.innerWidth - reserved - node_w),
    bottom: Math.max(0, window.innerHeight - node_h)
  }
}
import {
  Box,
  CloseButton,
  Select,
  Input,
  InputGroup,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Button,
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ButtonGroup,
  useDisclosure,
  Fade,
  Spinner,
  Text,

} from '@chakra-ui/react'

// OpenSankey Libs
import {
  default_main_sankey_id,
  getJSONOrUndefinedFromJSON,
  makeId,
  Type_JSON,
} from '../deps/OpenSankey/types/Utils'

import { updateFrom } from '../deps/OpenSankey/Algorithms/UpdateFrom'
import { UpdateModeGrid } from '../deps/OpenSankey/components/dialogs/SankeyMenuDialogs'
import { ConfigMenuTextInput, OSMultiSelect, typeElementSelectable, WrapperBoxSubSectionMenu } from '../deps/OpenSankey/components/configmenus/MenuCommon'
import { Class_DrawingAreaOSP, DrawingAreaPersistenceOSP } from '../types/DrawingAreaOSP'
import { Class_NodeElement } from '../deps/OpenSankey/Elements/Node'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'
import { OSTooltip } from '../deps/OpenSankey/components/configmenus/MenuCommon'
import { mainZoneRightReservedPx } from '../deps/OpenSankey/components/spreadsheet/MainZoneTabs'
import { LevelTagFilter } from '../deps/OpenSankey/components/topmenus/Toolbar'
import { compressJSONToGzip, decompressGzipDataFixed, decompressUploadedFileUniversal } from '../deps/OpenSankey/Persistence/UniversalJSONCompression'
import { DrawingAreaPersistence } from '../deps/OpenSankey/Persistence/SankeyPersistence'
import { createUnitaryNewView } from './UnitaryBoard'

interface BaseComponentPropsPlus {
  app_data: Class_ApplicationDataOSP
}

// ===========================================================================
// Extra tab for ApplyLayoutDialog — injected via menu_configuration.extra_apply_layout_tab
// ===========================================================================

/**
 * Render function for the OSP extra tab in UpdateModeGrid (inside the layout transfer dialog).
 * Provides copyViews and icon_catalog toggles.
 * Called as extra_tab.render(attrs, onToggle, t) — NOT a React component.
 */
export const renderApplyLayoutExtraTabOSP = (
  app_data: Class_ApplicationDataOSP,
  attrs: string[],
  onToggle: (key: string) => void,
  t: (key: string) => string
): React.ReactNode => {
  const has_licence = app_data.has_sankey_plus
  const is_in_view = !app_data.is_view_master
  const disabled = !has_licence || is_in_view
  const tooltip = !has_licence
    ? t('templates.need_osp')
    : is_in_view
      ? t('Menu.Transformation.disabled_view')
      : ''
  const btn = (key: string, label: string, dis = false) => (
    <Button
      key={key}
      isDisabled={dis}
      variant={attrs.includes(key) ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
      onClick={() => { if (!dis) onToggle(key) }}
    >{label}</Button>
  )
  return (
    <OSTooltip label={tooltip}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' mb='1'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Views')}</Box>
        <Box>{btn('copyViews', 'X', disabled)}</Box>
      </Box>
    </OSTooltip>
  )
}

export const logo_view = <svg
  xmlns='http://www.w3.org/2000/svg'
  viewBox='0 0 24 24'
  height='1.8rem'
  width='1.8rem'
>
  <path
    d='m17,15c-3.704,0-5.798,2.252-6.716,3.595-.376.55-.376,1.261,0,1.811.918,1.343,3.012,3.595,6.716,3.595s5.798-2.252,6.716-3.595c.376-.55.376-1.261,0-1.811-.918-1.343-3.012-3.595-6.716-3.595Zm5.891,4.841c-.807,1.18-2.646,3.159-5.891,3.159s-5.084-1.979-5.891-3.159c-.146-.214-.146-.468,0-.682.808-1.18,2.646-3.159,5.891-3.159s5.084,1.979,5.891,3.159c.146.214.146.468,0,.682Zm-5.891-2.341c-1.103,0-2,.897-2,2s.897,2,2,2,2-.897,2-2-.897-2-2-2Zm0,3c-.551,0-1-.448-1-1s.449-1,1-1,1,.448,1,1-.449,1-1,1ZM6,5.5c0,.552-.448,1-1,1s-1-.448-1-1,.448-1,1-1,1,.448,1,1Zm0,11c0,.552-.448,1-1,1s-1-.448-1-1,.448-1,1-1,1,.448,1,1Zm0-5.5c0,.552-.448,1-1,1s-1-.448-1-1,.448-1,1-1,1,.448,1,1Zm3-5.5c0-.276.224-.5.5-.5h10c.276,0,.5.224.5.5s-.224.5-.5.5h-10c-.276,0-.5-.224-.5-.5Zm10.5,6h-10c-.276,0-.5-.224-.5-.5s.224-.5.5-.5h10c.276,0,.5.224.5.5s-.224.5-.5.5Zm4.5-7v10c0,.276-.224.5-.5.5s-.5-.224-.5-.5V4.5c0-1.93-1.57-3.5-3.5-3.5H4.5c-1.93,0-3.5,1.57-3.5,3.5v13c0,1.93,1.57,3.5,3.5,3.5h3.5c.276,0,.5.224.5.5s-.224.5-.5.5h-3.5c-2.481,0-4.5-2.019-4.5-4.5V4.5C0,2.019,2.019,0,4.5,0h15c2.481,0,4.5,2.019,4.5,4.5Z'
  />
</svg>



// ================================================================

/**
 * Fucntion that return a toolbar to navigate,create or modify view, it contain :
 * - a button to return to master data
 * - a button to create a view if we are currently on master data
 * - 2 button to navigate in the list of view
 * - a dropdown to directly select the view we want to display (or select master data)
 * Then if we are in a view there is additionnal button
 * - a button to choose variable of the view that get their value from master
 * - a button to clone the actual view
 * a button that appear if the view is a unitary view and the unitary node of the view has the tag 'secteur' from the nodeTag 'type de noeud'
 *
 * @param {*} {
 *   app_data
 * }
 * @return {*}
 */
export const BannerViewsOSP = ({ app_data }: { app_data: Class_ApplicationDataOSP }) => {

  // Data -------------------------------------------------------------------------------

  const { t, icon_library, menu_configuration_osp } = app_data
  const { icon_add_element, icon_remove_element, icon_welcome, icon_next, icon_previous, icon_attr_view, icon_unit_view, icon_copy, icon_locked, icon_collapse_down, icon_collapse_up } = icon_library
  const [, setCount] = useState(0)
  const { isOpen, onToggle } = useDisclosure()
  const refreshThis = () => {
    setCount(a => a + 1)
  }
  const drawing_area_plus = app_data.drawing_area as Class_DrawingAreaOSP

  menu_configuration_osp.ref_to_banner_views_opened.current = isOpen
  menu_configuration_osp.ref_to_banner_views_updater.current = refreshThis

  // Re-centrer la bannière dans la zone de dessin gauche quand le tableur/doc s'ouvre ou se ferme.
  useEffect(() => {
    return app_data.menu_configuration.addMainZoneListener(refreshThis)
  }, [])

  // Ref to trigger other components ----------------------------------------------------

  const ref_to_input_loader_json_catalog = useRef<HTMLInputElement>(null) as { current: HTMLInputElement; }

  // Local variables --------------------------------------------------------------------

  const has_sankey_plus = app_data.has_sankey_plus
  const has_views = app_data.has_views
  const is_view_master = app_data.is_view_master
  const has_view_before = app_data.has_view_before
  const has_view_after = app_data.has_view_after
  const is_static = app_data.is_static
  const is_editable = app_data.is_editable

  // Button to create a view ------------------------------------------------------------

  const logo_locked = <Box className='iconLocked'>
    {icon_locked}
  </Box>

  const activate_button_to_create_view = has_sankey_plus
  const button_to_create_view = <OSTooltip
    placement='bottom'
    label={
      (!has_sankey_plus) ?
        (t('Menu.sankeyOSPDisabled')) :
        t('view.tooltips.buttonCreateView')}
  >
    <Button
      variant='button_banner_view'
      size='sizeMenuTopButton'
      isDisabled={!activate_button_to_create_view}
      onClick={() => {
        // Crée une vue VIDE (indépendante du diagramme courant)
        const view_id = makeId('view')
        app_data.createNewView(view_id, t('view.new_view_name'), false)
        app_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
        app_data.setCurrentView(view_id)
        app_data.menu_configuration_osp.updateComponentRelatedToViews()
      }}
    >
      <Box
        layerStyle='banner_view_buttons'
      >
        <Box
          gridRow="1"
          padding="0.1rem 0 0.1rem 0"
        >
          {icon_add_element}
          {
            !has_sankey_plus ?
              logo_locked
              : <></>
          }
        </Box>
        <Box
          gridRow="2"
        >
          {t('Menu.addView')}
        </Box>
      </Box>
    </Button>
  </OSTooltip>

  // Button to copy the current view ----------------------------------------------------

  const activate_button_to_copy_view = has_sankey_plus
  const button_to_copy_view = <OSTooltip
    placement='bottom'
    label={
      (!has_sankey_plus) ?
        (t('Menu.sankeyOSPDisabled')) :
        t('view.tooltips.buttonCloneView')}
  >
    <Button
      variant='button_banner_view'
      size='sizeMenuTopButton'
      isDisabled={!activate_button_to_copy_view}
      onClick={() => {
        // Copie la vue courante dans une nouvelle vue (équivalent Ctrl+X)
        const view_id = makeId('view')
        app_data.createNewView(view_id, 'Copie de ' + app_data.drawing_area.name, true)
        app_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
        app_data.setCurrentView(view_id)
        app_data.menu_configuration_osp.updateComponentRelatedToViews()
      }}
    >
      <Box
        layerStyle='banner_view_buttons'
      >
        <Box
          gridRow="1"
          padding="0.1rem 0 0.1rem 0"
        >
          {icon_copy}
          {
            !has_sankey_plus ?
              logo_locked
              : <></>
          }
        </Box>
        <Box
          gridRow="2"
        >
          {t('Menu.cloneView')}
        </Box>
      </Box>
    </Button>
  </OSTooltip>

  // Button to delete actual view -------------------------------------------------------

  const activate_button_to_delete_actual_view = has_sankey_plus && has_views && !is_view_master
  const button_to_delete_actual_view = <OSTooltip
    placement='bottom'
    label={
      (!has_sankey_plus) ?
        (t('Menu.sankeyOSPDisabled')) :
        t('view.tooltips.button_delete_actual_view')
    }
  >
    <Button
      variant='button_banner_view'
      size='sizeMenuTopButton'
      isDisabled={!activate_button_to_delete_actual_view}
      onClick={
        // Delete the view
        () => {
          app_data.deleteCurrentView()
        }
      }
    >
      <Box
        layerStyle='banner_view_buttons'
      >
        <Box
          gridRow="1"
          padding="0.1rem 0 0.1rem 0"
        >
          {icon_remove_element}
          {
            (!has_sankey_plus) ?
              logo_locked :
              <></>
          }
        </Box>
        <Box
          gridRow="2"
        >
          {t('view.delete')}
        </Box>
      </Box>
    </Button>
  </OSTooltip>

  // Button to fallback to master -------------------------------------------------------

  const activate_button_to_return_to_master = has_views && !is_view_master
  const button_to_return_to_master = <OSTooltip
    placement='bottom'
    label={t('view.tooltips.home')}
  >
    <Button
      variant='button_banner_view'
      size='sizeMenuTopButton'
      isDisabled={!activate_button_to_return_to_master}
      onClick={() => {
        const evt = document
        const evt_key_f7 = new KeyboardEvent('keydown', { key: 'F7' })
        if (evt.onkeydown) {
          evt.onkeydown(evt_key_f7)
        }
      }}
    >
      <Box
        layerStyle='banner_view_buttons'
      >
        <Box
          gridRow="1"
          padding="0.1rem 0 0.1rem 0"
        >
          {icon_welcome}
        </Box>
        <Box
          gridRow="2"
        >
          {t('Menu.home')}
        </Box>
      </Box>
    </Button>
  </OSTooltip>

  // Button to go to next view ----------------------------------------------------------

  const activate_button_to_prev_view = has_views && has_view_before
  const button_to_prev_view = <OSTooltip
    placement='bottom'
    label={t('view.tooltips.PrevViewButton')}
  >
    <Box>
      <Button
        variant='button_banner_view'
        size='sizeMenuTopButton'
        isDisabled={!activate_button_to_prev_view}
        onClick={() => {
          const ev = document
          const tmp = new KeyboardEvent('keydown', { key: 'F8' })
          if (ev.onkeydown) {
            ev.onkeydown(tmp as KeyboardEvent)
          }
        }}
      >
        <Box
          layerStyle='banner_view_buttons'
        >
          <Box
            gridRow="1"
            padding="0.1rem 0 0.1rem 0"
          >
            {icon_previous}
          </Box>
          <Box
            gridRow="2"
          >
            {t('Menu.precView')}
          </Box>
        </Box>
      </Button>
    </Box>
  </OSTooltip>

  // Button to previous view ------------------------------------------------------------

  const activate_button_to_next_view = has_views && has_view_after
  const button_to_next_view = <OSTooltip
    placement='bottom'
    label={t('view.tooltips.NextViewButton')}
  >
    <Button
      variant='button_banner_view'
      size='sizeMenuTopButton'
      isDisabled={!activate_button_to_next_view}
      onClick={() => {
        const ev = document
        const tmp = new KeyboardEvent('keydown', { key: 'F9' })
        if (ev.onkeydown) {
          ev.onkeydown(tmp as KeyboardEvent)
        }
      }}
    >
      <Box
        layerStyle='banner_view_buttons'
      >
        <Box
          gridRow="1"
          padding="0.1rem 0 0.1rem 0"
        >
          {icon_next}
        </Box>
        <Box
          gridRow="2"
        >
          {t('Menu.nextView')}
        </Box>
      </Box>
    </Button>
  </OSTooltip>

  // Button to display attributes transfert modal ---------------------------------------

  const activate_button_to_show_view_attr_transfert_modal = has_sankey_plus && has_views && !is_view_master
  const button_to_show_view_attr_transfert_modal = <OSTooltip
    placement='bottom'
    label={
      (!has_sankey_plus) ?
        (t('Menu.sankeyOSPDisabled')) :
        t('view.tooltips.buttonCloneMasterAttrView')
    }>
    <Button
      variant='button_banner_view'
      size='sizeMenuTopButton'
      isDisabled={!activate_button_to_show_view_attr_transfert_modal}
      onClick={
        () => {
          menu_configuration_osp.ref_to_modal_view_attributes_switcher.current(true)
        }
      }
    >
      <Box
        layerStyle='banner_view_buttons'
      >
        <Box
          gridRow="1"
          padding="0.1rem 0 0.1rem 0"
        >
          {icon_attr_view}
          {
            (!has_sankey_plus) ?
              logo_locked
              : <></>
          }
        </Box>
        <Box
          gridRow="2"
        >
          {t('view.keep_master_var')}
        </Box>
      </Box>
    </Button>
  </OSTooltip>

  const button_to_show_modal_create_unitary_view = <OSTooltip
    placement='bottom'
    label={
      (!has_sankey_plus) ?
        (t('Menu.sankeyOSPDisabled')) :
        t('view.tooltips.buttonOpenModalUnitary')
    }>
    <Button
      variant='button_banner_view'
      size='sizeMenuTopButton'
      isDisabled={!has_sankey_plus}
      onClick={
        () => {
          menu_configuration_osp.ref_show_modal_unitary_view.current(true)
        }
      }>
      <Box layerStyle='banner_view_buttons' >
        <Box
          gridRow="1"
          padding="0.1rem 0 0.1rem 0"
        >
          {icon_unit_view}
          {
            (!has_sankey_plus) ? logo_locked : <></>}
        </Box>
        <Box gridRow="2" >
          {t('view.unit')}
        </Box>
      </Box>
    </Button>
  </OSTooltip>

  // Button to load views as a catalog of view (ie  JSON containing only views) ---------

  const activate_create_data_catalog = has_sankey_plus // TODO need only license ?
  const create_data_catalog = <OSTooltip
    placement='bottom'
    label={
      (!has_sankey_plus) ?
        (t('Menu.sankeyOSPDisabled')) :
        t('view.tooltips.catalog_data')
    }
  >
    <Button
      variant='button_banner_view'
      size='sizeMenuTopButton' isDisabled={!activate_create_data_catalog}
      onClick={
        () => {
          if (ref_to_input_loader_json_catalog.current) {
            ref_to_input_loader_json_catalog.current.name = ''
            ref_to_input_loader_json_catalog.current.click()
          }
        }}
    >
      <Box
        layerStyle='banner_view_buttons'
      >
        <Box
          gridRow="1"
          padding="0.1rem 0 0.1rem 0"
        >
          {icon_copy}
          {
            (!has_sankey_plus) ?
              logo_locked
              : <></>
          }
        </Box>
        <Box
          gridRow="2"
        >
          {t('view.catalog')}
        </Box>
      </Box>
    </Button>
  </OSTooltip>

  // Input to read JSON as a catalog of view (ie  JSON containing only views) ---------

  const input_loader_json_catalog = <Input
    type="file"
    multiple
    accept='.json,.json.gz,.gz'
    ref={ref_to_input_loader_json_catalog}
    style={{ display: 'none' }}
    onChange={(evt: ChangeEvent) => {
      const files = (evt.target as HTMLFormElement).files
      app_data.sendWaitingToast(
        () => {
          for (let i = 0; i < files.length; i++) {
            drawing_area_plus.bypass_redraws = true
            const name = files[i].name.split('.')[0]
            const is_first = i == 0
            decompressUploadedFileUniversal(files[i]).then(JSON_data => {
              // Si le fichier contient déjà des vues, on concatène toutes ses vues au catalogue.
              const nb_views_added = app_data.addViewsFromJSON(JSON_data as unknown as Type_JSON)
              if (nb_views_added === 0) {
                // Sinon (diagramme simple sans vues), on emballe le fichier entier comme une vue unique.
                const view_id = makeId('view')
                app_data.createNewView(view_id, name, false)
                JSON_data.id = view_id
                app_data.views_dict[view_id].json = compressJSONToGzip(JSON_data)
                if (is_first) app_data.setCurrentView(view_id)
              }
              app_data.menu_configuration.updateAllMenuComponents()
              app_data.menu_configuration_osp.updateComponentRelatedToViews()
            })
          }

        })
    }}
  />

  const style: React.CSSProperties = is_editable ? {
    position: 'fixed',
    top: drawing_area_plus.getNavBarHeight() + drawing_area_plus.fit_margin,
    zIndex: '1',
    background: 'white',
    border: '1px solid',
    borderRadius: '4px',
    width: 'fit-content',
    // Centre dans la zone de dessin gauche (et non sur tout l'écran) pour rester hors du tableur.
    left: (window.innerWidth - mainZoneRightReservedPx(app_data)) / 2,
    transform: 'translate(-50%)'
  } : {}

  // ButtonsGrooup doesn't have variant so we set style here
  const buttonGroupView = <ButtonGroup
    className='BannerView'
    style={style}
  >
    {/* Load + Save  */}
    {is_editable && app_data.has_sankey_plus ? input_loader_json_catalog : <></>}
    {is_editable && app_data.has_sankey_plus ? create_data_catalog : <></>}

    {/* Return to Sankey master button */}
    {is_editable ? button_to_return_to_master : <></>}

    {/* Create, switch between or delete views */}
    {is_editable && app_data.has_sankey_plus ? button_to_create_view : <></>}
    {is_editable && app_data.has_sankey_plus ? button_to_copy_view : <></>}
    {button_to_prev_view}
    {button_to_next_view}
    <Box
      height='3rem'
      gridColumnEnd='span 4'
      alignSelf='center'
      alignContent='center'
    >
      <SelecteurView app_data={app_data} />

    </Box>
    {
      is_editable && app_data.has_sankey_plus ?
        <>
          {button_to_delete_actual_view}
          {button_to_show_view_attr_transfert_modal}
          {button_to_show_modal_create_unitary_view}
        </> :
        <></>
    }
    {is_editable ? <Button
      variant='button_collapse_banner_view'
      size='sizeMenuTopButton'
      onClick={onToggle}>
      {isOpen ? icon_collapse_up : icon_collapse_down}
    </Button> : <></>}
  </ButtonGroup>

  const buttonShowBanner = <OSTooltip placement='bottom' label={t('Menu.tooltips.view')}>
    <Button
      variant={isOpen ? 'menutop_button_view_activated' : 'menutop_button'}
      size='sizeMenuTopButton'
      onClick={onToggle}
    >
      <Box
        layerStyle='menutop_button_style'
      >
        <Box
          gridRow='1'
        >
          {logo_view}
        </Box>
        <Box
          gridRow='2'
        >
          {t(('Menu.view'))}
        </Box>
      </Box>
    </Button>
  </OSTooltip>
  if (!is_editable && app_data.has_views) return <>{buttonGroupView}</>
  else if (is_editable) return <>
    {buttonShowBanner}
    <Fade in={isOpen} style={{ display: isOpen ? 'unset' : 'none' }} >
      {buttonGroupView}
    </Fade>
  </>
  return <></>
}

/**
 * CTA button shown in navbar when user does not have OpenSankey+ license.
 * Redirects to /license/checkout.
 */

/**
 * View selector for navbar or menuconfig
 * @param {*} {
 *   app_data
 * }
 * @return {*}
 */
export const SelecteurView = (
  { app_data }: { app_data: Class_ApplicationDataOSP }
) => {
  const drawing_area_plus = app_data.drawing_area as Class_DrawingAreaOSP

  const [s_select_or_edit, sSelectOrEdit] = useState<'edit' | 'select'>('select')

  const cur_view = drawing_area_plus
  const has_sankey_plus = app_data.has_sankey_plus
  const has_views = app_data.has_views
  const is_view_master = app_data.is_view_master

  // JSX elements -----------------------------------------------------------------------

  const selecteur = <Select
    variant='view_select'
    style={is_view_master ? { fontStyle: 'italic', backgroundColor: '#e2e8f0' } : undefined}
    onDoubleClick={() => {
      if (
        has_sankey_plus &&
        has_views &&
        !is_view_master
      ) {
        sSelectOrEdit('edit') // Swith to edition mode
      }
    }}
    onChange={
      (evt: React.ChangeEvent<HTMLSelectElement>) => {
        app_data.setCurrentView(evt.target.value)
        // Update views components (without updating save in cache button)
        app_data.menu_configuration_osp.updateComponentRelatedToViews()
      }
    }
    value={
      Object.keys(app_data.views_dict).includes(cur_view.id) && cur_view.id !== default_main_sankey_id
        ? cur_view.id
        : 'master'
    }
  >
    <option value="master" disabled hidden>Sankey Maître</option>
    {
      app_data.views_order
        .map((view, i) => {
          const is_master_option = view === default_main_sankey_id
          return <option
            key={i}
            value={view}
            style={is_master_option ? { fontStyle: 'italic', backgroundColor: '#e2e8f0' } : undefined}
          >
            {app_data.views_dict[view].name}
          </option>
        })
    }
  </Select>

  const text_input = <ConfigMenuTextInput
    t={app_data.t}
    default_value={app_data.views_dict[cur_view.id]?.name}
    function_on_blur={(_) => {
      // Update text for links
      if ((_ !== undefined) && (_ !== null)) {
        app_data.views_dict[cur_view.id].name = _
        //cur_view.name = _
      }
      // Update this menu
      sSelectOrEdit('select')
      // Update views components
      app_data.menu_configuration_osp.updateComponentRelatedToViews()
    }}
    disabled={!has_views}
  />
  return ((s_select_or_edit === 'edit') || (!has_views)) ? text_input : selecteur
}

/**
 * Content for view config in menu configuration
 * @param {*} {
 *   app_data,
 * }
 * @return {*}
 */
export const ViewsConfig = (
  { app_data }: { app_data: Class_ApplicationDataOSP }
) => {

  // Data -------------------------------------------------------------------------------

  const { t, icon_library, menu_configuration_osp, drawing_area } = app_data
  const { icon_remove_element, icon_move_element_up, icon_move_element_down } = icon_library

  // Components updaters ----------------------------------------------------------------

  const [, setCount] = useState(0)
  const refreshThis = () => setCount(a => a + 1)
  menu_configuration_osp.ref_to_views_config_updater.current = refreshThis

  // Local variables --------------------------------------------------------------------
  const drawing_area_plus = drawing_area as Class_DrawingAreaOSP
  const is_activated = app_data.has_sankey_plus
  const curr_view = drawing_area_plus
  const list_view = app_data.views_order //include master

  // JSX elements -----------------------------------------------------------------------

  // Popover used to select a view or master we want to take the layout from. (color,font-size,position,...)

  return <WrapperBoxSubSectionMenu new_data={app_data} title={t('view.storytelling')}>
    <Box layerStyle='menuconfigpanel_grid'>

      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('view.select')}
        </Box>
        <InputGroup
          variant='menuconfigpanel_option_input'>
          <SelecteurView app_data={app_data} />
        </InputGroup>
      </Box>
      <Table variant='table_view' size='sm'>
        <Thead>
          <Tr>
            <Th>{t('view.name')}</Th>
            <Th>Position</Th>
            <Th>{t('view.delete')}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {list_view.map((view_id, idx) => {
            return (
              <React.Fragment key={idx}>
                <Tr style={{ 'border': (view_id === curr_view.id) ? '2px solid #5a9282' : 'none' }}>
                  <Td>
                    <Input
                      variant='menuconfigpanel_option_input'
                      value={app_data.views_dict[view_id].name}
                      isDisabled={!is_activated || (view_id == default_main_sankey_id)}
                      onChange={evt => {
                        app_data.views_dict[view_id].name = evt.target.value
                        refreshThis()
                      }}
                      onBlur={() => {
                        menu_configuration_osp.updateComponentRelatedToViews()
                      }}
                    />
                  </Td>
                  <Td>
                    {/* Change the position of the view in the liste of view from master data */}
                    <Button variant='menuconfigpanel_option_button_in_table' isDisabled={!is_activated || (view_id == default_main_sankey_id)}
                      onClick={() => { app_data.moveViewUpInOrder(view_id); menu_configuration_osp.updateComponentRelatedToViews() }}
                    >
                      {icon_move_element_up}
                    </Button>
                    <Button variant='menuconfigpanel_option_button_in_table' isDisabled={!is_activated || (view_id == default_main_sankey_id)}
                      onClick={() => { app_data.moveViewDownInOrder(view_id); menu_configuration_osp.updateComponentRelatedToViews() }}
                    >
                      {icon_move_element_down}
                    </Button>
                  </Td>
                  <Td>
                    <Button
                      variant='menuconfigpanel_del_button_in_table'
                      isDisabled={!is_activated || (view_id == default_main_sankey_id)}
                      onClick={
                        // Delete the view
                        () => {
                          app_data.deleteView(view_id)
                          menu_configuration_osp.updateComponentRelatedToViews()
                        }
                      }
                    >
                      {icon_remove_element}
                    </Button>
                  </Td>
                </Tr>
              </React.Fragment>
            )
          })}
        </Tbody>
      </Table>
    </Box>

  </WrapperBoxSubSectionMenu>
}

// TODO Voir si toujours utile
// export const getSetDiagramFunc: getSetDiagramFType = (
//   set_master_data: (d: OSPData | undefined) => void,
//   set_view: (s: string) => void,
//   DefaultSankeyData: () => OSPData
// ) => {
//   return (
//     the_diagram: string,
//     set_data: (d: OSPData) => void,
//     convert_data: (d: OSPData, DefaultSankeyData: () => OSPData) => void
//   ) => {
//     const diagrams_list = window.sankey.diagrams_list ?? window.sankey.sous_filieres

//     const new_data = JSON.parse(
//       JSON.stringify(
//         window.sankey[diagrams_list[the_diagram]]
//       )
//     ) as OSPData
//     convert_data(new_data, DefaultSankeyData)
//     window.sankey.diagram = the_diagram
//     d3.select(' .opensankey #svg').on('.zoom', null)
//     if (window.SankeyToolsStatic && new_data.view.length > 0) {
//       set_master_data(new_data)
//       set_view(new_data.view[0].id)
//       set_data(GetDataFromView(new_data, new_data.view[0].id) as OSPData)
//     } else {
//       set_master_data(undefined)
//       set_data(new_data)
//       set_view('none')
//     }
//   }
// }

// TODO Voir si toujours utile
// export const setValue: setValueFType = (
//   dataTags: TagsGroup[],
//   v_target: SankeyLinkValueDict,
//   v_source: SankeyLinkValueDict,
//   depth: number
// ) => {
//   const dataTag = Object.values(dataTags)[depth]
//   const listKey = Object.keys(dataTag.tags)
//   for (const i in listKey) {
//     if (depth === dataTags.length - 1) {
//       v_target[listKey[i]] = v_source[listKey[i]]
//     } else {
//       if (v_target[listKey[i]] === undefined) {
//         v_target[listKey[i]] = {}
//       }
//       setValue(
//         dataTags,
//         v_target[listKey[i]] as SankeyLinkValueDict,
//         v_source[listKey[i]] as SankeyLinkValueDict,
//         depth + 1)
//     }
//   }
// }

// export const MenuPreferenceViewOSP: FC<BaseComponentPropsPlus> = (
//   { app_data }
// ) => {
//   const [, setCount] = useState(0)
//   app_data.menu_configuration.ref_to_checkbox_pref_view_updater.current = () => setCount(a => a + 1)
//   const { t } = app_data
//   return <Checkbox
//     variant='menuconfigpanel_option_checkbox'
//     isDisabled={!app_data.has_sankey_plus}
//     ref={app_data.checkbox_refs['Vis']}
//     isChecked={app_data.menu_configuration.isGivenAccordionShowed('Vis')}
//     onChange={() => {
//       app_data.menu_configuration.toggleGivenAccordion('Vis')
//       setCount(a => a + 1)
//     }}>
//     {t('view.storytelling')}
//   </Checkbox>
// }

/**
 * Modal to ask user if he want to save unsaved view change before switching view
 *
 * @param {*} {app_data}
 * @return {*}
 */
export const ModalViewNotSavedOSP: FC<BaseComponentPropsPlus> = (
  { app_data }
) => {

  const { t } = app_data
  const [show_modal, setShowModal] = useState(false)
  app_data.menu_configuration_osp.dict_setter_show_dialog_plus.ref_setter_show_menu_view_not_saved.current = setShowModal

  return (
    <Modal
      isCentered
      isOpen={show_modal}
      onClose={() => null}
      variant='modal_dialog'
    >
      <ModalOverlay />
      <ModalContent
        maxWidth='inherit'
      >
        <ModalHeader>
          {t('view.ns')}
        </ModalHeader>
        <ModalBody
          textStyle='h4'
        >
          {t('view.warn_ns')}
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button
              variant='menuconfigpanel_del_button'
              onClick={() => {
                app_data.resetViewWithOriginal()
                setShowModal(false)
              }}
            >
              {t('view.dont_save')}
            </Button>
            <Button
              variant='menuconfigpanel_add_button'
              onClick={() => {
                app_data.saveBeforeChangingView()
                setShowModal(false)
              }}
            >
              {t('view.save')}
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>)
}

export const ModalTransparentViewAttrOSP: FC<BaseComponentPropsPlus> = (
  { app_data }
): JSX.Element => {

  const { t } = app_data
  const [display_menu, set_display_menu] = useState(false)
  const [, setUpdater] = useState(0)
  const [selected_source, set_selected_source] = useState(default_main_sankey_id)
  const nodeRef = useRef(null)

  // Re-rendre (donc recalculer les bornes draggable) au toggle du tableur/doc.
  useEffect(() => {
    return app_data.menu_configuration.addMainZoneListener(() => setUpdater(a => a + 1))
  }, [])

  const drawing_area_plus = app_data.drawing_area as Class_DrawingAreaOSP
  app_data.menu_configuration_osp.ref_to_modal_view_attributes_switcher.current = set_display_menu
  app_data.menu_configuration_osp.ref_to_modal_view_attr_updater.current = () => setUpdater((a: number) => a + 1)

  const updateComponent = () => {
    app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    setUpdater(a => a + 1)
  }

  const has_sankey_plus = app_data.has_sankey_plus
  const has_master_sankey = app_data.has_master_sankey
  const is_view_master = app_data.is_view_master

  if (!has_sankey_plus || !has_master_sankey || is_view_master) return <></>

  const simple_attr = ['posNode', 'posFlux', 'attrNode', 'attrFlux', 'attrDrawingArea']
  const all_attr = app_data.transform_layout_all_attr

  const view_id = drawing_area_plus.id
  const attrs_by_source = app_data.heredited_attr[view_id] ?? {}

  // Sources disponibles = maître + toutes les autres vues sauf la vue courante
  const view_sources = [
    { id: default_main_sankey_id, name: t('view.actual') },
    ...app_data.views_order
      .filter(id => id !== default_main_sankey_id && id !== view_id)
      .map(id => ({ id, name: app_data.views_dict[id].name }))
  ]

  // S'assurer que selected_source est valide pour la vue courante
  const valid_source = view_sources.some(s => s.id === selected_source) ? selected_source : default_main_sankey_id
  const heredited = attrs_by_source[valid_source] ?? []

  const setAttrForSource = (src: string, attrs: string[]) => {
    if (!app_data.heredited_attr[view_id]) app_data.heredited_attr[view_id] = {}
    app_data.heredited_attr[view_id][src] = attrs
  }

  const content = <Box layerStyle='menuconfigpanel_grid'>

    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.sourceType')}</Box>
      <Select
        value={valid_source}
        onChange={evt => set_selected_source(evt.target.value)}
      >
        {view_sources.map(s => (
          <option key={s.id} value={s.id}>
            {s.name}{(attrs_by_source[s.id]?.length ?? 0) > 0 ? ' *' : ''}
          </option>
        ))}
      </Select>
    </Box>

    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Shortcuts')}</Box>
      <Box layerStyle='options_4cols'>
        <Button
          variant='menuconfigpanel_option_button'
          onClick={() => { setAttrForSource(valid_source, []); updateComponent() }}
        >{t('Menu.Transformation.unSelectAll')}</Button>
        <Button
          variant='menuconfigpanel_option_button'
          onClick={() => { setAttrForSource(valid_source, [...simple_attr]); updateComponent() }}
        >Basiques</Button>
        <Button
          variant='menuconfigpanel_option_button'
          onClick={() => { setAttrForSource(valid_source, [...all_attr]); updateComponent() }}
        >{t('Menu.Transformation.selectAll')}</Button>
      </Box>
    </Box>

    <UpdateModeGrid
      attrs={heredited}
      onToggle={key => {
        const next = heredited.includes(key)
          ? heredited.filter((k: string) => k !== key)
          : [...heredited, key]
        setAttrForSource(valid_source, next)
        updateComponent()
      }}
      t={t}
      show_expert_rows={true}
    />

    <Button
      onClick={() => {
        ;[default_main_sankey_id, ...app_data.views_order].forEach((source_id: string) => {
          const attrs = attrs_by_source[source_id]
          if (attrs && attrs.length > 0) {
            const source_da = app_data.getDrawingAreaFromViewId(source_id)
            if (source_da) updateFrom(drawing_area_plus, source_da, attrs)
          }
        })
        app_data.draw()
      }}
    >
      {t('view.updateViewWithMasterVar')}
    </Button>

  </Box>

  return <DraggableComponent
    nodeRef={nodeRef}
    handle='.title_menu'
    defaultPosition={{ x: window.innerWidth / 4, y: window.innerHeight / 4 }}
    bounds={drawingZoneDraggableBounds(app_data, nodeRef)}
  >
    <Box
      ref={nodeRef}
      layerStyle='menu_draggable_layout'
      hidden={!display_menu}
      position='absolute'
      minW='10vw'
      maxW='40vw'
      zIndex='2'
    >
      <Box className='title_menu' layerStyle='menu_draggable_title_layout'>
        <Text justifySelf='start' fontStyle='h1' margin='0'>
          {t('view.setTransparentAttr')}
        </Text>
        <CloseButton justifySelf='end' onClick={() => set_display_menu(false)} />
      </Box>
      <Box layerStyle='menu_draggable_content_layout'>
        {content}
      </Box>
    </Box>
  </DraggableComponent>
}

/**
 * Modal to generate unitary sankey either from local sankey or from excel file
 *
 * @param {*} { app_data }
 * @return {*}  {JSX.Element}
 */
export const ModalCreateUnitaryViewOSP: FC<BaseComponentPropsPlus> = (
  { app_data }
): JSX.Element => {

  const { t } = app_data

  const [display_menu, set_display_menu] = useState(false)
  const [, setUpdater] = useState(0)
  const [source_mode, set_source_mode] = useState<'local' | 'excel'>('local')
  const nodeRef = useRef(null)

  // Re-rendre (donc recalculer les bornes draggable) au toggle du tableur/doc.
  useEffect(() => {
    return app_data.menu_configuration.addMainZoneListener(() => setUpdater(a => a + 1))
  }, [])

  app_data.menu_configuration_osp.ref_show_modal_unitary_view.current = set_display_menu

  const updateComponent = () => {
    setUpdater(a => a + 1)
  }
  app_data.menu_configuration_osp.ref_update_modal_unitary_view.current = updateComponent

  const has_sankey_plus = app_data.has_sankey_plus
  if (!has_sankey_plus) return <></>

  return <DraggableComponent
    nodeRef={nodeRef}
    handle='.title_menu'
    defaultPosition={{ x: window.innerWidth / 3, y: window.innerHeight / 5 }}
    bounds={drawingZoneDraggableBounds(app_data, nodeRef)}
  >
    <Box
      ref={nodeRef}
      layerStyle='menu_draggable_layout'
      hidden={!display_menu}
      position='absolute'
      minW='28rem'
      maxW='36rem'
      w='32vw'
      zIndex='2'
    >
      <Box className='title_menu' layerStyle='menu_draggable_title_layout'>
        <Text justifySelf='start' fontStyle='h1' margin='0'>
          {t('view.create_unit')}
        </Text>
        <CloseButton justifySelf='end' onClick={() => set_display_menu(false)} />
      </Box>
      <Box layerStyle='menu_draggable_content_layout'>
        <Box layerStyle='menuconfigpanel_grid'>

          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>
              {t('Menu.Transformation.sourceType')}
            </Box>
            <Box layerStyle='options_2cols'>
              <Button
                variant={source_mode === 'local' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => set_source_mode('local')}
              >{t('view.unit_tab_local')}</Button>
              <Button
                variant={source_mode === 'excel' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => set_source_mode('excel')}
              >{t('view.unit_tab_excel')}</Button>
            </Box>
          </Box>

          <hr style={{ borderStyle: 'none', margin: '10px 0', color: 'grey', backgroundColor: 'grey', height: 2 }} />

          {source_mode === 'local'
            ? <TabLocalDataForUnitary app_data={app_data} />
            : <TabImportExcelDataForUnitary app_data={app_data} />}

        </Box>
      </Box>
    </Box>
  </DraggableComponent>
}

/**
 * Tab to create unitary sankey from local sankey
 *
 * @param {*} { app_data }
 * @return {*} 
 */
const TabLocalDataForUnitary: FC<{ app_data: Class_ApplicationDataOSP }> = ({ app_data }) => {
  const { t } = app_data
  const drawing_area_plus = app_data.drawing_area as Class_DrawingAreaOSP

  const list_selected_nodes_for_unitary = useRef<Class_NodeElement[]>([])
  const [, setUpdater] = useState(0)
  const entries_for_nodes: typeElementSelectable = drawing_area_plus.sankey.visible_nodes_list_sorted.map((d) => { return { 'label': d.name, 'value': d.id, selected: list_selected_nodes_for_unitary.current.includes(d) } })

  const updateComponent = () => {
    setUpdater(a => a + 1)
  }

  const has_level_taggs = Object.keys(drawing_area_plus.sankey.level_taggs_dict).length > 0

  return <Box display='grid' gridRowGap='0.4rem'>
    {has_level_taggs ? <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Config.element_level_tag')}</Box>
      <LevelTagFilter app_data={app_data} />
    </Box> : <></>}

    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Config.title_node')}</Box>
      <OSMultiSelect
        t={t}
        elements={entries_for_nodes}
        onClick={(entries: typeElementSelectable) => {
          const entries_values = entries.map(d => d.value)
          drawing_area_plus.sankey.nodes_list.forEach(n => {
            if (entries_values.includes(n.id) && !list_selected_nodes_for_unitary.current.includes(n)) {
              list_selected_nodes_for_unitary.current.push(n)
            } else if (!entries_values.includes(n.id) && list_selected_nodes_for_unitary.current.includes(n)) {
              const n_to_del = list_selected_nodes_for_unitary.current.indexOf(n)
              list_selected_nodes_for_unitary.current.splice(n_to_del, 1)
            }
          })
          updateComponent()
        }}
      />
    </Box>

    <Box display='flex' justifyContent='flex-end'>
      <OSTooltip label={list_selected_nodes_for_unitary.current.length === 0 ? t('view.dis_createFromSelected') : ''}>
        <Button
          variant='btn_create_unitary_from_nodes'
          isDisabled={list_selected_nodes_for_unitary.current.length === 0}
          onClick={() => {
            app_data.sendWaitingToast(
              () => {
                list_selected_nodes_for_unitary.current.forEach(element => {
                  createUnitaryNewView(app_data, element)
                })
                app_data.menu_configuration_osp.updateComponentRelatedToViews()
                app_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
              },
              {
                success: { title: t('toast.u_v_loaded') },
                loading: { title: t('toast.u_v_loading') }
              }
            )
          }}>
          {t('view.create')}
        </Button>
      </OSTooltip>
    </Box>
  </Box>
}

/**
 * Tab to create unitary sankey from sankey imported via excel file
 *
 * @param {*} { app_data }
 * @return {*}
 */
const TabImportExcelDataForUnitary = ({ app_data }: { app_data: Class_ApplicationDataOSP }) => {
  const { t } = app_data
  const ref_input_file = useRef<HTMLInputElement>(null)
  const [pending_files, set_pending_files] = useState<File[]>([])
  const [is_processing, set_is_processing] = useState(false)
  const [current_file_name, set_current_file_name] = useState<string>('')
  const [processed_count, set_processed_count] = useState(0)
  const [total_to_process, set_total_to_process] = useState(0)
  const [selected_data_id, set_selected_data_id] = useState<string>('')
  const [, setUpdate] = useState(0)
  const local_app_data = useRef<Class_ApplicationDataOSP>(new Class_ApplicationDataOSP(false))
  const list_data = useRef<{ [x: string]: { name: string, data: Type_JSON } }>({})
  const list_selected_nodes_for_unitary = useRef<Class_NodeElement[]>([])

  local_app_data.current.createNewMenuConfiguration()

  // Failesafe : si on a des données mais aucune sélection valide, basculer sur la première
  if (Object.keys(list_data.current).length > 0 && !(selected_data_id in list_data.current)) {
    list_selected_nodes_for_unitary.current = []
    const new_sel_key = Object.keys(list_data.current)[0]
    DrawingAreaPersistenceOSP.fromJSON(local_app_data.current.drawing_area as Class_DrawingAreaOSP, list_data.current[new_sel_key].data)
    set_selected_data_id(new_sel_key)
  }

  const entries_for_nodes: typeElementSelectable = local_app_data.current.drawing_area.sankey.visible_nodes_list_sorted.map((d) => ({ 'label': d.name, 'value': d.id, selected: list_selected_nodes_for_unitary.current.includes(d) }))
  const list_node_selected_data = local_app_data.current.drawing_area.sankey.visible_nodes_list_sorted

  // Upload + poll + retrieve pour un fichier
  const processOneFile = async (file: File): Promise<void> => {
    const root = window.location.origin
    set_current_file_name(file.name)

    // 1. Upload
    const form_data = new FormData()
    form_data.append('file', file)
    form_data.append('output_format', 'json')
    form_data.append('process_label', t('ProcessDialog.open_excel_file'))
    await fetch(root + '/opensankey/convert/launch', { method: 'POST', body: form_data })

    // 2. Poll jusqu'à la fin — arrêt piloté par le statut machine renvoyé par
    // le serveur (data.status), et non plus par le grep du texte localisé du log.
    await new Promise<void>(resolve => {
      const url_check = root + app_data.url_prefix + 'upload/check_process'
      const interval = setInterval(() => {
        fetch(url_check, { method: 'POST', body: '' }).then(r => {
          if (!r.ok) return
          r.json().then(data => {
            if (data.status === 'finished' || data.status === 'failed') {
              clearInterval(interval)
              resolve()
            }
          })
        })
      }, 2000)
    })

    // 3. Récupérer le résultat
    const response = await fetch(root + '/opensankey/upload/retrieve_result', { method: 'POST', body: new FormData() })
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer()
      const decompressed = await decompressGzipDataFixed(arrayBuffer)
      const jsonData = JSON.parse(decompressed)
      jsonData['version'] = local_app_data.current.version
      list_data.current[makeId('data_src_')] = { name: file.name, data: jsonData }
    }
  }

  // Traite la file séquentiellement (le serveur ne supporte qu'un job à la fois)
  const processQueue = async (files: File[]) => {
    set_is_processing(true)
    set_total_to_process(files.length)
    set_processed_count(0)
    for (let i = 0; i < files.length; i++) {
      await processOneFile(files[i])
      set_processed_count(i + 1)
    }
    set_is_processing(false)
    set_current_file_name('')
    set_pending_files([])
    if (ref_input_file.current) ref_input_file.current.value = ''
    setUpdate(a => a + 1)
  }

  const removeDataSource = (key: string) => {
    delete list_data.current[key]
    if (key === selected_data_id) {
      list_selected_nodes_for_unitary.current = []
      const remaining = Object.keys(list_data.current)
      if (remaining.length > 0) {
        DrawingAreaPersistenceOSP.fromJSON(local_app_data.current.drawing_area as Class_DrawingAreaOSP, list_data.current[remaining[0]].data)
        set_selected_data_id(remaining[0])
      } else {
        set_selected_data_id('')
      }
    }
    setUpdate(a => a + 1)
  }

  const nb_loaded = Object.keys(list_data.current).length

  return <Box display='grid' gridRowGap='0.4rem'>

    {/* Ligne fichier : label | [file input] [Ouvrir] */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Menu.Transformation.sourceFile')}
      </Box>
      <Box display='grid' gridTemplateColumns='1fr auto' gap='0.4rem' alignItems='center'>
        <Input
          type='file'
          accept='.xlsx'
          multiple
          size='sm'
          height='1.9rem'
          padding='0.15rem'
          ref={ref_input_file}
          isDisabled={is_processing}
          onChange={(evt: ChangeEvent) => {
            const files = (evt.target as HTMLInputElement).files
            set_pending_files(files ? Array.from(files) : [])
          }}
        />
        <Button
          size='sm'
          height='1.9rem'
          variant='menuconfigpanel_option_button_activated'
          isDisabled={is_processing || pending_files.length === 0}
          onClick={() => processQueue(pending_files)}
        >
          {is_processing
            ? `${processed_count}/${total_to_process}`
            : pending_files.length > 1
              ? `${t('Menu.ouvrir')} (${pending_files.length})`
              : t('Menu.ouvrir')}
        </Button>
      </Box>
    </Box>

    {/* État du traitement */}
    {is_processing ? <Box display='flex' alignItems='center' gap='0.4rem' fontSize='sm' color='gray.600' paddingLeft='0.4rem'>
      <Spinner size='xs' /><Text>{current_file_name}</Text>
    </Box> : <></>}

    {/* Liste compacte des sources chargées */}
    {nb_loaded > 0 ? <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('view.select_data_source')}
      </Box>
      <Box border='1px solid' borderColor='gray.200' borderRadius='4px' overflow='hidden'>
        {Object.entries(list_data.current).map(([key, data], idx, arr) => {
          const is_active = key === selected_data_id
          return <Box
            key={key}
            display='grid'
            gridTemplateColumns='1fr auto'
            alignItems='center'
            padding='0.15rem 0.4rem'
            gap='0.4rem'
            borderBottom={idx < arr.length - 1 ? '1px solid' : 'none'}
            borderBottomColor='gray.100'
            bg={is_active ? 'openSankey.50' : 'transparent'}
            cursor='pointer'
            _hover={{ bg: is_active ? 'openSankey.50' : 'gray.50' }}
            onClick={() => {
              if (key === selected_data_id) return
              list_selected_nodes_for_unitary.current = []
              DrawingAreaPersistenceOSP.fromJSON(local_app_data.current.drawing_area as Class_DrawingAreaOSP, list_data.current[key].data)
              set_selected_data_id(key)
            }}
          >
            <Text fontSize='sm' fontWeight={is_active ? '600' : '400'} isTruncated>{data.name}</Text>
            <CloseButton
              size='sm'
              onClick={(e) => { e.stopPropagation(); removeDataSource(key) }}
            />
          </Box>
        })}
      </Box>
    </Box> : <></>}

    {/* Choix des nœuds + génération */}
    {list_node_selected_data.length > 0 ? <>
      {Object.keys(local_app_data.current.drawing_area.sankey.level_taggs_dict).length > 0 ? <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Config.element_level_tag')}</Box>
        <LevelTagFilter app_data={local_app_data.current} />
      </Box> : <></>}

      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Config.title_node')}</Box>
        <OSMultiSelect
          t={t}
          elements={entries_for_nodes}
          onClick={(entries: typeElementSelectable) => {
            const entries_values = entries.map(d => d.value)
            local_app_data.current.drawing_area.sankey.nodes_list.forEach(n => {
              if (entries_values.includes(n.id) && !list_selected_nodes_for_unitary.current.includes(n)) {
                list_selected_nodes_for_unitary.current.push(n)
              } else if (!entries_values.includes(n.id) && list_selected_nodes_for_unitary.current.includes(n)) {
                const n_to_del = list_selected_nodes_for_unitary.current.indexOf(n)
                list_selected_nodes_for_unitary.current.splice(n_to_del, 1)
              }
            })
            setUpdate(a => a + 1)
          }}
        />
      </Box>

      <Box display='flex' justifyContent='flex-end'>
        <OSTooltip label={list_selected_nodes_for_unitary.current.length === 0 ? t('view.dis_createFromSelected') : ''}>
          <Button
            variant='btn_create_unitary_from_nodes'
            isDisabled={list_selected_nodes_for_unitary.current.length === 0}
            onClick={() => {
              app_data.sendWaitingToast(
                () => {
                  list_selected_nodes_for_unitary.current.forEach(element => {
                    createUnitaryNewView(local_app_data.current, element)
                  })
                  const app_data_json = local_app_data.current.toJSON()
                  app_data.viewsFromJSON(app_data_json)
                  app_data.menu_configuration_osp.updateComponentRelatedToViews()
                },
                {
                  success: { title: t('toast.u_v_loaded') },
                  loading: { title: t('toast.u_v_loading') }
                }
              )
            }}
          >
            {t('view.create')}
          </Button>
        </OSTooltip>
      </Box>
    </> : <></>}
  </Box>
}

// export const MenuEnregistrerViewOSP: FC<BaseComponentPropsPlus> = ({
//   app_data
// }) => {
//   const [, setCount] = useState(0)
//   const { t } = app_data
//   app_data.menu_configuration_osp.ref_to_save_diagram_only_view_updater.current = () => setCount(a => a + 1)

//   return (app_data.has_views && !app_data.is_view_master) ? <Checkbox
//     variant='menuconfigpanel_option_checkbox'
//     isChecked={
//       app_data.options_save_json.only_current_view
//     }
//     onChange={(evt) => {
//       app_data.options_save_json.only_current_view = evt.target.checked
//       app_data.menu_configuration.updateComponentSaveDiagramJSON()
//     }}>
//     <OSTooltip label={t('view.tooltips.buttonExportView')}>
//       {t('view.export')}
//     </OSTooltip>
//   </Checkbox> : <></>
// }

// export const MenuLoadViewOSP: FC<BaseComponentPropsPlus> = ({
//   app_data
// }) => {
//   const [, setCount] = useState(0)
//   const { t } = app_data
//   app_data.menu_configuration_osp.ref_to_load_diagram_only_view_updater.current = () => setCount(a => a + 1)

//   return (app_data.has_views && !app_data.is_view_master) ? <Checkbox
//     variant='menuconfigpanel_option_checkbox'
//     isChecked={
//       app_data.options_open_json.only_current_view
//     }
//     onChange={(evt) => {
//       app_data.options_open_json.only_current_view = evt.target.checked
//       app_data.menu_configuration.updateComponentLoadDiagramJSON()
//     }}>
//     <OSTooltip label={t('view.tooltips.buttonImportViewOnly')}>
//       {t('view.view_import')}
//     </OSTooltip>
//   </Checkbox> : <></>
// }

