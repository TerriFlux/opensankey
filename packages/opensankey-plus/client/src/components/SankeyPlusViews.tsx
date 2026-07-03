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
  Menu as ChakraMenu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ButtonGroup,
  Spinner,
  Text,
  Checkbox,
  useToast,
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'

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
import { Class_ViewTagGroup } from '../deps/OpenSankey/types/TagGroup'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'
import { OSTooltip } from '../deps/OpenSankey/components/configmenus/MenuCommon'
import { mainZoneRightReservedPx } from '../deps/OpenSankey/components/spreadsheet/MainZoneTabs'
import { LevelTagFilter, TopbarNavSelect } from '../deps/OpenSankey/components/topmenus/Toolbar'
import { compressJSONToGzip, decompressGzipDataFixed, decompressUploadedFileUniversal } from '../deps/OpenSankey/Persistence/UniversalJSONCompression'
import { DrawingAreaPersistence } from '../deps/OpenSankey/Persistence/SankeyPersistence'
import { INPUT_ATTRIBUTES_CONFIG, OUTPUT_ATTRIBUTES_CONFIG, getDefaultInputOptions, getDefaultOutputOptions } from '../deps/OpenSankey/components/dialogs/PersistenceProcessDialogConfigs'
import { retrieveJSONResults } from '../deps/OpenSankey/components/dialogs/PersistenceProcessDialog'
import { createUnitaryNewView } from './UnitaryBoard'

