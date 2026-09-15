// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// os#1409 - CE QUE LA GRILLE PRETE AU CONTROLE DE ZOOM.
//
// L'entree de registre du tableur vit dans la couche de BASE (`registerBaseRepresentations`),
// et Univer dans la couche EDITEUR : la base ne remonte pas vers l'editeur, donc l'entree ne
// peut pas appeler l'API d'Univer. La grille publie donc ici ce qu'elle sait faire, et l'entree
// lit ce depot - exactement le patron de `publishSpreadsheetNavigation`, qui resout le meme
// probleme pour les onglets et les colonnes.
//
// `null` PENDANT QU'AUCUNE GRILLE N'EST MONTEE, et c'est ce qui fait que le controle se grise
// au lieu d'avaler les clics : il n'y a alors personne a qui parler.
//
// L'INDICATEUR EN DIRECT est la charge de la grille, pas de ce module : c'est elle qui ecoute
// l'evenement de zoom d'Univer (molette, raccourcis, et jadis le curseur du pied) et notifie
// `ZOOM_TOPIC`. Un simple depot de fonctions n'a aucun moyen de savoir qu'Univer a bouge.

/**
 * Ce qu'une grille montee sait faire de son zoom. Les ratios sont ceux d'Univer : 1 = 100 %,
 * bornes 0,1 a 4 (cf. `FWorksheet.zoom`).
 */
export type Type_SpreadsheetZoomHandle = {
  getZoom: () => number
  setZoom: (ratio: number) => void
}

let _published: Type_SpreadsheetZoomHandle | null = null

/** La grille se presente au montage, et se retire au demontage en publiant `null`. */
export const publishSpreadsheetZoom = (handle: Type_SpreadsheetZoomHandle | null): void => {
  _published = handle
}

/** Ce que la grille a publie, ou `null` quand il n'y en a pas. */
export const spreadsheetZoomHandle = (): Type_SpreadsheetZoomHandle | null => _published
