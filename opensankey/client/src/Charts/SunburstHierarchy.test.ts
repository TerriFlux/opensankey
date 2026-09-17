// os#1420 — LA COURONNE SUIT LA NAVIGATION, SANS SUIVRE L'AGRÉGATION.
//
// C'est la distinction que tout ce lot repose sur, et elle ne se voit que sur un
// diagramme qui a les deux à la fois : une hiérarchie AGRÉGÉE (les enfants existent,
// le Sankey ne les trace pas) et un filtre d'étiquettes de nœuds (un enfant que
// l'utilisateur vient d'écarter). La couronne doit montrer le premier — c'est ce qu'on
// lui demande, donner à voir d'un coup les niveaux que le Sankey ne donne qu'en
// dépliant — et ne pas montrer le second, qui n'est plus dans le diagramme.
//
// Second sujet : une couronne peut ÉPINGLER son millésime, et lire 2019 pendant que le
// diagramme montre 2021.

import { Class_ApplicationData } from '../types/ApplicationData'
import { CURRENT_FORMAT_VERSION } from '../Persistence/persistenceMigrations'
import { buildSunburstTree } from './SunburstHierarchy'
import { FIGURE_DATA_TAGS_KEY, figureNavigationOf } from './FigureNavigation'
import type { Class_DataTag, Class_NodeTag } from '../types/Tag'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_NodeElement } from '../Elements/Node'
import type { Type_JSON } from '../types/Utils'

