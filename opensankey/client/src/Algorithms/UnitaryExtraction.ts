// os#1379 (U2) — Extraction `global → (briques + assemblage)` et composition inverse.
//
// Le chantier U2 industrialise ce que `Algorithms/UnitaryBoard.tsx` ne faisait
// qu'AFFICHER : dériver, d'un Sankey global chargé, un fichier OpenSankey de
// BRIQUE par procédé (os#1378, section racine `process`) plus un fichier
// d'ASSEMBLAGE (`types/UnitaryAssembly.ts`). Critère de recette de
// NOTE-SANKEY-UNITAIRES.md §5 : `global → (briques + assemblage) → global`
// redonne le même diagramme, valeurs comprises.
//
// CE QU'EST UN PROCÉDÉ, ICI — un nœud VISIBLE portant le tag `secteur` du groupe
// `'type de noeud'` (clé en MINUSCULES dans `node_taggs_dict`, cf.
// `Elements/Node.tsx:2362`) et PAS le tag `echange`. Sans ce groupe, ou sans ce
// tag, il n'y a aucune brique à tirer : on rend un assemblage à zéro brique dont
// le shell est le global entier. Ce n'est pas une erreur — beaucoup de diagrammes
// ne sont pas des flux matière.
//
// AUCUNE BIPARTITION N'EST SUPPOSÉE. Un flux secteur → secteur est légitime (le
// corpus grand_est en compte 775 sur 775) et appartient aux DEUX étoiles : il est
// écrit dans les deux briques, et la composition le refait en fusionnant par id.
// Un flux produit → produit l'est aussi (fichiers WooDyn) : hors de toute étoile,
// il reste dans le shell.
//
// NIVEAU D'AGRÉGATION — on lit EXCLUSIVEMENT `visible_input_links_list` /
// `visible_output_links_list` (`Elements/Node.tsx:2570` et `:2573`), jamais
// `input_links_list` : sur un diagramme à plusieurs niveaux, les listes complètes
// mêlent le flux agrégé et ses enfants, et l'étoile double-compterait (symptôme
// Bois Savoie). On les lit sur le diagramme SOURCE, avant toute amputation —
// la brique, elle, ne contient plus que l'étoile, ses getters de visibilité
// n'ont donc plus la même assiette. (Historique : les view tags unitaires et
// leur bypass de la porte des niveaux ont été supprimés par os#1382.)
//
// NŒUDS D'ÉCHANGE — l'extraction travaille sur l'état ÉCLATÉ (les nœuds splittés
// par `afterFromJSON`), parce que ce sont ces identifiants-là que le `node_id` d'un
// port doit porter. TOUTES les sérialisations passent donc par `keep_siblings: true` :
// sans lui, `SankeyPersistence.toJSON` réécrit un nœud éclaté sous l'id de son
// AGRÉGAT (`Persistence/SankeyPersistence.tsx:1431-1441`) et les `node_id` des ports
// ne désigneraient plus rien dans leur propre fichier.
//
// COMMENT UNE BRIQUE EST FABRIQUÉE — copie complète puis suppression, la voie
// éprouvée par `buildUnitaryDrawingArea` : on repart du JSON du global, on le
// charge dans un `Class_ApplicationData` NEUF, et on supprime tout nœud hors de
// l'étoile par `drawing_area.deleteNode`, qui cascade proprement sur les flux
// (`types/DrawingArea.tsx:1967-1977`). On hérite ainsi gratuitement des tags, des
// unités, des dimensions, des styles et de la légende — c'est-à-dire de tout ce
// qui fait qu'une brique est un fichier OpenSankey ordinaire.

import { Class_ApplicationData } from '../types/ApplicationData'
import { DrawingAreaPersistence } from '../Persistence/SankeyPersistence'
import { link_ratio_constraint } from '../types/Utils'
import { unitaryAssemblyToJSON, unitaryAssemblyFromJSON } from '../types/UnitaryAssembly'
import { unitaryProcessPortKey } from '../types/UnitaryProcess'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_Tag, Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_Sankey } from '../types/Sankey'
import type { Type_JSON } from '../types/Utils'
import type {
  Type_UnitaryProcess, Type_UnitaryProcessPort, Type_UnitaryProcessPortDirection,
  Type_UnitaryProcessActivityReference
} from '../types/UnitaryProcess'
import type {
  Type_UnitaryAssembly, Type_UnitaryAssemblyConnection
} from '../types/UnitaryAssembly'

/** Le groupe de tags qui dit la nature d'un nœud. Clé en minuscules — cf. en-tête. */
const NODE_TYPE_TAGG_ID = 'type de noeud'
const SECTOR_TAG_ID = 'secteur'
const EXCHANGE_TAG_ID = 'echange'

/**
 * Les kwargs de TOUTE sérialisation de ce module.
 *  - `keep_siblings` : les nœuds d'échange restent écrits éclatés (cf. en-tête) ;
 *  - `without_sheets` : une brique est le contenu d'UNE feuille, elle n'embarque
 *    pas les autres feuilles du document (`ApplicationData.sheetsToJSON`).
 */
