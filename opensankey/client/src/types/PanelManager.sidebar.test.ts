import { Class_PanelManager } from './PanelManager'
import { Class_EventBus } from './EventBus'

const make = () => new Class_PanelManager(new Class_EventBus())

// AJUSTEMENT #4 — la règle d'ouverture au clic, en une phrase : la barre
// latérale si elle est OUVERTE, une pop-up sinon. Aucun réglage ne s'y
// interpose, et l'état de la barre ne dépend pas de son contenu.

describe('#4 où un clic ouvre un panneau', () => {
  it('barre fermée -> pop-up', () => {
    expect(make().defaultOpenMode()).toBe('popup')
  })

  it('barre ouverte -> panneau, MÊME VIDE', () => {
    const panels = make()
    panels.toggleSidebar()
    expect(panels.sidebar_open).toBe(true)
    expect(panels.sidebar_id).toBeNull()
    expect(panels.defaultOpenMode()).toBe('sidebar')
  })

  it('ancrer un menu ouvre la barre', () => {
    const panels = make()
    panels.setMode('filter', 'sidebar')
    expect(panels.sidebar_open).toBe(true)
    expect(panels.defaultOpenMode()).toBe('sidebar')
  })

  it('vider la barre ne la ferme pas : les clics suivants s\'y ouvrent encore', () => {
    const panels = make()
    panels.setMode('filter', 'sidebar')
    panels.close('filter')
    expect(panels.sidebar_id).toBeNull()
    expect(panels.sidebar_open).toBe(true)
    expect(panels.defaultOpenMode()).toBe('sidebar')
  })

  it('détacher le menu ancré en pop-up laisse la barre ouverte et vide', () => {
    const panels = make()
    panels.setMode('config', 'sidebar')
    panels.setMode('config', 'popup')
    expect(panels.getMode('config')).toBe('popup')
    expect(panels.sidebar_open).toBe(true)
    expect(panels.sidebar_id).toBeNull()
  })

  it('la barre réserve sa largeur dès qu\'elle est ouverte, même vide', () => {
    const panels = make()
    expect(panels.getSidebarReservedPx()).toBe(0)
    panels.toggleSidebar()
    expect(panels.getSidebarReservedPx()).toBe(panels.sidebar_width_px)
  })
})

describe('#4 bascule de la barre latérale', () => {
  it('fermer puis rouvrir retrouve le menu ancré', () => {
    const panels = make()
    panels.setMode('config', 'sidebar')
    panels.toggleSidebar()
    expect(panels.sidebar_open).toBe(false)
    // Fermer ne désancre pas : le menu est masqué, pas retiré.
    expect(panels.getMode('config')).toBe('sidebar')
    panels.toggleSidebar()
    expect(panels.sidebar_id).toBe('config')
  })

  it('rouvrir NE regarnit PAS un menu que le lecteur a fermé lui-même', () => {
    const panels = make()
    panels.setMode('config', 'sidebar')
    panels.close('config')
    panels.toggleSidebar()   // ferme
    panels.toggleSidebar()   // rouvre
    expect(panels.sidebar_id).toBeNull()
  })
})

describe('#4 persistance de la barre latérale', () => {
  it('l\'ouverture de la barre voyage avec le document, indépendamment du menu ancré', () => {
    const a = make()
    a.toggleSidebar()          // ouverte et VIDE
    const b = make()
    b.fromJSON(a.toJSON())
    expect(b.sidebar_open).toBe(true)
    expect(b.sidebar_id).toBeNull()
  })

  it('reconstruit l\'ouverture d\'un document antérieur à l\'ajustement #4', () => {
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

  it('ignore sans casser un bloc « menus » d\'une version antérieure (aide au survol retirée)', () => {
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
