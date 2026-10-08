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
import { displayedNameOf } from '../Elements/ElementNaming'
import {
  defaultNormalizationRule, describeNormalizationReference, normalizationNodeKind, normalizationReference,
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
  // sa#616 — la règle commune remplace la priorité de sa#607 (produit d'abord).
  test('un secteur rapporte a ses sorties (sinon entrees) vers des matieres premieres, produits, coproduits, sinon au total', () => {
    const app = load()
    const sucrerie = nodeNamed(app, 'Sucrerie (Sucre)')
    expect(normalizationNodeKind(sucrerie)).toBe('secteur')
    expect(resolveNormalizationRule(sucrerie, app.drawing_area.sankey)).toEqual({
      side: 'outputs_else_inputs',
      filter: {
        on: 'counterpart',
        tag_group_id: 'type de matiere',
        tag_ids: ['matiere premiere', 'produit', 'coproduit'],
        negate: false,
        else_all: true
      }
    })
  })

  test('un produit rapporte a ses sorties hors exportations', () => {
    const app = load()
    const farine = nodeNamed(app, 'Farine (Blé tendre)')
    expect(normalizationNodeKind(farine)).toBe('produit')
    expect(resolveNormalizationRule(farine, app.drawing_area.sankey)).toEqual({
      side: 'outputs',
      filter: { on: 'link', tag_group_id: 'echange', tag_ids: ['exportation'], negate: true }
    })
  })

  test('sans les groupes des etudes, le defaut est toutes les sorties (sinon les entrees, hors marche)', () => {
    const app = load(json => {
      delete (json as { [k: string]: unknown })['fluxTags']
      const tags = (json as { nodeTags: { [k: string]: unknown } }).nodeTags
      delete tags['type de matiere']
    })
    const sankey = app.drawing_area.sankey
    expect(defaultNormalizationRule('secteur', sankey)).toEqual({ side: 'outputs_else_inputs', filter: null })
    expect(defaultNormalizationRule('produit', sankey)).toEqual({ side: 'outputs', filter: null })
    expect(defaultNormalizationRule('other', sankey)).toEqual({ side: 'outputs_else_inputs', filter: null })
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
      filter: { on: 'counterpart', tag_group_id: 'type de matiere', tag_ids: ['intrant externe'], negate: false }
    }
    const reference = normalizationReference(sucrerie, rule)
    expect(reference).toEqual({
      value: null, links: [], reason: 'no_flux_matches', tag_id: null, skipped_tag_ids: [],
      side: 'outputs', side_fell_back: false, all_fallback: false
    })
    expect(describeNormalizationReference(reference, sucrerie, displayedNameOf, t))
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
      secteur: { side: 'inputs', filter: { on: 'link', tag_group_id: 'echange', tag_ids: ['exportation'], negate: false } }
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

// ==================================================================================================
// sa#607 — LA RÉFÉRENCE SUIT UNE PRIORITÉ D'ÉTIQUETTES
// ==================================================================================================
//
// Fixture : extrait du fichier joint à l'issue (Référentiel Coefficients SOCLE, 2026-10-06) — deux
// organismes stockeurs, qui ne sortent que des matières premières et des coproduits, et la
// fabrication de babeurre concentré, qui ne sort qu'un coproduit et un rejet. Les nombres attendus
// sont ceux du protocole de test, qui sont ceux du classeur du référentiel (`PRIORITE_SECTEUR`).

const FIXTURE_607 = path.join(__dirname, '__fixtures__', 'sa607_referentiel_extrait.json')

const load607 = (): Class_ApplicationData => {
  const json = JSON.parse(fs.readFileSync(FIXTURE_607, 'utf-8')) as Type_JSON
  const app = new Class_ApplicationData(false)
  app.fromJSON(json as never, {}, false)
  app.drawing_area.bypass_redraws = true
  return app
}

const t607 = (key: string, options?: { [k: string]: string }) => key + (options ? JSON.stringify(options) : '')

describe('sa#607 — protocole de test de l issue (kt)', () => {
  // sa#616 — les matières premières sont désormais le premier choix : mêmes nombres, rien de sauté.
  test('1. OS (Blé tendre) 2023 : la reference est les matieres premieres', () => {
    const app = load607()
    select(app, '2023', 'kt')
    const os = nodeNamed(app, 'OS (Blé tendre)')
    const reference = normalizationReference(os, resolveNormalizationRule(os, app.drawing_area.sankey))
    const ref = 31100 + 2430
    expect(reference.reason).toBeNull()
    expect(reference.tag_id).toBe('matiere premiere')
    expect(reference.skipped_tag_ids).toEqual([])
    expect(reference.value).toBeCloseTo(ref, 9)

    expect(normalized(linkBetween(app, 'OS (Blé tendre)', 'Grains collectés (Blé tendre)'), 'source')).toBeCloseTo(31100 / ref, 12)
    expect(normalized(linkBetween(app, 'OS (Blé tendre)', 'Grains collectés (Blé tendre)'), 'source')).toBeCloseTo(0.928, 3)
    expect(normalized(linkBetween(app, 'OS (Blé tendre)', 'Stock final (Blé tendre)'), 'source')).toBeCloseTo(0.072, 3)
    expect(normalized(linkBetween(app, 'OS (Blé tendre)', 'Issues de silo (Blé tendre)'), 'source')).toBeCloseTo(0.003, 3)
    expect(normalized(linkBetween(app, 'Grains récoltés (Blé tendre)', 'OS (Blé tendre)'), 'target')).toBeCloseTo(0.951, 3)
    expect(normalized(linkBetween(app, 'Stock initial (Blé tendre)', 'OS (Blé tendre)'), 'target')).toBeCloseTo(0.053, 3)
    // Les flux de référence somment à 1.
    expect(reference.links.reduce((s, l) => s + (normalized(l, 'source') ?? 0), 0)).toBeCloseTo(1, 12)
  })

  test('2. Fabrication de babeurre concentré 2023 : la reference est les coproduits', () => {
    const app = load607()
    select(app, '2023', 'kt')
    const fab = nodeNamed(app, 'Fabrication de babeurre concentré (Lait)')
    const reference = normalizationReference(fab, resolveNormalizationRule(fab, app.drawing_area.sankey))
    expect(reference.tag_id).toBe('coproduit')
    expect(reference.skipped_tag_ids).toEqual(['matiere premiere', 'produit'])
    expect(normalized(linkBetween(app, 'Fabrication de babeurre concentré (Lait)', 'Babeurre concentré (Lait)'), 'source'))
      .toBeCloseTo(1, 12)
    expect(normalized(linkBetween(app, 'Fabrication de babeurre concentré (Lait)', 'Eau - Générée (Lait)'), 'source'))
      .toBeCloseTo(4.477, 3)
    expect(normalized(linkBetween(app, 'Babeurre (Lait)', 'Fabrication de babeurre concentré (Lait)'), 'target'))
      .toBeCloseTo(5.477, 3)
  })

  test('3. Sucrerie : la reference reste les produits', () => {
    const app = load()
    select(app, '2019', 'kt')
    const sucrerie = nodeNamed(app, 'Sucrerie (Sucre)')
    const rule = resolveNormalizationRule(sucrerie, app.drawing_area.sankey)
    const reference = normalizationReference(sucrerie, rule)
    expect(reference.tag_id).toBe('produit')
    expect(reference.skipped_tag_ids).toEqual(['matiere premiere'])
    expect(reference.links.map(l => l.target.name)).toEqual(['Sucre (Sucre)'])
  })

  test('4. OS (Epeautre) 2015 : toutes les sorties sont nulles, avis et pas de valeur', () => {
    const app = load607()
    select(app, '2015', 'kt')
    const os = nodeNamed(app, 'OS (Epeautre)')
    const rule = resolveNormalizationRule(os, app.drawing_area.sankey)
    const reference = normalizationReference(os, rule)
    expect(reference.value).toBeNull()
    // Des flux à 0 ne se dessinent pas : le côté est vide à l'écran, c'est ce que l'avis dit.
    expect(reference.reason).not.toBeNull()
    expect(normalized(linkBetween(app, 'OS (Epeautre)', 'Grains collectés (Epeautre)'), 'source')).toBeNull()
    expect(describeNormalizationReference(reference, os, displayedNameOf, t607))
      .toContain('Flux.normalization.reference_none{')
  })

  test('5. l ordre de la liste decide : coproduits avant matieres premieres', () => {
    const app = load607()
    select(app, '2023', 'kt')
    app.drawing_area.sankey.normalization_rule_override = {
      side: 'outputs',
      filter: { on: 'counterpart', tag_group_id: 'type de matiere', tag_ids: ['coproduit', 'matiere premiere'], negate: false }
    }
    expect(normalized(linkBetween(app, 'OS (Blé tendre)', 'Issues de silo (Blé tendre)'), 'source')).toBeCloseTo(1, 12)
    expect(normalized(linkBetween(app, 'OS (Blé tendre)', 'Grains collectés (Blé tendre)'), 'source'))
      .toBeCloseTo(31100 / 112, 9)
  })
})

describe('sa#607 — la priorite se tranche par annee et par unite, et se dit', () => {
  test('OS (Epeautre) : matieres premieres en 2023, rien en 2015', () => {
    const app = load607()
    const os = nodeNamed(app, 'OS (Epeautre)')
    const reference = () => normalizationReference(os, resolveNormalizationRule(os, app.drawing_area.sankey))
    select(app, '2023', 'kt')
    expect(reference().tag_id).toBe('matiere premiere')
    select(app, '2015', 'kt')
    expect(reference().tag_id).toBeNull()
  })

  test('la note nomme le flux qui a servi', () => {
    const app = load607()
    select(app, '2023', 'kt')
    const fab = nodeNamed(app, 'Fabrication de babeurre concentré (Lait)')
    const rule = resolveNormalizationRule(fab, app.drawing_area.sankey)
    expect(describeNormalizationReference(normalizationReference(fab, rule), fab, n => n.name, t607))
      .toBe('Flux.normalization.reference_note{"flows":"Babeurre concentré (Lait)"}')
  })

  test('une regle a une seule etiquette (tag_id) se relit comme une liste a un element', () => {
    expect(normalizationRulesFromJSON({
      secteur: { side: 'outputs', filter: { on: 'counterpart', tag_group_id: 'type de matiere', tag_id: 'produit' } }
    })).toEqual({
      secteur: { side: 'outputs', filter: { on: 'counterpart', tag_group_id: 'type de matiere', tag_ids: ['produit'], negate: false } }
    })
  })

  test('une liste s enregistre et se relit dans son ordre', () => {
    const rules = {
      secteur: {
        side: 'outputs' as const,
        filter: { on: 'counterpart' as const, tag_group_id: 'type de matiere', tag_ids: ['coproduit', 'produit'], negate: false }
      }
    }
    expect(normalizationRulesFromJSON(JSON.parse(JSON.stringify(rules)))).toEqual(rules)
    expect(normalizationRulesFromJSON({
      secteur: { side: 'outputs', filter: { on: 'counterpart', tag_group_id: 'type de matiere', tag_ids: [] } }
    })).toEqual({})
  })
})

// ==================================================================================================
// sa#616 — MARCHÉ À DEUX FACES = DÉBOUCHÉS INTÉRIEURS ; SINON MATIÈRES PREMIÈRES > PRODUITS >
// COPRODUITS > TOTAL, SUR LES ENTRÉES S'IL N'Y A PAS DE SORTIE
// ==================================================================================================
//
// Fixture : extrait du fichier joint à l'issue (Référentiel Coefficients SOCLE, 2026-10-08) — les
// cinq process du protocole et leurs voisins, plus « Conditionnement de lait », secteur que le
// référentiel classe en marché. Les nombres attendus sont ceux du protocole, qui sont ceux du
// classeur du référentiel (`build_referentiel_excel.py`, `PRIORITE`).

const FIXTURE_616 = path.join(__dirname, '__fixtures__', 'sa616_referentiel_extrait.json')

const load616 = (): Class_ApplicationData => {
  const json = JSON.parse(fs.readFileSync(FIXTURE_616, 'utf-8')) as Type_JSON
  const app = new Class_ApplicationData(false)
  app.fromJSON(json as never, {}, false)
  app.drawing_area.bypass_redraws = true
  select(app, '2023', 'kt')
  return app
}

/** La désignation du référentiel : « Type de process » = « Marché ». */
const MARKET_616 = { tag_group_id: 'type de process', tag_ids: ['marche'] }

/** La référence de `name` sous la règle du diagramme, la famille lue sur « Type de process ». */
const reference616 = (app: Class_ApplicationData, name: string) => {
  const node = nodeNamed(app, name)
  const rule = resolveNormalizationRule(node, app.drawing_area.sankey, null, MARKET_616)
  return { node, rule, reference: normalizationReference(node, rule) }
}

/** La valeur normalisée d'un flux de `center`, sous la règle résolue pour lui. */
const normalized616 = (app: Class_ApplicationData, center: string, link: Class_LinkElement): number | null => {
  const { reference } = reference616(app, center)
  const value = link.valueCurrent
  return reference.value === null || value === null || value === undefined ? null : value / reference.value
}

describe('sa#616 — protocole de test de l issue (2023, kt)', () => {
  test('1. Exportations (Blé tendre), sans sortie : rapportee aux matieres premieres entrantes', () => {
    const app = load616()
    const { reference } = reference616(app, 'Exportations (Blé tendre)')
    expect(reference.reason).toBeNull()
    expect(reference.side).toBe('inputs')
    expect(reference.side_fell_back).toBe(true)
    expect(reference.tag_id).toBe('matiere premiere')
    expect(reference.links.map(l => l.source.name)).toEqual(['Grains collectés (Blé tendre)'])
    const n = (source: string) =>
      normalized616(app, 'Exportations (Blé tendre)', linkBetween(app, source, 'Exportations (Blé tendre)'))
    expect(n('Grains collectés (Blé tendre)')).toBeCloseTo(1, 12)
    expect(n('Farine (Blé tendre)')).toBeCloseTo(0.013, 3)
    expect(n('Issues de meunerie (Blé tendre)')).toBeCloseTo(0.009, 3)
    expect(n('Gluten (Blé tendre)')).toBeCloseTo(0.007, 3)
    expect(n('Amidon (Blé tendre)')).toBeCloseTo(0.003, 3)
    expect(n('Malt (Blé tendre)')).toBeCloseTo(0.001, 3)
  })

  test('2. Importations (Blé tendre), sans entree : rapportee aux matieres premieres sortantes', () => {
    const app = load616()
    const { reference } = reference616(app, 'Importations (Blé tendre)')
    expect(reference.side).toBe('outputs')
    expect(reference.side_fell_back).toBe(false)
    expect(reference.links.map(l => l.target.name)).toEqual(['Grains collectés (Blé tendre)'])
    const n = (target: string) =>
      normalized616(app, 'Importations (Blé tendre)', linkBetween(app, 'Importations (Blé tendre)', target))
    expect(n('Farine (Blé tendre)')).toBeCloseTo(2.585, 3)
    expect(n('Amidon (Blé tendre)')).toBeCloseTo(0.785, 3)
    expect(n('Gluten (Blé tendre)')).toBeCloseTo(0.515, 3)
    expect(n('Issues de meunerie (Blé tendre)')).toBeCloseTo(0.503, 3)
    expect(n('Malt (Blé tendre)')).toBeCloseTo(0.017, 3)
  })

  test('3. Meunerie (Blé tendre), transformation : faute de matiere premiere sortie, les produits', () => {
    const app = load616()
    const meunerie = 'Meunerie (Blé tendre)'
    const { reference } = reference616(app, meunerie)
    expect(reference.tag_id).toBe('produit')
    expect(reference.links.map(l => l.target.name)).toEqual(['Farine (Blé tendre)'])
    expect(normalized616(app, meunerie, linkBetween(app, meunerie, 'Farine (Blé tendre)'))).toBeCloseTo(1, 12)
    expect(normalized616(app, meunerie, linkBetween(app, meunerie, 'Issues de meunerie (Blé tendre)'))).toBeCloseTo(0.174, 3)
    expect(normalized616(app, meunerie, linkBetween(app, 'Grains collectés disponibles (meunerie) (Blé tendre)', meunerie)))
      .toBeCloseTo(1.174, 3)
  })

  test('4. Farine (Blé tendre), marche a deux faces : les debouches interieurs', () => {
    const app = load616()
    const farine = 'Farine (Blé tendre)'
    const { rule, reference } = reference616(app, farine)
    expect(rule).toEqual({
      side: 'outputs',
      filter: { on: 'link', tag_group_id: 'echange', tag_ids: ['exportation'], negate: true }
    })
    expect(reference.links.map(l => l.target.name)).not.toContain('Exportations (Blé tendre)')
    expect(normalized616(app, farine, linkBetween(app, farine, 'Autres IAA (Blé tendre)'))).toBeCloseTo(0.44, 2)
    expect(normalized616(app, farine, linkBetween(app, farine, 'Exportations (Blé tendre)'))).toBeCloseTo(0.047, 3)
  })

  test('5. Casserie (Œufs) : les produits, coquilles en kt par kt d ovoproduits', () => {
    const app = load616()
    const { reference } = reference616(app, 'Casserie (Œufs)')
    expect(reference.links.map(l => l.target.name)).toEqual(['Ovoproduits (casserie) (Œufs)'])
    expect(normalized616(app, 'Casserie (Œufs)', linkBetween(app, 'Casserie (Œufs)', 'Coquilles (Œufs)'))).toBeCloseTo(0.134, 3)
  })

  test('l etiquette de valeur d une entree suit la meme regle', () => {
    const app = load616()
    const link = linkBetween(app, 'Farine (Blé tendre)', 'Exportations (Blé tendre)')
    // Sans désignation, Exportations (secteur) n'est pas un marché : la règle commune vaut aussi.
    expect(normalized(link, 'target')).toBeCloseTo(0.013, 3)
  })
})

describe('sa#616 — ce qui fait un process de marche', () => {
  test('sans reglage, type de noeud = produit ; avec, l etiquette designee', () => {
    const app = load616()
    const sankey = app.drawing_area.sankey
    const conditionnement = nodeNamed(app, 'Conditionnement de lait (Lait)')
    expect(normalizationNodeKind(conditionnement, sankey.node_taggs_dict)).toBe('secteur')
    expect(normalizationNodeKind(conditionnement, sankey.node_taggs_dict, MARKET_616)).toBe('produit')
    expect(resolveNormalizationRule(conditionnement, sankey, null, MARKET_616).filter?.tag_group_id).toBe('echange')
    // Une désignation qui ne désigne rien que le diagramme connaisse retombe sur le défaut.
    const unknown = { tag_group_id: 'type de process', tag_ids: ['inconnue'] }
    expect(normalizationNodeKind(conditionnement, sankey.node_taggs_dict, unknown)).toBe('secteur')
    expect(normalizationNodeKind(nodeNamed(app, 'Farine (Blé tendre)'), sankey.node_taggs_dict)).toBe('produit')
  })

  test('un marche a une seule face prend la regle commune', () => {
    const app = load616()
    const importations = nodeNamed(app, 'Importations (Blé tendre)')
    expect(normalizationNodeKind(importations, app.drawing_area.sankey.node_taggs_dict, MARKET_616)).toBe('produit')
    expect(reference616(app, 'Importations (Blé tendre)').rule.side).toBe('outputs_else_inputs')
  })

  test('la regle personnalisee d un volet n est pas touchee', () => {
    const app = load616()
    const custom: Type_NormalizationRule = { side: 'outputs', filter: null }
    const exportations = nodeNamed(app, 'Exportations (Blé tendre)')
    expect(resolveNormalizationRule(exportations, app.drawing_area.sankey, custom, MARKET_616)).toBe(custom)
    expect(normalizationReference(exportations, custom).reason).toBe('no_flux_on_side')
  })
})

describe('sa#616 — la note nomme les flux de reference, sous leur libelle affiche', () => {
  const note = (app: Class_ApplicationData, name: string) => {
    const { node, reference } = reference616(app, name)
    return describeNormalizationReference(reference, node, displayedNameOf, t607)
  }

  test('faute de sortie : le flux entrant de matiere premiere', () => {
    expect(note(load616(), 'Exportations (Blé tendre)'))
      .toBe('Flux.normalization.reference_note{"flows":"Grains collectés"}')
  })

  test('sur les sorties : le produit', () => {
    expect(note(load616(), 'Meunerie (Blé tendre)')).toBe('Flux.normalization.reference_note{"flows":"Farine"}')
  })

  test('un marche a deux faces : tous ses debouches interieurs, joints par +', () => {
    const text = note(load616(), 'Farine (Blé tendre)')
    expect(text).toContain('Autres IAA + ')
    expect(text).toContain('Ménages')
    expect(text).not.toContain('Exportations')
  })

  test('une reference vide : aucun, et pourquoi', () => {
    const app = load616()
    const exportations = nodeNamed(app, 'Exportations (Blé tendre)')
    const reference = normalizationReference(exportations, { side: 'outputs', filter: null })
    expect(describeNormalizationReference(reference, exportations, displayedNameOf, t607)).toBe(
      'Flux.normalization.reference_none{"reason":"Flux.normalization.reason_no_flux_on_side"}')
  })

  test('faute de toute categorie, le total du cote', () => {
    const app = load616()
    // Les entrées de Farine viennent de nœuds sans type de matière : le total, donc le %.
    const rule: Type_NormalizationRule = {
      side: 'inputs',
      filter: {
        on: 'counterpart', tag_group_id: 'type de matiere', tag_ids: ['matiere premiere', 'produit'], negate: false, else_all: true
      }
    }
    const reference = normalizationReference(nodeNamed(app, 'Farine (Blé tendre)'), rule)
    expect(reference.all_fallback).toBe(true)
    expect(reference.value).toBeCloseTo(4310 + 336, 6)
    expect(reference.links).toHaveLength(2)
  })
})

describe('sa#616 — la regle s enregistre', () => {
  test('« sorties, sinon entrees » et « sinon tous les flux » se relisent', () => {
    const rules = {
      secteur: {
        side: 'outputs_else_inputs' as const,
        filter: { on: 'counterpart' as const, tag_group_id: 'type de matiere', tag_ids: ['produit'], negate: false, else_all: true }
      }
    }
    expect(normalizationRulesFromJSON(JSON.parse(JSON.stringify(rules)))).toEqual(rules)
  })
})
