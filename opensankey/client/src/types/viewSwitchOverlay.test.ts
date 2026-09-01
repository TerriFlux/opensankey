import { createViewSwitchOverlay, VIEW_SWITCH_OVERLAY_ID } from './viewSwitchOverlay'

// os#1368 — Le voile de chargement, en DOM pur (aucun Chakra : les suites jest du dépôt ne peuvent
// pas le charger). On vérifie ce qui compte : il apparaît, il est unique, il se retire, et il ne
// vole jamais les clics.

describe('os#1368 createViewSwitchOverlay', () => {
  afterEach(() => { document.getElementById(VIEW_SWITCH_OVERLAY_ID)?.remove() })

  it('pose un voile au-dessus du conteneur du dessin, puis le retire', () => {
    const container = document.createElement('div')
    container.id = 'sankey_app'
    document.body.appendChild(container)
    const overlay = createViewSwitchOverlay(() => container)

    expect(document.getElementById(VIEW_SWITCH_OVERLAY_ID)).toBeNull()
    overlay.show()
    expect(document.getElementById(VIEW_SWITCH_OVERLAY_ID)).not.toBeNull()
    overlay.hide()
    expect(document.getElementById(VIEW_SWITCH_OVERLAY_ID)).toBeNull()

    container.remove()
  })

  it('deux show successifs ne laissent jamais deux voiles', () => {
    const overlay = createViewSwitchOverlay(() => null)
    overlay.show()
    overlay.show()
    expect(document.querySelectorAll(`#${VIEW_SWITCH_OVERLAY_ID}`)).toHaveLength(1)
    overlay.hide()
    expect(document.querySelectorAll(`#${VIEW_SWITCH_OVERLAY_ID}`)).toHaveLength(0)
  })

  it('hide sans show ne casse rien', () => {
    const overlay = createViewSwitchOverlay(() => null)
    expect(() => overlay.hide()).not.toThrow()
  })

  it('ne capte pas les clics : un voile qui fuirait resterait un artefact, pas une interface morte', () => {
    const overlay = createViewSwitchOverlay(() => null)
    overlay.show()
    const el = document.getElementById(VIEW_SWITCH_OVERLAY_ID) as HTMLElement
    expect(el.style.pointerEvents).toBe('none')
    expect(el.getAttribute('role')).toBe('status')
    expect(el.getAttribute('aria-busy')).toBe('true')
  })

  it('relit le conteneur a CHAQUE affichage : la drawing area est remplacee pendant le switch', () => {
    let asked = 0
    const overlay = createViewSwitchOverlay(() => { asked += 1; return null })
    overlay.show()
    overlay.hide()
    overlay.show()
    overlay.hide()
    expect(asked).toBe(2)
  })
})
