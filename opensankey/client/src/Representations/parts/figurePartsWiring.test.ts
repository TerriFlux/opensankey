// os#1475 — LES CINQ GESTES DU BRANCHEMENT, ECRITS UNE FOIS.
//
// Julien : « je veux pouvoir te dire *je veux un nouveau graphe avec ces caracteristiques* et que tu
// l implementes de A a Z avec le mecanisme generique ». Deuxieme des quatre pas.
//
// CE QUE CE FICHIER GARDE. Une figure qui veut des parts reglables fait CINQ gestes, et en oublier
// un ne casse rien tout de suite — c est ce qui rend la recopie dangereuse. Les deux copies d avant
// etaient d accord au mot pres ; ce n est pas une preuve qu elles le seraient restees, le chantier
// ayant montre trois fois le contraire (le catalogue d icones, les regles du document de parts, les
// deux lecteurs d aspect). Une copie ne diverge pas le jour ou on l ecrit, mais le jour ou on
// enrichit l autre.

import { Class_Workspace } from '../../types/Workspace'
import { MAIN_ZONE_CANVAS_ID } from '../../types/MenuConfig'
import { BARS_STYLE_DEFAULTS } from '../../Charts/figureChartStyle'
import { figurePartsWiring } from './figurePartsWiring'
import { resetFigureParts } from './figurePartsRegistry'
import type { Type_PartInput } from './buildParts'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const inputs = (): Type_PartInput[] => [
  { id: 'a', label: 'A', value: 6 },
  { id: 'b', label: 'B', value: 4 }
]

/** Une figure DANS une vignette : l etat normal, celui ou les cinq gestes comptent. */
const dansUneVignette = () => {
  const ws = new Class_Workspace(false)
  const source = ws.createDocument()
  source.drawing_area.bypass_redraws = true
  const window_id = source.menu_configuration.openMainZoneWindow(
    { kind: 'selection' }, MAIN_ZONE_CANVAS_ID
  )
  return { ws, source, ctx: { app_data: source, options: {}, window_id, pane_key: 'p1' } }
}

afterEach(() => resetFigureParts())

describe('os#1475 brancher les parts dune figure', () => {

  it('DECLARE le document a la vignette : c est lui qui devient l ACTIF', () => {
    // Le geste 2, et c est par lui que l inspecteur montre Forme / Libelle / Valeur au lieu des
    // reglages de la figure.
    const { ws, source, ctx } = dansUneVignette()
    expect(ws.active).toBe(source)

    const w = figurePartsWiring(ctx, inputs(), 'donut', BARS_STYLE_DEFAULTS)

    expect(ws.active).toBe(w.by_id['a'].drawing_area.application_data)
    w.release()
  })

  it('SELECTIONNE au clic, en purgeant d abord', () => {
    // Le geste 3 : une figure se lit une part a la fois. Garder l ancienne ferait montrer a
    // l inspecteur une selection multiple que le geste n a jamais demandee.
    const { ws, ctx } = dansUneVignette()
    const w = figurePartsWiring(ctx, inputs(), 'donut', BARS_STYLE_DEFAULTS)

    w.on_part_select('a')
    w.on_part_select('b')

    expect(ws.active!.drawing_area.selected_elements_list).toEqual([w.by_id['b']])
    w.release()
  })

  it('DIT QUE LE DERNIER GESTE VISAIT LA SELECTION', () => {
    // Le geste 4, et c est un defaut vecu : sans lui, selectionner une part ne se voyait pas —
    // toucher une vignette pose le focus sur « representation », et la resolution de cible le rend
    // AVANT de regarder la selection.
    const { source, ctx } = dansUneVignette()
    const w = figurePartsWiring(ctx, inputs(), 'donut', BARS_STYLE_DEFAULTS)
    source.menu_configuration.inspector_focus_is_representation = true

    w.on_part_select('a')

    expect(source.menu_configuration.inspector_focus_is_representation).toBe(false)
    w.release()
  })

  it('un identifiant inconnu ne selectionne rien, et ne jette pas', () => {
    // Le trace peut nommer une part que la decomposition ne cite plus — un redessin en cours.
    const { ws, ctx } = dansUneVignette()
    const w = figurePartsWiring(ctx, inputs(), 'donut', BARS_STYLE_DEFAULTS)

    expect(() => w.on_part_select('inconnu')).not.toThrow()
    expect(ws.active!.drawing_area.selected_elements_list.length).toBe(0)
    w.release()
  })

  it('LIBERER DELIE, et ne dispose pas : le depot garde le jeu', () => {
    // Le geste 5, et sa subtilite : dans une vignette, un demontage est le plus souvent un simple
    // REDESSIN. Disposer ici perdrait a chaque geste les reglages que l auteur vient de poser. C est
    // la FERMETURE de la vignette qui libere.
    const { ws, source, ctx } = dansUneVignette()
    const w = figurePartsWiring(ctx, inputs(), 'donut', BARS_STYLE_DEFAULTS)
    const doc = w.by_id['a'].drawing_area.application_data

    w.release()

    expect(ws.active).toBe(source)
    expect(doc.disposed).toBe(false)
  })

  it('HORS VIGNETTE : rien n est declare, et la liberation DISPOSE', () => {
    // La pop-up de presentation, une vignette d apercu : il n y a personne a qui attribuer une
    // selection, et le jeu de parts est jetable.
    const ws = new Class_Workspace(false)
    const source = ws.createDocument()
    source.drawing_area.bypass_redraws = true

    const w = figurePartsWiring({ app_data: source, options: {} }, inputs(), 'donut', BARS_STYLE_DEFAULTS)
    const doc = w.by_id['a'].drawing_area.application_data
    expect(ws.active).toBe(source)

    w.release()

    expect(doc.disposed).toBe(true)
  })

  it('les parts SURVIVENT au redessin, et gardent leurs reglages', () => {
    // Le geste 1 : les parts se reprennent du dessin precedent. Oublier la reprise perd les reglages
    // de l auteur au premier redessin, et le redessin arrive au geste suivant.
    const { ctx } = dansUneVignette()
    const premier = figurePartsWiring(ctx, inputs(), 'donut', BARS_STYLE_DEFAULTS)
    premier.by_id['a'].shape_color = '#123456'

    const second = figurePartsWiring(ctx, inputs(), 'donut', BARS_STYLE_DEFAULTS)

    expect(second.by_id['a']).toBe(premier.by_id['a'])
    expect(second.by_id['a'].shape_color).toBe('#123456')
    second.release()
  })

  it('rend AUSSI l aspect monte, pour les traces qui le preferent ainsi', () => {
    // Deux vocabulaires, un seul cablage : le disque lit `by_id` et compose lui-meme, la couronne et
    // les barres lisent `part_aspect`. Les deux sortent d ici.
    const { ctx } = dansUneVignette()
    const w = figurePartsWiring(ctx, inputs(), 'donut', BARS_STYLE_DEFAULTS)
    w.by_id['a'].shape_color = '#00FF00'

    expect(w.part_aspect('a').fill).toBe('#00FF00')
    // Ce qui n a rien dit ne dit rien : la figure decide.
    expect(w.part_aspect('b').fill).toBeUndefined()
    w.release()
  })
})
