// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1445 — LE SANKEY D'UNE COURONNE.
//
// Il ne fait qu'UNE chose : donner la bonne classe à la chaîne de fabriques. Tout le reste — les
// dictionnaires, les styles, la visibilité — est celui de la classe mère, et c'est le point : dans
// une couronne, les parts sont de VRAIS éléments. Le même inspecteur, les mêmes styles, le même
// liséré de surcharge.
//
// PAS DE FLUX, et ce n'est pas une omission. Une couronne est une hiérarchie, pas un réseau : ses
// anneaux sont des niveaux d'agrégation et ses arêtes sont des dimensions, déjà portées par les
// sujets. `createNewLink` n'est donc pas surchargé — personne n'en appelle.

import { Class_Sankey } from '../../types/Sankey'
import type { Class_NodeElement } from '../../Elements/Node'
import { Class_DonutPart } from './DonutPart'

export class Class_DonutSankey extends Class_Sankey {

  /**
   * Les parts naissent SANS sujet : `addNewNode` ne transporte que l'identifiant et le nom. C'est
   * `buildDonutParts` qui appelle `bindSubject` dans la foulée — et qui ne l'appelle PAS pour le
   * secteur résiduel, qui n'en a pas.
   */
  protected override createNewNode(id: string, name: string): Class_NodeElement {
    return new Class_DonutPart(id, name, this.drawing_area)
  }
}
