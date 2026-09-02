// Les deux boutons de DROITE de la topbar publiée — le « i » (identité du build) et la
// bascule de barre latérale — étaient rendus sans condition. Ils gagnent une option, avec
// le défaut TRUE : une page déjà en ligne ne doit rien perdre au prochain runtime.
import { getPublishOptions } from './PublishOptions'

describe('options de topbar app_info et sidebar_toggle', () => {
  afterEach(() => {
    delete window.sankey
  })

  it('sans window.sankey : les deux boutons restent visibles', () => {
    const opts = getPublishOptions()
    expect(opts.app_info).toBe(true)
    expect(opts.sidebar_toggle).toBe(true)
  })

  it('page publiée qui ne pose pas ces clés : parc existant inchangé', () => {
    window.sankey = { publish: true }
    const opts = getPublishOptions()
    expect(opts.app_info).toBe(true)
    expect(opts.sidebar_toggle).toBe(true)
  })

  it('options à false : les deux boutons sont coupés indépendamment', () => {
    window.sankey = { publish: true, app_info: false }
    expect(getPublishOptions().app_info).toBe(false)
    expect(getPublishOptions().sidebar_toggle).toBe(true)
    window.sankey = { publish: true, sidebar_toggle: false }
    expect(getPublishOptions().app_info).toBe(true)
    expect(getPublishOptions().sidebar_toggle).toBe(false)
  })

  it('valeur non booléenne : on retombe sur le défaut, jamais sur une topbar amputée', () => {
    window.sankey = { publish: true, app_info: 'non' as never, sidebar_toggle: 0 as never }
    const opts = getPublishOptions()
    expect(opts.app_info).toBe(true)
    expect(opts.sidebar_toggle).toBe(true)
  })
})
