import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTag, Class_Tag } from './Tag'
import type { Class_ElementStyle } from '../Elements/Element'
import type { Type_JSON } from './Utils'

// jest 27/jsdom n'expose pas structuredClone (utilisé par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/**
 * SA#553 — étiquette générée « Sans [nom du groupe] », sur de vraies classes.
 *
 * Règles d'Alexandre (2026-09-15) : une VRAIE étiquette, générée pour chaque groupe de nœuds et de
 * flux ; nom automatique qui suit le groupe tant qu'il n'est pas saisi ; définition par défaut ;
 * style au choix, aucun par défaut. Son port se CALCULE : les éléments — pour un flux, la valeur
 * affichée — qui ne portent aucune autre étiquette du groupe. Elle ne s'écrit sur aucun élément, et
 * un fichier où rien n'y est saisi ne change pas.
 */
function makeApp() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const collecte = sankey.addNewNodeWithName('Collecte')
  const laiteries = sankey.addNewNodeWithName('Laiteries')
  const link = sankey.addNewLink(collecte, laiteries)
  link.valueCurrent = 100
  const makeStyle = (name: string, attrs: { [k: string]: string | number | boolean }): Class_ElementStyle => {
    const style = sankey.addNewDefaultElementStyle()
    style.name = name
    Object.entries(attrs).forEach(([k, v]) => { (style as unknown as { [k: string]: unknown })[k] = v })
    return style
  }
  return { app, sankey, collecte, laiteries, link, makeStyle }
}

function makeLait() {
  const ctx = makeApp()
  const { sankey, link } = ctx
  const annee = sankey.addDataTagGroup('annee', 'Année', false)
  const y2019 = annee.addTag('2019', 'y2019') as Class_DataTag
  const y2020 = annee.addTag('2020', 'y2020') as Class_DataTag
  const selectYear = (year: Class_DataTag) => {
    year.setSelected()
    ;(year === y2019 ? y2020 : y2019).setUnSelected()
  }
  selectYear(y2019)
  link.valueForTag(y2019)!.valueData = 100
  link.valueForTag(y2020)!.valueData = 110
  const source = sankey.addFluxTagGroup('source', 'Source', false)
  const agreste = source.addTag('Agreste', 'agreste') as Class_Tag
  return { ...ctx, y2019, y2020, selectYear, source, agreste }
}

describe('SA#553 — existence et nom', () => {
  it('groupes de nœuds et de flux seulement, en dernier de tags_list_with_untagged, jamais dans tags_list', () => {
    const { sankey } = makeApp()
    const noeuds = sankey.addNodeTagGroup('type', 'Type', false)
    noeuds.addTag('Produit', 'produit')
    const flux = sankey.addFluxTagGroup('source', 'Source', false)
    const donnees = sankey.addDataTagGroup('annee', 'Année', false)
    const niveaux = sankey.addLevelTagGroup('niveau', 'Niveau')

    expect(noeuds.untagged_tag?.id).toBe('type__untagged')
    expect(noeuds.tags_list.map(t => t.id)).toEqual(['produit'])
    expect(noeuds.tags_list_with_untagged.map(t => t.id)).toEqual(['produit', 'type__untagged'])
    expect(flux.untagged_tag?.is_untagged).toBe(true)
    expect(donnees.untagged_tag).toBeUndefined()
    expect(niveaux.untagged_tag).toBeUndefined()
    // Groupe « de type unité » : une valeur porte toujours son unité
    flux.is_unit_type = true
    expect(flux.untagged_tag).toBeUndefined()
  })

  it('nom automatique qui suit le groupe ; nom saisi conservé ; nom effacé redevenu automatique', () => {
    const { sankey } = makeApp()
    const source = sankey.addFluxTagGroup('source', 'Source', false)
    const sans = source.untagged_tag!
    // Nom du groupe en minuscule (retour d'Alexandre du 2026-09-17)
    expect(sans.name).toBe('Sans source')
    expect(sans.has_own_name).toBe(false)

    source.name = 'Origine'
    expect(sans.name).toBe('Sans origine')

    sans.name = 'Source inconnue'
    source.name = 'Provenance'
    expect(sans.name).toBe('Source inconnue')
    expect(sans.has_own_name).toBe(true)

    sans.name = ''
    expect(sans.name).toBe('Sans provenance')
    expect(sans.has_own_name).toBe(false)

    // Un sigle garde sa casse
    source.name = 'GEB'
    expect(sans.name).toBe('Sans GEB')
  })

  it('définition par défaut, remplacée par une définition saisie', () => {
    const { sankey } = makeApp()
    const sans = sankey.addFluxTagGroup('source', 'Source', false).untagged_tag!
    expect(sans.description).toBe('Aucune étiquette attribuée à cet élément.')
    sans.description = 'Flux dont la source n est pas renseignée.'
    expect(sans.description).toBe('Flux dont la source n est pas renseignée.')
  })

  it('ne s affecte à aucun élément et ne se supprime pas', () => {
    const { sankey, collecte } = makeApp()
    const type = sankey.addNodeTagGroup('type', 'Type', false)
    const sans = type.untagged_tag!
    collecte.addTag(sans)
    expect(collecte.tags_list).toHaveLength(0)
    expect(sans.references).toHaveLength(0)
    sans.delete()
    expect(type.untagged_tag).toBe(sans)
  })
})

