// #1243 — Enregistrement des ONGLETS d'inspecteur de la couche OS (base).
//
// Grille unique (proposition validée sur l'issue) : l'inspecteur d'un élément
// est une rangée d'onglets fixes — Forme · Libellé · Valeur · Icône · Stock ·
// Infobulle — les mêmes pour tous les types (un onglet absent = non
// applicable). Les panneaux « Structure/Données » disparaissent : chaque
// donnée vit dans l'onglet de ce qu'elle alimente (la valeur du flux dans
// Valeur, le stock dans Stock, le nom/origine-destination dans l'EN-TÊTE
// d'identité rendu par InspectorPanel).
//
// La grille s'appuie sur MenuConfigurationAppearance (qui possède déjà les
// onglets shape/name_label/value_label/icon/stock, les conditions par type,
// la multi-sélection et les styles) piloté de l'extérieur via active_tab.
// Les couches supérieures (OSP : onglet Tags…) enregistrent les leurs.

import React from 'react'
import { Box, Button, Checkbox } from '@chakra-ui/react'
import { inspector_registry, INSPECTOR_TAB_VALUE_ID } from './InspectorRegistry'
import type { Class_ApplicationData } from '../../../types/ApplicationData'
import { SankeyNodeSelection, NodeMaterialBalanceCheckbox } from '../MenuElementsSelection'
import { MenuConfigurationAppearance } from '../MenuElementsAppearance'
import { MenuConfigurationLinksData } from '../SankeyMenuConfigurationLinksData'
import { ConfigMenuTextInput, OSTooltip, CustomFaEyeCheckIcon, WrapperBoxSubSectionMenu } from '../MenuCommon'
import { stripHtmlTags, isRichContent } from '../../dialogs/RichTextEditor'
import {
  NODE_TOOLTIP_BLOCKS, LINK_TOOLTIP_BLOCKS, tooltipBlockLabelKey,
  isTooltipBlockVisible, Type_TooltipHiddenBlocks
} from '../../../Elements/TooltipBlocks'
import { CONVERTER_CONFIGS } from '../../dialogs/PersistenceProcessDialogConfigs'
import {
  DrawingAreaConfig,
  LegendConfig,
  TitleConfig
} from '../SankeyMenuConfigurationLayout'

// Idempotent : `register` remplace par id, donc un double appel (hot reload,
// re-init) ne duplique rien. On garde une garde explicite pour lisibilité.
let _registered = false

// #1258 — accent de la zone spécialisée MFA (ambre, Chakra yellow.600).
const MFA_ACCENT = '#B7791F'

// Raccourci : un onglet d'apparence piloté (rangée d'onglets interne masquée,
// sélecteur masqué, portée propagée sur menu_for_style).
const appearanceTab = (
  tab: 'shape' | 'name_label' | 'value_label' | 'icon' | 'stock'
) => (app_data: Class_ApplicationData, scope: 'selection' | 'style') => (
  <MenuConfigurationAppearance
    app_data={app_data}
    menu_for_style={scope === 'style'}
    hide_selector
    hide_tabs
    active_tab={tab}
  />
)

