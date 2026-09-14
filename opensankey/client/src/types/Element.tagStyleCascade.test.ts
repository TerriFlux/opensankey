import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTag, Class_Tag } from './Tag'
import type { Class_ElementStyle } from '../Elements/Element'
import { effectiveOpacity } from '../Elements/elementOpacity'
import { getNameLabelValues } from '../Elements/ElementsAttributesConfig'

// jest 27/jsdom n'expose pas structuredClone (utilisé par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/**
 * SA#541 — cascade des STYLES D'ÉTIQUETTE sur de vraies classes.
 *
 * Arbitrages d'Alexandre (2026-09-14) : un style nommé par étiquette surcharge le style propre des
 * éléments ET leur mise en forme locale, sauf couleur verrouillée ; conflits réglés par l'ordre des
 * listes (groupe le plus bas, puis étiquette la plus bas) ; un groupe peut imposer un style aux
 * éléments qui ne portent aucune de ses étiquettes ; les styles d'un groupe ne s'appliquent que si
 * son interrupteur « Appliquer les styles associés » (`use_colors`) est ouvert. Côté flux,
 * résolution sur la valeur affichée.
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

describe('SA#541 — sans style d étiquette, rien ne change', () => {
  it('aucune couche, cascade intacte, même avec des étiquettes portées', () => {
    const { sankey, collecte } = makeApp()
    const fiab = sankey.addNodeTagGroup('fiabilite', 'Fiabilité', false)
    fiab.use_colors = true
    collecte.addTag(fiab.addTag('Robuste', 'robuste') as Class_Tag)
    const before = collecte.shape_opacity
    expect(sankey.has_tag_styles).toBe(false)
    expect(collecte.tag_style_layers).toHaveLength(0)
    collecte.shape_opacity = 0.3
    expect(collecte.shape_opacity).toBe(0.3)
    expect(before).not.toBe(0.3)
  })
})

