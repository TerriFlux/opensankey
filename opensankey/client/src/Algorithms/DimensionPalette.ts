// os#1511 — UNE PALETTE POUR UNE DIMENSION HIÉRARCHISÉE, quand elle n'en a pas.
//
// Un tag naît gris (`default_grey_color`) et la palette est une commande explicite du menu.
// C'est tenable tant qu'on choisit un membre à la fois : la couleur ne distingue rien. Dès que
// plusieurs membres se dessinent ensemble — en bandes ou en nœuds —, tout sort de la même
// couleur et le dessin ne dit plus rien. Constaté à l'écran le 28/09.
//
// La couleur suit la PARENTÉ, ce qui est le seul choix qui porte de l'information ici : une
// teinte par branche de premier niveau, et un éclaircissement par cran de profondeur. Les pays
// d'Europe se ressemblent donc entre eux et se distinguent de ceux d'Afrique, à tous les
// niveaux de lecture.
import { default_grey_color } from '../Elements/ElementsAttributesConfig'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'

/** Teintes de départ, une par branche racine. Elles tournent si les branches sont nombreuses. */
const TEINTES = [210, 25, 145, 275, 55, 330, 185, 95, 300, 0]

/** Une couleur CSS à partir d'une teinte et d'une profondeur. */
function couleur(teinte: number, profondeur: number, profondeur_max: number): string {
  // Plus on descend, plus on éclaircit : un parent reste plus dense que ses enfants, ce qui se
  // lit comme « le total, puis son détail ». La plage s'arrête avant le blanc.
  const marche = profondeur_max > 0 ? profondeur / profondeur_max : 0
  const clarte = Math.round(38 + marche * 34)
  const saturation = Math.round(62 - marche * 18)
  return `hsl(${teinte}, ${saturation}%, ${clarte}%)`
}

/**
 * Pose une palette sur `dimension` si AUCUN de ses membres n'a de couleur propre.
 *
 * Ne touche à rien dès qu'une seule couleur a été choisie : un fichier déjà colorié garde ses
 * couleurs, et l'utilisateur qui en pose une garde la main sur tout le groupe.
 *
 * Rend le nombre de membres coloriés — 0 si la palette n'avait pas lieu d'être.
 */
export function applyHierarchyPaletteIfGrey(dimension: Class_DataTagGroup): number {
  if (!dimension.is_hierarchical) return 0
  const membres = dimension.tags_list as Class_DataTag[]
  if (membres.length === 0) return 0
  if (membres.some(membre => membre.color !== default_grey_color)) return 0

  const racines = membres.filter(membre => membre.parent === undefined)
  const profondeur_max = Math.max(1, dimension.levels.length - 1)
  let colories = 0
  racines.forEach((racine, rang) => {
    const teinte = TEINTES[rang % TEINTES.length]
    const descendre = (membre: Class_DataTag) => {
      membre.color = couleur(teinte, dimension.depthOf(membre), profondeur_max)
      colories++
      membre.children.forEach(enfant => descendre(enfant as Class_DataTag))
    }
    descendre(racine)
  })
  // Une racine unique donnerait une seule teinte pour tout l'axe : ses ENFANTS prennent alors
  // la relève, sans quoi « Monde » colorierait l'Europe et l'Afrique de la même couleur.
  if (racines.length === 1) {
    racines[0].children.forEach((branche, rang) => {
      const teinte = TEINTES[rang % TEINTES.length]
      const descendre = (membre: Class_DataTag) => {
        membre.color = couleur(teinte, dimension.depthOf(membre), profondeur_max)
        membre.children.forEach(enfant => descendre(enfant as Class_DataTag))
      }
      descendre(branche as Class_DataTag)
    })
  }
  return colories
}
