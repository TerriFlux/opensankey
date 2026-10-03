// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1511 — LA COUPE D'UNE DIMENSION : ce que le diagramme montre de ses membres, et les deux
// gestes qui la déplacent — ouvrir un membre, le refermer.
//
// MODULE PUR, ET C'EST LA RAISON DE SON EXISTENCE SÉPARÉE. Ces fonctions vivaient dans le composant
// React de l'arbre (`DimensionTreeSelector`, éditeur). Le menu contextuel d'OpenSankey+ en a besoin
// pour offrir les mêmes gestes sur un nœud engendré — et les y prendre aurait tiré React et Chakra
// dans un module de configuration. Même leçon que `GeneratedMemberMark` et `memberSectorId` :
// quand deux couches éloignées ont besoin de la même règle, elle descend, elle ne se recopie pas.
//
// ── LA PROPRIÉTÉ QUE CES FONCTIONS GARANTISSENT ────────────────────────────────────────────────
//
// Ce qui est dessiné est toujours une FRONTIÈRE de l'arbre : aucun membre n'est l'ancêtre d'un
// autre (sinon on compte deux fois), et ensemble ils couvrent la racine (sinon il en manque). Le
// seul geste offert étant d'ouvrir ou de refermer, on ne peut pas fabriquer un recouvrement : la
// coupe est valide PAR CONSTRUCTION, et les totaux ne bougent pas d'une coupe à l'autre.
//
// ── AUCUN ÉTAT NOUVEAU ─────────────────────────────────────────────────────────────────────────
//
// Les membres OUVERTS ne sont pas persistés : ils se déduisent de la coupe (ce sont les ancêtres
// stricts des membres dessinés), et redescendre depuis les racines en s'arrêtant au premier fermé
// redonne la coupe. Deux lectures du même fait, donc aucun risque qu'elles divergent.

import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'

/** Les membres de premier rang : ceux qui n'ont pas de parent dans la dimension. */
const racines = (dimension: Class_DataTagGroup): Class_DataTag[] =>
  (dimension.tags_list as Class_DataTag[]).filter(membre => membre.parent === undefined)

/**
 * Les membres OUVERTS, déduits de la coupe : les ancêtres stricts de ce qui est dessiné.
 *
 * C'est l'inverse exact de `coupeDepuisOuverts` tant que la coupe est une frontière — ce que
 * `selectMembers` garantit en écartant tout membre dont un descendant est demandé.
 */
export const ouvertsDepuisCoupe = (dimension: Class_DataTagGroup): Set<string> => {
  const ouverts = new Set<string>()
  ;(dimension.selected_tags_list as Class_DataTag[]).forEach(membre => {
    let parent = membre.parent
    while (parent !== undefined) {
      ouverts.add(parent.id)
      parent = parent.parent
    }
  })
  return ouverts
}

/** La coupe que dessine un ensemble d'ouverts : on descend, on s'arrête au premier fermé. */
export const coupeDepuisOuverts = (
  dimension: Class_DataTagGroup,
  ouverts: ReadonlySet<string>
): string[] => {
  const coupe: string[] = []
  const descendre = (membre: Class_DataTag) => {
    const enfants = membre.children as Class_DataTag[]
    if (!ouverts.has(membre.id) || enfants.length === 0) {
      coupe.push(membre.id)
      return
    }
    enfants.forEach(descendre)
  }
  racines(dimension).forEach(descendre)
  return coupe
}

/** La coupe après ouverture d'un membre : il cède la place à ses enfants. */
export const coupeEnOuvrant = (dimension: Class_DataTagGroup, membre: Class_DataTag): string[] => {
  const ouverts = new Set(ouvertsDepuisCoupe(dimension))
  ouverts.add(membre.id)
  return coupeDepuisOuverts(dimension, ouverts)
}

