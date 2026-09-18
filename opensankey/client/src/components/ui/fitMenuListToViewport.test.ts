import { fitMenuListToViewport } from './MenuWidgets'

// #555 — la liste d'un OSMultiSelect est bornée à la place disponible du côté où elle s'ouvre.
describe('fitMenuListToViewport', () => {
  const run = (placement: string, button: { top: number, bottom: number }) => {
    const popper = document.createElement('div')
    const update = jest.fn()
    const state = {
      placement,
      elements: { reference: { getBoundingClientRect: () => ({ ...button } as DOMRect) }, popper }
    }
    fitMenuListToViewport.fn({ state, instance: { update } })
    return { max_h: popper.style.getPropertyValue('--os-menu-select-max-h'), update, state }
  }

  beforeEach(() => { Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true }) })

  it('ouverte vers le bas : place sous le bouton', () => {
    expect(run('bottom-start', { top: 380, bottom: 400 }).max_h).toBe('384px')
  })

  it('ouverte vers le haut : place au-dessus du bouton', () => {
    expect(run('top', { top: 500, bottom: 520 }).max_h).toBe('484px')
  })

  it('ouverte sur le côté : hauteur de la fenêtre', () => {
    expect(run('right-start', { top: 500, bottom: 520 }).max_h).toBe('784px')
  })

  it('bouton collé au bord : hauteur plancher, la liste défile', () => {
    expect(run('bottom', { top: 770, bottom: 790 }).max_h).toBe('80px')
  })

  // #555 — garde-fou : une place disponible qui change à chaque passage (la borne de hauteur fait
  // rebasculer Popper d'un côté à l'autre du bouton) ne doit jamais tourner en rond. C'est ce
  // va-et-vient qui figeait l'appli sur une liste longue.
  it('place instable : le nombre de repositionnements reste borné', () => {
    const popper = document.createElement('div')
    const update = jest.fn()
    let pass = 0
    const state = {
      placement: 'bottom',
      elements: {
        reference: { getBoundingClientRect: () => ({ top: 100, bottom: 200 + (pass++ % 2) * 300 } as DOMRect) },
        popper
      }
    }
    for (let i = 0; i < 50; i++) fitMenuListToViewport.fn({ state, instance: { update } })
    expect(update).toHaveBeenCalledTimes(3)
  })

  it('repositionne une seule fois : pas de boucle quand la place ne change pas', () => {
    const { update, state } = run('bottom', { top: 380, bottom: 400 })
    expect(update).toHaveBeenCalledTimes(1)
    fitMenuListToViewport.fn({ state, instance: { update } })
    expect(update).toHaveBeenCalledTimes(1)
  })
})

// #555 — deux pièges ont fait tomber ce réglage en silence avant d'être vus au navigateur :
// une valeur numérique nulle est écartée par Chakra, et un raccourci (`minW`) ne remplace pas
// la forme longue du style de base (`minWidth`) — les deux se retrouvaient dans la règle, et
// `inherit` l'emportait. D'où ce contrôle sur la valeur exacte portée par la variante.
describe('variantes de menu du thème', () => {
  const variants = () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { opensankey_theme } = require('../../css/Theme')
    return opensankey_theme.components.Menu.variants
  }

  it.each(['menu_select_elements', 'menu_select_style'])('%s : la largeur minimale est remise à zéro', name => {
    const list = variants()[name].list
    expect(list.minWidth).toBe('0px')
    expect(list.minW).toBeUndefined()
    expect(list.maxW).toBe('min(28rem, calc(100vw - 1rem))')
    expect(list.maxH).toBe('min(var(--os-menu-select-max-h, 100vh), calc(100vh - 2rem))')
  })
})
