import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTag, Class_FluxTag, Class_Tag } from './Tag'
import type { Class_FluxTagGroup } from './TagGroup'
import type { Type_JSON } from './Utils'
import {
  RULE_QUANTITY_COMPUTED_RELATIVE_UNCERTAINTY, parseAssignmentRule, resolveRuleTag, serializeAssignmentRule
} from './TagAssignmentRule'

// jest 27/jsdom n'expose pas structuredClone (utilisé par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/**
 * SA#580 — groupe d'étiquettes de flux « attribué par règles », sur de vraies classes.
 *
 * Grandeur v1 : l'incertitude relative calculée (SA#578). Chaque étiquette porte un seuil haut ;
 * les étiquettes, dans leur ordre, découpent la grandeur en tranches, la dernière ouverte. Le port
 * se calcule sur la VALEUR AFFICHÉE (année, unité), ne s'écrit jamais sur les éléments ; une valeur
 * inconnue tombe dans la dernière tranche, une valeur sans grandeur dans « Sans [groupe] ».
 */
const SEUILS: [string, number | undefined][] = [
  ['Fiable', 10], ['Robuste', 20], ['Probable', 35], ['Approximative', 50], ['Indicative', undefined]
]

function makeLait() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const collecte = sankey.addNewNodeWithName('Collecte')
  const laiteries = sankey.addNewNodeWithName('Laiteries')
  const link = sankey.addNewLink(collecte, laiteries)
  const annee = sankey.addDataTagGroup('annee', 'Année', false)
  const y2019 = annee.addTag('2019', 'y2019') as Class_DataTag
  const y2020 = annee.addTag('2020', 'y2020') as Class_DataTag
  const selectYear = (year: Class_DataTag) => {
    year.setSelected()
    ;(year === y2019 ? y2020 : y2019).setUnSelected()
  }
  selectYear(y2019)
  // Valeurs calculées : 100 ± 5 % en 2019, 110 ± 25 % en 2020
  link.valueForTag(y2019)!.fromJSON({ data_value: 100, result_value: 100, result_uncertainty: 5 })
  link.valueForTag(y2020)!.fromJSON({ data_value: 110, result_value: 110, result_uncertainty: 25 })
  const fiabilite = sankey.addFluxTagGroup('fiabilite', 'Fiabilité', false) as Class_FluxTagGroup
  const tags: { [_: string]: Class_FluxTag } = {}
  SEUILS.forEach(([name, seuil]) => {
    const tag = fiabilite.addTag(name, name.toLowerCase()) as Class_FluxTag
    tag.rule_upper_bound = seuil
    tags[name] = tag
  })
  const setUncertainty = (year: Class_DataTag, json: Type_JSON) =>
    link.valueForTag(year)!.fromJSON({ data_value: 100, result_value: 100, ...json })
  return { app, sankey, link, y2019, y2020, selectYear, fiabilite, tags, setUncertainty }
}

const makeRuleBased = () => {
  const ctx = makeLait()
  ctx.fiabilite.assignment_rule = { quantity: RULE_QUANTITY_COMPUTED_RELATIVE_UNCERTAINTY }
  return ctx
}

describe('SA#580 — règle pure', () => {
  const tags = SEUILS.map(([name, rule_upper_bound]) => ({ name, rule_upper_bound }))
  const nameOf = (q: number | undefined) => resolveRuleTag(q, tags)?.name

  it('tranches [seuil précédent ; seuil[, la dernière ouverte', () => {
    expect(nameOf(0)).toBe('Fiable')
    expect(nameOf(9.99)).toBe('Fiable')
    expect(nameOf(10)).toBe('Robuste')
    expect(nameOf(34.9)).toBe('Probable')
    expect(nameOf(50)).toBe('Indicative')
    expect(nameOf(400)).toBe('Indicative')
  })

  it('inconnue (infinie) = dernière tranche ; sans grandeur = aucune étiquette', () => {
    expect(nameOf(Number.POSITIVE_INFINITY)).toBe('Indicative')
    expect(nameOf(undefined)).toBeUndefined()
    expect(resolveRuleTag(5, [])).toBeUndefined()
  })

  it('dernière tranche bornée : une grandeur au-delà y tombe quand même', () => {
    const bornees = [{ rule_upper_bound: 10 }, { rule_upper_bound: 50 }]
    expect(resolveRuleTag(80, bornees)).toBe(bornees[1])
    expect(resolveRuleTag(Number.POSITIVE_INFINITY, bornees)).toBe(bornees[1])
  })

  it('format de la règle : sans grandeur, pas de règle ; clés inconnues gardées', () => {
    expect(parseAssignmentRule(undefined)).toBeUndefined()
    expect(parseAssignmentRule({})).toBeUndefined()
    expect(parseAssignmentRule('x')).toBeUndefined()
    const rule = parseAssignmentRule({ quantity: 'flux_share', of: 'outputs' })
    expect(rule).toEqual({ quantity: 'flux_share', extras: { of: 'outputs' } })
    expect(serializeAssignmentRule(rule)).toEqual({ quantity: 'flux_share', of: 'outputs' })
  })
})

