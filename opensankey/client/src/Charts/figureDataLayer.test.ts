// os#1511 — LA COUCHE DE DONNÉES D'UNE FIGURE, indépendante du diagramme.
//
// Julien : la couronne doit pouvoir lire la couche qu'elle veut — collectées ou réconciliées —
// quel que soit ce que montre le diagramme, sans dupliquer de données. Les deux couches vivent déjà
// sur chaque valeur ; la figure choisit laquelle lire, et la lecture ne touche pas au diagramme.

import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import { FOLLOWING_NAVIGATION, linkValueUnder, withDataLayer } from './FigureNavigation'
import { sunburstNodeValue } from './SunburstHierarchy'
import {
  readFigureDataLayer, storedFigureDataLayer, withFigureDataLayer
} from '../Representations/figureOpening'

// jest 27 / jsdom n'expose pas structuredClone (utilisé par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/**
 *   monde            (racine)
 *     europe   collectée 512, réconciliée 550   (deux feuilles)
 *     afrique  collectée 873, réconciliée 957
 * Les chiffres du jeu de démonstration (demo-dimensions-hierarchisees-resultats.json).
 */
const monter = () => {
  const app = new Class_ApplicationData(false)
  app.drawing_area.bypass_redraws = true
  const sankey = app.drawing_area.sankey
  const pays = sankey.addDataTagGroup('pays', 'Pays', false) as Class_DataTagGroup
  const monde = pays.addTag('Monde', 'monde') as Class_DataTag
  const europe = pays.addTag('Europe', 'europe') as Class_DataTag
  const espagne = pays.addTag('Espagne', 'espagne') as Class_DataTag
  const italie = pays.addTag('Italie', 'italie') as Class_DataTag
  const afrique = pays.addTag('Afrique', 'afrique') as Class_DataTag
  europe.parent = monde
  espagne.parent = europe
  italie.parent = europe
  afrique.parent = monde
  pays.levels = ['monde', 'continent', 'pays']
  const source = sankey.addNewNodeWithName('Source')
  const lien = sankey.addNewLink(source, sankey.addNewNodeWithName('Cible'))
  const poser = (membre: Class_DataTag, collectee: number, reconciliee: number) => {
    pays.tags_list.forEach(tag => tag.setUnSelected())
    membre.setSelected()
    const valeur = lien.value as Class_LinkValue
    valeur.valueData = collectee
    // APRÈS la donnée : poser `valueData` périme le résultat.
    valeur.valueResult = reconciliee
  }
  poser(espagne, 300, 320)
  poser(italie, 212, 230)
  poser(afrique, 873, 957)
  pays.tags_list.forEach(tag => tag.setUnSelected())
  monde.setSelected()
  return { app, lien, source, pays, monde, europe, afrique }
}

/**
 * Le diagramme en COLLECTÉES, comme le pose le geste « Données » (`setDiagramDataSource`) : la
 * source ET l'affichage des intervalles. `data_source = 'data'` seul laisse `interval_display` à
 * 'free_value' (défaut), et `type_data` désigne alors encore le réconcilié (cf.
 * `Link._reads_collected_layer`) — ce n'est pas un état que l'interface produit.
 */
const collectees = (app: Class_ApplicationData) => {
  app.drawing_area.data_source = 'data'
  app.drawing_area.interval_display = 'structure'
}

describe('os#1511 — une lecture à couche EXPLICITE', () => {
  test('le diagramme en réconciliées, la figure lit les collectées, et réciproquement', () => {
    const m = monter()
    m.app.drawing_area.data_source = 'reconciled'
    expect(m.lien.valueCurrent).toBe(1507)
    expect(m.lien.valueCurrentIn(true)).toBe(1385)
    expect(m.lien.valueCurrentIn(false)).toBe(1507)
    collectees(m.app)
    expect(m.lien.valueCurrent).toBe(1385)
    expect(m.lien.valueCurrentIn(false)).toBe(1507)
  })

  test('sous une coordonnée, l agrégat d un parent se lit dans la couche demandée', () => {
    const m = monter()
    collectees(m.app)
    expect(m.lien.valueForDataTags([m.europe])).toBe(512)
    expect(m.lien.valueForDataTags([m.europe], false)).toBe(550)
    expect(m.lien.valueForDataTags([m.afrique], false)).toBe(957)
    expect(m.lien.valueForDataTags([m.afrique], true)).toBe(873)
  })

  test('lire ne touche pas au diagramme', () => {
    const m = monter()
    collectees(m.app)
    m.lien.valueCurrentIn(false)
    m.lien.valueForDataTags([m.europe], false)
    expect(m.app.drawing_area.data_source).toBe('data')
    expect(m.monde.is_selected).toBe(true)
  })
})

describe('os#1511 — la navigation d une figure porte sa couche', () => {
  test('sans couche, la figure lit ce que lit le diagramme, au nombre près', () => {
    const m = monter()
    collectees(m.app)
    expect(linkValueUnder(m.lien, FOLLOWING_NAVIGATION)).toBe(m.lien.valueCurrent)
    expect(withDataLayer(FOLLOWING_NAVIGATION, undefined)).toBe(FOLLOWING_NAVIGATION)
  })

  test('diagramme en collectées, couronne en réconciliées', () => {
    const m = monter()
    collectees(m.app)
    const nav = withDataLayer(FOLLOWING_NAVIGATION, false)
    expect(linkValueUnder(m.lien, nav)).toBe(1507)
    expect(linkValueUnder(m.lien, { ...nav, data_tags: [m.europe] })).toBe(550)
    // Le TOTAL d'un nœud aussi : c'est lui que le centre et les pourcentages lisent.
    expect(sunburstNodeValue(m.source, nav)).toBe(1507)
    expect(sunburstNodeValue(m.source, FOLLOWING_NAVIGATION)).toBe(1385)
  })
})

describe('os#1511 — data_layer : liée suit le diagramme, détachée a la sienne', () => {
  test('absente, la figure suit le diagramme — une couronne d hier s ouvre comme avant', () => {
    expect(readFigureDataLayer({})).toBeUndefined()
    expect(readFigureDataLayer({ coordinates_linked: false })).toBeUndefined()
  })

  test('LIÉE, la clé est ignorée : la couche est celle du diagramme', () => {
    expect(readFigureDataLayer({ data_layer: 'collected' })).toBeUndefined()
  })

  test('DÉTACHÉE, la clé fait foi', () => {
    expect(readFigureDataLayer({ coordinates_linked: false, data_layer: 'collected' })).toBe(true)
    expect(readFigureDataLayer({ coordinates_linked: false, data_layer: 'reconciled' })).toBe(false)
  })

  test('une valeur malformée est ignorée, et l écriture se relit', () => {
    expect(storedFigureDataLayer({ data_layer: 'n importe' })).toBeUndefined()
    const sac = withFigureDataLayer({ coordinates_linked: false, autre: 1 }, 'reconciled')
    expect(sac.autre).toBe(1)
    expect(readFigureDataLayer(sac)).toBe(false)
    expect(withFigureDataLayer(sac, undefined).data_layer).toBeUndefined()
  })
})
