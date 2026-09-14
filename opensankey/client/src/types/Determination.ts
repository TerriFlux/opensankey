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
  // Parmi ces contraintes, celles qui posent la borne BASSE de l'intervalle, et
  // celles qui posent la borne HAUTE — pour une valeur libre uniquement. Vides
  // quand le moteur n'a pas su les nommer : la borne vient alors d'une
  // combinaison du système réduit, qui n'a pas de nom dans le modèle. Vide veut
  // dire « on ne sait pas », jamais « aucune contrainte ».
  min_by: number[]
  max_by: number[]
  // Parmi ces contraintes, celles qui SUFFISENT à calculer la valeur, leurs
  // autres termes étant déjà connus — de la plus courte à la plus longue. Ce
  // sont des équations du modèle, qui portent leur nom : un bilan de nœud, une
  // agrégation, ou l'équation écrite par le modéliste avec sa traduction. Vide
  // quand il n'y en a aucune : reste alors l'équation du système réduit, exacte
  // mais anonyme.
  fixed_by: number[]
  // Toutes les équations traversées en descendant jusqu'aux données saisies :
  // c'est de leur combinaison que sort l'équation aplatie, et le coefficient
  // qu'elle porte. Sans elles, ce coefficient sort de nulle part.
  combines: number[]
  // #544 — statut de réconciliation gradué (cf. RECONCILIATION_STATUSES).
  // Absent quand la réconciliation n'a pas été lancée avec l'option.
  status?: string
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
    // Un rôle qui désignerait une contrainte absente de `constraints` serait
    // inexploitable : l'interface n'aurait pas son coefficient, donc pas son
    // équation. Comme partout ici, on écarte le catalogue entier plutôt que
    // d'en montrer une part fausse.
    const roles: {
      min_by: number[], max_by: number[], fixed_by: number[], combines: number[]
    } = { min_by: [], max_by: [], fixed_by: [], combines: [] }
    for (const role of ['min_by', 'max_by', 'fixed_by', 'combines'] as const) {
      const raw = e[role]
      if (raw === undefined) continue
      if (!Array.isArray(raw)) return undefined
      for (const id of raw) {
        if (typeof id !== 'number' || !Number.isInteger(id)) return undefined
        // Un rôle porte sur une contrainte de l'explication — sinon l'interface
        // n'en aurait pas le coefficient. `combines` nomme en revanche des
        // équations traversées plus bas, que la variable ne porte pas.
        const valid = role === 'combines'
          ? id >= 0 && id < subjects.length
          : constraints.includes(id)
        if (!valid) return undefined
        roles[role].push(id)
      }
    }
    const explanation: Type_DeterminationExplanation = { type: e.type, constraints, coefs, ...roles }
    if (e.status !== undefined) {
      if (typeof e.status !== 'string') return undefined
      explanation.status = e.status
    }
    explanations.push(explanation)
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
    if (e.min_by.length > 0) out.min_by = e.min_by as unknown as Type_JSON
    if (e.max_by.length > 0) out.max_by = e.max_by as unknown as Type_JSON
    if (e.fixed_by.length > 0) out.fixed_by = e.fixed_by as unknown as Type_JSON
    if (e.combines.length > 0) out.combines = e.combines as unknown as Type_JSON
    if (e.status !== undefined) out.status = e.status
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

/**
 * Une CELLULE dont on veut le statut : une valeur, pour une combinaison
 * d'étiquettes donnée.
 *
 * Décrite par sa forme et non par sa classe — le résolveur doit rester dans
 * `types/`, sous les `Elements/` qui l'appellent, et un test doit pouvoir lui
 * présenter trois nombres sans construire un diagramme.
 */
export type Type_DeterminationCell = {
  determination: number | null
  valueData: number | null
  valueResult: number | null
}

/** Ce qui PORTE la cellule affichée — un flux, aujourd'hui. Son propre index
 * couvre les combinaisons d'étiquettes qui répondent toutes la même chose. */
export type Type_DeterminationBearer = {
  determination: number | null
  value?: Type_DeterminationCell | null
}

/**
 * Explication de la cellule affichée : celle de la cellule si elle en porte
 * une, sinon celle du porteur. `null` quand le fichier n'en porte aucune.
 */
export const determinationIndexOf = (
  bearer: Type_DeterminationBearer | null | undefined
): number | null => {
  if (bearer === null || bearer === undefined) return null
  const cell_index = bearer.value?.determination ?? null
  if (cell_index !== null) return cell_index
  return bearer.determination ?? null
}

/**
 * Les quatre états que l'utilisateur sait lire, là où le solveur en distingue
 * cinq (cf. DETERMINATION_CLASSIFICATIONS). Ce ne sont pas des libellés : les
 * libellés vivent dans les ressources i18n, comme partout dans ce module.
 */
export const DETERMINATION_STATUSES = [
  'collected',
  'reconciled',
  'determined',
  'undetermined'
] as const

export type Type_DeterminationStatus = typeof DETERMINATION_STATUSES[number]