describe('SA#553 — port calculé', () => {
  it('nœuds : portée par les nœuds sans étiquette du groupe, jamais par un flux', () => {
    const { sankey, collecte, laiteries, link } = makeApp()
    const type = sankey.addNodeTagGroup('type', 'Type', false)
    collecte.addTag(type.addTag('Produit', 'produit') as Class_Tag)
    const sans = type.untagged_tag!
    expect(collecte.hasGivenTag(sans)).toBe(false)
    expect(laiteries.hasGivenTag(sans)).toBe(true)
    expect(link.hasGivenTag(sans)).toBe(false)
    // Une étiquette d'un AUTRE groupe ne change rien
    laiteries.addTag(sankey.addNodeTagGroup('autre', 'Autre', false).addTag('X', 'x') as Class_Tag)
    expect(laiteries.hasGivenTag(sans)).toBe(true)
  })

  it('flux : par valeur affichée — change avec l année', () => {
    const { link, y2019, y2020, selectYear, source, agreste, collecte } = makeLait()
    link.valueForTag(y2019)!.addTag(agreste)
    const sans = source.untagged_tag!
    expect(link.hasGivenTag(sans)).toBe(false)
    selectYear(y2020)
    expect(link.hasGivenTag(sans)).toBe(true)
    expect(collecte.hasGivenTag(sans)).toBe(false)
    // Rien n'est écrit sur la valeur
    expect(link.valueForTag(y2020)!.flux_tags_list).toHaveLength(0)
  })
})

describe('SA#553 — visibilité', () => {
  it('sélectionnée par défaut : visibilité inchangée', () => {
    const { sankey, collecte, laiteries, link } = makeApp()
    const type = sankey.addNodeTagGroup('type', 'Type', false)
    collecte.addTag(type.addTag('Produit', 'produit') as Class_Tag)
    const source = sankey.addFluxTagGroup('source', 'Source', false)
    source.addTag('Agreste', 'agreste')
    expect(type.untagged_tag!.is_selected).toBe(true)
    expect(collecte.are_related_node_tags_selected).toBe(true)
    expect(laiteries.are_related_node_tags_selected).toBe(true)
    expect(link.are_related_flux_tags_selected).toBe(true)
  })

  it('nœuds : la désélectionner masque exactement les nœuds sans étiquette du groupe ; la resélectionner les rend', () => {
    const { sankey, collecte, laiteries } = makeApp()
    const type = sankey.addNodeTagGroup('type', 'Type', false)
    collecte.addTag(type.addTag('Produit', 'produit') as Class_Tag)
    const sans = type.untagged_tag!
    sans.setUnSelected()
    expect(collecte.are_related_node_tags_selected).toBe(true)
    expect(laiteries.are_related_node_tags_selected).toBe(false)
    sans.setSelected()
    expect(laiteries.are_related_node_tags_selected).toBe(true)
  })

  it('flux : masque les flux dont la valeur affichée ne porte aucune étiquette du groupe, par année', () => {
    const { link, y2019, y2020, selectYear, source, agreste, sankey } = makeLait()
    link.valueForTag(y2019)!.addTag(agreste)
    source.untagged_tag!.setUnSelected()
    expect(link.are_related_flux_tags_selected).toBe(true)
    selectYear(y2020)
    sankey.fluxTagsUpdated()
    expect(link.are_related_flux_tags_selected).toBe(false)
  })

  it('filtres à choix multiple : l état de l étiquette générée suit la liste ; les appelants historiques la laissent en l état', () => {
    const { sankey } = makeApp()
    const source = sankey.addFluxTagGroup('source', 'Source', false)
    source.addTag('Agreste', 'agreste')
    const sans = source.untagged_tag!
    source.selectTagsFromIds(['agreste'])
    expect(sans.is_selected).toBe(true)
    source.selectTagsFromIds(['agreste'], true)
    expect(sans.is_selected).toBe(false)
    source.selectTagsFromIds(['agreste', sans.id], true)
    expect(sans.is_selected).toBe(true)
  })

  it('choix unique : choisir l étiquette générée désélectionne les autres ; annuler rend l état d avant', () => {
    const { app, sankey } = makeApp()
    const source = sankey.addFluxTagGroup('source', 'Source', false)
    const agreste = source.addTag('Agreste', 'agreste') as Class_Tag
    const sans = source.untagged_tag!
    source.selectTagsFromId(sans.id)
    expect(agreste.is_selected).toBe(false)
    expect(sans.is_selected).toBe(true)
    source.selectTagsFromId('agreste')
    expect(agreste.is_selected).toBe(true)
    expect(sans.is_selected).toBe(true)
    app.history.applyUndo()
    expect(agreste.is_selected).toBe(false)
    expect(sans.is_selected).toBe(true)
  })
})

