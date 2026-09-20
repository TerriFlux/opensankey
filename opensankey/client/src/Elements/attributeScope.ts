// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1464 — LA PORTÉE D'UN ATTRIBUT, DÉCLARÉE À CÔTÉ DE LUI.
//
// Julien, à l'écran : « et si l'attribut n'est pas pertinent, ne pas le montrer dans l'interface —
// par exemple rayon pour la forme, ça ne me paraît pas pertinent ».
//
// Une PART de figure (os#1445) reçoit les mêmes onglets Forme / Libellé / Valeur qu'un nœud, et
// c'est ce qui a rendu ce chantier court. L'inverse est vrai aussi : on lui offrait des réglages
// qu'aucun tracé ne pourra JAMAIS honorer — un rayon de coins, une largeur minimale, des marges,
// alors que la forme d'une part est calculée à partir de sa valeur. Un réglage sans effet est la
// pire chose à offrir à un auteur : il le pose, rien ne change, et rien ne dit pourquoi.
//
// LA PORTÉE VA DANS LES DEUX SENS, et c'est la seconde moitié — Julien, le même jour : « sur les
// labels du sunburst on perd les options qu'on avait pour mettre le label à l'horizontale ou qui
// suit l'arc. Il faut le mettre dans les options, un peu comme pour nœud et flux où on avait des
// parties de UI spécifiques. » Retirer le générique sans objet ne suffit donc pas : il faut aussi
// AJOUTER ce qu'une nature déclare pour elle seule. C'est `{ only: [...] }`, et c'est ce que lit
// `attributesOwnedBy` plus bas — l'interface demande « que propose cette nature ? » au lieu de
// porter une liste par nature.
//
// TROIS ÉTAGES DE DÉCLARATION, PARCE QUE LA MESURE L'IMPOSE. Le catalogue porte ~350 attributs ;
// les tracés de figure en lisent 24. Une portée se déclare donc à côté de l'attribut, ou sur UNE
// CLÉ PRÉFIXÉE quand ses copies ne se valent pas, ou sur une FAMILLE entière quand c'est un onglet
// qui n'a pas d'objet — le particulier l'emportant sur le général (cf. `ElementsAttributesConfig`,
// « OÙ SE DÉCLARE LA PORTÉE »).
//
// ET MASQUER EST LE DERNIER RECOURS. Julien : « tous les attributs qui existent et qui ont du sens,
// il faut les implémenter, sauf si c'est vraiment trop compliqué ». Un réglage qui n'a pas encore
// de tracé se corrige en l'écrivant ; un réglage retiré à tort ne se découvre que des mois plus
// tard. Dans le doute, on ne masque pas.
//
// CE QUI N'EST PAS FAIT ICI, ET C'EST LE POINT. Le contrat (`notes/figures/attributs-et-styles-
// contrat.md`, §5) le dit : « la portée d'un attribut se déclare à côté de lui, pas dans
// l'interface. C'est ce qui évitera le `if` par nature. » L'interface ne connaît donc aucune
// nature : elle DEMANDE si tel attribut s'adresse à ce qui est sélectionné, et c'est la déclaration
// (`AttributeConfig.scope`) qui répond. Une cinquième nature n'écrira pas une ligne d'interface.
//
// FICHIER À PART ET SANS REACT, pour une raison prosaïque mais qui se paie : le jest de ce dépôt
// (v27) ne sait pas lire les modules ESM, et importer un composant dans un test entraîne de proche
// en proche `react-markdown` — la suite échoue alors au chargement, sur un message qui ne parle que
// de `node_modules`. Même précaution que `configmenus/inspector/styledSelection.ts`, dont l'en-tête
// raconte la même histoire. Une règle qu'on ne peut pas tester n'en est pas une.

import {
  ALL_ATTRIBUTES_CONFIG, ATTRIBUTE_FAMILY_SCOPES, ATTRIBUTE_KEY_SCOPES
} from './ElementsAttributesConfig'
import { isFigurePartElement, isLinkLikeElement } from './ElementNaming'

/**
 * Les natures d'élément que le modèle sait nommer.
 *
 * 'container' est la zone de texte — et, avec elle, toute forme qui descend de `Class_NodeBase`
 * sans porter de flux (la forme de stock). Le jour où un attribut devra départager ces deux-là,
 * c'est un MARQUEUR qu'il faudra poser sur la classe (comme `is_figure_part`), pas un `if` ici.
 */
export type Type_ElementNature = 'node' | 'link' | 'container' | 'part'

