import { Class_NodeTagGroup, Class_FluxTagGroup } from './TagGroup'
import type { Class_Sankey } from './Sankey'
import type { Type_JSON } from './Utils'

/**
 * #527 — ce que le front ne modélise pas doit le traverser à l'identique.
 *
 * Le parser (SankeyExcelParser) écrit dans le JSON « Palette visible »
 * (`show_legend`) et « Palette de couleur » (`colormap`) de la feuille
 * Étiquettes, mais le front reconstruit le JSON de zéro : toute clé qu'il ne
 * connaît pas disparaissait dès que le diagramme repassait par le navigateur.
 * Corriger le parser seul n'aurait rien changé au symptôme de l'issue — ouvrir
 * une étude puis la re-sauver en .xlsx efface ces colonnes.
 */

const fakeSankey = {
  nodeTagsUpdated: () => { /* no-op */ },
  dataTagsUpdated: () => { /* no-op */ },
  fluxTagsUpdated: () => { /* no-op */ },
  drawing_area: {
    legend: { draw: () => { /* no-op */ } },
    application_data: { language: 'fr' },
  },
} as unknown as Class_Sankey

function jsonWithTags(extra: Type_JSON = {}, tag_extra: Type_JSON = {}): Type_JSON {
  return {
    name: 'Groupe',
    banner: 'multi',
    tags: { t0: { name: 'A', ...tag_extra } },
    ...extra,
  } as Type_JSON
}

describe('#527 passthrough des attributs inconnus du front', () => {

  it('réémet « Palette visible » et « Palette de couleur » sur un groupe de nœuds', () => {
    const group = new Class_NodeTagGroup('g', 'G', fakeSankey, false)
    group.fromJSON(jsonWithTags({ show_legend: true, colormap: 'viridis' }))
    const out = group.toJSON()
    expect(out['show_legend']).toBe(true)
    expect(out['colormap']).toBe('viridis')
  })

  it('réémet une clé arbitraire posée sur un groupe et sur une étiquette', () => {
    const group = new Class_NodeTagGroup('g', 'G', fakeSankey, false)
    group.fromJSON(jsonWithTags(
      { definition: 'texte libre', mise_en_forme: { opacite: 0.5 } },
      { provenance: ['agreste', 2024] },
    ))
    const out = group.toJSON()
    expect(out['definition']).toBe('texte libre')
    expect(out['mise_en_forme']).toEqual({ opacite: 0.5 })
    const tag_out = (out['tags'] as Type_JSON)['t0'] as Type_JSON
    expect(tag_out['provenance']).toEqual(['agreste', 2024])
  })

  it('vaut aussi pour les groupes de flux', () => {
    // Le mécanisme vit dans Class_ProtoTagGroup : toutes les familles en
    // héritent. On vérifie une seconde famille pour s'assurer qu'aucune
    // sous-classe ne court-circuite la sérialisation de base.
    const flux_group = new Class_FluxTagGroup('f', 'F', fakeSankey, false)
    flux_group.fromJSON(jsonWithTags({ colormap: 'magma' }))
    expect(flux_group.toJSON()['colormap']).toBe('magma')
  })

  it('ne laisse jamais le sac primer sur une clé que le front connaît', () => {
    // Le nom est lu puis réécrit par le front : c'est sa valeur courante qui
    // doit sortir, jamais une copie brute de l'entrée.
    const group = new Class_NodeTagGroup('g', 'G', fakeSankey, false)
    group.fromJSON(jsonWithTags({ name: 'Origine' }))
    group.name = 'Origine des flux'
    expect(group.toJSON()['name']).toBe('Origine des flux')
  })

  it('ne fige pas un drapeau de fusion que l\'utilisateur vient de décocher', () => {
    // `carries_values` n'est écrit que lorsqu'il est vrai : s'il restait dans le
    // sac, le décocher n'aurait aucun effet sur le fichier enregistré.
    const group = new Class_FluxTagGroup('f', 'F', fakeSankey, false)
    group.fromJSON(jsonWithTags({ carries_values: true }))
    expect(group.toJSON()['carries_values']).toBe(true)
    group.carries_values = false
    expect(group.toJSON()['carries_values']).toBeUndefined()
  })

  it('transporte les attributs inconnus lors d\'une copie de groupe', () => {
    const source = new Class_NodeTagGroup('g', 'G', fakeSankey, false)
    source.fromJSON(jsonWithTags({ colormap: 'viridis' }, { provenance: 'agreste' }))
    const target = new Class_NodeTagGroup('g2', 'G2', fakeSankey, false)
    target.fromJSON(jsonWithTags())
    target.copyFrom(source)
    const out = target.toJSON()
    expect(out['colormap']).toBe('viridis')
    const tag_out = (out['tags'] as Type_JSON)['t0'] as Type_JSON
    expect(tag_out['provenance']).toBe('agreste')
  })
})