const SERIALIZATION_KWARGS: Type_JSON = { keep_siblings: true, without_sheets: true }

/**
 * Clés d'ADJACENCE d'un nœud : listes d'identifiants de flux, dérivées du
 * voisinage et non du nœud lui-même (`SankeyPersistence.tsx:866-892`). Un nœud
 * présent dans deux briques les a donc DIFFÉRENTES — tronquées à ce que chaque
 * étoile contient. Elles sont réunies à la composition, pas comparées.
 */
const ADJACENCY_KEYS = ['inputLinksId', 'outputLinksId', 'links_order']

/** Le résultat de l'extraction : un JSON de fichier par brique, plus l'assemblage. */
export type Type_UnitaryExtraction = {
  // Un fichier OpenSankey complet par procédé, keyé par l'id du nœud-procédé.
  bricks: { [process_node_id: string]: Type_JSON }
  // Le fichier d'assemblage (`unitary_assembly: true`, cf. types/UnitaryAssembly).
  assembly: Type_JSON
}

const cloneJSON = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Charge un JSON dans une application NEUVE, sans dessiner (usage hors écran). */
const loadDetachedApp = (json: Type_JSON): Class_ApplicationData => {
  const app = new Class_ApplicationData(false)
  app.fromJSON(cloneJSON(json) as never, {}, false)
  return app
}

/**
 * Les nœuds-procédés du diagramme, dans l'ordre du modèle. Liste vide si le
 * diagramme n'a pas de groupe `'type de noeud'` ou pas de tag `secteur` : il n'y a
 * alors rien à extraire, et c'est un verdict, pas une erreur.
 */
const listProcessNodes = (sankey: Class_Sankey): Class_NodeElement[] => {
  const node_tagg = sankey.node_taggs_dict[NODE_TYPE_TAGG_ID]
  if (!node_tagg) return []
  const sector_tag = node_tagg.tags_dict[SECTOR_TAG_ID] as Class_Tag | undefined
  if (!sector_tag) return []
  const exchange_tag = node_tagg.tags_dict[EXCHANGE_TAG_ID] as Class_Tag | undefined
  return sankey.visible_nodes_list.filter(node =>
    node.hasGivenTag(sector_tag) && !(exchange_tag !== undefined && node.hasGivenTag(exchange_tag))
  )
}

/**
 * L'ÉTOILE d'un procédé : lui-même, plus l'extrémité opposée de chacun de ses
 * flux VISIBLES. C'est le périmètre exact de sa brique.
 */
const starNodeIds = (process_node: Class_NodeElement): Set<string> => {
  const ids = new Set<string>([process_node.id])
  process_node.visible_input_links_list.forEach(link => ids.add(link.source.id))
  process_node.visible_output_links_list.forEach(link => ids.add(link.target.id))
  return ids
}

/** La valeur AFFICHÉE d'un flux — celle que le calcul des `%ID` utilise (`types/Utils.tsx:731`). */
const linkValue = (link: Class_LinkElement): number => link.valueCurrent ?? 0

const sumLinkValues = (links: Class_LinkElement[]): number =>
  links.reduce((total, link) => total + linkValue(link), 0)

/**
 * Coefficient DÉCLARÉ d'un flux, ou `null` s'il n'y en a pas.
 *
 * SOURCE DÉCLARÉE > CALCUL : si une contrainte de ratio flux
 * (`Type_RatioFluxConstraint`, `types/Sankey.tsx:74-85`) prescrit ce flux ET la
 * rapporte exactement aux ENTRÉES du procédé central (`origin_ref === '*'` et
 * `destination_ref` = le procédé, c'est-à-dire la lecture « X → Y = 50 % des
 * entrées de P » de `ratio_flux_constraint_traduction`), c'est SON coefficient
 * qu'on retient : il est ce que l'auteur a écrit, quand le nôtre n'est qu'un
 * quotient de valeurs réconciliées. Une contrainte rapportée à autre chose (un
 * flux nommé, les sorties d'un tiers) ne dit PAS la même grandeur et n'est pas
 * reprise.
 *
 * NE VAUT QUE POUR LA GRANDEUR DE RÉFÉRENCE : `link_ratio_constraint` apparie la
 * contrainte à la combinaison de dataTags COURANTE du flux
 * (`types/Utils.tsx:414-421`), c'est-à-dire à la tranche sélectionnée. Une
 * contrainte ne dit donc jamais rien des AUTRES grandeurs du multi-flux, et
 * l'appelant ne l'interroge que pour le tag d'unité de référence.
 */
const declaredCoefficient = (
  link: Class_LinkElement,
  process_node: Class_NodeElement
): number | null => {
  const constraint = link_ratio_constraint(link)
  if (
    constraint !== null && constraint.coef !== null &&
    constraint.origin_ref === '*' && constraint.destination_ref === process_node.name
  ) return constraint.coef
  return null
}