describe('SA#580 — port calculé sur la valeur affichée', () => {
  it('groupe ordinaire tant qu il n a pas de règle', () => {
    const { link, fiabilite, tags } = makeLait()
    expect(fiabilite.is_rule_based).toBe(false)
    expect(link.hasGivenTag(tags['Fiable'])).toBe(false)
    expect(link.hasGivenTag(fiabilite.untagged_tag!)).toBe(true)
  })

  it('chaque valeur porte l étiquette de sa tranche ; changer d année la change', () => {
    const { link, y2020, selectYear, fiabilite, tags } = makeRuleBased()
    expect(link.hasGivenTag(tags['Fiable'])).toBe(true)
    expect(link.hasGivenTag(tags['Probable'])).toBe(false)
    expect(link.hasGivenTag(fiabilite.untagged_tag!)).toBe(false)
    expect(link.flux_tags_list.map(t => t.id)).toEqual(['fiable'])
    expect(link.flux_taggs_list.map(g => g.id)).toEqual(['fiabilite'])
    selectYear(y2020)
    expect(link.hasGivenTag(tags['Fiable'])).toBe(false)
    expect(link.hasGivenTag(tags['Probable'])).toBe(true)
    expect(link.flux_tags_list.map(t => t.id)).toEqual(['probable'])
  })

  it('valeur inconnue (« infini ») : dernière tranche ; flux nul ou non calculé : « Sans … »', () => {
    const { link, y2019, fiabilite, tags, setUncertainty } = makeRuleBased()
    setUncertainty(y2019, { result_uncertainty: 'infini' })
    expect(link.hasGivenTag(tags['Indicative'])).toBe(true)
    setUncertainty(y2019, { result_value: 0, result_uncertainty: 'infini' })
    expect(link.hasGivenTag(tags['Indicative'])).toBe(false)
    expect(link.hasGivenTag(fiabilite.untagged_tag!)).toBe(true)
    setUncertainty(y2019, {})
    expect(link.hasGivenTag(fiabilite.untagged_tag!)).toBe(true)
    expect(link.flux_tags_list).toHaveLength(0)
  })

  it('grandeur inconnue de ce front (fichier plus récent) : tous les flux « Sans … »', () => {
    const { link, fiabilite } = makeLait()
    fiabilite.assignment_rule = { quantity: 'flux_share' }
    expect(fiabilite.is_rule_based).toBe(true)
    expect(link.hasGivenTag(fiabilite.untagged_tag!)).toBe(true)
  })

  it('changer un seuil ré-étiquette sans calcul', () => {
    const { link, y2019, tags, setUncertainty } = makeRuleBased()
    setUncertainty(y2019, { result_uncertainty: 15 })
    expect(link.hasGivenTag(tags['Robuste'])).toBe(true)
    tags['Fiable'].rule_upper_bound = 20
    expect(link.hasGivenTag(tags['Fiable'])).toBe(true)
    expect(link.hasGivenTag(tags['Robuste'])).toBe(false)
  })

  it('ne s affecte pas à la main ; les affectations d avant la règle ne comptent plus, et reviennent sans elle', () => {
    const { link, y2019, fiabilite, tags } = makeLait()
    const value = link.valueForTag(y2019)!
    value.addTag(tags['Indicative'])
    fiabilite.assignment_rule = { quantity: RULE_QUANTITY_COMPUTED_RELATIVE_UNCERTAINTY }
    expect(link.hasGivenTag(tags['Indicative'])).toBe(false)
    expect(link.hasGivenTag(tags['Fiable'])).toBe(true)
    expect(link.flux_tags_list.map(t => t.id)).toEqual(['fiable'])
    value.addTag(tags['Probable'])
    expect(value.flux_tags_list.map(t => t.id)).toEqual(['indicative'])
    expect(tags['Probable'].references).toHaveLength(0)
    // Jamais écrites, ni calculées ni affectées
    expect(value.toJSON()['tags']).toBeUndefined()
    fiabilite.assignment_rule = undefined
    expect(link.hasGivenTag(tags['Indicative'])).toBe(true)
    expect(link.hasGivenTag(tags['Fiable'])).toBe(false)
  })
})

