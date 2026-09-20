// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1445 — LA ZONE DE DESSIN D'UNE COURONNE.
//
// Elle n'ajoute rien à `Class_DrawingArea` sinon la fabrique de sankey : c'est la dernière marche
// de la chaîne virtuelle `createNewDrawingArea` → `createNewSankey` → `createNewNode`, celle par
// laquelle les parts entrent dans le modèle sans qu'aucun appelant n'ait à les connaître.
//
// ELLE NE DESSINE RIEN, et c'est la différence avec l'étoile. Une étoile EST un Sankey : son moteur
// la trace. Une couronne est tracée par `SunburstChart` (des arcs d3), qui viendra lire les parts
// au lieu du sac de la figure — c'est l'étape 2 du contrat. Cette zone n'existe donc que pour deux
// choses, qui sont exactement ce qui manquait : faire marcher la CASCADE DES STYLES
// (`getElementProperty` remonte au style par la zone) et donner aux parts une place que
// l'inspecteur d'élément sait lire.

import { Class_DrawingArea } from '../../types/DrawingArea'
import { default_main_sankey_id } from '../../types/Utils'
import { Class_DonutSankey } from './DonutSankey'

export class Class_DonutDrawingArea extends Class_DrawingArea {

  protected override createNewSankey(id: string = default_main_sankey_id) {
    return new Class_DonutSankey(this, id)
  }
}
