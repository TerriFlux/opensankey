// Encodage des vues en DELTA vs le maître (issue #254).
//
// PROBLÈME — chaque vue « heavy » était persistée en SNAPSHOT INTÉGRAL de sa
// drawing area. Or une vue ne diffère du maître que par une poignée d'attributs
// (positions, visibilité, styles). Mesuré sur le corpus : les vues pèsent 98 %
// de `Tutoriel.json` (17,9 Mo de vues pour 300 Ko de maître) — on trimballait
// 57 fois le même diagramme.
//
// POURQUOI CE N'EST PAS UN RETOUR AU FORMAT LEGACY (qui, lui, était dangereux) —
// le format historique stockait le diff comme MODÈLE : la vue *était* un patch,
// réappliqué à la volée sur le maître. Piège fatal : dès que le maître était
// édité, tous les patchs stockés devenaient périmés et se réappliquaient faux.
//
// Ici le delta n'est QU'UN ENCODAGE DE SÉRIALISATION, jamais un modèle :
//   - en mémoire, les vues restent des snapshots complets (runtime inchangé) ;
//   - `encodeViewsAsDelta` calcule le patch au moment de la sauvegarde, quand le
//     maître et la vue sont cohérents par construction ;
//   - `decodeViewsFromDelta` le ré-étend en snapshot complet au chargement.
// Le patch ne SURVIT donc jamais à une édition du maître : il n'existe qu'à
// l'intérieur du fichier. La dérive est structurellement impossible.
//
// GARDE-FOU — chaque patch est immédiatement RÉAPPLIQUÉ et comparé à la vue
// d'origine. S'il ne la reconstitue pas à l'identique, on retombe sur le
// snapshot intégral pour cette vue. La perte de donnée est donc impossible par
// construction, pas par confiance.
//
// BASE — définie de façon strictement identique à l'écriture et à la lecture :
// c'est la RACINE PRIVÉE DE SA CLÉ `views`. Maître et vues sont tous deux
// produits par `DrawingAreaPersistenceOSP.toJSON` et portent donc les mêmes clés
// racines (`version`, `format_version`, `node_pos_is_center`…) : les deux formes
// sont symétriques, et le patch les annule mutuellement.
import type { Type_JSON } from '@terriflux/opensankey/src/types/Utils'

/** Clé portant les noms de clés supprimées à un niveau donné du patch. */
export const DELETED_KEY = '__deleted'
/** Marqueur d'une entrée de vue encodée en delta. */
export const PATCH_KEY = '__patch'

type JSONRecord = Record<string, unknown>

/** Vrai pour un objet « dictionnaire » simple (ni null, ni tableau). */
function isPlainObject(v: unknown): v is JSONRecord {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Égalité structurelle profonde (JSON : pas de cycles, pas d'undefined). */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    return a.every((v, i) => deepEqual(v, b[i]))
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const ka = Object.keys(a)
    const kb = Object.keys(b)
    if (ka.length !== kb.length) return false
    return ka.every(k => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]))
  }
  return false
}

/**
 * Patch STRUCTUREL élagué : même forme que la base, réduit aux seules clés qui
 * diffèrent, plus la liste des clés supprimées à chaque niveau.
 *
 * Les TABLEAUX sont traités comme des valeurs ATOMIQUES (remplacés en bloc s'ils
 * diffèrent). C'est délibéré : le diff élément par élément est précisément là où
 * naissent les bugs de décalage d'index. Les collections qui comptent (nœuds,
 * flux) sont de toute façon des dictionnaires indexés par identifiant — donc
 * diffées finement ET insensibles à l'ordre.
 *
 * @returns le patch, ou `undefined` si base et cible sont identiques.
 */
export function diffStructural(base: unknown, target: unknown): unknown {
  if (deepEqual(base, target)) return undefined
  // Types incompatibles (ou tableau/primitive) → remplacement en bloc.
  if (!isPlainObject(base) || !isPlainObject(target)) return { $set: target }

  const patch: JSONRecord = {}
  const deleted: string[] = []

  for (const key of Object.keys(target)) {
    if (!Object.prototype.hasOwnProperty.call(base, key)) {
      patch[key] = { $set: target[key] }
      continue
    }
    const sub = diffStructural(base[key], target[key])
    if (sub !== undefined) patch[key] = sub
  }
  for (const key of Object.keys(base)) {
    if (!Object.prototype.hasOwnProperty.call(target, key)) deleted.push(key)
  }
  if (deleted.length > 0) patch[DELETED_KEY] = deleted

  return patch
}