export function registerBaseInspectorSections(): void {
  if (_registered) return
  _registered = true

  // `title` est une ZONE DE TEXTE (Class_ContainerElement.is_title) : elle a
  // donc les mêmes onglets d'apparence que les zones, plus un onglet « Titre »
  // pour ses réglages propres (visibilité, jetons data/view tag).
  const ELEMENT_TARGETS = ['node', 'link', 'container', 'title', 'mixed'] as const

  // ---- Onglet FORME (géométrie + habillage ; contient déjà u/v, attaches) --
  inspector_registry.register({
    id: 'os.tab.forme',
    target: [...ELEMENT_TARGETS],
    order: 10,
    overload_prefixes: ['shape'],
    hue: 'style',
    title: (app_data) => app_data.t('Menu.tabs.shape'),
    icon: (app_data) => app_data.icon_library.icon_tab_shape,
    render: appearanceTab('shape')
  })

  // ---- Onglet LIBELLÉ ------------------------------------------------------
  inspector_registry.register({
    id: 'os.tab.libelle',
    target: [...ELEMENT_TARGETS],
    order: 20,
    overload_prefixes: ['name_label'],
    hue: 'style',
    title: (app_data) => app_data.t('Menu.tabs.name'),
    icon: (app_data) => app_data.icon_library.icon_tab_label,
    render: appearanceTab('name_label')
  })

  // ---- Onglet VALEUR : la DONNÉE (valeur, type, incertitude, texte) au-dessus
  // de son AFFICHAGE (format, unité, position) — fusion de l'ex-« Data flux ».
  inspector_registry.register({
    id: INSPECTOR_TAB_VALUE_ID,
    target: ['node', 'link', 'mixed'],
    order: 30,
    overload_prefixes: ['value_label'],
    hue: 'data',
    title: (app_data) => app_data.t('Menu.tabs.value'),
    icon: (app_data) => app_data.icon_library.icon_tab_value,
    render: (app_data, scope) => (
      <>
        {/* #1258 — le panneau AFM (type de valeur, bornes, incertitude) et le
            bilan matière vivent désormais dans l'onglet MFA. */}
        {scope === 'selection' && app_data.drawing_area.selected_links_list.length > 0 && (
          <MenuConfigurationLinksData app_data={app_data} hide_selector hide_origin_dest hide_afm />
        )}
        {appearanceTab('value_label')(app_data, scope)}
      </>
    )
  })

  // ---- Onglet ICÔNE (OSP) --------------------------------------------------
  // #1258 — les ZONES (formes, zones de texte, titre) sont des Class_NodeBase :
  // elles portent une icône comme les nœuds, l'onglet leur est donc servi aussi.
  inspector_registry.register({
    id: 'os.tab.icone',
    target: ['node', 'container', 'title', 'mixed'],
    order: 40,
    overload_prefixes: ['icon'],
    hue: 'style',
    title: (app_data) => app_data.t('Menu.tabs.icon'),
    icon: (app_data) => app_data.icon_library.icon_tab_icon,
    gate: (app_data) => app_data.has_sankey_plus
      && (app_data.drawing_area.selected_nodes_list.length > 0
        || app_data.drawing_area.selected_containers_list.length > 0),
    render: appearanceTab('icon')
  })

  // ---- Onglet STOCK : données de stock + libellé de stock ------------------
  inspector_registry.register({
    id: 'os.tab.stock',
    target: ['node', 'mixed'],
    order: 50,
    overload_prefixes: ['stock_label'],
    hue: 'data',
    title: (app_data) => app_data.t('inspector.tab.stock'),
    icon: (app_data) => app_data.icon_library.icon_tab_stock,
    // Même gating que l'onglet historique (dev) ; il faut des nœuds pour
    // pouvoir ACTIVER un stock (l'œil « Activé » de l'en-tête).
    gate: (app_data) => app_data.has_sankey_dev
      && app_data.drawing_area.selected_nodes_list.length > 0,
    render: (app_data, scope) => <InspectorStockTab app_data={app_data} scope={scope} />
  })

  // ---- Onglet INFOBULLE (données pures — masqué en portée Style) -----------
  // Même pattern que les libellés : texte SIMPLE en ligne, éditeur complet
  // dans un panneau draggable (rien d'embarqué dans le menu de config).
  // Réintègre les tooltips, orphelins depuis que les entrées node/flow de
  // « presentation » ont été commentées dans ModulesOSP.
  inspector_registry.register({
    id: 'os.tab.infobulle',
    target: ['node', 'link', 'mixed'],
    order: 60,
    hue: 'data',
    title: (app_data) => app_data.t('inspector.tab.tooltip'),
    icon: (app_data) => app_data.icon_library.icon_tab_tooltip,
    // Pas data_only : la VISIBILITÉ des blocs (OS#1285) est un attribut de style,
    // éditable en portée Style ; le texte libre reste propre à la sélection.
    render: (app_data, scope) => <InspectorTooltipTab app_data={app_data} scope={scope} />
  })

  // ---- Onglet MFA : l'espace AFM unifié (#1258) ----------------------------
  // Rassemble ce qui était éclaté : bilan matière du nœud (ex-onglet Valeur),
  // données AFM du flux (type de valeur, bornes, incertitude — ex-sous-onglet
  // AFM de Valeur), et les actions globales (tableur des contraintes,
  // réconciliation). Teinté ambre : zone spécialisée, gated par la licence.
  inspector_registry.register({
    id: 'os.tab.mfa',
    target: ['node', 'link', 'mixed', 'view'],
    order: 70,
    hue: 'data',
    title: (app_data) => app_data.t('inspector.tab.mfa'),
    icon: (app_data) => app_data.icon_library.icon_afm,
    accent: MFA_ACCENT,
    data_only: true,
    gate: (app_data) => app_data.has_sankey_afm,
    render: (app_data) => <InspectorMFATab app_data={app_data} />
  })

  // ---- Onglet TITRE (réglages propres de la zone de texte « titre ») -------
  // Le titre sélectionné au canvas obtient Forme/Libellé (c'est une ZDT) PLUS
  // cet onglet : visibilité + insertion de jetons data/view tag.
  inspector_registry.register({
    id: 'os.tab.titre',
    target: 'title',
    order: 5,
    hue: 'data',
    title: (app_data) => app_data.t('inspector.tab.title'),
    icon: (app_data) => app_data.icon_library.icon_tab_title,
    data_only: true,
    render: (app_data) => <TitleConfig app_data={app_data} compact />
  })

  // ---- Cible LEGEND : SUPPRIMÉE (OS#1254) ----------------------------------
  // La légende n'est plus un objet unique sélectionnable : c'est un GÉNÉRATEUR
  // (Class_LegendConfig) qui produit des zones de texte. Ces zones se
  // sélectionnent comme des zones ordinaires -> cible `container`, rien de
  // spécifique à enregistrer. Ses PARAMÈTRES vivent dans l'onglet Légende de la
  // Vue (ci-dessous) — ce qui est cohérent : ils règlent la vue, pas un objet.

  // ---- Cible VIEW (aucune sélection) ---------------------------------------
  inspector_registry.register({
    id: 'os.view.drawing_area',
    target: 'view',
    order: 10,
    hue: 'style',
    title: (app_data) => app_data.t('Menu.Config.title_graph'),
    icon: (app_data) => app_data.icon_library.icon_tab_layout,
    // `extra_background_element` (import d'image de fond, injecté par OSP) était
    // passé par l'ex-ConfigContent de la matrice : on le relaie ici, sinon la
    // fonctionnalité disparaît avec elle.
    render: (app_data) => <DrawingAreaConfig
      app_data={app_data}
      extra_background_element={app_data.menu_configuration.additionalMenus.current.extra_background_element}
    />
  })

  inspector_registry.register({
    id: 'os.view.title',
    target: 'view',
    order: 20,
    hue: 'style',
    title: (app_data) => app_data.t('inspector.tab.title'),
    icon: (app_data) => app_data.icon_library.icon_tab_title,
    render: (app_data) => <TitleConfig app_data={app_data} compact />
  })

  // La légende est aussi éditable directement depuis la Vue (elle peut être
  // masquée et donc impossible à cliquer au canvas) : l'onglet embarque la
  // config complète — même composant que la cible « légende sélectionnée ».
  inspector_registry.register({
    id: 'os.view.legend',
    target: 'view',
    order: 30,
    hue: 'presentation',
    title: (app_data) => app_data.t('Menu.Config.element_legend'),
    icon: (app_data) => app_data.icon_library.icon_tab_legend,
    render: (app_data) => <LegendConfig app_data={app_data} compact />
  })
}

