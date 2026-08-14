// os#928 (facette structurelle) — Comparaison de deux VUES : diff structurel feuille à
// feuille + agrégation lisible.
//
// Le moteur de diff du codage delta (#254, `viewDelta.ts`) répond à « reconstituer » ; ici on
// répond à « montrer » : lister ce qui distingue deux vues, groupé par clé racine, avec les
// motifs agrégés (`links.*.local.value_label_unit ×90`) plutôt que 90 lignes. Logique PURE
// (aucun import runtime, testable sans DOM) ; la présentation vit côté OSP
// (ModalCompareViews). Spécification de sortie : MFAData/scripts/diff_sankey_views.py, le
// prototype CLI validé sur le corpus SOCLE Céréales.
//
// Deux filtres, appris sur corpus réel (sans eux : ~1 250 feuilles de bruit pour 4 différences
// réelles entre deux vues d'époques d'enregistrement différentes) :
//   - « bruit » : clé absente d'un côté ↔ valeur par défaut de l'autre ('' / false / [] / {}) —
//     deux sérialiseurs d'époques différentes, pas une différence de contenu ;
//   - tolérance numérique : dérives de re-sérialisation (re-dérivations coin/centre) de
//     quelques pixels sur des positions par ailleurs identiques.
// Les TABLEAUX sont atomiques, comme dans diffStructural : les collections qui comptent
// (nodes, links, labels…) sont des dictionnaires indexés par id.

export type Type_CompareLeafOp = 'added' | 'removed' | 'changed'

export type Type_CompareLeaf = {
  op: Type_CompareLeafOp
  /** Chemin de la feuille depuis la racine de la vue (['links', 'A---B', 'local', 'x']). */
  path: string[]
  a: unknown
  b: unknown
}

/** Motif agrégé : même chemin d'attribut, l'id d'élément (2e composant) remplacé par « * ». */
export type Type_ComparePattern = {
  pattern: string
  count: number
  /** Ids d'éléments touchés (vide pour un chemin sans niveau élément). */
  ids: string[]
  example: Type_CompareLeaf
}

export type Type_CompareGroup = {
  root_key: string
  /** Différences DIRECTEMENT sous la racine (scalaires : width, name…). */
  direct: Type_CompareLeaf[]
  /** Éléments entiers présents d'un seul côté (niveau id d'une collection). */
  added_ids: string[]
  removed_ids: string[]
  patterns: Type_ComparePattern[]
  total: number
}

export type Type_CompareResult = {
  groups: Type_CompareGroup[]
  total: number
  noise_dropped: number
  tolerance_dropped: number
}

type JSONRecord = Record<string, unknown>

const isPlainObject = (v: unknown): v is JSONRecord =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const deepEqualJSON = (a: unknown, b: unknown): boolean => {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => deepEqualJSON(v, b[i]))
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const ka = Object.keys(a)
    if (ka.length !== Object.keys(b).length) return false
    return ka.every(k => Object.prototype.hasOwnProperty.call(b, k) && deepEqualJSON(a[k], b[k]))
  }
  return false
}

/** Feuilles modifiées / clés ajoutées / clés retirées entre deux valeurs JSON. */
export function diffLeaves(a: unknown, b: unknown, path: string[] = []): Type_CompareLeaf[] {
  if (isPlainObject(a) && isPlainObject(b)) {
    const out: Type_CompareLeaf[] = []
    new Set([...Object.keys(a), ...Object.keys(b)]).forEach(key => {
      const sub_path = [...path, key]
      if (!Object.prototype.hasOwnProperty.call(b, key)) {
        out.push({ op: 'removed', path: sub_path, a: a[key], b: undefined })
      } else if (!Object.prototype.hasOwnProperty.call(a, key)) {
        out.push({ op: 'added', path: sub_path, a: undefined, b: b[key] })
      } else {
        out.push(...diffLeaves(a[key], b[key], sub_path))
      }
    })
    return out
  }
  return deepEqualJSON(a, b) ? [] : [{ op: 'changed', path, a, b }]
}