/**
 * La DIMENSION D'UNITÉ du diagramme : le premier groupe de dataTags marqué
 * `is_unit`, ou `null`. C'est par elle que passe le multi-flux (os#1380) — un
 * diagramme qui mesure la matière, l'énergie, l'eau et l'azote porte une tranche
 * de valeurs par unité, exactement comme le corpus SOCLE Lait (4 unités).
 *
 * MÊME CHOIX QUE L'AFFICHAGE : `format_value` (`types/Utils.tsx:683`) prend lui
 * aussi le PREMIER groupe `is_unit` de `getTagGroupsAsList('data_taggs')` — donc
 * dans l'ordre des groupes du document. Les deux désignent ainsi la même
 * dimension, et un port ne peut pas nommer une grandeur que le libellé du flux
 * ignore.
 */
const unitTagGroup = (sankey: Class_Sankey): Class_DataTagGroup | null => {
  const unit_taggs = sankey.getTagGroupsAsList('data_taggs')
    .filter(tagg => (tagg as Class_DataTagGroup).is_unit) as Class_DataTagGroup[]
  return unit_taggs.length > 0 ? unit_taggs[0] : null
}

/**
 * Le tag d'unité de RÉFÉRENCE : la tranche sélectionnée, celle que `valueCurrent`
 * rend et donc celle qui définit le niveau d'activité. À défaut de sélection (cas
 * dégénéré d'un groupe dont aucun tag n'est coché), le premier tag du groupe.
 */
const referenceUnitTag = (unit_tagg: Class_DataTagGroup): Class_DataTag | null =>
  (unit_tagg.selected_tags_list[0] ?? unit_tagg.tags_list[0] ?? null) as Class_DataTag | null

/**
 * Valeur d'UNE tranche d'unité sur un flux, ou `null` si le flux n'a pas de valeur
 * pour cette grandeur — une brique ne doit pas inventer un 0 là où le diagramme ne
 * mesure rien.
 *
 * On refait la résolution de `Class_LinkElement.valueForTag` (`Elements/Link.tsx:2173`)
 * — le tag imposé sur SA dimension, la sélection courante sur les autres — puis on
 * lit le nombre par `valueForDataTags` (`:2166`), qui applique exactement la règle de
 * `valueCurrent` (données brutes ou résultat réconcilié selon `type_data`). Les
 * coefficients d'une grandeur et le niveau d'activité sont donc lus à la même aune.
 */
const sliceValue = (link: Class_LinkElement, tag: Class_DataTag): number | null => {
  const data_tags = link.sankey.data_taggs_list.map(tagg =>
    (tagg === tag.group ? tag : tagg.selected_tags_list[0]) as Class_DataTag)
  return link.valueForDataTags(data_tags)
}

/** Ce qu'un port accumule avant d'être écrit : cf. « flux parallèles » ci-dessous. */
type Type_PortAccumulator = {
  port: Type_UnitaryProcessPort
  // Somme des valeurs des flux visibles qui tombent sur ce port.
  total: number
  // Coefficient prescrit par une contrainte de ratio, s'il y en a une.
  declared: number | null
}

/**
 * La section `process` d'une brique, lue sur le diagramme SOURCE.
 *
 * NIVEAU D'ACTIVITÉ — la somme des entrées visibles du procédé, conformément à la
 * convention V1 (« la somme des coefficients d'entrée de la grandeur de référence
 * vaut 1 »). Il est UNIQUE : toutes les grandeurs du multi-flux lui sont
 * rapportées, c'est ce qui les rend comparables entre elles (1 kt de grume, et à
 * côté les kWh et les m³ qu'il a fallu).
 *
 * REPLI sur les SORTIES quand cette somme est nulle (procédé sans entrée valuée :
 * une source, un import pur, un procédé dont les entrées ne sont pas renseignées).
 * L'activité devient alors la somme des SORTIES visibles, et chaque coefficient de
 * sortie est la part du flux dans ce total — l'énoncé symétrique de la convention.
 * Le choix : mieux vaut une brique à l'échelle de ce qu'elle produit qu'une brique
 * dont tous les coefficients seraient omis. Si les deux sommes sont nulles
 * (procédé isolé, valeurs absentes), l'activité vaut 0 et AUCUN coefficient n'est
 * écrit — l'absence dit « le fichier ne le dit pas », jamais zéro.
 *
 * ENTRÉE **ET** SORTIE — depuis os#1380, `ports` est une LISTE dont l'identité est
 * le triplet `(node_id, direction, quantity_ref)`. Un même voisin à la fois en
 * amont et en aval du procédé (recyclage, retour de connexes, boucle) donne donc
 * DEUX ports, un par sens. C'était la limite « premier arrivé gagne, l'entrée
 * écrase la sortie » du format U0 : elle est levée, et la sortie n'est plus muette.
 *
 * FLUX PARALLÈLES — deux flux VISIBLES entre le même voisin et le procédé, dans le
 * même sens, tombent sur le MÊME port pour une grandeur donnée : leurs valeurs y
 * sont SOMMÉES. C'est le seul choix cohérent avec l'identité de port, et il est
 * juste : un port dit « ce que ce voisin échange avec ce procédé dans ce sens »,
 * pas « ce que tel tracé transporte ». Si l'un des deux porte une contrainte de
 * ratio déclarée, elle prime pour le port entier (source déclarée > calcul).
 *
 * MULTI-GRANDEURS — sans dimension d'unité, un port par (voisin × sens), sans
 * `quantity_ref` : la grandeur est celle du diagramme, implicite. Avec une
 * dimension d'unité, un port par (voisin × sens × tag d'unité), chacun nommant sa
 * grandeur (`quantity_ref` = id du tag) et son unité (`unit_ref` = nom du tag) —
 * la grandeur de référence comprise, qui est ainsi nommée plutôt que laissée
 * implicite : dans une brique qui en mesure quatre, un port anonyme se lirait mal.
 * Une tranche ABSENTE ne produit pas de port (cf. `sliceValue`).
 */