describe('SA#580 — filtres', () => {
  it('désélectionner une tranche masque ses flux, à l année affichée', () => {
    const { link, y2020, selectYear, tags } = makeRuleBased()
    tags['Fiable'].setUnSelected()
    expect(link.are_related_flux_tags_selected).toBe(false)
    // Sans autre signal que le changement d'année : la mémoire de visibilité doit le voir
    selectYear(y2020)
    expect(link.are_related_flux_tags_selected).toBe(true)
  })

  it('désélectionner « Sans … » masque les flux sans grandeur', () => {
    const { link, y2019, fiabilite, setUncertainty } = makeRuleBased()
    fiabilite.untagged_tag!.setUnSelected()
    expect(link.are_related_flux_tags_selected).toBe(true)
    setUncertainty(y2019, {})
    fiabilite.ruleConfigUpdated()
    expect(link.are_related_flux_tags_selected).toBe(false)
  })
})

describe('SA#580 — format', () => {
  it('groupe ordinaire : aucune clé nouvelle', () => {
    const { sankey } = makeLait()
    const source = sankey.addFluxTagGroup('source', 'Source', false)
    source.addTag('Agreste', 'agreste')
    const json = source.toJSON()
    expect(json['assignment_rule']).toBeUndefined()
    expect((json['tags'] as Type_JSON)['agreste']).not.toHaveProperty('rule_upper_bound')
  })

  it('aller-retour JSON, recopie, et retour au groupe ordinaire sans résurgence', () => {
    const { sankey, fiabilite } = makeRuleBased()
    const json = fiabilite.toJSON()
    expect(json['assignment_rule']).toEqual({ quantity: RULE_QUANTITY_COMPUTED_RELATIVE_UNCERTAINTY })
    const tags_json = json['tags'] as { [_: string]: Type_JSON }
    expect(tags_json['fiable']['rule_upper_bound']).toBe(10)
    expect(tags_json['indicative']).not.toHaveProperty('rule_upper_bound')

    const reloaded = sankey.addFluxTagGroup('copie', 'Copie', false) as Class_FluxTagGroup
    reloaded.fromJSON(json)
    expect(reloaded.assignment_rule).toEqual({ quantity: RULE_QUANTITY_COMPUTED_RELATIVE_UNCERTAINTY })
    expect(reloaded.tags_list.map(t => (t as Class_FluxTag).rule_upper_bound)).toEqual([10, 20, 35, 50, undefined])

    const other = sankey.addFluxTagGroup('autre', 'Autre', false) as Class_FluxTagGroup
    other.copyFrom(fiabilite)
    expect(other.is_rule_based).toBe(true)
    expect(other.tags_list.map(t => (t as Class_FluxTag).rule_upper_bound)).toEqual([10, 20, 35, 50, undefined])

    // Un JSON de groupe complet sans la clé = groupe ordinaire
    const without_rule = { ...json }
    delete without_rule['assignment_rule']
    reloaded.fromJSON(without_rule)
    expect(reloaded.is_rule_based).toBe(false)

    fiabilite.assignment_rule = undefined
    ;(fiabilite.tags_list[0] as Class_FluxTag).rule_upper_bound = undefined
    const cleared = fiabilite.toJSON()
    expect(cleared['assignment_rule']).toBeUndefined()
    expect((cleared['tags'] as { [_: string]: Type_JSON })['fiable']).not.toHaveProperty('rule_upper_bound')
  })

  it('les étiquettes calculées ne s écrivent pas dans les valeurs ; les autres groupes si', () => {
    const { sankey, link, y2019 } = makeRuleBased()
    const source = sankey.addFluxTagGroup('source', 'Source', false)
    const agreste = source.addTag('Agreste', 'agreste') as Class_Tag
    link.valueForTag(y2019)!.addTag(agreste)
    expect(link.valueForTag(y2019)!.toJSON()['tags']).toEqual({ source: ['agreste'] })
  })
})
