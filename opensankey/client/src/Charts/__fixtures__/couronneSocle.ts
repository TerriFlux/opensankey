// 04/10/2026 — UN PETIT SOCLE pour les tests de l'état et du plan de la couronne (os#1511, refonte
// étape 2, lot 1). La forme du fichier SOCLE, réduite : une dimension des produits (racine unique,
// filières, HS4, une filière sans détail) et une dimension des pays (racine unique, continents, pays).
//
//   filiere : produits > cereales > (ble, mais) ; lait > (lait_cru, beurre) ; viande
//   pays    : monde > europe > (fr, es) ; ameriques > (br, us) ; asie > (cn)
//
// Toutes les valeurs sont STRICTEMENT POSITIVES et distinctes : un secteur ne disparaît jamais du
// dessin d'avant pour cause de valeur nulle, et la comparaison plan ↔ arbre ne porte que sur la forme.

import { Class_ApplicationData } from '../../types/ApplicationData'
import type { Class_DataTag } from '../../types/Tag'
import type { Class_DataTagGroup } from '../../types/TagGroup'
import type { Class_LinkValue } from '../../Elements/LinkValues'
import type { Class_LinkElement } from '../../Elements/Link'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const FILIERE: [string, string, string | null][] = [
  ['produits', 'Produits bruts', null],
  ['cereales', 'Cereales', 'produits'],
  ['ble', 'Ble', 'cereales'],
  ['mais', 'Mais', 'cereales'],
  ['lait', 'Lait', 'produits'],
  ['lait_cru', 'Lait cru', 'lait'],
  ['beurre', 'Beurre', 'lait'],
  ['viande', 'Viande', 'produits']
]
const PAYS: [string, string, string | null][] = [
  ['monde', 'Monde', null],
  ['europe', 'Europe', 'monde'],
  ['fr', 'France', 'europe'],
  ['es', 'Espagne', 'europe'],
  ['ameriques', 'Ameriques', 'monde'],
  ['br', 'Bresil', 'ameriques'],
  ['us', 'Etats-Unis', 'ameriques'],
  ['asie', 'Asie', 'monde'],
  ['cn', 'Chine', 'asie']
]

const poserDimension = (
  sankey: Class_ApplicationData['drawing_area']['sankey'], id: string, name: string,
  membres: [string, string, string | null][], levels: string[]
): Class_DataTagGroup => {
  const dim = sankey.addDataTagGroup(id, name, false) as Class_DataTagGroup
  membres.forEach(([mid, mname]) => dim.addTag(mname, mid))
  membres.forEach(([mid, , parent]) => {
    if (parent !== null) (dim.tags_dict[mid] as Class_DataTag).parent = dim.tags_dict[parent] as Class_DataTag
  })
  dim.levels = levels
  return dim
}

export const monterSocle = () => {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const filiere = poserDimension(sankey, 'filiere', 'Filieres', FILIERE, ['0 - Produits', '1 - Filieres', '2 - HS4'])
  const pays = poserDimension(sankey, 'pays', 'Pays partenaires', PAYS, ['0 - Monde', '1 - Continents', '2 - Pays'])
  const lien = sankey.addNewLink(sankey.addNewNodeWithName('A'), sankey.addNewNodeWithName('B')) as Class_LinkElement
  const feuillesF = ['ble', 'mais', 'lait_cru', 'beurre', 'viande']
  const feuillesP = ['fr', 'es', 'br', 'us', 'cn']
  feuillesF.forEach((f, i) => feuillesP.forEach((p, j) => {
    ;[filiere, pays].forEach(g => g.tags_list.forEach(t => t.setUnSelected()))
    ;(filiere.tags_dict[f] as Class_DataTag).setSelected()
    ;(pays.tags_dict[p] as Class_DataTag).setSelected()
    ;(lien.value as Class_LinkValue).valueData = 10 * (i + 1) + (j + 1)
  }))
  // Le diagramme, au départ : les filières, le monde entier.
  filiere.selectMembers(['cereales', 'lait', 'viande'])
  pays.selectMembers(['monde'])
  return { app, sankey, lien, filiere, pays }
}

export type Type_Socle = ReturnType<typeof monterSocle>

/** Le descripteur d'une couronne qui découpe `first` puis `nested`. */
export const descripteur = (first: string, ...nested: string[]) => ({
  decompose: { kind: 'data_dimension', data_tagg_id: first, ...(nested.length > 0 ? { nested_tagg_ids: nested } : {}) }
})
