import { Class_PanelManager, MENU_PANEL_IDS } from './PanelManager'
import { Class_EventBus } from './EventBus'

// OS#305 Lot 5 — réglages d'auteur par MENU de barre : contenant imposé et aide.
// Décision #9 : pour un bouton on ne compose pas de contenu (c'est l'UI de
// l'appli), on règle seulement son contenant et son aide.

const make = () => new Class_PanelManager(new Class_EventBus())

describe('#305 politique par menu — valeurs par défaut', () => {
  it('un menu non réglé vaut « auto », sans aide', () => {
    const panels = make()
    MENU_PANEL_IDS.forEach(id => {
      expect(panels.getMenuPolicy(id)).toEqual({ container: 'auto', help: '' })
      expect(panels.getMenuHelp(id)).toBe('')
    })
  })

  it('« auto » laisse le comportement CONTEXTUEL de #300 décider', () => {
    const panels = make()
    // Aucune barre latérale visible -> pop-up.
    expect(panels.defaultOpenMode('config')).toBe('popup')
    // Barre latérale affichée -> le menu s'y ancre.
    panels.setMode('filter', 'sidebar')
    expect(panels.defaultOpenMode('config')).toBe('sidebar')
  })
})

describe('#305 contenant imposé par l\'auteur', () => {
  it('prime sur le comportement contextuel', () => {
    const panels = make()
    panels.setMenuPolicy('config', { container: 'popup', help: '' })
    // Même barre latérale affichée, la config s'ouvre en pop-up comme voulu.
    panels.setMode('filter', 'sidebar')
    expect(panels.defaultOpenMode('config')).toBe('popup')
    // Les autres menus restent contextuels.
    expect(panels.defaultOpenMode('search')).toBe('sidebar')
  })

  it('sans id de menu, le comportement contextuel s\'applique', () => {
    const panels = make()
    panels.setMenuPolicy('config', { container: 'popup', help: '' })
    panels.setMode('filter', 'sidebar')
    expect(panels.defaultOpenMode()).toBe('sidebar')
  })
})

describe('#305 aide et parcimonie du stockage', () => {
  it('mémorise l\'aide rédigée par l\'auteur', () => {
    const panels = make()
    panels.setMenuPolicy('filter', { container: 'auto', help: 'Filtrer par filière' })
    expect(panels.getMenuHelp('filter')).toBe('Filtrer par filière')
  })

  it('ne stocke RIEN quand le réglage revient au défaut', () => {
    // Sinon le JSON du diagramme s'alourdit d'entrées sans effet.
    const panels = make()
    panels.setMenuPolicy('search', { container: 'popup', help: 'aide' })
    expect(panels.toJSON()['menus']).toEqual({ search: { container: 'popup', help: 'aide' } })
    panels.setMenuPolicy('search', { container: 'auto', help: '   ' })
    expect(panels.toJSON()['menus']).toEqual({})
  })
})

describe('#305 persistance des réglages de menu', () => {
  it('round-trip', () => {
    const a = make()
    a.setMenuPolicy('config', { container: 'sidebar', help: 'Régler le diagramme' })
    a.setMenuPolicy('search', { container: 'popup', help: '' })
    const b = make()
    b.fromJSON(a.toJSON())
    expect(b.getMenuPolicy('config')).toEqual({ container: 'sidebar', help: 'Régler le diagramme' })
    expect(b.getMenuPolicy('search')).toEqual({ container: 'popup', help: '' })
    expect(b.getMenuPolicy('filter')).toEqual({ container: 'auto', help: '' })
  })

  it('tolère un JSON abîmé', () => {
    const panels = make()
    panels.fromJSON({
      menus: {
        config: { container: 'nawak', help: 'ok' },   // choix inconnu -> auto
        filter: 'pas un objet',                        // ignoré
        search: { container: 'sidebar' }               // aide absente -> ''
      }
    } as never)
    expect(panels.getMenuPolicy('config')).toEqual({ container: 'auto', help: 'ok' })
    expect(panels.getMenuPolicy('filter')).toEqual({ container: 'auto', help: '' })
    expect(panels.getMenuPolicy('search')).toEqual({ container: 'sidebar', help: '' })
  })

  it('ne casse pas sur un JSON sans clé « menus »', () => {
    const panels = make()
    expect(() => panels.fromJSON({} as never)).not.toThrow()
    expect(panels.getMenuPolicy('config').container).toBe('auto')
  })
})
