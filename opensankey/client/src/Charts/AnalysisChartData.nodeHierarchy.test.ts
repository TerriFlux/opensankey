// 23/09/2026 — LA COURONNE DESCEND LA HIERARCHIE, DANS UN SEUL ANNEAU.
//
// Julien : « je voudrais que la couronne fonctionne comme le sunburst sur la desagregation des
// noeuds, mais au lieu de faire une couronne qui s etend, le faire in place. »
//
// Ce que ce fichier fige, c est la FRONTIERE : la liste plate des parts qu une couronne dessine
// quand on lui demande de descendre. Un noeud deplie disparait derriere ses enfants, exactement
// comme dans le Sankey — c est tout le sens de « in place », et c est la seule chose qui ne se
// verifie pas a l oeil (les valeurs doivent continuer a boucler sur le sujet quel que soit le
// niveau ou chaque part s est arretee).
//
// Le decor est celui de `AnalysisChartData.nodeChildren.test`, d un cran plus profond : Racine a
// deux enfants, dont l un a lui-meme deux enfants. Sans ce troisieme etage il n y aurait rien a
// descendre, et les trois modes rendraient la meme chose.

import { Class_ApplicationData } from '../types/ApplicationData'
import { CURRENT_FORMAT_VERSION } from '../Persistence/persistenceMigrations'
import type { Type_JSON } from '../types/Utils'
import { FOLLOWING_NAVIGATION } from './FigureNavigation'

