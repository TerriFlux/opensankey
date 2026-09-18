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

// os#1425 — L'INTERFACE DE RÉGLAGES D'UNE FIGURE, RENDUE DEPUIS SA DÉCLARATION.
//
// Ce composant est le `renderOptions` de TOUTE nature qui n'en écrit pas : il pose une case, un
// sélecteur ou un champ par attribut déclaré, dans l'ordre de la déclaration et sous les libellés
// des sept langues qu'elle porte. Une nature qui ajoute un réglage l'obtient donc à l'écran sans
// une ligne d'interface, et deux natures ne peuvent plus diverger sur la façon de présenter la
// même sorte de réglage.
//
// CE QU'IL NE FAIT PAS, ET C'EST VOULU : il ne décide de rien. Ce qu'il y a à rendre, dans quel
// ordre, sous quel libellé et pour quelle sorte, c'est `figureControls` qui le dit — module pur,
// testé sans écran. Ici il n'y a que des composants Chakra posés sur cette liste.

import React from 'react'
import i18next from 'i18next'
import { Box, Checkbox, Input, Select, Text } from '@chakra-ui/react'

import type { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_AttributeSort, Type_OptionBag, Type_FigureAttributesConfig } from './Figure'
import { figureControlGroupsOf, figureControlsOf } from './figureControls'
import type { Type_FigureControlItem } from './figureControls'


export interface Type_FigureAttributesFormProps {
  app_data: Class_ApplicationData
  /** La déclaration de la nature (`entry.attributes`). */
  config: Type_FigureAttributesConfig
  /** Les réglages EFFECTIFS de la figure — la cascade est déjà résolue par l'appelant. */
  options: Type_OptionBag
  setOptions: (next: Type_OptionBag) => void
  /** Les sortes que cette surface rend. Absent : toutes. */
  sorts?: Type_AttributeSort[]
  /** L'objet regardé, quand la figure en a un : certains choix viennent de son diagramme. */
  element?: unknown
}

const ALL_SORTS: Type_AttributeSort[] = ['style', 'navigation', 'identity']

/** Un contrôle. Le seul endroit du lot où une valeur se lit et s'écrit. */
const FigureControl = (
  { item, onChange }: { item: Type_FigureControlItem, onChange: (value: unknown) => void }
) => {
  if (item.kind === 'checkbox') {
    return <Checkbox
      size='sm'
      isChecked={item.value === true}
      onChange={e => onChange(e.target.checked)}
    >
      <Text style={{ fontSize: '0.7rem' }} title={item.tooltip}>{item.label}</Text>
    </Checkbox>
  }
  const label = <Text style={{ fontSize: '0.7rem', opacity: 0.7 }} title={item.tooltip}>
    {item.label}
  </Text>
  if (item.kind === 'select') {
    return <Box>
      {label}
      <Select
        size='xs'
        value={String(item.value ?? '')}
        onChange={e => {
          // Un choix numérique revient en texte du DOM : on rend à la valeur son type, sinon
          // « 6 » remplacerait 6 dans le sac et le réglage suivant lirait une chaîne.
          const raw = e.target.value
          const numeric = item.choices?.every(c => String(Number(c.value)) === c.value)
          onChange(numeric ? Number(raw) : raw)
        }}
      >
        {(item.choices ?? []).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </Select>
    </Box>
  }
  if (item.kind === 'number') {
    return <Box>
      {label}
      <Input
        size='xs'
        type='number'
        value={String(item.value ?? '')}
        min={item.min} max={item.max} step={item.step}
        onChange={e => {
          const next = Number(e.target.value)
          if (!Number.isNaN(next)) onChange(next)
        }}
      />
    </Box>
  }
  if (item.kind === 'color') {
    return <Box>
      {label}
      <Input
        size='xs'
        type='color'
        value={String(item.value ?? '#000000')}
        onChange={e => onChange(e.target.value)}
      />
    </Box>
  }
  return <Box>
    {label}
    <Input size='xs' value={String(item.value ?? '')} onChange={e => onChange(e.target.value)} />
  </Box>
}

export const FigureAttributesForm = ({
  app_data, config, options, setOptions, sorts, element
}: Type_FigureAttributesFormProps) => {
  // Le tiroir « Avancé » est un état de l'OUTIL, pas du document : il se referme d'une figure à
  // l'autre, et rien n'est écrit quand on l'ouvre.
  const [show_advanced, setShowAdvanced] = React.useState(false)
  // La langue de l'INTERFACE (celle d'i18next), pas celle du document : ces libellés sont ceux
  // des réglages, et ils suivent la langue dans laquelle l'auteur travaille.
  const lang = i18next.language || app_data.language || 'en'
  const items = figureControlsOf(
    config, options, sorts ?? ALL_SORTS, lang,
    { app_data: app_data as unknown as { drawing_area?: { sankey?: unknown } }, element }
  )
  if (items.length === 0) return null
  const set = (key: string, value: unknown) => setOptions({ ...options, [key]: value })

  const renderGroups = (list: Type_FigureControlItem[]) =>
    figureControlGroupsOf(list).map(group => <Box
      key={group.group || '_'}
      style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}
    >
      {/* Le titre d'un groupe n'apparaît que si la nature en a nommé un : les natures qui ne
          groupent rien rendent exactement ce qu'elles rendaient avant ce lot. */}
      {group.group
        ? <Text style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.8, marginTop: '0.2rem' }}>
          {app_data.t(group.group) as string}
        </Text>
        : null}
      {group.items.map(item => <FigureControl
        key={item.key} item={item} onChange={value => set(item.key, value)}
      />)}
    </Box>)

  // CE QU'ON VIENT CHERCHER D'ABORD, le reste replié. Un réglage avancé reste un réglage : il ne
  // disparaît pas, il cesse d'occuper le même rang que la question qu'on se pose vraiment.
  const plain = items.filter(i => !i.advanced)
  const advanced = items.filter(i => i.advanced)
  return <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.2rem' }}>
    {renderGroups(plain)}
    {advanced.length > 0
      ? <Box>
        <Text
          as='button'
          style={{
            fontSize: '0.7rem', opacity: 0.7, marginTop: '0.2rem', cursor: 'pointer',
            textAlign: 'left', background: 'none', border: 'none', padding: '0.1rem 0'
          }}
          onClick={() => setShowAdvanced(v => !v)}
        >
          {(show_advanced ? '▾ ' : '▸ ') + (app_data.t('filter_panel.figure_advanced') as string)}
        </Text>
        {show_advanced
          ? <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {renderGroups(advanced)}
          </Box>
          : null}
      </Box>
      : null}
  </Box>
}