describe('SA#541 — étiquettes de nœuds', () => {
  it('le style de l étiquette surcharge le style de l élément ET sa mise en forme locale', () => {
    const { sankey, collecte, laiteries, makeStyle } = makeApp()
    const fiab = sankey.addNodeTagGroup('fiabilite', 'Fiabilité', false)
    fiab.use_colors = true
    const robuste = fiab.addTag('Robuste', 'robuste') as Class_Tag
    collecte.addTag(robuste)
    collecte.shape_opacity = 0.3
    laiteries.shape_opacity = 0.3
    const style = makeStyle('Robuste', { shape_opacity: 0.8 })
    robuste.style_id = style.id

    expect(collecte.shape_opacity).toBe(0.8)
    expect(effectiveOpacity(collecte)).toBe(0.8)
    expect(laiteries.shape_opacity).toBe(0.3)
    // La provenance nomme l'étiquette
    expect(collecte.tagStyleLayerImposing('shape_opacity')?.owner).toBe(robuste)
    // Un paramètre que le style ne définit pas reste celui de l'élément
    collecte.shape_border_thickness = 7
    expect(collecte.shape_border_thickness).toBe(7)
    // Le fichier n'écrit jamais la valeur imposée : le réglage local est intact
    expect(collecte.attributes.shape_opacity).toBe(0.3)
  })

  it('interrupteur « Appliquer les styles associés » fermé : le groupe n impose rien', () => {
    const { sankey, collecte, makeStyle } = makeApp()
    const fiab = sankey.addNodeTagGroup('fiabilite', 'Fiabilité', false)
    const robuste = fiab.addTag('Robuste', 'robuste') as Class_Tag
    collecte.addTag(robuste)
    collecte.shape_opacity = 0.3
    robuste.style_id = makeStyle('Robuste', { shape_opacity: 0.8 }).id

    expect(fiab.use_colors).toBe(false)
    expect(sankey.has_tag_styles).toBe(false)
    expect(collecte.shape_opacity).toBe(0.3)
    fiab.use_colors = true
    expect(collecte.shape_opacity).toBe(0.8)
    fiab.use_colors = false
    expect(collecte.shape_opacity).toBe(0.3)
  })

  it('couleur : le style gagne, la couleur d étiquette historique ne s applique plus, le cadenas local tient', () => {
    const { sankey, collecte, laiteries, makeStyle } = makeApp()
    const fiab = sankey.addNodeTagGroup('fiabilite', 'Fiabilité', false)
    const robuste = fiab.addTag('Robuste', 'robuste') as Class_Tag
    const fiable = fiab.addTag('Fiable', 'fiable') as Class_Tag
    fiable.color = '#0000ff'
    collecte.addTag(robuste)
    laiteries.addTag(fiable)
    const own_color = laiteries.getShapeColorToUse()
    robuste.style_id = makeStyle('Robuste', { shape_color: '#ff0000' }).id
    collecte.shape_color = '#00ff00'
    fiab.use_colors = true

    expect(collecte.shape_color).toBe('#ff0000')
    expect(collecte.getShapeColorToUse()).toBe('#ff0000')
    // Groupe qui fonctionne par styles : « Fiable », sans style, ne colore plus en bleu
    expect(fiab.uses_tag_styles).toBe(true)
    expect(laiteries.getShapeColorToUse()).toBe(own_color)
    // Cadenas de couleur posé sur le nœud : sa couleur locale tient
    collecte.shape_color_sustainable = true
    expect(collecte.shape_color).toBe('#00ff00')
    expect(collecte.getShapeColorToUse()).toBe('#00ff00')
  })

  it('couleurs dérivées : une couleur de bordure imposée par un style tient, sans allumer le cadenas', () => {
    const { sankey, collecte, laiteries, makeStyle } = makeApp()
    const fiab = sankey.addNodeTagGroup('fiabilite', 'Fiabilité', false)
    fiab.use_colors = true
    const robuste = fiab.addTag('Robuste', 'robuste') as Class_Tag
    collecte.addTag(robuste)
    // Témoin : cadenas de bordure OUVERT sur les deux nœuds (il est verrouillé par défaut) —
    // la couleur ne peut alors tenir que par le style d'étiquette.
    collecte.shape_border_color_sustainable = false
    laiteries.shape_border_color_sustainable = false
    expect(collecte.keepsOwnColor('shape_border_color')).toBe(false)
    robuste.style_id = makeStyle('Robuste', { shape_border_color: '#123456' }).id

    expect(collecte.keepsOwnColor('shape_border_color')).toBe(true)
    expect(collecte.shape_border_color).toBe('#123456')
    // Le cadenas que lit l'inspecteur n'est pas allumé pour autant
    expect(collecte.shape_border_color_sustainable).toBe(false)
    expect(laiteries.keepsOwnColor('shape_border_color')).toBe(false)
  })

  it('libellés : une couleur de libellé imposée tient au dessin, le cadenas de l inspecteur reste éteint', () => {
    const { sankey, collecte, makeStyle } = makeApp()
    const fiab = sankey.addNodeTagGroup('fiabilite', 'Fiabilité', false)
    fiab.use_colors = true
    const robuste = fiab.addTag('Robuste', 'robuste') as Class_Tag
    collecte.addTag(robuste)
    // Témoin : cadenas de couleur du libellé OUVERT — la couleur ne peut tenir que par le style
    const attributes = collecte as unknown as { [k: string]: unknown }
    attributes['name_label_color_sustainable'] = false
    expect(getNameLabelValues(collecte, 'name_label').color_sustainable).toBe(false)
    robuste.style_id = makeStyle('Robuste', { name_label_color: '#654321' }).id

    const values = getNameLabelValues(collecte, 'name_label')
    expect(values.color).toBe('#654321')
    expect(values.color_sustainable).toBe(true)
    // Le cadenas que lit l'inspecteur reste ouvert
    expect(attributes['name_label_color_sustainable']).toBe(false)
  })

  it('conflits : l étiquette la plus bas de son groupe, puis le groupe le plus bas, l emportent', () => {
    const { sankey, collecte, makeStyle } = makeApp()
    const fiab = sankey.addNodeTagGroup('fiabilite', 'Fiabilité', false)
    fiab.use_colors = true
    const approx = fiab.addTag('Approximative', 'approximative') as Class_Tag
    const indicative = fiab.addTag('Indicative', 'indicative') as Class_Tag
    approx.style_id = makeStyle('Approximative', { shape_opacity: 0.4 }).id
    indicative.style_id = makeStyle('Indicative', { shape_opacity: 0.2 }).id
    collecte.addTag(indicative)
    collecte.addTag(approx)
    expect(collecte.shape_opacity).toBe(0.2)
    // Réordonner les étiquettes change le gagnant (cache invalidé)
    fiab.moveTagUp('indicative')
    expect(collecte.shape_opacity).toBe(0.4)

    const methode = sankey.addNodeTagGroup('methode', 'Méthode', false)
    methode.use_colors = true
    const collectee = methode.addTag('Collectée', 'collectee') as Class_Tag
    collectee.style_id = makeStyle('Collectée', { shape_opacity: 0.9 }).id
    collecte.addTag(collectee)
    expect(collecte.shape_opacity).toBe(0.9)
    sankey.moveTagGroupUp('node_taggs', 'methode')
    expect(collecte.shape_opacity).toBe(0.4)
  })

  it('style du groupe : imposé aux seuls éléments qui ne portent aucune de ses étiquettes', () => {
    const { sankey, collecte, laiteries, makeStyle } = makeApp()
    const fiab = sankey.addNodeTagGroup('fiabilite', 'Fiabilité', false)
    fiab.use_colors = true
    collecte.addTag(fiab.addTag('Fiable', 'fiable') as Class_Tag)
    const sans = makeStyle('Non qualifiée', { shape_opacity: 0.5 })
    fiab.style_id = sans.id

    expect(laiteries.shape_opacity).toBe(0.5)
    expect(laiteries.tagStyleLayerImposing('shape_opacity')).toMatchObject({ owner: fiab, from_group: true })
    expect(collecte.tagStyleLayerImposing('shape_opacity')).toBeUndefined()
  })

  it('éditer le style s applique aussitôt ; le supprimer le retire', () => {
    const { sankey, collecte, makeStyle } = makeApp()
    const fiab = sankey.addNodeTagGroup('fiabilite', 'Fiabilité', false)
    fiab.use_colors = true
    const robuste = fiab.addTag('Robuste', 'robuste') as Class_Tag
    collecte.addTag(robuste)
    collecte.shape_opacity = 0.3
    const style = makeStyle('Robuste', { shape_opacity: 0.8 })
    robuste.style_id = style.id
    expect(collecte.shape_opacity).toBe(0.8)
    ;(style as unknown as { shape_opacity: number }).shape_opacity = 0.6
    expect(collecte.shape_opacity).toBe(0.6)
    sankey.deleteElementStyle(style)
    expect(sankey.has_tag_styles).toBe(false)
    expect(collecte.shape_opacity).toBe(0.3)
  })

  it('le style par défaut, pré-rempli de tous les défauts usine, n est jamais une couche', () => {
    const { sankey, collecte } = makeApp()
    const fiab = sankey.addNodeTagGroup('fiabilite', 'Fiabilité', false)
    fiab.use_colors = true
    const robuste = fiab.addTag('Robuste', 'robuste') as Class_Tag
    collecte.addTag(robuste)
    robuste.style_id = sankey.default_style.id
    expect(sankey.has_tag_styles).toBe(false)
    expect(collecte.tag_style_layers).toHaveLength(0)
  })
})

