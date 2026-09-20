// os#1445, etape 2 — L ADAPTATEUR DE LA COURONNE, et la garantie qui commande tout le lot.
//
// Deux choses se verifient ici :
//  1. CE QU UNE PART DESIGNE. Une part n est pas toujours un noeud (correction de Julien, 20/09) :
//     le secteur de complement ne designe rien, et un identifiant introuvable non plus — surtout
//     pas une reference inventee.
//  2. QU UNE COURONNE ENREGISTREE AVANT CE LOT NE CHANGE PAS D ASPECT. C est le seul critere du
//     contrat, et il se joue sur un detail : les valeurs d usine d un element ne sont PAS celles
//     du trace (quatorze points contre dix, un lisere noir contre un blanc). Une part fraiche ne
//     doit donc rien dire du tout.

import { sunburstPartInputs, sunburstPartSubject } from './sunburstParts'
import type { Type_SunburstPartsSource } from './sunburstParts'
import { buildParts } from './buildParts'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { SUNBURST_STYLE_DEFAULTS, sunburstPartStyle } from '../../Charts/SunburstChart'
import type { Type_SunburstNode, Type_SunburstTree } from '../../Charts/SunburstHierarchy'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const sector = (
  id: string,
  value: number,
  children: Type_SunburstNode[] = [],
  extra: Partial<Type_SunburstNode> = {}
): Type_SunburstNode => ({
  id, label: id, value, declared: value, color: null, depth: 0, children, dimension_id: 'dim', ...extra
})

const treeOf = (roots: Type_SunburstNode[]): Type_SunburstTree => ({
  dimension_id: 'dim',
  dimension_label: 'Especes',
  roots,
  rings: [],
  total: roots.reduce((acc, r) => acc + r.value, 0),
  mismatch_count: 0,
  is_truncated: false
})

/** Le document regarde, reduit a ce que l adaptateur lui demande : ses noeuds par identifiant. */
const ble = { id: 'n_ble', name: 'Ble' }
const mais = { id: 'n_mais', name: 'Mais' }
const source: Type_SunburstPartsSource = { nodes_dict: { n_ble: ble, n_mais: mais } }

describe('os#1445 ce quun secteur de couronne designe', () => {

  it('un secteur ordinaire designe le NOEUD du document, et le noeud lui-meme', () => {
    // Le noeud LUI-MEME et non une copie de son nom : c est ce qui fait qu un renommage sur le
    // diagramme change ce que la couronne affiche, tant que la part ne porte pas d alias.
    const subject = sunburstPartSubject(source, sector('n_ble', 6))

    expect(subject.kind).toBe('node')
    expect(subject.kind === 'node' && subject.node).toBe(ble)
  })

  it('le secteur residuel ne designe RIEN', () => {
    // Il n est pas un noeud du modele : le renommer ne doit rien renommer en amont.
    expect(sunburstPartSubject(source, sector('n_ble__residual__', 2)).kind).toBe('none')
    // Et le drapeau de l arbre suffit, meme sans le suffixe — un secteur replie par le trace
    // (« Autres ») le porte ainsi.
    expect(sunburstPartSubject(source, sector('__others__n_ble', 1, [], { is_residual: true })).kind)
      .toBe('none')
  })

  it('un identifiant introuvable ne designe rien, et aucune reference nest inventee', () => {
    const subject = sunburstPartSubject(source, sector('n_disparu', 4))

    expect(subject.kind).toBe('none')
    expect(subject).not.toHaveProperty('node')
  })
})

describe('os#1445 larbre de la couronne devient des parts', () => {

  it('lordre des secteurs est conserve : chaque secteur puis ses enfants', () => {
    // C est l ordre du trace (`partitionSunburst` descend l arbre de la meme facon), donc celui
    // sous lequel « le troisieme secteur » veut dire quelque chose.
    const tree = treeOf([
      sector('n_ble', 10, [sector('n_mais', 6), sector('n_ble__residual__', 4)]),
      sector('n_disparu', 5)
    ])

    const parts = sunburstPartInputs(source, tree)

    expect(parts.map(p => p.id)).toEqual(['n_ble', 'n_mais', 'n_ble__residual__', 'n_disparu'])
    expect(parts.map(p => p.subject?.kind)).toEqual(['node', 'node', 'none', 'none'])
  })

  it('le libelle, la valeur et la couleur du modele suivent le secteur', () => {
    const tree = treeOf([sector('n_ble', 10, [], { label: 'Ble tendre', color: '#123456' })])

    const [part] = sunburstPartInputs(source, tree)

    expect(part.label).toBe('Ble tendre')
    expect(part.value).toBe(10)
    expect(part.color).toBe('#123456')
  })

  it('un secteur sans couleur imposee nen porte aucune : la palette de la figure commande', () => {
    const [part] = sunburstPartInputs(source, treeOf([sector('n_ble', 10)]))

    expect(part.color).toBeUndefined()
  })
})

describe('os#1445 une couronne enregistree avant ce lot ne change pas daspect', () => {

  const buildSource = () => {
    const doc = new Class_ApplicationData(false)
    doc.drawing_area.bypass_redraws = true
    return doc
  }

  it('une part fraiche ne dit RIEN, et la mise en forme de la figure tient telle quelle', () => {
    // LE POINT CRITIQUE DU LOT. Une part est un element : ses valeurs d usine sont celles d un
    // element, pas celles de la couronne. Si le trace lisait son aspect sans reserve, toutes les
    // couronnes du parc passeraient en quatorze points, lisere noir. La part n est donc ecoutee
    // que sur ce qu elle porte EN PROPRE.
    const figure = buildParts(buildSource(), [{ id: 'n_ble', label: 'Ble', value: 6 }])
    const part = figure.by_id['n_ble']

    // os#1448 — CE QUE LA PART RESOUT A CHANGE, CE QU ELLE DIT NON. Depuis que les parts ont leur
    // style, une part fraiche resout l aspect d usine d une FIGURE et non celui d un noeud : dix
    // points, opacite 1. C est ce que l inspecteur montre, et c est ce que la couronne dessine.
    expect(part.name_label_font_size).toBe(SUNBURST_STYLE_DEFAULTS.font_size)
    expect(part.shape_opacity).toBe(SUNBURST_STYLE_DEFAULTS.opacity)

    // Et la garantie du lot est intacte : une amorce est MUETTE, donc la mise en forme de la
    // figure tient telle quelle — au pixel, et quel que soit ce que l auteur y avait regle.
    expect(sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, part)).toEqual(SUNBURST_STYLE_DEFAULTS)
  })

  it('une part qui porte un reglage le fait valoir, et elle seule', () => {
    // L objet meme du lot : l aspect d UN secteur peut differer de celui des autres.
    const figure = buildParts(buildSource(), [
      { id: 'n_ble', label: 'Ble', value: 6 },
      { id: 'n_mais', label: 'Mais', value: 4 }
    ])
    figure.by_id['n_ble'].name_label_font_size = 22
    figure.by_id['n_ble'].shape_opacity = 0.5

    const reglee = sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, figure.by_id['n_ble'])
    const voisine = sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, figure.by_id['n_mais'])

    expect(reglee.font_size).toBe(22)
    expect(reglee.opacity).toBe(0.5)
    // La voisine n a rien demande : elle garde la mise en forme de la figure.
    expect(voisine).toEqual(SUNBURST_STYLE_DEFAULTS)
  })
})
