// sa#397 — options de publication `view` / `view_label` lues au démarrage du viewer.
// `view` ouvre sur une vue (id OU nom) ; `view_label` restreint le sélecteur aux vues
// portant ce LABEL DE VUE (sa#396 — étiquettes de sélection, PAS les viewTags générateurs).
// Doctrine additive : sans l'option, rien ne change ; valeur invalide → null (ignorée).
import { getPublishOptions, applyViewerOptions } from './PublishOptions'

describe('sa#397 getPublishOptions — view / view_label', () => {
  afterEach(() => {
    delete window.sankey
  })

  it('sans window.sankey : view et view_label valent null (comportement inchangé)', () => {
    const opts = getPublishOptions()
    expect(opts.view).toBeNull()
    expect(opts.view_label).toBeNull()
  })

  it('page publiée sans ces options : null (doctrine additive)', () => {
    window.sankey = { publish: true }
    const opts = getPublishOptions()
    expect(opts.view).toBeNull()
    expect(opts.view_label).toBeNull()
  })

  it('options posées : relues telles quelles', () => {
    window.sankey = { publish: true, view: 'v1', view_label: 'Résultats' }
    const opts = getPublishOptions()
    expect(opts.view).toBe('v1')
    expect(opts.view_label).toBe('Résultats')
  })

  it('valeurs non-string : ignorées (null), pas d\'écran cassé', () => {
    window.sankey = { publish: true, view: 42 as never, view_label: ['a'] as never }
    const opts = getPublishOptions()
    expect(opts.view).toBeNull()
    expect(opts.view_label).toBeNull()
  })

  it('applyViewerOptions : les props viewer view / view_label arrivent dans window.sankey', () => {
    applyViewerOptions({ view: 'Ma Vue', view_label: 'Méthode' })
    expect(window.sankey?.view).toBe('Ma Vue')
    expect(window.sankey?.view_label).toBe('Méthode')
    // Et getPublishOptions les relit.
    const opts = getPublishOptions()
    expect(opts.view).toBe('Ma Vue')
    expect(opts.view_label).toBe('Méthode')
  })
})
