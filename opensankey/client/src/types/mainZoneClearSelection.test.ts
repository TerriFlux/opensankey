import { Class_ApplicationData } from './ApplicationData'
import { MAIN_ZONE_CANVAS_ID } from './MenuConfig'
import { activeWindowRepresentation, MAIN_ZONE_NO_WINDOW } from './CreationToolScope'

/**
 * sa#604 - ON PEUT NE PLUS RIEN AVOIR DE SELECTIONNE.
 *
 * Une vignette ou un volet designe le restait tant qu on n en designait pas un autre. Depuis
 * sa#601 la vignette selectionnee garde la molette : il faut pouvoir la lui reprendre. Deux gestes,
 * figes ici cote modele :
 *  - un clic dans le vide de la page deselectionne TOUT (`clearMainZoneSelection`) ;
 *  - un clic sur le fond d une grille deselectionne ses vignettes, le volet reste actif
 *    (`clearMainZonePaneSelection`).
 *
 * Le point delicat : `null` voulait deja dire « personne n a rien designe », et l accesseur y
 * repond par la fenetre principale. « Tout deselectionne » est un autre etat, qui doit le rester.
 */

describe('sa#604 tout deselectionner', () => {

  const build = () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    const id = mc.openMainZoneWindow(
      { kind: 'elements', ids: ['n1', 'n2', 'n3'], keys: ['n1', 'n2', 'n3'] }, 'osp.repr.unit'
    )
    return { mc, id }
  }

  it('plus de volet actif, plus de vignette active ni selectionnee', () => {
    const { mc, id } = build()
    mc.setMainZoneActivePane(id, 'n1')
    mc.setMainZoneActivePane(id, 'n2', true)
    mc.clearMainZoneSelection()
    expect(mc.main_zone_active_id).toBeNull()
    expect(mc.main_zone_active_pane_key).toBeNull()
    expect(mc.main_zone_selected_pane_keys).toEqual([])
    expect(mc.isMainZonePaneSelected(id, 'n1')).toBe(false)
    expect(mc.isMainZonePaneSelected(id, 'n2')).toBe(false)
  })

  it('et surtout pas la fenetre principale par defaut', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    expect(mc.main_zone_active_id).toBe(MAIN_ZONE_CANVAS_ID)
    mc.clearMainZoneSelection()
    expect(mc.main_zone_active_id).toBeNull()
  })

  it('l inspecteur revient a la selection du diagramme', () => {
    const { mc, id } = build()
    mc.setMainZoneActivePane(id, 'n1')
    expect(mc.inspector_focus_is_representation).toBe(true)
    mc.clearMainZoneSelection()
    expect(mc.inspector_focus_is_representation).toBe(false)
  })

  it('la grande zone se lit sans volet actif (colonne d outils reduite)', () => {
    const { mc } = build()
    mc.main_zone_hosted = true
    mc.clearMainZoneSelection()
    const app = { menu_configuration: mc } as unknown as Class_ApplicationData
    expect(activeWindowRepresentation(app)).toBe(MAIN_ZONE_NO_WINDOW)
  })

  it('l etat survit a la normalisation des volets (fermer un autre volet)', () => {
    const { mc, id } = build()
    const other = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.donut')
    mc.activateMainZoneCanvas()
    mc.clearMainZoneSelection()
    mc.hideMainZoneOccupant(other)
    expect(mc.main_zone_active_id).toBeNull()
    expect(mc.isMainZoneOccupant(id)).toBe(true)
  })

  it('designer un volet, une vignette ou le canevas le rend actif de nouveau', () => {
    const { mc, id } = build()
    mc.clearMainZoneSelection()
    mc.main_zone_active_id = id
    expect(mc.main_zone_active_id).toBe(id)

    mc.clearMainZoneSelection()
    mc.setMainZoneActivePane(id, 'n3')
    expect(mc.main_zone_active_id).toBe(id)
    expect(mc.main_zone_selected_pane_keys).toEqual(['n3'])

    mc.clearMainZoneSelection()
    mc.activateMainZoneCanvas()
    expect(mc.main_zone_active_id).toBe(MAIN_ZONE_CANVAS_ID)
  })

  it('un volet ouvert apres coup devient l actif, sur une selection vierge', () => {
    const { mc } = build()
    mc.clearMainZoneSelection()
    const fresh = mc.openMainZoneWindow({ kind: 'node', id: 'n2' }, 'osp.repr.donut')
    expect(mc.main_zone_active_id).toBe(fresh)
    expect(mc.main_zone_active_pane_key).toBeNull()
    expect(mc.main_zone_selected_pane_keys).toEqual([])
  })
})

describe('sa#604 deselectionner les vignettes d un volet', () => {

  const build = () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    const id = mc.openMainZoneWindow(
      { kind: 'elements', ids: ['n1', 'n2', 'n3'], keys: ['n1', 'n2', 'n3'] }, 'osp.repr.unit'
    )
    return { mc, id }
  }

  it('le volet reste actif, ses vignettes ne sont plus selectionnees', () => {
    const { mc, id } = build()
    mc.setMainZoneActivePane(id, 'n1')
    mc.setMainZoneActivePane(id, 'n3', true)
    mc.clearMainZonePaneSelection(id)
    expect(mc.main_zone_active_id).toBe(id)
    expect(mc.main_zone_active_pane_key).toBeNull()
    expect(mc.main_zone_selected_pane_keys).toEqual([])
    expect(mc.isMainZonePaneSelected(id, 'n1')).toBe(false)
  })

  it('le fond d un volet inactif le rend actif, sans vignette', () => {
    const { mc, id } = build()
    mc.setMainZoneActivePane(id, 'n2')
    mc.activateMainZoneCanvas()
    mc.clearMainZonePaneSelection(id)
    expect(mc.main_zone_active_id).toBe(id)
    expect(mc.main_zone_selected_pane_keys).toEqual([])
  })

  it('un volet qu on vient d ouvrir n a aucune vignette selectionnee', () => {
    const { mc, id } = build()
    expect(mc.main_zone_active_id).toBe(id)
    expect(mc.main_zone_active_pane_key).toBeNull()
    expect(mc.main_zone_selected_pane_keys).toEqual([])
    expect(['n1', 'n2', 'n3'].some(k => mc.isMainZonePaneSelected(id, k))).toBe(false)
  })
})
