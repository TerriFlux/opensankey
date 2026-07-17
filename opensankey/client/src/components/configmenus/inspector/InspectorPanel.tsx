// #1243 — Inspecteur piloté par la sélection : la « grille unique ».
//
// Structure (proposition validée sur l'issue) :
//   fil d'Ariane  →  EN-TÊTE D'IDENTITÉ  →  portée (Sélection / Styles)  →
//   rangée d'ONGLETS fixes  →  contenu de l'onglet actif.
//
// - L'identité (nom / origine→destination) n'est pas un onglet.
// - Le canvas est le sélecteur : aucun sélecteur d'éléments ici, pas de
//   création (gestes canvas).
// - Un élément suit une CASCADE de styles : la portée « Styles (N) » liste la
//   cascade et on choisit LEQUEL éditer (ref_selected_style). En portée Style,
//   les onglets 100% données (data_only) disparaissent, ainsi que les blocs
//   de données des onglets mixtes (les render() reçoivent la portée).
// - Multi-sélection : règle du modèle (lecture 1er, écriture tous) ; le
//   multi-type garde les mêmes onglets, chaque bloc s'applique à son
//   sous-ensemble.

import React, { useRef, useState } from 'react'
import { Box, Button, Input, Menu, MenuButton, MenuItem, MenuList, Text } from '@chakra-ui/react'
import { FaThumbtack } from 'react-icons/fa'

import type { Class_ApplicationData } from '../../../types/ApplicationData'
import { default_style_id } from '../../../types/Utils'
import { elementStyleConfigs } from '../../../Elements/ElementStyle'
import type { Class_ElementStyle } from '../../../Elements/Element'
import { ALL_ATTRIBUTES_CONFIG } from '../../../Elements/ElementsAttributesConfig'
import { useModelBinding } from '../../../hooks/useModelBinding'
import { default_font_size } from '../../../css/Theme'
import {
  resolveInspectorTarget,
  type Type_InspectorTarget,
  type Type_SelectionCounts
} from './InspectorResolver'
import {
  inspector_registry,
  type Type_InspectorScope
} from './InspectorRegistry'
import { registerBaseInspectorSections } from './registerBaseSections'
import { ElementNameRow } from '../MenuElementsSelection'
import { LinkOriginDestEditor } from '../SankeyMenuConfigurationLinksData'

// Enregistre les onglets de base dès l'import du panneau (idempotent). Les
// couches supérieures enregistreront les leurs à leur propre init.
registerBaseInspectorSections()

// Libellés des cibles (i18n : inspector.target.*). `one` = singulier du fil
// d'Ariane, `many` = pluriel accompagné du compte (« 3 nœuds »).
const TARGET_I18N: Record<Type_InspectorTarget, { one: string; many: string }> = {
  view: { one: 'view', many: 'view' },
  node: { one: 'node', many: 'nodes' },
  link: { one: 'link', many: 'links' },
  container: { one: 'container', many: 'containers' },
  legend: { one: 'legend', many: 'legends' },
  title: { one: 'title', many: 'titles' },
  mixed: { one: 'mixed', many: 'elements' }
}
const targetNoun = (
  app_data: Class_ApplicationData,
  target: Type_InspectorTarget,
  plural = false
) => app_data.t('inspector.target.' + TARGET_I18N[target][plural ? 'many' : 'one'])

/**
 * Décompte la sélection courante par type, pour le résolveur.
 */
function readSelectionCounts(app_data: Class_ApplicationData): Type_SelectionCounts {
  const da = app_data.drawing_area
  const legend_selected = da.selected_elements_list.some(e => e === da.legend)
  // #1243 — le titre EST une zone de texte (Class_ContainerElement.is_title) :
  // le cliquer au canvas le sélectionne déjà. On le compte à part pour que
  // l'inspecteur le nomme « Titre » et lui serve ses réglages propres
  // (visibilité, jetons data/view tag) plutôt que ceux d'une zone quelconque.
  const containers = da.selected_containers_list
  const title_selected = containers.some(c => c.is_title)
  return {
    nodes: da.selected_nodes_list.length,
    links: da.selected_links_list.length,
    containers: containers.filter(c => !c.is_title).length,
    legend: legend_selected,
    title: title_selected
  }
}

/**
 * Premier élément stylable de la sélection : porteur de la cascade affichée
 * par la portée Styles.
 */
