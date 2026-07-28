import { Class_PanelManager } from './PanelManager'
import { Class_EventBus } from './EventBus'

const make = () => new Class_PanelManager(new Class_EventBus())

// OS#321 — DEUX TYPES DE POP-UP. Ce que le modèle doit garantir, en une phrase :
// une pop-up ouverte au clic est TRANSITOIRE (le clic suivant, posé ailleurs, la
// referme) ; l'épingle la rend PERSISTANTE. Le reste (bascule, fermeture propre)
// découle de la mémoire du dernier congédiement.

describe('#321 une pop-up ouverte au clic n\'est pas épinglée', () => {
  it('setMode(popup) sans option : transitoire', () => {
    const panels = make()
    panels.setMode('config', 'popup')
    expect(panels.getMode('config')).toBe('popup')
    expect(panels.isPinned('config')).toBe(false)
    expect(panels.transient_popup_ids).toEqual(['config'])
  })

  it('setMode(popup, {pinned:true}) : persistante', () => {
    const panels = make()
    panels.setMode('config', 'popup', { pinned: true })
    expect(panels.isPinned('config')).toBe(true)
    expect(panels.transient_popup_ids).toEqual([])
  })

  it('rouvrir un panneau DÉJÀ épinglé ne le désépingle pas', () => {
    const panels = make()
    panels.setMode('config', 'popup', { pinned: true })
    panels.setMode('config', 'popup')
    expect(panels.isPinned('config')).toBe(true)
  })

  it('fermer une pop-up épinglée oublie l\'épingle (la suivante repart transitoire)', () => {
    const panels = make()
    panels.setMode('config', 'popup', { pinned: true })
    panels.close('config')
    panels.setMode('config', 'popup')
    expect(panels.isPinned('config')).toBe(false)
  })

  it('l\'épingle ne s\'applique qu\'à une pop-up OUVERTE', () => {
    const panels = make()
    panels.setPinned('config', true)
    expect(panels.isPinned('config')).toBe(false)
    panels.setMode('config', 'sidebar')
    panels.setPinned('config', true)
    expect(panels.isPinned('config')).toBe(false)
  })
})

describe('#321 congédiement au clic extérieur', () => {
  it('referme les transitoires, épargne les épinglées', () => {
    const panels = make()
    panels.setMode('config', 'popup')
    panels.setMode('presentation:n1', 'popup', { pinned: true })
    const closed = panels.dismissTransientPopups()
    expect(closed).toEqual(['config'])
    expect(panels.getMode('config')).toBeNull()
    expect(panels.getMode('presentation:n1')).toBe('popup')
  })

  it('épargne le panneau qui contient le point cliqué', () => {
    const panels = make()
    panels.setMode('config', 'popup')
    panels.setMode('search', 'popup')
    panels.dismissTransientPopups('config')
    expect(panels.getMode('config')).toBe('popup')
    expect(panels.getMode('search')).toBeNull()
  })

  it('ne touche ni la barre latérale ni l\'info-bulle', () => {
    const panels = make()
    panels.setMode('filter', 'sidebar')
    panels.setMode('presentation:n1', 'tooltip')
    panels.dismissTransientPopups()
    expect(panels.getMode('filter')).toBe('sidebar')
    expect(panels.getMode('presentation:n1')).toBe('tooltip')
  })

  it('emprunte la fermeture PROPRE du panneau quand elle est publiée', () => {
    const panels = make()
    const onClose = jest.fn(() => panels.close('filter'))
    panels.setCloseHandler('filter', onClose)
    panels.setMode('filter', 'popup')
    panels.dismissTransientPopups()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(panels.getMode('filter')).toBeNull()
  })
})

describe('#321 Échap referme tout', () => {
  it('ferme les pop-ups ÉPINGLÉES comme les autres', () => {
    const panels = make()
    panels.setMode('config', 'popup')
    panels.setMode('presentation:n1', 'popup', { pinned: true })
    panels.closeAllPopups()
    expect(panels.open_ids).toEqual([])
  })

  it('laisse la barre latérale en place (contenant, pas fenêtre)', () => {
    const panels = make()
    panels.setMode('filter', 'sidebar')
    panels.setMode('config', 'popup', { pinned: true })
    panels.closeAllPopups()
    expect(panels.getMode('filter')).toBe('sidebar')
    expect(panels.sidebar_open).toBe(true)
  })

  it('emprunte la fermeture PROPRE de chaque panneau', () => {
    const panels = make()
    const onClose = jest.fn(() => panels.close('search'))
    panels.setCloseHandler('search', onClose)
    panels.setMode('search', 'popup', { pinned: true })
    panels.closeAllPopups()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(panels.getMode('search')).toBeNull()
  })

  it('n\'ouvre pas de bascule : Échap n\'est pas un clic', () => {
    const panels = make()
    panels.setMode('config', 'popup')
    panels.closeAllPopups()
    expect(panels.consumeJustDismissed('config')).toBe(false)
  })
})

describe('#321 bascule : le clic qui referme ne rouvre pas', () => {
  it('consumeJustDismissed vaut vrai UNE fois, pour le seul id congédié', () => {
    const panels = make()
    panels.setMode('config', 'popup')
    panels.dismissTransientPopups()
    expect(panels.consumeJustDismissed('search')).toBe(false)
    expect(panels.consumeJustDismissed('config')).toBe(true)
    expect(panels.consumeJustDismissed('config')).toBe(false)
  })

  it('un nouveau congédiement remet la mémoire à zéro', () => {
    const panels = make()
    panels.setMode('config', 'popup')
    panels.dismissTransientPopups()
    panels.dismissTransientPopups()
    expect(panels.consumeJustDismissed('config')).toBe(false)
  })
})