const buildProcessSection = (process_node: Class_NodeElement): Type_UnitaryProcess => {
  const input_links = process_node.visible_input_links_list
  const output_links = process_node.visible_output_links_list
  const total_input = sumLinkValues(input_links)
  const activity = total_input !== 0 ? total_input : sumLinkValues(output_links)
  const unit_tagg = unitTagGroup(process_node.sankey)
  const reference_tag = unit_tagg !== null ? referenceUnitTag(unit_tagg) : null

  // Les ports dans l'ordre où ils apparaissent (entrées puis sorties, et pour
  // chaque flux les grandeurs dans l'ordre des tags) ; le dictionnaire ne sert
  // qu'à retrouver l'accumulateur d'une identité déjà rencontrée.
  const accumulators: Type_PortAccumulator[] = []
  const by_key: { [key: string]: Type_PortAccumulator } = {}
  const accumulate = (
    node_id: string,
    direction: Type_UnitaryProcessPortDirection,
    tag: Class_DataTag | null,
    value: number,
    declared: number | null
  ) => {
    const port: Type_UnitaryProcessPort = { node_id, direction }
    if (tag !== null) {
      port.quantity_ref = tag.id
      port.unit_ref = tag.name
    }
    const key = unitaryProcessPortKey(port)
    let accumulator = by_key[key]
    if (accumulator === undefined) {
      accumulator = { port, total: 0, declared: null }
      by_key[key] = accumulator
      accumulators.push(accumulator)
    }
    accumulator.total += value
    if (accumulator.declared === null) accumulator.declared = declared
  }

  const addLink = (link: Class_LinkElement, direction: Type_UnitaryProcessPortDirection) => {
    const opposite_node_id = direction === 'input' ? link.source.id : link.target.id
    if (unit_tagg === null) {
      accumulate(opposite_node_id, direction, null, linkValue(link), declaredCoefficient(link, process_node))
      return
    }
    unit_tagg.tags_list.forEach(tag => {
      const data_tag = tag as Class_DataTag
      const value = sliceValue(link, data_tag)
      if (value === null) return // tranche absente : pas de port, pas de 0 inventé
      // Seule la grandeur de référence peut être prescrite par une contrainte.
      const declared = data_tag === reference_tag ? declaredCoefficient(link, process_node) : null
      accumulate(opposite_node_id, direction, data_tag, value, declared)
    })
  }

  input_links.forEach(link => addLink(link, 'input'))
  output_links.forEach(link => addLink(link, 'output'))

  const ports = accumulators.map(({ port, total, declared }) => {
    if (declared !== null) return { ...port, coefficient: declared }
    // Un quotient par zéro ne serait pas « 0 », il serait faux : le port sort
    // alors sans coefficient, ce qui dit « le fichier ne le dit pas ».
    if (activity === 0) return port
    return { ...port, coefficient: total / activity }
  })

  const activity_reference: Type_UnitaryProcessActivityReference = { value: activity }
  // L'activité est exprimée dans l'unité de la tranche SÉLECTIONNÉE : c'est elle
  // que `valueCurrent` rend, donc elle que les sommes ci-dessus ont additionnée.
  if (reference_tag !== null) activity_reference.unit_ref = reference_tag.name
  return { central_node_id: process_node.id, activity_reference, ports }
}

/**
 * Le graphe port-à-port : un raccord par (produit, procédé amont, procédé aval).
 *
 * Seuls les nœuds NON-procédés portent des raccords — un flux secteur → secteur
 * n'en produit aucun, il vit dans les deux briques (cf. en-tête). Le résultat est
 * dédoublonné et trié : un assemblage doit être comparable d'une extraction à
 * l'autre.
 */
