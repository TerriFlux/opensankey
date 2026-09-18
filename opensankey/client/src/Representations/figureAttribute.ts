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

// os#1418 — DÉCLARER UN ATTRIBUT DE FIGURE EN UNE LIGNE.
//
// Une nature de représentation déclare ses réglages sur le patron `AttributeConfig` des nœuds et
// des flux (cf. Elements/ElementsAttributesConfig) : c'est ce qui permet à la cascade des styles
// de `Class_Figure` de s'appliquer à une figure comme elle s'applique à un élément. Ce patron
// porte huit champs ; sur une figure, cinq d'entre eux ont toujours la même valeur — `category`
// vaut 'figure' (ce ne sont ni des formes, ni des étiquettes de nœud), `actions` est vide (rien
// à redessiner élément par élément : l'hôte remonte ou redessine la figure entière), `type` n'a
// d'autre rôle que de porter le type du défaut, et les libellés doublent les infobulles quand
// personne n'a écrit mieux.
//
// D'où ce constructeur : ce qui distingue vraiment un attribut d'un autre — sa valeur d'usine, sa
// SORTE et ses libellés — et rien d'autre. Écrire la déclaration à la main reste possible ; ce
// raccourci ne fait qu'éviter huit lignes de cérémonie par clé sur des natures qui en déclarent
// deux à quatre.
//
// LES SEPT LANGUES SONT OBLIGATOIRES (sa#531) : `labels` et `tooltips` sont des catalogues aux
// yeux du contrôle `check:i18n`, qui tourne sur toute branche. Un libellé écrit en `{en, fr}`
// seul fait rougir le pipeline — et, s'il passait, partirait en production en 2 langues sur 7.

import type {
  Type_AttributeSort, Type_FigureAttributeConfig, Type_FigureControl
} from './Figure'

/** Un libellé dans les sept langues du dépôt. Aucune n'est optionnelle (cf. en-tête). */
export type Labels7 = {
  en: string
  fr: string
  es: string
  de: string
  it: string
  'zh-CN': string
  ja: string
}

/**
 * Déclare un attribut de figure : sa valeur d'usine, sa sorte, ses libellés.
 *
 * `tooltips` absent = les libellés servent des deux côtés, ce qui est le cas normal d'un réglage
 * dont le nom se suffit à lui-même ; on n'écrit une infobulle que lorsqu'elle dit quelque chose
 * de plus que le libellé.
 */
export const figureAttribute = <T>(
  default_value: T,
  sort: Type_AttributeSort,
  labels: Labels7,
  tooltips?: Labels7,
  // os#1425 — COMMENT le réglage se règle. Absent : déduit du type de la valeur d'usine (booléen →
  // case, nombre → champ, texte → champ). On ne l'écrit que pour ce qu'aucun type ne dit — une
  // liste de choix, une couleur, ou l'absence d'interface.
  ui?: Type_FigureControl
): Type_FigureAttributeConfig => ({
  default: default_value,
  // Le patron des éléments attend une fabrique : ici elle ne fait que porter le type du défaut,
  // une figure n'ayant aucun objet à instancier.
  type: () => default_value,
  category: 'figure',
  labels,
  tooltips: tooltips ?? labels,
  // Rien à redessiner clé par clé : une figure se redessine entière (cf. `redrawMounted`).
  actions: undefined,
  sort,
  ui
})

/** Un choix de liste, libellés des sept langues — le patron de `Type_FigureChoice`. */
export const figureChoice = (value: string | number, labels: Labels7) => ({ value, labels })
