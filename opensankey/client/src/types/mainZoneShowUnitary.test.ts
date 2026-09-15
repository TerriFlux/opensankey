import { Class_ApplicationData } from './ApplicationData'
import { MAIN_ZONE_UNIT_WINDOW_ID } from './MenuConfig'

/**
 * os#1404 - LE BOUTON UNIT. OUVRE UNE FENETRE QUI SUIT, MEME QUAND UNE EPINGLEE EXISTE.
 *
 * L accesseur regardait la seule NATURE des occupants, sans leur sujet : une fenetre Unit.
 * epinglee sur un noeud suffisait a le dire montre, et le garde du setter rendait alors le
 * bouton muet. Il ne se grisait pas, ne disait rien, et n ouvrait rien : l auteur qui voulait
 * retrouver une fenetre vivante etait enferme par celle qu il avait epinglee.
 *
 * Ces tests figent l arbitrage : une fenetre epinglee et une fenetre qui suit sont deux objets
 * differents, les avoir toutes deux est legitime, et fermer ne touche jamais l epinglee.
 */

const unitaryWindows = (mc: Class_ApplicationData['menu_configuration']) =>
  mc.main_zone_occupants.filter(o => o.representation === MAIN_ZONE_UNIT_WINDOW_ID)

describe('os#1404 le geste Unit. ouvre toujours une fenetre qui suit', () => {

  it('une fenetre epinglee ne dit PAS que l unitaire est montre', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, MAIN_ZONE_UNIT_WINDOW_ID)
    expect(mc.main_zone_show_unitary).toBe(false)
  })

  it('le geste d ouverture cree une SECONDE fenetre qui suit la selection', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    const pinned = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, MAIN_ZONE_UNIT_WINDOW_ID)

    mc.main_zone_show_unitary = true

    const windows = unitaryWindows(mc)
    expect(windows).toHaveLength(2)
    // L epinglee est intacte : meme id, meme sujet.
    const kept = windows.find(o => o.id === pinned)
    expect(kept?.subject).toEqual({ kind: 'node', id: 'n1' })
    // La nouvelle suit la selection, et le bouton se surligne enfin.
    const following = windows.filter(o => o.subject.kind === 'selection')
    expect(following).toHaveLength(1)
    expect(mc.main_zone_show_unitary).toBe(true)
  })

  it('le geste ne cree pas de doublon quand une fenetre suit deja', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    mc.main_zone_show_unitary = true
    mc.main_zone_show_unitary = true
    expect(unitaryWindows(mc)).toHaveLength(1)
  })

  it('fermer ne touche que les fenetres qui suivent, jamais l epinglee', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    const pinned = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, MAIN_ZONE_UNIT_WINDOW_ID)
    mc.main_zone_show_unitary = true

    mc.main_zone_show_unitary = false

    const windows = unitaryWindows(mc)
    expect(windows.map(o => o.id)).toEqual([pinned])
    expect(mc.main_zone_show_unitary).toBe(false)
  })

  it('epingler la fenetre qui suit rouvre la porte', () => {
    // Le cas qui a enferme l auteur, raconte a l envers : sa seule fenetre Unit. se fige, et le
    // geste doit redonner une fenetre vivante au lieu de rester sans effet.
    const mc = new Class_ApplicationData(false).menu_configuration
    mc.main_zone_show_unitary = true
    const id = unitaryWindows(mc)[0].id
    mc.setMainZoneWindowSubject(id, { kind: 'node', id: 'n1' })
    expect(mc.main_zone_show_unitary).toBe(false)

    mc.main_zone_show_unitary = true
    expect(unitaryWindows(mc)).toHaveLength(2)
  })
})