function firstStyledElement(app_data: Class_ApplicationData) {
  const da = app_data.drawing_area
  return da.selected_nodes_list[0] ?? da.selected_links_list[0] ?? null
}

/**
 * #1243 — Roll-up de surcharge au niveau d'un ONGLET : true si au moins un
 * attribut stylable de l'onglet (préfixes déclarés au registre) est surchargé
 * sur la cible courante (sélection, ou style édité en portée Styles).
 * undefined = onglet sans attributs stylables (Infobulle…) ou hors sujet.
 */
function tabOverloadRollup(
  app_data: Class_ApplicationData,
  prefixes: string[] | undefined,
  scope: Type_InspectorScope
): boolean | undefined {
  if (!prefixes || prefixes.length === 0) return undefined
  const da = app_data.drawing_area
  const targets = scope === 'style'
    ? [da.sankey.styles_dict[app_data.menu_configuration.ref_selected_style.current]].filter(Boolean)
    : [...da.selected_nodes_list, ...da.selected_links_list, ...da.selected_containers_list]
  if (targets.length === 0) return undefined
  const keys = Object.keys(ALL_ATTRIBUTES_CONFIG)
    .filter(k => prefixes.some(p => k === p || k.startsWith(p + '_')))
  return targets.some(el =>
    keys.some(k => el.isAttributeOverloaded(k as Parameters<typeof el.isAttributeOverloaded>[0])))
}

