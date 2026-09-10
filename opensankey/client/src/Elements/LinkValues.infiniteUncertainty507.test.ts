import { Class_LinkValue, parseValueObjective, parseInfinity } from './LinkValues'
import { Class_FluxTagGroup } from '../types/TagGroup'
import type { Class_LinkElement } from './Link'
import type { Class_Sankey } from '../types/Sankey'

// SA#507 — la valeur objectif s'écrit « une valeur, et une incertitude
// infinie ».
//
// Une incertitude infinie est une valeur qui ne contraint rien — donc pas une
// mesure, un souhait. La valeur en regard dit quoi viser : un nombre (la
// cible), ou « infini » / « -infini » pour la plus grande / la plus petite
// valeur possible. SA#487 avait d'abord écrit cela avec deux mots-clés, « min »
// et « max », posés dans la case Valeur : ils sont SUPPRIMÉS (2026-09-10), car
// ils ne savaient pas dire une cible et qu'une seule étude les portait.
//
// Le front ne calcule rien de tout cela : il RECONDUIT. `toJSON` réécrit le
// dictionnaire d'une valeur champ par champ, donc un champ qu'il ignore
// disparaît — ouvrir une étude dans l'application et l'enregistrer effacerait
// la cible, sans que rien ne le signale. C'est ce que ces tests verrouillent,
// plus la garde qui empêche « infini » de redevenir un nombre.

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

describe('SA#507 — la cible survit à un enregistrement', () => {

  it('reconduit la cible', () => {
    const env = makeEnv()
    const value = new Class_LinkValue(env.link)
    value.fromJSON({
      data_value_objective: 'target',
      data_value_objective_rank: 0,
      data_value_objective_target: 120,
    })

    expect(value.value_objective).toBe('target')
    expect(value.value_objective_target).toBe(120)

    const json = value.toJSON()
    expect(json['data_value_objective']).toBe('target')
    expect(json['data_value_objective_target']).toBe(120)
  })

  it('une cible de zéro est reconduite, et non prise pour une absence', () => {
    // Le piège du champ falsy (cf. #373, plancher à 0 perdu) : zéro EST la
    // cible d'un flux d'équilibrage, c'est même le cas le plus courant.
    const env = makeEnv()
    const value = new Class_LinkValue(env.link)
    value.fromJSON({
      data_value_objective: 'target',
      data_value_objective_target: 0,
    })

    expect(value.value_objective_target).toBe(0)
    expect(value.toJSON()['data_value_objective_target']).toBe(0)
  })

  it('une intention de direction n\'a pas de cible', () => {
    // « la plus petite valeur possible » ne vise rien : elle pousse dans un
    // sens. C'est l'infini écrit dans la case Valeur, jamais un nombre.
    const env = makeEnv()
    const value = new Class_LinkValue(env.link)
    value.fromJSON({ data_value_objective: 'min', data_value_objective_rank: 1 })

    expect(value.value_objective_target).toBeNull()
    const json = value.toJSON()
    expect(json).not.toHaveProperty('data_value_objective_target')
  })

  it('la copie d\'une valeur emporte la cible', () => {
    // Même leçon que #385 : ce qu'un constructeur de copie ignore disparaît en
    // silence, et le défaut ne se voit qu'à la valeur produite.
    const env = makeEnv()
    const source = new Class_LinkValue(env.link)
    source.fromJSON({
      data_value_objective: 'target',
      data_value_objective_target: 120,
    })
    const copy = new Class_LinkValue(env.link)
    copy.copyFrom(source)

    expect(copy.value_objective).toBe('target')
    expect(copy.value_objective_target).toBe(120)
  })
})

describe('SA#507 — « infini » est une intention, jamais un nombre', () => {

  it('reconnaît les orthographes de l\'infini, avec leur signe', () => {
    expect(parseInfinity('infini')).toBe(1)
    expect(parseInfinity('  INFINI ')).toBe(1)
    expect(parseInfinity('inf')).toBe(1)
    expect(parseInfinity('∞')).toBe(1)
    expect(parseInfinity('+infinity')).toBe(1)
    expect(parseInfinity('-infini')).toBe(-1)
    expect(parseInfinity('12')).toBe(0)
    expect(parseInfinity('')).toBe(0)
    expect(parseInfinity(null)).toBe(0)
  })

  it('« infini » dans la case Valeur vaut « max », et « -infini » vaut « min »', () => {
    // La sentinelle MAX_VALUE (1e15) passée telle quelle à un solveur lui
    // faisait déclarer « non borné » un problème borné (SA#487). Le mot est donc
    // lu comme une intention et ne devient jamais une borne numérique.
    expect(parseValueObjective('infini')).toBe('max')
    expect(parseValueObjective('∞')).toBe('max')
    expect(parseValueObjective('-infini')).toBe('min')
  })

  it('les mots-clés d\'hier ne sont plus des intentions', () => {
    // Supprimés le 2026-09-10 : une seule étude les portait, et deux écritures
    // d'une même chose valaient moins qu'une seule qui sait aussi dire une cible.
    expect(parseValueObjective('min')).toBeNull()
    expect(parseValueObjective('Maximum')).toBeNull()
    expect(parseValueObjective('120')).toBeNull()
    expect(parseValueObjective('bonjour')).toBeNull()
  })
})
