// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// Pop-up d'élément à STRUCTURE FIXE (retour à un patron imposé, post-#305).
//
// Plus de composition libre : la pop-up d'un nœud / flux a toujours la même
// forme —
//  - à GAUCHE, le contenu : « Description » (texte libre) puis le bilan des flux
//    (nœud) ou les caractéristiques (flux) — ce qui était affiché jusqu'ici dans
//    l'info-bulle ;
//  - à DROITE, une colonne de boutons de DIAGRAMME (Unit. / Couronne / Barres)
//    fournis par OS+ ; cliquer un bouton dessine le diagramme dans la zone de
//    gauche, à la place du contenu. Un bouton « Infos » y ramène.
//
// Sans OS+, `presentation_diagrams_for` est absent : pas de colonne de droite,
// la pop-up n'affiche que le contenu.

import React from 'react'
import { Box, Button, Text } from '@chakra-ui/react'
import { FaInfoCircle, FaChevronDown, FaChevronRight } from 'react-icons/fa'

import type { Class_ApplicationData, Type_PresentationDiagram } from '../../../types/ApplicationData'
import { default_font_size } from '../../../css/Theme'
import {
  renderPresentationBlock, presentationBlockLabel, presentationBlockSummary
} from './PresentationBlockRegistry'
import type { Type_Presentable } from './openPresentation'

// Blocs de CONTENU (colonne gauche), patron fixe. Les diagrammes (unitaire /
// analyse) n'y figurent pas : ils sont dans la colonne de droite.
const POPUP_NODE_BLOCKS = ['os.block.free_text', 'os.block.balance', 'os.block.flux_tags']
const POPUP_LINK_BLOCKS = [
  'os.block.free_text', 'os.block.link_flux', 'os.block.link_series_flux',
  'os.block.link_data', 'os.block.link_series_data'
]

const isLinkLike = (element: Type_Presentable): boolean => {
  const raw = element as unknown as Record<string, unknown>
  return 'source' in raw && 'target' in raw
}

// --- Sections repliables -----------------------------------------------------
// Empilés à plat, les blocs faisaient une pop-up longue où il fallait chercher.
// Chacun a désormais un titre et un chevron, et tout est REPLIÉ par défaut sauf
// le premier bloc : la pop-up s'ouvre sur l'essentiel (valeur, contexte), le
// reste s'obtient d'un clic.
//
// L'état vit AU NIVEAU DU MODULE, par id de bloc, et vaut pour la session : on
// déplie « Séries de données » une fois et il le reste sur les flux suivants,
// au lieu de redemander le même geste à chaque pop-up.
const _open_blocks = new Map<string, boolean>()

const CollapsibleBlock = ({ title, summary, is_open, onToggle, children }: React.PropsWithChildren<{
  title: string
  summary: string | null
  is_open: boolean
  onToggle: () => void
}>) => (
  <Box style={{ borderTop: '1px solid #edf2f7' }}>
    <Box
      role='button'
      tabIndex={0}
      aria-expanded={is_open}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() }
      }}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.3rem',
        padding: '0.15rem 0.1rem', cursor: 'pointer', userSelect: 'none'
      }}
    >
      <Box as='span' style={{ color: '#718096', fontSize: '0.55rem', flex: 'none' }}>
        {is_open ? <FaChevronDown /> : <FaChevronRight />}
      </Box>
      <Text as='span' style={{
        fontSize: '0.6rem', letterSpacing: '0.05em',
        textTransform: 'uppercase', color: '#4a5568', fontWeight: 600
      }}>
        {title}
      </Text>
      {summary && (
        <Text as='span' style={{
          marginLeft: 'auto', fontSize: '0.6rem', color: '#a0aec0',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '55%'
        }}>
          {summary}
        </Text>
      )}
    </Box>
    {is_open && <Box style={{ paddingLeft: '0.75rem' }}>{children}</Box>}
  </Box>
)

/** Zone de rendu d'un diagramme : appelle son `render` au montage, nettoie au
 *  démontage / changement de diagramme. Le conteneur a une hauteur DÉFINIE (les
 *  diagrammes qui se dimensionnent en `100%` en ont besoin). */
const DiagramHost = ({ diagram }: { diagram: Type_PresentationDiagram }) => {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const node = ref.current
    if (!node) return
    node.innerHTML = ''
    const cleanup = diagram.render(node)
    return () => { if (typeof cleanup === 'function') cleanup() }
  }, [diagram])
  return <Box ref={ref} style={{ width: '100%', height: '260px', minHeight: '260px' }} />
}

/** Bouton de diagramme : icône au-dessus, libellé dessous — même habillage que
 *  les onglets du menu de configuration (`inspector_tab`). */
