import { Class_ApplicationData } from './ApplicationData'
import { MAIN_ZONE_CANVAS_ID } from './MenuConfig'
import { representation_registry } from '../Representations/RepresentationRegistry'
import type { Class_NodeElement } from '../Elements/Node'
import type { Type_JSON } from './Utils'

/**
 * os#1421 - UNE FIGURE QU ON POSE DOIT SURVIVRE A SA FENETRE.
 *
 * Une figure de vignette se nomme par (fenetre, cle) et meurt avec sa fenetre. Un placement sur un
 * noeud la CITE : il lui faut donc un nom de DOCUMENT (`f_N`, le registre) et une duree de vie qui
 * ne depende plus de la fenetre ou on l a reglee. Ce fichier verifie les quatre promesses : la
 * promotion est idempotente et ne recopie rien, un menage ne jette que ce qui n est pas promu, le
 * fichier n ecrit les reglages qu UNE fois (la vignette renvoie au registre), et un fichier ou
 * personne n a rien pose est exactement celui d avant.
 */

const NATURE = 'test.figure.placed'

const TEST_ENTRY = {
  id: NATURE,
  scale: 'element',
  order: 98,
  label: () => 'Placed',
  attributes: {
    value_mode: {
      default: 'percent',
      type: () => 'percent',
      category: 'figure',
      labels: {
        en: 'Value mode', fr: 'Mode de valeur', es: 'Modo de valor', de: 'Wertmodus',
        it: 'Modo di valore', 'zh-CN': '数值模式', ja: '値モード'
      },
      tooltips: {
        en: 'How values are shown', fr: 'Comment les valeurs sont montrees',
        es: 'Como se muestran los valores', de: 'Wie Werte angezeigt werden',
        it: 'Come sono mostrati i valori', 'zh-CN': '数值显示方式', ja: '値の表示方法'
      },
      sort: 'style'
    }
  },
  draw: () => undefined
}

/**
 * Deux fenetres : le canevas (la principale) et une fenetre d element a deux vignettes. Le canevas
 * est la pour que `hideMainZoneOccupant` accepte de fermer l autre - la grande zone refuse de se
 * vider completement.
 */
const twoWindows = (): Type_JSON => ({
  occupants: {
    [MAIN_ZONE_CANVAS_ID]: {
      place: 'main', size: 1, order: 0,
      representation: MAIN_ZONE_CANVAS_ID, subject: { kind: 'diagram' }
    },
    w_1: {
      place: 'right', size: 1, order: 1, representation: NATURE,
      subject: { kind: 'elements', ids: ['n1', 'n2'], keys: ['n1', 'n2'] }
    }
  }
})

/**
 * Un noeud reduit a ce qu un placement lui demande : un sac d attributs qu on ecrit directement,
 * une lecture d attribut, et un redessin. Pas d historique - le placement doit savoir s en passer.
 */
const fakeNode = () => {
  const attributes: { [key: string]: unknown } = {}
  const state = { draws: 0 }
  const node = {
    attributes,
    getElementProperty: (k: string) => attributes[k],
    draw: () => { state.draws += 1 }
  }
  return { node: node as unknown as Class_NodeElement, attributes, state }
}

const newConfig = () => {
  const mc = new Class_ApplicationData(false).menu_configuration
  mc.mainZoneStateFromJSON(twoWindows())
  return mc
}