// ===========================================================================
// Chargement d'un fichier Excel comme une vue du catalogue
// ---------------------------------------------------------------------------
// Le parsing Excel se fait côté serveur (SankeyExcelParser) : on POST le fichier
// à convert/launch (qui lance un thread de conversion), on poll
// upload/check_process jusqu'au statut 'finished'/'failed', puis on récupère le
// JSON résultat (gzip) via upload/retrieve_result — exactement la séquence du
// convertisseur universel (PersistenceProcessDialog), mais sans modale ni options.
// Le serveur ne gère qu'UN process à la fois → les Excel du catalogue sont
// traités séquentiellement (cf. boucle d'import de input_loader_json_catalog).
// ===========================================================================
export const loadExcelFileAsSankeyJSON = async (
  app_data: Class_ApplicationDataOSP,
  file: File
): Promise<Type_JSON> => {
  const origin = window.location.origin
  const url_prefix = app_data.url_prefix

  // Options par défaut identiques à celles du convertisseur (onglets nœuds/
  // données/TER + layout lus, autocorrections au défaut), chargement silencieux.
  const input_options = {
    ...getDefaultInputOptions(INPUT_ATTRIBUTES_CONFIG['base']),
    ...getDefaultInputOptions(INPUT_ATTRIBUTES_CONFIG['excel'])
  }
  const output_options = {
    ...getDefaultOutputOptions(OUTPUT_ATTRIBUTES_CONFIG['base']),
    ...getDefaultOutputOptions(OUTPUT_ATTRIBUTES_CONFIG['json'])
  }

  // 1. Lancement de la conversion (le serveur répond aussitôt, le thread tourne).
  const form_data = new FormData()
  form_data.append('file', file)
  form_data.append('input_format', 'excel')
  form_data.append('output_format', 'json')
  form_data.append('input_options', JSON.stringify(input_options))
  form_data.append('output_options', JSON.stringify(output_options))
  form_data.append('process_label', file.name)
  const launch_resp = await fetch(origin + url_prefix + 'convert/launch', { method: 'POST', body: form_data })
  if (!launch_resp.ok) {
    throw new Error('Excel « ' + file.name + ' » : échec du lancement (HTTP ' + launch_resp.status + ')')
  }

  // 2. Attente de la fin via le statut machine <logname>.status renvoyé par
  //    upload/check_process. On n'honore 'finished'/'failed' qu'après avoir vu
  //    'running' (ou passé 2 s) pour ignorer un statut résiduel d'une conversion
  //    précédente — le serveur ne réinitialise le statut qu'au démarrage du thread.
  await new Promise<void>((resolve, reject) => {
    const start_time = Date.now()
    const MAX_MS = 5 * 60 * 1000
    let seen_running = false
    const poll = setInterval(() => {
      fetch(origin + url_prefix + 'upload/check_process', { method: 'POST', body: '' })
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (!data) return
          if (data.status === 'running') seen_running = true
          const elapsed = Date.now() - start_time
          const settled = seen_running || elapsed > 2000
          if (data.status === 'finished' && settled) {
            clearInterval(poll)
            resolve()
          } else if (data.status === 'failed' && settled) {
            clearInterval(poll)
            reject(new Error('Excel « ' + file.name + ' » : la conversion a échoué (voir le fichier)'))
          } else if (elapsed > MAX_MS) {
            clearInterval(poll)
            reject(new Error('Excel « ' + file.name + ' » : délai de conversion dépassé'))
          }
        })
        .catch(() => { /* erreur transitoire : on retentera au prochain tick */ })
    }, 1000)
  })

  // 3. Récupération du JSON résultat (gzip), comme handleFinish du convertisseur.
  const result_resp = await fetch(origin + url_prefix + 'upload/retrieve_result', { method: 'POST', body: new FormData() })
  if (!result_resp.ok) {
    throw new Error('Excel « ' + file.name + ' » : récupération du résultat impossible (HTTP ' + result_resp.status + ')')
  }
  const buffer = await result_resp.arrayBuffer()
  const decompressed = await decompressGzipDataFixed(buffer)
  return JSON.parse(decompressed) as Type_JSON
}

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
  const { icon_add_element, icon_remove_element, icon_welcome, icon_attr_view, icon_copy, icon_locked } = icon_library
  const [, setCount] = useState(0)
  const refreshThis = () => {
    setCount(a => a + 1)
  }
  const drawing_area_plus = app_data.drawing_area as Class_DrawingAreaOSP

  menu_configuration_osp.ref_to_banner_views_opened.current = false
  menu_configuration_osp.ref_to_banner_views_updater.current = refreshThis

  // Re-render au toggle du tableur/doc (la navigation vit dans la topbar).
  useEffect(() => {
    return app_data.menu_configuration.addMainZoneListener(refreshThis)
  }, [])

  // Ref to trigger other components ----------------------------------------------------

  const ref_to_input_loader_json_catalog = useRef<HTMLInputElement>(null) as { current: HTMLInputElement; }

  // Local variables --------------------------------------------------------------------

  const has_sankey_plus = app_data.has_sankey_plus
  const has_views = app_data.has_views
  const is_view_master = app_data.is_view_master
  const is_editable = app_data.is_editable

  const logo_locked = <Box className='iconLocked'>
    {icon_locked}
  </Box>

  // ── Conditions d'activation (licence + contexte de la vue courante) ────────
  const can_manage = has_sankey_plus
  const in_named_view = has_views && !is_view_master   // vraie vue (pas le maître)

  // ── Handlers des actions de gestion de vues ───────────────────────────────
  // Retour au maître via le raccourci clavier déjà câblé (F7) dispatché sur document.
  const onReturnToMaster = () => {
    const evt_key_f7 = new KeyboardEvent('keydown', { key: 'F7' })
    if (document.onkeydown) document.onkeydown(evt_key_f7)
  }
  const onAddView = () => {
    // Crée une vue VIDE (indépendante du diagramme courant)
    const view_id = makeId('view')
    app_data.createNewView(view_id, t('view.new_view_name'), false)
    app_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
    app_data.setCurrentView(view_id)
    app_data.menu_configuration_osp.updateComponentRelatedToViews()
  }
  const onCopyView = () => {
    // Copie la vue courante dans une nouvelle vue
    const view_id = makeId('view')
    app_data.createNewView(view_id, 'Copie de ' + app_data.drawing_area.name, true)
    app_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
    app_data.setCurrentView(view_id)
    app_data.menu_configuration_osp.updateComponentRelatedToViews()
  }
  const onDeleteView = () => { app_data.deleteCurrentView() }
  const onOpenAttrTransfer = () => { menu_configuration_osp.ref_to_modal_view_attributes_switcher.current(true) }
  // Concept unifié vue ⊕ viewtag : (re)génère les vues light depuis les étiquettes de view tags.
  const onSyncViewsFromTags = () => { app_data.syncViewsFromViewTags(); refreshThis() }
  // Promotion light → heavy : la vue courante (light) acquiert une géométrie/style propre.
  const onPromoteView = () => { app_data.promoteViewToFull(app_data.current_view_id); refreshThis() }

  // Catalogue : ouvre le sélecteur de fichiers (JSON/Excel) importés comme vues.
  const onOpenCatalog = () => {
    if (ref_to_input_loader_json_catalog.current) {
      ref_to_input_loader_json_catalog.current.name = ''
      ref_to_input_loader_json_catalog.current.click()
    }
  }

  // Input to read JSON as a catalog of view (ie  JSON containing only views) ---------

  const input_loader_json_catalog = <Input
    type="file"
    multiple
    accept='.json,.json.gz,.gz,.xlsx,.xls,.xlsm'
    ref={ref_to_input_loader_json_catalog}
    style={{ display: 'none' }}
    onChange={(evt: ChangeEvent) => {
      const files = (evt.target as HTMLFormElement).files
      // Boucle séquentielle (async) : le JSON se lit côté client, l'Excel passe
      // par le serveur (un seul process à la fois → pas de parallélisme). Les
      // vues déjà présentes ne sont jamais effacées : on ne fait qu'ajouter des
      // vues (addViewsFromJSON concatène, createNewView crée une vue de plus).
      app_data.sendWaitingToast(
        async () => {
          drawing_area_plus.bypass_redraws = true
          let first_view_id: string | undefined
          for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const name = file.name.split('.')[0]
            const lower = file.name.toLowerCase()
            const is_excel = lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.xlsm')
            if (is_excel) {
              // Excel : parse serveur → JSON, puis chargement dans une vue NEUVE
              // avec la logique standard (mise en page + styles) en mode view_only.
              // createNewView rend la nouvelle vue courante ; retrieveJSONResults
              // (view_only) ne réinitialise QUE cette vue, sans toucher au maître
              // ni aux autres vues.
              const JSON_data = await loadExcelFileAsSankeyJSON(app_data, file as File)
              const view_id = makeId('view')
              app_data.createNewView(view_id, name, false)
              retrieveJSONResults(
                app_data,
                JSON_data,
                false /* apply_layout_current_sankey : laisse retrieveJSONResults choisir layout vs auto */,
                {} /* _kwargs */,
                app_data.layout_h_spacing ?? undefined,
                app_data.layout_v_spacing ?? undefined,
                app_data.layout_optimize_crossing,
                app_data.layout_sources_mode,
                app_data.layout_sinks_mode,
                undefined, undefined, undefined,
                true /* view_only */
              )
              if (first_view_id === undefined) first_view_id = view_id
            } else {
              // JSON/gz : lecture directe côté client.
              const JSON_data = await decompressUploadedFileUniversal(file) as unknown as Type_JSON
              // Si le fichier contient déjà des vues, on concatène toutes ses vues au catalogue.
              const nb_views_added = app_data.addViewsFromJSON(JSON_data)
              if (nb_views_added === 0) {
                // Sinon (diagramme simple sans vues), on emballe le fichier entier comme une vue unique.
                const view_id = makeId('view')
                app_data.createNewView(view_id, name, false)
                JSON_data.id = view_id
                app_data.views_dict[view_id].json = compressJSONToGzip(JSON_data)
                if (first_view_id === undefined) first_view_id = view_id
              }
            }
          }
          // Atterrir sur la première vue importée (rend aussi son contenu, les
          // branches « wrap » ci-dessus ne faisant que stocker le JSON).
          if (first_view_id !== undefined) app_data.setCurrentView(first_view_id)
          app_data.menu_configuration.updateAllMenuComponents()
          app_data.menu_configuration_osp.updateComponentRelatedToViews()
        })
    }}
  />

  // ── Élément du menu « Vue » avec gestion licence + tooltip ────────────────
  // Le wrapper Box permet au tooltip de s'afficher même quand le MenuItem est
  // désactivé (même approche que le menu Aide de la topbar).
  const viewMenuItem = (
    key: string,
    icon: JSX.Element,
    label: string,
    onClick: () => void,
    opts: { need_plus?: boolean; extra_disabled?: boolean } = {}
  ): JSX.Element => {
    const is_locked = !!opts.need_plus && !has_sankey_plus
    const disabled = is_locked || !!opts.extra_disabled
    const item = <MenuItem
      icon={
        <Box
          display='inline-flex'
          alignItems='center'
          justifyContent='center'
          boxSize='1.2rem'
          sx={{ '& svg': { width: '1.1rem', height: '1.1rem' } }}
        >
          {icon}
        </Box>
      }
      isDisabled={disabled}
      onClick={() => { if (!disabled) onClick() }}
    >
      <Box as='span' display='inline-flex' alignItems='center' gap='0.4rem'>
        {label}
        {is_locked ? logo_locked : null}
      </Box>
    </MenuItem>
    return is_locked
      ? <OSTooltip key={key} placement='right' label={t('Menu.sankeyOSPDisabled')}><Box>{item}</Box></OSTooltip>
      : <React.Fragment key={key}>{item}</React.Fragment>
  }

  // La gestion de vues n'existe que dans l'éditeur.
  if (!is_editable) return <></>

  // ── Menu déroulant « Vue » (gestion des vues) ─────────────────────────────
  // Dropdown topbar cohérent avec Fichier / Édition / Aide / AFM (même style
  // menu_button_subnav_style). Les mêmes actions restent dans le panneau de
  // configuration (ViewsConfig) pour la gestion détaillée. La NAVIGATION entre
  // vues (Préc./sélecteur/Suiv.) est rendue à part (cf. BannerViewNavOSP).
  return <>
    <ChakraMenu
      variant='menu_button_subnav_style'
      placement='bottom-start'
      id='views'
    >
      <OSTooltip placement='bottom' label={t('Menu.tooltips.view')}>
        <MenuButton>
          <Box gridColumn='1' gridColumnEnd='span 2' gridRow='1'>{logo_view}</Box>
          <Box gridColumn='1' gridRow='2'>{t('Menu.view')}</Box>
          <Box gridColumn='2' gridRow='2' height='1rem' width='1rem'>
            <ChevronDownIcon style={{ height: '1rem', width: '1rem' }} />
          </Box>
        </MenuButton>
      </OSTooltip>
      <MenuList>
        {viewMenuItem('home', icon_welcome, t('Menu.home'), onReturnToMaster, { extra_disabled: !in_named_view })}
        <MenuDivider />
        {viewMenuItem('add', icon_add_element, t('Menu.addView'), onAddView, { need_plus: true })}
        {viewMenuItem('copy', icon_copy, t('Menu.cloneView'), onCopyView, { need_plus: true })}
        {viewMenuItem('delete', icon_remove_element, t('view.delete'), onDeleteView, { need_plus: true, extra_disabled: !in_named_view })}
        <MenuDivider />
        {viewMenuItem('catalog', icon_copy, t('view.catalog'), onOpenCatalog, { need_plus: true })}
        {viewMenuItem('attr', icon_attr_view, t('view.keep_master_var'), onOpenAttrTransfer, { need_plus: true, extra_disabled: !in_named_view })}
        <MenuDivider />
        {/* Concept unifié vue ⊕ viewtag : générer les vues depuis les étiquettes + promotion light→heavy */}
        {viewMenuItem('sync_tags', icon_add_element, t('view.sync_from_tags'), onSyncViewsFromTags, { need_plus: true })}
        {viewMenuItem('promote', icon_attr_view, t('view.promote'), onPromoteView, { need_plus: true, extra_disabled: !in_named_view || !app_data.is_current_view_light })}
      </MenuList>
    </ChakraMenu>
    {can_manage ? input_loader_json_catalog : <></>}
  </>
}