/**
 * La coupe après fermeture d'un membre : toute sa descendance se replie sur lui.
 *
 * ⚠️ LE DÉTAIL QU'ON AVAIT OUVERT DEDANS EST OUBLIÉ, et c'est un choix. Refermer « Monde » puis le
 * rouvrir redonne « Europe + Afrique », pas le détail de l'Europe qu'on avait déplié — là où un
 * explorateur de fichiers s'en souviendrait.
 *
 * La raison tient à ce que le geste SIGNIFIE ici : déplier n'est pas regarder, c'est CHANGER LE
 * DESSIN. L'ouverture n'est donc pas un état à côté de la coupe, c'en est une autre lecture (cf.
 * `ouvertsDepuisCoupe`) — et c'est ce qui garantit que le panneau ne puisse jamais annoncer autre
 * chose que ce que le diagramme montre. Retenir le détail demanderait un second état, à tenir
 * cohérent avec le premier ; on échangerait une surprise rare contre une divergence possible.
 *
 * En mode « se placer », où déplier ne fait que regarder, l'ouverture est au contraire un état
 * propre au panneau — et il survit tant qu'on regarde (cf. `DimensionTreeSelector`).
 */
export const coupeEnFermant = (dimension: Class_DataTagGroup, membre: Class_DataTag): string[] => {
  const ouverts = new Set(ouvertsDepuisCoupe(dimension))
  ouverts.delete(membre.id)
  return coupeDepuisOuverts(dimension, ouverts)
}

/** Une ligne de l'arbre : un membre, sa profondeur d'affichage, et son état. */
interface Type_Ligne {
  membre: Class_DataTag
  profondeur: number
  ouvert: boolean
  /** Ce membre est-il DESSINÉ, c'est-à-dire sur la frontière ? */
  dessine: boolean
}

/**
 * Les lignes à montrer : les racines, et la descendance de ce qui est ouvert.
 *
 * `ouverts` est fourni par le mode « se placer », où l'ouverture est un état de REGARD et non la
 * coupe ; à défaut elle se déduit de la coupe, ce qui est le mode « détailler ».
 */
export const lignesDeLArbre = (
  dimension: Class_DataTagGroup,
  ouverts: ReadonlySet<string> = ouvertsDepuisCoupe(dimension)
): Type_Ligne[] => {
  const lignes: Type_Ligne[] = []
  const descendre = (membre: Class_DataTag, profondeur: number) => {
    const enfants = membre.children as Class_DataTag[]
    const ouvert = ouverts.has(membre.id) && enfants.length > 0
    lignes.push({ membre, profondeur, ouvert, dessine: !ouvert })
    if (ouvert) enfants.forEach(enfant => descendre(enfant, profondeur + 1))
  }
  racines(dimension).forEach(racine => descendre(racine, 0))
  return lignes
}

// ── 03/10/2026 — LE SÉLECTEUR À DEUX MODES : « PAR NIVEAU » ET « ARBRE » ─────────────────────────
//
// Julien : « soit on sélectionne PAR NIVEAU, et la liste dessous donne les tags de ce niveau qu'on
// peut sélectionner un par un (avec le bouton "tout sélectionner" comme dans Excel) ; soit on est
// en mode ARBRE et on sélectionne à travers les niveaux. Pour garder la cohérence on ne peut pas
// sélectionner Céréales et Blé : si on sélectionne Blé ça désélectionne Céréales et vice-versa. »
//
// Ce qui perturbait dans l'arbre d'avant : DÉPLIER y était COUPER. Ouvrir « Céréales » remplaçait
// les céréales par leurs enfants sur le diagramme, sans case à cocher pour dire ce qui était choisi.
// Désormais la flèche ne fait que déplier l'AFFICHAGE, et ce sont des cases qui choisissent. La
// coupe n'est plus une frontière par construction : on peut choisir Blé seul. Ce qui reste interdit
// est le RECOUVREMENT (un membre et son ancêtre ensemble), et le geste le corrige lui-même. Une
// couronne, liée ou détachée, dessine la même sélection (cf. `hiddenForSelection`).

export type Type_SelecteurMode = 'level' | 'tree'
export type Type_EtatTout = 'all' | 'some' | 'none'

/** Les membres que montre le niveau `index`, dans l'ordre de l'arbre (parcours en profondeur). */
export const membresDuNiveau = (dimension: Class_DataTagGroup, index: number): Class_DataTag[] => {
  if (dimension.levels.length === 0) return dimension.tags_list as Class_DataTag[]
  const montres = new Set(dimension.membersAtLevel(index).map(m => m.id))
  const out: Class_DataTag[] = []
  const descendre = (membre: Class_DataTag) => {
    if (montres.has(membre.id)) out.push(membre)
    ;(membre.children as Class_DataTag[]).forEach(descendre)
  }
  racines(dimension).forEach(descendre)
  return out
}