const DiagramButton = ({ icon, label, active, onClick }: {
  icon?: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) => (
  <Button
    size='xs'
    variant={active ? 'inspector_tab_activated' : 'inspector_tab'}
    title={label}
    onClick={onClick}
    sx={{ display: 'flex', flexDirection: 'column', height: 'auto', paddingBlock: '0.3rem', gap: '0.15rem' }}
  >
    {icon}
    <Box
      as='span'
      style={{
        fontSize: '0.62rem', lineHeight: 1, maxWidth: '100%',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
      }}
    >
      {label}
    </Box>
  </Button>
)

export const PresentationPopup = ({ app_data, element }: {
  app_data: Class_ApplicationData
  element: Type_Presentable
}) => {
  const { t } = app_data

  const block_ids = isLinkLike(element) ? POPUP_LINK_BLOCKS : POPUP_NODE_BLOCKS
  const content = block_ids
    .map(id => {
      const ctx = {
        app_data,
        element: element as unknown as null,
        mode: 'popup' as const
      }
      return {
        id,
        title: presentationBlockLabel(id, app_data),
        summary: presentationBlockSummary(id, ctx),
        node: renderPresentationBlock(id, ctx)
      }
    })
    .filter(r => r.node !== null && r.node !== undefined)

  // Repli des sections : premier bloc ouvert, les autres fermés — sauf ce que le
  // lecteur a lui-même décidé pendant la session.
  const [, forceRender] = React.useReducer((x: number) => x + 1, 0)
  const isBlockOpen = (id: string, index: number) => _open_blocks.get(id) ?? (index === 0)
  const toggleBlock = (id: string, index: number) => {
    _open_blocks.set(id, !isBlockOpen(id, index))
    forceRender()
  }

  // Diagrammes fournis par OS+ (colonne de droite). Absent hors OS+.
  // MÉMOÏSÉ par élément : sans cela, chaque re-rendu de la pop-up (les
  // notifications de panneaux sont fréquentes) reconstruirait le tableau, donc
  // de NOUVEAUX objets `diagram`, et `DiagramHost` détruirait/recréerait sa zone
  // de dessin en boucle — laissant l'unitaire vide.
  const diagrams: Type_PresentationDiagram[] = React.useMemo(
    () => app_data.presentation_diagrams_for?.(element as never) ?? [],
    [element, app_data.presentation_diagrams_for]
  )

  // Diagramme actif (null = on montre le contenu). État local : la pop-up ne
  // change pas de contenant, donc pas de risque de remise à zéro intempestive.
  const [active, setActive] = React.useState<string | null>(null)
  const active_diagram = diagrams.find(d => d.id === active) ?? null

  return (
    <Box style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
      {/* CONTENU / DIAGRAMME (gauche) */}
      <Box style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
        {active_diagram
          ? <DiagramHost key={active_diagram.id} diagram={active_diagram} />
          : (content.length > 1
            // Plusieurs blocs : chacun dans sa section repliable.
            ? content.map((r, i) => (
              <CollapsibleBlock
                key={r.id}
                title={r.title}
                summary={r.summary}
                is_open={isBlockOpen(r.id, i)}
                onToggle={() => toggleBlock(r.id, i)}
              >
                {r.node}
              </CollapsibleBlock>
            ))
            // Un seul bloc : pas de section — un titre et un chevron pour replier
            // la seule chose que la pop-up ait à montrer n'apporteraient rien.
            : content.length === 1
              ? <React.Fragment key={content[0].id}>{content[0].node}</React.Fragment>
              : (
                <Box style={{ fontSize: default_font_size, opacity: 0.7, padding: '0.3rem 0.1rem' }}>
                  <Text>{t('presentation.nothing_here', {
                    defaultValue: 'Rien à afficher pour cet élément.'
                  })}</Text>
                </Box>
              ))}
      </Box>

      {/* COLONNE DE DIAGRAMMES (droite) — seulement si OS+ en fournit. Boutons
          « icône au-dessus, libellé dessous », à l'image des onglets du menu de
          configuration. */}
      {diagrams.length > 0 && (
        <Box
          style={{
            flex: 'none', width: '4.5rem',
            display: 'flex', flexDirection: 'column', gap: '0.2rem',
            borderLeft: '1px solid #e2e8f0', paddingLeft: '0.35rem'
          }}
        >
          <DiagramButton
            icon={<FaInfoCircle />}
            label={t('presentation.infos', { defaultValue: 'Infos' })}
            active={active === null}
            onClick={() => setActive(null)}
          />
          {diagrams.map(d => (
            <DiagramButton
              key={d.id}
              icon={d.icon}
              label={d.label}
              active={active === d.id}
              onClick={() => setActive(d.id)}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}