/** Valeur « par défaut » au sens du bruit inter-époques : indiscernable d'une clé absente. */
const isDefaultish = (v: unknown): boolean =>
  v === undefined || v === null || v === '' || v === false ||
  (Array.isArray(v) && v.length === 0) ||
  (isPlainObject(v) && Object.keys(v).length === 0)

/**
 * Ids des styles STRUCTURELS, (ré)attachés automatiquement aux éléments selon leur type.
 * Avant le filtre de persistance SA#230, chaque cycle enregistrer/charger réattachait puis
 * re-sérialisait ces styles : les anciens fichiers en accumulent des copies
 * (`['default','ContainerStyle','ContainerStyle']` vs le même + une copie). Réappliquer un
 * style structurel étant idempotent, ces doublons ne changent RIEN au rendu — c'est un
 * fossile de fichier, pas une différence de contenu.
 * NB : le filtre de persistance (`structural_styles`, ElementStyle.tsx) ne couvre que les
 * trois premiers ; `NodeContainerStyle` est persisté depuis SA#232 (nœud-cadre esthétique
 * sans chemin de réattache) mais il est lui aussi réattaché par setContainerMode() et son
 * réapplique est tout aussi idempotente : ses doublons hérités sont le même fossile.
 */
export const STRUCTURAL_STYLE_IDS: string[] = [
  'NodeStyle',
  'LinkStyle',
  'ContainerStyle',
  'NodeContainerStyle',
]

/**
 * Dédoublonne les occurrences répétées des seuls ids STRUCTURELS (première conservée),
 * sans toucher aux styles custom. undefined si la valeur n'est pas un tableau de chaînes.
 */
const dedupeStructuralStyles = (v: unknown): string[] | undefined => {
  if (!Array.isArray(v) || !v.every(s => typeof s === 'string')) return undefined
  const seen = new Set<string>()
  const out: string[] = []
  ;(v as string[]).forEach(id => {
    if (STRUCTURAL_STYLE_IDS.includes(id)) {
      if (seen.has(id)) return
      seen.add(id)
    }
    out.push(id)
  })
  return out
}

/**
 * Bruit « styles structurels dupliqués » (fossile du bug SA#230) : feuille `changed` sur une
 * clé `style` dont les deux listes deviennent ÉGALES (même ordre) une fois les doublons
 * structurels retirés. Un vrai changement de style (custom ajouté, structurels différents)
 * ne se normalise pas à l'égalité et reste visible.
 */
const isStructuralStyleEcho = (leaf: Type_CompareLeaf): boolean => {
  if (leaf.op !== 'changed' || leaf.path[leaf.path.length - 1] !== 'style') return false
  const a = dedupeStructuralStyles(leaf.a)
  const b = dedupeStructuralStyles(leaf.b)
  return a !== undefined && b !== undefined &&
    a.length === b.length && a.every((id, i) => id === b[i])
}

/**
 * Compare deux vues (JSON de DrawingArea) et agrège le résultat.
 * @param opts.ignore_noise défaut true — écarte les paires clé-absente ↔ valeur-par-défaut
 *   et les listes `style` ne différant que par des doublons structurels (SA#230).
 * @param opts.tolerance défaut 0 — écarte les écarts numériques ≤ tolerance (px de re-sérialisation).
 */
