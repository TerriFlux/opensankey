// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1451 — DES PARTS D'UN GRAPHIQUE D'ANALYSE AUX ÉLÉMENTS DE LA FIGURE.
//
// « Chaque graphe doit être vu comme un ensemble d'éléments avec ses réglages globaux » (Julien,
// 20/09). La couronne y est passée (os#1445) : chaque secteur est un `Class_PartElement`, on le
// touche et l'inspecteur montre sa Forme, son Libellé, sa Valeur. Ce module est l'ADAPTATEUR DES
// BARRES, le pendant exact de `Representations/parts/sunburstParts` (OS) : il part des parts que
// l'analyse produit (`Type_ChartPart`) et rend la monnaie commune de `buildParts`
// (`Type_PartInput`), sujet compris.
//
// Il vit en OS+ pour la raison qui y garde `AnalysisChartData` : lire le modèle (nœuds, flux,
// étiquettes) est le métier d'OS+, et le socle des parts (OS) ne connaît que des identifiants.
//
// ⚠️ UNE PART N'EST PAS TOUJOURS UN NŒUD, et c'est la correction que Julien a posée le 20/09 —
// celle qui a fait refaire le chantier une fois. Les quatre sortes, telles que `AnalysisChartData`
// les produit, et qui sont exactement les quatre de `Type_PartSubject` :
//
//  | axe de la figure                        | ce qu'est une part          | identifiant |
//  | décomposer par flux E/S, sans groupement| un FLUX                     | `link.id`   |
//  | décomposer par flux E/S, groupés        | une SOMME de flux           | `tag.id`    |
//  | décomposer par nœuds enfants            | un NŒUD enfant              | `node.id`   |
//  | décomposer un flux en flux enfants      | un FLUX                     | `link.id`   |
//  | comparer selon les flux (#389)          | un FLUX                     | `link.id`   |
//  | comparer selon des étiquettes           | le SUJET, sous ce millésime | l'id du sujet |
//
// Le cas groupé est celui qui interdit de réduire une part à un élément : sous `group_by`, une part
// est l'addition de tous les flux portant une étiquette (`decomposeNodeFlows`). AUCUN objet unique
// n'est derrière elle — l'étiquette est ce qu'elle DÉSIGNE, pas ce qu'elle EST.
//
// PAS DE SUJET INVENTÉ. Chaque sorte se résout par une RECHERCHE dans le registre que l'axe
// désigne ; introuvable, la réponse est `{kind:'none'}` et jamais une référence fabriquée. Une part
// qui désignerait un flux disparu afficherait un nom mort et renommerait dans le vide. Le cas
// arrive pour de bon : un groupe d'étiquettes supprimé pendant que la figure est ouverte, un
// descripteur enregistré qui cite une dimension qui n'existe plus.
//
// PAS DE RECALCUL DE L'ANALYSE ICI, ET C'EST DÉLIBÉRÉ. `buildAnalysisChartData` BALAIE la sélection
// des étiquettes de données (elle désélectionne, lit, restaure) : la rappeler pour retrouver les
// parts ferait passer le document par des états transitoires une seconde fois, à chaque redessin.
// L'adaptateur reçoit donc les parts que le tracé a déjà en main, et ne fait que dire ce qu'elles
// désignent.

import type {
  Type_AnalysisDescriptor,
  Type_CompareSpec,
  Type_DecomposeSpec
} from '../../Charts/AnalysisDescriptor'
import {
  effectiveCompareSecondary,
  effectiveDecompose,
  isFluxCompare
} from '../../Charts/AnalysisDescriptor'
import type { Type_PartInput } from './buildParts'
import { NO_SUBJECT } from './PartSubject'
import type {
  Type_NamedSubject,
  Type_PartSubject
} from './PartSubject'

import type { Type_ChartPart, Type_ChartSubject } from '../../Charts/AnalysisChartData'

