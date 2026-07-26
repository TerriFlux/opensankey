// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

/**
 * Constantes et helpers de base des éléments — module FEUILLE, AUCUN import, et il doit le rester.
 *
 * Pourquoi il existe : `Element.tsx` avait besoin de ces cinq symboles et les prenait dans
 * `types/Utils.tsx`. Or `Utils` importe `Node` à l'exécution (un `instanceof Class_NodeElement`),
 * et `Node` mène à `NodeBase` → `DrawLabel` → `Handler`, où `Handler` fait
 * `class Class_Handler extends Class_BaseElement` AU NIVEAU MODULE.
 *
 * Il existait donc un chemin runtime `Element → Utils → NodeBase → Handler → Element`, c'est-à-dire
 * un cycle dans lequel `Handler` étend une classe dont le module n'a pas fini de s'évaluer :
 * « can't access lexical declaration 'Class_BaseElement' before initialization ». Le cycle était
 * latent — il n'explosait que selon l'arête par laquelle le graphe des Elements était entré en
 * premier, ce qui le rendait sensible au moindre changement d'ordre d'imports ailleurs dans l'appli.
 *
 * L'invariant à préserver est donc : **aucun chemin d'imports runtime de `Element.tsx` vers
 * `Handler.tsx`**. Il ne dépend d'aucun ordre d'évaluation, contrairement aux contournements par
 * réordonnancement.
 *
 * `Utils.tsx` réexporte tout ce qui suit : les imports existants continuent de fonctionner.
 */

export type Type_BaseElementPosition = {
  x: number
  y: number
}

export const const_default_position_x = 200
export const const_default_position_y = 200

export const default_style_id = 'default'

/**
 * Identifiant aléatoire court, utilisé pour nommer les éléments créés.
 *
 * @param length longueur de l'identifiant
 */
export function randomId(length: number = 5) {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  let counter = 0
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
    counter += 1
  }
  return result
}