describe('SA#553 — couleurs historiques et styles', () => {
  it('coloration par couleur d étiquette : un élément sans étiquette garde sa couleur', () => {
    const { sankey, collecte, laiteries } = makeApp()
    const type = sankey.addNodeTagGroup('type', 'Type', false)
    const produit = type.addTag('Produit', 'produit') as Class_Tag
    produit.color = '#ff0000'
    collecte.addTag(produit)
    const own_color = laiteries.getShapeColorToUse()
    type.use_colors = true
    expect(collecte.getShapeColorToUse()).toBe('#ff0000')
    expect(laiteries.getShapeColorToUse()).toBe(own_color)
  })

  it('son style s impose aux seuls éléments sans étiquette du groupe, par le groupe comme par elle', () => {
    const { sankey, collecte, laiteries, makeStyle } = makeApp()
    const type = sankey.addNodeTagGroup('type', 'Type', false)
    type.use_colors = true
    collecte.addTag(type.addTag('Produit', 'produit') as Class_Tag)
    const style = makeStyle('Sans type', { shape_opacity: 0.5 })
    type.untagged_tag!.style_id = style.id
    expect(type.style_id).toBe(style.id)
    expect(laiteries.shape_opacity).toBe(0.5)
    expect(collecte.tagStyleLayerImposing('shape_opacity')).toBeUndefined()
  })
})

describe('SA#553 — valeurs par défaut des paramètres réglés par les autres étiquettes', () => {
  function makeFiabilite() {
    const ctx = makeApp()
    const { sankey, collecte, laiteries, makeStyle } = ctx
    const fiab = sankey.addNodeTagGroup('fiabilite', 'Fiabilité', false)
    fiab.use_colors = true
    const robuste = fiab.addTag('Robuste', 'robuste') as Class_Tag
    collecte.addTag(robuste)
    robuste.style_id = makeStyle('Robuste', { shape_color: '#ff0000', shape_opacity: 0.3 }).id
    // Mise en forme locale du nœud sans étiquette : c'est elle que les défauts remplacent
    laiteries.shape_color = '#00ff00'
    laiteries.shape_opacity = 0.5
    laiteries.shape_border_thickness = 7
    return { ...ctx, fiab, robuste }
  }

  it('couleur et opacité réglées par les autres étiquettes : gris et 0,85 pour les éléments « Sans … »', () => {
    const { collecte, laiteries } = makeFiabilite()
    expect(collecte.shape_color).toBe('#ff0000')
    expect(laiteries.shape_color).toBe('#a9a9a9')
    expect(laiteries.shape_opacity).toBe(0.85)
    // Un paramètre qu'aucune étiquette ne règle reste celui de l'élément
    expect(laiteries.shape_border_thickness).toBe(7)
    expect(laiteries.tagStyleLayerImposing('shape_color')).toMatchObject({ from_group: true })
  })

  it('le style propre de l étiquette générée l emporte sur les valeurs par défaut', () => {
    const { laiteries, fiab, makeStyle } = makeFiabilite()
    fiab.untagged_tag!.style_id = makeStyle('Sans fiabilité', { shape_opacity: 0.2 }).id
    expect(laiteries.shape_opacity).toBe(0.2)
    expect(laiteries.shape_color).toBe('#a9a9a9')
  })

  it('aucune étiquette du groupe n a de style : rien n est imposé', () => {
    const { sankey, collecte, laiteries, makeStyle } = makeApp()
    const fiab = sankey.addNodeTagGroup('fiabilite', 'Fiabilité', false)
    fiab.use_colors = true
    collecte.addTag(fiab.addTag('Robuste', 'robuste') as Class_Tag)
    // Un style dans le diagramme, porté par un AUTRE groupe
    const autre = sankey.addNodeTagGroup('autre', 'Autre', false)
    autre.use_colors = true
    const x = autre.addTag('X', 'x') as Class_Tag
    collecte.addTag(x)
    laiteries.addTag(x)
    x.style_id = makeStyle('X', { shape_border_thickness: 3 }).id
    laiteries.shape_opacity = 0.5
    expect(laiteries.shape_opacity).toBe(0.5)
  })

  it('interrupteur du groupe fermé : aucune valeur par défaut imposée', () => {
    const { laiteries, fiab } = makeFiabilite()
    fiab.use_colors = false
    expect(laiteries.shape_opacity).toBe(0.5)
    expect(laiteries.shape_color).toBe('#00ff00')
  })
})