export const InspectorPanel = ({ app_data }: { app_data: Class_ApplicationData }) => {
  // Re-render sur chaque changement de composition de sélection.
  const refreshThis = useModelBinding(app_data.menu_configuration.ref_to_inspector_updater)

  // Fil d'Ariane : atteindre la Vue sans purger la sélection.
  const [view_override, setViewOverride] = useState(false)
  // Portée d'édition : sélection vs style de la cascade.
  const [scope, setScope] = useState<Type_InspectorScope>('selection')
  // Onglet actif (id d'entrée du registre).
  const [active_tab_id, setActiveTabId] = useState<string | null>(null)

  const counts = readSelectionCounts(app_data)
  const { target, count } = resolveInspectorTarget(counts, view_override)

  // Réinitialise portée/fil d'Ariane quand la composition de la sélection
  // change (une nouvelle sélection doit montrer l'élément, portée Sélection).
  const sig = `${counts.nodes}/${counts.links}/${counts.containers}/${counts.legend}/${counts.title}`
  const last_sig = useRef(sig)
  if (last_sig.current !== sig) {
    last_sig.current = sig
    if (view_override) setViewOverride(false)
    if (scope === 'style') setScope('selection')
    // #1243 — ouvrir sur le premier onglet « violet » (contenant au moins une
    // surcharge) : on montre d'abord ce qui a été personnalisé. Sinon null →
    // retombe sur le premier onglet applicable.
    const first_violet = inspector_registry.getSectionsFor(target, app_data)
      .find(tb => tabOverloadRollup(app_data, tb.overload_prefixes, 'selection') === true)
    setActiveTabId(first_violet ? first_violet.id : null)
  }

  // Onglets applicables : registre filtré par cible + gating ; en portée
  // Style, les onglets 100% données disparaissent (R2).
  const tabs = inspector_registry.getSectionsFor(target, app_data)
    .filter(tab => scope === 'selection' || !tab.data_only)
  const active_tab = tabs.find(tab => tab.id === active_tab_id) ?? tabs[0] ?? null
  // Portée Styles aussi en sélection hétérogène (nœud+flux) : les styles sont
  // PARTAGÉS entre types (même styles_list, défaut commun) — la note
  // « cascades divergentes » de la cascade couvre l'ambiguïté d'affichage.
  const scope_capable = (target === 'node' || target === 'link' || target === 'mixed')
    && firstStyledElement(app_data) !== null

  return (
    <Box
      className="inspector_panel"
      style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', height: '100%' }}
    >
      <Box style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <InspectorBreadcrumb
            app_data={app_data}
            target={target}
            count={count}
            has_selection={counts.nodes + counts.links + counts.containers > 0 || counts.legend}
            view_override={view_override}
            onGoView={() => setViewOverride(true)}
            onGoSelection={() => setViewOverride(false)}
          />
        </Box>
        {/* #1243 — épingler : docke le panneau à droite (réserve sa largeur,
            le dessin se recadre) pour l'édition intense ; dé-épinglé = overlay. */}
        <Button
          size='xs'
          variant={app_data.menu_configuration.config_panel_pinned
            ? 'menuconfigpanel_option_button_activated'
            : 'menuconfigpanel_option_button'}
          sx={{ paddingInline: '0.3rem', minWidth: 'auto', width: 'auto', flex: 'none' }}
          title={app_data.menu_configuration.config_panel_pinned
            ? app_data.t('inspector.unpin')
            : app_data.t('inspector.pin')}
          onClick={() => {
            const mc = app_data.menu_configuration
            const next_pinned = !mc.config_panel_pinned
            // Dé-épingler : le panneau redevient un OVERLAY au même coin que le
            // tiroir de filtres — on referme ce dernier pour ne pas les
            // superposer (l'exclusivité des overlays reprend, cf. setConfigOpen).
            if (!next_pinned) mc.ref_close_filter_drawer.current(false)
            mc.config_panel_pinned = next_pinned
          }}
        >
          <FaThumbtack style={{
            transform: app_data.menu_configuration.config_panel_pinned ? 'none' : 'rotate(45deg)'
          }} />
        </Button>
      </Box>

      <InspectorIdentity app_data={app_data} target={target} counts={counts} />

      {scope_capable && (
        <InspectorScopeBand
          app_data={app_data}
          count={count}
          scope={scope}
          onScope={setScope}
          onCascadeChange={refreshThis}
        />
      )}

      {/* Légende de lecture — pour TOUTE cible élément (y compris mixte, qui
          n'a pas de bandeau de portée) : dire d'où viennent les valeurs. */}
      {scope === 'selection'
        && (target === 'node' || target === 'link' || target === 'container' || target === 'mixed') && (
        <Text style={{ fontSize: default_font_size, opacity: 0.75, padding: '0 0.1rem' }}>
          {app_data.t('inspector.selection_hint')}
        </Text>
      )}

      {/* Rangée d'onglets fixes — la même grille pour tous les types. Grille à
          N colonnes égales (le variant du thème met width:100%, un flex-wrap
          empilerait donc les boutons l'un sous l'autre).
          Roll-up de surcharge : liseré violet = l'onglet contient au moins un
          attribut surchargé ; retrait = aucun (sauf l'onglet actif). */}
      {tabs.length > 1 && (
        <Box style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
          gap: '0.15rem',
          padding: '2px'
        }}>
          {tabs.map(tab => {
            const rollup = tabOverloadRollup(app_data, tab.overload_prefixes, scope)
            const is_active = tab.id === active_tab?.id
            return (
              <Button
                key={tab.id}
                size='xs'
                variant={is_active
                  ? 'menuconfigpanel_option_button_activated'
                  : 'menuconfigpanel_option_button'}
                sx={{
                  paddingInline: '0.25rem',
                  minWidth: 'auto',
                  ...(rollup === true
                    ? { boxShadow: '0 0 0 1.5px rgba(128, 90, 213, 0.7)' }
                    : {}),
                  ...(!is_active && rollup !== true
                    ? { opacity: 0.65, '&:hover': { opacity: 1 } }
                    : {})
                }}
                title={rollup === true ? app_data.t('inspector.tab_overloaded') : undefined}
                onClick={() => setActiveTabId(tab.id)}
              >
                {tab.title(app_data)}
              </Button>
            )
          })}
        </Box>
      )}

      <Box style={{ overflowY: 'auto', flex: 1 }}>
        {active_tab ? (
          active_tab.render(app_data, scope)
        ) : (
          <Box layerStyle="empty_config_text" textStyle="h2">
            <span>{app_data.t('inspector.nothing_here', { target: targetNoun(app_data, target) })}</span>
          </Box>
        )}
      </Box>
    </Box>
  )
}

// --- Fil d'Ariane ----------------------------------------------------------

// Lien discret du fil d'Ariane. Bouton natif stylé inline : les variants Button
// du thème Chakra (pensés pour la matrice) rendent ici des pilules pleine
// largeur — on n'en veut aucun.
const CrumbButton = ({ onClick, children }: React.PropsWithChildren<{ onClick: () => void }>) => (
  <Box
    as="button"
    onClick={onClick}
    style={{
      background: 'none',
      border: 'none',
      padding: 0,
      font: 'inherit',
      color: '#1f6fae',
      cursor: 'pointer',
      textDecoration: 'underline'
    }}
  >
    {children}
  </Box>
)