/**
 * Ce que l'adaptateur demande au diagramme : retrouver un objet par son identifiant, et rien de
 * plus. STRUCTUREL ET NON NOMINAL, comme `Type_SunburstPartsSource` et pour la même raison — trois
 * registres suffisent là où importer `Class_Sankey` attacherait ce module au modèle entier (et
 * rendrait ses tests impossibles à écrire sans construire un document complet).
 */
export interface Type_AnalysisPartsSource {
  nodes_dict: { [node_id: string]: Type_NamedSubject }
  links_dict: { [link_id: string]: Type_NamedSubject }
  flux_taggs_dict: { [tagg_id: string]: Type_TagGroupLike | undefined }
  data_taggs_dict: { [tagg_id: string]: Type_TagGroupLike | undefined }
}

/** Un groupe d'étiquettes, réduit à ce qu'on lui demande : la liste de ses étiquettes. */
export interface Type_TagGroupLike {
  tags_list: Type_NamedSubject[]
}

/** Le registre du sujet regardé : nœud et flux exposent le même. */
const sourceOf = (subject: Type_ChartSubject): Type_AnalysisPartsSource =>
  (subject.kind === 'node' ? subject.node.sankey : subject.link.sankey) as
    unknown as Type_AnalysisPartsSource

const subjectIdOf = (subject: Type_ChartSubject): string =>
  subject.kind === 'node' ? subject.node.id : subject.link.id

/** Une recherche : l'objet désigné par cet identifiant, ou `null` si ce n'est pas celui-là. */
type Type_PartLookup = (part_id: string) => Type_PartSubject | null

const nodeLookup = (source: Type_AnalysisPartsSource): Type_PartLookup => (id) => {
  const node = source.nodes_dict[id]
  // Le nœud LUI-MÊME, pas une copie de son nom : la part suit ce que le document dit, et un
  // renommage ailleurs change ce qu'elle affiche tant qu'elle ne porte pas d'alias (cf. le §1 ter
  // du contrat).
  return node ? { kind: 'node', node } : null
}

const linkLookup = (source: Type_AnalysisPartsSource): Type_PartLookup => (id) => {
  const link = source.links_dict[id]
  return link ? { kind: 'flux', link } : null
}

const tagLookup = (group: Type_TagGroupLike | undefined): Type_PartLookup => (id) => {
  const tag = group?.tags_list.find(t => t.id === id)
  return tag ? { kind: 'tag', tag } : null
}

/**
 * Le SUJET LUI-MÊME, quand la part le porte.
 *
 * Sans axe additif, `buildAnalysisChartData` rend une part dont l'identifiant est celui du sujet :
 * « la valeur de CE nœud, sous cette étiquette ». Ce n'est pas une exception qu'on s'autorise, c'est
 * une vérification — la recherche ne rend un sujet que si l'identifiant est bien le sien.
 */
const selfLookup = (subject: Type_ChartSubject): Type_PartLookup => (id) => {
  if (id !== subjectIdOf(subject)) return null
  return subject.kind === 'node'
    ? { kind: 'node', node: subject.node }
    : { kind: 'flux', link: subject.link }
}

/** Les recherches qu'un AXE ADDITIF appelle : une seule, celle du registre qu'il désigne. */
const decomposeLookups = (
  source: Type_AnalysisPartsSource,
  spec: Type_DecomposeSpec
): Type_PartLookup[] => {
  if (spec.kind === 'inputs' || spec.kind === 'outputs') {
    if (!spec.group_by_flux_tagg_id) return [linkLookup(source)]
    const group = source.flux_taggs_dict[spec.group_by_flux_tagg_id]
    // LE GROUPE INTROUVABLE REDONNE DES FLUX, et ce n'est pas une subtilité gratuite :
    // `decomposeSubject` passe alors `undefined` à `decomposeNodeFlows`, qui retombe sur une part
    // par flux. Répondre « étiquette » ici ferait dire `none` à des parts qui sont des flux —
    // l'adaptateur doit lire le modèle comme la décomposition le lit, pas comme le descripteur
    // l'annonce.
    return group ? [tagLookup(group)] : [linkLookup(source)]
  }
  if (spec.kind === 'node_children') return [nodeLookup(source)]
  return [linkLookup(source)]
}