export function compareViews(
  view_a: unknown,
  view_b: unknown,
  opts: { ignore_noise?: boolean, tolerance?: number } = {}
): Type_CompareResult {
  const ignore_noise = opts.ignore_noise !== false
  const tolerance = opts.tolerance ?? 0

  let leaves = diffLeaves(view_a, view_b)
  let noise_dropped = 0
  let tolerance_dropped = 0

  if (ignore_noise) {
    const kept: Type_CompareLeaf[] = []
    leaves.forEach(leaf => {
      if ((leaf.op === 'added' || leaf.op === 'removed') && isDefaultish(leaf.a) && isDefaultish(leaf.b)) {
        noise_dropped += 1
      } else if (isStructuralStyleEcho(leaf)) {
        noise_dropped += 1
      } else kept.push(leaf)
    })
    leaves = kept
  }
  if (tolerance > 0) {
    const kept: Type_CompareLeaf[] = []
    leaves.forEach(leaf => {
      const numeric = leaf.op === 'changed' &&
        typeof leaf.a === 'number' && typeof leaf.b === 'number' &&
        Number.isFinite(leaf.a) && Number.isFinite(leaf.b)
      if (numeric && Math.abs((leaf.a as number) - (leaf.b as number)) <= tolerance) {
        tolerance_dropped += 1
      } else kept.push(leaf)
    })
    leaves = kept
  }

  // Agrégation par clé racine.
  const by_root = new Map<string, Type_CompareLeaf[]>()
  leaves.forEach(leaf => {
    const root = leaf.path[0] ?? '(racine)'
    if (!by_root.has(root)) by_root.set(root, [])
    by_root.get(root)!.push(leaf)
  })

  const groups: Type_CompareGroup[] = []
  ;[...by_root.keys()].sort().forEach(root_key => {
    const entries = by_root.get(root_key)!
    const direct = entries.filter(e => e.path.length <= 1)
    const deep = entries.filter(e => e.path.length > 1)
    const added_ids: string[] = []
    const removed_ids: string[] = []
    const patterns = new Map<string, Type_ComparePattern>()
    deep.forEach(leaf => {
      // Élément entier présent d'un seul côté : niveau id (profondeur 2) d'une collection.
      if (leaf.path.length === 2 && (leaf.op === 'added' || leaf.op === 'removed')) {
        (leaf.op === 'added' ? added_ids : removed_ids).push(leaf.path[1])
        return
      }
      const pattern = leaf.path.length > 2
        ? `${leaf.path[0]}.*.${leaf.path.slice(2).join('.')}`
        : `${leaf.path[0]}.*`
      if (!patterns.has(pattern)) {
        patterns.set(pattern, { pattern, count: 0, ids: [], example: leaf })
      }
      const entry = patterns.get(pattern)!
      entry.count += 1
      if (leaf.path.length >= 2 && !entry.ids.includes(leaf.path[1])) entry.ids.push(leaf.path[1])
    })
    groups.push({
      root_key,
      direct,
      added_ids: added_ids.sort(),
      removed_ids: removed_ids.sort(),
      patterns: [...patterns.values()].sort((x, y) => y.count - x.count),
      total: entries.length,
    })
  })

  return { groups, total: leaves.length, noise_dropped, tolerance_dropped }
}

/**
 * Clés racines qui diffèrent PAR CONSTRUCTION entre deux vues : identité (`id`, `name`),
 * mécanique des vues (`view_labels`, `heredited_attr`, `heredited_source_id`, `tag_selection`,
 * `is_light`, `generated_from_group_id`), et enveloppe de fichier pour les blobs « fichier
 * entier » (`current_view`, `views` imbriquée, `version`, `format_version`). Elles noient les
 * vrais changements : l'UI les range dans une section « changements attendus » repliée.
 */
export const EXPECTED_ROOT_KEYS: string[] = [
  'id',
  'name',
  'view_labels',
  'heredited_attr',
  'heredited_source_id',
  'tag_selection',
  'is_light',
  'generated_from_group_id',
  'current_view',
  'views',
  'version',
  'format_version',
]

/** Sépare les groupes en liste principale / changements attendus (cf. EXPECTED_ROOT_KEYS). */
export function partitionExpected(groups: Type_CompareGroup[]): {
  main: Type_CompareGroup[]
  expected: Type_CompareGroup[]
} {
  const main: Type_CompareGroup[] = []
  const expected: Type_CompareGroup[] = []
  groups.forEach(group =>
    (EXPECTED_ROOT_KEYS.includes(group.root_key) ? expected : main).push(group))
  return { main, expected }
}

/** Valeur compacte pour l'affichage (« 106.2 », « "kt" », « {…} » tronqué). */
export function compactValue(v: unknown, limit: number = 60): string {
  if (v === undefined) return '∅'
  const s = typeof v === 'number' ? String(Math.round(v * 100) / 100) : JSON.stringify(v)
  return s.length <= limit ? s : s.slice(0, limit - 1) + '…'
}
