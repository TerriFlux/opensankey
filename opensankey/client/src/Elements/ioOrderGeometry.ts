// Pure geometric ordering policy for a node's I/O links — no DOM / d3 /
// import-cycle deps, so it is unit-testable in isolation (cf.
// ioOrderGeometry.test.ts). `Class_NodeElement.reorganizeIOLinks` feeds it the
// opposite-node geometry and uses the returned order to drive `reorganizeIOOrder`.
//
// WHY THIS EXISTS
// The historical rule (`sortLinksElementsByRelativeNodesPositions`) sorted the
// links sharing one node side by a SINGLE coordinate of the opposite node — its
// `y` for left/right sides, its `x` for top/bottom sides. That ignores which
// COLUMN (resp. row) the opposite node sits in, so as soon as a node fans out to
// nodes in several columns the simple rule lets the flows cross. Example
// (node ABOVE its targets, right side): a near-column target slightly higher
// than a far-column target was placed above it by pure-y, crossing the bundles.
//
// THE POLICY
//   1. Split the links by node side (cross-side order keeps the historical side
//      priority right < bottom < left < top).
//   2. Inside a side, cluster the opposite nodes into columns (left/right sides)
//      or rows (top/bottom sides) — clusters sharing ~the same x (resp. y).
//   3. Order the clusters by the ANGLE of their centroid seen from the node:
//      atan2(Δy, |Δx|) for left/right sides (→ top-to-bottom), atan2(Δx, |Δy|)
//      for top/bottom sides (→ left-to-right). The sign of the orthogonal delta
//      bakes in the "node is above / below / left / right of the column" case,
//      so a far quasi-horizontal cluster lands before a near steep one.
//   4. Inside a cluster, order by the orthogonal coordinate (the old single-
//      coordinate rule), which never crosses within one column/row.
// A single cluster collapses to step 4 alone = the historical behaviour, so only
// genuinely multi-column / multi-row nodes change.

import { Type_Side } from './ElementsAttributesConfig'

export type Type_IOGeo = {
  side: Type_Side
  ox: number // opposite node centre x
  oy: number // opposite node centre y
}

// Cross-side order — identical to the historical comparator's side priority.
const side_rank: { [_ in Type_Side]: number } = {
  'right': 0,
  'bottom': 1,
  'left': 2,
  'top': 3
}

const isHorizontalSide = (s: Type_Side) => s === 'left' || s === 'right'

/**
 * Gap-based 1-D clustering: walking the sorted values, a new cluster starts when
 * the gap to the previous value exceeds the effective tolerance. The effective
 * tolerance is `max(base_tol, 0.05 * span)`:
 *  - `base_tol` (a node width / height) is the natural scale of WITHIN-column
 *    jitter — left-aligned nodes of different sizes have centres up to ~a node
 *    apart — so values within one node size collapse to the same column/row;
 *  - the `0.05 * span` floor is only a guard for degenerate zero-size inputs, so
 *    a real between-column gap (hundreds of px) still splits even then.
 * Returns a cluster id per input index.
 */
function clusterByGap(values: number[], base_tol: number): number[] {
  const cluster = new Array<number>(values.length)
  if (values.length === 0) return cluster
  const span = Math.max(...values) - Math.min(...values)
  const tol = Math.max(base_tol, 0.05 * span)
  const order = values.map((_, i) => i).sort((a, b) => values[a] - values[b])
  let c = 0
  for (let k = 0; k < order.length; k++) {
    if (k > 0 && values[order[k]] - values[order[k - 1]] > tol) c++
    cluster[order[k]] = c
  }
  return cluster
}

/**
 * Order a node's I/O items with the column/row aware policy described above.
 *
 * @param items   each link paired with its geometry (opposite node centre + side)
 * @param nx,ny   reference node centre
 * @param col_tol within-column x-jitter scale for left/right sides (a node width)
 * @param row_tol within-row y-jitter scale for top/bottom sides (a node height)
 * @returns the items (in their original wrapper type) in display order:
 *          top→bottom on left/right sides, left→right on top/bottom sides,
 *          side groups concatenated in side-priority order.
 */
export function orderIOByGeometry<T>(
  items: { item: T; geo: Type_IOGeo }[],
  nx: number,
  ny: number,
  col_tol: number,
  row_tol: number
): T[] {
  const sides = [...new Set(items.map(i => i.geo.side))].sort(
    (a, b) => side_rank[a] - side_rank[b]
  )
  const out: T[] = []
  for (const side of sides) {
    const group = items.filter(i => i.geo.side === side)
    const horizontal = isHorizontalSide(side)
    // Primary coordinate = the one that varies BETWEEN columns (resp. rows).
    const cluster_vals = group.map(i => (horizontal ? i.geo.ox : i.geo.oy))
    const cluster_id = clusterByGap(cluster_vals, horizontal ? col_tol : row_tol)
    const n_clusters = cluster_id.length ? Math.max(...cluster_id) + 1 : 0
    const clusters: { idxs: number[]; key: number }[] = []
    for (let c = 0; c < n_clusters; c++) {
      const idxs = group.map((_, i) => i).filter(i => cluster_id[i] === c)
      const cx = idxs.reduce((s, i) => s + group[i].geo.ox, 0) / idxs.length
      const cy = idxs.reduce((s, i) => s + group[i].geo.oy, 0) / idxs.length
      const key = horizontal
        ? Math.atan2(cy - ny, Math.abs(cx - nx)) // top → bottom
        : Math.atan2(cx - nx, Math.abs(cy - ny)) // left → right
      clusters.push({ idxs, key })
    }
    clusters.sort((a, b) => a.key - b.key)
    for (const cl of clusters) {
      cl.idxs
        .sort((a, b) =>
          horizontal
            ? group[a].geo.oy - group[b].geo.oy
            : group[a].geo.ox - group[b].geo.ox
        )
        .forEach(i => out.push(group[i].item))
    }
  }
  return out
}