// #1243 — Onglet Stock : même structure d'en-tête que l'onglet Icône —
// tout en haut, l'œil « Activé » (has_stock, l'ex-case « Stock ») et, à
// droite, les bascules de visibilité Forme / Libellés (comme Icon/Image).
// Dessous : les données du stock puis la mise en forme des libellés.
const InspectorStockTab = ({ app_data, scope }: {
  app_data: Class_ApplicationData
  scope: 'selection' | 'style'
}) => {
  const { t, drawing_area, menu_configuration } = app_data
  const nodes = drawing_area.selected_nodes_list
  const first = nodes[0]
  const stock_nodes = nodes.filter(n => n.has_stock)
  const has_stock = first?.has_stock ?? false
  const refresh = () => {
    nodes.forEach(n => n.draw())
    menu_configuration.ref_to_save_in_cache_indicator.current(false)
    menu_configuration.updateAllComponentsRelatedToNodesConfig()
    menu_configuration.updateInspector()
  }
  const shape_visible = stock_nodes[0]?.stock_shape_is_visible ?? false
  const labels_visible = (stock_nodes[0]?.stock_label_is_visible as boolean | undefined) ?? false

  return <>
    {scope === 'selection' && (
      <Box display='flex' alignItems='center' justifyContent='space-between' gap={2}>
        <Checkbox
          variant='menuconfigpanel_part_title_1_checkbox'
          icon={<CustomFaEyeCheckIcon />}
          isChecked={has_stock}
          onChange={(e) => {
            nodes.forEach(n => { n.has_stock = e.target.checked; n.draw() })
            refresh()
          }}
        >
          {t('inspector.stock_enabled')}
        </Checkbox>
        <Box layerStyle='options_2cols' width='fit-content'>
          <OSTooltip label={app_data.t('inspector.stock_shape_tooltip')}>
            <Button
              variant={shape_visible ? 'menuconfigpanel_option_button_activated_left' : 'menuconfigpanel_option_button_left'}              isDisabled={stock_nodes.length === 0}
              onClick={() => {
                stock_nodes.forEach(n => { n.stock_shape_is_visible = !shape_visible; n.draw() })
                refresh()
              }}
            >
              {app_data.t('inspector.stock_shape')}
            </Button>
          </OSTooltip>
          <OSTooltip label={app_data.t('inspector.stock_labels_tooltip')}>
            <Button
              variant={labels_visible ? 'menuconfigpanel_option_button_activated_right' : 'menuconfigpanel_option_button_right'}              isDisabled={stock_nodes.length === 0}
              onClick={() => {
                stock_nodes.forEach(n => { n.stock_label_is_visible = !labels_visible; n.draw() })
                refresh()
              }}
            >
              {app_data.t('inspector.stock_labels')}
            </Button>
          </OSTooltip>
        </Box>
      </Box>
    )}
    {scope === 'selection' && (
      <SankeyNodeSelection app_data={app_data} hide_selector stock_only />
    )}
    {appearanceTab('stock')(app_data, scope)}
  </>
}

