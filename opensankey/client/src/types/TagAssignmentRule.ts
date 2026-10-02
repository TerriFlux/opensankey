// SA#580 — GROUPE D'ÉTIQUETTES DE FLUX « ATTRIBUÉ PAR RÈGLES » *****************************
//
// Un groupe de flux peut confier l'attribution de ses étiquettes à une règle : une GRANDEUR,
// mesurée sur la valeur affichée de chaque flux, et pour chaque étiquette un SEUIL HAUT. Les
// étiquettes, dans leur ordre, découpent la grandeur en tranches ]seuil précédent ; seuil] — le
// seuil appartient à sa tranche (retour d'Alexandre, 2026-10-02 : un flux à 10 % reste Fiable) ;
// une étiquette sans seuil est ouverte vers le haut. Exemple de la fiabilité (2σ) :
//   Fiable ≤ 10 % < Robuste ≤ 20 % < Probable ≤ 35 % < Approximative ≤ 50 % < Indicative
//
// Le port se CALCULE, il ne s'écrit jamais sur les éléments (comme l'étiquette « Sans [groupe] »
// du #553) : changer d'année ou d'unité change la valeur affichée, donc son étiquette, et changer
// un seuil ré-étiquette tout le diagramme sans relancer le calcul du bilan.
//
// Format (JSON, sans changement de `format_version`) :
//   - groupe : `assignment_rule: { quantity: '<grandeur>' }`, absente = groupe ordinaire ;
//   - étiquette : `rule_upper_bound: <nombre>`, absente = tranche ouverte.
// Le seuil s'exprime dans l'unité de la grandeur (des % pour l'incertitude relative).

import { Type_JSON } from './Utils'

/** Grandeur v1 : l'incertitude relative calculée par le calcul du bilan (SA#578), en %, à 2σ. */
export const RULE_QUANTITY_COMPUTED_RELATIVE_UNCERTAINTY = 'computed_relative_uncertainty'

/** Grandeurs que ce front sait mesurer. Une autre, venue d'un fichier plus récent, est gardée
 *  telle quelle : le groupe reste « par règles » et ses flux tombent dans « Sans [groupe] ». */
export const RULE_QUANTITIES: string[] = [RULE_QUANTITY_COMPUTED_RELATIVE_UNCERTAINTY]

/** Ce qu'une règle sait mesurer : une valeur de flux (`Class_LinkValue`). */
export type Type_RuleMeasurable = {
  /** La grandeur sur cette valeur ; `Infinity` = inconnue (la moins fiable), undefined = sans objet. */
  ruleQuantity(quantity: string): number | undefined
}

export type Type_AssignmentRule = {
  quantity: string
  /** Clés de la règle que ce front ne modélise pas (format à venir), réécrites telles quelles. */
  extras?: Type_JSON
}

/** Lit la clé `assignment_rule` d'un groupe ; tout ce qui n'a pas de grandeur = pas de règle. */
export function parseAssignmentRule(raw: unknown): Type_AssignmentRule | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined
  const { quantity, ...extras } = raw as { [_: string]: unknown }
  if (typeof quantity !== 'string' || quantity === '') return undefined
  return Object.keys(extras).length > 0
    ? { quantity, extras: extras as Type_JSON }
    : { quantity }
}

export function serializeAssignmentRule(rule: Type_AssignmentRule | undefined): Type_JSON | undefined {
  if (rule === undefined) return undefined
  return { ...(rule.extras ?? {}), quantity: rule.quantity } as Type_JSON
}

/** Lit un seuil : un nombre fini, sinon pas de seuil (tranche ouverte). */
export function parseRuleUpperBound(raw: unknown): number | undefined {
  const value = (typeof raw === 'string' && raw.trim() !== '') ? Number(raw) : raw
  return (typeof value === 'number' && Number.isFinite(value)) ? value : undefined
}

/**
 * Écart relatif toléré au seuil : une grandeur CALCULÉE « à 10 % » ressort couramment à
 * 10,000000124 % (bruit du solveur, Lait SOCLE 2023) ; sans tolérance, la borne incluse ne
 * servirait à rien sur une valeur calculée. 1e-6 du seuil : bien en deçà de toute précision
 * affichée, et 10,00006 % (écart réel du calcul, Lait 2015) reste au-delà.
 */
export const RULE_BOUND_RELATIVE_TOLERANCE = 1e-6

/**
 * Étiquette d'une grandeur mesurée : la première, dans l'ordre du groupe, dont la grandeur ne
 * dépasse pas le seuil haut (seuil inclus, à la tolérance près), ou qui n'a pas de seuil. Une
 * grandeur au-delà de tous les seuils — ou infinie : une valeur inconnue — tombe dans la DERNIÈRE
 * tranche, la moins fiable (règle d'Alexandre, 2026-09-29). Pas de grandeur, pas d'étiquette :
 * « Sans [groupe] ».
 */
export function resolveRuleTag<T extends { rule_upper_bound: number | undefined }>(
  quantity: number | undefined,
  tags: T[]
): T | undefined {
  if (quantity === undefined || Number.isNaN(quantity) || tags.length === 0) return undefined
  const tag = tags.find(t => t.rule_upper_bound === undefined ||
    quantity <= t.rule_upper_bound + Math.abs(t.rule_upper_bound) * RULE_BOUND_RELATIVE_TOLERANCE)
  return tag ?? tags[tags.length - 1]
}
