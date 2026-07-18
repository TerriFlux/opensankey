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
import { ConfigMenuTextInput, OSTooltip, CustomFaEyeCheckIcon } from '../MenuCommon'
import { stripHtmlTags, isRichContent } from '../../dialogs/RichTextEditor'
import {
  DrawingAreaConfig,
  LegendConfig,
  TitleConfig
} from '../SankeyMenuConfigurationLayout'

// Idempotent : `register` remplace par id, donc un double appel (hot reload,
// re-init) ne duplique rien. On garde une garde explicite pour lisibilité.
let _registered = false

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

/**
 * #285 — extensions de l'onglet VALEUR par une couche supérieure (clé = id,
 * idempotent au re-init/hot reload). OSP y loge les tags du flux et les
 * sous-valeurs : ils appartiennent aux données de valeur, pas à un onglet
 * « Tags » séparé (décision UX 2026-07-17).
 */
export const inspector_value_tab_extras: {
  [id: string]: (app_data: Class_ApplicationData, scope: string) => React.ReactNode
} = {}

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
    render: (app_data, scope) => (
      <>
        {scope === 'selection' && app_data.drawing_area.selected_links_list.length > 0 && (
          <MenuConfigurationLinksData app_data={app_data} hide_selector hide_origin_dest />
        )}
        {/* #285 — extensions de couche supérieure (OSP : tags du flux +
            sous-valeurs, à leur place parmi les données de valeur) */}
        {Object.entries(inspector_value_tab_extras).map(([id, render_extra]) => (
          <React.Fragment key={id}>{render_extra(app_data, scope)}</React.Fragment>
        ))}
        {/* Bilan matière : contrainte de réconciliation du NŒUD (pas du stock),
            à sa place parmi les données de valeur. Se masque seul (AFM/nœuds). */}
        {scope === 'selection' && (
          <NodeMaterialBalanceCheckbox app_data={app_data} />
        )}
        {appearanceTab('value_label')(app_data, scope)}
      </>
    )
  })

  // ---- Onglet ICÔNE (OSP) --------------------------------------------------
  inspector_registry.register({
    id: 'os.tab.icone',
    target: ['node', 'mixed'],
    order: 40,
    overload_prefixes: ['icon'],
    hue: 'style',
    title: (app_data) => app_data.t('Menu.tabs.icon'),
    gate: (app_data) => app_data.has_sankey_plus
      && app_data.drawing_area.selected_nodes_list.length > 0,
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
    data_only: true,
    render: (app_data) => <InspectorTooltipTab app_data={app_data} />
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
              variant={shape_visible ? 'menuconfigpanel_option_button_activated_left' : 'menuconfigpanel_option_button_left'}
              sx={{ padding: '4px', paddingInline: '0.5rem', minWidth: 'auto', height: 'auto' }}
              isDisabled={stock_nodes.length === 0}
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
              variant={labels_visible ? 'menuconfigpanel_option_button_activated_right' : 'menuconfigpanel_option_button_right'}
              sx={{ padding: '4px', paddingInline: '0.5rem', minWidth: 'auto', height: 'auto' }}
              isDisabled={stock_nodes.length === 0}
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

// #1243 — Onglet Infobulle : MÊME interface que le Libellé — en-tête avec les
// boutons de MODE à droite (texte simple / texte riche), texte simple édité en
// ligne, le mode riche ouvrant l'éditeur complet en panneau draggable.
const InspectorTooltipTab = ({ app_data }: { app_data: Class_ApplicationData }) => {
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
    <Box display='flex' alignItems='center' justifyContent='space-between' gap={2}>
      <Box layerStyle='menuconfigpanel_option_name'>{t('Noeud.IB')}</Box>
      <Box layerStyle='options_2cols' width='fit-content'>
        <OSTooltip label={t('Menu.display_mode.tooltips.simple_text')}>
          <Button
            variant={!content_is_rich ? 'menuconfigpanel_option_button_activated_left' : 'menuconfigpanel_option_button_left'}
            sx={{ padding: '4px', minWidth: 'auto', height: 'auto' }}
            isDisabled={elements.length === 0}
            onClick={setModeSimple}
          >
            {icon_library.icon_text_mode_simple}
          </Button>
        </OSTooltip>
        <OSTooltip label={t('Menu.display_mode.tooltips.rich_text')}>
          <Button
            variant={content_is_rich ? 'menuconfigpanel_option_button_activated_right' : 'menuconfigpanel_option_button_right'}
            sx={{ padding: '4px', minWidth: 'auto', height: 'auto' }}
            isDisabled={elements.length === 0}
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
  </>
}

