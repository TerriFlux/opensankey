// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1511 (Jean-Yves, 09/10/2026) — LA COMMANDE DU LECTEUR D'UNE DIMENSION. Le tableau du diagramme
// (os#1526) montre une ligne par dimension à niveaux, une colonne par niveau ; c'est l'outil de
// l'auteur. Pour un site publié, l'auteur choisit une commande plus simple, ligne par ligne :
//
// - `toggle` : une CASE (« Distinguer matière première, produits et coproduits ») — décochée, le
//   premier niveau ; cochée, le niveau suivant entier, en bandes sur les flux ;
// - `level`  : une LISTE DES NIVEAUX (« Niveau de détail des secteurs ») ;
// - `pick`   : une LISTE DES MEMBRES du premier niveau, à choix unique, et une case « Sélectionner
//   plusieurs… » qui passe en cases à cocher et trace un diagramme par membre ; le niveau suivant
//   (« Sous-filière ») n'apparaît que si le membre choisi en a.
//
// Module feuille : ni le modèle ni l'interface n'y sont importés.

export type Type_ReaderControlKind = 'toggle' | 'level' | 'pick'

export interface Type_ReaderControl {
  kind: Type_ReaderControlKind
  /** Le libellé de la commande ; absent : le nom de la dimension. */
  label?: string
  /** `pick` : le libellé de la case « plusieurs » (« Sélectionner plusieurs filières »). */
  multi_label?: string
}

const KINDS: Type_ReaderControlKind[] = ['toggle', 'level', 'pick']

/** La commande lue d'un JSON, ou `undefined` si elle est absente ou mal formée. */
export const parseReaderControl = (raw: unknown): Type_ReaderControl | undefined => {
  if (raw === null || typeof raw !== 'object') return undefined
  const o = raw as { [k: string]: unknown }
  if (!KINDS.includes(o.kind as Type_ReaderControlKind)) return undefined
  const control: Type_ReaderControl = { kind: o.kind as Type_ReaderControlKind }
  if (typeof o.label === 'string' && o.label.trim() !== '') control.label = o.label
  if (typeof o.multi_label === 'string' && o.multi_label.trim() !== '') control.multi_label = o.multi_label
  return control
}
