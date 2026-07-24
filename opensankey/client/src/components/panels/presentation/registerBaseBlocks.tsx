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

// OS#305 (Lot 1) — Blocs d'affichage de BASE, en rendu LECTEUR.
//
// Chacun rend `null` quand il n'a rien à montrer pour la cible : l'appelant
// (Lot 3) saute alors le bloc au lieu d'afficher une section vide. C'est ce qui
// permet à l'auteur de composer une liste large sans se soucier des éléments
// qui n'ont pas la donnée.
//
// Accès aux données en CANARD (`'x' in element`) plutôt que par `instanceof` :
// on évite d'importer les classes concrètes (cycles d'import) et un élément qui
// n'a pas la donnée retombe naturellement sur `null`.

import React from 'react'
import { Box, Checkbox, Text } from '@chakra-ui/react'

import { default_font_size } from '../../../css/Theme'
import { formatElementValue, resolveValueUnit } from '../../../Elements/ValueFormatting'
import type { Class_LinkElement } from '../../../Elements/Link'
import { NodeTooltip } from '../../../Elements/TooltipsNode'
import { LinkTooltip } from '../../../Elements/TooltipsLink'
import { TOOLTIP_STYLES } from '../../../Elements/TooltipsCSS'
import type { Class_NodeElement } from '../../../Elements/Node'
import {
  presentation_block_registry,
  type Type_BlockRenderContext
} from './PresentationBlockRegistry'

// --- Accès défensif aux données ---------------------------------------------

type Unknown_Element = Record<string, unknown> | null

const isLinkLike = (el: Unknown_Element): boolean =>
  !!el && 'source' in el && 'target' in el

const readName = (el: Unknown_Element): string => {
  if (!el) return ''
  const effective = el['name_label_effective']
  if (typeof effective === 'string' && effective.trim() !== '') return effective
  const name = el['name']
  return typeof name === 'string' ? name : ''
}

/** Flux représentatif servant de référence de FORMAT (unité, précision). */
const sampleLinkOf = (el: Unknown_Element): Class_LinkElement | undefined => {
  if (!el) return undefined
  if (isLinkLike(el)) return el as unknown as Class_LinkElement
  const visibleOf = (key: string) => {
    const list = el[key]
    return Array.isArray(list)
      ? (list as Class_LinkElement[]).filter(l => l?.is_visible)
      : []
  }
  return visibleOf('input_links_list')[0] ?? visibleOf('output_links_list')[0]
}

/** Totaux entrants / sortants d'un nœud (flux visibles seulement). */
const nodeTotals = (el: Unknown_Element): { input: number, output: number } | null => {
  if (!el || isLinkLike(el)) return null
  if (!('input_links_list' in el) && !('output_links_list' in el)) return null
  const sum = (key: string) => {
    const list = el[key]
    if (!Array.isArray(list)) return 0
    return (list as Class_LinkElement[])
      .filter(l => l?.is_visible)
      .reduce((acc, l) => acc + (l.valueCurrent ?? 0), 0)
  }
  return { input: sum('input_links_list'), output: sum('output_links_list') }
}

// --- Habillage commun --------------------------------------------------------

const BlockSection = ({ title, compact, children }: React.PropsWithChildren<{
  title?: string
  compact: boolean
}>) => (
  <Box style={{ padding: compact ? '0.15rem 0.1rem' : '0.3rem 0.1rem' }}>
    {title
      ? <Text style={{
        fontSize: '0.6rem', letterSpacing: '0.05em',
        textTransform: 'uppercase', opacity: 0.6
      }}>{title}</Text>
      : null}
    <Box style={{ fontSize: default_font_size, color: '#333' }}>{children}</Box>
  </Box>
)

const Row = ({ label, value }: { label: string, value: string }) => (
  <Box style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
    <Text as='span' style={{ opacity: 0.75 }}>{label}</Text>
    <Text as='span' style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</Text>
  </Box>
)

const isCompact = (ctx: Type_BlockRenderContext) => ctx.mode === 'tooltip'
const el_of = (ctx: Type_BlockRenderContext) => ctx.element as unknown as Unknown_Element

// --- Réutilisation du contenu historique -------------------------------------
// OS#305 : le MÉCANISME d'info-bulle hérité est retiré (il doublait les panneaux
// unifiés), mais ses constructeurs de CONTENU — de simples fonctions
// données -> HTML — sont réutilisés tels quels. Contenu identique à l'ancien,
// donc aucune régression, et il devient composable.
//
// NB : ce HTML est injecté tel quel, comme le faisait l'ancien système. Les noms
// d'éléments y sont interpolés sans échappement — défaut PRÉEXISTANT hérité des
// constructeurs, à corriger à leur source (et non ici, qui ne fait que rendre).

const LEGACY_STYLES_ID = 'os-presentation-legacy-styles'

