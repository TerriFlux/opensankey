import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTagGroup } from '../types/TagGroup'

// ==================================================================================================
// os#1372 — DATATAG DE RÉFÉRENCE du mode « échelle adaptée ».
//
// Avant : la grandeur de référence était CAPTURÉE au vol, au datatag qui se trouvait à l'écran
// quand le mode prenait effet, puis figée dans le fichier. Personne ne l'avait choisie, rien ne
// disait laquelle c'était, et corriger une donnée la rendait fausse sans que ça se voie.
//
// Après : le document NOMME le datatag de référence, et la grandeur s'en déduit à chaque dessin.
// Ces tests portent sur le calcul, pas sur le rendu — la grandeur est une somme de valeurs.
// ==================================================================================================

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/**
 * Deux colonnes, un seul flux, deux millésimes : 2020 vaut 100, 2021 vaut 400.
 * La grandeur du diagramme est celle de la colonne la plus chargée, donc la valeur du flux.
 */
function buildDiagram() {
  const app = new Class_ApplicationData(false)
  const { drawing_area } = app
  const { sankey } = drawing_area

  const source = sankey.addNewNode('source', 'Source')
  const cible = sankey.addNewNode('cible', 'Cible')
  source.setPosXY(0, 0)
  cible.setPosXY(600, 0)
  const lien = sankey.addNewLink(source, cible)

  const tagg = sankey.addDataTagGroup('annee', 'Annee', false) as Class_DataTagGroup
  const tag_2020 = tagg.addTag('2020', '2020')
  const tag_2021 = tagg.addTag('2021', '2021')
  tag_2020.setSelected()

  tagg.selectTagsFromId(tag_2020.id)
  lien.valueCurrent = 100
  tagg.selectTagsFromId(tag_2021.id)
  lien.valueCurrent = 400
  tagg.selectTagsFromId(tag_2020.id)

  return { app, drawing_area, sankey, tagg, tag_2020, tag_2021, lien }
}

const scaleAdapted = (drawing_area: Class_ApplicationData['drawing_area']) =>
  drawing_area.nodePositioning

describe('os#1372 — grandeur de reference calculee au datatag designe', () => {
  it('la grandeur du datatag de reference ne depend pas de la selection courante', () => {
    const { drawing_area, tagg, tag_2020, tag_2021 } = buildDiagram()
    drawing_area.scale_adapted_reference_datatag = [tag_2020.id]

    // Sur 2020 : grandeur courante et grandeur de reference coincident.
    expect(scaleAdapted(drawing_area).diagramMagnitude()).toBeCloseTo(100, 6)

    // Sur 2021 : la grandeur COURANTE suit la selection, la reference reste celle de 2020.
    tagg.selectTagsFromId(tag_2021.id)
    expect(scaleAdapted(drawing_area).diagramMagnitude()).toBeCloseTo(400, 6)
  })

  it('aucun datatag designe : pas de grandeur de reference calculee', () => {
    const { drawing_area } = buildDiagram()
    expect(drawing_area.scale_adapted_reference_datatag).toEqual([])
  })

  it('designer un datatag oublie la base capturee contre l ancienne reference', () => {
    const { drawing_area, tag_2021 } = buildDiagram()
    const forget = jest.spyOn(drawing_area.nodePositioning, 'forgetScaleAdaptedCapture')
    drawing_area.scale_adapted_reference_datatag = [tag_2021.id]
    expect(forget).toHaveBeenCalled()
  })

  it('la reference suit la copie de la drawing area (une vue se cale comme le maitre)', () => {
    const { app, drawing_area, tag_2020 } = buildDiagram()
    drawing_area.scale_adapted_reference_datatag = [tag_2020.id]
    const copie = app.createNewDrawingArea('copie')
    copie.copyFrom(drawing_area)
    expect(copie.scale_adapted_reference_datatag).toEqual([tag_2020.id])
  })
})
