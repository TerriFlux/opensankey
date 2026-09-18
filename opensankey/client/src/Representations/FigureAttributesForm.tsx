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
import { Box, Button, Input, Select } from '@chakra-ui/react'

// os#1425 — LES WIDGETS DES MENUS D'ÉLÉMENTS, tels quels : l'indicateur de surcharge et le cadre
// de sous-section sont ceux que l'inspecteur d'un nœud ou d'un flux emploie. Une figure se règle
// donc avec la même mise en page, sans qu'on la redessine.
import {
  InputIndicatorWrapper, MenuColorPicker, WrapperBoxSubSectionMenu
} from '../components/ui/MenuWidgets'
import { OSTooltip } from '../components/ui/OSTooltip'
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
  /**
   * os#1425 — les clés que CETTE surface ne rend pas, parce qu'une autre les rend mieux : les
   * attributs repris des éléments ont leurs propres onglets (cf. FigureAppearanceTabs), et les
   * répéter ici ferait deux endroits pour un même réglage.
   */
  exclude?: (key: string) => boolean
  /**
   * L'onglet de famille que cette surface rend : `'value_label'` pour ce que la figure AJOUTE à
   * l'affichage des valeurs, `''` pour ce qui n'appartient à aucune famille (le centre, la
   * légende). Absent : tout, quelle que soit la famille.
   */
  family?: string
  /** L'objet regardé, quand la figure en a un : certains choix viennent de son diagramme. */
  element?: unknown
  /**
   * « Cette clé est-elle posée SUR CETTE FIGURE, et non héritée ? » — ce que dit le liséré violet
   * des menus d'éléments. La figure sait répondre (`Class_Figure.isAttributeOverloaded`) ; le
   * formulaire ne la connaît pas, l'hôte lui passe donc la question toute faite. Absente : aucun
   * liséré, ce qui est le cas d'une surface qui ne règle pas une figure précise.
   */
  figure_overloaded?: (key: string) => boolean
}

const ALL_SORTS: Type_AttributeSort[] = ['style', 'navigation', 'identity']

/**
 * UN CHAMP, dans la rangée à deux colonnes des menus d'éléments : le libellé à gauche, le
 * contrôle à droite, et l'indicateur de surcharge autour du contrôle — exactement la forme que
 * l'inspecteur d'un nœud donne à la sienne.
 *
 * `is_overloaded` vient de la figure (cf. `Class_Figure.isAttributeOverloaded`) : le liséré violet
 * dit ici ce qu'il dit ailleurs, « posé sur cet objet et non hérité ».
 */
