import {
  foldNarrowChildren, partitionSunburst, sunburstArcLabel, sunburstScope
} from './SunburstChart'
import type { Type_SunburstNode } from './SunburstHierarchy'

const node = (
  id: string,
  value: number,
  children: Type_SunburstNode[] = [],
  depth = 0,
  dimension_id = 'dim'
): Type_SunburstNode => ({
  id, label: id, value, declared: value, color: null, depth, children, dimension_id
})

const BLUE = () => '#2a78d6'
const TWO_PI = 2 * Math.PI

describe('partitionSunburst', () => {

  it('donne au premier anneau la totalite du cercle', () => {
    const slices = partitionSunburst([node('a', 3), node('b', 1)], BLUE, 'autres')
    const roots = slices.filter(s => s.depth === 0)
    expect(roots).toHaveLength(2)
    expect(roots[0].a1 - roots[0].a0).toBeCloseTo(TWO_PI * 0.75)
    expect(roots[1].a1 - roots[1].a0).toBeCloseTo(TWO_PI * 0.25)
    expect(roots[1].a1).toBeCloseTo(TWO_PI)
  })

  it('partage exactement l angle du parent entre ses enfants', () => {
    const tree = node('p', 10, [node('c1', 6, [], 1), node('c2', 4, [], 1)])
    const slices = partitionSunburst([tree], BLUE, 'autres')
    const parent = slices.find(s => s.id === 'p')!
    const kids = slices.filter(s => s.depth === 1)
    const covered = kids.reduce((acc, k) => acc + (k.a1 - k.a0), 0)
    expect(covered).toBeCloseTo(parent.a1 - parent.a0)
    expect(kids[0].a0).toBeCloseTo(parent.a0)
    expect(kids[kids.length - 1].a1).toBeCloseTo(parent.a1)
  })

  it('remplit l angle du parent meme quand les enfants ne bouclent pas avec lui', () => {
    // Un parent qui declare 10 alors que ses enfants somment 4 : la geometrie reste
    // vraie (les secteurs se partagent l angle du parent), c est la mention qui dit l ecart.
    const tree = node('p', 10, [node('c1', 3, [], 1), node('c2', 1, [], 1)])
    const slices = partitionSunburst([tree], BLUE, 'autres')
    const parent = slices.find(s => s.id === 'p')!
    const covered = slices.filter(s => s.depth === 1).reduce((acc, k) => acc + (k.a1 - k.a0), 0)
    expect(covered).toBeCloseTo(parent.a1 - parent.a0)
  })

  it('porte sur chaque secteur l axe qui le commande', () => {
    // Axes enchaines : l anneau exterieur ne parle plus du meme axe que l interieur,
    // et c est ce que le clic doit agreger.
    const tree = node('Cereales', 10, [
      node('Cereales Bio', 10, [node('Ble Bio', 10, [], 2, 'especes')], 1, 'especes')
    ], 0, 'mode')
    const slices = partitionSunburst([tree], BLUE, 'autres')
    expect(slices.find(s => s.id === 'Cereales')!.dimension_id).toBe('mode')
    expect(slices.find(s => s.id === 'Ble Bio')!.dimension_id).toBe('especes')
  })

  it('porte le fil d Ariane du centre jusqu au secteur', () => {
    const tree = node('p', 10, [node('c', 10, [node('g', 10, [], 2)], 1)])
    const slices = partitionSunburst([tree], BLUE, 'autres')
    expect(slices.find(s => s.id === 'g')!.path).toEqual(['p', 'c', 'g'])
  })

  it('ne rend rien quand tout est nul', () => {
    expect(partitionSunburst([node('a', 0)], BLUE, 'autres')).toEqual([])
  })
})