/** Injecte une seule fois la feuille de styles des tableaux historiques. */
const ensureLegacyStyles = () => {
  if (typeof document === 'undefined') return
  if (document.getElementById(LEGACY_STYLES_ID)) return
  const style = document.createElement('style')
  style.id = LEGACY_STYLES_ID
  style.textContent = TOOLTIP_STYLES
  document.head.appendChild(style)
}

const LegacyHtml = ({ html }: { html: string }) => {
  React.useEffect(ensureLegacyStyles, [])
  return (
    <Box
      className='presentation_legacy_html'
      style={{ overflowX: 'auto' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/** Contenu HTML d'un bloc de NŒUD (instance jetable : constructeur trivial). */
const nodeBlockHtml = (el: Unknown_Element, block_id: string): string | null => {
  if (!el || isLinkLike(el)) return null
  try {
    return new NodeTooltip(el as unknown as Class_NodeElement).getBlockHTML(block_id)
  } catch { return null }
}

/** Contenu HTML d'un bloc de FLUX. */
const linkBlockHtml = (el: Unknown_Element, block_id: string): string | null => {
  if (!el || !isLinkLike(el)) return null
  try {
    return new LinkTooltip(el as unknown as Class_LinkElement).getBlockHTML(block_id)
  } catch { return null }
}

// --- Enregistrement ----------------------------------------------------------

let _registered = false

/**
 * Enregistre les blocs de base. Idempotent (le registre déduplique par id, et
 * le drapeau évite le travail inutile) — appelé à l'import du rendu (Lot 3).
 */
export function registerBasePresentationBlocks(): void {
  if (_registered) return
  _registered = true

  // 1. LIBELLÉ — l'identité de l'élément. Pour un flux : origine -> destination.
  presentation_block_registry.register({
    id: 'os.block.label',
    target: ['node', 'link', 'container'],
    order: 10,
    label: (a) => a.t('presentation.block.label', { defaultValue: 'Libellé' }),
    render: (ctx) => {
      const el = el_of(ctx)
      let text = ''
      if (isLinkLike(el)) {
        const src = readName(el?.['source'] as Unknown_Element)
        const tgt = readName(el?.['target'] as Unknown_Element)
        text = (src || tgt) ? `${src} → ${tgt}` : ''
      } else {
        text = readName(el)
      }
      if (text.trim() === '') return null
      return (
        <BlockSection compact={isCompact(ctx)}>
          <Text style={{ fontWeight: 600 }}>{text}</Text>
        </BlockSection>
      )
    }
  })

  // 2. VALEUR — flux : sa valeur ; nœud : ses totaux entrants/sortants.
  //    L'UNITÉ est une OPTION de ce bloc et non un bloc à part : une unité
  //    détachée de sa valeur n'a pas de sens pour un lecteur.
  presentation_block_registry.register({
    id: 'os.block.value',
    target: ['node', 'link'],
    order: 20,
    label: (a) => a.t('presentation.block.value', { defaultValue: 'Valeur' }),
    // Sous-réglage du bloc : l'unité s'affiche-t-elle à côté de la valeur ?
    renderOptions: ({ app_data, options, setOptions }) => (
      <Checkbox
        size='sm'
        isChecked={options['show_unit'] !== false}
        onChange={(e) => setOptions({ ...options, show_unit: e.target.checked })}
      >
        <Box as='span' style={{ fontSize: '0.7rem' }}>
          {app_data.t('presentation.block.show_unit', { defaultValue: 'Afficher l\'unité' })}
        </Box>
      </Checkbox>
    ),
    render: (ctx) => {
      const el = el_of(ctx)
      const sample = sampleLinkOf(el)
      const show_unit = ctx.options?.['show_unit'] !== false
      const unit = show_unit ? resolveValueUnit(sample) : ''
      const suffix = unit ? ` ${unit}` : ''
      const compact = isCompact(ctx)
      const title = ctx.app_data.t('presentation.block.value', { defaultValue: 'Valeur' })

      if (isLinkLike(el)) {
        const raw = (el as Record<string, unknown>)['valueCurrent']
        if (typeof raw !== 'number') return null
        return (
          <BlockSection title={compact ? undefined : title} compact={compact}>
            <Text style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatElementValue(raw, sample) + suffix}
            </Text>
          </BlockSection>
        )
      }

      const totals = nodeTotals(el)
      if (!totals) return null
      const has_in = totals.input !== 0
      const has_out = totals.output !== 0
      if (!has_in && !has_out) return null
      return (
        <BlockSection title={compact ? undefined : title} compact={compact}>
          {has_in && (
            <Row
              label={ctx.app_data.t('presentation.block.value_in', { defaultValue: 'Entrées' })}
              value={formatElementValue(totals.input, sample) + suffix}
            />
          )}
          {has_out && (
            <Row
              label={ctx.app_data.t('presentation.block.value_out', { defaultValue: 'Sorties' })}
              value={formatElementValue(totals.output, sample) + suffix}
            />
          )}
        </BlockSection>
      )
    }
  })

  // 3. TAGS — étiquettes portées par l'élément.
  presentation_block_registry.register({
    id: 'os.block.tags',
    target: ['node', 'link', 'container'],
    order: 30,
    label: (a) => a.t('presentation.block.tags', { defaultValue: 'Tags' }),
    render: (ctx) => {
      const el = el_of(ctx)
      const raw = el?.['tags_list']
      if (!Array.isArray(raw) || raw.length === 0) return null
      const names = (raw as Record<string, unknown>[])
        .map(tag => {
          const display = tag?.['display_name']
          if (typeof display === 'string' && display.trim() !== '') return display
          const name = tag?.['name']
          return typeof name === 'string' ? name : ''
        })
        .filter(n => n.trim() !== '')
      if (names.length === 0) return null
      const compact = isCompact(ctx)
      return (
        <BlockSection
          title={compact ? undefined : ctx.app_data.t('presentation.block.tags', { defaultValue: 'Tags' })}
          compact={compact}
        >
          <Box style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
            {names.map((n, i) => (
              <Box
                key={n + i}
                as='span'
                style={{
                  background: '#edf2f7', borderRadius: '4px',
                  padding: '0 0.3rem', fontSize: '0.7rem', whiteSpace: 'nowrap'
                }}
              >
                {n}
              </Box>
            ))}
          </Box>
        </BlockSection>
      )
    }
  })

  // 4. INFOS — le texte libre de l'élément. On RECYCLE `tooltip_text` (saisi dans
  //    l'onglet « Infos » de l'inspecteur, simple ou riche) comme bloc du
  //    catalogue, au lieu d'un second mécanisme concurrent. L'id reste
  //    `os.block.free_text` (écrit dans le JSON), seul le libellé change.
  presentation_block_registry.register({
    id: 'os.block.free_text',
    target: ['node', 'link', 'container'],
    order: 40,
    label: (a) => a.t('presentation.block.infos', { defaultValue: 'Infos' }),
    render: (ctx) => {
      const el = el_of(ctx)
      const raw = el?.['tooltip_text']
      if (typeof raw !== 'string' || raw.trim() === '') return null
      const lines = raw.split('\n')
      return (
        <BlockSection compact={isCompact(ctx)}>
          {lines.map((line, i) => (
            <Text key={i} style={{ opacity: 0.9 }}>{line}</Text>
          ))}
        </BlockSection>
      )
    }
  })

  // --- Blocs repris du contenu d'info-bulle historique ----------------------
  // Mêmes tableaux qu'avant, désormais composables et affichables dans les trois
  // contenants. Les ids ci-dessous sont écrits dans le JSON : ne pas les renommer.

  const legacyNodeBlock = (
    id: string, order: number, key: string, label_key: string, fallback: string
  ) => presentation_block_registry.register({
    id, target: 'node', order,
    label: (a) => a.t(label_key, { defaultValue: fallback }),
    render: (ctx) => {
      const html = nodeBlockHtml(el_of(ctx), key)
      return html ? <LegacyHtml html={html} /> : null
    }
  })

  const legacyLinkBlock = (
    id: string, order: number, key: string, label_key: string, fallback: string
  ) => presentation_block_registry.register({
    id, target: 'link', order,
    label: (a) => a.t(label_key, { defaultValue: fallback }),
    render: (ctx) => {
      const html = linkBlockHtml(el_of(ctx), key)
      return html ? <LegacyHtml html={html} /> : null
    }
  })

  // Nœud : bilan (entrées/sorties/ratios + équilibre) et répartition par tag de flux.
  legacyNodeBlock('os.block.balance', 25, 'values',
    'presentation.block.balance', 'Bilan des flux')
  legacyNodeBlock('os.block.flux_tags', 35, 'tags',
    'presentation.block.flux_tags', 'Tags de flux')

  // Flux : valeur/donnée/tags, séries, flux enfants par dimension.
  legacyLinkBlock('os.block.link_flux', 50, 'flux',
    'presentation.block.link_flux', 'Flux')
  legacyLinkBlock('os.block.link_series_flux', 55, 'series_flux',
    'presentation.block.link_series_flux', 'Séries de flux')
  legacyLinkBlock('os.block.link_data', 60, 'data',
    'presentation.block.link_data', 'Données')
  legacyLinkBlock('os.block.link_series_data', 65, 'series_data',
    'presentation.block.link_series_data', 'Séries de données')

  // Les DIAGRAMMES (Sankey unitaire / Analyse) ne sont plus des blocs de la
  // composition : ils vivent dans la colonne de boutons de la POP-UP d'élément,
  // fournis par OS+ (`presentation_diagrams_for`) et rendus en ligne.
}