/** Les recherches qu'un AXE DE COMPARAISON appelle : ses flux, ou les étiquettes de son groupe. */
const compareLookups = (
  source: Type_AnalysisPartsSource,
  spec: Type_CompareSpec
): Type_PartLookup[] =>
  isFluxCompare(spec)
    ? [linkLookup(source)]
    : [tagLookup(source.data_taggs_dict[spec.data_tagg_id])]

/**
 * Ce qu'une part de CETTE figure désigne, par identifiant.
 *
 * L'ordre des recherches suit celui de `buildAnalysisChartData` : l'axe ADDITIF commande quand il y
 * en a un d'effectif (les parts sont alors les portions du tout qu'il découpe) ; sinon ce sont les
 * axes de comparaison qui nomment les barres, et en dernier le sujet lui-même. La première
 * recherche qui TROUVE gagne ; aucune ne devine.
 */
export const analysisPartSubjectResolver = (
  subject: Type_ChartSubject,
  descriptor: Type_AnalysisDescriptor
): ((part_id: string) => Type_PartSubject) => {
  const source = sourceOf(subject)
  const decompose = effectiveDecompose(descriptor)
  // Avec un axe additif, les parts SONT sa décomposition : on ne consulte pas les autres registres,
  // qui ne pourraient que se tromper par collision d'identifiants.
  const lookups = decompose
    ? decomposeLookups(source, decompose)
    : [
      ...(descriptor.compare ? compareLookups(source, descriptor.compare) : []),
      ...((): Type_PartLookup[] => {
        const secondary = effectiveCompareSecondary(descriptor)
        return secondary ? compareLookups(source, secondary) : []
      })(),
      selfLookup(subject)
    ]
  return (part_id: string) => {
    for (const lookup of lookups) {
      const found = lookup(part_id)
      if (found) return found
    }
    // Introuvable : aucune référence inventée. Cf. l'en-tête.
    return NO_SUBJECT
  }
}

/** Ce qu'UNE part désigne. Commodité de lecture ; le résolveur ci-dessus sert les listes. */
export const analysisPartSubject = (
  subject: Type_ChartSubject,
  descriptor: Type_AnalysisDescriptor,
  part_id: string
): Type_PartSubject => analysisPartSubjectResolver(subject, descriptor)(part_id)

/**
 * Les parts d'un graphique d'analyse, DANS L'ORDRE OÙ LE TRACÉ LES DESSINE.
 *
 * L'ordre compte : c'est celui sous lequel `buildParts` rend `ordered`, donc celui qu'une lecture
 * « la troisième barre » retrouverait. On rend les parts telles qu'elles arrivent — le classement
 * (`parts_order`) est un réglage du GRAPHE, appliqué par le tracé, et n'a rien à faire ici.
 *
 * @param parts les parts que le tracé dessine — la liste plate d'un histogramme simple
 * (`flatParts`), ou les parts d'une barre pour des barres groupées. Pas le résumé d'un croisement :
 * ses « parts » sont des barres, pas des portions.
 */
export const analysisPartInputs = (
  subject: Type_ChartSubject,
  descriptor: Type_AnalysisDescriptor,
  parts: Type_ChartPart[]
): Type_PartInput[] => {
  const resolve = analysisPartSubjectResolver(subject, descriptor)
  return parts.map(part => ({
    id: part.id,
    label: part.label,
    value: part.value,
    // La couleur que le modèle impose, quand il en impose une ; sinon rien, et c'est la palette de
    // la figure qui commande (cf. `parts_color_source`).
    color: part.color,
    // 23/09/2026 — D'OÙ VIENT LA PART, quand la décomposition est descendue (`parts_hierarchy`).
    // Recopié tel quel : cet adaptateur dit ce qu'une part DÉSIGNE, il ne juge pas ce qu'elle
    // porte. Absents sous un seul cran, donc rien ne change pour le parc enregistré.
    depth: part.depth,
    parent_label: part.parent_label,
    has_children: part.has_children,
    subject: resolve(part.id)
  }))
}
