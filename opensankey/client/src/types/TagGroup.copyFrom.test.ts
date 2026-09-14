import {
  Class_NodeTagGroup,
  Class_FluxTagGroup,
  Class_DataTagGroup,
  Class_LevelTagGroup,
  Class_ViewTagGroup,
} from './TagGroup'
import type { Class_Sankey } from './Sankey'
import type { Type_JSON } from './Utils'

/**
 * #528 — un groupe d'étiquettes dupliqué doit porter TOUS ses réglages.
 *
 * `copyFrom` est le chemin commun de la duplication de groupe, de la fusion de
 * mise en page (`updateFrom`) et de la copie de diagramme
 * (`Class_Sankey.copyFrom`). Chaque famille y ajoute ses propres attributs : un
 * attribut sérialisé mais absent de `_copyFrom` disparaît en silence — et la
 * liste des étiquettes, elle, paraît correcte (leçon du #385). D'où ce test qui
 * juge **valeur par valeur**, famille par famille.
 */

const node_taggs_dict: { [_: string]: Class_NodeTagGroup } = {}

const fakeSankey = {
  nodeTagsUpdated: () => { /* no-op */ },
  dataTagsUpdated: () => { /* no-op */ },
  fluxTagsUpdated: () => { /* no-op */ },
  draw: () => { /* no-op */ },
  node_taggs_dict,
  // Class_DataTag prend les liens du diagramme pour références à sa création.
  links_dict: {},
  drawing_area: {
    legend: { draw: () => { /* no-op */ } },
    application_data: { language: 'fr' },
  },
} as unknown as Class_Sankey

/** Réglages communs à toutes les familles (portés par Class_ProtoTagGroup). */
const COMMON_SETTINGS: Type_JSON = {
  tags_separator: ';',
  antagonists_separator: '|',
} as Type_JSON

function jsonWith(extra: Type_JSON, tags: Type_JSON = { t0: { name: 'A' }, t1: { name: 'B' } } as Type_JSON): Type_JSON {
  return {
    name: 'Source',
    tags,
    tags_order: Object.keys(tags),
    ...COMMON_SETTINGS,
    ...extra,
  } as Type_JSON
}

describe('#528 copyFrom — les réglages d\'un groupe survivent à la duplication', () => {

  it('groupe de nœuds : couleurs et séparateurs', () => {
    const source = new Class_NodeTagGroup('g', 'G', fakeSankey, false)
    source.fromJSON(jsonWith({ use_colors: true, banner: 'one' } as Type_JSON))
    const copy = new Class_NodeTagGroup('g2', 'G2', fakeSankey, false)

    copy.copyFrom(source)

    expect(copy.use_colors).toBe(true)
    expect(copy.banner).toBe('one')
    expect(copy.tags_separator).toBe(';')
    expect(copy.antagonists_separator).toBe('|')
    expect(copy.tags_list.map(t => t.name)).toEqual(['A', 'B'])
  })

  it('groupe de flux : les quatre drapeaux de la fusion suivent le groupe', () => {
    // Le défaut du #528 : Class_FluxTagGroup sérialise carries_values,
    // has_own_scales, is_unit_type et is_additive, mais n'avait aucun _copyFrom.
    // Une duplication rendait donc un groupe « porteur de valeurs, de type
    // unité, non additif » en simple groupe d'annotation — sans un mot.
    const source = new Class_FluxTagGroup('f', 'F', fakeSankey, false)
    source.fromJSON(jsonWith({
      use_colors: true,
      carries_values: true,
      has_own_scales: true,
      is_unit_type: true,
      is_additive: false,
    } as Type_JSON))
    const copy = new Class_FluxTagGroup('f2', 'F2', fakeSankey, false)

    copy.copyFrom(source)

    expect(copy.carries_values).toBe(true)
    expect(copy.has_own_scales).toBe(true)
    expect(copy.is_unit_type).toBe(true)
    expect(copy.is_additive).toBe(false)
    expect(copy.use_colors).toBe(true)
    expect(copy.tags_separator).toBe(';')
    expect(copy.antagonists_separator).toBe('|')
  })

  it('groupe de données : unité, propagation et mode d\'affichage', () => {
    const source = new Class_DataTagGroup('d', 'D', fakeSankey, false)
    source.fromJSON(jsonWith({
      use_colors: true,
      is_unit: true,
      propagate_structure: false,
      position_mode: 'proportional',
    } as Type_JSON))
    const copy = new Class_DataTagGroup('d2', 'D2', fakeSankey, false)

    copy.copyFrom(source)

    expect(copy.use_colors).toBe(true)
    expect(copy.is_unit).toBe(true)
    expect(copy.propagate_structure).toBe(false)
    expect(copy.position_mode).toBe('proportional')
    expect(copy.tags_separator).toBe(';')
  })

  it('groupe de niveaux : activation et fratrie, sans partage de tableau', () => {
    const source = new Class_LevelTagGroup('l', 'L', fakeSankey, false)
    source.fromJSON(jsonWith({
      use_colors: true,
      activated: true,
      siblings: ['autre_groupe'],
    } as Type_JSON))
    const copy = new Class_LevelTagGroup('l2', 'L2', fakeSankey, false)

    copy.copyFrom(source)

    expect(copy.activated).toBe(true)
    expect(copy.siblings).toEqual(['autre_groupe'])
    expect(copy.use_colors).toBe(true)
    expect(copy.tags_separator).toBe(';')
    // La fratrie se modifie par addSibling/removeSibling, qui écrivent DANS le
    // tableau : partagé entre l'original et sa copie, un ajout sur l'un
    // apparaîtrait sur l'autre.
    expect(copy.siblings).not.toBe(source.siblings)
  })

  it('groupe de vues : mode filtre et libellé de vue complète', () => {
    const source = new Class_ViewTagGroup('v', 'V', fakeSankey, false)
    source.fromJSON(jsonWith({
      use_colors: true,
      activated: true,
      siblings: ['autre_groupe'],
      view_mode: true,
      full_view_label: 'Tout le territoire',
    } as Type_JSON))
    const copy = new Class_ViewTagGroup('v2', 'V2', fakeSankey, false)

    copy.copyFrom(source)

    expect(copy.activated).toBe(true)
    expect(copy.siblings).toEqual(['autre_groupe'])
    expect(copy.view_mode).toBe(true)
    expect(copy.full_view_label).toBe('Tout le territoire')
    expect(copy.use_colors).toBe(true)
    expect(copy.tags_separator).toBe(';')
  })
})