const InspectorBreadcrumb = ({
  app_data, target, count, has_selection, view_override, onGoView, onGoSelection
}: {
  app_data: Class_ApplicationData
  target: Type_InspectorTarget
  count: number
  has_selection: boolean
  view_override: boolean
  onGoView: () => void
  onGoSelection: () => void
}) => {
  const showing_view = target === 'view'
  const sel_label =
    count > 1
      ? `${count} ${targetNoun(app_data, target, true)}`
      : targetNoun(app_data, target)

  return (
    <Box
      className="inspector_breadcrumb"
      style={{
        display: 'flex', alignItems: 'center', gap: '0.25rem',
        fontSize: default_font_size, padding: '0.15rem 0.1rem'
      }}
    >
      {showing_view ? (
        <>
          <Text as="span" style={{ fontWeight: 600 }}>{app_data.t('inspector.view')}</Text>
          {has_selection && view_override && (
            <>
              <Text as="span" style={{ opacity: 0.5 }}>›</Text>
              <CrumbButton onClick={onGoSelection}>
                {app_data.t('inspector.back_to_selection')}
              </CrumbButton>
            </>
          )}
        </>
      ) : (
        <>
          <CrumbButton onClick={onGoView}>{app_data.t('inspector.view')}</CrumbButton>
          <Text as="span" style={{ opacity: 0.5 }}>›</Text>
          <Text as="span" style={{ fontWeight: 600 }}>{sel_label}</Text>
        </>
      )}
    </Box>
  )
}

// --- En-tête d'identité ------------------------------------------------------

// L'identité n'est pas un onglet : nom pour nœud/zone, origine→destination
// pour un flux (sélection unique — désactivé sinon, comme les composants
// sous-jacents le garantissent déjà).
const InspectorIdentity = ({ app_data, target, counts }: {
  app_data: Class_ApplicationData
  target: Type_InspectorTarget
  counts: Type_SelectionCounts
}) => {
  const da = app_data.drawing_area

  if (target === 'node') {
    return <ElementNameRow
      app_data={app_data}
      elements={da.selected_nodes_list_sorted}
      labelKey='Noeud.Nom'
      tooltipKey='Noeud.tooltips.Nom'
    />
  }
  if (target === 'container') {
    return <ElementNameRow
      app_data={app_data}
      elements={da.selected_containers_list_sorted}
      labelKey='Container.Nom'
      tooltipKey='Container.tooltips.Nom'
    />
  }
  if (target === 'link') {
    return <LinkOriginDestEditor
      app_data={app_data}
      refresh={() => {
        app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
        app_data.menu_configuration.updateAllComponentsRelatedToLinks()
      }}
    />
  }
  if (target === 'mixed') {
    const parts: string[] = []
    if (counts.nodes) parts.push(`${counts.nodes} nœud(s)`)
    if (counts.links) parts.push(`${counts.links} flux`)
    if (counts.containers) parts.push(`${counts.containers} zone(s)`)
    if (counts.legend) parts.push('légende')
    return (
      <Text style={{ fontSize: default_font_size, fontWeight: 600, padding: '0 0.1rem' }}>
        {parts.join(' + ')}
      </Text>
    )
  }
  return <></>
}

// --- Bandeau de portée + cascade de styles -----------------------------------

const InspectorScopeBand = ({
  app_data, count, scope, onScope, onCascadeChange
}: {
  app_data: Class_ApplicationData
  count: number
  scope: Type_InspectorScope
  onScope: (s: Type_InspectorScope) => void
  onCascadeChange: () => void
}) => {
  const menu_configuration = app_data.menu_configuration
  const first = firstStyledElement(app_data)
  // Cascade du premier élément : ordre d'application (le dernier qui définit
  // un attribut gagne). C'est elle qu'affiche la portée Styles.
  const cascade = first ? [...first.style] : []
  const edited_id = menu_configuration.ref_selected_style.current

  const enterStyleScope = () => {
    // On cale le style édité sur le PLUS SPÉCIFIQUE de la cascade (le dernier),
    // sauf s'il pointe déjà un style de la cascade.
    if (cascade.length > 0 && !cascade.some(s => s.id === edited_id)) {
      menu_configuration.ref_selected_style.current = cascade[cascade.length - 1].id
    }
    onScope('style')
  }

  return (
    <Box className="inspector_scope">
      <Box style={{ display: 'flex', border: '1px solid #cbd5e0', borderRadius: '6px', overflow: 'hidden' }}>
        <Button
          flex="1" size="xs" borderRadius="0"
          variant={scope === 'selection' ? 'button_type_config_activated' : 'button_type_config'}
          onClick={() => onScope('selection')}
        >
          {count > 1
            ? app_data.t('inspector.selection_count', { count })
            : app_data.t('inspector.selection')}
        </Button>
        <Button
          flex="1" size="xs" borderRadius="0"
          variant={scope === 'style' ? 'button_type_config_activated' : 'button_type_config'}
          onClick={enterStyleScope}
        >
          {app_data.t('inspector.styles_count', { count: Math.max(cascade.length, 1) })}
        </Button>
      </Box>
      {scope === 'style' && (
        <InspectorStyleCascade
          app_data={app_data}
          cascade={cascade}
          edited_id={edited_id}
          onChanged={onCascadeChange}
        />
      )}
    </Box>
  )
}

