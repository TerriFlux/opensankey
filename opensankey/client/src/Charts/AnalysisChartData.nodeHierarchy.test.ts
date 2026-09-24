// LA COURONNE DESCEND LA HIERARCHIE, ET ELLE DESCEND AU CLIC.
//
// 23/09 — « que la couronne fonctionne comme le sunburst sur la desagregation des noeuds, mais au
// lieu de faire une couronne qui s etend, le faire in place » (Julien).
// 24/09 — « je voudrais que le sunburst apparaisse progressivement avec les clics : si je clique
// sur Mais, ca ouvre une nouvelle couronne, Mais Bio et Mais Conventionnel ; et si je fais
// shift+clic ca l enleve ».
//
// ── CE QUE CE FICHIER FIGE, ET POURQUOI LE MODELE A CHANGE ───────────────────────────────────
//
// La descente a d abord ete un MODE, decide d avance : un seul niveau, comme le diagramme, jusqu
// aux feuilles. Deux de ces trois valeurs rendaient le clic INERTE — sous « jusqu aux feuilles »
// la figure montrait deja tout, cliquer ne pouvait rien ouvrir. Julien l a rapporte sous « le clic
// ne marche plus » : ce n etait pas le code, c etait le modele.
//
// La descente est donc un ENSEMBLE DE NOEUDS OUVERTS, que la figure retient. Vide, c est « un seul
// niveau » ; plein, c est « jusqu aux feuilles » ; entre les deux, c est ce que l auteur a ouvert
// lui-meme. Les trois modes en sont des cas particuliers, et plus aucun ne rend le geste inerte.
//
// Le decor : Racine a deux enfants, dont l un a lui-meme deux enfants. Sans ce troisieme etage il
// n y aurait rien a ouvrir.

import { Class_ApplicationData } from '../types/ApplicationData'
import { CURRENT_FORMAT_VERSION } from '../Persistence/persistenceMigrations'
import type { Type_JSON } from '../types/Utils'
import { FOLLOWING_NAVIGATION } from './FigureNavigation'

import {
  analysisHierarchyTree, buildAnalysisChartData, expandedDownToLevel
} from './AnalysisChartData'
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

const subjectOf = (app: Class_ApplicationData, id = 'Racine') =>
  ({ kind: 'node', node: app.drawing_area.sankey.nodes_dict[id] } as unknown as Type_ChartSubject)

const descriptorOf = (focus_id?: string) =>
  ({ decompose: { kind: 'node_children' as const, dimension_id: 'dim', focus_id }, compare: null })

/** Les parts dessinees « en place », avec les noeuds qu on a ouverts. */
const partsOf = (
  app: Class_ApplicationData, opened: string[] = [], focus_id?: string
): Type_ChartPart[] => buildAnalysisChartData(
  subjectOf(app), descriptorOf(focus_id), FOLLOWING_NAVIGATION, {}, new Set(opened)
).series[0]?.parts ?? []

const ids = (parts: Type_ChartPart[]) => parts.map(p => p.id).sort()
const valueOf = (parts: Type_ChartPart[], id: string) => parts.find(p => p.id === id)?.value