/** Applique un patch structurel sur une base (la base n'est jamais mutée). */
export function applyStructural(base: unknown, patch: unknown): unknown {
  if (patch === undefined) return structuredCloneJSON(base)
  if (isPlainObject(patch) && Object.prototype.hasOwnProperty.call(patch, '$set')) {
    return structuredCloneJSON((patch as JSONRecord)['$set'])
  }
  if (!isPlainObject(patch)) return structuredCloneJSON(patch)

  // À partir d'ici le patch est un objet de fusion : la base doit l'être aussi.
  const out: JSONRecord = isPlainObject(base) ? structuredCloneJSON(base) as JSONRecord : {}

  for (const key of Object.keys(patch)) {
    if (key === DELETED_KEY) continue
    out[key] = applyStructural(isPlainObject(base) ? (base as JSONRecord)[key] : undefined, patch[key])
  }
  const deleted = (patch as JSONRecord)[DELETED_KEY]
  if (Array.isArray(deleted)) {
    for (const key of deleted) delete out[key as string]
  }
  return out
}

/** Clone profond d'une valeur JSON (pas de cycles, pas de undefined). */
function structuredCloneJSON<T>(v: T): T {
  return (v === undefined ? undefined : JSON.parse(JSON.stringify(v))) as T
}

/**
 * Base du delta : la racine PRIVÉE de sa clé `views`. Calculée à l'identique à
 * l'écriture et à la lecture — c'est ce qui garantit qu'un patch se réapplique
 * exactement sur la même base que celle contre laquelle il a été calculé.
 */
function baseFromRoot(root: Type_JSON): JSONRecord {
  const base: JSONRecord = {}
  for (const key of Object.keys(root)) {
    if (key === 'views') continue
    base[key] = (root as JSONRecord)[key]
  }
  return base
}

/**
 * ÉCRITURE — remplace en place chaque vue de `root['views']` par son delta.
 *
 * Une vue n'est encodée en delta QUE si le patch, réappliqué immédiatement,
 * reconstitue la vue à l'identique. Sinon elle reste un snapshot intégral : on
 * ne troque jamais de la fiabilité contre des octets.
 *
 * @returns nombre de vues effectivement encodées en delta (pour les tests/logs).
 */
export function encodeViewsAsDelta(root: Type_JSON): number {
  const views = (root as JSONRecord)['views']
  if (!isPlainObject(views)) return 0
  const base = baseFromRoot(root)
  let encoded = 0

  for (const view_id of Object.keys(views)) {
    const view = views[view_id]
    if (!isPlainObject(view)) continue
    const patch = diffStructural(base, view)
    if (patch === undefined) {
      // Vue rigoureusement identique au maître : patch vide.
      views[view_id] = { [PATCH_KEY]: {} }
      encoded++
      continue
    }
    // GARDE-FOU 1 (correction) : le patch DOIT reconstituer la vue à l'identique.
    if (!deepEqual(applyStructural(base, patch), view)) {
      console.warn(
        `[#254] vue "${view_id}" : le delta ne reconstitue pas la vue à l'identique — ` +
        'snapshot intégral conservé.'
      )
      continue // on laisse le snapshot complet en place
    }
    // GARDE-FOU 2 (taille) : une vue qui n'a presque RIEN en commun avec le maître
    // (cas des tutoriels, où chaque « vue » est en fait un diagramme différent)
    // produit un patch aussi gros que le snapshot — l'enveloppe le rendrait même
    // plus lourd. On ne dégrade jamais : dans ce cas, snapshot intégral.
    const encoded_entry = { [PATCH_KEY]: patch }
    if (JSON.stringify(encoded_entry).length >= JSON.stringify(view).length) {
      continue
    }
    views[view_id] = encoded_entry
    encoded++
  }
  return encoded
}

/**
 * LECTURE — ré-étend en place chaque vue encodée en delta vers son snapshot
 * complet. Les vues déjà en snapshot intégral (fichiers anciens, ou vues sur
 * lesquelles le garde-fou d'écriture a préféré le snapshot) sont laissées telles
 * quelles : la détection est STRUCTURELLE (présence de `__patch`), pas fondée sur
 * la version — un fichier mixte se relit donc correctement.
 *
 * @returns nombre de vues ré-étendues.
 */
export function decodeViewsFromDelta(root: Type_JSON): number {
  const views = (root as JSONRecord)['views']
  if (!isPlainObject(views)) return 0
  const base = baseFromRoot(root)
  let decoded = 0

  for (const view_id of Object.keys(views)) {
    const view = views[view_id]
    if (!isPlainObject(view)) continue
    if (!Object.prototype.hasOwnProperty.call(view, PATCH_KEY)) continue // snapshot intégral
    views[view_id] = applyStructural(base, view[PATCH_KEY]) as JSONRecord
    decoded++
  }
  return decoded
}
