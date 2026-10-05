// ==================================================================================================
// sa#595 — LA VALEUR NORMALISÉE RAPPORTÉE À UNE SOMME DE FLUX DÉFINIE PAR UNE RÈGLE
// ==================================================================================================
//
// La fixture est un EXTRAIT du fichier joint à l'issue (Référentiel Coefficients SOCLE, 2026-10-05) :
// trois process et leurs voisins, avec les étiquettes du fichier entier (Type de noeud, Type de
// matière, Échange) et ses données (années × unités). Les trois cas du protocole de test :
//   1. Sucrerie (secteur) : les sorties vers des PRODUITS somment à 1, les coproduits s'expriment en
//      kt par kt de sucre ;
//   2. Farine (produit) : les débouchés INTÉRIEURS somment à 1, les exportations s'expriment par kt
//      de débouché intérieur ;
//   3. Fabrication de beurre : le coefficient du babeurre en kt n'est pas celui en kt MG.
// ==================================================================================================

import fs from 'fs'
import path from 'path'

import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'
import type { Type_JSON } from '../types/Utils'
import { format_value } from '../types/Utils'
import {
  defaultNormalizationRule, describeNormalizationNotice, normalizationNodeKind, normalizationReference,
  normalizationRulesFromJSON, normalizedValueFor, resolveNormalizationRule
} from './NormalizationRule'
import type { Type_NormalizationRule } from './NormalizationRule'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const FIXTURE = path.join(__dirname, '__fixtures__', 'sa595_referentiel_extrait.json')

const load = (mutate?: (json: Type_JSON) => void): Class_ApplicationData => {
  const json = JSON.parse(fs.readFileSync(FIXTURE, 'utf-8')) as Type_JSON
  if (mutate) mutate(json)
  const app = new Class_ApplicationData(false)
  app.fromJSON(json as never, {}, false)
  app.drawing_area.bypass_redraws = true
  return app
}

/** Une seule tranche par groupe d'étiquettes de données (bannière `one`, comme dans l'appli). */
const select = (app: Class_ApplicationData, year: string, unit: string): void => {
  const pick = (group_id: string, tag_id: string) => {
    app.drawing_area.sankey.data_taggs_dict[group_id].tags_list.forEach(tag => {
      if (tag.id === tag_id) (tag as Class_DataTag).setSelected()
      else (tag as Class_DataTag).setUnSelected()
    })
  }
  pick('annee', year)
  pick('unite', unit)
}

const nodeNamed = (app: Class_ApplicationData, name: string): Class_NodeElement => {
  const node = app.drawing_area.sankey.nodes_list.find(n => n.name === name)
  expect(node).toBeDefined()
  return node as Class_NodeElement
}

const linkBetween = (app: Class_ApplicationData, source: string, target: string): Class_LinkElement => {
  const link = app.drawing_area.sankey.links_list.find(l => l.source.name === source && l.target.name === target)
  expect(link).toBeDefined()
  return link as Class_LinkElement
}

/** La valeur normalisée d'un flux, par la règle du nœud `end` (source ou destination). */
const normalized = (link: Class_LinkElement, end: 'source' | 'target'): number | null =>
  normalizedValueFor(end === 'source' ? link.source : link.target, link.valueCurrent, link.sankey)

