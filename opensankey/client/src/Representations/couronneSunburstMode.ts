// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// os#1527 (11/10/2026) — LA COURONNE EST-ELLE EN MODE SUNBURST ?
//
// Julien : « le mode sunburst et couronne ne partagent pas les paramètres […] il faut trouver ce qui
// est spécifique au sunburst et ce qui est commun avec les couronnes. » Un réglage PROPRE au
// sunburst (le trou du centre, `centre_hole_rings`) ne s'offre et ne s'applique que dans ce mode :
// la question « suis-je en sunburst ? » doit donc avoir UNE réponse, que le panneau (`visibleIf`,
// qui ne reçoit que le sac) et le tracé posent dans les mêmes termes. D'où ce module, sans import.
//
// LA RÈGLE : un anneau par niveau demandé pour toute la figure (`levels_display`) ou pour une de ses
// dimensions (`levels_display_by`). Une couronne EMBOÎTÉE (plusieurs dimensions en place, dessinées
// en anneaux par le même tracé) reste une couronne : elle garde le trou de la couronne.

type Type_Bag = { [key: string]: unknown }

/** La figure demande-t-elle « un anneau par niveau » (le sunburst) quelque part ? */
export const figureDrawsSunburst = (o: Type_Bag | null | undefined): boolean => {
  if (!o) return false
  if (o['levels_display'] === 'rings') return true
  const by = o['levels_display_by']
  return by !== null && typeof by === 'object' && !Array.isArray(by) &&
    Object.values(by as Type_Bag).includes('rings')
}
