import { Class_ApplicationData } from './ApplicationData'
import { MAIN_ZONE_CANVAS_ID } from './MenuConfig'

/**
 * os#1423 - LES VIGNETTES SONT SELECTIONNABLES.
 *
 * La portee « toutes les vignettes » de os#1417 etait donnee comme transitoire : elle tenait lieu
 * de selection tant que les vignettes ne se selectionnaient pas. Elles se selectionnent, et ces
 * tests figent le contrat.
 *
 * Ce qui s y joue tient en un invariant : la vignette ACTIVE fait partie de la selection, et une
 * selection vide veut dire « seulement l active », jamais « rien ». C est ce qui permet a la
 * portee 'selection' de degenerer en 'pane' sans que personne ait a traiter le cas - et c est
 * aussi ce qui interdit de tout deselectionner, geste qui ne menerait nulle part.
 *
 * L autre invariant est de lieu : la selection vit TOUJOURS dans la fenetre active, et se vide
 * partout ou la vignette active se vide. Une cle de vignette ne veut rien dire ailleurs, et deux
 * fenetres peuvent nommer la meme.
 */

describe('os#1423 la selection de vignettes de la fenetre active', () => {

  const build = () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    const id = mc.openMainZoneWindow(
      { kind: 'elements', ids: ['n1', 'n2', 'n3'], keys: ['n1', 'n2', 'n3'] }, 'osp.repr.donut'
    )
    return { mc, id }
  }

  it('un clic simple selectionne la vignette touchee, et elle seule', () => {
    const { mc, id } = build()
    mc.setMainZoneActivePane(id, 'n1')
    expect(mc.main_zone_active_pane_key).toBe('n1')
    expect(mc.main_zone_selected_pane_keys).toEqual(['n1'])
  })

  it('un clic simple sur une autre vignette REFAIT la selection autour d elle', () => {
    // Le geste de toutes les listes : sans cela, un clic ordinaire trainerait une selection
    // oubliee jusqu au prochain reglage de portee 'selection'.
    const { mc, id } = build()
    mc.setMainZoneActivePane(id, 'n1')
    mc.setMainZoneActivePane(id, 'n2', true)
    mc.setMainZoneActivePane(id, 'n3')
    expect(mc.main_zone_selected_pane_keys).toEqual(['n3'])
    expect(mc.main_zone_active_pane_key).toBe('n3')
  })

  it('ctrl clic AJOUTE la vignette a la selection et la rend active', () => {
    const { mc, id } = build()
    mc.setMainZoneActivePane(id, 'n1')
    mc.setMainZoneActivePane(id, 'n2', true)
    expect(mc.main_zone_selected_pane_keys).toEqual(['n1', 'n2'])
    expect(mc.main_zone_active_pane_key).toBe('n2')
  })

  it('ctrl clic sur une vignette deja selectionnee la RETIRE, et l active recule', () => {
    const { mc, id } = build()
    mc.setMainZoneActivePane(id, 'n1')
    mc.setMainZoneActivePane(id, 'n2', true)
    mc.setMainZoneActivePane(id, 'n2', true)
    expect(mc.main_zone_selected_pane_keys).toEqual(['n1'])
    expect(mc.main_zone_active_pane_key).toBe('n1')
  })

  it('ctrl clic sur la SEULE vignette selectionnee ne change rien', () => {
    // Tout deselectionner ne menerait nulle part : le volet parlerait quand meme de la derniere
    // touchee, mais sans lisere pour le dire.
    const { mc, id } = build()
    mc.setMainZoneActivePane(id, 'n2')
    mc.setMainZoneActivePane(id, 'n2', true)
    expect(mc.main_zone_selected_pane_keys).toEqual(['n2'])
    expect(mc.main_zone_active_pane_key).toBe('n2')
  })

  it('ctrl clic dans une fenetre qui n etait pas active y repart de la vignette touchee', () => {
    // On ne selectionne pas a cheval sur deux fenetres : la selection vit dans l active.
    const { mc, id } = build()
    mc.setMainZoneActivePane(id, 'n1')
    mc.setMainZoneActivePane(id, 'n2', true)
    mc.activateMainZoneCanvas()
    mc.setMainZoneActivePane(id, 'n3', true)
    expect(mc.main_zone_active_id).toBe(id)
    expect(mc.main_zone_selected_pane_keys).toEqual(['n3'])
  })

  it('selectAllMainZonePanes prend les trois et GARDE la vignette active', () => {
    const { mc, id } = build()
    mc.setMainZoneActivePane(id, 'n2')
    mc.selectAllMainZonePanes(id, ['n1', 'n2', 'n3'])
    expect(mc.main_zone_selected_pane_keys).toEqual(['n1', 'n2', 'n3'])
    expect(mc.main_zone_active_pane_key).toBe('n2')
  })

  it('selectAllMainZonePanes dedoublonne, garde l ordre donne, et rend la fenetre active', () => {
    const { mc, id } = build()
    mc.activateMainZoneCanvas()
    mc.selectAllMainZonePanes(id, ['n3', 'n1', 'n3'])
    expect(mc.main_zone_active_id).toBe(id)
    expect(mc.main_zone_selected_pane_keys).toEqual(['n3', 'n1'])
    // L active n etait pas dans le lot : la premiere prend sa place.
    expect(mc.main_zone_active_pane_key).toBe('n3')
  })

  it('selectAllMainZonePanes avec une liste vide vide tout', () => {
    const { mc, id } = build()
    mc.setMainZoneActivePane(id, 'n1')
    mc.selectAllMainZonePanes(id, [])
    expect(mc.main_zone_selected_pane_keys).toEqual([])
    expect(mc.main_zone_active_pane_key).toBeNull()
  })

  it('changer de fenetre active VIDE la selection', () => {
    const { mc, id } = build()
    mc.selectAllMainZonePanes(id, ['n1', 'n2'])
    mc.activateMainZoneCanvas()
    expect(mc.main_zone_active_id).toBe(MAIN_ZONE_CANVAS_ID)
    expect(mc.main_zone_selected_pane_keys).toEqual([])
    expect(mc.main_zone_active_pane_key).toBeNull()
  })

  it('ouvrir une fenetre part sur une selection vierge', () => {
    const { mc, id } = build()
    mc.selectAllMainZonePanes(id, ['n1', 'n2'])
    mc.openMainZoneWindow({ kind: 'node', id: 'n9' }, 'osp.repr.unit')
    expect(mc.main_zone_selected_pane_keys).toEqual([])
  })

  it('sans selection explicite, les vignettes selectionnees sont la seule active', () => {
    // L invariant paye une fois pour toutes : personne d autre n a a se demander si une
    // selection vide veut dire « rien » ou « celle-la ».
    const { mc, id } = build()
    mc.setMainZoneActivePane(id, 'n2')
    // Un sujet a critere ne sait pas quelles vignettes survivent : la selection se vide, la
    // vignette active reste.
    mc.setMainZoneWindowSubject(id, { kind: 'selection' })
    expect(mc.main_zone_active_pane_key).toBe('n2')
    expect(mc.main_zone_selected_pane_keys).toEqual(['n2'])
  })

  it('changer le sujet ne garde que les cles encore vivantes', () => {
    const { mc, id } = build()
    mc.setMainZoneActivePane(id, 'n1')
    mc.setMainZoneActivePane(id, 'n2', true)
    mc.setMainZoneWindowSubject(id, { kind: 'elements', ids: ['n1'], keys: ['n1'] })
    expect(mc.main_zone_selected_pane_keys).toEqual(['n1'])
    // L active partait avec sa vignette : la premiere restante prend sa place.
    expect(mc.main_zone_active_pane_key).toBe('n1')
  })

  it('isMainZonePaneSelected est faux pour une AUTRE fenetre', () => {
    const { mc, id } = build()
    const other = mc.openMainZoneWindow(
      { kind: 'elements', ids: ['n1', 'n2'], keys: ['n1', 'n2'] }, 'osp.repr.donut'
    )
    mc.setMainZoneActivePane(id, 'n1')
    expect(mc.isMainZonePaneSelected(id, 'n1')).toBe(true)
    expect(mc.isMainZonePaneSelected(id, 'n2')).toBe(false)
    expect(mc.isMainZonePaneSelected(other, 'n1')).toBe(false)
  })

  it('la selection n est PAS ecrite dans le fichier', () => {
    // Transitoire comme la vignette active : elle ne decrit pas le document, elle decrit le
    // geste en cours.
    const { mc, id } = build()
    mc.selectAllMainZonePanes(id, ['n1', 'n2', 'n3'])
    const state = mc.mainZoneStateToJSON() as { occupants: { [id: string]: object } }
    expect(JSON.stringify(state)).not.toContain('selected')
    expect(Object.keys(state.occupants[id]).sort())
      .toEqual(['order', 'place', 'representation', 'size', 'subject'])
  })
})
