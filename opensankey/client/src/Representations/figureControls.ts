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

// os#1425 — DE LA DÉCLARATION D'UNE NATURE AUX CONTRÔLES À RENDRE. Module PUR.
//
// Chaque nature écrivait son interface de réglages à la main (`renderOptions`) : trois `Select`
// pour le sunburst, d'autres ailleurs, chacune réinventant le libellé, l'infobulle, la traduction
// et l'indicateur de surcharge. C'était une interface à part, à côté de celle des nœuds et des
// flux, alors que les deux règlent la même sorte d'objet — depuis os#1418, une figure EST un
// élément et ses réglages sont des `AttributeConfig`.
//
// Ce fichier fait le pas qui manquait : il lit la DÉCLARATION (valeur d'usine, sorte, libellés
// des sept langues, contrôle) et rend la liste de ce qu'il y a à afficher. Aucun React, aucun
// Chakra, aucun DOM — ce qui se teste ici est ce qui décide, et le composant ne fait plus que
// poser des cases et des sélecteurs sur cette liste.
//
// LA SORTE FILTRE. Un réglage de sorte 'navigation' dit CE QU'ON REGARDE (l'axe d'une couronne,
// le millésime épinglé) : il va au panneau « Filtres et coordonnées ». Un réglage de sorte
// 'style' dit COMMENT ÇA SE DESSINE : il va à l'inspecteur. Un réglage 'identity' nomme le sujet
// et n'a pas d'interface — c'est la fenêtre qui le pose. Cette répartition n'est pas un choix de
// l'interface : elle EST la sorte déjà déclarée, et c'est ce qui fait qu'elle ne peut pas diverger
// d'une surface à l'autre.

import type {
  Type_FigureAttributesConfig, Type_FigureChoiceContext, Type_FigureControlKind, Type_OptionBag,
  Type_AttributeSort
} from './Figure'

/** Un contrôle prêt à poser : tout est déjà résolu, traduit, et la valeur est celle qui vaut. */
export interface Type_FigureControlItem {
  key: string
  kind: Exclude<Type_FigureControlKind, 'none'>
  label: string
  tooltip: string
  value: unknown
  /** Pour un sélecteur : les choix, déjà traduits et dans l'ordre déclaré. */
  choices?: { value: string, label: string }[]
  min?: number
  max?: number
  step?: number
  /** Le groupe visuel (clé i18n déclarée), `''` quand la nature n'en dit rien. */
  group: string
  sort: Type_AttributeSort
  /** Rarement ce qu'on vient chercher : le formulaire le range sous un « Avancé » replié. */
  advanced: boolean
  /** L'onglet de famille où ce réglage rejoint ceux des éléments ; `''` = l'onglet de la figure. */
  family: string
}

/** Un groupe de contrôles, dans l'ordre où les clés ont été déclarées. */
export interface Type_FigureControlGroup {
  /** La clé i18n du groupe, `''` pour les réglages qu'aucun groupe ne nomme. */
  group: string
  items: Type_FigureControlItem[]
}

/**
 * La sorte de contrôle d'une clé : celle qui est déclarée, sinon celle que dit le TYPE de la
 * valeur d'usine. Une valeur composée (liste, objet) n'a pas d'interface générique — un
 * descripteur d'analyse, une liste de racines se règlent ailleurs, et prétendre les éditer dans
 * un champ de texte les casserait.
 */
export const controlKindOf = (
  declared: Type_FigureControlKind | undefined,
  factory_default: unknown,
  has_choices: boolean
): Type_FigureControlKind => {
  if (declared) return declared
  if (has_choices) return 'select'
  if (typeof factory_default === 'boolean') return 'checkbox'
  if (typeof factory_default === 'number') return 'number'
  if (typeof factory_default === 'string') return 'text'
  return 'none'
}

/**
 * LES FAMILLES D'ATTRIBUTS reprises des éléments, et le préfixe qui les nomme. Une clé reprise
 * porte sa famille dans son nom : c'est ce qui la range dans le bon onglet sans rien déclarer.
 */
