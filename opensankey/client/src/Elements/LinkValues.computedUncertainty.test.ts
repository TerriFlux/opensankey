import { Class_LinkValue } from './LinkValues'
import type { Type_JSON } from '../types/Utils'
import type { Class_LinkElement } from './Link'
import type { Class_Sankey } from '../types/Sankey'

// SA#578 — l'incertitude de chaque valeur calculée voyage dans le JSON du
// diagramme (`result_uncertainty` en %, `result_uncertainty_abs`, et
// `result_uncertainty_bound`). Le front ne la calcule pas : il doit la relire et
// la réécrire telle quelle, sans quoi elle disparaîtrait au premier
// enregistrement d'un diagramme calculé.

function makeLink() {
  const sankey = {
    fluxTagsUpdated: () => { /* no-op */ },
    dataTagsUpdated: () => { /* no-op */ },
    drawing_area: { legend: { draw: () => { /* no-op */ } } },
    flux_taggs_dict: {},
    flux_taggs_list: [],
  } as unknown as Class_Sankey
  return {
    id: 'l1',
    source: {},
    target: {},
    draw: () => { /* no-op */ },
    drawing_area: { sankey },
  } as unknown as Class_LinkElement
}

describe('SA#578 — incertitude calculée d\'une valeur de flux', () => {

  it('is read and written back as is', () => {
    const value = new Class_LinkValue(makeLink())
    value.fromJSON({
      result_value: 20,
      result_uncertainty: 64.03,
      result_uncertainty_abs: 12.806,
      result_uncertainty_bound: 'near',
    } as unknown as Type_JSON)
    expect(value.result_uncertainty).toBe(64.03)
    const json = value.toJSON()
    expect(json['result_uncertainty']).toBe(64.03)
    expect(json['result_uncertainty_abs']).toBe(12.806)
    expect(json['result_uncertainty_bound']).toBe('near')
  })

  it('keeps an infinite uncertainty as the word the engine wrote', () => {
    const value = new Class_LinkValue(makeLink())
    value.fromJSON({
      result_value: 0,
      result_uncertainty: 'infini',
      result_uncertainty_abs: 'infini',
    } as unknown as Type_JSON)
    const json = value.toJSON()
    expect(json['result_uncertainty']).toBe('infini')
    expect(json['result_uncertainty_abs']).toBe('infini')
  })

  it('writes nothing for a value that was not computed', () => {
    const value = new Class_LinkValue(makeLink())
    value.fromJSON({ data_value: 10 } as unknown as Type_JSON)
    const json = value.toJSON()
    expect(json).not.toHaveProperty('result_uncertainty')
    expect(json).not.toHaveProperty('result_uncertainty_abs')
    expect(json).not.toHaveProperty('result_uncertainty_bound')
  })
})