describe('os#1421 registre des figures et placements', () => {

  beforeAll(() => {
    representation_registry.register(TEST_ENTRY as never)
  })

  afterAll(() => {
    representation_registry.unregister(NATURE)
  })

  // --- (a) la promotion ---------------------------------------------------------------------

  it('figureIdOf promeut UNE fois et rend la MEME instance que figureOf', () => {
    const mc = newConfig()
    const id = mc.figureIdOf('w_1', 'n1')

    expect(id).toBe('f_1')
    // Idempotent : demander le nom deux fois ne cree pas une seconde figure.
    expect(mc.figureIdOf('w_1', 'n1')).toBe('f_1')
    // Un LIEN, pas une copie : le registre et l annuaire portent le meme objet.
    expect(mc.figureById('f_1')).toBe(mc.figureOf('w_1', 'n1'))
    // La vignette voisine, elle, n est pas promue : elle prend le nom suivant, pas le meme.
    expect(mc.figureIdOf('w_1', 'n2')).toBe('f_2')
  })

  it('regler la vignette regle la figure du registre, sans recopie', () => {
    const mc = newConfig()
    const id = mc.figureIdOf('w_1', 'n1')
    mc.setMainZonePaneOptions('w_1', 'n1', { value_mode: 'value' })

    expect(mc.figureById(id)?.getElementProperty('value_mode')).toBe('value')
  })

  it('promoteStandaloneFigure cree une figure du document que personne ne montre', () => {
    // Le cas d une MIGRATION : le reglage vient d un noeud d un fichier d avant, aucune fenetre
    // n est ouverte a quoi le rattacher, et il faut pourtant une figure nommee a poser.
    const mc = newConfig()
    const id = mc.promoteStandaloneFigure(NATURE, { value_mode: 'value' })

    expect(id).toBe('f_1')
    expect(mc.figureById(id)?.getElementProperty('value_mode')).toBe('value')
    expect(mc.figuresToJSON()).toEqual({
      f_1: { id: 'f_1', nature: NATURE, attributes: { value_mode: 'value' } }
    })
    // Elle n est la vignette de personne : la fenetre garde la sienne.
    expect(mc.figureOf('w_1', 'n1')).not.toBe(mc.figureById(id))
    // Un seul compteur : la promotion suivante ne reprend pas un nom deja pris.
    expect(mc.figureIdOf('w_1', 'n1')).toBe('f_2')
  })

  it('placeFigureIdOnNode pose une figure deja nommee, sans rien promouvoir', () => {
    const mc = newConfig()
    const { node, attributes, state } = fakeNode()
    const id = mc.promoteStandaloneFigure(NATURE, {})

    mc.placeFigureIdOnNode(id, node)

    expect(attributes['figure_placements'])
      .toEqual([{ figure: id, host: 'node', frame: 'bounds' }])
    expect(mc.nodePlacedFigure(node)).toBe(mc.figureById(id))
    expect(state.draws).toBe(1)
  })

  it('en mode silencieux le placement n ecrit que l attribut', () => {
    // Ce que demande le CHARGEMENT : ni redessin par noeud (un dessin complet suit, ou aucun
    // n a encore eu lieu), ni pas d annulation (un Ctrl+Z apres ouverture defairait la migration).
    const mc = newConfig()
    const { node, attributes, state } = fakeNode()
    const id = mc.promoteStandaloneFigure(NATURE, {})

    mc.placeFigureIdOnNode(id, node, { silent: true })

    expect(attributes['figure_placements'])
      .toEqual([{ figure: id, host: 'node', frame: 'bounds' }])
    expect(state.draws).toBe(0)
  })

  // --- (b) la duree de vie ------------------------------------------------------------------

  it('fermer la fenetre ne detruit pas une figure promue', () => {
    const mc = newConfig()
    mc.figureIdOf('w_1', 'n1')
    mc.setMainZonePaneOptions('w_1', 'n1', { value_mode: 'value' })

    expect(mc.hideMainZoneOccupant('w_1')).toBe(true)

    expect(mc.figureById('f_1')?.getElementProperty('value_mode')).toBe('value')
    expect(mc.figuresToJSON()).toEqual({
      f_1: { id: 'f_1', nature: NATURE, attributes: { value_mode: 'value' } }
    })
  })

  it('retirer une vignette garde la figure PROMUE et jette la NON promue', () => {
    const mc = newConfig()
    mc.figureIdOf('w_1', 'n1')
    mc.setMainZonePaneOptions('w_1', 'n1', { value_mode: 'value' })
    mc.setMainZonePaneOptions('w_1', 'n2', { value_mode: 'normalized' })

    // Les deux objets s en vont de la fenetre, puis reviennent.
    mc.setMainZoneWindowSubject('w_1', { kind: 'elements', ids: [], keys: [] })
    mc.setMainZoneWindowSubject('w_1', { kind: 'elements', ids: ['n1', 'n2'], keys: ['n1', 'n2'] })

    // n1 etait posee quelque part : elle revient telle quelle.
    expect(mc.mainZonePaneOptionsOf('w_1', 'n1').value_mode).toBe('value')
    // n2 n etait qu une vignette : elle est repartie du style de sa nature.
    expect(mc.mainZonePaneOptionsOf('w_1', 'n2').value_mode).toBe('percent')
  })

  it('une figure que plus rien ne cite se solde, une figure posee resiste', () => {
    const mc = newConfig()
    const kept = mc.figureIdOf('w_1', 'n1')
    const lost = mc.figureIdOf('w_1', 'n2')
    mc.hideMainZoneOccupant('w_1')

    // L appelant sait les placements : ici, seul `kept` est pose quelque part.
    expect(mc.pruneUnreferencedFigures(new Set([kept]))).toEqual([lost])
    expect(mc.figureById(kept)).toBeDefined()
    expect(mc.figureById(lost)).toBeUndefined()
  })

  it('le balayage garde la figure POSEE dont la fenetre est fermee, et solde l autre', () => {
    const mc = newConfig()
    const { node } = fakeNode()
    const placed = mc.placeFigureOnNode('w_1', 'n1', node)
    const orphan = mc.figureIdOf('w_1', 'n2')
    // La fenetre s en va : les deux figures n ont plus de vignette VIVANTE.
    mc.hideMainZoneOccupant('w_1')

    expect(mc.pruneUnreferencedFigures(mc.placedFigureIds([node]))).toEqual([orphan])
    expect(mc.figureById(placed)).toBeDefined()
    expect(mc.nodePlacedFigure(node)).toBe(mc.figureById(placed))
    expect(mc.figureById(orphan)).toBeUndefined()
  })

  it('le balayage epargne une figure MONTREE par une fenetre vivante', () => {
    const mc = newConfig()
    const standalone = mc.promoteStandaloneFigure(NATURE, {})
    const vignette = mc.figureIdOf('w_1', 'n1')

    // Aucun placement nulle part : seule la vignette d une fenetre encore ouverte est epargnee.
    expect(mc.pruneUnreferencedFigures(new Set())).toEqual([standalone])
    expect(mc.figureById(vignette)).toBeDefined()
  })

  // --- (b bis) le balayage a l ENREGISTREMENT ------------------------------------------------

  it('enregistrer solde les figures promues que plus rien ne cite', () => {
    const app = new Class_ApplicationData(false)
    const mc = app.menu_configuration
    mc.mainZoneStateFromJSON(twoWindows())
    const lost = mc.figureIdOf('w_1', 'n1')
    mc.setMainZonePaneOptions('w_1', 'n1', { value_mode: 'value' })
    mc.hideMainZoneOccupant('w_1')

    const saved = app.toJSON() as Type_JSON

    // Ni dans le fichier, ni dans le registre de la session : une figure nommee pour etre posee,
    // puis deposee, n a plus aucun referent.
    expect(saved['figures']).toBeUndefined()
    expect(mc.figureById(lost)).toBeUndefined()
  })

  // --- (c) la persistance -------------------------------------------------------------------

  it('sans promotion le registre n ecrit rien, avec promotion il ecrit id nature et attributs', () => {
    const mc = newConfig()
    mc.setMainZonePaneOptions('w_1', 'n1', { value_mode: 'value' })
    expect(mc.figuresToJSON()).toBeUndefined()

    mc.figureIdOf('w_1', 'n1')
    expect(mc.figuresToJSON()).toEqual({
      f_1: { id: 'f_1', nature: NATURE, attributes: { value_mode: 'value' } }
    })
  })

  it('la vignette d une figure promue n ecrit qu un renvoi', () => {
    const mc = newConfig()
    mc.setMainZonePaneOptions('w_1', 'n1', { value_mode: 'value' })
    mc.setMainZonePaneOptions('w_1', 'n2', { value_mode: 'normalized' })
    mc.figureIdOf('w_1', 'n1')

    const entry = (mc.mainZoneStateToJSON()['occupants'] as Type_JSON)['w_1'] as Type_JSON
    expect(entry['figures']).toEqual({
      n1: { ref: 'f_1' },
      n2: { attributes: { value_mode: 'normalized' } }
    })
  })

  it('aller-retour : la meme instance a la vignette et au registre, memes reglages', () => {
    const mc = newConfig()
    mc.setMainZonePaneOptions('w_1', 'n1', { value_mode: 'value' })
    mc.figureIdOf('w_1', 'n1')

    const figures = mc.figuresToJSON()
    const main_zone = mc.mainZoneStateToJSON()

    const relu = new Class_ApplicationData(false).menu_configuration
    // L ORDRE DE LECTURE du fichier : le registre, puis la grande zone qui le cite.
    relu.figuresFromJSON(figures)
    relu.mainZoneStateFromJSON(main_zone)

    expect(relu.figureById('f_1')).toBe(relu.figureOf('w_1', 'n1'))
    expect(relu.mainZonePaneOptionsOf('w_1', 'n1')).toEqual(mc.mainZonePaneOptionsOf('w_1', 'n1'))
    expect(relu.figuresToJSON()).toEqual(figures)
    // Le compteur est reagli sur le fichier : la figure suivante ne reprend pas un nom pris.
    expect(relu.figureIdOf('w_1', 'n2')).toBe('f_2')
  })

  it('un renvoi sans referent donne une figure neuve et se DIT', () => {
    const relu = new Class_ApplicationData(false).menu_configuration
    relu.mainZoneStateFromJSON({
      occupants: {
        w_1: {
          place: 'main', size: 1, order: 0, representation: NATURE,
          subject: { kind: 'elements', ids: ['n1'], keys: ['n1'] },
          figures: { n1: { ref: 'f_9' } }
        }
      }
    })

    expect(relu.mainZonePaneOptionsOf('w_1', 'n1').value_mode).toBe('percent')
    const notes = relu.figure_migration_report.notes
    expect(notes.some(n => n.key === 'f_9' && n.reason === 'unknown_key')).toBe(true)
  })

  // --- (d) le placement sur un noeud --------------------------------------------------------

  it('placeFigureOnNode ecrit un placement, nodePlacedFigure le retrouve, unplace le retire', () => {
    const mc = newConfig()
    const { node, attributes, state } = fakeNode()

    const id = mc.placeFigureOnNode('w_1', 'n1', node)

    expect(id).toBe('f_1')
    expect(attributes['figure_placements'])
      .toEqual([{ figure: 'f_1', host: 'node', frame: 'bounds' }])
    expect(state.draws).toBe(1)
    expect(mc.nodePlacedFigure(node)).toBe(mc.figureOf('w_1', 'n1'))
    expect(mc.placedFigureIds([node])).toEqual(new Set(['f_1']))
    expect(mc.figureHasPlacement('f_1', [node])).toBe(true)

    mc.unplaceFigureFromNode(id, node)

    // Liste vide = attribut efface : le fichier ne porte pas une cle qui ne dit rien.
    expect(attributes['figure_placements']).toBeUndefined()
    expect(mc.nodePlacedFigure(node)).toBeNull()
    expect(mc.figureHasPlacement('f_1', [node])).toBe(false)
    // La figure, elle, n est pas detruite : elle reste sa vignette.
    expect(mc.figureById('f_1')).toBeDefined()
  })

  it('poser la meme figure deux fois ne la pose qu une fois', () => {
    const mc = newConfig()
    const { node, attributes } = fakeNode()

    mc.placeFigureOnNode('w_1', 'n1', node)
    mc.placeFigureOnNode('w_1', 'n1', node)

    expect(attributes['figure_placements'])
      .toEqual([{ figure: 'f_1', host: 'node', frame: 'bounds' }])
  })

  it('poser une SECONDE figure remplace la premiere : un noeud n en porte qu une', () => {
    const mc = newConfig()
    const { node, attributes } = fakeNode()

    mc.placeFigureOnNode('w_1', 'n1', node)
    const second = mc.placeFigureOnNode('w_1', 'n2', node)

    expect(attributes['figure_placements'])
      .toEqual([{ figure: second, host: 'node', frame: 'bounds' }])
    expect(mc.nodePlacedFigure(node)).toBe(mc.figureOf('w_1', 'n2'))
  })

  it('retirer une figure qui n est pas posee ne touche pas au noeud', () => {
    const mc = newConfig()
    const { node, attributes, state } = fakeNode()

    mc.unplaceFigureFromNode('f_1', node)

    expect('figure_placements' in attributes).toBe(false)
    expect(state.draws).toBe(0)
  })

  it('le noeud pose garde le LIEN : rerégler la vignette change ce qu il montre', () => {
    const mc = newConfig()
    const { node } = fakeNode()
    mc.placeFigureOnNode('w_1', 'n1', node)

    mc.setMainZonePaneOptions('w_1', 'n1', { value_mode: 'value' })

    expect(mc.nodePlacedFigure(node)?.getElementProperty('value_mode')).toBe('value')
  })

  // --- (e) les goldens ----------------------------------------------------------------------

  it('un fichier sans figure posee ne porte ni registre ni renvoi', () => {
    const mc = newConfig()
    mc.setMainZonePaneOptions('w_1', 'n1', { value_mode: 'value' })
    // Lire ne promeut pas : seul un geste qui NOMME la figure le fait.
    mc.mainZonePaneOptionsOf('w_1', 'n1')
    mc.nodePlacedFigure(fakeNode().node)

    expect(mc.figuresToJSON()).toBeUndefined()
    const entry = (mc.mainZoneStateToJSON()['occupants'] as Type_JSON)['w_1'] as Type_JSON
    expect(entry['figures']).toEqual({ n1: { attributes: { value_mode: 'value' } } })
  })
})
