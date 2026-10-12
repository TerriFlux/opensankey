// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================

// sa#642 — LA FORME ET LA PLACE D'UN SÉLECTEUR, réglées à part du nombre de membres.
//
// Un sélecteur de groupe d'étiquettes (nœuds, flux, dimension, niveaux) répond désormais à trois
// questions indépendantes : COMBIEN (`banner` : aucun / unique / multiple), SOUS QUELLE FORME (liste,
// rangée de boutons, frise) et OÙ (panneau Filtres, barre du haut, barre du bas). La forme était
// imposée par le mode (la séquence prenait la barre du bas, en boutons) ; la frise d'avant os#1511
// revient comme une forme parmi d'autres.
//
// Un choix inutilisable n'est jamais masqué : il est GRISÉ, et dit pourquoi et quand il serait
// possible. Un réglage enregistré qui le devient après coup (données régénérées) reste enregistré,
// et l'affichage retombe sur la liste. Ce module ne dépend de rien : les hôtes (panneau, barres) et
// les réglages lisent les mêmes règles.

export type Type_SelectorForm = 'list' | 'buttons' | 'stepper'
export type Type_SelectorPlace = 'panel' | 'top' | 'bottom'

export const SELECTOR_FORMS: Type_SelectorForm[] = ['list', 'buttons', 'stepper']
export const SELECTOR_PLACES: Type_SelectorPlace[] = ['panel', 'top', 'bottom']

export const isSelectorForm = (value: unknown): value is Type_SelectorForm =>
  typeof value === 'string' && (SELECTOR_FORMS as string[]).includes(value)
export const isSelectorPlace = (value: unknown): value is Type_SelectorPlace =>
  typeof value === 'string' && (SELECTOR_PLACES as string[]).includes(value)

/**
 * Au-delà, une rangée de boutons ne tient plus en choix MULTIPLE. En choix unique il n'y a pas de
 * seuil : au-delà de ce nombre, la rangée devient un curseur (os#1511, la ligne compacte de Julien).
 */
export const SELECTOR_BUTTONS_MAX = 6
/** Au-delà, la frise (une étape ronde et un nom par valeur) ne tient plus sur une ligne. */
export const SELECTOR_STEPPER_MAX = 30

/** Ce que les règles regardent d'un sélecteur. */
export type Type_SelectorLayoutCandidate = {
  banner: string
  /** Nombre de valeurs que le sélecteur propose. */
  value_count: number
}

/** Pourquoi un choix est refusé : une clé de traduction et ses paramètres ; `null` s'il est possible. */
export type Type_SelectorLayoutRefusal = { key: string, count: number, max: number } | null

/** La forme `form` est-elle utilisable pour ce sélecteur ? */
export const selectorFormRefusal = (
  form: Type_SelectorForm, candidate: Type_SelectorLayoutCandidate
): Type_SelectorLayoutRefusal => {
  const count = candidate.value_count
  if (form === 'buttons' && candidate.banner === 'multi' && count > SELECTOR_BUTTONS_MAX) {
    return { key: 'Tags.selector.refused_buttons_multi', count, max: SELECTOR_BUTTONS_MAX }
  }
  if (form === 'stepper' && count > SELECTOR_STEPPER_MAX) {
    return { key: 'Tags.selector.refused_stepper', count, max: SELECTOR_STEPPER_MAX }
  }
  return null
}

/**
 * La place `place` accepte-t-elle ce sélecteur ? Toutes l'acceptent aujourd'hui : la barre du haut
 * prend le choix multiple (en liste à cases), la barre du bas n'est plus réservée à la lecture. La
 * règle existe pour qu'une place qui refuserait un cas le dise comme une forme refusée.
 */
export const selectorPlaceRefusal = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _place: Type_SelectorPlace, _candidate: Type_SelectorLayoutCandidate
): Type_SelectorLayoutRefusal => null

/**
 * La forme DESSINÉE : celle que l'auteur a choisie, ou celle d'aujourd'hui s'il n'a rien choisi
 * (rangée de boutons dans la barre du bas, la ligne de la séquence ; liste ailleurs) ; une forme
 * refusée retombe sur la liste, sans que le réglage soit effacé.
 */
export const effectiveSelectorForm = (
  stored: Type_SelectorForm | undefined, place: Type_SelectorPlace, candidate: Type_SelectorLayoutCandidate
): Type_SelectorForm => {
  const wanted = stored ?? (place === 'bottom' ? 'buttons' : 'list')
  return selectorFormRefusal(wanted, candidate) === null ? wanted : 'list'
}