/**
 * #528 (second volet) — `matching_tags_id` doit atteindre TOUTES les familles.
 *
 * `Class_LevelTagGroup.copyFrom` et `Class_ViewTagGroup.copyFrom` ne
 * déclaraient qu'un seul argument : l'appariement des étiquettes construit par
 * `updateFrom` n'arrivait jamais jusqu'au `_copyFrom` du proto. Deux groupes
 * appariés par NOM mais portant des ids d'étiquettes différents voyaient alors
 * leurs étiquettes orphelines — exactement le défaut déjà corrigé pour les
 * nodeTags (cf. TagGroup.test.ts).
 */
describe('#528 copyFrom — l\'appariement des étiquettes atteint niveaux et vues', () => {

  it('groupe de niveaux : les étiquettes de la cible survivent à l\'appariement', () => {
    const current = new Class_LevelTagGroup('niveaux', 'Niveaux', fakeSankey, false)
    current.addTag('Primaire', 'n1')
    current.addTag('Secondaire', 'n2')
    const source = new Class_LevelTagGroup('levels', 'Niveaux', fakeSankey, false)
    source.addTag('Primaire', 'lv1')
    source.addTag('Secondaire', 'lv2')

    current.copyFrom(source, { n1: 'lv1', n2: 'lv2' })

    expect(current.tags_list.map(t => t.id)).toEqual(['n1', 'n2'])
    expect(current.tags_list.map(t => t.name)).toEqual(['Primaire', 'Secondaire'])
  })

  it('groupe de vues : idem', () => {
    const current = new Class_ViewTagGroup('vues', 'Vues', fakeSankey, false)
    current.addTag('France', 'v1')
    current.addTag('Région', 'v2')
    const source = new Class_ViewTagGroup('views', 'Vues', fakeSankey, false)
    source.addTag('France', 'w1')
    source.addTag('Région', 'w2')

    current.copyFrom(source, { v1: 'w1', v2: 'w2' })

    expect(current.tags_list.map(t => t.id)).toEqual(['v1', 'v2'])
    expect(current.tags_list.map(t => t.name)).toEqual(['France', 'Région'])
  })
})

/**
 * #528 (troisième volet) — `linked_tag_group` était LU sans jamais être ÉCRIT.
 *
 * Le lien est bien consommé (`opensankey-editor`, Toolbar.tsx : cocher
 * « activer » sur un groupe de niveaux allume `use_colors` sur le groupe de
 * nœuds lié). Comme le front ne l'écrivait jamais, un fichier qui le déclarait
 * le perdait dès le premier enregistrement passé par le navigateur — et la case
 * cessait d'allumer quoi que ce soit. L'asymétrie était invisible au
 * round-trip : aucun fichier écrit par le front ne portait la clé.
 */
describe('#528 linked_tag_group survit à l\'aller-retour', () => {

  it('le lien lu dans le fichier est réécrit à l\'enregistrement', () => {
    const linked = new Class_NodeTagGroup('un_groupe_de_noeuds', 'Couleurs', fakeSankey, false)
    node_taggs_dict['un_groupe_de_noeuds'] = linked

    const group = new Class_LevelTagGroup('l', 'L', fakeSankey, false)
    group.fromJSON(jsonWith({ linked_tag_group: 'un_groupe_de_noeuds' } as Type_JSON))

    expect(group.linked_tag_group).toBe(linked)
    expect(group.toJSON()['linked_tag_group']).toBe('un_groupe_de_noeuds')
  })

  it('le lien suit le groupe à la duplication', () => {
    const linked = new Class_NodeTagGroup('un_groupe_de_noeuds', 'Couleurs', fakeSankey, false)
    node_taggs_dict['un_groupe_de_noeuds'] = linked

    const source = new Class_LevelTagGroup('l', 'L', fakeSankey, false)
    source.fromJSON(jsonWith({ linked_tag_group: 'un_groupe_de_noeuds' } as Type_JSON))
    const copy = new Class_LevelTagGroup('l2', 'L2', fakeSankey, false)

    copy.copyFrom(source)

    expect(copy.linked_tag_group).toBe(linked)
  })
})