// Amont alimente Racine et ses deux enfants. La hiérarchie « dim » est déclarée par
// `dimensions.parent_name` sur chaque enfant ; le niveau AFFICHÉ est niveau1, donc les
// enfants sont agrégés — exactement le diagramme qui rendait un sunburst utile.
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
    amont_racine: {
      idLink: 'amont_racine', idSource: 'Amont', idTarget: 'Racine', value: { value: 14 }
    },
    amont_a: {
      idLink: 'amont_a', idSource: 'Amont', idTarget: 'EnfantA', value: { value: 6 }
    },
    amont_b: {
      idLink: 'amont_b', idSource: 'Amont', idTarget: 'EnfantB', value: { value: 8 }
    }
  },
  nodeTags: {
    groupe: {
      group_name: 'Groupe', banner: 'none', activated: true,
      tags: {
        alpha: { name: 'alpha', selected: true },
        beta: { name: 'beta', selected: true }
      }
    }
  },
  levelTags: {
    dim: {
      group_name: 'Dimension', banner: 'one', activated: true, siblings: [],
      tags: {
        niveau1: { name: 'niveau1', selected: true },
        niveau2: { name: 'niveau2', selected: false }
      }
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

const nodeOf = (app: Class_ApplicationData, id: string) =>
  app.drawing_area.sankey.nodes_dict[id] as Class_NodeElement

const linkOf = (app: Class_ApplicationData, id: string) =>
  app.drawing_area.sankey.links_dict[id] as Class_LinkElement

/** Les anneaux du premier niveau, par identifiant, dans l ordre alphabetique. */
const ringIds = (roots: { id: string, children: { id: string }[] }[]): string[] =>
  roots[0].children.map(c => c.id).sort()

const ringValue = (
  roots: { children: { id: string, value: number }[] }[],
  id: string
): number | undefined => roots[0].children.find(c => c.id === id)?.value

describe('os#1420 — la couronne montre l agregation et non les filtres', () => {
  it('un enfant cache par l AGREGATION est quand meme un anneau', () => {
    const app = loadApp()
    const sankey = app.drawing_area.sankey
    const tree = buildSunburstTree(sankey)
    expect(tree).not.toBeNull()
    expect(tree!.roots.map(r => r.id)).toEqual(['Racine'])
    expect(ringIds(tree!.roots)).toEqual(['EnfantA', 'EnfantB'])
    // Et ces deux enfants-la ne sont PAS traces par le Sankey : c est tout le propos.
    expect(nodeOf(app, 'EnfantA').is_visible).toBe(false)
    expect(nodeOf(app, 'EnfantB').is_visible).toBe(false)
    expect(nodeOf(app, 'Racine').is_visible).toBe(true)
  })

  it('un enfant ecarte par un FILTRE d etiquettes de noeuds n est plus un anneau', () => {
    const app = loadApp()
    const sankey = app.drawing_area.sankey
    const beta = sankey.node_taggs_dict['groupe'].tags_dict['beta'] as Class_NodeTag
    beta.setUnSelected()

    const tree = buildSunburstTree(sankey)
    expect(tree).not.toBeNull()
    expect(ringIds(tree!.roots)).toEqual(['EnfantA'])
    // Le flux de l enfant ecarte ne compte plus non plus dans la valeur du pere.
    expect(tree!.roots[0].value).toBe(6)
  })
})

describe('os#1420 — la couronne peut epingler son etiquette de donnees', () => {
  /** Deux millesimes, 2021 sur le diagramme, 2019 a la moitie. */
  const withYears = () => {
    const app = loadApp()
    const sankey = app.drawing_area.sankey
    const annee = sankey.addDataTagGroup('annee', 'Annee', false)
    const t2019 = annee.addTag('2019', '2019') as Class_DataTag
    const t2021 = annee.addTag('2021', '2021') as Class_DataTag
    t2019.setUnSelected()
    t2021.setSelected()
    const set = (link_id: string, tag: Class_DataTag, value: number) => {
      const leaf = linkOf(app, link_id).valueForTag(tag)
      expect(leaf).not.toBeNull()
      leaf!.valueData = value
    }
    set('amont_racine', t2019, 7)
    set('amont_racine', t2021, 14)
    set('amont_a', t2019, 3)
    set('amont_a', t2021, 6)
    set('amont_b', t2019, 4)
    set('amont_b', t2021, 8)
    return { app, sankey, t2019, t2021 }
  }

  it('sans epingle, la couronne lit ce que le diagramme montre (2021)', () => {
    const { sankey } = withYears()
    const tree = buildSunburstTree(sankey)
    expect(tree).not.toBeNull()
    expect(ringValue(tree!.roots, 'EnfantA')).toBe(6)
    expect(ringValue(tree!.roots, 'EnfantB')).toBe(8)
    expect(tree!.roots[0].value).toBe(14)
  })

  it('epinglee sur 2019, la couronne lit 2019 pendant que le diagramme reste en 2021', () => {
    const { sankey } = withYears()
    const nav = figureNavigationOf(sankey, { [FIGURE_DATA_TAGS_KEY]: { annee: '2019' } })
    const tree = buildSunburstTree(sankey, {}, 'Unallocated', nav)
    expect(tree).not.toBeNull()
    expect(ringValue(tree!.roots, 'EnfantA')).toBe(3)
    expect(ringValue(tree!.roots, 'EnfantB')).toBe(4)
    expect(tree!.roots[0].value).toBe(7)

    // Le diagramme n a pas bouge : epingler une figure ne mute pas le modele.
    const suivie = buildSunburstTree(sankey)
    expect(ringValue(suivie!.roots, 'EnfantA')).toBe(6)
  })
})

describe('le reglage compte des ANNEAUX, pas des niveaux du modele', () => {
  it('descend un cran de plus quand la racine unique part au centre', () => {
    // Un seul sommet : il va au centre et ne prend aucun anneau (cf. sunburstScope).
    // Un anneau demande doit donc rendre le cran des enfants, pas celui de la racine.
    const app = loadApp()
    const tree = buildSunburstTree(app.drawing_area.sankey, { max_depth: 1 })
    expect(tree).not.toBeNull()
    expect(ringIds(tree!.roots)).toEqual(['EnfantA', 'EnfantB'])
    expect(tree!.is_truncated).toBe(false)
  })
})
