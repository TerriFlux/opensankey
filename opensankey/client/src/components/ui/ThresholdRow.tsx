// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// 26/09/2026 — UN SEUIL SE RÈGLE PARTOUT DE LA MÊME FAÇON.
//
// Julien : « il faut que tu réfléchisses en terme de SIMILARITÉ : je veux que le look and feel,
// l'UI/UX, soit le même pour l'ensemble des figures, et qu'on réutilise au max les mêmes
// éléments. »
//
// ── CE QUE ÇA CORRIGE, MESURÉ ────────────────────────────────────────────────────────────────
//
// Le diagramme règle ses quatre seuils (flux, étiquette, nœud, stock) par un CURSEUR suivi d'une
// case chiffrée — et il écrit cette ligne QUATRE FOIS, en clair, dans `Toolbar.tsx`. Une figure,
// elle, ne connaissait que `kind: 'number'`, c'est-à-dire un `<input type="number">` nu. Le même
// geste — « à partir de quelle taille est-ce que ça s'affiche » — avait donc deux visages selon
// qu'on le posait sur un Sankey ou sur une couronne.
//
// ── POURQUOI LA CASE CHIFFRÉE EST UN EMPLACEMENT ET NON UN PARAMÈTRE ─────────────────────────
//
// La saisie riche de l'éditeur (`ConfigMenuNumberInput` : unité en suffixe, pas, mots-clés,
// liséré de surcharge, provenance) vit dans `opensankey-editor`, que le paquet de base ne peut
// pas importer — c'est la frontière d'architecture, et elle est testée. La descendre ici
// traînerait tout l'inspecteur avec elle.
//
// On partage donc ce qui EST le même — la mise en ligne, le curseur, les proportions — et on
// laisse l'appelant fournir sa case quand il en a une meilleure. L'éditeur passe la sienne, le
// formulaire générique d'une figure prend celle d'ici. Une seule ligne, deux garnitures.

import React from 'react'
import {
  Box, Input, Slider, SliderFilledTrack, SliderThumb, SliderTrack, Text
} from '@chakra-ui/react'

import { OSTooltip } from './OSTooltip'

export interface Type_ThresholdRowProps {
  /** Le nom du seuil, écrit à gauche. Court : la ligne est étroite. */
  label: string
  /** Ce que le seuil veut dire, au survol du nom. Absent : pas d'info-bulle. */
  tooltip?: string
  value: number
  min?: number
  max: number
  step?: number
  onChange: (value: number) => void
  /**
   * La case chiffrée, quand l'appelant en a une plus riche que celle d'ici (cf. l'en-tête).
   * Absente : une saisie simple, bornée par les mêmes `min`/`max`.
   */
  numberSlot?: React.ReactNode
  /** Le nom de variante du curseur, quand le thème en déclare une pour ce seuil. */
  sliderVariant?: string
  className?: string
}

/**
 * UNE LIGNE DE SEUIL : un nom, un curseur, un nombre.
 *
 * La grille `auto 1fr auto` est ce qui donne à toutes les lignes le même alignement quelle que
 * soit la longueur du nom — c'est elle, plus que le curseur, qui fait qu'un panneau de seuils se
 * lit d'un coup d'œil.
 */
export const ThresholdRow = ({
  label, tooltip, value, min = 0, max, step, onChange, numberSlot, sliderVariant, className
}: Type_ThresholdRowProps) => {
  const name = <Text fontSize='xs' whiteSpace='nowrap'>{label}</Text>
  return <Box
    display='grid' gridTemplateColumns='auto 1fr auto' gap='0.2rem'
    alignItems='center' width='100%' minW={0}
    className={className}
  >
    {tooltip ? <OSTooltip label={tooltip}>{name}</OSTooltip> : name}
    <Slider
      variant={sliderVariant}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={next => onChange(next)}
      aria-label={label}
    >
      <SliderTrack><SliderFilledTrack /></SliderTrack>
      <SliderThumb />
    </Slider>
    <Box width='2.4rem'>
      {numberSlot ?? <Input
        variant='menuconfigpanel_option_input'
        type='number'
        size='xs'
        value={String(value)}
        min={min} max={max} step={step}
        aria-label={label}
        onChange={e => {
          const next = Number(e.target.value)
          // Une saisie vide ou fautive ne déplace rien : on attend un nombre. Les bornes sont
          // celles du curseur — les deux commandes règlent la même chose, elles ne peuvent pas
          // accepter des valeurs différentes.
          if (!Number.isNaN(next)) onChange(Math.min(max, Math.max(min, next)))
        }}
      />}
    </Box>
  </Box>
}