describe('SA#541 — étiquettes de flux : la valeur affichée décide', () => {
  function makeLait() {
    const ctx = makeApp()
    const { sankey, link, makeStyle } = ctx
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
    const fiab = sankey.addFluxTagGroup('fiabilite', 'Fiabilité des données', false)
    fiab.use_colors = true
    const robuste = fiab.addTag('Robuste', 'robuste') as Class_Tag
    const indicative = fiab.addTag('Indicative', 'indicative') as Class_Tag
    robuste.style_id = makeStyle('Robuste', { shape_opacity: 0.8 }).id
    indicative.style_id = makeStyle('Indicative', { shape_opacity: 0.2, shape_color: '#cccccc' }).id
    return { ...ctx, y2019, y2020, selectYear, fiab, robuste, indicative }
  }

  it('le style suit la feuille affichée et CHANGE avec l année', () => {
    const { link, y2019, y2020, selectYear, robuste, indicative } = makeLait()
    link.valueForTag(y2019)!.addTag(robuste)
    link.valueForTag(y2020)!.addTag(indicative)

    expect(link.shape_opacity).toBe(0.8)
    expect(effectiveOpacity(link)).toBe(0.8)
    selectYear(y2020)
    expect(link.shape_opacity).toBe(0.2)
    expect(link.getShapeColorToUse()).toBe('#cccccc')
    selectYear(y2019)
    expect(link.shape_opacity).toBe(0.8)
  })

  it('cadenas de couleur posé sur le flux : sa couleur locale l emporte sur le style ET sur les règles', () => {
    const { link, y2019, indicative } = makeLait()
    link.valueForTag(y2019)!.addTag(indicative)
    link.shape_color = '#00ff00'
    expect(link.getShapeColorToUse()).toBe('#cccccc')
    link.shape_color_sustainable = true
    expect(link.getShapeColorToUse()).toBe('#00ff00')
  })

  it('deux étiquettes du même groupe sur une valeur : la plus bas dans la liste l emporte', () => {
    const { link, y2019, robuste, indicative } = makeLait()
    link.valueForTag(y2019)!.addTag(indicative)
    link.valueForTag(y2019)!.addTag(robuste)
    expect(link.shape_opacity).toBe(0.2)
  })

  it('flux ventilé (#285) : chaque bande prend le style de SA valeur', () => {
    const { sankey, link, robuste, indicative } = makeLait()
    const matiere = sankey.addFluxTagGroup('matiere', 'Matière', false)
    const tv1 = link.value!.addTaggedValue()
    tv1.value = 6
    tv1.addTag(matiere.addTag('MG', 'mg') as Class_Tag)
    tv1.addTag(robuste)
    const tv2 = link.value!.addTaggedValue()
    tv2.value = 4
    tv2.addTag(matiere.addTag('MP', 'mp') as Class_Tag)
    tv2.addTag(indicative)

    const bands = link.tagged_value_bands
    expect(bands.find(b => b.id === tv1.id)).toMatchObject({ opacity: 0.8 })
    expect(bands.find(b => b.id === tv2.id)).toMatchObject({ opacity: 0.2, color: '#cccccc' })
  })
})

