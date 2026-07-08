// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// #242 — Logique PURE des seuils d'affichage flux/label/stock (unité 'value' ou 'pixel'),
// extraite de Class_DrawingArea. L'ÉTAT (les champs `_filter_*`) reste sur la DA (accédé en
// bracket-access par SankeyPersistence) ; seule la logique de décision vit ici, sans `this`,
// donc testable en isolation. La DA délègue à ces fonctions.

export type Type_FilterUnit = 'value' | 'pixel'

/**
 * Seuil d'affichage du LABEL d'un nœud selon l'unité active.
 * En 'pixel' : hauteur de bande locale × zoom live comparée au seuil px (seuil <= 0 => pas de
 * filtre). En 'value' : valeur de donnée du nœud comparée au seuil valeur.
 */
export function nodeLabelPassesThreshold(
  filter_unit: Type_FilterUnit,
  filter_node_px: number,
  filter_node: number,
  value: number,
  height_px: number,
  zoom_scale: number
): boolean {
  if (filter_unit === 'pixel') {
    if (!(filter_node_px > 0)) return true
    return height_px * zoom_scale >= filter_node_px
  }
  if (!(filter_node > 0)) return true
  return value >= filter_node
}

/**
 * Seuil d'affichage du LABEL de stock. `abs_value === null` => jamais masqué. Même sémantique
 * 'pixel'/'value' que le label de nœud (l'appelant fournit la hauteur RÉELLEMENT rendue du
 * stock — facteur d'échelle stock inclus — pour rester sur l'échelle visuelle du seuil flux).
 */
export function stockLabelPassesThreshold(
  filter_unit: Type_FilterUnit,
  filter_stock_px: number,
  filter_stock: number,
  abs_value: number | null,
  height_px: number,
  zoom_scale: number
): boolean {
  if (abs_value === null) return true
  if (filter_unit === 'pixel') {
    if (!(filter_stock_px > 0)) return true
    return height_px * zoom_scale >= filter_stock_px
  }
  if (!(filter_stock > 0)) return true
  return abs_value >= filter_stock
}

/**
 * true si un seuil exprimé en pixels est actif (unité 'pixel' + au moins un seuil px > 0). Sert
 * à ne redéclencher un re-tracé au zoom que quand c'est utile (les pixels écran dépendent du zoom).
 */
export function hasActivePixelFilter(
  filter_unit: Type_FilterUnit,
  filter_link_value_px: number,
  filter_label_px: number,
  filter_node_px: number,
  filter_stock_px: number
): boolean {
  return filter_unit === 'pixel' && (
    filter_link_value_px > 0 ||
    filter_label_px > 0 ||
    filter_node_px > 0 ||
    filter_stock_px > 0
  )
}
