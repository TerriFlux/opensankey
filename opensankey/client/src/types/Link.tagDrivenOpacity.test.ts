import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTag, Class_Tag } from './Tag'
import { effectiveOpacity } from '../Elements/elementOpacity'

// jest 27/jsdom n'expose pas structuredClone (utilisé par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/**
 * SA#541 — critère de recette n°2, sur de VRAIES classes : l'opacité d'un flux suit
 * l'étiquette de fiabilité de la valeur affichée, et change quand on change d'année.
 *
 * Forme reprise du Lait SOCLE (mesurée le 2026-09-13) : les étiquettes de fiabilité sont
 * posées sur la FEUILLE (une par année × unité), jusqu'à trois par valeur, et une valeur
 * sur deux n'en porte aucune.
 */
const LEVELS: { [id: string]: number } = { fiable: 1, robuste: 0.8, probable: 0.6, approximative: 0.4, indicative: 0.2 }

function makeLait() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const link = sankey.addNewLink(sankey.addNewNodeWithName('Collecte'), sankey.addNewNodeWithName('Laiteries'))
  link.valueCurrent = 100
  const annee = sankey.addDataTagGroup('annee', 'Année', false)
  const y2019 = annee.addTag('2019', 'y2019') as Class_DataTag
  const y2020 = annee.addTag('2020', 'y2020') as Class_DataTag
  const selectYear = (year: Class_DataTag) => {
    const other = year === y2019 ? y2020 : y2019
    year.setSelected()
    other.setUnSelected()
  }
  selectYear(y2019)
  link.valueForTag(y2019)!.valueData = 100
  link.valueForTag(y2020)!.valueData = 110
  const methode = sankey.addFluxTagGroup('methode', 'Méthode', false)
  const collectee = methode.addTag('Collectée', 'collectee') as Class_Tag
  const fiab = sankey.addFluxTagGroup('fiabilite', 'Fiabilité des données', false)
  const tags: { [id: string]: Class_Tag } = {}
  Object.entries(LEVELS).forEach(([id, opacity]) => {
    tags[id] = fiab.addTag(id, id) as Class_Tag
    tags[id].style_patch = { shape_opacity: opacity }
  })
  return { sankey, link, y2019, y2020, selectYear, fiab, methode, collectee, tags }
}

describe('SA#541 — opacité d un flux portée par la fiabilité de sa valeur affichée', () => {
  it('interrupteur fermé : les niveaux des étiquettes ne changent RIEN', () => {
    const { link, y2019, tags } = makeLait()
    link.valueForTag(y2019)!.addTag(tags.indicative)
    expect(link.tag_driven_opacity).toBeUndefined()
    expect(effectiveOpacity(link)).toBe(link.shape_opacity)
  })

  it('interrupteur ouvert : l opacité suit la feuille et CHANGE avec l année', () => {
    const { link, y2019, y2020, selectYear, fiab, tags } = makeLait()
    fiab.style_patch = { shape_opacity: 0.5 }
    link.valueForTag(y2019)!.addTag(tags.robuste)
    link.valueForTag(y2020)!.addTag(tags.indicative)

    expect(effectiveOpacity(link)).toBe(0.8)
    selectYear(y2020)
    expect(effectiveOpacity(link)).toBe(0.2)
    selectYear(y2019)
    expect(effectiveOpacity(link)).toBe(0.8)
  })

  it('deux étiquettes sur la même valeur : la moins fiable', () => {
    const { link, y2019, fiab, tags } = makeLait()
    fiab.style_patch = { shape_opacity: 0.5 }
    link.valueForTag(y2019)!.addTag(tags.approximative)
    link.valueForTag(y2019)!.addTag(tags.indicative)
    expect(effectiveOpacity(link)).toBe(0.2)
  })

  it('valeur sans étiquette du groupe : opacité du groupe, contour seulement sur demande', () => {
    const { link, y2019, y2020, selectYear, fiab, collectee, tags } = makeLait()
    fiab.style_patch = { shape_opacity: 0.5 }
    link.valueForTag(y2019)!.addTag(collectee) // étiquette d'un AUTRE groupe
    link.valueForTag(y2020)!.addTag(tags.fiable)

    expect(effectiveOpacity(link)).toBe(0.5)
    expect(link.shows_unqualified_outline).toBe(false)
    fiab.style_patch = { shape_opacity: 0.5, unqualified_outline: true }
    expect(link.shows_unqualified_outline).toBe(true)
    // La même valeur qualifiée l'année suivante : ni repli, ni contour
    selectYear(y2020)
    expect(effectiveOpacity(link)).toBe(1)
    expect(link.shows_unqualified_outline).toBe(false)
  })

  it('deux groupes activés : le premier dans l ordre des groupes pilote', () => {
    const { link, y2019, fiab, methode, collectee, tags } = makeLait()
    methode.style_patch = { shape_opacity: 0.3 }
    collectee.style_patch = { shape_opacity: 0.9 }
    fiab.style_patch = { shape_opacity: 0.5 }
    link.valueForTag(y2019)!.addTag(collectee)
    link.valueForTag(y2019)!.addTag(tags.indicative)
    expect(effectiveOpacity(link)).toBe(0.9)
  })

  it('flux ventilé (#285) : chaque bande prend l opacité de SA valeur', () => {
    const { sankey, link, fiab, tags } = makeLait()
    fiab.style_patch = { shape_opacity: 0.5 }
    const matiere = sankey.addFluxTagGroup('matiere', 'Matière', false)
    const mg = matiere.addTag('MG', 'mg') as Class_Tag
    const mp = matiere.addTag('MP', 'mp') as Class_Tag
    const value = link.value!
    const tv1 = value.addTaggedValue()
    tv1.value = 6
    tv1.addTag(mg)
    tv1.addTag(tags.fiable)
    const tv2 = value.addTaggedValue()
    tv2.value = 4
    tv2.addTag(mp)

    const bands = link.tagged_value_bands
    expect(bands.find(b => b.id === tv1.id)?.opacity).toBe(1)
    // Sans étiquette propre ni étiquette de feuille : non qualifiée
    expect(bands.find(b => b.id === tv2.id)?.opacity).toBe(0.5)
    // Une fiabilité posée sur la feuille vaut pour ses valeurs coordonnées sans étiquette
    value.addTag(tags.probable)
    expect(link.tagged_value_bands.find(b => b.id === tv2.id)?.opacity).toBe(0.6)
  })

  it('interrupteur fermé : les bandes restent structurellement identiques (pas de clé opacity)', () => {
    const { sankey, link, tags } = makeLait()
    const matiere = sankey.addFluxTagGroup('matiere', 'Matière', false)
    const tv = link.value!.addTaggedValue()
    tv.value = 6
    tv.addTag(matiere.addTag('MG', 'mg') as Class_Tag)
    tv.addTag(tags.fiable)
    expect(link.tagged_value_bands[0]).not.toHaveProperty('opacity')
  })
})
