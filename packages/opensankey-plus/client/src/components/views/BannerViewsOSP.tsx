// Standard libs
import React, { ChangeEvent, useRef } from 'react'
import {
  Box,
  Input,
  Menu as ChakraMenu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'

// OpenSankey Libs
import { makeId, Type_JSON } from '@terriflux/opensankey/src/types/Utils'
import { OSTooltip } from '@terriflux/opensankey/src/components/configmenus/MenuCommon'
import { compressJSONToGzip, decompressUploadedFileUniversal } from '@terriflux/opensankey/src/Persistence/UniversalJSONCompression'
import { retrieveJSONResults } from '@terriflux/opensankey/src/components/dialogs/PersistenceProcessDialog'
import { useModelBinding } from '@terriflux/opensankey/src/hooks/useModelBinding'
import { Class_DrawingAreaOSP } from '../../types/DrawingAreaOSP'
import { Class_ApplicationDataOSP } from '../../types/ApplicationDataOSP'
import { loadExcelFileAsSankeyJSON, logo_view } from './viewsShared'

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
  // #247 — re-render piloté par le modèle : slot updater + abonnement à la grande zone
  // (re-render au toggle du tableur/doc). Les deux sont relâchés au démontage.
  const refreshThis = useModelBinding(
    menu_configuration_osp.ref_to_banner_views_updater,
    refresh => app_data.menu_configuration.addMainZoneListener(refresh)
  )
  const drawing_area_plus = app_data.drawing_area as Class_DrawingAreaOSP

  menu_configuration_osp.ref_to_banner_views_opened.current = false

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