describe('la decomposition d un noeud, ouverte au clic', () => {

  test('rien d ouvert : elle decompose d un cran — le dessin d hier', () => {
    // LA GARANTIE DU LOT : un descripteur qui ne dit rien passe par le chemin d avant. Si ce cas
    // tombait, tout le parc enregistre changerait d aspect.
    const app = loadApp()

    expect(ids(partsOf(app))).toEqual(['Cereales', 'Viande'])
  })

  test('un noeud ouvert : ses enfants REMPLACENT leur parent, dans le meme anneau', () => {
    // « In place » : Cereales n est PAS dans la liste a cote de Ble et Mais. Un anneau qui
    // porterait les trois compterait la meme matiere deux fois.
    const app = loadApp()

    const parts = partsOf(app, ['Cereales'])

    expect(ids(parts)).toEqual(['Ble', 'Mais', 'Viande'])
    expect(valueOf(parts, 'Ble')).toBe(6)
    expect(valueOf(parts, 'Mais')).toBe(4)
    // Viande n est pas ouverte : elle reste elle-meme, au premier cran, dans le meme anneau.
    expect(valueOf(parts, 'Viande')).toBe(4)
  })

  test('la frontiere boucle sur le sujet, quel que soit ce qui est ouvert', () => {
    // C est la condition pour qu une couronne dise la verite : les parts font un TOUT. Une
    // frontiere qui ne boucle pas se lit sans se voir.
    const app = loadApp()

    expect(partsOf(app).reduce((s, p) => s + p.value, 0)).toBe(14)
    expect(partsOf(app, ['Cereales']).reduce((s, p) => s + p.value, 0)).toBe(14)
  })

  test('ouvrir un noeud SANS enfant ne change rien', () => {
    // Le geste ne peut pas fabriquer un anneau vide : la figure dirait le contraire du clic.
    const app = loadApp()

    expect(ids(partsOf(app, ['Viande']))).toEqual(['Cereales', 'Viande'])
  })

  test('chaque part porte SA ROUTE, celle que le clic deplie', () => {
    // La couronne ne depliait que le noeud clique : sur un noeud profond, ses ancetres restaient
    // replies et le diagramme montrait le parent ET ses parts. La route est ce qui manquait, et c
    // est `disaggregateAlong` — partagee avec le disque — qui la consomme.
    const app = loadApp()

    const parts = partsOf(app, ['Cereales'])

    expect(parts.find(p => p.id === 'Ble')?.path).toEqual(['Racine', 'Cereales', 'Ble'])
    // Un enfant direct a une route de deux crans : la racine, puis lui.
    expect(parts.find(p => p.id === 'Viande')?.path).toEqual(['Racine', 'Viande'])
  })

  test('chaque part dit d ou elle vient : sa profondeur et son parent dessine', () => {
    // Les deux champs que la LEGENDE lit (« Cereales > Ble ») : sans eux, un anneau qui melange
    // deux niveaux ne dit plus de quoi chaque secteur est la coupe.
    const app = loadApp()

    const parts = partsOf(app, ['Cereales'])

    expect(parts.find(p => p.id === 'Ble')?.depth).toBe(1)
    expect(parts.find(p => p.id === 'Ble')?.parent_label).toBe('Cereales')
    expect(parts.find(p => p.id === 'Viande')?.depth).toBe(0)
    expect(parts.find(p => p.id === 'Viande')?.parent_label).toBe('Racine')
  })

  test('un foyer fait du noeud ou l on est descendu le TOUT', () => {
    // Le drill-down : Cereales devient le tout, ses freres sortent de la figure, et les parts
    // repartent du cran zero. C est ce que `hierarchy_focus` ecrit au clic.
    const app = loadApp()

    const parts = partsOf(app, [], 'Cereales')

    expect(ids(parts)).toEqual(['Ble', 'Mais'])
    expect(parts.reduce((s, p) => s + p.value, 0)).toBe(10)
    expect(parts.find(p => p.id === 'Ble')?.depth).toBe(0)
    expect(parts.find(p => p.id === 'Ble')?.path).toEqual(['Cereales', 'Ble'])
  })

  test('un foyer qui nomme un noeud disparu revient au sujet', () => {
    // Un reglage perime n est pas une panne : la figure montre son sujet plutot que de se vider.
    const app = loadApp()

    expect(ids(partsOf(app, [], 'Disparu'))).toEqual(['Cereales', 'Viande'])
  })
})