const buildConnections = (
  sankey: Class_Sankey,
  process_ids: Set<string>
): Type_UnitaryAssemblyConnection[] => {
  const connections: Type_UnitaryAssemblyConnection[] = []
  const seen = new Set<string>()
  sankey.visible_nodes_list.forEach(node => {
    if (process_ids.has(node.id)) return
    const upstream = node.visible_input_links_list
      .map(link => link.source.id).filter(id => process_ids.has(id))
    const downstream = node.visible_output_links_list
      .map(link => link.target.id).filter(id => process_ids.has(id))
    upstream.forEach(from => downstream.forEach(to => {
      const key = [node.id, from, to].join('\t')
      if (seen.has(key)) return
      seen.add(key)
      connections.push({ product: node.id, from, to })
    }))
  })
  return connections.sort((a, b) =>
    a.product.localeCompare(b.product) || a.from.localeCompare(b.from) || a.to.localeCompare(b.to))
}

const jsonSubObject = (json: Type_JSON, key: string): { [id: string]: unknown } =>
  (json[key] as { [id: string]: unknown } | undefined) ?? {}

/**
 * Fabrique le JSON d'UNE brique : copie complète de la source puis suppression de
 * tout ce qui est hors de l'étoile, et pose de la section `process`.
 *
 * C'est le geste unique partagé par `extractUnitaryBricks` (qui l'appelle une
 * fois par procédé) et `extractUnitaryBrickFor` (qui l'appelle une seule fois,
 * pour un nœud arbitraire). Le JSON source lui est PASSÉ : l'appelant en série ne
 * le resérialise pas à chaque brique — et chacun choisit le NIVEAU auquel il
 * sérialise (application pour l'extraction, drawing area pour l'aperçu, cf.
 * `extractUnitaryBrickFor`).
 */
const buildBrickJSON = (
  source_json: Type_JSON,
  star: Set<string>,
  process_section: Type_UnitaryProcess
): Type_JSON => {
  const brick_app = loadDetachedApp(source_json)
  const brick_sankey = brick_app.drawing_area.sankey
  // Copie complète puis suppression : `deleteNode` cascade sur les flux, donc
  // l'ordre « flux puis nœuds » n'a pas à être orchestré ici.
  brick_sankey.nodes_list
    .filter(brick_node => !star.has(brick_node.id))
    .forEach(brick_node => brick_app.drawing_area.deleteNode(brick_node))
  brick_sankey.unitary_process = process_section
  return brick_app.toJSON(SERIALIZATION_KWARGS) as Type_JSON
}

/**
 * L'étoile d'UN nœud arbitraire, rendue comme un fichier OpenSankey de brique —
 * la matière première de l'APERÇU unitaire (os#1382, chantier U5).
 *
 * Le board unitaire accepte tout nœud VISIBLE qui n'est pas un nœud d'échange
 * (cf. `ModalUnitarySankeyOSP.tsx`, `centralCandidates`) : produit, secteur, ou
 * nœud d'un diagramme sans groupe `'type de noeud'` du tout. On ne filtre donc
 * PAS sur le tag `secteur` ici — c'est la différence avec `extractUnitaryBricks`,
 * qui, lui, dérive un modèle de procédés et n'a de sens que sur les secteurs.
 *
 * `null` quand le nœud est inconnu ou invisible : il n'y a alors pas d'étoile à
 * montrer, et ce n'est pas une erreur (un focus sur un nœud masqué par un
 * changement de niveau, par exemple).
 *
 * PERF — O(graphe) par appel : la brique est fabriquée par copie complète du
 * global puis suppression, comme les briques de l'extraction. C'est assumé,
 * parce que c'est exactement le coût d'ouverture du board unitaire d'aujourd'hui
 * (`buildUnitaryDrawingArea` sérialise et recharge le global entier). Un focus
 * successif sur N nœuds paie donc N fois ce prix, pas une fois.
 *
 * POURQUOI CE POINT D'ENTRÉE SÉRIALISE AU NIVEAU DRAWING AREA, et non
 * `app_data.toJSON` comme `extractUnitaryBricks` — deux raisons, toutes deux
 * propres à l'aperçu :
 *
 *  1. LA VUE AFFICHÉE. Sur une application à vues hors du maître
 *     (`ApplicationDataOSP._toJSONWithoutContextOverlay`), `toJSON` rend à la
 *     racine le MAÎTRE et range la vue courante dans `_views`. On lit pourtant le
 *     nœud, ses flux et leurs valeurs sur `app_data.drawing_area`, c'est-à-dire
 *     sur la VUE : la brique serait découpée dans un autre diagramme que celui
 *     qu'on vient de mesurer, et l'aperçu montrerait l'étoile du maître avec les
 *     coefficients de la vue. `DrawingAreaPersistence.toJSON` sérialise
 *     exactement la drawing area qu'on a lue — la même, toujours.
 *  2. ZÉRO EFFET DE BORD. Ce même chemin gzippe la vue courante dans `_views` et
 *     lève `ref_to_save_in_cache_indicator`. L'aperçu s'ouvre et se refocalise à
 *     chaque clic : il n'a rien à faire enregistrer.
 *
 * L'aval ne change pas : la RACINE d'un fichier OpenSankey EST un JSON de
 * drawing area (`ApplicationData._toJSON` n'ajoute que des clés de niveau
 * application par-dessus). Le rechargement dans une application neuve, ici comme
 * côté board, lit donc la même chose. Les kwargs passent tels quels :
 * `keep_siblings` est consommé plus bas, par `SankeyPersistence.toJSON` (c'est
 * lui qui décide d'écrire les nœuds d'échange éclatés ou agrégés) ; seul
 * `without_sheets` devient sans objet, les feuilles étant de niveau application
 * — une brique n'en portait de toute façon aucune.
 *
 * `extractUnitaryBricks`, lui, RESTE au niveau application : son shell doit être
 * le global entier, clés d'application comprises, sous peine de casser la recette
 * `global → (briques + assemblage) → global` du chantier U2.
 */
