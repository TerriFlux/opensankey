import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTagGroup } from './TagGroup'
import type { Class_NodeElement } from '../Elements/Node'

// ==================================================================================================
// #378 — La réorganisation automatique de l'ordre des flux E/S doit se déclencher au
// CHANGEMENT DE SÉLECTION de dataTags (millésime, axe, unité), comme elle se déclenche au
// déplacement d'un nœud.
//
// L'ordre des ancres est géométrique (Class_NodeElement.reorganizeIOLinks). Il ne se
// recalculait qu'au geste qui touche la géométrie (déplacement de nœud, bouton
// « Réorganiser », dés/agrégation) : après une bascule de sélection, le diagramme gardait
// l'ordre calculé pour la sélection PRÉCÉDENTE et les flux se croisaient jusqu'au geste
// suivant. Mesuré sur le modèle du ticket (SOCLE « Détail des modes de production ») : après
// une bascule de millésime, un recalcul déplaçait encore l'ordre de 17 nœuds sur 37.
//
// Le déclencheur compare l'ÉTAT (signature de la sélection) et non l'événement, et il est
// appelé depuis `drawElements` : un seul point d'entrée couvre donc tous les chemins de
// bascule (panneau de filtres, barre du haut, frise de séquence, lecture de séquence). Les
// tests passent par le chemin réel — `selectTagsFromId` redessine — plutôt que d'appeler le
// déclencheur à la main.
//
// ⚠️ Précaution de test : le premier dessin après un chargement ne doit RIEN réorganiser (on
// rouvre sur l'ordre enregistré). C'est le rôle de l'amorçage (primeIOReorgOnDataSelection),
// posé à la fin de DrawingAreaPersistence.fromJSON.
// ==================================================================================================

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/**
 * Diagramme minimal à deux colonnes : deux sources (« Haut » en y=0, « Bas » 400 px plus
 * bas) convergent vers une cible unique, sur deux millésimes.
 *
 * L'ordre des deux entrées de la cible est posé À L'ENVERS de l'ordre géométrique — c'est la
 * situation du ticket : un ordre hérité d'une autre sélection, que plus rien ne recalcule.
 */
function buildDiagram() {
  const app = new Class_ApplicationData(false)
  const drawing_area = app.drawing_area
  const { sankey } = drawing_area

  const haut = sankey.addNewNode('haut', 'Haut')
  const bas = sankey.addNewNode('bas', 'Bas')
  const cible = sankey.addNewNode('cible', 'Cible')
  haut.setPosXY(0, 0)
  bas.setPosXY(0, 400)
  cible.setPosXY(600, 200)

  const link_haut = sankey.addNewLink(haut, cible)
  const link_bas = sankey.addNewLink(bas, cible)

  const tagg = sankey.addDataTagGroup('annee', 'Année', false) as Class_DataTagGroup
  const tag_2020 = tagg.addTag('2020', '2020')
  const tag_2021 = tagg.addTag('2021', '2021')
  // Un groupe créé sans tag n'a aucune sélection ; `selectTagsFromId` (qui lit la sélection
  // courante pour l'undo) exige qu'il y en ait une.
  tag_2020.setSelected()

  tagg.selectTagsFromId(tag_2020.id)
  link_haut.valueCurrent = 10
  link_bas.valueCurrent = 20
  tagg.selectTagsFromId(tag_2021.id)
  link_haut.valueCurrent = 30
  link_bas.valueCurrent = 5
  tagg.selectTagsFromId(tag_2020.id)

  /** Ordre périmé, hérité d'une autre sélection : « Bas » avant « Haut ». */
  const setStaleOrder = () => cible.reorganizeIOFromListIds([link_bas.id, link_haut.id])
  setStaleOrder()

  // État « fichier fraîchement ouvert » : la mémoire de sélection est amorcée sur le
  // millésime affiché (cf. DrawingAreaPersistence.fromJSON) — ni le chargement ni les
  // dessins qui suivent ne doivent toucher à l'ordre enregistré.
  drawing_area.primeIOReorgOnDataSelection()

  return {
    app, drawing_area, sankey, tagg, tag_2020, tag_2021,
    haut, bas, cible, link_haut, link_bas, setStaleOrder
  }
}

const orderAt = (node: Class_NodeElement) => node.links_order.map(l => l.id)

