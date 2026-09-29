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