// #1258 — Onglet MFA : contextuel à la sélection.
// - Nœud(s)  : équilibre matière (contrainte de réconciliation).
// - Flux     : données AFM (type de valeur, bornes, incertitude).
// - Toujours : actions globales — tableur des contraintes, réconciliation via
//   le convertisseur universel (mêmes refs que le menu topbar AFM d'OSP).
//   Masquées en mode statique (diagramme publié : rien à résoudre).
const InspectorMFATab = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t, drawing_area, menu_configuration } = app_data
  const has_nodes = drawing_area.selected_nodes_list.length > 0
  const has_links = drawing_area.selected_links_list.length > 0

  const openSpreadsheet = () => {
    menu_configuration.main_zone_show_spreadsheet = true
  }
  const openReconciliation = () => {
    menu_configuration.ref_universal_converter_set_config.current(
      CONVERTER_CONFIGS['reconciliation'], '', false
    )
    menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_file_converter.current(true)
  }

  return <>
    {/* Bilan matière du nœud (ex-onglet Valeur) — se masque seul hors nœuds. */}
    {has_nodes && <NodeMaterialBalanceCheckbox app_data={app_data} />}

    {/* Données AFM du flux (ex-sous-onglet AFM de l'onglet Valeur). */}
    {has_links && (
      <MenuConfigurationLinksData app_data={app_data} hide_selector hide_origin_dest afm_only />
    )}

    {!app_data.is_static && (
      <WrapperBoxSubSectionMenu title={t('inspector.mfa.reconciliation')} new_data={app_data}>
        <Button
          variant='menuconfigpanel_option_button'
          size='xs'
          onClick={openSpreadsheet}
        >
          {t('inspector.mfa.open_spreadsheet')}
        </Button>
        <Button
          variant='menuconfigpanel_option_button'
          size='xs'
          onClick={openReconciliation}
        >
          {t('inspector.mfa.run_reconciliation')}
        </Button>
      </WrapperBoxSubSectionMenu>
    )}
  </>
}

