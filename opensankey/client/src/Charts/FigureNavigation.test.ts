// os#1420 — LA NAVIGATION D'UNE FIGURE, sur un diagramme VIVANT.
//
// Le module se teste sur une vraie `Class_ApplicationData` et non sur des doublures :
// ce qu'on veut savoir, c'est qu'une épingle désigne bien une étiquette du modèle, que
// la résolution rende la forme exacte que `Link.valueForDataTags` attend, et que sans
// épingle on retombe AU NOMBRE PRÈS sur ce que le diagramme montre (`valueCurrent`,
// `data_value`) — trois propriétés qu'une doublure ne saurait pas contredire.

import { Class_ApplicationData } from '../types/ApplicationData'
import {
  FIGURE_DATA_TAGS_KEY,
  FOLLOWING_NAVIGATION,
  figureNavigationOf,
  linkValueUnder,
  nodeValueUnder,
  readFigureDataTagPins,
  resolveFigureDataTags
} from './FigureNavigation'
import type { Class_DataTag } from '../types/Tag'
import type { Class_LinkElement } from '../Elements/Link'

/** Amont -> Centre -> Aval, sans étiquette : le plus petit diagramme qui ait une étoile. */
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

/** Deux millésimes, 2021 sélectionné : ce que le diagramme montre. */
const addYears = (sankey: ReturnType<typeof makeDiagram>['sankey']) => {
  const annee = sankey.addDataTagGroup('annee', 'Annee', false)
  const t2019 = annee.addTag('2019', '2019') as Class_DataTag
  const t2021 = annee.addTag('2021', '2021') as Class_DataTag
  t2019.setUnSelected()
  t2021.setSelected()
  return { annee, t2019, t2021 }
}

/** Un second groupe, pour les cas à deux coordonnées. Tendanciel sélectionné. */
const addScenarios = (sankey: ReturnType<typeof makeDiagram>['sankey']) => {
  const scenario = sankey.addDataTagGroup('scenario', 'Scenario', false)
  const tendanciel = scenario.addTag('Tendanciel', 'tendanciel') as Class_DataTag
  const sobriete = scenario.addTag('Sobriete', 'sobriete') as Class_DataTag
  sobriete.setUnSelected()
  tendanciel.setSelected()
  return { scenario, tendanciel, sobriete }
}

const setYearValue = (
  link: Class_LinkElement,
  tag: Class_DataTag,
  value: number
) => {
  const leaf = link.valueForTag(tag)
  expect(leaf).not.toBeNull()
  leaf!.valueData = value
}

describe('os#1420 — readFigureDataTagPins : lire des epingles dans un sac de reglages', () => {
  it('sac absent ou vide : aucune epingle', () => {
    expect(readFigureDataTagPins(undefined)).toBeNull()
    expect(readFigureDataTagPins({})).toBeNull()
  })

  it('cle malformee : aucune epingle, jamais une exception', () => {
    // Une chaine, un tableau, un nombre : trois formes qu un fichier d une autre
    // version pourrait porter. Aucune ne doit faire lire le modele de travers.
    expect(readFigureDataTagPins({ [FIGURE_DATA_TAGS_KEY]: 'annee' })).toBeNull()
    expect(readFigureDataTagPins({ [FIGURE_DATA_TAGS_KEY]: ['2019'] })).toBeNull()
    expect(readFigureDataTagPins({ [FIGURE_DATA_TAGS_KEY]: 42 })).toBeNull()
    expect(readFigureDataTagPins({ [FIGURE_DATA_TAGS_KEY]: null })).toBeNull()
  })

  it('valeurs non exploitables : ecartees une par une, et rien ne reste = rien', () => {
    expect(readFigureDataTagPins({ [FIGURE_DATA_TAGS_KEY]: { annee: '' } })).toBeNull()
    expect(readFigureDataTagPins({ [FIGURE_DATA_TAGS_KEY]: { annee: 2019 } })).toBeNull()
    expect(readFigureDataTagPins({
      [FIGURE_DATA_TAGS_KEY]: { annee: '2019', scenario: 7 }
    })).toEqual({ annee: '2019' })
  })

  it('cle valide : rendue telle quelle, groupe par groupe', () => {
    expect(readFigureDataTagPins({
      [FIGURE_DATA_TAGS_KEY]: { annee: '2019', scenario: 'sobriete' }
    })).toEqual({ annee: '2019', scenario: 'sobriete' })
  })
})