const FigureField = ({ app_data, item, is_overloaded, onChange }: {
  app_data: Class_ApplicationData
  item: Type_FigureControlItem
  is_overloaded: boolean
  onChange: (value: unknown) => void
}) => {
  const t = app_data.t as (key: string) => string
  const label = <OSTooltip label={item.tooltip}>
    <Box as='span' style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {item.label}
    </Box>
  </OSTooltip>

  // Un booléen est un INTERRUPTEUR qui porte son propre libellé, comme dans les menus
  // d'éléments (`OverloadedCheckbox`) : le bouton dit ce qu'il règle, et sa teinte dit s'il
  // est actif. Pas de « oui / non » à traduire, pas de case suivie d'un texte.
  if (item.kind === 'checkbox') {
    return <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <InputIndicatorWrapper isOverloaded={is_overloaded} t={t}>
        <OSTooltip label={item.tooltip}>
          <Button
            variant={item.value === true
              ? 'menuconfigpanel_option_button_activated'
              : 'menuconfigpanel_option_button'}
            sx={{ minWidth: 0, flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
            onClick={() => onChange(item.value !== true)}
          >{item.label}</Button>
        </OSTooltip>
      </InputIndicatorWrapper>
      <Box />
    </Box>
  }

  const control = item.kind === 'select'
    ? <Select
      variant='menuconfigpanel_option_select'
      value={String(item.value ?? '')}
      onChange={e => {
        // Un choix numérique revient en texte du DOM : on rend à la valeur son type, sinon
        // « 6 » remplacerait 6 dans le sac et le réglage suivant lirait une chaîne.
        const numeric = item.choices?.every(c => String(Number(c.value)) === c.value)
        onChange(numeric ? Number(e.target.value) : e.target.value)
      }}
    >
      {(item.choices ?? []).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
    </Select>
    : item.kind === 'color'
      ? <MenuColorPicker
        initialColor={String(item.value ?? '#000000')}
        onColorChange={(c: string) => onChange(c)}
      />
      : item.kind === 'number'
        ? <Input
          variant='menuconfigpanel_option_input'
          type='number'
          value={String(item.value ?? '')}
          min={item.min} max={item.max} step={item.step}
          onChange={e => {
            const next = Number(e.target.value)
            if (!Number.isNaN(next)) onChange(next)
          }}
        />
        : <Input
          variant='menuconfigpanel_option_input'
          value={String(item.value ?? '')}
          onChange={e => onChange(e.target.value)}
        />

  return <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
    {label}
    <InputIndicatorWrapper isOverloaded={is_overloaded} t={t}>{control}</InputIndicatorWrapper>
  </Box>
}

export const FigureAttributesForm = ({
  app_data, config, options, setOptions, sorts, element, exclude, family, figure_overloaded
}: Type_FigureAttributesFormProps) => {
  // La langue de l'INTERFACE (celle d'i18next), pas celle du document : ces libellés sont ceux
  // des réglages, et ils suivent la langue dans laquelle l'auteur travaille.
  const lang = i18next.language || app_data.language || 'en'
  const items = figureControlsOf(
    config, options, sorts ?? ALL_SORTS, lang,
    { app_data: app_data as unknown as { drawing_area?: { sankey?: unknown } }, element }
  )
    .filter(item => !exclude?.(item.key))
    .filter(item => family === undefined || item.family === family)
  if (items.length === 0) return null
  const set = (key: string, value: unknown) => setOptions({ ...options, [key]: value })
  // Le liséré violet des menus d'éléments : « posé ici, pas hérité ». La figure sait le dire.
  const is_overloaded = (key: string): boolean =>
    typeof figure_overloaded === 'function' ? figure_overloaded(key) : false

  const renderGroups = (list: Type_FigureControlItem[]) =>
    figureControlGroupsOf(list).map(group => {
      const fields = group.items.map(item => <FigureField
        key={item.key}
        app_data={app_data}
        item={item}
        is_overloaded={is_overloaded(item.key)}
        onChange={value => set(item.key, value)}
      />)
      // Le titre d'un groupe n'apparaît que si la nature en a nommé un, et il prend alors le
      // cadre de sous-section des menus d'éléments — même bandeau, même repli.
      return group.group
        ? <WrapperBoxSubSectionMenu
          key={group.group}
          new_data={app_data}
          title={app_data.t(group.group) as string}
        >
          <Box layerStyle='menuconfigpanel_grid'>{fields}</Box>
        </WrapperBoxSubSectionMenu>
        : <Box key='_' layerStyle='menuconfigpanel_grid'>{fields}</Box>
    })

  // CE QU'ON VIENT CHERCHER D'ABORD, le reste replié. Un réglage avancé reste un réglage : il ne
  // disparaît pas, il cesse d'occuper le même rang que la question qu'on se pose vraiment.
  const plain = items.filter(i => !i.advanced)
  const advanced = items.filter(i => i.advanced)
  return <Box layerStyle='menuconfigpanel_grid'>
    {renderGroups(plain)}
    {advanced.length > 0
      ? <WrapperBoxSubSectionMenu
        new_data={app_data}
        title={app_data.t('filter_panel.figure_advanced') as string}
        is_open={false}
      >
        {renderGroups(advanced)}
      </WrapperBoxSubSectionMenu>
      : null}
  </Box>
}
