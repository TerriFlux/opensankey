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