// --- Cascade : tout se gère IN SITU (plus de modale de styles ici) -----------
// Puce = style de la cascade (clic : l'éditer ; × : le détacher de la sélection).
// « + » : attacher un style existant ou en créer un (fin de cascade, prioritaire).
// Sous la cascade : renommage inline du style édité, suppression si style
// utilisateur. Mêmes gestes/undo que le menu contextuel « Assigner styles ».

const isPredefinedStyle = (id: string) => id === default_style_id || id in elementStyleConfigs

const InspectorStyleCascade = ({ app_data, cascade, edited_id, onChanged }: {
  app_data: Class_ApplicationData
  cascade: Class_ElementStyle[]
  edited_id: string
  onChanged: () => void
}) => {
  const { t, drawing_area, history, menu_configuration } = app_data
  // Attache/détache sur TOUTE la sélection stylable (pas que le 1er élément).
  const styled_selection = [
    ...drawing_area.selected_nodes_list,
    ...drawing_area.selected_links_list,
    ...drawing_area.selected_containers_list
  ]
  // La cascade AFFICHÉE est celle du 1er élément ; si d'autres éléments de la
  // sélection suivent une cascade différente, on le dit explicitement.
  const cascade_sig = cascade.map(s => s.id).join('|')
  const divergent = styled_selection.some(el => [...el.style].map(s => s.id).join('|') !== cascade_sig)
  const refresh = () => {
    menu_configuration.ref_to_save_in_cache_indicator.current(false)
    menu_configuration.updateComponentRelatedToApparence()
    onChanged()
  }
  const editStyle = (id: string) => {
    menu_configuration.ref_selected_style.current = id
    refresh()
  }
  const attach = (style: Class_ElementStyle) => {
    // L'attachement est involutif avec le détachement : undo = inverse.
    const apply = () => { styled_selection.forEach(el => el.addStyle(style)); refresh() }
    const undo = () => { styled_selection.forEach(el => el.removeStyle(style)); refresh() }
    history.saveUndo(undo)
    history.saveRedo(apply)
    apply()
    editStyle(style.id)
  }
  const detach = (style: Class_ElementStyle) => {
    const apply = () => { styled_selection.forEach(el => el.removeStyle(style)); refresh() }
    const undo = () => { styled_selection.forEach(el => el.addStyle(style)); refresh() }
    history.saveUndo(undo)
    history.saveRedo(apply)
    apply()
    if (edited_id === style.id) editStyle(cascade[0]?.id ?? default_style_id)
  }

  const edited_style = drawing_area.sankey.styles_dict[edited_id]
  const attachable = drawing_area.sankey.styles_list
    .filter(style => !cascade.some(s => s.id === style.id))

  return <>
    {/* Cascade : puce surlignée = style en cours d'édition. */}
    <Box style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap',
      gap: '0.25rem', padding: '0.3rem 0.1rem 0'
    }}>
      <Text as="span" style={{
        fontSize: '0.6rem', letterSpacing: '0.05em',
        textTransform: 'uppercase', opacity: 0.6
      }}>{t('inspector.cascade')}</Text>
      {cascade.map((style, i) => (
        <React.Fragment key={style.id}>
          {i > 0 && <Text as="span" style={{ opacity: 0.5, fontSize: default_font_size }}>→</Text>}
          {/* Emphase double (pas la couleur seule) : la puce éditée est pleine,
              grasse et cerclée ; les autres reculent en opacité (avec leur ×)
              et remontent au survol. Cibles de clic identiques. */}
          <Box
            style={{
              display: 'inline-flex',
              alignItems: 'stretch',
              opacity: style.id === edited_id ? 1 : 0.55,
              transition: 'opacity 0.1s'
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = style.id === edited_id ? '1' : '0.55'
            }}
          >
            <Button
              size="xs"
              variant={style.id === edited_id
                ? 'menuconfigpanel_option_button_activated'
                : 'menuconfigpanel_option_button'}
              sx={style.id === edited_id
                ? {
                  paddingInline: '0.4rem', minWidth: 'auto', height: '1.2rem',
                  fontWeight: 700, outline: '2px solid', outlineColor: 'primaire.2',
                  outlineOffset: '1px'
                }
                : { paddingInline: '0.4rem', minWidth: 'auto', height: '1.2rem' }}
              // Puces compactes S1..SN (5-6 styles tiennent sur une ligne) ;
              // le nom complet est dans le tooltip et dans le champ ci-dessous.
              // (Les styles prédéfinis stockent une CLÉ de traduction comme nom.)
              title={t(style.name)}
              onClick={() => editStyle(style.id)}
            >
              {`S${i + 1}`}
            </Button>
            {/* Le style par défaut est indétachable (protégé par removeStyleById). */}
            {style.id !== default_style_id && (
              <Button
                size="xs"
                variant='menuconfigpanel_option_button'
                sx={{ paddingInline: '0.2rem', minWidth: 'auto', height: '1.2rem' }}
                title={t('inspector.detach_style')}
                onClick={() => detach(style)}
              >
                ×
              </Button>
            )}
          </Box>
        </React.Fragment>
      ))}
      {/* Attacher : styles existants hors cascade, ou nouveau style. À DROITE
          de la cascade : le variant du thème impose width:100%, qu'on annule
          ici pour que le bouton ne prenne pas sa propre ligne. */}
      <Menu>
        <MenuButton
          as={Button}
          size="xs"
          variant='menuconfigpanel_option_button'
          sx={{ paddingInline: '0.4rem', minWidth: 'auto', width: 'auto', flex: 'none', height: '1.2rem' }}
          title={t('inspector.attach_style')}
        >
          +
        </MenuButton>
        <MenuList>
          {attachable.map(style => (
            <MenuItem key={style.id} onClick={() => attach(style)}>
              {t(style.name)}
            </MenuItem>
          ))}
          <MenuItem
            onClick={() => {
              const new_style = drawing_area.sankey.addNewDefaultElementStyle()
              attach(new_style)
            }}
          >
            {t('inspector.new_style')}
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
    {/* Style édité : renommage inline ; suppression pour les styles utilisateur. */}
    {edited_style && (
      <Box style={{
        display: 'flex', alignItems: 'center', gap: '0.25rem',
        padding: '0.25rem 0.1rem 0'
      }}>
        <Input
          // defaultValue n'est lu qu'au montage : sans key, changer de puce
          // (S1→S3) laisserait l'ancien nom affiché dans l'input réutilisé.
          key={edited_id}
          size="xs"
          variant='menuconfigpanel_option_input'
          isDisabled={edited_id === default_style_id}
          defaultValue={t(edited_style.name)}
          // Même geste que la modale historique : écriture directe du nom.
          onBlur={(evt) => {
            if (evt.target.value.trim()) {
              edited_style.name = evt.target.value.trim()
              refresh()
            }
          }}
        />
        {!isPredefinedStyle(edited_id) && (
          <Button
            size="xs"
            variant='menuconfigpanel_del_button'
            sx={{ paddingInline: '0.4rem', minWidth: 'auto' }}
            title={t('inspector.delete_style_tooltip')}
            onClick={() => {
              // Suppression projet : snapshot (retisser les références serait fragile).
              app_data.runWithSnapshotUndo(() => {
                drawing_area.sankey.deleteElementStyle(edited_style)
                menu_configuration.ref_selected_style.current = default_style_id
              })
              refresh()
            }}
          >
            {t('inspector.delete_style')}
          </Button>
        )}
      </Box>
    )}
    <Text style={{ fontSize: default_font_size, opacity: 0.75, padding: '0.25rem 0.1rem' }}>
      {(divergent ? t('inspector.divergent_cascade') : '') + t('inspector.edited_style_hint')}
    </Text>
  </>
}