describe('sunburstScope', () => {

  it('met le noeud unique au centre et ouvre la couronne sur ses enfants', () => {
    // Le centre nomme deja le perimetre et porte sa valeur : lui donner en plus le
    // premier anneau redirait la meme chose sur un tour complet.
    const tree = node('Cereales', 130, [node('Bio', 30, [], 1), node('Conventionnel', 100, [], 1)])
    const { centre, branches } = sunburstScope([tree], null, 'autres')
    expect(centre?.id).toBe('Cereales')
    expect(branches.map(b => b.id)).toEqual(['Bio', 'Conventionnel'])
  })

  it('garde les racines sur le premier anneau quand il y en a plusieurs', () => {
    // La ils ne se resument a aucun noeud : le centre en est une somme, chacune a
    // besoin de son arc pour se nommer.
    const roots = [node('a', 3), node('b', 1)]
    const { centre, branches } = sunburstScope(roots, null, 'autres')
    expect(centre).toBeNull()
    expect(branches.map(b => b.id)).toEqual(['a', 'b'])
  })

  it('prend le secteur zoome comme centre, quel que soit le nombre de racines', () => {
    const focused = node('b', 4, [node('b1', 4, [], 2)], 1)
    const roots = [node('a', 3), node('parent', 4, [focused])]
    expect(sunburstScope(roots, focused, 'autres')).toEqual({
      centre: focused,
      branches: [focused.children[0]]
    })
  })

  it('ne rend aucune branche pour une feuille : il n y a rien a decomposer', () => {
    const leaf = node('feuille', 12)
    expect(sunburstScope([leaf], null, 'autres').branches).toEqual([])
  })
})

describe('sunburstArcLabel', () => {

  it('ecrit le nom en entier quand l anneau est assez epais', () => {
    // 90 px d anneau laissent treize caracteres : l etiquette court RADIALEMENT, c est
    // l epaisseur de l anneau qui borne la longueur du texte.
    expect(sunburstArcLabel('Cereales Bio', 120, 90)).toBe('Cereales Bio')
  })

  it('ne rend rien quand l arc est trop court pour la hauteur des glyphes', () => {
    expect(sunburstArcLabel('Cereales Bio', 8, 60)).toBeNull()
  })

  it('ne rend rien quand l anneau est trop mince', () => {
    expect(sunburstArcLabel('Cereales Bio', 200, 12)).toBeNull()
  })

  it('tronque quand le nom depasse l epaisseur de l anneau', () => {
    // Un nom tronque ne nomme pas : c est la legende qui le dira en entier.
    const text = sunburstArcLabel('Cereales Conventionnel', 200, 40)
    expect(text).not.toBeNull()
    expect(text).not.toBe('Cereales Conventionnel')
    expect(text!.endsWith('…')).toBe(true)
  })
})

describe('foldNarrowChildren', () => {

  it('laisse la fratrie intacte quand chaque part est visible', () => {
    const children = [node('c1', 1, [], 1), node('c2', 1, [], 1)]
    expect(foldNarrowChildren(children, TWO_PI, 'autres')).toHaveLength(2)
  })

  it('replie les parts invisibles dans un unique secteur, sans perdre de valeur', () => {
    // 300 parts egales sur un tour complet : chacune fait 0,021 rad, au-dessus du seuil.
    // Sous un angle parent dix fois plus petit, elles passent toutes en dessous.
    const children = Array.from({ length: 300 }, (_, i) => node('c' + i, 1, [], 1))
    const folded = foldNarrowChildren(children, TWO_PI / 10, 'autres')
    expect(folded).toHaveLength(1)
    expect(folded[0].label).toBe('autres')
    expect(folded[0].value).toBe(300)
  })

  it('ne replie que ce qui est trop etroit', () => {
    const children = [node('gros', 1000, [], 1), ...Array.from({ length: 50 }, (_, i) => node('c' + i, 1, [], 1))]
    const folded = foldNarrowChildren(children, TWO_PI, 'autres')
    expect(folded.map(c => c.id)).toContain('gros')
    expect(folded[folded.length - 1].label).toBe('autres')
    expect(folded[folded.length - 1].value).toBe(50)
  })
})
