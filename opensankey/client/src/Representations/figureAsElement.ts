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

// os#1425 — UNE FIGURE VUE COMME UN ÉLÉMENT, pour que l'interface des nœuds et des flux la règle.
//
// L'objectif est celui d'Excel : on change le type d'un graphique, l'interface reste la même, et
// seuls les réglages qui perdent leur sens disparaissent. Pour cela il ne faut pas réécrire cette
// interface — il faut la NOURRIR. Or elle lit et écrit ses attributs par `Reflect.get/set` sur des
// objets qui portent un accesseur par clé (`element.name_label_font_size`), pas par une API.
//
// D'où cet adaptateur : un PROXY qui répond à ces accès en passant par la cascade de la figure
// (surcharge propre, styles suivis, valeur d'usine de la nature) pour la lecture, et par le
// `setOptions` de l'hôte pour l'écriture — donc par la PORTÉE choisie (cette figure, la sélection,
// le style). Écrire une police depuis l'interface des nœuds range donc la valeur exactement là où
// le volet des figures la rangerait.
//
// POURQUOI UN PROXY ET NON DES ACCESSEURS SUR `Class_Figure` : les clés lues ne sont pas connues à
// l'avance (l'interface interroge tout `ALL_ATTRIBUTES_CONFIG`, y compris ce que la nature ne
// déclare pas), et surtout une figure ne doit pas se mettre à ressembler à un nœud dans le reste
// du code — `'input_links_list' in figure` doit rester faux, sinon `chartSubjectOf` et le geste
// « poser sur le nœud » la prendraient pour un objet du diagramme.

import type { Class_Figure } from './Figure'
import type { Type_OptionBag } from './Figure'

/** Ce que l'interface des éléments lit d'un élément en dehors de ses attributs. */
export interface Type_FigureElementHost {
  /** L'application, telle que `updateElements` la cherche : `element.drawing_area.application_data`. */
  application_data: unknown
  /** Écrit les réglages — c'est la PORTÉE de l'hôte qui décide où ils atterrissent. */
  setOptions: (next: Type_OptionBag) => void
  /** Les réglages EFFECTIFS montrés par l'hôte (sous « le style », ce sont ceux du style). */
  options: Type_OptionBag
}

/**
 * La figure, habillée en élément.
 *
 * Trois accès seulement sortent de la cascade des attributs, et ce sont ceux dont l'interface des
 * éléments a besoin pour fonctionner : `id` (elle indexe ses annulations dessus), `drawing_area`
 * (elle y prend l'application pour l'historique) et `isAttributeOverloaded` (l'indicateur violet
 * « surchargé ici » de chaque champ). Tout le reste est une clé d'attribut.
 */
export const figureAsElement = (
  figure: Class_Figure,
  host: Type_FigureElementHost
): object => {
  const base = {
    // Une figure de vignette n'a pas d'identifiant de document tant que personne ne l'a posée
    // quelque part : sa CLÉ de vignette la nomme alors, ce qui suffit à l'historique.
    id: figure.id ?? figure.key,
    drawing_area: { application_data: host.application_data },
    isAttributeOverloaded: (key: string) => figure.isAttributeOverloaded(key)
  }
  return new Proxy(base as Record<string, unknown>, {
    get: (target, prop) => {
      if (typeof prop !== 'string') return undefined
      if (prop in target) return target[prop]
      // La valeur MONTRÉE par l'hôte d'abord : sous la portée « le style », c'est celle du style
      // et non celle de la figure, et l'interface doit afficher ce que le geste suivant écrira.
      if (prop in host.options) return host.options[prop]
      return figure.getElementProperty(prop)
    },
    set: (target, prop, value) => {
      if (typeof prop !== 'string') return false
      host.setOptions({ ...host.options, [prop]: value })
      return true
    },
    // `'input_links_list' in el` doit rendre FAUX : une figure n'est pas un nœud du diagramme, et
    // plusieurs gardes du code s'appuient sur cette question (cf. l'en-tête).
    has: (target, prop) => typeof prop === 'string' && prop in target,
    // Les champs se lisent aussi par énumération dans certains composants : on ne promet que ce
    // que la nature déclare, pour ne pas faire croire qu'une figure porte tout le catalogue.
    ownKeys: () => [...Object.keys(base), ...figure.nature.declared_keys],
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true })
  })
}