export const extractUnitaryBrickFor = (
  app_data: Class_ApplicationData,
  node_id: string
): Type_JSON | null => {
  const drawing_area = app_data.drawing_area
  const node = drawing_area.sankey.nodes_dict[node_id] as Class_NodeElement | undefined
  if (node === undefined || !node.is_visible) return null
  const source_json = DrawingAreaPersistence.toJSON(drawing_area, SERIALIZATION_KWARGS) as Type_JSON
  // La section `process` se lit sur le diagramme SOURCE, avant toute amputation
  // (cf. « niveau d'agrégation » en tête de module).
  return buildBrickJSON(source_json, starNodeIds(node), buildProcessSection(node))
}

/**
 * Extrait d'un global chargé un fichier OpenSankey de brique par procédé, plus le
 * fichier d'assemblage qui porte l'échelle de chaque brique, le graphe port-à-port
 * et le SHELL — le global amputé de tout ce qui est parti dans une brique.
 *
 * L'application source n'est pas modifiée : chaque brique est fabriquée dans une
 * application détachée, à partir d'une copie du JSON du global.
 */
export const extractUnitaryBricks = (app_data: Class_ApplicationData): Type_UnitaryExtraction => {
  const sankey = app_data.drawing_area.sankey
  const process_nodes = listProcessNodes(sankey)
  const process_ids = new Set(process_nodes.map(node => node.id))
  // Le JSON de référence : c'est LUI qu'on ampute pour le shell et qu'on clone
  // pour chaque brique, de sorte que les trois sorties parlent des mêmes octets.
  const global_json = app_data.toJSON(SERIALIZATION_KWARGS) as Type_JSON

  // Les sections `process` sont calculées AVANT toute fabrication de brique : elles
  // se lisent sur le diagramme source, au niveau d'agrégation où il se trouve.
  const process_sections: { [process_node_id: string]: Type_UnitaryProcess } = {}
  const stars: { [process_node_id: string]: Set<string> } = {}
  process_nodes.forEach(node => {
    process_sections[node.id] = buildProcessSection(node)
    stars[node.id] = starNodeIds(node)
  })

  const bricks: { [process_node_id: string]: Type_JSON } = {}
  process_nodes.forEach(node => {
    bricks[node.id] = buildBrickJSON(global_json, stars[node.id], process_sections[node.id])
  })

  // Le shell : le global moins ce que les briques emportent. On lit les identifiants
  // sur les briques FABRIQUÉES plutôt que sur les étoiles : c'est exactement ce qui
  // a été écrit ailleurs, donc exactement ce qu'il faut retirer ici — un flux entre
  // deux membres d'une même étoile part avec elle, même s'il ne touche pas le procédé.
  const covered_nodes = new Set<string>()
  const covered_links = new Set<string>()
  Object.values(bricks).forEach(brick => {
    Object.keys(jsonSubObject(brick, 'nodes')).forEach(id => covered_nodes.add(id))
    Object.keys(jsonSubObject(brick, 'links')).forEach(id => covered_links.add(id))
  })
  const shell = cloneJSON(global_json)
  // La clé racine `process` : le shell n'est pas une brique. Rien d'AUTRE n'est
  // retiré — tags, unités, niveaux, styles, légende, vues, ordre de dessin restent,
  // et c'est ce qui fait que la recomposition rend le global et pas une approximation.
  delete shell['process']
  const kept_nodes: Type_JSON = {}
  Object.entries(jsonSubObject(shell, 'nodes')).forEach(([id, value]) => {
    if (!covered_nodes.has(id)) kept_nodes[id] = value as Type_JSON
  })
  const kept_links: Type_JSON = {}
  Object.entries(jsonSubObject(shell, 'links')).forEach(([id, value]) => {
    if (!covered_links.has(id)) kept_links[id] = value as Type_JSON
  })
  shell['nodes'] = kept_nodes
  shell['links'] = kept_links

  const assembly_bricks: Type_UnitaryAssembly['bricks'] = {}
  process_nodes.forEach(node => {
    // os#1380 — l'unité du niveau d'activité est celle de la GRANDEUR DE
    // RÉFÉRENCE, c'est-à-dire du tag d'unité sélectionné quand le diagramme porte
    // une dimension `is_unit`. Sans cette dimension elle reste implicite (celle du
    // diagramme) et la clé n'est pas écrite : rien d'autre, dans le global, ne
    // désigne une unité par procédé.
    const activity_reference = process_sections[node.id].activity_reference
    assembly_bricks[node.id] = { activity: activity_reference?.value ?? 0 }
    if (activity_reference?.unit_ref !== undefined)
      assembly_bricks[node.id].unit_ref = activity_reference.unit_ref
  })
  const assembly: Type_UnitaryAssembly = {
    bricks: assembly_bricks,
    connections: buildConnections(sankey, process_ids),
    shell
  }
  return { bricks, assembly: unitaryAssemblyToJSON(assembly) }
}

