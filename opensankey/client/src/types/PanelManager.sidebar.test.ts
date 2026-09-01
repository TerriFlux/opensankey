import { Class_PanelManager } from './PanelManager'
import { Class_EventBus } from './EventBus'

const make = () => new Class_PanelManager(new Class_EventBus())

// La barre latérale n'existe QUE garnie (il n'y a plus de barre ouverte et vide,
// qui volait 270 px au dessin sans rien montrer). D'où la règle d'ouverture au
// clic, en une phrase : la barre latérale si un menu y est ancré et déployé, une
// pop-up sinon.

describe('ou un clic ouvre un panneau', () => {
  it('barre vide -> pop-up', () => {
    expect(make().defaultOpenMode()).toBe('popup')
  })

  it('la bascule ne fabrique pas une barre vide', () => {
    const panels = make()
    panels.toggleSidebar()
    expect(panels.sidebar_open).toBe(false)
    expect(panels.sidebar_id).toBeNull()
    expect(panels.defaultOpenMode()).toBe('popup')
  })

  it('ancrer un menu ouvre la barre', () => {
    const panels = make()
    panels.setMode('filter', 'sidebar')
    expect(panels.sidebar_open).toBe(true)
    expect(panels.defaultOpenMode()).toBe('sidebar')
  })

  it('vider la barre la fait disparaitre : les clics suivants ouvrent des fenetres', () => {
    const panels = make()
    panels.setMode('filter', 'sidebar')
    panels.close('filter')
    expect(panels.sidebar_id).toBeNull()
    expect(panels.sidebar_open).toBe(false)
    expect(panels.defaultOpenMode()).toBe('popup')
  })

  it('detacher le menu ancre en pop-up retire la barre', () => {
    const panels = make()
    panels.setMode('config', 'sidebar')
    panels.setMode('config', 'popup')
    expect(panels.getMode('config')).toBe('popup')
    expect(panels.sidebar_open).toBe(false)
    expect(panels.sidebar_id).toBeNull()
  })

  it('la barre ne reserve sa largeur que garnie', () => {
    const panels = make()
    expect(panels.getSidebarReservedPx()).toBe(0)
    panels.toggleSidebar()
    expect(panels.getSidebarReservedPx()).toBe(0)
    panels.setMode('config', 'sidebar')
    expect(panels.getSidebarReservedPx()).toBe(panels.sidebar_width_px)
  })
})

describe('bascule de la barre laterale', () => {
  it('replier puis deplier retrouve le menu ancre', () => {
    const panels = make()
    panels.setMode('config', 'sidebar')
    panels.toggleSidebar()
    expect(panels.sidebar_open).toBe(false)
    // Replier ne désancre pas : le menu est masqué, pas retiré.
    expect(panels.getMode('config')).toBe('sidebar')
    panels.toggleSidebar()
    expect(panels.sidebar_id).toBe('config')
    expect(panels.sidebar_open).toBe(true)
  })

  it('barre vide : la bascule y range la fenetre ouverte la plus recente', () => {
    const panels = make()
    panels.setMode('config', 'popup')
    panels.setMode('search', 'popup')
    panels.toggleSidebar()
    expect(panels.sidebar_id).toBe('search')
    expect(panels.getMode('config')).toBe('popup')
  })

  it('NE regarnit PAS un menu que le lecteur a ferme lui-meme', () => {
    const panels = make()
    panels.setMode('config', 'sidebar')
    panels.close('config')
    panels.toggleSidebar()
    expect(panels.sidebar_id).toBeNull()
  })

  it('le geste n a pas de prise quand rien n est ancre ni ouvert', () => {
    const panels = make()
    expect(panels.canToggleSidebar()).toBe(false)
    panels.setMode('config', 'popup')
    expect(panels.canToggleSidebar()).toBe(true)
  })
})

describe('persistance de la barre laterale', () => {
  it('le repli du menu ancre voyage avec le document', () => {
    const a = make()
    a.setMode('config', 'sidebar')
    a.toggleSidebar()          // replié
    const b = make()
    b.fromJSON(a.toJSON())
    expect(b.sidebar_id).toBe('config')
    expect(b.sidebar_open).toBe(false)
    b.toggleSidebar()
    expect(b.sidebar_open).toBe(true)
  })

  it('une barre ouverte et VIDE enregistree par une version anterieure se relit fermee', () => {
    const panels = make()
    panels.fromJSON({ sidebar_id: '', sidebar_open: true } as never)
    expect(panels.sidebar_id).toBeNull()
    expect(panels.sidebar_open).toBe(false)
    expect(panels.defaultOpenMode()).toBe('popup')
  })

  it('reconstruit l ouverture d un document anterieur a l ajustement #4', () => {
    // Ces documents ne portaient que `sidebar_collapsed`, et la barre n'existait
    // qu'à travers son menu ancré.
    const ancre = make()
    ancre.fromJSON({ sidebar_id: 'config', sidebar_collapsed: false } as never)
    expect(ancre.sidebar_open).toBe(true)

    const replie = make()
    replie.fromJSON({ sidebar_id: 'config', sidebar_collapsed: true } as never)
    expect(replie.sidebar_open).toBe(false)

    const aucun = make()
    aucun.fromJSON({ sidebar_id: '' } as never)
    expect(aucun.sidebar_open).toBe(false)
  })

  it('ignore sans casser un bloc menus d une version anterieure (aide au survol retiree)', () => {
    const panels = make()
    expect(() => panels.fromJSON({
      menus: { config: { help: 'ok' }, filter: 'pas un objet' }
    } as never)).not.toThrow()
    expect(panels.toJSON()['menus']).toBeUndefined()
  })

  it('ne casse pas sur un JSON vide', () => {
    expect(() => make().fromJSON({} as never)).not.toThrow()
  })
})
