import { Class_NodeTagGroup } from './TagGroup'
import type { Class_Sankey } from './Sankey'
import type { Type_JSON } from './Utils'

/**
 * #537 — socle de format du chantier « lire la fiabilité et la provenance sur
 * n'importe quel diagramme ». Trois attributs additifs, et rien d'autre : aucun
 * rendu, aucune saisie, aucune info-bulle.
 *
 *   - `description` multilingue, sur le groupe ET sur l'étiquette. Un champ
 *     NOUVEAU, jamais `long_name` : `long_name` est le nom AFFICHÉ
 *     (`display_name`), et les définitions font 95 caractères en moyenne — y
 *     ranger une définition remplacerait « Fiable » par un paragraphe dans la
 *     légende et dans tous les sélecteurs de bannière.
 *   - `style_patch`, porteur de mise en forme au-delà de la couleur, à la forme
 *     des patchs de thème (`Type_StylePatch`).
 *   - `pinned_in_legend`, drapeau d'épinglage du groupe.
 *
 * Ce que ces cas gardent surtout, c'est la règle d'ÉCRITURE CONDITIONNELLE : un
 * diagramme qui ne déclare rien doit produire exactement le même JSON qu'avant.
 * Sans elle, la première re-sauvegarde ajouterait trois clés à tous les groupes
 * et à toutes les étiquettes de tous les fichiers — et les 24 goldens de
 * `corpusFirstLoad` bougeraient en masse pour rien.
 */

const fakeSankey = {
  nodeTagsUpdated: () => { /* no-op */ },
  drawing_area: {
    legend: { draw: () => { /* no-op */ } },
    application_data: { language: 'fr' },
  },
} as unknown as Class_Sankey

function makeGroup(id: string): Class_NodeTagGroup {
  return new Class_NodeTagGroup(id, 'Fiabilité', fakeSankey, false)
}

function jsonWithTags(extra: Type_JSON = {}, tag_extra: Type_JSON = {}): Type_JSON {
  return {
    name: 'Fiabilité',
    banner: 'multi',
    tags: { t0: { name: 'Fiable', ...tag_extra } },
    ...extra,
  } as Type_JSON
}

describe('#537 définition et mise en forme — écriture conditionnelle', () => {

  it('un groupe et une étiquette muets n\'écrivent aucune des trois clés', () => {
    const group = makeGroup('g')
    group.fromJSON(jsonWithTags())
    const out = group.toJSON()
    expect(out['description']).toBeUndefined()
    expect(out['style_patch']).toBeUndefined()
    expect(out['pinned_in_legend']).toBeUndefined()
    const tag_out = (out['tags'] as Type_JSON)['t0'] as Type_JSON
    expect(tag_out['description']).toBeUndefined()
    expect(tag_out['style_patch']).toBeUndefined()
  })

  it('les défauts sont vides, y compris sur un groupe dont les couleurs sont auto-générées', () => {
    // `Class_ProtoTagGroup._fromJSON` pose une colormap `jet` sur tous les tags
    // dès qu'aucun ne porte de couleur : c'est le seul endroit du format qui
    // FABRIQUE une valeur d'office. Les attributs du #537 n'y participent pas —
    // arbitrage A5, l'interrupteur par groupe reste fermé par défaut.
    const group = makeGroup('g')
    group.fromJSON(jsonWithTags())
    expect(group.tags_list[0].color).not.toBe('')
    expect(group.description).toBe('')
    expect(group.style_patch).toEqual({})
    expect(group.pinned_in_legend).toBe(false)
    expect(group.tags_list[0].description).toBe('')
    expect(group.tags_list[0].style_patch).toEqual({})
  })

  it('une définition n\'est PAS un nom long : elle ne change ni le nom ni l\'affichage', () => {
    const group = makeGroup('g')
    group.fromJSON(jsonWithTags())
    const tag = group.tags_list[0]
    tag.description = 'donnée présentant un très faible niveau d\'incertitude, issue de sources validées et cohérentes.'
    expect(tag.name).toBe('Fiable')
    expect(tag.long_name).toBe('')
    expect(tag.display_name).toBe('Fiable')
    expect(tag.toJSON()['long_name']).toBe('')
  })
})