describe('#378 — ordre des flux E/S au changement de dataTag', () => {
  it('recalcule l\'ordre des entrées à la bascule de millésime', () => {
    const { tagg, tag_2021, cible, link_haut, link_bas } = buildDiagram()
    expect(orderAt(cible)).toEqual([link_bas.id, link_haut.id])

    tagg.selectTagsFromId(tag_2021.id)

    // Sans le correctif : l'ordre périmé reste tel quel jusqu'au geste suivant.
    expect(orderAt(cible)).toEqual([link_haut.id, link_bas.id])
  })

  it('recalcule aussi au retour sur le millésime précédent', () => {
    const { tagg, tag_2020, tag_2021, cible, link_haut, link_bas, setStaleOrder } = buildDiagram()
    tagg.selectTagsFromId(tag_2021.id)
    setStaleOrder()
    expect(orderAt(cible)).toEqual([link_bas.id, link_haut.id])

    tagg.selectTagsFromId(tag_2020.id)

    expect(orderAt(cible)).toEqual([link_haut.id, link_bas.id])
  })

  it('ne touche à rien tant que la sélection ne change pas', () => {
    const { drawing_area, cible, link_haut, link_bas } = buildDiagram()
    const reorg = jest.spyOn(cible, 'reorganizeIOLinks')

    drawing_area.draw()
    drawing_area.draw()

    expect(reorg).not.toHaveBeenCalled()
    expect(orderAt(cible)).toEqual([link_bas.id, link_haut.id])
  })

  it('ne réorganise pas au premier dessin d\'un fichier ouvert (ordre enregistré préservé)', () => {
    const app = new Class_ApplicationData(false)
    const { drawing_area } = app
    const node = drawing_area.sankey.addNewNode('n', 'N')
    const reorg = jest.spyOn(node, 'reorganizeIOLinks')

    // Mémoire vierge (aucun amorçage) : le premier passage amorce, il ne réorganise pas.
    expect(drawing_area.reorganizeIOOnDataSelectionChange()).toBe(false)
    expect(reorg).not.toHaveBeenCalled()
  })

  it('préserve les cadenas d\'ancre (une bascule est une navigation, pas un recalcul explicite)', () => {
    const { drawing_area, tagg, tag_2021, cible } = buildDiagram()
    const reorg = jest.spyOn(cible, 'reorganizeIOLinks')

    tagg.selectTagsFromId(tag_2021.id)
    // Le dessin déclenché par la bascule a déjà consommé le changement ; l'appel direct
    // couvre le cas d'une bascule qui n'entraînerait pas de dessin.
    drawing_area.reorganizeIOOnDataSelectionChange()

    // release_locks=false, comme un déplacement de nœud (cf. NodeEventsHandler).
    expect(reorg).toHaveBeenCalled()
    reorg.mock.calls.forEach(call => expect(call[0]).toBe(false))
  })

  // ================================================================================================
  // os#1370 — En échelle adaptée, l'ordre se déduit de la disposition de l'AUTEUR, jamais de
  // l'anti-chevauchement d'affichage.
  //
  // `resolveScaleAdaptedOverlaps` ne fait que pousser des coins pour le datatag courant : il n'est
  // jamais persisté, alors que `links_order` l'est. Tant que la réorganisation tourne APRÈS lui,
  // un flux passe sous un autre dans les vues où le push déplace quelque chose, et enregistrer
  // grave l'artefact dans le fichier (CARTOFOB, « Prélèvements »).
  // ================================================================================================
  it('en echelle adaptee, l ordre est calcule AVANT l anti-chevauchement', () => {
    const { drawing_area, tagg, tag_2021 } = buildDiagram()
    // Le mode global vit sur le style « default » (cf. DrawingArea ~L516) ; la suspension
    // d ouverture (#369) doit etre levee pour que la branche du mode soit reellement prise.
    drawing_area.sankey.styles_dict['default'].shape_position_type = 'scale_adapted'
    drawing_area.clearPositionModeSuspension()

    const sequence: string[] = []
    jest.spyOn(drawing_area.nodePositioning, 'resolveScaleAdaptedOverlaps')
      .mockImplementation(() => { sequence.push('anti-chevauchement') })
    const reorg = drawing_area.reorganizeIOOnDataSelectionChange.bind(drawing_area)
    jest.spyOn(drawing_area, 'reorganizeIOOnDataSelectionChange')
      .mockImplementation(() => { sequence.push('reorganisation'); return reorg() })

    tagg.selectTagsFromId(tag_2021.id)

    // Le push ne peut pas influencer l ordre : il court apres lui.
    expect(sequence[0]).toBe('reorganisation')
    expect(sequence[1]).toBe('anti-chevauchement')
  })

  it('en echelle adaptee, la bascule reordonne quand meme (378 reste vrai)', () => {
    const { drawing_area, tagg, tag_2021, cible, link_haut, link_bas } = buildDiagram()
    // Le mode global vit sur le style « default » (cf. DrawingArea ~L516) ; la suspension
    // d ouverture (#369) doit etre levee pour que la branche du mode soit reellement prise.
    drawing_area.sankey.styles_dict['default'].shape_position_type = 'scale_adapted'
    drawing_area.clearPositionModeSuspension()

    tagg.selectTagsFromId(tag_2021.id)

    // Les hauteurs sont deja celles de la selection courante : c est bien le changement de
    // valeurs qui reordonne, et lui seul.
    expect(orderAt(cible)).toEqual([link_haut.id, link_bas.id])
  })

  it('un nœud réglé sur « aucune réorganisation » garde son ordre', () => {
    const { tagg, tag_2021, cible, link_haut, link_bas } = buildDiagram()
    cible.shape_io_reorg_mode = 'none'

    tagg.selectTagsFromId(tag_2021.id)

    expect(orderAt(cible)).toEqual([link_bas.id, link_haut.id])
  })
})