// #1243 — Onglet Infobulle : MÊME interface que le Libellé — en-tête avec les
// boutons de MODE à droite (texte simple / texte riche), texte simple édité en
// ligne, le mode riche ouvrant l'éditeur complet en panneau draggable.
const InspectorTooltipTab = ({ app_data, scope }: { app_data: Class_ApplicationData, scope: 'selection' | 'style' }) => {
  const { t, drawing_area, history, menu_configuration, icon_library } = app_data
  const elements = [
    ...drawing_area.selected_nodes_list_sorted,
    ...drawing_area.selected_links_list_sorted
  ]
  const first = elements[0]
  const current = first?.tooltip_text ?? ''
  const content_is_rich = isRichContent(current)

  const applyText = (value: string | null | undefined) => {
    if (value === null || value === undefined) return
    const before = elements.map(el => ({ el, text: el.tooltip_text }))
    const apply = () => {
      elements.forEach(el => { el.tooltip_text = value })
      menu_configuration.ref_to_save_in_cache_indicator.current(false)
      menu_configuration.updateInspector()
    }
    const undo = () => {
      before.forEach(({ el, text }) => { el.tooltip_text = text })
      menu_configuration.updateInspector()
    }
    history.saveUndo(undo)
    history.saveRedo(apply)
    apply()
  }

  // Mode simple : ramène un éventuel contenu riche à du texte brut (même
  // bascule que les libellés). Mode riche : ouvre l'éditeur draggable.
  const setModeSimple = () => {
    if (content_is_rich) applyText(stripHtmlTags(current))
  }
  const setModeRich = () => {
    menu_configuration.dict_setter_show_dialog.ref_setter_show_tooltip_editor.current(true)
  }

  return <>
    {/* Texte libre : propre à l'élément → portée Sélection uniquement. */}
    {scope === 'selection' && <>
      <Box display='flex' alignItems='center' justifyContent='space-between' gap={2}>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Noeud.IB')}</Box>
        <Box layerStyle='options_2cols' width='fit-content'>
          <OSTooltip label={t('Menu.display_mode.tooltips.simple_text')}>
            <Button
              variant={!content_is_rich ? 'menuconfigpanel_option_button_activated_left' : 'menuconfigpanel_option_button_left'}            isDisabled={elements.length === 0}
              onClick={setModeSimple}
            >
              {icon_library.icon_text_mode_simple}
            </Button>
          </OSTooltip>
          <OSTooltip label={t('Menu.display_mode.tooltips.rich_text')}>
            <Button
              variant={content_is_rich ? 'menuconfigpanel_option_button_activated_right' : 'menuconfigpanel_option_button_right'}            isDisabled={elements.length === 0}
              onClick={setModeRich}
            >
              {icon_library.icon_text_mode_rich}
            </Button>
          </OSTooltip>
        </Box>
      </Box>
      {content_is_rich ? (
        // Contenu riche : édité dans le panneau (comme le libellé en mode riche).
        <Button
          variant='menuconfigpanel_option_button'
          size='xs'
          onClick={setModeRich}
        >
          {t('inspector.open_editor')}
        </Button>
      ) : (
        <ConfigMenuTextInput
          t={t}
          default_value={first ? stripHtmlTags(current) : ''}
          function_on_blur={applyText}
          disabled={elements.length === 0}
        />
      )}
    </>}

    {/* OS#1285 — visibilité des blocs de l'info-bulle (attribut de style). */}
    <TooltipBlocksToggles app_data={app_data} scope={scope} />
  </>
}

