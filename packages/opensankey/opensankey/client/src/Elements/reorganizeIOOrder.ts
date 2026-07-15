// Pure ordering policy for a node's I/O links — no DOM / d3 / import-cycle deps,
// so it is unit-testable in isolation (cf. reorganizeIOOrder.test.ts). The
// DOM-bound `Class_NodeElement.reorganizeIOLinks` delegates the array math here.

/**
 * Rebuild a node's links order as
 * `[import echange links, middle, export echange links]`.
 *
 * The "middle" group (links that are neither echange import nor echange export) is
 * spatially re-sorted with `compare`. Recycling links belong to that group: they stack
 * on a side like any other link, so they are ordered by the same geometric rule (cf.
 * ioOrderGeometry.ts, which gives them their own reference point). They used to be
 * corralled into a fixed block between `middle` and the exports, which pinned them below
 * every other link on their side whatever the geometry said.
 *
 * When `release_locks` is false, every link whose anchor on the node is locked (the
 * "cadenas" of the "Ordre des flux E/S" menu) keeps its slot in the middle group and
 * only the UNLOCKED links are re-sorted into the remaining slots — so a manual node drag
 * no longer undoes a user-locked arrangement (issue #197). When true, the whole middle
 * group is re-sorted (the explicit "recalcul automatique" the lock tooltip refers to).
 *
 * Generic over the link type so the test can use lightweight stand-ins.
 */
export function reorganizeIOOrder<T>(
  links_order: T[],
  import_links: T[],
  export_links: T[],
  is_locked: (link: T) => boolean,
  compare: (link_a: T, link_b: T) => number,
  release_locks: boolean
): T[] {
  const middle = links_order.filter(
    l => !import_links.includes(l) && !export_links.includes(l)
  )

  let new_middle: T[]
  if (release_locks) {
    // Full spatial re-sort.
    new_middle = [...middle].sort(compare)
  } else {
    // Pin each locked link at its current slot; re-sort only the unlocked links
    // into the slots that are left.
    const locked_mask = middle.map(is_locked)
    const sorted_unlocked = middle.filter((_, i) => !locked_mask[i]).sort(compare)
    let u = 0
    new_middle = middle.map((l, i) => (locked_mask[i] ? l : sorted_unlocked[u++]))
  }

  return [...import_links, ...new_middle, ...export_links]
}