describe('sa#595 — la famille d un noeud et sa regle par defaut', () => {
  test('un secteur rapporte a ses sorties vers des produits', () => {
    const app = load()
    const sucrerie = nodeNamed(app, 'Sucrerie (Sucre)')
    expect(normalizationNodeKind(sucrerie)).toBe('secteur')
    expect(resolveNormalizationRule(sucrerie, app.drawing_area.sankey)).toEqual({
      side: 'outputs',
      filter: { on: 'counterpart', tag_group_id: 'type de matiere', tag_id: 'produit', negate: false }
    })
  })

  test('un produit rapporte a ses sorties hors exportations', () => {
    const app = load()
    const farine = nodeNamed(app, 'Farine (Blé tendre)')
    expect(normalizationNodeKind(farine)).toBe('produit')
    expect(resolveNormalizationRule(farine, app.drawing_area.sankey)).toEqual({
      side: 'outputs',
      filter: { on: 'link', tag_group_id: 'echange', tag_id: 'exportation', negate: true }
    })
  })

  test('sans les groupes des etudes, le defaut est toutes les sorties', () => {
    const app = load(json => {
      delete (json as { [k: string]: unknown })['fluxTags']
      const tags = (json as { nodeTags: { [k: string]: unknown } }).nodeTags
      delete tags['type de matiere']
    })
    const sankey = app.drawing_area.sankey
    expect(defaultNormalizationRule('secteur', sankey)).toEqual({ side: 'outputs', filter: null })
    expect(defaultNormalizationRule('produit', sankey)).toEqual({ side: 'outputs', filter: null })
    expect(defaultNormalizationRule('other', sankey)).toEqual({ side: 'outputs', filter: null })
  })
})

describe('sa#595 — protocole de test de l issue (2019)', () => {
  test('1. Sucrerie : les sorties vers les produits somment a 1, les coproduits en kt par kt de produit', () => {
    const app = load()
    select(app, '2019', 'kt')
    const sucrerie = nodeNamed(app, 'Sucrerie (Sucre)')
    const reference = normalizationReference(sucrerie, resolveNormalizationRule(sucrerie, app.drawing_area.sankey))

    expect(reference.reason).toBeNull()
    expect(reference.links.map(l => l.target.name)).toEqual(['Sucre (Sucre)'])
    expect(reference.value).toBeCloseTo(4342.52, 6)

    expect(normalized(linkBetween(app, 'Sucrerie (Sucre)', 'Sucre (Sucre)'), 'source')).toBeCloseTo(1, 12)
    expect(normalized(linkBetween(app, 'Sucrerie (Sucre)', 'Mélasses (Sucre)'), 'source'))
      .toBeCloseTo(1141.584599999638 / 4342.52, 12)
    // Une ENTRÉE se rapporte à la même somme : kt de betterave par kt de sucre.
    expect(normalized(linkBetween(app, 'Betteraves sucrières (Sucre)', 'Sucrerie (Sucre)'), 'target'))
      .toBeCloseTo(30041.7 / 4342.52, 12)
  })

  test('2. Farine : les debouches interieurs somment a 1, les exportations par kt de debouche interieur', () => {
    const app = load()
    select(app, '2019', 'kt')
    const farine = nodeNamed(app, 'Farine (Blé tendre)')
    const reference = normalizationReference(farine, resolveNormalizationRule(farine, app.drawing_area.sankey))
    const interieur = 0.86 + 1780 + 60.8 + 1690 + 24 + 806

    expect(reference.reason).toBeNull()
    expect(reference.links.map(l => l.target.name)).not.toContain('Exportations (Blé tendre)')
    expect(reference.value).toBeCloseTo(interieur, 6)

    const sum = reference.links.reduce((s, l) => s + (normalized(l, 'source') ?? 0), 0)
    expect(sum).toBeCloseTo(1, 12)
    expect(normalized(linkBetween(app, 'Farine (Blé tendre)', 'Exportations (Blé tendre)'), 'source'))
      .toBeCloseTo(167 / interieur, 12)
  })

  test('3. le coefficient depend de l unite affichee (kt puis kt MG)', () => {
    const app = load()
    const babeurre = () => normalized(
      linkBetween(app, 'Fabrication de beurre (Lait)', 'Babeurre (Lait)'), 'source')

    select(app, '2019', 'kt')
    const en_kt = babeurre()
    select(app, '2019', 'kt mg')
    const en_kt_mg = babeurre()

    expect(en_kt).toBeCloseTo(533.3747376894129 / 412.3730000000141, 12)
    expect(en_kt_mg).toBeCloseTo(3.842842410703284 / 345.6546882043659, 12)
  })
})