describe('#537 aller-retour du format', () => {

  it('écrit puis relit une définition monolingue, en string (format historique)', () => {
    const group = makeGroup('g')
    group.fromJSON(jsonWithTags())
    group.description = 'Niveau de confiance attribué à chaque donnée.'
    group.tags_list[0].description = 'Donnée à très faible incertitude.'

    const out = group.toJSON()
    // Une seule langue -> string, comme les noms : lisible par une version antérieure.
    expect(out['description']).toBe('Niveau de confiance attribué à chaque donnée.')
    expect(((out['tags'] as Type_JSON)['t0'] as Type_JSON)['description'])
      .toBe('Donnée à très faible incertitude.')

    const reloaded = makeGroup('g')
    reloaded.fromJSON(out)
    expect(reloaded.description).toBe('Niveau de confiance attribué à chaque donnée.')
    expect(reloaded.tags_list[0].description).toBe('Donnée à très faible incertitude.')
  })

  it('écrit puis relit une définition MULTILINGUE, en map', () => {
    const group = makeGroup('g')
    group.fromJSON(jsonWithTags())
    group.description_map = { fr: 'Niveau de confiance.', en: 'Confidence level.' }
    group.tags_list[0].description_map = { fr: 'Très faible incertitude.', en: 'Very low uncertainty.' }

    const out = group.toJSON()
    expect(out['description']).toEqual({ fr: 'Niveau de confiance.', en: 'Confidence level.' })

    const reloaded = makeGroup('g')
    reloaded.fromJSON(out)
    expect(reloaded.description_map).toEqual({ fr: 'Niveau de confiance.', en: 'Confidence level.' })
    expect(reloaded.tags_list[0].description_map)
      .toEqual({ fr: 'Très faible incertitude.', en: 'Very low uncertainty.' })
  })

  it('accepte une définition écrite en string par le parser, et la range sous la langue du fichier', () => {
    const group = makeGroup('g')
    group.fromJSON(jsonWithTags(
      { description: 'Définition du groupe.' },
      { description: 'Définition de l\'étiquette.' },
    ))
    expect(group.description_map).toEqual({ fr: 'Définition du groupe.' })
    expect(group.tags_list[0].description_map).toEqual({ fr: 'Définition de l\'étiquette.' })
  })

  it('écrit puis relit un patch de mise en forme, sur le groupe et sur l\'étiquette', () => {
    const group = makeGroup('g')
    group.fromJSON(jsonWithTags())
    // Le groupe DÉCLARE ce qu'il pilote ; chaque étiquette porte sa valeur.
    group.style_patch = { shape_opacity: 0.85 }
    group.tags_list[0].style_patch = { shape_opacity: 1 }

    const out = group.toJSON()
    expect(out['style_patch']).toEqual({ shape_opacity: 0.85 })
    expect(((out['tags'] as Type_JSON)['t0'] as Type_JSON)['style_patch'])
      .toEqual({ shape_opacity: 1 })

    const reloaded = makeGroup('g')
    reloaded.fromJSON(out)
    expect(reloaded.style_patch).toEqual({ shape_opacity: 0.85 })
    expect(reloaded.tags_list[0].style_patch).toEqual({ shape_opacity: 1 })
  })

  it('écrit puis relit l\'épinglage, et ne l\'écrit pas quand il est éteint', () => {
    const group = makeGroup('g')
    group.fromJSON(jsonWithTags())
    group.pinned_in_legend = true
    expect(group.toJSON()['pinned_in_legend']).toBe(true)

    const reloaded = makeGroup('g')
    reloaded.fromJSON(group.toJSON())
    expect(reloaded.pinned_in_legend).toBe(true)

    reloaded.pinned_in_legend = false
    expect(reloaded.toJSON()['pinned_in_legend']).toBeUndefined()
  })

  it('un patch abîmé (valeur non scalaire) est écarté, pas propagé', () => {
    // Mieux vaut ignorer un attribut illisible que rendre le diagramme inouvrable.
    const group = makeGroup('g')
    group.fromJSON(jsonWithTags(
      { style_patch: { shape_opacity: 0.5, bordure: { couleur: 'rouge' }, hachure: null } as unknown as Type_JSON },
    ))
    expect(group.style_patch).toEqual({ shape_opacity: 0.5 })
  })

  it('effacer une définition retire la clé — elle ne resurgit pas du sac du #527', () => {
    // Garde-fou du croisement avec le passthrough : `description` et
    // `style_patch` sont désormais des clés CONNUES du front. Si elles étaient
    // restées dans `_json_extras`, l'écriture conditionnelle ne les réécrirait
    // plus après un effacement, et la valeur périmée du sac reprendrait la main.
    const group = makeGroup('g')
    group.fromJSON(jsonWithTags(
      { description: 'Ancienne définition.', style_patch: { shape_opacity: 0.3 } },
      { description: 'Ancienne définition d\'étiquette.' },
    ))
    group.description_map = {}
    group.style_patch = {}
    group.tags_list[0].description_map = {}

    const out = group.toJSON()
    expect(out['description']).toBeUndefined()
    expect(out['style_patch']).toBeUndefined()
    expect(((out['tags'] as Type_JSON)['t0'] as Type_JSON)['description']).toBeUndefined()
  })

  it('ne fige aucun défaut à la relecture d\'un fichier antérieur', () => {
    // Un fichier muet doit ressortir muet : sinon tous les fichiers existants
    // seraient réécrits pour rien, et les goldens bougeraient en masse.
    const group = makeGroup('g')
    group.fromJSON(jsonWithTags())
    const out = group.toJSON()
    expect(Object.keys(out)).not.toContain('description')
    expect(Object.keys(out)).not.toContain('style_patch')
    expect(Object.keys(out)).not.toContain('pinned_in_legend')
  })
})

