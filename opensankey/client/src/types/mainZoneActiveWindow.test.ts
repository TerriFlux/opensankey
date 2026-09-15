import { Class_ApplicationData } from './ApplicationData'
import { MAIN_ZONE_CANVAS_ID } from './MenuConfig'

/**
 * os#1397 - ON PEUT REVENIR AU DIAGRAMME.
 *
 * Les fenetres hebergees portent un geste qui les designe comme fenetre active. Le canevas
 * principal, lui, est dessine HORS de l arbre React et se trouvait ecarte de ce geste : une fois
 * une etoile touchee, elle restait active jusqu a sa fermeture. Le lisere ne revenait pas, et le
 * menu de configuration continuait de montrer les reglages de l etoile au lieu de ceux de la vue.
 * Il n y avait aucun moyen de deselectionner.
 *
 * Ces tests figent le retour : le canevas se designe comme les autres.
 */

describe('os#1397 la fenetre active revient au canevas', () => {

  it('sans rien toucher, la fenetre active EST le canevas', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    expect(mc.main_zone_active_id).toBe(MAIN_ZONE_CANVAS_ID)
  })

  it('ouvrir une fenetre la rend active, la designer rend le canevas', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    const id = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.unit')
    expect(mc.main_zone_active_id).toBe(id)

    mc.activateMainZoneCanvas()
    expect(mc.main_zone_active_id).toBe(MAIN_ZONE_CANVAS_ID)
  })

  it('revenir au canevas oublie la vignette touchee dans l autre fenetre', () => {
    // La cle d une vignette n a de sens que dans la fenetre qui la porte : la garder ferait
    // montrer au menu de configuration les reglages d un dessin qu on ne regarde plus.
    const mc = new Class_ApplicationData(false).menu_configuration
    const id = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.unit')
    mc.setMainZoneActivePane(id, 'p2')
    expect(mc.main_zone_active_pane_key).toBe('p2')

    mc.activateMainZoneCanvas()
    expect(mc.main_zone_active_pane_key).toBeNull()
  })

  it('designer le canevas deux fois de suite ne change rien la seconde fois', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.unit')
    mc.activateMainZoneCanvas()
    mc.activateMainZoneCanvas()
    expect(mc.main_zone_active_id).toBe(MAIN_ZONE_CANVAS_ID)
  })
})
