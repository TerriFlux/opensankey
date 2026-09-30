import * as d3 from '../d3Modules'
import {
  Type_PaletteNode, computeHierarchicalColors, default_hierarchical_palette_params, hierarchical_palette_neutral
} from './HierarchicalPalette'
import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'

// jest 27 / jsdom n expose pas structuredClone
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1516 — palette hierarchique (regle hybride retenue au banc)

const node = (id: string, children: Type_PaletteNode[] = []): Type_PaletteNode => ({ id, children })
const deltaE = (a: string, b: string) => {
  const x = d3.lab(a), y = d3.lab(b)
  return Math.hypot(x.l - y.l, x.a - y.a, x.b - y.b)
}
const hueGap = (a: string, b: string) => {
  const d = Math.abs(d3.hcl(a).h - d3.hcl(b).h) % 360
  return Math.min(d, 360 - d)
}

// Monde > 3 regions ; l Europe a douze pays, cas qui faisait tomber l arbre de teintes pur a dE 2
const PAYS_EUROPE = ['es', 'it', 'be', 'de', 'nl', 'pt', 'pl', 'ro', 'gr', 'ie', 'se', 'at']
const monde = () => [node('monde', [
  node('europe', PAYS_EUROPE.map(id => node(id))),
  node('afrique', [node('ma'), node('dz'), node('tn'), node('eg')]),
  node('oceanie'),
])]

describe('os#1516 — calcul de la palette hierarchique', () => {
  test('une racine unique reste neutre', () => {
    const colors = computeHierarchicalColors(monde())
    expect(colors['monde']).toBe(hierarchical_palette_neutral)
  })

  test('chaque membre recoit une couleur', () => {
    const colors = computeHierarchicalColors(monde())
    const ids = ['monde', 'europe', 'afrique', 'oceanie', ...PAYS_EUROPE, 'ma', 'dz', 'tn', 'eg']
    ids.forEach(id => expect(colors[id]).toMatch(/^#[0-9a-f]{6}$/))
  })

  test('douze freres restent distincts grace a la grille teinte luminance', () => {
    const colors = computeHierarchicalColors(monde())
    let min = Infinity
    PAYS_EUROPE.forEach((a, i) => PAYS_EUROPE.slice(i + 1).forEach(b => { min = Math.min(min, deltaE(colors[a], colors[b])) }))
    // Au banc : 8,9 pour l hybride, 2,5 pour l arbre de teintes pur
    expect(min).toBeGreaterThan(7)
  })

  test('un enfant reste dans la famille de teinte de son parent', () => {
    const colors = computeHierarchicalColors(monde())
    ;['ma', 'dz', 'tn', 'eg'].forEach(id => {
      expect(hueGap(colors[id], colors['afrique'])).toBeLessThan(hueGap(colors[id], colors['europe']))
    })
  })

  test('une couleur verrouillee est gardee et ses descendants en derivent', () => {
    const lock = '#1f77b4'
    const colors = computeHierarchicalColors(monde(), default_hierarchical_palette_params, { afrique: lock })
    expect(colors['afrique']).toBe(lock)
    ;['ma', 'dz', 'tn', 'eg'].forEach(id => expect(hueGap(colors[id], lock)).toBeLessThan(40))
  })
})

function dimensionDemo() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const dim = sankey.addDataTagGroup('pays', 'Pays', false) as unknown as Class_DataTagGroup
  ;['monde', 'europe', 'afrique', 'espagne', 'italie', 'maroc'].forEach(id => dim.addTag(id, id))
  const member = (id: string) => dim.tags_dict[id] as Class_DataTag
  member('europe').parent = member('monde')
  member('afrique').parent = member('monde')
  member('espagne').parent = member('europe')
  member('italie').parent = member('europe')
  member('maroc').parent = member('afrique')
  dim.levels = ['monde', 'regions', 'pays']
  return { app, sankey, dim, member }
}

describe('os#1516 — la dimension garde sa recette', () => {
  test('sans palette appliquee les couleurs ne bougent pas', () => {
    const { dim, member } = dimensionDemo()
    member('maroc').color = '#123456'
    member('maroc').parent = member('europe')
    expect(member('maroc').color).toBe('#123456')
    expect(dim.palette).toBeUndefined()
  })

  test('un membre ajoute apres coup prend la couleur de sa famille', () => {
    const { dim, member } = dimensionDemo()
    dim.applyHierarchicalPalette()
    const egypte = dim.addTag('egypte', 'egypte') as Class_DataTag
    egypte.parent = member('afrique')
    expect(hueGap(egypte.color, member('afrique').color)).toBeLessThan(hueGap(egypte.color, member('europe').color))
  })

  test('une palette figee ne suit plus la structure', () => {
    const { dim, member } = dimensionDemo()
    dim.applyHierarchicalPalette()
    dim.palette_frozen = true
    const before = member('maroc').color
    member('maroc').parent = member('europe')
    expect(member('maroc').color).toBe(before)
  })

  test('une couleur choisie a la main est verrouillee et survit au recalcul', () => {
    const { dim, member } = dimensionDemo()
    dim.applyHierarchicalPalette()
    dim.setMemberColor(member('espagne'), '#ff0000')
    expect(dim.isMemberColorLocked(member('espagne'))).toBe(true)
    dim.addTag('portugal', 'portugal')
    expect(member('espagne').color).toBe('#ff0000')
    dim.unlockMemberColor(member('espagne'))
    expect(member('espagne').color).not.toBe('#ff0000')
  })

  test('la recette et les couleurs traversent un enregistrement sans recalcul', () => {
    const { dim, member } = dimensionDemo()
    dim.applyHierarchicalPalette()
    dim.setMemberColor(member('maroc'), '#00aa00')
    const json = dim.toJSON()
    expect(json['palette']).toBeDefined()
    // Une couleur retouchee dans le fichier ne doit pas etre ecrasee a l ouverture
    const tags = json['tags'] as { [id: string]: { [k: string]: unknown } }
    tags['italie']['color'] = '#abcdef'
    const { dim: reloaded } = dimensionDemo()
    reloaded.fromJSON(json)
    expect((reloaded.tags_dict['italie'] as Class_DataTag).color).toBe('#abcdef')
    expect(reloaded.palette?.locks['maroc']).toBe('#00aa00')
  })
})