describe('os#1420 — resolveFigureDataTags : une liste complete, dans l ordre des groupes', () => {
  it('sans epingle, la figure suit le diagramme', () => {
    const { sankey } = makeDiagram()
    addYears(sankey)
    expect(resolveFigureDataTags(sankey, null)).toBeNull()
  })

  it('une epingle valide rend la liste complete, l epinglee a sa place', () => {
    const { sankey } = makeDiagram()
    const { t2019 } = addYears(sankey)
    expect(resolveFigureDataTags(sankey, { annee: '2019' })).toEqual([t2019])
  })

  it('un groupe NON epingle prend la selection courante, dans l ordre des groupes', () => {
    const { sankey } = makeDiagram()
    const { t2019 } = addYears(sankey)
    const { tendanciel } = addScenarios(sankey)
    // L ordre est celui des groupes du diagramme (annee puis scenario), c est la
    // forme que `Link.valueForDataTags` attend.
    expect(resolveFigureDataTags(sankey, { annee: '2019' })).toEqual([t2019, tendanciel])
  })

  it('une epingle vers une etiquette disparue, et c etait la seule : la figure suit', () => {
    const { sankey } = makeDiagram()
    addYears(sankey)
    // Mieux vaut suivre le diagramme que lire sous une selection a moitie inventee.
    expect(resolveFigureDataTags(sankey, { annee: '2038' })).toBeNull()
    expect(resolveFigureDataTags(sankey, { inconnu: '2019' })).toBeNull()
  })

  it('une epingle disparue a cote d une epingle valide : la valide porte encore', () => {
    const { sankey } = makeDiagram()
    const { t2021 } = addYears(sankey)
    const { sobriete } = addScenarios(sankey)
    expect(resolveFigureDataTags(sankey, { annee: '2038', scenario: 'sobriete' }))
      .toEqual([t2021, sobriete])
  })
})

describe('os#1420 — figureNavigationOf : du sac de reglages a la navigation', () => {
  it('sac sans epingle : la navigation suit (data_tags null)', () => {
    const { sankey } = makeDiagram()
    addYears(sankey)
    expect(figureNavigationOf(sankey, {}).data_tags).toBeNull()
    expect(figureNavigationOf(sankey, { value_mode: 'sum' }).data_tags).toBeNull()
    expect(FOLLOWING_NAVIGATION.data_tags).toBeNull()
  })

  it('sac epingle : la navigation porte les etiquettes resolues', () => {
    const { sankey } = makeDiagram()
    const { t2019 } = addYears(sankey)
    const nav = figureNavigationOf(sankey, { [FIGURE_DATA_TAGS_KEY]: { annee: '2019' } })
    expect(nav.data_tags).toEqual([t2019])
  })
})

describe('os#1420 — lire le modele SOUS une navigation', () => {
  it('sans epingle, un flux vaut EXACTEMENT ce que le diagramme montre', () => {
    const { centre, entrant, sortant, sankey } = makeDiagram()
    const { t2019, t2021 } = addYears(sankey)
    setYearValue(entrant, t2019, 10)
    setYearValue(entrant, t2021, 20)
    setYearValue(sortant, t2019, 4)
    setYearValue(sortant, t2021, 8)

    expect(linkValueUnder(entrant, FOLLOWING_NAVIGATION)).toBe(entrant.valueCurrent)
    expect(linkValueUnder(entrant, FOLLOWING_NAVIGATION)).toBe(20)
    // Et un noeud vaut son debit, la meme grandeur que `data_value`.
    expect(nodeValueUnder(centre, FOLLOWING_NAVIGATION)).toBe(centre.data_value)
    expect(nodeValueUnder(centre, FOLLOWING_NAVIGATION)).toBe(20)
  })

  it('epingle sur 2019 pendant que le diagramme montre 2021 : on lit 2019', () => {
    const { sankey, centre, entrant, sortant } = makeDiagram()
    const { t2019, t2021 } = addYears(sankey)
    setYearValue(entrant, t2019, 10)
    setYearValue(entrant, t2021, 20)
    setYearValue(sortant, t2019, 4)
    setYearValue(sortant, t2021, 8)

    const nav = figureNavigationOf(sankey, { [FIGURE_DATA_TAGS_KEY]: { annee: '2019' } })
    expect(linkValueUnder(entrant, nav)).toBe(10)
    expect(linkValueUnder(sortant, nav)).toBe(4)
    // Le debit du noeud suit la meme lecture : max(entrees, sorties) en 2019.
    expect(nodeValueUnder(centre, nav)).toBe(10)
    // Le diagramme, lui, n a pas bouge.
    expect(entrant.valueCurrent).toBe(20)
    expect(centre.data_value).toBe(20)
  })
})