/**
 * Le solveur a-t-il DÉPLACÉ la valeur de la cellule ?
 *
 * L'égalité est EXACTE, et c'est volontaire : `snap_reconciled_to_input`
 * (`mfa_problem_results_writer.py`) ramène au nombre saisi, à l'identique, tout
 * déplacement resté sous le plancher de bruit calculé par nœud. Se donner ici
 * une tolérance reviendrait à réinventer ce plancher sans les données qui le
 * calculent — le front n'a que deux nombres. Contrepartie assumée : sur un
 * fichier réconcilié avec le rabotage désactivé (`snap_to_zero_threshold = 0`),
 * un résidu numérique se lit comme un déplacement, donc « réconciliée ».
 *
 * Pas de résultat = rien n'a bougé : la cellule ne porte que ce qui a été
 * saisi. Pas de donnée saisie, en revanche, veut dire qu'il n'y avait rien à
 * collecter — la valeur vient du calcul.
 */
const cellValueMoved = (cell: Type_DeterminationCell | null | undefined): boolean => {
  if (cell === null || cell === undefined) return false
  const result = cell.valueResult
  if (result === null || result === undefined) return false
  const data = cell.valueData
  if (data === null || data === undefined) return true
  return result !== data
}

/**
 * Projection d'une classification du solveur vers l'état que l'utilisateur lit.
 *
 * `redundant` est le seul cas qui a besoin de la cellule : il dit que le
 * solveur POUVAIT déplacer la valeur, jamais qu'il l'ait fait. La donnée reste
 * collectée tant qu'elle n'a pas bougé.
 *
 * `failed` et tout code inconnu rendent `undefined` — « pas de statut », et
 * surtout pas « indéterminée ». Une campagne échouée laisse ses variables sans
 * résultat ET sans explication (le writer les saute) : présenter cela comme un
 * degré de liberté du modèle décrirait de travers un modèle qui n'a pas été
 * résolu. Même prudence pour un code qu'un moteur plus récent introduirait :
 * les quatre états sont un ensemble fermé, on ne devine pas où ranger le
 * cinquième.
 */
export const determinationStatusOfType = (
  type: string | undefined,
  cell?: Type_DeterminationCell | null
): Type_DeterminationStatus | undefined => {
  switch (type) {
    case 'measured': return 'collected'
    case 'redundant': return cellValueMoved(cell) ? 'reconciled' : 'collected'
    case 'determined': return 'determined'
    case 'free':
    case 'free_unbounded': return 'undetermined'
    default: return undefined
  }
}

/**
 * Statut de la valeur affichée par un porteur, ou `undefined` quand le fichier
 * ne permet pas de répondre.
 *
 * L'absence de catalogue est un état NORMAL, pas une anomalie : fichier
 * antérieur au #426, diagramme jamais réconcilié, ou moteur plus ancien — sur
 * le corpus SOCLE, le Lait porte 1 961 explications quand Volailles et Sucre
 * n'en portent aucune. Le résolveur répond alors « pas de statut », en silence.
 */
export const determinationStatusOf = (
  catalog: Type_DeterminationCatalog | undefined,
  bearer: Type_DeterminationBearer | null | undefined
): Type_DeterminationStatus | undefined => {
  const explanation = determinationLookup(catalog, determinationIndexOf(bearer))
  if (explanation === undefined) return undefined
  return determinationStatusOfType(explanation.type, bearer?.value)
}

/**
 * #544 — Les six états du « Statut après réconciliation », du PIRE au MEILLEUR.
 *
 * Calculés par la réconciliation elle-même (`reconciliation_statuses`,
 * `mfa_problem_determination.py`) : une valeur déterminée y prend le pire de ce
 * qu'elle traverse jusqu'aux données — nature des équations (bilan ou
 * coefficient ; une agrégation transmet l'état de ses termes) et état des
 * termes. Le front ne peut rien en reconstituer, il n'a pas la matrice : il
 * restitue le champ `status` de l'explication.
 *
 * L'ordre est porteur : c'est celui du pire au meilleur.
 */
export const RECONCILIATION_STATUSES = [
  'undetermined_unbounded',
  'undetermined_bounded',
  'reconciled',
  'determined_by_balance',
  'determined_by_coefficient',
  'collected'
] as const

export type Type_ReconciliationStatus = typeof RECONCILIATION_STATUSES[number]

const isReconciliationStatus = (value: unknown): value is Type_ReconciliationStatus =>
  typeof value === 'string' && (RECONCILIATION_STATUSES as readonly string[]).includes(value)

/**
 * Statut de réconciliation gradué de la valeur affichée, ou `undefined`.
 *
 * `undefined` est l'état NORMAL de tout fichier réconcilié sans l'option (ou
 * avant #544) : pas de repli sur les quatre états, qui ne savent pas distinguer
 * un bilan d'un coefficient. Un code inconnu — moteur plus récent — ne se
 * devine pas non plus.
 */
export const reconciliationStatusOf = (
  catalog: Type_DeterminationCatalog | undefined,
  bearer: Type_DeterminationBearer | null | undefined
): Type_ReconciliationStatus | undefined => {
  const status = determinationLookup(catalog, determinationIndexOf(bearer))?.status
  return isReconciliationStatus(status) ? status : undefined
}

/** Projection des six états sur les quatre que lit l'inspecteur (#536). */
export const reconciliationStatusToDeterminationStatus = (
  status: Type_ReconciliationStatus
): Type_DeterminationStatus => {
  switch (status) {
    case 'undetermined_unbounded':
    case 'undetermined_bounded': return 'undetermined'
    case 'determined_by_balance':
    case 'determined_by_coefficient': return 'determined'
    default: return status
  }
}
