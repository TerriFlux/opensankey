// #426 — Traçabilité, axe B : d'où vient la valeur d'un flux, d'un stock ou
// d'une cellule.
//
// Miroir côté front de `mfa_problem/mfa_problem_determination.py`. L'axe A
// (#411) répond « pourquoi cet élément existe » ; celui-ci répond « qu'est-ce
// qui a fixé sa valeur », et cela ne vient plus du parser mais du solveur.
//
// Le fichier ne transporte pas l'explication elle-même mais un ENTIER par
// élément : l'index d'une explication dans un catalogue partagé par tout le
// diagramme. Deux raisons. La première est le poids : une étude réelle compte
// des dizaines de milliers de flux et plusieurs combinaisons d'étiquettes
// chacun, et une explication recopiée à chaque cellule pèserait plus lourd que
// les valeurs qu'elle explique. La seconde est que le front n'a pas la matrice
// de contraintes : il ne peut RIEN reconstituer, seulement restituer ce que la
// réconciliation a écrit — d'où un enregistrement qu'il transporte tel quel.
//
// Comme sur l'axe A, le JSON porte des CODES et non des libellés : les libellés
// vivent dans les ressources i18n, donc dans la langue courante de
// l'application, et un moteur plus récent écrivant un code inconnu retombe sur
// le code brut plutôt que sur du vide.

import type { Type_JSON } from './Utils'

/** Ce qu'une ligne de contrainte veut dire, du point de vue de l'utilisateur. */
export type Type_DeterminationSubject = {
  // Code stable de la nature de la contrainte (bilan matière, agrégation…).
  kind: string
  // Nœud concerné, ou identifiant de la contrainte saisie.
  subject: string
  // Distingue deux contraintes de même nature sur le même nœud (plusieurs
  // groupes d'enfants, plusieurs combinaisons de flux dans un bilan).
  variant?: number
  // Colonne « Traduction » de la feuille Contraintes : ce que le modéliste a
  // écrit de son équation.
  label?: string
  // Famille de la contrainte saisie (ratio_flux, stock_chaining…).
  constraint_type?: string
}

/** Une réponse à « d'où vient ta valeur », partagée par toutes les cellules
 * qui ont la même. */
export type Type_DeterminationExplanation = {
  // Classification de la variable par le solveur (cf. classificationKey).
  type: string
  // Index des sujets de contrainte qui portent sur elle. Vide = aucune
  // contrainte ne la touche.
  constraints: number[]
  // Coefficient de la variable dans chaque contrainte, dans le MÊME ordre.
  // C'est ce qui fait la différence entre lister les flux d'une équation et
  // montrer l'équation : sans lui, un bilan matière se lit comme un sac de flux
  // au lieu de « ceux-ci entrent, ceux-là sortent ». Vide quand le fichier ne
  // les porte pas (écrit par un moteur antérieur).
  coefs: number[]
}

export type Type_DeterminationCatalog = {
  subjects: Type_DeterminationSubject[]
  explanations: Type_DeterminationExplanation[]
}

// Classifications que l'interface sait nommer. Un code absent d'ici est affiché
// tel quel : le moteur reste libre d'en introduire un nouveau.
export const DETERMINATION_CLASSIFICATIONS = [
  'measured',
  'redundant',
  'determined',
  'free',
  'free_unbounded',
  'failed'
]

/** Vrai quand le solveur n'a laissé aucun degré de liberté à la valeur. */
export const determinationIsFixed = (type: string): boolean =>
  type === 'determined' || type === 'measured' || type === 'redundant'

/** Vrai quand la valeur n'est pas fixée : c'est le cas qui appelle une saisie. */
export const determinationIsFree = (type: string): boolean =>
  type === 'free' || type === 'free_unbounded'

/** Clé i18n du libellé d'une classification. */
export const determinationClassificationKey = (type: string): string =>
  'inspector.determination.classification.' + type

/** Clé i18n de la phrase qui explique ce que la classification implique. */
export const determinationMeaningKey = (type: string): string =>
  'inspector.determination.meaning.' + type

/** Clé i18n du libellé d'une nature de contrainte. */
export const determinationSubjectKey = (kind: string): string =>
  'inspector.determination.kinds.' + kind

/**
 * Lit le catalogue depuis le JSON, ou undefined s'il est inutilisable.
 *
 * Tout enregistrement mal formé fait tomber le catalogue ENTIER : un catalogue
 * partiellement lu ferait pointer les index des cellules sur les mauvaises
 * explications, et chacune paraîtrait plausible. Mieux vaut ne rien expliquer.
 */
