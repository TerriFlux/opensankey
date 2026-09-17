// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

/**
 * SA#541 — STYLES D'ÉTIQUETTE : quels styles nommés les étiquettes imposent à un élément.
 *
 * Une étiquette (de nœuds ou de flux) peut porter un style nommé de la liste des Styles. Ce style
 * SURCHARGE le style propre des éléments qui la portent — et leur mise en forme locale — pour les
 * seuls paramètres qu'il définit. Un groupe peut aussi porter un style, imposé aux éléments qui ne
 * portent AUCUNE de ses étiquettes (valeurs « non qualifiées » : 26,5 % des valeurs SOCLE).
 *
 * Règles arbitrées par Alexandre le 2026-09-14, écrites ici et nulle part ailleurs :
 *  - ordre des listes : le groupe le plus BAS dans la liste des groupes l'emporte, puis, dans un
 *    groupe, l'étiquette la plus BAS dans sa liste. Avec « Fiable → Indicative » dans cet ordre,
 *    une valeur « approximative | indicative » prend le style d'« Indicative » ;
 *  - la mise en forme locale d'un élément est surchargée, SAUF couleur verrouillée par son cadenas
 *    (`<attribut>_sustainable` posé sur l'élément). Aucun autre cadenas n'existe.
 *
 * Module FEUILLE, sans aucun import : groupes, étiquettes et styles sont typés structurellement,
 * pour rester testable sans diagramme et hors du cycle `Element → … → Handler → Element`
 * (même parti pris qu'`elementOpacity.ts`).
 */

/** Porteur d'un style d'étiquette : l'id du style nommé qu'il impose (absent = aucun). */
export type Type_TagStyleOwner = { style_id?: string }

/** Groupe d'étiquettes : son propre style (éléments sans étiquette) et ses étiquettes, dans l'ordre. */
export type Type_TagStyleGroup<T extends Type_TagStyleOwner> = Type_TagStyleOwner & {
  tags_list: readonly T[]
}

/**
 * Une couche de style imposée à un élément. `owner` est l'étiquette — ou le groupe, pour les
 * éléments sans étiquette — qui l'impose : l'inspecteur le nomme dans la provenance d'un paramètre.
 */
export type Type_TagStyleLayer<S, O> = {
  style: S
  owner: O
  /** Vrai quand la couche vient du style du GROUPE (l'élément ne porte aucune de ses étiquettes). */
  from_group: boolean
}

/**
 * Couches imposées à un élément, de la MOINS prioritaire à la PLUS prioritaire (la dernière qui
 * définit un paramètre l'emporte, comme dans la liste de styles d'un élément).
 *
 * @param groups  groupes d'étiquettes de la famille de l'élément, dans l'ordre de leur liste
 * @param carries l'élément (ou la valeur affichée d'un flux) porte-t-il cette étiquette ?
 * @param lookup  style nommé d'après son id ; `undefined` pour un id inconnu (style supprimé) ou
 *                inutilisable, qui est alors ignoré
 */
export function tagStyleLayers<T extends Type_TagStyleOwner, G extends Type_TagStyleOwner, S>(
  // `tags_list` porté par le paramètre lui-même : c'est ce qui permet de déduire le type des
  // étiquettes (T) des groupes passés, et donc de typer `carries`.
  groups: readonly (G & Type_TagStyleGroup<T>)[],
  carries: (tag: T) => boolean,
  lookup: (style_id: string) => S | undefined
): Type_TagStyleLayer<S, G | T>[] {
  const layers: Type_TagStyleLayer<S, G | T>[] = []
  groups.forEach(group => {
    let carries_one = false
    group.tags_list.forEach(tag => {
      if (!carries(tag)) return
      carries_one = true
      const style = tag.style_id ? lookup(tag.style_id) : undefined
      if (style !== undefined) layers.push({ style, owner: tag, from_group: false })
    })
    if (carries_one || !group.style_id) return
    const style = lookup(group.style_id)
    if (style !== undefined) layers.push({ style, owner: group, from_group: true })
  })
  return layers
}

/**
 * La couche la plus prioritaire qui DÉFINIT le paramètre, ou `undefined`.
 *
 * @param defined valeur explicite du paramètre dans un style (`undefined` = non défini)
 */
export function topLayerDefining<S, O>(
  layers: readonly Type_TagStyleLayer<S, O>[],
  defined: (style: S) => unknown
): Type_TagStyleLayer<S, O> | undefined {
  for (let i = layers.length - 1; i >= 0; i--) {
    if (defined(layers[i].style) !== undefined) return layers[i]
  }
  return undefined
}

/** Suffixe des cadenas de couleur (`shape_color` → `shape_color_sustainable`). */
export const COLOR_LOCK_SUFFIX = '_sustainable'

/**
 * Index « paramètre de couleur → son cadenas », construit depuis la liste des attributs connus :
 * seuls les paramètres qui ont réellement un cadenas y figurent.
 */
export function buildColorLockIndex(attribute_keys: readonly string[]): { [attribute: string]: string } {
  const known = new Set(attribute_keys)
  const index: { [attribute: string]: string } = {}
  attribute_keys.forEach(key => {
    if (!key.endsWith(COLOR_LOCK_SUFFIX)) return
    const locked = key.slice(0, -COLOR_LOCK_SUFFIX.length)
    if (known.has(locked)) index[locked] = key
  })
  return index
}

/**
 * SA#551 — porteurs (étiquettes, ou groupe pour les éléments sans étiquette) dont la couche est EN
 * VIGUEUR sur un élément : elle est la plus prioritaire à définir au moins un de ses paramètres.
 * Une couche dont tous les paramètres sont redéfinis par des couches plus prioritaires n'affiche
 * rien sur cet élément (arbitrage d'Alexandre, 2026-09-17 : Source ouverte au-dessus de Méthode
 * supplante toutes les couleurs de Méthode).
 *
 * @param defined_keys paramètres que définit un style
 */
export function layerOwnersInEffect<S, O>(
  layers: readonly Type_TagStyleLayer<S, O>[],
  defined_keys: (style: S) => readonly string[],
  into: Set<O> = new Set<O>()
): Set<O> {
  const taken = new Set<string>()
  for (let i = layers.length - 1; i >= 0; i--) {
    let in_effect = false
    defined_keys(layers[i].style).forEach(key => {
      if (taken.has(key)) return
      taken.add(key)
      in_effect = true
    })
    if (in_effect) into.add(layers[i].owner)
  }
  return into
}