/**
 * Le niveau dont la sélection est un SOUS-ENSEMBLE, ou `null` si elle mêle des niveaux. C'est le
 * niveau du membre choisi le plus profond ; les feuilles moins profondes y comptent (une branche
 * courte se montre à tous les niveaux plus fins, cf. `membersAtLevel`).
 */
export const niveauDeLaSelection = (dimension: Class_DataTagGroup, choisis: ReadonlySet<string>): number | null => {
  const nb = dimension.levels.length
  if (nb === 0) return 0
  const membres = [...choisis]
    .map(id => dimension.tags_dict[id] as Class_DataTag | undefined)
    .filter((m): m is Class_DataTag => m !== undefined)
  if (membres.length === 0) return null
  const niveau = Math.min(nb - 1, Math.max(...membres.map(m => dimension.depthOf(m))))
  const montres = new Set(dimension.membersAtLevel(niveau).map(m => m.id))
  return membres.every(m => montres.has(m.id)) ? niveau : null
}

/** Le mode à l'ouverture : « Par niveau » si la sélection tient dans un niveau, sinon « Arbre ». */
export const modeALOuverture = (dimension: Class_DataTagGroup, choisis: ReadonlySet<string>): Type_SelecteurMode =>
  dimension.levels.length === 0 || niveauDeLaSelection(dimension, choisis) !== null ? 'level' : 'tree'

/** L'état de la case « (Tout sélectionner) » : sur les membres VISIBLES (liste filtrée comprise). */
export const etatToutSelectionner = (visibles: readonly string[], choisis: ReadonlySet<string>): Type_EtatTout => {
  const n = visibles.filter(id => choisis.has(id)).length
  if (n === 0) return 'none'
  return n === visibles.length ? 'all' : 'some'
}

/**
 * COCHER un membre dans l'arbre : il entre, ses ancêtres et ses descendants sortent. Jamais
 * « Céréales » et « Blé » ensemble — le dernier coché l'emporte, dans les deux sens.
 */
export const cocherExclusif = (
  dimension: Class_DataTagGroup, choisis: ReadonlySet<string>, id: string
): string[] => {
  const membre = dimension.tags_dict[id] as Class_DataTag | undefined
  if (membre === undefined) return [...choisis]
  const garde = [...choisis].filter(autre => {
    if (autre === id) return false
    const m = dimension.tags_dict[autre] as Class_DataTag | undefined
    if (m === undefined) return false
    return !m.hasAncestor(membre) && !membre.hasAncestor(m)
  })
  return [...garde, id]
}

/**
 * « (Tout sélectionner) » COCHÉ, cliqué : décoche les membres VISIBLES (tous, ou les résultats de la
 * recherche, comme Excel). Rend `null` s'il ne resterait rien — le sélecteur passe EN ATTENTE.
 */
export const decocherVisibles = (choisis: readonly string[], visibles: readonly string[]): string[] | null => {
  const masques = new Set(visibles)
  const reste = choisis.filter(id => !masques.has(id))
  return reste.length > 0 ? reste : null
}

/** DÉCOCHER : rend `null` s'il ne resterait rien — le sélecteur passe alors EN ATTENTE, sans rien appliquer. */
export const decocher = (choisis: ReadonlySet<string>, id: string): string[] | null => {
  const reste = [...choisis].filter(autre => autre !== id)
  return reste.length > 0 ? reste : null
}

/**
 * Un membre est-il PARTIELLEMENT choisi dans l'arbre : non choisi lui-même, mais un de ses
 * descendants l'est. C'est la case « tiret » d'Excel ; la cocher choisit le membre entier.
 */
export const descendantChoisi = (membre: Class_DataTag, choisis: ReadonlySet<string>): boolean =>
  (membre.children as Class_DataTag[]).some(enfant => choisis.has(enfant.id) || descendantChoisi(enfant, choisis))