export const determinationCatalogFromJSON = (
  raw: unknown
): Type_DeterminationCatalog | undefined => {
  if (raw === null || typeof raw !== 'object') return undefined
  const obj = raw as Record<string, unknown>
  if (!Array.isArray(obj.explanations)) return undefined
  const subjects: Type_DeterminationSubject[] = []
  if (obj.subjects !== undefined) {
    if (!Array.isArray(obj.subjects)) return undefined
    for (const entry of obj.subjects) {
      if (entry === null || typeof entry !== 'object') return undefined
      const s = entry as Record<string, unknown>
      if (typeof s.kind !== 'string' || typeof s.subject !== 'string') return undefined
      const subject: Type_DeterminationSubject = { kind: s.kind, subject: s.subject }
      if (typeof s.variant === 'number') subject.variant = s.variant
      if (typeof s.label === 'string') subject.label = s.label
      if (typeof s.constraint_type === 'string') subject.constraint_type = s.constraint_type
      subjects.push(subject)
    }
  }
  const explanations: Type_DeterminationExplanation[] = []
  for (const entry of obj.explanations) {
    if (entry === null || typeof entry !== 'object') return undefined
    const e = entry as Record<string, unknown>
    if (typeof e.type !== 'string' || e.type.length === 0) return undefined
    const constraints: number[] = []
    if (e.constraints !== undefined) {
      if (!Array.isArray(e.constraints)) return undefined
      for (const id of e.constraints) {
        // Un index hors catalogue désignerait une contrainte inexistante.
        if (typeof id !== 'number' || !Number.isInteger(id) || id < 0 || id >= subjects.length) {
          return undefined
        }
        constraints.push(id)
      }
    }
    const coefs: number[] = []
    if (e.coefs !== undefined) {
      // Des coefficients désalignés des contraintes attribueraient à chaque
      // flux le coefficient de son voisin : le catalogue entier est écarté.
      if (!Array.isArray(e.coefs) || e.coefs.length !== constraints.length) return undefined
      for (const coef of e.coefs) {
        if (typeof coef !== 'number' || !Number.isFinite(coef)) return undefined
        coefs.push(coef)
      }
    }
    explanations.push({ type: e.type, constraints, coefs })
  }
  return { subjects, explanations }
}

/** Forme JSON, symétrique de la lecture (membres vides omis). */
export const determinationCatalogToJSON = (
  catalog: Type_DeterminationCatalog
): Type_JSON => {
  // `Type_JSON` ne décrit pas les tableaux de nombres (la grammaire de
  // persistance ne connaît que scalaires, listes de chaînes et imbrications) ;
  // la liste d'index en est un, d'où la conversion explicite.
  const explanations = catalog.explanations.map(e => {
    const out: Type_JSON = { type: e.type }
    if (e.constraints.length > 0) out.constraints = e.constraints as unknown as Type_JSON
    if (e.coefs.length > 0) out.coefs = e.coefs as unknown as Type_JSON
    return out
  })
  const out: Type_JSON = { explanations: explanations as unknown as Type_JSON }
  if (catalog.subjects.length > 0) {
    out.subjects = catalog.subjects.map(s => {
      const subject: Type_JSON = { kind: s.kind, subject: s.subject }
      if (s.variant !== undefined) subject.variant = s.variant
      if (s.label !== undefined) subject.label = s.label
      if (s.constraint_type !== undefined) subject.constraint_type = s.constraint_type
      return subject
    }) as unknown as Type_JSON
  }
  return out
}

/**
 * Coefficient d'une variable dans une contrainte donnée, ou undefined.
 *
 * undefined ne veut pas dire « zéro » : c'est « le fichier ne le dit pas »
 * (écrit par un moteur antérieur aux coefficients). L'interface montre alors le
 * flux sans signe plutôt qu'un signe inventé.
 */
export const determinationCoefficient = (
  explanation: Type_DeterminationExplanation | undefined,
  subject_id: number
): number | undefined => {
  if (explanation === undefined) return undefined
  const position = explanation.constraints.indexOf(subject_id)
  if (position < 0 || position >= explanation.coefs.length) return undefined
  return explanation.coefs[position]
}

/** Explication désignée par un index, ou undefined si le fichier ne la porte pas. */
export const determinationLookup = (
  catalog: Type_DeterminationCatalog | undefined,
  index: number | null | undefined
): Type_DeterminationExplanation | undefined => {
  if (catalog === undefined) return undefined
  if (index === null || index === undefined) return undefined
  if (!Number.isInteger(index) || index < 0 || index >= catalog.explanations.length) return undefined
  return catalog.explanations[index]
}