/**
 * À qui un attribut s'adresse. ABSENT = TOUT LE MONDE, et c'est ce qui rend l'ajout de ce champ
 * sans effet sur les ~350 attributs du catalogue qui ne le portent pas.
 *
 * DEUX FORMES, parce que les deux questions se posent vraiment :
 *  - `except` : « pas pour les parts » — le rayon des coins, les marges, la taille minimale. C'est
 *    la forme ordinaire : l'attribut vaut pour tout le monde SAUF là où il ne décrit rien.
 *  - `only` : « pour les nœuds seulement » — Σin→Σout, qui n'a de sens que là où des flux entrent
 *    et sortent. L'écrire en liste noire obligerait à énumérer les autres natures, et la nature
 *    suivante hériterait d'un réglage sans effet : exactement le défaut qu'on répare.
 *
 * Une liste blanche GÉNÉRALISÉE aurait été le contraire d'une factorisation : il aurait fallu, sur
 * chacun des attributs existants, énumérer les natures qui le réclament — que personne ne peut
 * tenir à jour — et la déclaration absente aurait voulu dire « personne », donc un parc d'attributs
 * qui disparaît. Le défaut reste « tout le monde ».
 */
export type Type_AttributeScope =
  | { only: readonly Type_ElementNature[] }
  | { except: readonly Type_ElementNature[] }

/** Un élément vu comme un sac de propriétés, ou rien du tout. */
const asRecord = (el: unknown): Record<string, unknown> | null =>
  (typeof el === 'object' && el !== null) ? el as Record<string, unknown> : null

/**
 * La nature d'un élément, lue STRUCTURELLEMENT — même procédé que `ElementNaming`, et pour la même
 * raison : les surfaces qui posent la question vivent en aval du modèle, et importer les classes
 * concrètes pour un `instanceof` y refermerait le cycle Element ↔ Handler.
 *
 * Chaque test nomme une capacité réelle, et non une classe : une part se DÉCLARE (`is_figure_part`),
 * un flux a DEUX BOUTS, un nœud PORTE des flux, une zone est un élément de base qui en attache
 * d'autres sans en porter aucun.
 *
 * `null` = pas de nature : un style d'application (`Class_ElementStyle`), un objet quelconque.
 * Il reçoit TOUT, ce qui est le seul choix juste — un style nommé ne dit pas à quelle nature il
 * s'appliquera, et masquer ses réglages le rendrait impossible à écrire.
 */
export const natureOf = (el: unknown): Type_ElementNature | null => {
  const rec = asRecord(el)
  if (!rec) return null
  if (isFigurePartElement(rec)) return 'part'
  if (isLinkLikeElement(rec)) return 'link'
  if ('input_links_dict' in rec) return 'node'
  if ('attached_node' in rec) return 'container'
  return null
}

/** Cette portée parle-t-elle à cette nature ? Sans portée, ou sans nature : oui. */
export const scopeSpeaksTo = (
  scope: Type_AttributeScope | undefined,
  nature: Type_ElementNature | null
): boolean => {
  if (scope === undefined || nature === null) return true
  if ('only' in scope) return scope.only.includes(nature)
  return !scope.except.includes(nature)
}

/** Le catalogue vu comme ce dont on a besoin ici : une portée et une famille par clé. */
const CATALOGUE = ALL_ATTRIBUTES_CONFIG as unknown as {
  [key: string]: { scope?: Type_AttributeScope, category?: string } | undefined
}

/**
 * La FAMILLE d'une clé — sa `category` : 'shape', 'name_label', 'value_label', 'icon',
 * 'stock_label'… Les fabriques de préfixe la posent sur chaque clé dérivée, il n'y a donc aucun nom
 * à découper ici : c'est la déclaration qui dit à quelle famille elle appartient.
 */
export const familyOfAttribute = (attr_key: string): string | undefined =>
  CATALOGUE[attr_key]?.category