export const FIGURE_FAMILY_PREFIXES: { family: string, prefix: string }[] = [
  { family: 'shape', prefix: 'shape_' },
  { family: 'name_label', prefix: 'name_label_' },
  { family: 'value_label', prefix: 'value_label_' }
]

/** La famille que le NOM d'une clé annonce, `''` pour une clé propre à la figure. */
export const familyOfKey = (key: string): string =>
  FIGURE_FAMILY_PREFIXES.find(f => key.startsWith(f.prefix))?.family ?? ''

/** Le libellé d'un catalogue 7 langues, avec repli sur l'anglais puis sur la clé. */
const inLang = (labels: { [lang: string]: string } | undefined, lang: string, key: string): string =>
  labels?.[lang] ?? labels?.['en'] ?? key

/**
 * LES CONTRÔLES D'UNE NATURE, filtrés par sorte, dans l'ordre de déclaration.
 *
 * @param config la déclaration de la nature (`Class_FigureNature.config`)
 * @param options les réglages EFFECTIFS de la figure (cascade déjà résolue par `Class_Figure`)
 * @param sorts les sortes à rendre — l'inspecteur demande 'style', la navigation 'navigation'
 * @param lang la langue courante, pour les libellés portés par la déclaration
 * @param ctx de quoi résoudre les choix qui viennent du modèle
 */
export const figureControlsOf = (
  config: Type_FigureAttributesConfig,
  options: Type_OptionBag,
  sorts: Type_AttributeSort[],
  lang: string,
  ctx: Type_FigureChoiceContext
): Type_FigureControlItem[] => {
  const out: Type_FigureControlItem[] = []
  Object.entries(config).forEach(([key, attr]) => {
    const sort: Type_AttributeSort = attr.sort ?? 'style'
    if (!sorts.includes(sort)) return
    const ui = attr.ui
    // Un réglage conditionnel dont la condition ne tient pas ne se rend pas — mais sa valeur
    // reste écrite : il revient tel qu'il était dès que la condition revient.
    if (ui?.visibleIf && !ui.visibleIf(options)) return

    const declared_choices = ui?.choices?.map(c => ({
      value: String(c.value),
      label: inLang(c.labels, lang, String(c.value))
    }))
    // Les choix du MODÈLE sont résolus maintenant : un axe ajouté au diagramme apparaît sans
    // qu'aucune déclaration ne bouge.
    const model_choices = ui?.choicesOf ? ui.choicesOf(ctx) : undefined
    const choices = declared_choices ?? model_choices
    const kind = controlKindOf(ui?.kind, attr.default, !!choices && choices.length > 0)
    if (kind === 'none') return

    const value = key in options ? options[key] : attr.default
    out.push({
      key,
      kind,
      label: inLang(attr.labels as { [lang: string]: string }, lang, key),
      tooltip: inLang(attr.tooltips as { [lang: string]: string }, lang, key),
      value,
      choices,
      min: ui?.min,
      max: ui?.max,
      step: ui?.step,
      group: ui?.group ?? '',
      sort,
      advanced: ui?.advanced === true,
      // Un réglage REPRIS d'un élément porte sa famille dans son nom : `name_label_font_size`
      // appartient à l'onglet Libellé sans avoir à le déclarer. Un réglage propre à la figure le
      // dit (cf. `Type_FigureControl.family`), ou reste dans l'onglet de la figure.
      family: ui?.family ?? familyOfKey(key)
    })
  })
  return out
}

/**
 * Les mêmes, rangés par GROUPE, chaque groupe dans l'ordre de sa première clé déclarée.
 *
 * Une nature qui ne groupe rien rend un seul groupe anonyme : l'interface n'a alors pas de titre
 * à écrire, et c'est exactement ce qu'elle faisait avant ce lot.
 */
export const figureControlGroupsOf = (
  items: Type_FigureControlItem[]
): Type_FigureControlGroup[] => {
  const groups: Type_FigureControlGroup[] = []
  items.forEach(item => {
    const found = groups.find(g => g.group === item.group)
    if (found) found.items.push(item)
    else groups.push({ group: item.group, items: [item] })
  })
  return groups
}
