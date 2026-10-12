import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_LinkValue } from '../Elements/LinkValues'
import type { Class_NodeElement } from '../Elements/Node'
import { memberNodeId } from './DimensionDisaggregation'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — Julien, 12/10, SOCLE synthetiques transfo : en passant de Cereales a Oleoproteagineux,
// « Importations matiere premiere » (absent des cereales) colle a « Production », placee a la main,
// voire la chevauche ; et « Exportations matiere premiere » passe au-dessus de « Transformation »,
// l ordre des flux de Matiere premiere restant celui de leur flux d origine.

const valoriser = (dimension: Class_DataTagGroup, flux: Class_LinkElement, valeurs: [Class_DataTag, number][]) => {
  valeurs.forEach(([membre, valeur]) => {
    dimension.tags_list.forEach(t => t.setUnSelected())
    membre.setSelected()
    ;(flux.value as Class_LinkValue).valueData = valeur
  })
  dimension.tags_list.forEach(t => t.setSelected())
}

test('un noeud place a la main garde l ecart de desagregation avec ses voisins de colonne', () => {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const poste = sankey.addDataTagGroup('poste', 'Poste', false) as unknown as Class_DataTagGroup
  const imp = poste.addTag('Importations', 'imp') as Class_DataTag
  const prod = poste.addTag('Production', 'prod') as Class_DataTag
  const ressources = sankey.addNewNodeWithName('Ressources')
  const mp = sankey.addNewNodeWithName('MP')
  const flux = sankey.addNewLink(ressources, mp)
  valoriser(poste, flux, [[imp, 10], [prod, 100]])
  ressources.driving_dimension = poste
  app.drawing_area.rebuildDimensionNodes()
  const noeudDe = (membre: Class_DataTag) => sankey.nodes_dict[memberNodeId(ressources.id, membre.id)] as Class_NodeElement
  // Production posee a la main EXACTEMENT sur les importations : le pire chevauchement.
  prod.setPositionOn(ressources.id, { x: noeudDe(imp).position_x, y: noeudDe(imp).position_y })
  app.drawing_area.rebuildDimensionNodes()
  const ecart = app.drawing_area.disaggregation_gap_value
  const [haut, bas] = [noeudDe(imp), noeudDe(prod)].sort((a, b) => a.position_y - b.position_y)
  expect(bas.position_y - (haut.position_y + haut.getShapeHeightToUse())).toBeGreaterThanOrEqual(ecart - 0.5)
  // La production, placee a la main, n a pas bouge : ce sont les importations qui lui font place.
  expect(noeudDe(prod).position_y).toBeCloseTo(prod.positionOn(ressources.id)?.y as number, 1)
})

test('les flux d un noeud touche par des flux engendres suivent la hauteur de leur autre bout', () => {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const poste = sankey.addDataTagGroup('poste', 'Poste', false) as unknown as Class_DataTagGroup
  const util = poste.addTag('Utilisations', 'util') as Class_DataTag
  const expo = poste.addTag('Exportations', 'expo') as Class_DataTag
  const mp = sankey.addNewNodeWithName('MP')
  const emplois = sankey.addNewNodeWithName('Emplois')
  const transfo = sankey.addNewNodeWithName('Transformation')
  const vers_emplois = sankey.addNewLink(mp, emplois)
  const vers_transfo = sankey.addNewLink(mp, transfo)
  valoriser(poste, vers_emplois, [[util, 50], [expo, 20]])
  valoriser(poste, vers_transfo, [[util, 10], [expo, 0]])
  // L auteur met les emplois avant la transformation ; les exportations sont posees SOUS elle.
  mp.applyLinksOrder([vers_emplois.id, vers_transfo.id])
  emplois.driving_dimension = poste
  transfo.setPosXY(600, 400)
  util.setPositionOn(emplois.id, { x: 900, y: 100 })
  expo.setPositionOn(emplois.id, { x: 600, y: 800 })
  app.drawing_area.rebuildDimensionNodes()
  const sorties = mp.links_order.filter(l => l.source === mp && l.is_visible).map(l => l.target.name)
  expect(sorties).toEqual(['Utilisations', 'Transformation', 'Exportations'])
})
