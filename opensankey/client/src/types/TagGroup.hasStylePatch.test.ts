import { Class_NodeTagGroup, Class_FluxTagGroup, Class_DataTagGroup } from './TagGroup'
import { tagGroupCarriesFormatting } from '../Elements/legendItems'
import type { Class_Sankey } from './Sankey'

/**
 * Raccord #533 ↔ #537 — le prédicat de légende du #533 lit un booléen
 * `has_style_patch` ; le socle de format du #537 pose l'objet `style_patch`.
 * Menés en parallèle, les deux tickets s'étaient promis cette interface chacun
 * avec son propre nom : aucune classe n'exposait `has_style_patch`, donc un
 * groupe portant une mise en forme autre que la couleur n'entrait jamais en
 * légende.
 *
 * Les tests du #533 le laissaient passer parce qu'ils fabriquent des groupes
 * SIMULÉS, où l'on peut écrire `has_style_patch: true` à la main. Ces cas-ci
 * passent par les VRAIES classes : c'est la seule façon de voir le raccord.
 */

const fakeSankey = {
  nodeTagsUpdated: () => { /* no-op */ },
  fluxTagsUpdated: () => { /* no-op */ },
  dataTagsUpdated: () => { /* no-op */ },
  drawing_area: {
    legend: { draw: () => { /* no-op */ } },
    application_data: { language: 'fr' },
  },
} as unknown as Class_Sankey

type Predicate = Parameters<typeof tagGroupCarriesFormatting>[0]

describe('raccord #533 ↔ #537 — has_style_patch sur les vraies classes', () => {

  it('un groupe sans patch ni couleur reste hors légende (aucun fichier existant ne change)', () => {
    const group = new Class_FluxTagGroup('fiab', 'Fiabilité', fakeSankey, false)
    expect(group.use_colors).toBe(false)
    expect(group.has_style_patch).toBe(false)
    expect(tagGroupCarriesFormatting(group as unknown as Predicate)).toBe(false)
  })

  it('un groupe qui porte un patch de mise en forme entre en légende, sans piloter la couleur', () => {
    const group = new Class_FluxTagGroup('fiab', 'Fiabilité', fakeSankey, false)
    group.style_patch = { shape_opacity: 0.85 }
    expect(group.use_colors).toBe(false)
    expect(group.has_style_patch).toBe(true)
    expect(tagGroupCarriesFormatting(group as unknown as Predicate)).toBe(true)
  })

  it('couvre aussi les groupes de données, qui n\'héritent pas de Class_TagGroup', () => {
    // Raison même de poser le getter sur la classe COMMUNE : un getter posé sur
    // Class_TagGroup aurait raté en silence tous les groupes de data tags.
    const group = new Class_DataTagGroup('annee', 'Année', fakeSankey, false)
    expect(group.has_style_patch).toBe(false)
    group.style_patch = { shape_opacity: 0.85 }
    expect(group.has_style_patch).toBe(true)
    expect(tagGroupCarriesFormatting(group as unknown as Predicate)).toBe(true)
  })

  it('vider le patch referme la porte', () => {
    const group = new Class_NodeTagGroup('src', 'Source', fakeSankey, false)
    group.style_patch = { shape_opacity: 0.5 }
    group.style_patch = {}
    expect(group.has_style_patch).toBe(false)
    expect(tagGroupCarriesFormatting(group as unknown as Predicate)).toBe(false)
  })

  it('le patch relu depuis un fichier allume le prédicat, et un fichier muet ne l\'allume pas', () => {
    const muet = new Class_FluxTagGroup('g1', 'Méthode', fakeSankey, false)
    muet.fromJSON({ name: 'Méthode', tags: { t0: { name: 'Mesurée' } } })
    expect(muet.has_style_patch).toBe(false)

    const porteur = new Class_FluxTagGroup('g2', 'Fiabilité', fakeSankey, false)
    porteur.fromJSON({ name: 'Fiabilité', style_patch: { shape_opacity: 0.85 }, tags: { t0: { name: 'Fiable' } } } as never)
    expect(porteur.has_style_patch).toBe(true)
  })
})
