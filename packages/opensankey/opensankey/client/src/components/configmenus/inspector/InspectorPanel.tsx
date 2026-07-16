// #1243 — Inspecteur piloté par la sélection.
//
// Remplaçant du panneau de config matriciel (type×élément). L'utilisateur ne
// choisit plus deux axes : la sélection sur le canvas détermine la cible, et
// l'inspecteur empile les sections enregistrées pour cette cible (cf.
// InspectorRegistry). Toujours un état valide — aucune sélection = réglages de
// la vue.
//
// Monté derrière un flag dev, À CÔTÉ de la matrice historique (bascule dans
// ConfigMenu). Aucun composant de contenu n'est réécrit : ce panneau ne fait
// que router et présenter les composants existants en sections.

import React, { useRef, useState } from 'react'
import { Box, Button, Text } from '@chakra-ui/react'

import type { Class_ApplicationData } from '../../../types/ApplicationData'
import { useModelBinding } from '../../../hooks/useModelBinding'
import {
  resolveInspectorTarget,
  type Type_InspectorTarget,
  type Type_SelectionCounts
} from './InspectorResolver'
import {
  inspector_registry,
  type Type_InspectorScope,
  type Type_InspectorSectionHue
} from './InspectorRegistry'
import { registerBaseInspectorSections } from './registerBaseSections'

// Enregistre les sections de base dès l'import du panneau (idempotent). Les
// couches supérieures enregistreront les leurs à leur propre init.
registerBaseInspectorSections()

// Couleurs de thème par famille (continuité avec _style_config historique).
const HUE_COLOR: Record<Type_InspectorSectionHue, string> = {
  data: '#78a7c2',
  style: '#78c2ad',
  presentation: '#778a95'
}

// Libellés FR des cibles. i18n complet = suivi (ce panneau est dev-gated).
const TARGET_NOUN: Record<Type_InspectorTarget, { one: string; many: string }> = {
  view: { one: 'Vue', many: 'Vue' },
  node: { one: 'Nœud', many: 'nœuds' },
  link: { one: 'Flux', many: 'flux' },
  container: { one: 'Zone', many: 'zones' },
  legend: { one: 'Légende', many: 'légendes' },
  title: { one: 'Titre', many: 'titres' },
  mixed: { one: 'Sélection mixte', many: 'éléments' }
}

/**
 * Décompte la sélection courante par type, pour le résolveur.
 */
function readSelectionCounts(app_data: Class_ApplicationData): Type_SelectionCounts {
  const da = app_data.drawing_area
  const legend_selected = da.selected_elements_list.some(e => e === da.legend)
  return {
    nodes: da.selected_nodes_list.length,
    links: da.selected_links_list.length,
    containers: da.selected_containers_list.length,
    legend: legend_selected,
    // Le titre n'est pas encore un objet sélectionnable (phase ultérieure).
    title: false
  }
}

export const InspectorPanel = ({ app_data }: { app_data: Class_ApplicationData }) => {
  // Re-render sur chaque changement de composition de sélection.
  useModelBinding(app_data.menu_configuration.ref_to_inspector_updater)

  // Fil d'Ariane : atteindre la Vue sans purger la sélection.
  const [view_override, setViewOverride] = useState(false)
  // Portée d'édition : sélection vs style/défaut.
  const [scope, setScope] = useState<Type_InspectorScope>('selection')

  const counts = readSelectionCounts(app_data)
  const { target, count } = resolveInspectorTarget(counts, view_override)

  // Réinitialise view_override quand la composition de la sélection change (une
  // nouvelle sélection doit montrer l'élément, pas rester bloquée sur la Vue).
  const sig = `${counts.nodes}/${counts.links}/${counts.containers}/${counts.legend}/${counts.title}`
  const last_sig = useRef(sig)
  if (last_sig.current !== sig) {
    last_sig.current = sig
    if (view_override) setViewOverride(false)
    if (scope === 'style') setScope('selection')
  }

  const sections = inspector_registry.getSectionsFor(target, app_data)
  const scope_capable = target === 'node' || target === 'link' || target === 'container'

  return (
    <Box
      className="inspector_panel"
      style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%' }}
    >
      <InspectorBreadcrumb
        target={target}
        count={count}
        has_selection={counts.nodes + counts.links + counts.containers > 0 || counts.legend}
        view_override={view_override}
        onGoView={() => setViewOverride(true)}
        onGoSelection={() => setViewOverride(false)}
      />

      {scope_capable && (
        <InspectorScopeBand
          target={target}
          count={count}
          scope={scope}
          onScope={setScope}
        />
      )}

      <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto' }}>
        {sections.length === 0 ? (
          <Box layerStyle="empty_config_text" textStyle="h2">
            <span>{`Aucun réglage disponible pour : ${TARGET_NOUN[target].one}.`}</span>
          </Box>
        ) : (
          sections.map(sec => (
            <InspectorSection
              key={sec.id}
              hue={HUE_COLOR[sec.hue]}
              title={sec.title(app_data)}
              default_collapsed={!!sec.collapsed}
            >
              {sec.render(app_data, scope)}
            </InspectorSection>
          ))
        )}
      </Box>
    </Box>
  )
}