/**
 * Navigation entre vues (Préc. / sélecteur / Suiv.), rendue dans un bloc topbar
 * distinct du menu déroulant « Vues » (placée après « Aide »). Tout le bloc est
 * masqué tant qu'aucune vue n'existe : il n'y a alors rien à parcourir ni à
 * sélectionner (le sélecteur retomberait sur un champ vide).
 */
export const BannerViewNavOSP = ({ app_data }: { app_data: Class_ApplicationDataOSP }) => {
  const { t, menu_configuration_osp, drawing_area } = app_data
  const [, setCount] = useState(0)
  const refreshThis = () => setCount(a => a + 1)
  menu_configuration_osp.ref_to_banner_view_nav_updater.current = refreshThis

  // Re-render au toggle du tableur/doc (recentrage topbar).
  useEffect(() => {
    return app_data.menu_configuration.addMainZoneListener(refreshThis)
  }, [])

  const has_views = app_data.has_views
  const has_view_before = app_data.has_view_before
  const has_view_after = app_data.has_view_after

  // Pas de vues → rien à naviguer : on masque tout le bloc (et donc Préc./Suiv.).
  if (!has_views) return <></>

  const onPrevView = () => {
    const tmp = new KeyboardEvent('keydown', { key: 'F8' })
    if (document.onkeydown) document.onkeydown(tmp)
  }
  const onNextView = () => {
    const tmp = new KeyboardEvent('keydown', { key: 'F9' })
    if (document.onkeydown) document.onkeydown(tmp)
  }

  // Titre du bloc, calé en petit au-dessus du sélecteur (même mise en page que les
  // data tags en topbar) : nom du groupe de view tags s'il en existe un, sinon libellé
  // générique « Vues par défaut ».
  const view_taggs = drawing_area.sankey.getTagGroupsAsList('view_taggs') as unknown as Class_ViewTagGroup[]
  const title = view_taggs.length > 0 ? view_taggs[0].name : t('view.banner_default_title')

  // Options / valeur du sélecteur : ordre de navigation (le maître y figure en tête si l'option
  // show_master_in_views est active). Le maître courant reste toujours représentable même masqué.
  const master_name = app_data.master_view_name || t('view.actual')
  const viewLabel = (id: string) => id === default_main_sankey_id
    ? master_name
    : (app_data.views_dict[id]?.name ?? id)
  const value = (
    Object.keys(app_data.views_dict).includes(app_data.current_view_id) &&
    app_data.current_view_id !== default_main_sankey_id
  ) ? app_data.current_view_id : default_main_sankey_id
  const options = app_data.views_navigation_order.map(id => ({ value: id, label: viewLabel(id) }))
  if (!options.some(o => o.value === value)) options.unshift({ value, label: viewLabel(value) })

  const select = (view: string) => {
    app_data.setCurrentView(view)
    // Update views components (without updating save in cache button)
    app_data.menu_configuration_osp.updateComponentRelatedToViews()
  }

  return <Box className='BannerViewNav'>
    <TopbarNavSelect
      t={t}
      prefix={title}
      select_label={title}
      value={value}
      options={options}
      onChange={select}
      onPrev={onPrevView}
      onNext={onNextView}
      prev_disabled={!has_view_before}
      next_disabled={!has_view_after}
    />
  </Box>
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
  const [s_select_or_edit, sSelectOrEdit] = useState<'edit' | 'select'>('select')

  const has_sankey_plus = app_data.has_sankey_plus
  const has_views = app_data.has_views
  const is_view_master = app_data.is_view_master
  const master_name = app_data.master_view_name || app_data.t('view.actual')

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
      // Identité LOGIQUE de la vue courante (une vue light réutilise la DA maître, donc
      // cur_view.id vaudrait le maître ; current_view_id reflète la vraie vue sélectionnée).
      Object.keys(app_data.views_dict).includes(app_data.current_view_id) && app_data.current_view_id !== default_main_sankey_id
        ? app_data.current_view_id
        : default_main_sankey_id
    }
  >
    {/* Maître non listé (option désactivée) : placeholder caché pour que la valeur courante
        « maître » reste affichable sans polluer la liste. */}
    {!app_data.show_master_in_views &&
      <option value={default_main_sankey_id} disabled hidden>{master_name}</option>}
    {
      app_data.views_navigation_order
        .map((view, i) => {
          const is_master_option = view === default_main_sankey_id
          return <option
            key={i}
            value={view}
            style={is_master_option ? { fontStyle: 'italic', backgroundColor: '#e2e8f0' } : undefined}
          >
            {is_master_option ? master_name : app_data.views_dict[view].name}
          </option>
        })
    }
  </Select>

  const text_input = <ConfigMenuTextInput
    t={app_data.t}
    default_value={app_data.views_dict[app_data.current_view_id]?.name}
    function_on_blur={(_) => {
      // Update text for links
      if ((_ !== undefined) && (_ !== null)) {
        app_data.views_dict[app_data.current_view_id].name = _
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
  const list_view = app_data.views_navigation_order // maître en tête si show_master_in_views

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
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('view.show_master_in_list')}
        </Box>
        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          isDisabled={!is_activated}
          isChecked={app_data.show_master_in_views}
          onChange={() => {
            app_data.show_master_in_views = !app_data.show_master_in_views
            menu_configuration_osp.updateComponentRelatedToViews()
            refreshThis()
          }}
        />
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
            const is_master = view_id == default_main_sankey_id
            return (
              <React.Fragment key={idx}>
                <Tr style={{ 'border': (view_id === curr_view.id) ? '2px solid #5a9282' : 'none' }}>
                  <Td>
                    <Input
                      variant='menuconfigpanel_option_input'
                      // Maître : libellé éditable dédié (master_view_name), placeholder = défaut.
                      value={is_master ? app_data.master_view_name : app_data.views_dict[view_id].name}
                      placeholder={is_master ? t('view.actual') : undefined}
                      isDisabled={!is_activated}
                      onChange={evt => {
                        if (is_master) app_data.master_view_name = evt.target.value
                        else app_data.views_dict[view_id].name = evt.target.value
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
          <Box fontSize='sm' color='gray.500' mt='0.5rem'>
            {t('view.never_ask_hint')}
          </Box>
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button
              variant='menuconfigpanel_del_button'
              onClick={() => {
                // Discard this view's changes AND remember the choice for the
                // session: subsequent view switches discard silently (no modal),
                // until the cache cloud icon re-enables this dialog.
                app_data.menu_configuration.ref_to_never_save_view_session.current(true)
                app_data.resetViewWithOriginal()
                setShowModal(false)
              }}
            >
              {t('view.never_ask')}
            </Button>
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

  const toast = useToast()
  local_app_data.current.createNewMenuConfiguration(toast)

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