// OS#1285 — cases de visibilité des blocs d'info-bulle. Écrit l'attribut de style
// `tooltip_hidden_blocks` sur la sélection ou le style édité (undo), selon la portée.
type BlockTarget = { attributes: Record<string, unknown>, getElementProperty: (k: 'tooltip_hidden_blocks') => unknown }
const TooltipBlocksToggles = ({ app_data, scope }: { app_data: Class_ApplicationData, scope: 'selection' | 'style' }) => {
  const { t, drawing_area, history, menu_configuration } = app_data
  const nodes = drawing_area.selected_nodes_list
  const links = drawing_area.selected_links_list

  // Blocs pertinents selon les types sélectionnés (analysis dédupliqué).
  const block_ids: string[] = []
  if (nodes.length) NODE_TOOLTIP_BLOCKS.forEach(b => block_ids.push(b))
  if (links.length) LINK_TOOLTIP_BLOCKS.forEach(b => { if (!block_ids.includes(b)) block_ids.push(b) })
  if (block_ids.length === 0) return null

  const targets = (scope === 'style'
    ? [drawing_area.sankey.styles_dict[menu_configuration.ref_selected_style.current]].filter(Boolean)
    : [...nodes, ...links]) as unknown as BlockTarget[]
  const read_target = targets[0]
  const hidden = (read_target?.getElementProperty('tooltip_hidden_blocks') as Type_TooltipHiddenBlocks | undefined) ?? {}

  const setHidden = (block_id: string, hide: boolean) => {
    if (targets.length === 0) return
    const next: Type_TooltipHiddenBlocks = { ...hidden }
    if (hide) next[block_id] = true
    else delete next[block_id]
    const value = Object.keys(next).length ? next : undefined
    const before = targets.map(el => ({ el, v: el.attributes['tooltip_hidden_blocks'] }))
    const commit = () => {
      menu_configuration.ref_to_save_in_cache_indicator.current(false)
      menu_configuration.updateInspector()
    }
    const apply = () => { targets.forEach(el => { el.attributes['tooltip_hidden_blocks'] = value }); commit() }
    const undo = () => { before.forEach(({ el, v }) => { el.attributes['tooltip_hidden_blocks'] = v }); commit() }
    history.saveUndo(undo)
    history.saveRedo(apply)
    apply()
  }

  return <Box style={{ marginTop: '0.4rem' }}>
    <Box layerStyle='menuconfigpanel_option_name'>{t('inspector.tooltip_blocks.title')}</Box>
    <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', paddingTop: '0.2rem' }}>
      {block_ids.map(id => (
        <Checkbox
          key={id}
          size='sm'
          isChecked={isTooltipBlockVisible(hidden, id)}
          onChange={e => setHidden(id, !e.target.checked)}
        >
          <Box as='span' style={{ fontSize: '0.75rem' }}>{t(tooltipBlockLabelKey(id))}</Box>
        </Checkbox>
      ))}
    </Box>
  </Box>
}

