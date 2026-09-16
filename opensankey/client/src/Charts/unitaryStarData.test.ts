// os#1420 — L'ÉTOILE UNITAIRE SUIT LA NAVIGATION, ET PEUT L'ÉPINGLER.
//
// Deux propriétés, et elles ne se prouvent que sur un diagramme vivant :
//
//  1. SUIVRE. L'étoile ne redéfinit pas son périmètre : il vient de `unitaryStarLinks`,
//     donc des flux VISIBLES. Un flux qu'un filtre d'étiquettes de flux écarte cesse donc
//     d'être une branche, sans que ce fichier ait rien à faire pour cela — c'est ce que le
//     premier cas vérifie, parce que c'est exactement le genre de propriété qui se casse
//     en silence le jour où quelqu'un remplace le périmètre partagé par une liste brute.
//
//  2. ÉPINGLER. Une étoile réglée sur 2019 porte des branches de 2019 pendant que le
//     diagramme montre 2021 — et l'appel SANS navigation continue de montrer 2021, ce qui
//     est la non-régression du lot (l'appel à quatre arguments des consommateurs d'OS+).

import { Class_ApplicationData } from '../types/ApplicationData'
import { buildUnitaryStar } from './unitaryStarData'
import { FIGURE_DATA_TAGS_KEY, figureNavigationOf } from './FigureNavigation'
import type { Class_DataTag, Class_FluxTag } from '../types/Tag'
import type { Class_LinkElement } from '../Elements/Link'

/** Amont -> Centre -> Aval : une étoile à une entrée et une sortie. */
const makeDiagram = () => {
  const app = new Class_ApplicationData(false)
  app.drawing_area.bypass_redraws = true
  const sankey = app.drawing_area.sankey
  const amont = sankey.addNewNodeWithName('Amont')
  const centre = sankey.addNewNodeWithName('Centre')
  const aval = sankey.addNewNodeWithName('Aval')
  const entrant = sankey.addNewLink(amont, centre)
  const sortant = sankey.addNewLink(centre, aval)
  return { app, sankey, amont, centre, aval, entrant, sortant }
}

const setYearValue = (link: Class_LinkElement, tag: Class_DataTag, value: number) => {
  const leaf = link.valueForTag(tag)
  expect(leaf).not.toBeNull()
  leaf!.valueData = value
}

describe('os#1420 — une etoile SUIT les filtres d etiquettes du diagramme', () => {
  it('un flux masque par un filtre d etiquettes de flux n est plus un ruban', () => {
    const { app, sankey, centre, entrant, sortant } = makeDiagram()
    entrant.value!.valueData = 20
    sortant.value!.valueData = 8

    const usage = sankey.addFluxTagGroup('usage', 'Usage', false)
    const bois = usage.addTag('Bois', 'bois') as Class_FluxTag
    const metal = usage.addTag('Metal', 'metal') as Class_FluxTag
    entrant.addTag(bois)
    sortant.addTag(metal)

    // Les deux etiquettes selectionnees : l etoile montre ses deux branches.
    const complete = buildUnitaryStar(centre, 'value', null, app)
    expect(complete.inputs.map(b => b.id)).toEqual([entrant.id])
    expect(complete.outputs.map(b => b.id)).toEqual([sortant.id])
    expect(complete.is_empty).toBe(false)

    // On retire « Metal » de la selection : le flux sortant n est plus trace sur le
    // diagramme, il ne doit plus etre trace sur l etoile non plus.
    metal.setUnSelected()
    const filtree = buildUnitaryStar(centre, 'value', null, app)
    expect(filtree.inputs.map(b => b.id)).toEqual([entrant.id])
    expect(filtree.outputs).toEqual([])
  })
})

describe('os#1420 — une etoile peut EPINGLER son etiquette de donnees', () => {
  /** 2021 sur le diagramme ; 2019 vaut la moitie partout, pour que rien ne se confonde. */
  const makeYears = () => {
    const made = makeDiagram()
    const annee = made.sankey.addDataTagGroup('annee', 'Annee', false)
    const t2019 = annee.addTag('2019', '2019') as Class_DataTag
    const t2021 = annee.addTag('2021', '2021') as Class_DataTag
    t2019.setUnSelected()
    t2021.setSelected()
    setYearValue(made.entrant, t2019, 10)
    setYearValue(made.entrant, t2021, 20)
    setYearValue(made.sortant, t2019, 4)
    setYearValue(made.sortant, t2021, 8)
    return { ...made, annee, t2019, t2021 }
  }

  it('epinglee sur 2019 pendant que le diagramme montre 2021 : les rubans portent 2019', () => {
    const { app, sankey, centre, entrant, sortant } = makeYears()
    const nav = figureNavigationOf(sankey, { [FIGURE_DATA_TAGS_KEY]: { annee: '2019' } })

    const star = buildUnitaryStar(centre, 'value', null, app, nav)
    expect(star.inputs.map(b => ({ id: b.id, value: b.value })))
      .toEqual([{ id: entrant.id, value: 10 }])
    expect(star.outputs.map(b => ({ id: b.id, value: b.value })))
      .toEqual([{ id: sortant.id, value: 4 }])

    // Le diagramme, lui, n a pas bouge : epingler une figure ne mute pas le modele.
    expect(entrant.valueCurrent).toBe(20)
    expect(sortant.valueCurrent).toBe(8)
  })

  it('sans navigation, l etoile montre ce que le diagramme montre (2021)', () => {
    const { app, centre, entrant, sortant } = makeYears()
    const star = buildUnitaryStar(centre, 'value', null, app)
    expect(star.inputs.map(b => b.value)).toEqual([20])
    expect(star.outputs.map(b => b.value)).toEqual([8])
    expect(star.inputs.map(b => b.id)).toEqual([entrant.id])
    expect(star.outputs.map(b => b.id)).toEqual([sortant.id])
  })

  it('le PERIMETRE ne change pas avec l epingle : memes branches, autres valeurs', () => {
    const { app, sankey, centre } = makeYears()
    const nav = figureNavigationOf(sankey, { [FIGURE_DATA_TAGS_KEY]: { annee: '2019' } })
    const epinglee = buildUnitaryStar(centre, 'value', null, app, nav)
    const suivie = buildUnitaryStar(centre, 'value', null, app)
    expect(epinglee.inputs.map(b => b.id)).toEqual(suivie.inputs.map(b => b.id))
    expect(epinglee.outputs.map(b => b.id)).toEqual(suivie.outputs.map(b => b.id))
    expect(epinglee.center_label).toBe(suivie.center_label)
  })
})