/** Égalité profonde par sérialisation à clés triées — les objets JSON ici sont petits. */
const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']'
  const entries = Object.entries(value as Record<string, unknown>).sort((a, b) => a[0] < b[0] ? -1 : 1)
  return '{' + entries.map(([k, v]) => JSON.stringify(k) + ':' + stableStringify(v)).join(',') + '}'
}

/** Réunion ordonnée de deux listes d'identifiants : l'ordre du premier, puis les manquants. */
const unionIds = (first: unknown, second: unknown): string[] => {
  const out = Array.isArray(first) ? [...(first as string[])] : []
  if (Array.isArray(second)) (second as string[]).forEach(id => { if (!out.includes(id)) out.push(id) })
  return out
}

/**
 * Fusionne deux écritures du MÊME nœud, vues depuis deux briques.
 *
 * Les listes d'adjacence sont RÉUNIES (elles sont tronquées à l'étoile qui les a
 * écrites) ; tout le reste doit être identique, sinon c'est un bug d'extraction et
 * on le dit — un nœud silencieusement recollé dans deux états différents ferait un
 * global plausible et faux.
 */
const mergeNodeJSON = (
  existing: Type_JSON,
  incoming: Type_JSON,
  node_id: string,
  incoming_brick_id: string
): Type_JSON => {
  const strip = (json: Type_JSON) => {
    const copy = { ...json } as Record<string, unknown>
    ADJACENCY_KEYS.forEach(key => delete copy[key])
    return copy
  }
  if (stableStringify(strip(existing)) !== stableStringify(strip(incoming))) {
    throw new Error(
      'composeUnitaryBricks : le noeud « ' + node_id + ' » est ecrit differemment par la brique « ' +
      incoming_brick_id + ' » et par une brique precedente. C est un bug d extraction : ' +
      'deux etoiles ne doivent jamais diverger sur le contenu d un noeud partage.'
    )
  }
  const merged = { ...existing } as Record<string, unknown>
  ADJACENCY_KEYS.forEach(key => {
    const union = unionIds(existing[key], incoming[key])
    if (union.length > 0) merged[key] = union
  })
  return merged as Type_JSON
}

/**
 * Repose un dictionnaire dans l'ordre d'une liste d'identifiants de référence ;
 * ce qu'elle ne nomme pas va à la fin, dans l'ordre d'arrivée.
 */
const orderByReference = (entries: Type_JSON, reference: string[]): Type_JSON => {
  const rank: { [id: string]: number } = {}
  reference.forEach((id, index) => { if (rank[id] === undefined) rank[id] = index })
  const ordered: Type_JSON = {}
  Object.keys(entries)
    .map((id, index) => ({ id, rank: rank[id] !== undefined ? rank[id] : reference.length + index }))
    .sort((a, b) => a.rank - b.rank)
    .forEach(({ id }) => { ordered[id] = entries[id] })
  return ordered
}

/** L'ordre donné, épuré de ce qui n'est pas candidat, puis complété par les candidats manquants. */
const completeIds = (given: unknown, candidates: string[]): string[] => {
  const kept = (Array.isArray(given) ? (given as string[]) : []).filter(id => candidates.includes(id))
  candidates.forEach(id => { if (!kept.includes(id)) kept.push(id) })
  return kept
}

/**
 * Rétablit les listes d'adjacence des nœuds recomposés.
 *
 * Une brique n'écrit que les flux de SON étoile : un nœud partagé, ou dont un flux
 * est resté dans le shell, arrive avec une adjacence TRONQUÉE. Or la persistance ne
 * réapplique `links_order` que s'il a exactement la bonne longueur
 * (`SankeyPersistence.tsx:922`) — une liste incomplète est donc silencieusement
 * ignorée au chargement, et l'ordre des flux autour du nœud n'est plus celui du
 * global. On la complète ici depuis le jeu de flux FINAL : l'ordre connu d'abord,
 * puis le reste dans l'ordre de dessin du diagramme.
 */