describe('SA#541 — format : style_id écrit seulement quand il est posé', () => {
  it('étiquette et groupe : aller-retour JSON et recopie', () => {
    const { sankey, makeStyle } = makeApp()
    const fiab = sankey.addFluxTagGroup('fiabilite', 'Fiabilité', false)
    const robuste = fiab.addTag('Robuste', 'robuste') as Class_Tag
    const fiable = fiab.addTag('Fiable', 'fiable') as Class_Tag
    const style = makeStyle('Robuste', { shape_opacity: 0.8 })

    expect(fiab.toJSON()['style_id']).toBeUndefined()
    expect(robuste.toJSON()['style_id']).toBeUndefined()
    robuste.style_id = style.id
    fiab.style_id = style.id
    const json = fiab.toJSON()
    expect(json['style_id']).toBe(style.id)
    expect(robuste.toJSON()['style_id']).toBe(style.id)
    expect(fiable.toJSON()['style_id']).toBeUndefined()

    const copy = sankey.addFluxTagGroup('copie', 'Copie', false)
    copy.fromJSON(json)
    expect(copy.style_id).toBe(style.id)
    expect((copy.tags_dict['robuste'] as Class_Tag).style_id).toBe(style.id)

    const other = sankey.addFluxTagGroup('autre', 'Autre', false)
    other.copyFrom(fiab)
    expect(other.style_id).toBe(style.id)

    // Effacer = la clé disparaît (liste blanche du #527 : rien ne ressort du sac)
    robuste.style_id = undefined
    expect(Object.keys(robuste.toJSON())).not.toContain('style_id')
  })
})