describe('#537 duplication du groupe', () => {

  it('définition, mise en forme et épinglage suivent la copie — groupe et étiquettes', () => {
    // #385 / #528 à l'identique : un attribut sérialisé mais non recopié se perd
    // à la première duplication ou fusion de mise en page, en silence.
    const source = makeGroup('src')
    source.fromJSON(jsonWithTags())
    source.description_map = { fr: 'Niveau de confiance.', en: 'Confidence level.' }
    source.style_patch = { shape_opacity: 0.85 }
    source.pinned_in_legend = true
    source.tags_list[0].description_map = { fr: 'Très faible incertitude.' }
    source.tags_list[0].style_patch = { shape_opacity: 1 }

    // La cible DIFFÈRE de la source avant la copie (sans quoi le cas passerait
    // au vert même si la recopie ne faisait rien).
    const target = makeGroup('dst')
    target.fromJSON(jsonWithTags())
    expect(target.description).toBe('')
    expect(target.pinned_in_legend).toBe(false)

    target.copyFrom(source, {})

    expect(target.description_map).toEqual({ fr: 'Niveau de confiance.', en: 'Confidence level.' })
    expect(target.style_patch).toEqual({ shape_opacity: 0.85 })
    expect(target.pinned_in_legend).toBe(true)
    expect(target.tags_list[0].description_map).toEqual({ fr: 'Très faible incertitude.' })
    expect(target.tags_list[0].style_patch).toEqual({ shape_opacity: 1 })
  })

  it('la copie CLONE les maps et les patchs : les deux groupes restent indépendants', () => {
    const source = makeGroup('src')
    source.fromJSON(jsonWithTags())
    source.description_map = { fr: 'Définition de départ.' }
    source.style_patch = { shape_opacity: 0.85 }

    const target = makeGroup('dst')
    target.fromJSON(jsonWithTags())
    target.copyFrom(source, {})

    target.description_map = { fr: 'Définition modifiée.' }
    target.style_patch = { shape_opacity: 0.2 }

    expect(source.description).toBe('Définition de départ.')
    expect(source.style_patch).toEqual({ shape_opacity: 0.85 })
  })
})
