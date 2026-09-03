import { Class_LinkValue } from './LinkValues'
import { Class_FluxTagGroup } from '../types/TagGroup'
import type { Class_LinkElement } from './Link'
import type { Class_Sankey } from '../types/Sankey'

// SA#487 — « min » / « max » comme valeur objectif dans une feuille de données.
//
// L'intention est établie par le moteur : le front ne la fabrique pas, ne
// l'interprète pas, et n'a rien à en afficher. Il n'a qu'une chose à faire, et
// elle n'est pas automatique : la RECONDUIRE. `toJSON` réécrit le dictionnaire
// d'une valeur champ par champ, donc tout champ qu'il ignore disparaît — ouvrir
// une étude dans l'application et l'enregistrer effacerait la demande, sans que
// rien ne le signale, et la réconciliation suivante rendrait de nouveau un flux
// libre avec un intervalle.

function makeEnv() {
  const flux_taggs_dict: { [_: string]: Class_FluxTagGroup } = {}
  const sankey = {
    fluxTagsUpdated: () => { /* no-op */ },
    dataTagsUpdated: () => { /* no-op */ },
    drawing_area: { legend: { draw: () => { /* no-op */ } } },
    get flux_taggs_dict() { return flux_taggs_dict },
    get flux_taggs_list() { return Object.values(flux_taggs_dict) },
  } as unknown as Class_Sankey
  const link = {
    id: 'l1',
    source: {},
    target: {},
    draw: () => { /* no-op */ },
    drawing_area: { sankey },
  } as unknown as Class_LinkElement
  return { sankey, link }
}

describe('SA#487 — l\'intention « min » / « max » survit à un enregistrement', () => {

  it('reconduit le mot-clé et son rang', () => {
    const env = makeEnv()
    const value = new Class_LinkValue(env.link)
    value.fromJSON({ data_value_objective: 'min', data_value_objective_rank: 3 })

    expect(value.value_objective).toBe('min')
    expect(value.value_objective_rank).toBe(3)

    const json = value.toJSON()
    expect(json['data_value_objective']).toBe('min')
    expect(json['data_value_objective_rank']).toBe(3)
  })

  it('n\'écrit rien quand la cellule n\'exprime aucune intention', () => {
    const env = makeEnv()
    const value = new Class_LinkValue(env.link)
    value.valueData = 42

    const json = value.toJSON()
    expect(json).not.toHaveProperty('data_value_objective')
    expect(json).not.toHaveProperty('data_value_objective_rank')
  })

  it('un fichier antérieur se relit sans intention', () => {
    const env = makeEnv()
    const value = new Class_LinkValue(env.link)
    value.fromJSON({ data_value: 12, result_value: 12 })

    expect(value.value_objective).toBeNull()
    expect(value.value_objective_rank).toBeNull()
  })

  it('la copie d\'une valeur emporte l\'intention', () => {
    const env = makeEnv()
    const source = new Class_LinkValue(env.link)
    source.fromJSON({ data_value_objective: 'max', data_value_objective_rank: 1 })

    const copy = new Class_LinkValue(env.link)
    copy.copyFrom(source)

    expect(copy.value_objective).toBe('max')
    expect(copy.value_objective_rank).toBe(1)
  })
})