// --- Fil d'Ariane ----------------------------------------------------------

const InspectorBreadcrumb = ({
  target, count, has_selection, view_override, onGoView, onGoSelection
}: {
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
      ? `${count} ${TARGET_NOUN[target].many}`
      : TARGET_NOUN[target].one

  return (
    <Box
      className="inspector_breadcrumb"
      style={{
        display: 'flex', alignItems: 'center', gap: '0.25rem',
        fontSize: '0.8rem', padding: '0.15rem 0.1rem'
      }}
    >
      {showing_view ? (
        <>
          <Text as="span" style={{ fontWeight: 600 }}>Vue</Text>
          {has_selection && view_override && (
            <>
              <Text as="span" style={{ opacity: 0.5 }}>›</Text>
              <Button variant="link" size="xs" onClick={onGoSelection}>
                Retour à la sélection
              </Button>
            </>
          )}
        </>
      ) : (
        <>
          <Button variant="link" size="xs" onClick={onGoView}>Vue</Button>
          <Text as="span" style={{ opacity: 0.5 }}>›</Text>
          <Text as="span" style={{ fontWeight: 600 }}>{sel_label}</Text>
        </>
      )}
    </Box>
  )
}

// --- Bandeau de portée (sélection / style) ---------------------------------

const InspectorScopeBand = ({
  target, count, scope, onScope
}: {
  target: Type_InspectorTarget
  count: number
  scope: Type_InspectorScope
  onScope: (s: Type_InspectorScope) => void
}) => (
  <Box className="inspector_scope">
    <Box style={{ display: 'flex', border: '1px solid #cbd5e0', borderRadius: '6px', overflow: 'hidden' }}>
      <Button
        flex="1" size="xs" borderRadius="0"
        variant={scope === 'selection' ? 'button_type_config_activated' : 'button_type_config'}
        onClick={() => onScope('selection')}
      >
        {count > 1 ? `Sélection (${count})` : 'Sélection'}
      </Button>
      <Button
        flex="1" size="xs" borderRadius="0"
        variant={scope === 'style' ? 'button_type_config_activated' : 'button_type_config'}
        onClick={() => onScope('style')}
      >
        Style : défaut
      </Button>
    </Box>
    {scope === 'style' && (
      <Text style={{ fontSize: '0.72rem', opacity: 0.75, padding: '0.25rem 0.1rem' }}>
        {`Édition du style suivi par ${count > 1 ? 'ces' : 'ce'} ${TARGET_NOUN[target].many} : ` +
          'tous ceux qui le suivent seront modifiés.'}
      </Text>
    )}
  </Box>
)

// --- Section repliable ------------------------------------------------------

const InspectorSection = ({
  hue, title, default_collapsed, children
}: React.PropsWithChildren<{
  hue: string
  title: string
  default_collapsed: boolean
}>) => {
  const [open, setOpen] = useState(!default_collapsed)
  return (
    <Box
      className="inspector_section"
      style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}
    >
      <Box
        as="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%',
          padding: '0.4rem 0.5rem', background: '#f7fafc', cursor: 'pointer',
          fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.03em',
          textTransform: 'uppercase', color: '#4a5568'
        }}
      >
        <Box style={{ width: '8px', height: '8px', borderRadius: '2px', background: hue, flex: 'none' }} />
        <span>{title}</span>
        <Box as="span" style={{ marginLeft: 'auto', opacity: 0.5 }}>{open ? '▾' : '▸'}</Box>
      </Box>
      {open && <Box style={{ padding: '0.4rem 0.35rem' }}>{children}</Box>}
    </Box>
  )
}