// ── « LE SUNBURST C EST JUSTE UN MODE DE PLUS » ──────────────────────────────────────────────
//
// Julien : « quand on desagrege, ca ajoute pour chaque niveau une couronne ». Ce que ce bloc fige
// est la condition pour que ce soit vrai : LES DEUX RENDUS LISENT LE MEME ARBRE. Si les anneaux et
// la frontiere partaient d arbres differents, changer de mode cesserait d etre un changement de
// dessin pour devenir un changement de sujet.
describe('l arbre de la descente, celui que les deux modes partagent', () => {

  const treeOf = (app: Class_ApplicationData, opened: string[] = []) =>
    analysisHierarchyTree(
      subjectOf(app), descriptorOf(), FOLLOWING_NAVIGATION, {}, new Set(opened)
    )

  /** Les feuilles de l arbre, a plat — ce que le mode « en place » dessine. */
  const leaves = (sector: Type_SunburstNode): string[] =>
    sector.children.length === 0 ? [sector.id] : sector.children.flatMap(leaves)

  test('ses feuilles sont EXACTEMENT les parts du mode en place', () => {
    const app = loadApp()

    const root = treeOf(app, ['Cereales'])!.roots[0]

    expect(root.children.flatMap(leaves).sort()).toEqual(ids(partsOf(app, ['Cereales'])))
  })

  test('il s arrete sous ce qui n est pas ouvert : un anneau par noeud ouvert, pas plus', () => {
    const app = loadApp()

    const closed = treeOf(app)!.roots[0]
    expect(closed.children.map(c => c.id).sort()).toEqual(['Cereales', 'Viande'])
    expect(closed.children.find(c => c.id === 'Cereales')?.children).toEqual([])

    const opened = treeOf(app, ['Cereales'])!.roots[0]
    expect(opened.children.find(c => c.id === 'Cereales')?.children.map(c => c.id).sort())
      .toEqual(['Ble', 'Mais'])
  })

  test('elaguer ne change pas les valeurs : un noeud ferme vaut tout ce qu il contient', () => {
    // La raison d elaguer APRES la construction et non pendant. Sans elle, « Cereales » ferme
    // vaudrait sa valeur propre et non celle de Ble + Mais, et les deux modes ne boucleraient pas
    // sur le meme total.
    const app = loadApp()

    expect(treeOf(app)!.roots[0].children.find(c => c.id === 'Cereales')?.value).toBe(10)
  })

  test('la lecture reglee par l auteur s applique aux DEUX modes', () => {
    // Les quatre cles que la nature « Sunburst » portait en propre (combien d anneaux, ce que vaut
    // un noeud, de quel cote, le non reparti) sont lues par la couronne. Elles changent l ARBRE,
    // pas son dessin : si elles ne valaient que pour les anneaux, la meme descente montrerait deux
    // decompositions selon le mode choisi.
    const app = loadApp()
    // Un seul anneau demande : « Ble » et « Mais » sont hors de portee, meme ouverts. La racine
    // occupant le centre, la profondeur utile part d un cran plus bas.
    const shallow = { max_depth: 1 }
    const opened = new Set(['Cereales'])

    const frontier = buildAnalysisChartData(
      subjectOf(app), descriptorOf(), FOLLOWING_NAVIGATION, shallow, opened
    ).series[0]?.parts ?? []
    const tree = analysisHierarchyTree(
      subjectOf(app), descriptorOf(), FOLLOWING_NAVIGATION, shallow, opened
    )

    expect(ids(frontier)).toEqual(['Cereales', 'Viande'])
    expect(tree!.roots[0].children.flatMap(leaves).sort()).toEqual(['Cereales', 'Viande'])
  })
})

// ── LE SELECTEUR DE NIVEAU, COMME SUR LE SANKEY ──────────────────────────────────────────────
//
// Julien : « il faut faire la meme interface que pour le Sankey : sur la dimension choisie, un
// selecteur de niveau ». Le diagramme a deux commandes de hierarchie — un niveau GLOBAL sur tous
// les noeuds, et le clic droit LOCAL sur un noeud. La figure n avait que la seconde.
//
// Ce que ce bloc fige : le niveau ECRIT l ensemble des noeuds ouverts, il ne s y superpose pas.
// C est ce qui fait que les deux commandes cooperent — apres « niveau 3 », shift+clic referme une
// branche et le reste tient. Deux regles auraient rouvert ce que le clic venait de fermer.
describe('le niveau, raccourci qui remplit l ensemble ouvert', () => {

  const levelOf = (app: Class_ApplicationData, depth: number) =>
    [...expandedDownToLevel(app.drawing_area.sankey.nodes_dict['Racine'], 'dim', depth)].sort()

  test('niveau 0 n ouvre rien : la couronne montre un cran', () => {
    const app = loadApp()

    expect(levelOf(app, 0)).toEqual([])
    expect(ids(partsOf(app, levelOf(app, 0)))).toEqual(['Cereales', 'Viande'])
  })

  test('niveau 1 ouvre les enfants du sujet, donc les petits-enfants paraissent', () => {
    // « Cereales » s ouvre ; « Viande », qui n a pas d enfants, n entre pas dans l ensemble — on
    // n ouvre jamais ce qui ne contient rien.
    const app = loadApp()

    expect(levelOf(app, 1)).toEqual(['Cereales'])
    expect(ids(partsOf(app, levelOf(app, 1)))).toEqual(['Ble', 'Mais', 'Viande'])
  })

  test('au-dela du dernier niveau, l ensemble ne grandit plus', () => {
    // La hierarchie du decor a deux etages : demander le troisieme ne peut rien ouvrir de plus,
    // et le selecteur doit rendre le meme ensemble plutot que de fabriquer des identifiants.
    const app = loadApp()

    expect(levelOf(app, 5)).toEqual(['Cereales'])
  })

  test('le clic reste maitre : refermer apres un niveau tient', () => {
    // C est la raison d avoir UN SEUL etat. Le niveau remplit l ensemble, shift+clic en retire un
    // noeud, et rien ne le rouvre dans le dos de l auteur.
    const app = loadApp()
    const after_level = new Set(levelOf(app, 1))
    after_level.delete('Cereales')

    expect(ids(partsOf(app, [...after_level]))).toEqual(['Cereales', 'Viande'])
  })
})
