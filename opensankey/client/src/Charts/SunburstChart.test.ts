import {
  foldNarrowChildren, partitionSunburst, sunburstArcLabel, sunburstPartStyle, sunburstScope,
  sunburstSectorName, SUNBURST_STYLE_DEFAULTS
} from './SunburstChart'
import type { Type_SunburstPart, Type_SunburstStyle } from './SunburstChart'
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

describe('partitionSunburst, couleur et texture par axe (os#1509)', () => {
  const branch = (id: string, color: string | null = null) => ({ id, label: id, color })
  // Racine (P, Monde) ; premier anneau par les pays : Europe, Asie ; second par les produits : A, B.
  const cell = (id: string, value: number, branches: { self?: { id: string, label: string, color: string | null }, other?: { id: string, label: string, color: string | null } }, children: ReturnType<typeof node>[] = [], depth = 0) =>
    ({ ...node(id, value, children, depth), axis_branches: branches })
  const tree = () => cell('root', 100, {}, [
    cell('eu', 70, { other: branch('Europe', '#00ff00') }, [
      cell('eu_a', 45, { other: branch('Europe', '#00ff00'), self: branch('A', '#ff0000') }, [], 2),
      cell('eu_b', 25, { other: branch('Europe', '#00ff00'), self: branch('B') }, [], 2)
    ], 1),
    cell('as', 30, { other: branch('Asie') }, [
      cell('as_a', 15, { other: branch('Asie'), self: branch('A', '#ff0000') }, [], 2),
      cell('as_b', 15, { other: branch('Asie'), self: branch('B') }, [], 2)
    ], 1)
  ])
  const palette = (i: number) => ['#111111', '#222222', '#333333'][i]

  it('la couleur suit l axe demande, une teinte par branche de cet axe', () => {
    const slices = partitionSunburst([tree()], palette, 'autres', 'light', '', {
      color_source: 'palette', depth_shading: false, others_threshold: 0, color_axis: 'self'
    })
    const by = (id: string) => slices.find(s => s.id === id)!
    // A en Europe et A en Asie ont la MEME teinte : c est ce que « colorer par le sujet » promet.
    expect(by('eu_a').color).toBe(by('as_a').color)
    expect(by('eu_b').color).toBe(by('as_b').color)
    expect(by('eu_a').color).not.toBe(by('eu_b').color)
    // Un secteur sans branche sur cet axe garde la teinte de sa branche de premier anneau.
    expect(by('eu').color).toBe('#111111')
  })

  it('sous « couleur du diagramme », la branche coloree prete la sienne', () => {
    const slices = partitionSunburst([tree()], palette, 'autres', 'light', '', {
      color_source: 'model', depth_shading: false, others_threshold: 0, color_axis: 'self'
    })
    expect(slices.find(s => s.id === 'as_a')!.color).toBe('#ff0000')
  })

  it('la texture suit l autre axe, un motif par branche, et se nomme', () => {
    const slices = partitionSunburst([tree()], palette, 'autres', 'light', '', {
      color_source: 'palette', depth_shading: false, others_threshold: 0, color_axis: 'self', texture_axis: 'other'
    })
    const by = (id: string) => slices.find(s => s.id === id)!
    expect(by('root').texture).toBeNull()
    expect(by('eu').texture).toBe(0)
    expect(by('eu_a').texture).toBe(0)
    expect(by('as').texture).toBe(1)
    expect(by('as_b').texture).toBe(1)
    expect(by('as').texture_label).toBe('Asie')
  })

  it('sans reglage, rien ne change : pas de texture, teinte de branche', () => {
    const slices = partitionSunburst([tree()], palette, 'autres')
    expect(slices.every(s => s.texture === null)).toBe(true)
    // Une seule racine, une seule branche : meme teinte a meme profondeur, comme depuis toujours.
    expect(slices.find(s => s.id === 'as_b')!.color).toBe(slices.find(s => s.id === 'eu_b')!.color)
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

  it('revient a la ligne entre les mots quand la boite est plus etroite que l anneau', () => {
    // 90 px d anneau mais une boite de 60 px : huit caracteres par ligne, et l arc de 120 px
    // tient plusieurs lignes de 10 px.
    expect(sunburstArcLabel('Cereales Bio', 120, 90, { box_px: 60 })).toBe('Cereales\nBio')
  })

  it('tronque plutot que de couper un mot, meme avec une boite', () => {
    const text = sunburstArcLabel('Conventionnel Bio', 200, 40, { box_px: 150 })
    expect(text!.endsWith('…')).toBe(true)
    expect(text!.includes('\n')).toBe(false)
  })

  it('tronque quand l arc ne tient pas les lignes', () => {
    // 20 px d arc : deux lignes de 11,5 px n y tiennent pas.
    const text = sunburstArcLabel('Cereales Bio', 20, 90, { box_px: 60 })
    expect(text!.endsWith('…')).toBe(true)
  })
})

describe('sunburstSectorName', () => {

  it('ote le nom du parent en tete, liaison comprise', () => {
    expect(sunburstSectorName('Maïs Bio', 'Maïs', { strip_parent: true })).toBe('Bio')
    expect(sunburstSectorName('Maïs - Bio', 'maïs', { strip_parent: true })).toBe('Bio')
  })

  it('ote le nom du parent en queue', () => {
    expect(sunburstSectorName('Bio Maïs', 'Maïs', { strip_parent: true })).toBe('Bio')
  })

  it('ne laisse jamais un nom vide, et ne touche a rien sans parent', () => {
    expect(sunburstSectorName('Maïs', 'Maïs', { strip_parent: true })).toBe('Maïs')
    expect(sunburstSectorName('Maïs Bio', null, { strip_parent: true })).toBe('Maïs Bio')
    expect(sunburstSectorName('Maïs Bio', 'Maïs')).toBe('Maïs Bio')
  })

  it('coupe au separateur comme un noeud du diagramme', () => {
    expect(sunburstSectorName('Maïs Bio', null, { separator: ' ' })).toBe('Bio')
    expect(sunburstSectorName('Maïs Bio', null, { separator: ' ', separator_part: 'before' })).toBe('Maïs')
    expect(sunburstSectorName('Maïs Bio', null, { separator: '/' })).toBe('Maïs Bio')
  })
})

describe('sunburstPartStyle', () => {

  // Une part, reduite a ce que le trace lui demande : dire ce qu elle porte EN PROPRE, et le
  // rendre. Ce qui n est pas dans `dit` n est pas dit — c est exactement l etat d une part fraiche.
  const part = (dit: { [attr: string]: unknown }): Type_SunburstPart => ({
    isAttributeOverloaded: (attr: string) => dit[attr] !== undefined,
    getElementProperty: (attr: string) => dit[attr]
  })

  it('sans part, le repli est rendu tel quel', () => {
    // LE REPLI. Tant que l appelant ne fournit pas de parts, le trace est celui d avant ce lot.
    expect(sunburstPartStyle(SUNBURST_STYLE_DEFAULTS)).toBe(SUNBURST_STYLE_DEFAULTS)
  })

  it('une part qui ne dit rien laisse la mise en forme de la figure intacte', () => {
    // La garantie du lot : une couronne enregistree avant se rouvre a l identique. Y compris sous
    // une mise en forme reglee par l auteur, et pas seulement sous les defauts.
    const reglee: Type_SunburstStyle = {
      ...SUNBURST_STYLE_DEFAULTS, font_size: 13, labels_mode: 'always', color_mode: 'fixed',
      border_color: '#000000', label_percent: 'parent'
    }

    expect(sunburstPartStyle(reglee, part({}))).toEqual(reglee)
  })

  it('laspect dUN secteur peut differer de celui des autres', () => {
    // C est tout l objet du lot : la forme, le libelle et la valeur sont des reglages d element.
    const seule = sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, part({
      shape_opacity: 0.4,
      shape_border_color: '#ff0000',
      name_label_font_size: 22,
      value_label_is_visible: true
    }))

    expect(seule.opacity).toBe(0.4)
    expect(seule.border_color).toBe('#ff0000')
    expect(seule.font_size).toBe(22)
    expect(seule.value_visible).toBe(true)
    // Et rien d autre n a bouge : le voisinage de la figure tient.
    expect(seule.legend_visible).toBe(SUNBURST_STYLE_DEFAULTS.legend_visible)
    expect(seule.centre_hole).toBe(SUNBURST_STYLE_DEFAULTS.centre_hole)
  })

  it('une part muette sur les etiquettes garde le mode de la figure', () => {
    // « La ou ca tient / toujours / jamais » se dit avec DEUX cles d element : on decompose, on
    // remplace ce que la part dit, on recompose. Sans quoi une part muette ramenerait « toujours »
    // a « la ou ca tient ».
    const toujours: Type_SunburstStyle = { ...SUNBURST_STYLE_DEFAULTS, labels_mode: 'always' }

    expect(sunburstPartStyle(toujours, part({})).labels_mode).toBe('always')
    expect(sunburstPartStyle(toujours, part({ name_label_is_visible: false })).labels_mode).toBe('none')
    expect(sunburstPartStyle(toujours, part({ name_label_prune_if_unfitting: true })).labels_mode).toBe('fit')
  })

  it('une valeur dun type inattendu est ignoree plutot que de casser le dessin', () => {
    // Un reglage persiste par une version ulterieure ne doit pas faire disparaitre un secteur.
    const bancale = sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, part({
      shape_opacity: 'beaucoup', name_label_orientation: 'en biais'
    }))

    expect(bancale.opacity).toBe(SUNBURST_STYLE_DEFAULTS.opacity)
    expect(bancale.label_orientation).toBe(SUNBURST_STYLE_DEFAULTS.label_orientation)
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