describe('sa#595 — une reference vide laisse la valeur vide, et dit pourquoi', () => {
  const t = (key: string, options?: { [k: string]: string }) =>
    key + (options ? JSON.stringify(options) : '')

  test('aucun flux ne verifie la regle', () => {
    const app = load()
    select(app, '2019', 'kt')
    const sucrerie = nodeNamed(app, 'Sucrerie (Sucre)')
    const rule: Type_NormalizationRule = {
      side: 'outputs',
      filter: { on: 'counterpart', tag_group_id: 'type de matiere', tag_id: 'intrant externe', negate: false }
    }
    const reference = normalizationReference(sucrerie, rule)
    expect(reference).toEqual({ value: null, links: [], reason: 'no_flux_matches' })
    expect(describeNormalizationNotice(reference, rule, app.drawing_area.sankey, t))
      .toContain('Flux.normalization.reason_no_flux_matches')
  })

  test('la somme de reference est nulle', () => {
    const app = load()
    select(app, '2019', 'kt mg')
    // La Sucrerie n'a pas de données en kt MG : pas de somme, donc pas de référence.
    const sucrerie = nodeNamed(app, 'Sucrerie (Sucre)')
    const reference = normalizationReference(sucrerie, resolveNormalizationRule(sucrerie, app.drawing_area.sankey))
    expect(reference.value).toBeNull()
    expect(reference.reason === 'no_value' || reference.reason === 'zero_reference').toBe(true)
  })

  test('l etiquette de valeur reste vide plutot que de dire un rapport faux', () => {
    const app = load()
    select(app, '2019', 'kt')
    const link = linkBetween(app, 'Sucrerie (Sucre)', 'Mélasses (Sucre)')
    const overrides = { is_visible: true, unit_visible: false, unit_type: 'normalized_source' } as const
    expect(format_value(app.drawing_area.type_data, link.valueCurrent, link, '', 'value_label', overrides)).not.toBe('')

    app.drawing_area.sankey.normalization_rules = {
      secteur: { side: 'inputs', filter: { on: 'link', tag_group_id: 'echange', tag_id: 'exportation', negate: false } }
    }
    expect(format_value(app.drawing_area.type_data, link.valueCurrent, link, '', 'value_label', overrides)).toBe('')
  })
})

describe('sa#595 — les regles du diagramme', () => {
  test('une regle posee pour une famille remplace son defaut', () => {
    const app = load()
    select(app, '2019', 'kt')
    app.drawing_area.sankey.normalization_rules = { secteur: { side: 'inputs', filter: null } }
    const link = linkBetween(app, 'Betteraves sucrières (Sucre)', 'Sucrerie (Sucre)')
    expect(normalized(link, 'target')).toBeCloseTo(1, 12)
  })

  test('la regle d un volet l emporte sur celle du diagramme', () => {
    const app = load()
    select(app, '2019', 'kt')
    const sankey = app.drawing_area.sankey
    sankey.normalization_rule_override = { side: 'outputs', filter: null }
    const sucrerie = nodeNamed(app, 'Sucrerie (Sucre)')
    const reference = normalizationReference(sucrerie, resolveNormalizationRule(sucrerie, sankey))
    expect(reference.links).toHaveLength(sucrerie.output_links_list.length)
  })

  test('elles s enregistrent dans le fichier, et seulement quand on en a pose', () => {
    const app = load()
    expect((app.toJSON() as { [k: string]: unknown })['normalization_rules']).toBeUndefined()

    const rules = { produit: { side: 'outputs' as const, filter: null } }
    app.drawing_area.sankey.normalization_rules = rules
    expect((app.toJSON() as { [k: string]: unknown })['normalization_rules']).toEqual(rules)

    const reloaded = load(file => { (file as { [k: string]: unknown })['normalization_rules'] = rules })
    expect(reloaded.drawing_area.sankey.normalization_rules).toEqual(rules)
  })

  test('une regle illisible retombe sur le defaut', () => {
    expect(normalizationRulesFromJSON({
      secteur: { side: 'dessus', filter: null },
      produit: { side: 'inputs', filter: { on: 'link', tag_group_id: 'echange' } },
      other: { side: 'inputs', filter: null }
    })).toEqual({ other: { side: 'inputs', filter: null } })
  })
})
