import { declaresPaneValueMode } from './paneValueMode'

const withChoices = (values: string[]) => ({
  attributes: { value_mode: { ui: { choices: values.map(value => ({ value })) } } }
})

describe('sa#598 — declaresPaneValueMode', () => {
  it('vrai pour une figure dont value_mode offre pourcentage, normalise et valeur (etoile Unit.)', () => {
    expect(declaresPaneValueMode(withChoices(['percent', 'value', 'normalized']))).toBe(true)
  })

  it('faux pour la couronne, dont value_mode est la valeur du secteur parent', () => {
    expect(declaresPaneValueMode(withChoices(['sum', 'declared']))).toBe(false)
  })

  it('faux sans choix declares, sans cle ou sans nature', () => {
    expect(declaresPaneValueMode({ attributes: { value_mode: {} } })).toBe(false)
    expect(declaresPaneValueMode({ attributes: {} })).toBe(false)
    expect(declaresPaneValueMode(undefined)).toBe(false)
  })
})
