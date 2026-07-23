import { NodePositioningAutoSankey } from './NodePositioningAutoSankey'
import { PAPER_DIMENSIONS_MM } from '../Elements/ElementsAttributesConfig'
import type { NodePositioning } from './NodePositioning'

// opensankey#1252 — La page de REFERENCE sur laquelle l'auto-layout repartit colonnes et lignes
// ne depend ni du contenu (sinon le placement dependrait du placement precedent) ni des
// millimetres du format (A3/A4/A5 partagent le ratio 1:V2). Seule l'orientation la change.

type PaperFormat = keyof typeof PAPER_DIMENSIONS_MM
type Orientation = 'landscape' | 'portrait'

/** Cible de placement, lue via l'accesseur prive (le comportement est le contrat, pas l'API). */
function paperTargetFor(format: PaperFormat, orientation: Orientation, margin_mm = 0) {
  const base = PAPER_DIMENSIONS_MM[format]
  const long = Math.max(base.width, base.height)
  const short = Math.min(base.width, base.height)

  const drawingArea = {
    getPaperDimensionsMm: () => orientation === 'landscape'
      ? { width: long, height: short }
      : { width: short, height: long },
    margin_left_mm: margin_mm,
    margin_right_mm: margin_mm,
    margin_top_mm: margin_mm,
    margin_bottom_mm: margin_mm
  }

  const auto = new NodePositioningAutoSankey({ drawingArea } as unknown as NodePositioning)
  return (auto as unknown as {
    paperLayoutTarget: () => { width: number, height: number, pad_left: number, pad_top: number }
  }).paperLayoutTarget()
}

describe('#1252 page de reference de l\'auto-layout', () => {
  it('donne la meme cible pour A3, A4 et A5 (meme ratio)', () => {
    // Les mm ISO sont ARRONDIS : A4 = 210x297 -> 1.41429, A3 = 297x420 -> 1.41414,
    // A5 = 148x210 -> 1.41892. Les cibles coincident donc a l'arrondi pres (< 0.5 %),
    // pas au pixel. C'est la doctrine « A3/A4/A5 identiques a l'ecran ».
    const a4 = paperTargetFor('A4', 'landscape')
    const relative = (a: number, b: number) => Math.abs(a - b) / b

    for (const format of ['A3', 'A5'] as const) {
      const target = paperTargetFor(format, 'landscape')
      expect(relative(target.width, a4.width)).toBeLessThan(0.005)
      expect(relative(target.height, a4.height)).toBeLessThan(0.005)
    }
  })

  it('respecte le ratio du format', () => {
    const landscape = paperTargetFor('A4', 'landscape')
    const base = PAPER_DIMENSIONS_MM.A4
    const expected = Math.max(base.width, base.height) / Math.min(base.width, base.height)
    expect(landscape.width / landscape.height).toBeCloseTo(expected, 6)
  })

  it('echange largeur et hauteur entre paysage et portrait', () => {
    const landscape = paperTargetFor('A4', 'landscape')
    const portrait = paperTargetFor('A4', 'portrait')
    expect(portrait.width).toBeCloseTo(landscape.height, 6)
    expect(portrait.height).toBeCloseTo(landscape.width, 6)
  })

  it('conserve la surface de reference A4 quelle que soit l\'orientation', () => {
    const landscape = paperTargetFor('A4', 'landscape')
    const portrait = paperTargetFor('A4', 'portrait')
    expect(landscape.width * landscape.height).toBeCloseTo(portrait.width * portrait.height, 3)
  })

  it('ne depend pas du contenu : deux appels identiques donnent la meme cible', () => {
    // Garde-fou d'idempotence : la cible ne lit jamais drawing_area.width/height.
    expect(paperTargetFor('A4', 'landscape')).toEqual(paperTargetFor('A4', 'landscape'))
  })

  it('convertit les marges mm en px', () => {
    const zero = paperTargetFor('A4', 'landscape', 0)
    const margined = paperTargetFor('A4', 'landscape', 10)
    expect(zero.pad_left).toBe(0)
    expect(margined.pad_left).toBeGreaterThan(0)
    expect(margined.pad_left).toBeCloseTo(margined.pad_top, 6)
    // La cible elle-meme est inchangee : les marges se prelevent dessus.
    expect(margined.width).toBeCloseTo(zero.width, 6)
  })
})
