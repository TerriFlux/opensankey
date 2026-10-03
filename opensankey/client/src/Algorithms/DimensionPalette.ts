// os#1511 — UNE PALETTE POUR UNE DIMENSION HIÉRARCHISÉE, quand elle n'en a pas.
//
// Un tag naît gris (`default_grey_color`) et la palette est une commande explicite du menu.
// C'est tenable tant qu'on choisit un membre à la fois : la couleur ne distingue rien. Dès que
// plusieurs membres se dessinent ensemble — en bandes ou en nœuds —, tout sort de la même
// couleur et le dessin ne dit plus rien. Constaté à l'écran le 28/09.
//
// os#1516 — LA RÈGLE EST CELLE DU BOUTON PALETTE, la palette hiérarchique hybride
// (`Class_DataTagGroup.applyHierarchicalPalette`). Il y en avait une seconde ici : une teinte par
// branche, la clarté selon la seule profondeur. Tous les frères sortaient donc de la MÊME couleur
// — les pays d'une région, les produits d'une filière —, précisément là où plusieurs se dessinent
// ensemble. Deux règles auraient aussi donné deux diagrammes selon qu'on ouvre le fichier ou qu'on
// clique le bouton. La recette est gardée, comme au bouton : les couleurs suivront la structure.
import { default_grey_color } from '../Elements/ElementsAttributesConfig'
import type { Class_DataTagGroup } from '../types/TagGroup'
import { computeHierarchicalColors, default_hierarchical_palette_params, type Type_PaletteNode } from './HierarchicalPalette'

/**
 * Pose la palette hiérarchique sur `dimension` si AUCUN de ses membres n'a de couleur propre.
 *
 * Ne touche à rien dès qu'une seule couleur a été choisie : un fichier déjà colorié garde ses
 * couleurs, et l'utilisateur qui en pose une garde la main sur tout le groupe.
 *
 * Rend le nombre de membres coloriés — 0 si la palette n'avait pas lieu d'être.
 */
export function applyHierarchyPaletteIfGrey(dimension: Class_DataTagGroup): number {
  if (!dimension.is_hierarchical) return 0
  const membres = dimension.tags_list
  if (membres.length === 0) return 0
  if (membres.some(membre => membre.color !== default_grey_color)) return 0

  dimension.applyHierarchicalPalette()
  // Poser des couleurs sans les nommer ne sert à rien : l'interrupteur `use_colors` est ce qui
  // fait entrer le groupe dans la LÉGENDE (cf. `tagGroupCarriesFormatting`). Une dimension
  // qu'on vient de colorier l'allume donc, pour que les bandes disent de quoi elles sont faites.
  dimension.use_colors = true
  return membres.length
}

/**
 * 03/10/2026 — LA COULEUR QU'UN MEMBRE MONTRE, quand la dimension n'est coloriée qu'EN PARTIE.
 *
 * Constaté sur le SOCLE « Pays partenaires - dimensions » : les quatorze filières ont leur couleur,
 * leurs 133 descendants sont restés gris. `applyHierarchyPaletteIfGrey` ne touche à rien (une
 * couleur a été choisie), donc une couronne zoomée sur Céréales, ou lue au niveau HS4, sortait
 * toute grise : chaque part avait la même couleur que sa voisine.
 *
 * Règle : la palette hiérarchique, avec chaque couleur CHOISIE (non grise) comme VERROU. Un membre
 * colorié garde exactement sa couleur ; un membre gris prend une nuance de la famille de son
 * ancêtre colorié, comme le ferait le bouton palette. Rien n'est écrit dans le modèle : c'est une
 * lecture, le fichier et le diagramme restent tels quels.
 *
 * Rend la couleur du tag telle quelle si aucun membre n'est gris (cas courant) ou si aucun ne l'est
 * pas (`applyHierarchyPaletteIfGrey` a sa main au chargement).
 */
const resolved_cache = new WeakMap<Class_DataTagGroup, { signature: string, colors: { [id: string]: string } }>()

export function resolvedMemberColors(dimension: Class_DataTagGroup): { [id: string]: string } {
  const membres = dimension.tags_list
  const signature = membres.map(m => `${m.id}:${m.color}:${m.parent?.id ?? ''}`).join('|')
  const known = resolved_cache.get(dimension)
  if (known !== undefined && known.signature === signature) return known.colors
  const colors: { [id: string]: string } = {}
  membres.forEach(m => { colors[m.id] = m.color })
  const greys = membres.filter(m => m.color === default_grey_color)
  if (dimension.is_hierarchical && greys.length > 0 && greys.length < membres.length) {
    const locks: { [id: string]: string } = {}
    membres.filter(m => m.color !== default_grey_color).forEach(m => { locks[m.id] = m.color })
    const nodes = new Map<string, Type_PaletteNode>()
    membres.forEach(m => nodes.set(m.id, { id: m.id, children: [] }))
    const roots: Type_PaletteNode[] = []
    membres.forEach(m => {
      const parent = m.parent
      const node = nodes.get(m.id) as Type_PaletteNode
      if (parent !== undefined && nodes.has(parent.id)) (nodes.get(parent.id) as Type_PaletteNode).children.push(node)
      else roots.push(node)
    })
    const computed = computeHierarchicalColors(roots, dimension.palette?.params ?? default_hierarchical_palette_params, locks)
    greys.forEach(m => { if (computed[m.id] !== undefined) colors[m.id] = computed[m.id] })
  }
  resolved_cache.set(dimension, { signature, colors })
  return colors
}
