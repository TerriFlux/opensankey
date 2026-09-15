// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

/**
 * Tirets d'un flux « Hachuré » (`shape_is_dashed`), en px monde : un trait plein, puis un vide, le
 * long du tracé. Module FEUILLE partagé par le tracé des flux (LinkDrawShape) et par le carré de
 * légende qui le reproduit (NodeDrawShape, SA#545) : les deux ne peuvent pas diverger.
 */
export const LINK_DASH_LENGTH = 10
export const LINK_DASH_GAP = 2
export const LINK_DASH_ARRAY = LINK_DASH_LENGTH + ',' + LINK_DASH_GAP
