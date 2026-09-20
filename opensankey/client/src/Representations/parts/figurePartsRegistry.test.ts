// os#1445 (etape 3) — QUI GARDE LES PARTS ENTRE DEUX DESSINS.
//
// L etape 2 s est arretee juste avant ce fichier, et pour une bonne raison : `buildParts` fabrique
// un document par appel. Un trace qui l appellerait a chaque redessin fuirait un document a chaque
// geste — et perdrait, a chaque geste aussi, le reglage que l auteur venait de poser sur un
// secteur. Or un redessin est provoque par le geste SUIVANT, pas par celui-la : sans cette
// memoire, regler un secteur puis en regler un autre effacerait le premier.
//
// Meme patron que la memoire de point de vue (`rememberFigureView`) : un depot par (fenetre,
// vignette), qui survit au remontage et jamais a la session.

import { Class_ApplicationData } from '../../types/ApplicationData'
import type { Type_PartInput } from './buildParts'
import { figurePartsFor, figurePartsOf, forgetFigureParts, resetFigureParts } from './figurePartsRegistry'
import { MAIN_ZONE_CANVAS_ID } from '../../types/MenuConfig'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const buildSource = () => {
  const doc = new Class_ApplicationData(false)
  doc.drawing_area.bypass_redraws = true
  return doc
}

const inputs = (): Type_PartInput[] => [
  { id: 'a', label: 'A', value: 3 },
  { id: 'b', label: 'B', value: 7 }
]

afterEach(() => resetFigureParts())

describe('os#1445 le depot des parts par vignette', () => {

  it('un reglage pose sur un secteur SURVIT au redessin', () => {
    // LE CAS QUI COMMANDE TOUT LE FICHIER.
    const source = buildSource()
    const premier = figurePartsFor('w1', 'p1', source, inputs())
    premier.by_id['a'].shape_color = '#123456'
    premier.by_id['a'].alias = 'Alpha'

    const second = figurePartsFor('w1', 'p1', source, inputs())

    expect(second).not.toBe(premier)
    expect(second.by_id['a'].shape_color).toBe('#123456')
    expect(second.by_id['a'].name_label_effective).toBe('Alpha')
    // Ce qui n avait pas ete touche ne devient pas surcharge au passage.
    expect(second.by_id['b'].isAttributeOverloaded('shape_color')).toBe(false)
  })

  it('le document precedent cesse de vivre : aucune fuite', () => {
    const source = buildSource()
    const premier = figurePartsFor('w1', 'p1', source, inputs())

    figurePartsFor('w1', 'p1', source, inputs())

    expect(premier.document.disposed).toBe(true)
  })

  it('deux vignettes ont deux jeux de parts, et ne se les empruntent pas', () => {
    // Une fenetre porte N vignettes, une figure par objet regarde : c est la raison de la cle a
    // deux termes.
    const source = buildSource()
    const une = figurePartsFor('w1', 'p1', source, inputs())
    const autre = figurePartsFor('w1', 'p2', source, inputs())

    une.by_id['a'].shape_color = '#123456'

    expect(autre.by_id['a'].shape_color).not.toBe('#123456')
    expect(figurePartsOf('w1', 'p1')).toBe(une)
    expect(figurePartsOf('w1', 'p2')).toBe(autre)
  })

  it('fermer la vignette libere son document', () => {
    const source = buildSource()
    const parts = figurePartsFor('w1', 'p1', source, inputs())

    forgetFigureParts('w1', 'p1')

    expect(parts.document.disposed).toBe(true)
    expect(figurePartsOf('w1', 'p1')).toBeNull()
  })

  it('une vignette dont la FENETRE a ete fermee est ecartee toute seule', () => {
    // Fermer une fenetre passe par six endroits d interface, et il en existera un septieme : y
    // poser six appels de liberation, c est se garantir d en oublier un — et un oubli se voit
    // comme une fuite lente. Le depot ecarte donc lui-meme ce qui designe une fenetre que la
    // grande zone ne porte plus.
    const source = buildSource()
    const mc = source.menu_configuration
    // Un sujet qui ouvre une VRAIE seconde fenetre : « diagramme, feuille courante » designe le
    // canevas lui-meme, que la grande zone refuse de fermer quand il est seul.
    const window_id = mc.openMainZoneWindow({ kind: 'selection' }, MAIN_ZONE_CANVAS_ID)
    expect(window_id).not.toBe(MAIN_ZONE_CANVAS_ID)
    const parts = figurePartsFor(window_id, 'p1', source, inputs())
    expect(figurePartsOf(window_id, 'p1')).toBe(parts)

    mc.hideMainZoneOccupant(window_id)
    // Le geste suivant sur une AUTRE vignette suffit : rien a se rappeler d appeler.
    figurePartsFor('w_autre', 'p1', source, inputs())

    expect(parts.document.disposed).toBe(true)
    expect(figurePartsOf(window_id, 'p1')).toBeNull()
  })

  it('hors fenetre, le jeu est JETABLE et le depot nen garde rien', () => {
    // La pop-up de presentation, une vignette d apercu : il n y a personne a qui attribuer une
    // memoire. L appelant libere a son demontage — c est la meme regle que pour une etiquette
    // deposee, qui reste a l ecran dans ce cas.
    const source = buildSource()
    const jetable = figurePartsFor(undefined, undefined, source, inputs())

    expect(jetable.by_id['a']).toBeDefined()
    expect(figurePartsOf(undefined, undefined)).toBeNull()
    expect(jetable.document.disposed).toBe(false)
  })
})
