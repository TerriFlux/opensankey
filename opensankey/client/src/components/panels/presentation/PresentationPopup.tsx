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

// LE CONTENU DE PRÉSENTATION d'un élément, à STRUCTURE FIXE (patron imposé, post-#305) :
// « Description » (texte libre) puis le bilan des flux (nœud) ou les caractéristiques (flux) —
// ce qu'affichait l'info-bulle historique, en sections repliables.
//
// sa#563 (lots 1 et 5) — LA COLONNE D'ANALYSES A DISPARU, et avec elle le second mécanisme.
//
// Elle portait « Unit. », la couronne et les barres, servies par un chemin PARALLÈLE à celui de
// la grande zone : `element_analyses_for`, contrat `render(container) => cleanup`, un dessin jeté
// dans un `div` de 260 px de haut (`ElementAnalysisHost`). Rien n'y était sélectionnable,
// réglable ni déplaçable, et la colonne d'outils ne savait pas qu'il existait. Or ces trois
// dessins SONT des entrées du registre des représentations depuis os#1473/os#1422 : la colonne
// les redemandait sous un autre nom, à un autre hôte, avec d'autres réglages.
//
// Elles sont désormais des NATURES du volet, choisies par le sélecteur de son en-tête, et ce
// contenu-ci en est une lui aussi — « Infos » (`ELEMENT_INFO_REPRESENTATION_ID`), montée par la
// grande zone comme le tableur ou la documentation. D'où le découpage de ce fichier :
//
//  - `PresentationContent` : le contenu, et rien d'autre. Deux hôtes le servent — le volet
//    flottant (via la nature « Infos ») et la pop-up / l'info-bulle de panneau —, donc un seul
//    composant, donc aucun réglage qui puisse diverger d'une place à l'autre. C'était la raison
//    d'être du lot 5 ;
//  - `PresentationPopup` : ce que la POP-UP ajoute autour, c'est-à-dire une seule chose — le
//    bouton « Vue » de la fiche d'un groupe d'étiquettes, qui ouvre la vue en volet.

import React from 'react'
import { Box, Button, Text } from '@chakra-ui/react'
import { FaChevronDown, FaChevronRight, FaEye } from 'react-icons/fa'

import type { Class_ApplicationData } from '../../../types/ApplicationData'
import { default_font_size } from '../../../css/Theme'
import {
  renderPresentationBlock, presentationBlockLabel, presentationBlockSummary
} from './PresentationBlockRegistry'
import type { Type_Presentable } from './openPresentation'
import { LegendTagGroupBlock, legendTagGroupOf, openTagGroupView } from './legendGroupPresentation'

// Blocs de CONTENU, patron fixe. Les diagrammes (unitaire / analyse) n'y figurent pas : ce sont
// des natures du volet, pas des blocs de présentation (cf. l'en-tête).
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

/**
 * sa#563 — LE CONTENU DE PRÉSENTATION D'UN ÉLÉMENT, sans rien autour.
 *
 * Servi à l'identique par ses deux hôtes : le volet flottant, par la nature « Infos » que la
 * grande zone monte (`elementComponentFor`, MainZoneTabs), et la pop-up / l'info-bulle de
 * panneau. UN seul composant, parce que deux rendus du même contenu finiraient par ne plus dire
 * la même chose — c'est très exactement ce que le lot 5 de l'issue vient défaire.
 *
 * SA#551 — le titre d'un groupe d'étiquettes de la légende n'est pas un élément du diagramme :
 * son contenu est la FICHE du groupe (sa définition, ses étiquettes), et non un bilan de flux.
 */
export const PresentationContent = ({ app_data, element }: {
  app_data: Class_ApplicationData
  element: Type_Presentable
}) => {
  const { t } = app_data
  const tag_group = legendTagGroupOf(app_data, element)

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

  if (tag_group !== undefined) return <LegendTagGroupBlock app_data={app_data} group={tag_group} />

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
      {content.length > 1
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
        // la seule chose qu'il y ait à montrer n'apporteraient rien.
        : content.length === 1
          ? <React.Fragment key={content[0].id}>{content[0].node}</React.Fragment>
          : (
            <Box style={{ fontSize: default_font_size, opacity: 0.7, padding: '0.3rem 0.1rem' }}>
              <Text>{t('presentation.nothing_here', {
                defaultValue: 'Rien à afficher pour cet élément.'
              })}</Text>
            </Box>
          )}
    </Box>
  )
}

export const PresentationPopup = ({ app_data, element }: {
  app_data: Class_ApplicationData
  element: Type_Presentable
}) => {
  const { t } = app_data
  const tag_group = legendTagGroupOf(app_data, element)
  // sa#563 — LE BOUTON « VUE » NE S'OFFRE QUE LÀ OÙ IL MÈNE QUELQUE PART : il ouvre un volet de
  // la grande zone, et une page qui n'en a pas (le viewer du paquet MIT) n'aurait personne pour
  // le dessiner. Un garde-fou muet vaut mieux qu'un bouton qui ne fait rien.
  const can_view = tag_group !== undefined && app_data.menu_configuration.main_zone_hosted

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 0 }}>
      <PresentationContent app_data={app_data} element={element} />
      {can_view && tag_group !== undefined && (
        <Button
          size='xs'
          variant='outline'
          leftIcon={<FaEye />}
          alignSelf='flex-start'
          onClick={() => openTagGroupView(app_data, tag_group)}
        >
          {t('MEP.legend_group_view')}
        </Button>
      )}
    </Box>
  )
}
