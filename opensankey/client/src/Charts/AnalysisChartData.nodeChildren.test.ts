// os#1432 — LA DECOMPOSITION PAR NOEUDS ENFANTS COMPTE LES ENFANTS AGREGES.
//
// Retour de Julien (19/09/2026) : « pour les barres j ai l impression que la decomposition par
// noeuds enfants ne marche pas ». Elle ne marchait pour aucune des deux natures : couronne et
// histogramme lisent la meme analyse, et c est l analyse qui rendait une liste vide.
//
// LE PIEGE, et c est pour lui que ce fichier existe : la regle « les filtres d etiquettes
// s appliquent, l agregation non » etait tenue a MOITIE. Les enfants agreges passaient bien le
// filtre, puis leur VALEUR se lisait sur `data_value`, qui ne somme que les flux VISIBLES. Un
// enfant cache par l agregation n en a aucun, sa valeur etait nulle, et la part disparaissait au
// `> 0`. La decomposition rendait donc vide exactement la ou on la demande — sur un noeud parent
// dont la hierarchie est repliee, le cas meme qui rend cet axe utile.
//
// Le diagramme est celui de SunburstHierarchy.test.ts, et ce n est pas un hasard : c est le seul
// qui a les deux a la fois, une hierarchie AGREGEE et un filtre d etiquettes de noeuds. Le
// sunburst decomposait deja ce noeud-la correctement ; les deux natures lisent desormais la meme
// valeur structurelle, et ne peuvent plus se contredire sur le meme noeud.

import { Class_ApplicationData } from '../types/ApplicationData'
import { CURRENT_FORMAT_VERSION } from '../Persistence/persistenceMigrations'
import type { Type_JSON } from '../types/Utils'
import type { Class_NodeTag } from '../types/Tag'
import { FOLLOWING_NAVIGATION } from './FigureNavigation'

import { buildAnalysisChartData } from './AnalysisChartData'
import type { Type_ChartSubject } from './AnalysisChartData'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// Amont alimente Racine et ses deux enfants. Le niveau AFFICHE est niveau1 : les enfants
// existent, le Sankey ne les trace pas. C est l etat dans lequel on ouvre une couronne ou un
// histogramme sur Racine.
const file = (): Type_JSON => ({
  version: '1.3.0',
  format_version: CURRENT_FORMAT_VERSION,
  nodes: {
    Amont: { idNode: 'Amont', name: 'Amont' },
    Racine: { idNode: 'Racine', name: 'Racine', tags: { dim: ['niveau1'] } },
    EnfantA: {
      idNode: 'EnfantA', name: 'EnfantA',
      tags: { dim: ['niveau2'], groupe: ['alpha'] },
      dimensions: { dim: { parent_name: 'Racine' } }
    },
    EnfantB: {
      idNode: 'EnfantB', name: 'EnfantB',
      tags: { dim: ['niveau2'], groupe: ['beta'] },
      dimensions: { dim: { parent_name: 'Racine' } }
    }
  },
  links: {
    amont_racine: { idLink: 'amont_racine', idSource: 'Amont', idTarget: 'Racine', value: { value: 14 } },
    amont_a: { idLink: 'amont_a', idSource: 'Amont', idTarget: 'EnfantA', value: { value: 6 } },
    amont_b: { idLink: 'amont_b', idSource: 'Amont', idTarget: 'EnfantB', value: { value: 8 } }
  },
  nodeTags: {
    groupe: {
      group_name: 'Groupe', banner: 'none', activated: true,
      tags: { alpha: { name: 'alpha', selected: true }, beta: { name: 'beta', selected: true } }
    }
  },
  levelTags: {
    dim: {
      group_name: 'Dimension', banner: 'one', activated: true, siblings: [],
      tags: { niveau1: { name: 'niveau1', selected: true }, niveau2: { name: 'niveau2', selected: false } }
    }
  }
} as unknown as Type_JSON)

const loadApp = () => {
  const app = new Class_ApplicationData(false)
  // `fromJSON` MUTE son argument : on ne lui donne jamais l objet du test.
  app.fromJSON(JSON.parse(JSON.stringify(file())) as never, {}, false)
  app.drawing_area.bypass_redraws = true
  return app
}

const BY_CHILDREN = { decompose: { kind: 'node_children' as const, dimension_id: 'dim' }, compare: null }

const partsOfRacine = (app: Class_ApplicationData) => {
  const node = app.drawing_area.sankey.nodes_dict['Racine']
  const subject = { kind: 'node', node } as unknown as Type_ChartSubject
  return buildAnalysisChartData(subject, BY_CHILDREN, FOLLOWING_NAVIGATION).series[0]?.parts ?? []
}

describe('os#1432 la decomposition par noeuds enfants', () => {

  test('un parent replie decompose quand meme par ses enfants', () => {
    const app = loadApp()
    // Le decor : les enfants existent, et le Sankey ne les trace pas.
    expect(app.drawing_area.sankey.nodes_dict['EnfantA'].is_visible).toBe(false)
    expect(app.drawing_area.sankey.nodes_dict['EnfantB'].is_visible).toBe(false)

    const parts = partsOfRacine(app)

    expect(parts.map(p => p.id).sort()).toEqual(['EnfantA', 'EnfantB'])
  })

  test('chaque part porte la valeur structurelle de son enfant', () => {
    // Les valeurs du fichier, et non zero : c est le fond du defaut. Lues sur les flux de
    // l enfant quel que soit l etat d agregation, comme le sunburst les lit.
    const app = loadApp()
    const by_id = Object.fromEntries(partsOfRacine(app).map(p => [p.id, p.value]))

    expect(by_id['EnfantA']).toBe(6)
    expect(by_id['EnfantB']).toBe(8)
  })

  test('un enfant ecarte par un filtre d etiquettes n est pas une part', () => {
    // L autre moitie de la regle, celle qui tenait deja : l agregation ne retire rien, un
    // FILTRE si. Le cas est ici pour que le correctif ne l emporte pas au passage.
    const app = loadApp()
    const beta = app.drawing_area.sankey.node_taggs_dict['groupe'].tags_dict['beta'] as Class_NodeTag
    beta.setUnSelected()

    const parts = partsOfRacine(app)

    expect(parts.map(p => p.id)).toEqual(['EnfantA'])
  })

  test('une dimension inconnue ne decompose rien', () => {
    const app = loadApp()
    const node = app.drawing_area.sankey.nodes_dict['Racine']
    const subject = { kind: 'node', node } as unknown as Type_ChartSubject
    const parts = buildAnalysisChartData(
      subject,
      { decompose: { kind: 'node_children', dimension_id: 'dim_absente' }, compare: null },
      FOLLOWING_NAVIGATION
    ).series[0]?.parts ?? []

    expect(parts).toEqual([])
  })
})