/**
 * La portée DÉCLARÉE d'une clé d'attribut, préfixe compris (`shape_border_radius`,
 * `name_label_background_border_radius`…) — la sienne, ou à défaut CELLE DE SA FAMILLE.
 *
 * Quatre étages, du plus précis au plus général, et c'est ce qui permet d'exclure soixante-quatre
 * clés d'un coup sans les énumérer :
 *   1. la portée posée sur CETTE clé préfixée (`ATTRIBUTE_KEY_SCOPES`) ;
 *   2. celle posée sur l'attribut lui-même, qui vaut pour toutes ses copies préfixées ;
 *   3. celle de sa famille (`ATTRIBUTE_FAMILY_SCOPES`) ;
 *   4. rien — donc tout le monde.
 *
 * Les catalogues dérivés recopient la déclaration entière (`createConfigWithPrefix`) : une portée
 * posée une fois sur `border_radius` vaut donc pour la forme de l'élément ET pour le fond de ses
 * étiquettes, sans qu'on ait à l'écrire deux fois. C'est voulu — ce sont les mêmes coins.
 *
 * Clé inconnue = aucune portée = tout le monde : une surface qui interroge une clé qui n'existe pas
 * (un préfixe sans cet attribut) ne masque rien par accident.
 */
export const attributeScopeOf = (attr_key: string): Type_AttributeScope | undefined => {
  const declared = CATALOGUE[attr_key]
  if (declared === undefined) return undefined
  const on_key = ATTRIBUTE_KEY_SCOPES[attr_key]
  if (on_key !== undefined) return on_key
  if (declared.scope !== undefined) return declared.scope
  return declared.category !== undefined ? ATTRIBUTE_FAMILY_SCOPES[declared.category] : undefined
}

/**
 * LA PORTÉE D'UNE FAMILLE, pour qui raisonne par ONGLET et non par champ.
 *
 * C'est la même granularité que l'onglet de l'inspecteur : si aucune clé d'une famille ne parle à
 * une nature, ce n'est pas chaque champ qu'il faut masquer, c'est l'onglet qui ne doit pas s'ouvrir.
 * Le registre (`inspector/registerBaseSections`) peut donc poser sa `gate` là-dessus au lieu de
 * réécrire la règle — une seule vérité, lue par l'onglet comme par le widget.
 */
export const familyAppliesTo = (family: string, nature: Type_ElementNature | null): boolean =>
  scopeSpeaksTo(ATTRIBUTE_FAMILY_SCOPES[family], nature)

/** La même question, posée sur une sélection : oui dès qu'une des natures présentes la réclame. */
export const familyAppliesToElements = (
  elements: readonly unknown[],
  family: string
): boolean => {
  const scope = ATTRIBUTE_FAMILY_SCOPES[family]
  if (scope === undefined || elements.length === 0) return true
  return elements.some(el => scopeSpeaksTo(scope, natureOf(el)))
}

/** Cet attribut s'adresse-t-il à cette nature ? */
export const attributeSpeaksTo = (
  attr_key: string,
  nature: Type_ElementNature | null
): boolean => scopeSpeaksTo(attributeScopeOf(attr_key), nature)

/**
 * LA QUESTION QUE POSE L'INTERFACE : montrer ce réglage pour ce qui est sélectionné ?
 *
 * OUI DÈS QU'UNE des natures présentes le réclame. Une sélection mêlée n'a pas à perdre un réglage
 * parce qu'un intrus ne le lit pas — le masquer priverait les autres, ce qui est un dégât plus
 * grand que le réglage inerte sur l'intrus. Une sélection vide reçoit tout (rien n'est masqué par
 * défaut).
 */
export const attributeAppliesToElements = (
  elements: readonly unknown[],
  attr_key: string
): boolean => {
  const scope = attributeScopeOf(attr_key)
  if (scope === undefined || elements.length === 0) return true
  return elements.some(el => scopeSpeaksTo(scope, natureOf(el)))
}

/**
 * L'AUTRE SENS : les attributs qu'une nature déclare POUR ELLE SEULE — ceux qu'aucune autre ne
 * reçoit, et que l'interface n'a donc pas de raison de connaître à l'avance.
 *
 * C'est ce que Julien demande pour l'orientation des étiquettes d'une couronne (radiale, le long de
 * l'arc, horizontale) : « il faut le mettre dans les options, un peu comme pour nœud et flux où on
 * avait des parties de UI spécifiques ». Une surface qui veut rendre la partie propre d'une nature
 * demande cette liste au lieu de porter la sienne — et la cinquième nature s'y ajoute sans qu'on
 * touche à l'interface.
 *
 * Ne rend QUE les `{ only: [...] }` : un attribut générique dont une nature est exclue n'est pas
 * « à elle », il est à tout le monde sauf une.
 */
export const attributesOwnedBy = (nature: Type_ElementNature): string[] =>
  Object.keys(ALL_ATTRIBUTES_CONFIG).filter(key => {
    const scope = attributeScopeOf(key)
    return scope !== undefined && 'only' in scope && scope.only.includes(nature)
  })
