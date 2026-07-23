import { Class_PanelManager, MENU_PANEL_IDS } from './PanelManager'
import { Class_EventBus } from './EventBus'

// OS#305 Lot 5 — réglages d'auteur par MENU de barre. Décision #9 : pour un
// bouton on ne compose pas de contenu (c'est l'UI de l'appli). Depuis
// l'ajustement #4, le CONTENANT n'est plus réglable non plus : ne reste que
// l'aide au survol.

const make = () => new Class_PanelManager(new Class_EventBus())

describe('#305 politique par menu — valeurs par défaut', () => {
  it('un menu non réglé n\'a pas d\'aide', () => {
    const panels = make()
    MENU_PANEL_IDS.forEach(id => {
      expect(panels.getMenuPolicy(id)).toEqual({ help: '' })
      expect(panels.getMenuHelp(id)).toBe('')
    })
  })

  it('mémorise l\'aide rédigée par l\'auteur', () => {
    const panels = make()
    panels.setMenuPolicy('filter', { help: 'Filtrer par filière' })
    expect(panels.getMenuHelp('filter')).toBe('Filtrer par filière')
  })

  it('ne stocke RIEN quand l\'aide revient au vide', () => {
    // Sinon le JSON du diagramme s'alourdit d'entrées sans effet.
    const panels = make()
    panels.setMenuPolicy('search', { help: 'aide' })
    expect(panels.toJSON()['menus']).toEqual({ search: { help: 'aide' } })
    panels.setMenuPolicy('search', { help: '   ' })
    expect(panels.toJSON()['menus']).toEqual({})
  })
})

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

describe('#305 persistance des réglages de menu', () => {
  it('round-trip', () => {
    const a = make()
    a.setMenuPolicy('config', { help: 'Régler le diagramme' })
    const b = make()
    b.fromJSON(a.toJSON())
    expect(b.getMenuPolicy('config')).toEqual({ help: 'Régler le diagramme' })
    expect(b.getMenuPolicy('filter')).toEqual({ help: '' })
  })

  it('l\'ouverture de la barre voyage avec le document, indépendamment du menu ancré', () => {
    const a = make()
    a.toggleSidebar()          // ouverte et VIDE
    const b = make()
    b.fromJSON(a.toJSON())
    expect(b.sidebar_open).toBe(true)
    expect(b.sidebar_id).toBeNull()
  })

  it('tolère un JSON abîmé, et ignore un « container » d\'une version antérieure', () => {
    const panels = make()
    panels.fromJSON({
      menus: {
        config: { container: 'sidebar', help: 'ok' },  // container ignoré
        filter: 'pas un objet',                        // ignoré
        search: { container: 'popup' }                 // aide absente -> non stocké
      }
    } as never)
    expect(panels.getMenuPolicy('config')).toEqual({ help: 'ok' })
    expect(panels.getMenuPolicy('filter')).toEqual({ help: '' })
    expect(panels.getMenuPolicy('search')).toEqual({ help: '' })
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

  it('ne casse pas sur un JSON sans clé « menus »', () => {
    const panels = make()
    expect(() => panels.fromJSON({} as never)).not.toThrow()
    expect(panels.getMenuHelp('config')).toBe('')
  })
})
