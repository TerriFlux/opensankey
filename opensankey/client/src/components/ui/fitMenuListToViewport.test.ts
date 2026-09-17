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

  it('repositionne une seule fois : pas de boucle quand la place ne change pas', () => {
    const { update, state } = run('bottom', { top: 380, bottom: 400 })
    expect(update).toHaveBeenCalledTimes(1)
    fitMenuListToViewport.fn({ state, instance: { update } })
    expect(update).toHaveBeenCalledTimes(1)
  })
})
