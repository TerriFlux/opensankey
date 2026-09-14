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

// Le nom d'un élément TEL QUE LE DIAGRAMME L'AFFICHE — source unique pour tout ce
// qui parle d'un nœud ou d'un flux ailleurs que sur le dessin.
//
// POURQUOI : un nœud n'affiche pas forcément son `name`. Le style
// `name_label_source` peut désigner un tag, le nœud ANCÊTRE d'une dimension, un
// gabarit à jetons (OS#1314) ou un texte libre, et c'est le getter
// `name_label_effective` (Class_NodeBase) qui produit le libellé réellement
// dessiné. Les surfaces qui citaient `name` (graphiques d'analyse, fenêtres de la
// grande zone, blocs de présentation) donnaient donc à l'auteur un AUTRE nom que
// celui qu'il a sous les yeux sur son diagramme.
//
// ACCÈS EN CANARD (`'x' in el`) sur un `unknown` : les appelants manipulent des
// vues structurelles minimales (`Type_Presentable` n'a que
// `{id, name?, getElementProperty}`) autant que des classes complètes, et importer
// ici les classes concrètes recréerait des cycles d'import (Element ↔ Handler).

/** Un élément vu comme un sac de propriétés, ou rien du tout. */
const asRecord = (el: unknown): Record<string, unknown> | null =>
  (typeof el === 'object' && el !== null) ? el as Record<string, unknown> : null

const readString = (v: unknown): string => typeof v === 'string' ? v : ''

/** Un flux se reconnaît à ses deux extrémités, sans importer Class_LinkElement. */
export const isLinkLikeElement = (el: unknown): boolean => {
  const rec = asRecord(el)
  return !!rec && 'source' in rec && 'target' in rec
}

/**
 * Libellé affiché d'un NŒUD (ou d'une zone de texte), SANS repli sur l'id.
 *
 * Le libellé effectif peut être vide de plein droit (texte libre effacé, gabarit
 * dont aucun jeton ne résout) : on retombe alors sur le nom, jamais sur du vide.
 * L'absence de repli sur l'id est délibérée — elle laisse l'appelant distinguer
 * « pas de nom à montrer » (bloc de présentation qui s'efface) de « nom vide ».
 */
export const displayedLabelOf = (el: unknown): string => {
  const rec = asRecord(el)
  if (!rec) return ''
  const effective = readString(rec['name_label_effective'])
  if (effective.trim() !== '') return effective
  return readString(rec['name'])
}

/**
 * Nom affiché d'un élément — nœud ou flux — avec repli `name` puis `id`.
 *
 * Un flux n'a pas de nom propre : il se nomme par ses deux bouts, chacun pris à
 * son libellé AFFICHÉ (« Chêne → Scierie »), sans quoi le flux serait cité avec
 * des noms de nœuds que le diagramme ne montre nulle part.
 */
export const displayedNameOf = (el: unknown): string => {
  const rec = asRecord(el)
  if (!rec) return ''
  if (isLinkLikeElement(rec)) {
    const src = displayedNameOf(rec['source'])
    const tgt = displayedNameOf(rec['target'])
    if (src !== '' || tgt !== '') return `${src} → ${tgt}`
    return readString(rec['id'])
  }
  const label = displayedLabelOf(rec)
  return label !== '' ? label : readString(rec['id'])
}