describe('SA#553 — format', () => {
  it('rien de saisi : aucune clé écrite, JSON identique à avant', () => {
    const { sankey } = makeApp()
    const source = sankey.addFluxTagGroup('source', 'Source', false)
    source.addTag('Agreste', 'agreste')
    const json = source.toJSON()
    expect(json['untagged_tag']).toBeUndefined()
    expect(json['tags_order']).toEqual(['agreste'])
    expect(Object.keys(json['tags'] as Type_JSON)).toEqual(['agreste'])
  })

  it('nom, définition, style, désélection : aller-retour JSON, recopie, et effacement sans résurgence', () => {
    const { sankey, makeStyle } = makeApp()
    const source = sankey.addFluxTagGroup('source', 'Source', false)
    source.addTag('Agreste', 'agreste')
    const sans = source.untagged_tag!
    const style = makeStyle('Sans source', { shape_opacity: 0.5 })
    sans.name = 'Source inconnue'
    sans.description = 'Flux sans source.'
    sans.style_id = style.id
    sans.setUnSelected()
    const json = source.toJSON()
    expect(json['untagged_tag']).toEqual({
      name: 'Source inconnue', description: 'Flux sans source.', style_id: style.id, selected: false
    })
    expect(json['style_id']).toBeUndefined()

    const reloaded = sankey.addFluxTagGroup('copie', 'Copie', false)
    reloaded.fromJSON(json)
    const sans2 = reloaded.untagged_tag!
    expect(sans2.name).toBe('Source inconnue')
    expect(sans2.description).toBe('Flux sans source.')
    expect(sans2.style_id).toBe(style.id)
    expect(sans2.is_selected).toBe(false)
    expect(sans2.id).toBe('copie__untagged')

    const other = sankey.addFluxTagGroup('autre', 'Autre', false)
    other.copyFrom(source)
    expect(other.untagged_tag!.name).toBe('Source inconnue')
    expect(other.untagged_tag!.is_selected).toBe(false)

    // Un JSON de groupe complet sans la clé = état par défaut (vue qui ne la décoche pas)
    const without_key = { ...json }
    delete without_key['untagged_tag']
    reloaded.fromJSON(without_key)
    expect(sans2.is_selected).toBe(true)
    expect(sans2.has_own_name).toBe(false)

    sans.name = ''
    sans.description = ''
    sans.style_id = undefined
    sans.setSelected()
    expect(source.toJSON()['untagged_tag']).toBeUndefined()
  })

  it('style de groupe du #541 : reporté au chargement sur l étiquette générée, plus écrit sur le groupe', () => {
    const { sankey, makeStyle } = makeApp()
    const style = makeStyle('Sans source', { shape_opacity: 0.5 })
    const source = sankey.addFluxTagGroup('source', 'Source', false)
    source.fromJSON({ name: 'Source', tags: {}, tags_order: [], style_id: style.id, use_colors: true })
    expect(source.untagged_tag!.style_id).toBe(style.id)
    const json = source.toJSON()
    expect(json['style_id']).toBeUndefined()
    expect((json['untagged_tag'] as Type_JSON)['style_id']).toBe(style.id)
  })

  it('clés inconnues de untagged_tag : traversent à l identique', () => {
    const { sankey } = makeApp()
    const source = sankey.addFluxTagGroup('source', 'Source', false)
    source.fromJSON({ name: 'Source', tags: {}, untagged_tag: { futur: 42 } })
    expect(source.toJSON()['untagged_tag']).toEqual({ futur: 42 })
  })
})