const completeNodeAdjacency = (nodes: Type_JSON, links: Type_JSON): void => {
  const incoming: { [node_id: string]: string[] } = {}
  const outgoing: { [node_id: string]: string[] } = {}
  Object.entries(links).forEach(([link_id, link_json]) => {
    const link = link_json as Record<string, unknown>
    const source = link['idSource']
    const target = link['idTarget']
    if (typeof source === 'string') (outgoing[source] = outgoing[source] ?? []).push(link_id)
    if (typeof target === 'string') (incoming[target] = incoming[target] ?? []).push(link_id)
  })
  Object.entries(nodes).forEach(([node_id, node_json]) => {
    const node = node_json as Record<string, unknown>
    const node_incoming = incoming[node_id] ?? []
    const node_outgoing = outgoing[node_id] ?? []
    // Même politique d'écriture que la persistance : la clé n'existe que si la
    // liste n'est pas vide (cf. `SankeyPersistence.tsx:885-892`).
    const assign = (key: string, ids: string[]) => {
      if (ids.length > 0) node[key] = ids
      else delete node[key]
    }
    assign('inputLinksId', completeIds(node['inputLinksId'], node_incoming))
    assign('outputLinksId', completeIds(node['outputLinksId'], node_outgoing))
    // `links_order` mêle entrées et sorties : les candidats sont tous les flux
    // incidents, dans l'ordre du dictionnaire final.
    const incident = Object.keys(links).filter(link_id =>
      node_incoming.includes(link_id) || node_outgoing.includes(link_id))
    assign('links_order', completeIds(node['links_order'], incident))
  })
}

/**
 * L'inverse mécanique de `extractUnitaryBricks` : recolle les briques sur le shell
 * et rend le JSON du global.
 *
 * C'est un VÉRIFICATEUR DE BIJECTION, pas la composition du chantier U3 : il ne
 * met pas les briques à l'échelle de leur niveau d'activité et ne réconcilie rien
 * aux coutures — ce calcul-là vit côté plateforme Python (mfa#252), avec la matrice
 * qu'il faut pour fermer les bilans. Ici on remonte le puzzle par identifiant, et
 * l'on vérifie que les pièces s'emboîtent.
 *
 * Premier arrivé gagne ; un identifiant réécrit différemment lève une erreur
 * explicite (cf. `mergeNodeJSON`).
 */
export const composeUnitaryBricks = (
  bricks: { [process_node_id: string]: Type_JSON },
  assembly_json: Type_JSON
): Type_JSON => {
  const assembly = unitaryAssemblyFromJSON(assembly_json)
  if (assembly === null) {
    throw new Error('composeUnitaryBricks : le fichier d assemblage est illisible (cf. unitaryAssemblyFromJSON).')
  }
  const composed = cloneJSON(assembly.shell)
  const nodes = { ...jsonSubObject(composed, 'nodes') } as Type_JSON
  const links = { ...jsonSubObject(composed, 'links') } as Type_JSON
  Object.entries(bricks).forEach(([brick_id, brick]) => {
    Object.entries(jsonSubObject(brick, 'nodes')).forEach(([node_id, node_json]) => {
      const incoming = cloneJSON(node_json) as Type_JSON
      const existing = nodes[node_id] as Type_JSON | undefined
      nodes[node_id] = existing === undefined
        ? incoming
        : mergeNodeJSON(existing, incoming, node_id, brick_id)
    })
    Object.entries(jsonSubObject(brick, 'links')).forEach(([link_id, link_json]) => {
      const incoming = cloneJSON(link_json) as Type_JSON
      const existing = links[link_id] as Type_JSON | undefined
      if (existing === undefined) { links[link_id] = incoming; return }
      // Un flux, lui, ne dépend pas du voisinage : il ne se fusionne pas, il se
      // vérifie. Une divergence signale une extraction fautive.
      if (stableStringify(existing) !== stableStringify(incoming)) {
        throw new Error(
          'composeUnitaryBricks : le flux « ' + link_id + ' » est ecrit differemment par la brique « ' +
          brick_id + ' » et par une brique precedente. C est un bug d extraction.'
        )
      }
    })
  })
  // Le shell a gardé `order_g_elements` intact : il nomme, dans l'ordre de dessin
  // du GLOBAL, tous ses éléments — y compris ceux partis dans les briques. C'est la
  // seule trace de cet ordre qui subsiste après l'amputation, et elle suffit à
  // reposer nœuds et flux là où ils étaient.
  const draw_order = Array.isArray(composed['order_g_elements'])
    ? (composed['order_g_elements'] as string[]) : []
  const ordered_nodes = orderByReference(nodes, draw_order)
  const ordered_links = orderByReference(links, draw_order)
  completeNodeAdjacency(ordered_nodes, ordered_links)
  composed['nodes'] = ordered_nodes
  composed['links'] = ordered_links
  // Le global recomposé n'est pas une brique : la clé racine `process` d'une brique
  // ne doit pas fuir jusqu'ici (le shell n'en portait déjà plus).
  delete composed['process']
  return composed
}