import { analysisHierarchyTree, buildAnalysisChartData } from './AnalysisChartData'
import type { Type_ChartPart, Type_ChartSubject } from './AnalysisChartData'
import type { Type_SunburstNode } from './SunburstHierarchy'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// Amont alimente tout le monde, a tous les etages : c est ce qui donne a chaque noeud une valeur
// STRUCTURELLE lisible quel que soit l etat d agregation (cf. `sunburstNodeValue`).
//   Racine 14 = Cereales 10 (= Ble 6 + Mais 4) + Viande 4
const file = (): Type_JSON => ({
  version: '1.3.0',
  format_version: CURRENT_FORMAT_VERSION,
  nodes: {
    Amont: { idNode: 'Amont', name: 'Amont' },
    Racine: { idNode: 'Racine', name: 'Racine', tags: { dim: ['niveau1'] } },
    Cereales: {
      idNode: 'Cereales', name: 'Cereales',
      tags: { dim: ['niveau2'] },
      dimensions: { dim: { parent_name: 'Racine' } }
    },
    Viande: {
      idNode: 'Viande', name: 'Viande',
      tags: { dim: ['niveau2'] },
      dimensions: { dim: { parent_name: 'Racine' } }
    },
    Ble: {
      idNode: 'Ble', name: 'Ble',
      tags: { dim: ['niveau3'] },
      dimensions: { dim: { parent_name: 'Cereales' } }
    },
    Mais: {
      idNode: 'Mais', name: 'Mais',
      tags: { dim: ['niveau3'] },
      dimensions: { dim: { parent_name: 'Cereales' } }
    }
  },
  links: {
    amont_racine: { idLink: 'amont_racine', idSource: 'Amont', idTarget: 'Racine', value: { value: 14 } },
    amont_cereales: { idLink: 'amont_cereales', idSource: 'Amont', idTarget: 'Cereales', value: { value: 10 } },
    amont_viande: { idLink: 'amont_viande', idSource: 'Amont', idTarget: 'Viande', value: { value: 4 } },
    amont_ble: { idLink: 'amont_ble', idSource: 'Amont', idTarget: 'Ble', value: { value: 6 } },
    amont_mais: { idLink: 'amont_mais', idSource: 'Amont', idTarget: 'Mais', value: { value: 4 } }
  },
  levelTags: {
    dim: {
      group_name: 'Dimension', banner: 'one', activated: true, siblings: [],
      tags: {
        niveau1: { name: 'niveau1', selected: true },
        niveau2: { name: 'niveau2', selected: false },
        niveau3: { name: 'niveau3', selected: false }
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

const partsOf = (
  app: Class_ApplicationData,
  spec: { hierarchy?: 'off' | 'diagram' | 'leaves', focus_id?: string }
): Type_ChartPart[] => {
  const node = app.drawing_area.sankey.nodes_dict['Racine']
  const subject = { kind: 'node', node } as unknown as Type_ChartSubject
  return buildAnalysisChartData(
    subject,
    { decompose: { kind: 'node_children', dimension_id: 'dim', ...spec }, compare: null },
    FOLLOWING_NAVIGATION
  ).series[0]?.parts ?? []
}

const ids = (parts: Type_ChartPart[]) => parts.map(p => p.id).sort()
const valueOf = (parts: Type_ChartPart[], id: string) => parts.find(p => p.id === id)?.value

/** Ce que fait le clic droit du diagramme, par le geste du modele et non par un drapeau pose. */
const deplier = (app: Class_ApplicationData, node_id: string) => {
  app.drawing_area.sankey.nodes_dict[node_id].dimensions_as_parent
    .find(d => d.id === 'dim')
    ?.setForceToShowChildren()
}

describe('la decomposition hierarchique d un noeud', () => {

  test('sans reglage, elle decompose d un cran — le dessin d hier', () => {
    // LA GARANTIE DU LOT : un descripteur qui ne dit rien passe par le chemin d avant. Si ce cas
    // tombait, tout le parc enregistre changerait d aspect.
    const app = loadApp()

    expect(ids(partsOf(app, {}))).toEqual(['Cereales', 'Viande'])
    expect(ids(partsOf(app, { hierarchy: 'off' }))).toEqual(['Cereales', 'Viande'])
  })

  test('jusqu aux feuilles, les petits-enfants REMPLACENT leur parent', () => {
    // « In place » : Cereales n est PAS dans la liste a cote de Ble et Mais. Un anneau qui
    // porterait les trois compterait la meme matiere deux fois.
    const app = loadApp()

    const parts = partsOf(app, { hierarchy: 'leaves' })

    expect(ids(parts)).toEqual(['Ble', 'Mais', 'Viande'])
    expect(valueOf(parts, 'Ble')).toBe(6)
    expect(valueOf(parts, 'Mais')).toBe(4)
    // Viande n a pas d enfants : elle reste elle-meme, au premier cran, dans le meme anneau.
    expect(valueOf(parts, 'Viande')).toBe(4)
  })

  test('la frontiere boucle sur le sujet, quel que soit le niveau de chaque part', () => {
    // C est la condition pour qu une couronne dise la verite : les parts font un TOUT. Une
    // frontiere qui ne boucle pas se lit sans se voir.
    const app = loadApp()

    const total = partsOf(app, { hierarchy: 'leaves' }).reduce((s, p) => s + p.value, 0)

    expect(total).toBe(14)
  })

  test('« comme le diagramme » suit la desagregation, et rien d autre', () => {
    const app = loadApp()

    // Rien n est deplie : la couronne s arrete au premier cran, comme le dessin.
    expect(ids(partsOf(app, { hierarchy: 'diagram' }))).toEqual(['Cereales', 'Viande'])

    // On deplie Cereales : ses enfants prennent sa place, ici comme la-bas.
    deplier(app, 'Cereales')
    const parts = partsOf(app, { hierarchy: 'diagram' })

    expect(ids(parts)).toEqual(['Ble', 'Mais', 'Viande'])
    expect(parts.reduce((s, p) => s + p.value, 0)).toBe(14)
  })

  test('chaque part porte SA ROUTE, celle que le clic deplie', () => {
    // 24/09/2026 — Julien : « ca marche pas aussi bien que le sunburst ; sur le sunburst ca lance
    // effectivement la commande desagreger qui met tout en place ». La couronne ne depliait que le
    // noeud clique : sur un noeud profond, ses ancetres restaient replies et le diagramme montrait
    // le parent ET ses parts. La route est ce qui manquait, et c est `disaggregateAlong` — partagee
    // avec le disque — qui la consomme.
    const app = loadApp()

    const parts = partsOf(app, { hierarchy: 'leaves' })

    expect(parts.find(p => p.id === 'Ble')?.path).toEqual(['Racine', 'Cereales', 'Ble'])
    // Un enfant direct a une route de deux crans : la racine, puis lui.
    expect(parts.find(p => p.id === 'Viande')?.path).toEqual(['Racine', 'Viande'])
  })

  test('sous un foyer, la route repart du foyer', () => {
    // C est le noeud deja deplie dans le diagramme, donc le bon point de depart : deplier au-dessus
    // de lui ne regarde pas cette figure.
    const app = loadApp()

    const parts = partsOf(app, { hierarchy: 'leaves', focus_id: 'Cereales' })

    expect(parts.find(p => p.id === 'Ble')?.path).toEqual(['Cereales', 'Ble'])
  })

  test('chaque part dit d ou elle vient : sa profondeur et son parent dessine', () => {
    // Ce sont les deux champs que la LEGENDE lit (« Cereales > Ble ») — la demande de Julien :
    // « que le nom des noeuds puisse se voir en legende ». Sans eux, un anneau qui melange deux
    // niveaux ne dit plus de quoi chaque secteur est la coupe.
    const app = loadApp()

    const parts = partsOf(app, { hierarchy: 'leaves' })
    const ble = parts.find(p => p.id === 'Ble')
    const viande = parts.find(p => p.id === 'Viande')

    expect(ble?.depth).toBe(1)
    expect(ble?.parent_label).toBe('Cereales')
    expect(viande?.depth).toBe(0)
    expect(viande?.parent_label).toBe('Racine')
  })

  test('un foyer fait du noeud ou l on est descendu le TOUT', () => {
    // Le drill-down : Cereales devient le tout, ses freres sortent de la figure, et les parts
    // repartent du cran zero. C est ce que `hierarchy_focus` ecrit au clic.
    const app = loadApp()

    const parts = partsOf(app, { hierarchy: 'leaves', focus_id: 'Cereales' })

    expect(ids(parts)).toEqual(['Ble', 'Mais'])
    expect(parts.reduce((s, p) => s + p.value, 0)).toBe(10)
    expect(parts.find(p => p.id === 'Ble')?.depth).toBe(0)
    expect(parts.find(p => p.id === 'Ble')?.parent_label).toBe('Cereales')
  })

  test('un foyer qui nomme un noeud disparu revient au sujet', () => {
    // Un reglage perime n est pas une panne : la figure montre son sujet plutot que de se vider.
    const app = loadApp()

    const parts = partsOf(app, { hierarchy: 'diagram', focus_id: 'Disparu' })

    expect(ids(parts)).toEqual(['Cereales', 'Viande'])
  })
})

// ── 24/09/2026 — « LE SUNBURST C EST JUSTE UN MODE DE PLUS » ─────────────────────────────────
//
// Julien : « quand on desagrege, ca ajoute pour chaque niveau une couronne ». Ce que ce bloc fige
// est la condition pour que ce soit vrai : LES DEUX RENDUS LISENT LE MEME ARBRE. Si la descente
// donnait un arbre aux anneaux et un autre a la frontiere, les deux modes montreraient deux
// decompositions differentes du meme noeud — et changer de mode cesserait d etre un changement de
// dessin pour devenir un changement de sujet.
describe('l arbre de la descente, celui que les deux modes partagent', () => {

  const treeOf = (app: Class_ApplicationData, hierarchy: 'diagram' | 'leaves') => {
    const node = app.drawing_area.sankey.nodes_dict['Racine']
    const subject = { kind: 'node', node } as unknown as Type_ChartSubject
    return analysisHierarchyTree(
      subject,
      { decompose: { kind: 'node_children', dimension_id: 'dim', hierarchy }, compare: null },
      FOLLOWING_NAVIGATION
    )
  }

  /** Les feuilles de l arbre, a plat — ce que le mode « en place » dessine. */
  const leaves = (sector: Type_SunburstNode): string[] =>
    sector.children.length === 0 ? [sector.id] : sector.children.flatMap(leaves)

  test('ses feuilles sont EXACTEMENT les parts du mode en place', () => {
    const app = loadApp()
    deplier(app, 'Cereales')

    const root = treeOf(app, 'diagram')!.roots[0]

    expect(root.children.flatMap(leaves).sort()).toEqual(ids(partsOf(app, { hierarchy: 'diagram' })))
  })

  test('« comme le diagramme » elague sous ce que le dessin ne deplie pas', () => {
    // C est l elagage qui fait les anneaux : un niveau replie ne prend pas d anneau, exactement
    // comme il ne prend pas de secteur en place.
    const app = loadApp()
    const root = treeOf(app, 'diagram')!.roots[0]

    expect(root.children.map(c => c.id).sort()).toEqual(['Cereales', 'Viande'])
    expect(root.children.find(c => c.id === 'Cereales')?.children).toEqual([])
  })

  test('jusqu aux feuilles, l arbre garde ses deux etages', () => {
    const app = loadApp()
    const cereales = treeOf(app, 'leaves')!.roots[0].children.find(c => c.id === 'Cereales')

    expect(cereales?.children.map(c => c.id).sort()).toEqual(['Ble', 'Mais'])
    // Et la valeur du parent reste la somme des siens : un anneau ne peut pas etre plus petit que
    // ce qu il contient.
    expect(cereales?.value).toBe(10)
  })

  test('elaguer ne change pas les valeurs : un noeud elague vaut tout ce qu il contient', () => {
    // La raison d elaguer APRES la construction et non pendant. Sans elle, « Cereales » replie
    // vaudrait sa valeur propre et non celle de Ble + Mais, et les deux modes ne boucleraient pas
    // sur le meme total.
    const app = loadApp()
    const replie = treeOf(app, 'diagram')!.roots[0].children.find(c => c.id === 'Cereales')

    expect(replie?.value).toBe(10)
  })

  test('sans descente, il n y a pas d arbre du tout', () => {
    const app = loadApp()
    const node = app.drawing_area.sankey.nodes_dict['Racine']
    const subject = { kind: 'node', node } as unknown as Type_ChartSubject

    expect(analysisHierarchyTree(
      subject,
      { decompose: { kind: 'node_children', dimension_id: 'dim' }, compare: null },
      FOLLOWING_NAVIGATION
    )).toBeNull()
  })
})

describe('les cas ecartes', () => {

  test('un foyer qui nomme un noeud disparu revient au sujet, en anneaux aussi', () => {
    // Un reglage perime n est pas une panne : la figure montre son sujet plutot que de se vider.
    const app = loadApp()

    const parts = partsOf(app, { hierarchy: 'diagram', focus_id: 'Disparu' })

    expect(ids(parts)).toEqual(['Cereales', 'Viande'])
  })
})
