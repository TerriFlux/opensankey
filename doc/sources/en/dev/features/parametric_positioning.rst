Parametric positioning refactor (PR 1 + PR 2 + PR 3)
=====================================================

Context
-------

Parametric mode stacks nodes of a column (``position_u``) vertically
in ``position_v`` order, with spacing driven by ``shape_position_dy``.
In practice several concurrent sources of truth wrote ``position_y``,
and the spacing between nodes was carried sometimes by
``shape_position_dy``, sometimes by a hard-coded ``gap = 10`` depending
on the execution path. Containers (``dimension.container_mode``) did
not read ``shape_position_dy`` at all, which prevented parametric mode
from driving their inner layout.

This page documents all three refactor PRs. The first two set the
stage (kill buggy paths, unify ``shape_position_dy`` as the sole
spacing source of truth). The third centralizes the actual recompute
into a single entry point and turns ``Node.applyPosition`` into a
pass-through. None of the three introduces a user-visible behavior
change in the nominal case — the goal is to close silent bugs and
make parametric mode drivable from a single place.

The code lives in the nested submodule
``submodules/OpenSankey+/submodules/OpenSankey`` (OpenSankey base).

PR 1 — Targeted fixes and ``u`` / ``x`` decoupling
---------------------------------------------------

``Node.applyPosition`` predicate (parametric branch)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``Elements/Node.tsx`` — the parametric branch of ``applyPosition``
looks for a ``nodeAbove`` in the same column to stack onto. The
selection predicate was malformed:

.. code-block:: typescript

   // before: && binds tighter than ||, and nodeAbove != this
   //         read an undefined local → always true
   (same_container || (no_container && !has_container) && nodeAbove != this)

Parentheses were fixed to give the intended semantics "same container
OR no container on either side", and the ``nodeAbove != this``
comparison was dropped (pointless — the loop that fills ``nodeAbove``
does not iterate over the current node anyway).

``computeParametrization`` recall on data tag change
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``components/topmenus/Toolbar.tsx`` — the ``handleDataTagSelection``
handler would change the active value of a data tag (and therefore
potentially the node heights via ``getShapeHeightToUse``) without
asking the parametric layout to recompute. Result: in parametric mode,
heights changed but the spacing between nodes stayed frozen. The
handler now calls
``drawing_area.nodePositioning.computeParametrization(false)`` at the
end when the default style is in ``parametric``, before triggering the
redraw.

Back-calculating ``shape_position_dy`` on absolute → parametric switch
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``types/DrawingArea.tsx`` — ``setParametricMode`` used to flip the
style to ``parametric`` and immediately call ``computeParametrization``,
which re-stacked the nodes while ignoring their previous absolute
positions: a systematic visual jump on the switch.

The method now, in order:

1. ``inferPositionUFromX()`` to seed ``position_u`` from the absolute
   position (non-locked nodes only);
2. back-calculation: each column is sorted by current ``position_y``,
   then ``shape_position_dy`` on each node (except the first) is
   recomputed as ``y_i - (y_{i-1} + h_{i-1})``; negative values
   (pre-existing overlap) are *clamped to 0* with a ``console.warn``
   counting affected nodes — the PR 2+ design forbids negative dy;
3. flip to ``parametric`` then recompute V via
   ``computeParametrization(false)``.

Result: on a diagram with no absolute overlap, the switch is visually
stable. On a diagram with overlaps, the overlapping nodes are pulled
up (dy clamped to 0) with a console warning.

Dropping ``delete_attribute('position_dy')`` in ``finalizeOperation``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``Algorithms/Hierarchies.tsx`` — ``finalizeOperation`` (called at the
end of disaggregation) used to purge ``position_dy`` on every freshly
created node right after the positioning helper had just set it. Any
local dy customization was lost on every disaggregation. The purge is
removed.

Decoupling ``position_u`` from ``position_x``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``Algorithms/NodePositioning.tsx`` — ``computeParametrization``
unconditionally re-derived ``position_u`` from ``position_x`` at the
top of the function:

.. code-block:: typescript

   node.position_u = Math.round(node.position_x / dx)

Bidirectional coupling ``u ↔ x``: when a container tweaked
``position_x`` (via envelope bbox), its ``position_u`` would drift on
the next recompute, which then rewrote ``position_x``, and so on.
Silent drifts on every recompute.

The computation now lives in a new public method
``inferPositionUFromX()`` which callers invoke explicitly when they
have just modified an absolute position:

- ``setParametricMode`` (abs → param switch, see above);
- ``NodeEventsHandler.handleMouseDragEnd`` (end of drag in absolute
  mode);
- ``Hierarchies`` (node creation during sideways disaggregation).

``computeParametrization`` no longer touches ``position_u`` unless
``use_horizontal_index=true`` (explicit topological analysis).

PR 2 — ``shape_position_dy`` as the single source of truth for spacing
-----------------------------------------------------------------------

``stackNodesVertically`` / ``totalStackHeight`` helpers
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``Algorithms/NodePositioning.tsx`` — two new static methods on
``Class_NodePositioning``:

.. code-block:: typescript

   public static stackNodesVertically(
     nodes: Class_NodeElement[],
     anchor_y: number
   )

   public static totalStackHeight(nodes: Class_NodeElement[]): number

``stackNodesVertically`` stacks nodes in the order they are passed in,
starting at ``anchor_y``, following the canonical invariant:

.. code-block:: text

   n_0.y = anchor_y
   n_{i+1}.y = n_i.y + n_i.height + n_{i+1}.shape_position_dy

The first node's ``shape_position_dy`` is ignored (it has no
predecessor). Each node gets its ``applyPosition()`` called in-flight.

``totalStackHeight`` returns the matching total stack height (sum of
heights + sum of dy for all nodes except the first), useful for
callers who want to center the stack around a point.

Node ordering is the caller's responsibility — sort by ``position_v``,
current ``position_y``, or whatever metric fits the call site.

Migrated call sites
~~~~~~~~~~~~~~~~~~~~

Every site that stacked with a hard-coded ``gap = 10`` has been
migrated to the helper. Public methods involved lose their ``gap``
parameter.

``Elements/Node.tsx``:

- ``restackContainerChildren()`` — ordering preserved (sort by current
  ``position_y``), anchor = first child's ``y``, spacing read from each
  child's ``shape_position_dy``. ``gap`` parameter dropped.
- ``restackAncestorContainers()`` — same, no more gap to forward.

``Elements/NodeDimension.tsx``:

- ``setContainerMode`` (initial stacking block, ``entering &&
  !fromJSON``) — delegates to ``stackNodesVertically``, setting
  ``position_x`` first on each child, anchor ``y`` =
  ``parent.position_y``.

``Algorithms/Hierarchies.tsx``:

- ``computeEffectiveBlockHeight`` — the effective height of a subtree
  (recursive descendants) is computed by reading
  ``shape_position_dy`` on each descendant (except the first) instead
  of a scalar ``vertical_gap`` parameter. Param dropped.
- ``rebalanceAncestorColumns`` — siblings of the expanded node are
  re-placed around the visual parent by accumulating each sibling's
  ``shape_position_dy`` (except the first). ``vertical_gap`` param
  dropped.
- ``updateNodePositioning`` (``disaggregationExpansion`` helper) —
  symmetric placement of children around the parent's center: total
  stack height comes from ``totalStackHeight``, actual stacking
  delegates to ``stackNodesVertically``.
- ``disaggregate`` (the ``Do`` block of classic disaggregation) — same
  pattern: ``totalStackHeight`` to compute the anchor, then
  ``stackNodesVertically``.

Note: ``updateAggregationExpansionPositioning`` was already using
``aggregateNode.shape_position_dy`` as ``vertical_spacing`` before
this PR — nothing to change there.

Visual consequences
~~~~~~~~~~~~~~~~~~~~

The default ``shape_position_dy`` carried by ``elementStyleConfigs``
in ``Elements/ElementStyle.tsx`` is ``20`` for the default node style
(versus the ``10`` previously hard-coded). When entering container
mode or disaggregating, the initial spacing between children is
therefore now 20 px instead of 10 px. If a 10 px default is desired
again, it should be changed on the style rather than reintroduced as a
hard-coded value.

Invariants now holding
----------------------

After these two PRs:

- ``shape_position_dy`` is the single source of truth for vertical
  spacing between nodes of the same column / container sub-column (no
  hard-coded ``gap`` anywhere in stacking paths);
- the absolute → parametric switch preserves current ``position_y``
  values, except for pre-existing overlaps (clamped to 0 with a
  warning);
- a data tag change now refreshes parametric spacing;
- ``position_u`` is no longer implicitly derived from ``position_x``
  on every recompute: only call sites that have just modified an
  absolute position call ``inferPositionUFromX`` explicitly.

PR 3 — Centralized ``recomputeParametricLayout``
-------------------------------------------------

Third and final pass. The parametric layout recompute is collected
into a single public method
``Class_NodePositioning.recomputeParametricLayout(scope)``, called
once per draw cycle from ``Class_DrawingArea.drawElements``.
``Node.applyPosition``'s parametric branch becomes a pass-through
that only emits the SVG ``transform`` from already-computed
``position_x`` / ``position_y``.

Single entry point in ``drawElements``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``types/DrawingArea.tsx`` — at the top of ``drawElements``, after the
``bypass_redraws`` guard, when the default style is in ``parametric``
we call:

.. code-block:: typescript

   this.nodePositioning.recomputeParametricLayout({ type: 'all' })

This guarantees every ``position_y`` is fresh before any node is
actually drawn. Call sites that used to mutate ``position_y`` via
their own ``applyPosition`` calls (``set*Mode``, data tag change,
disaggregation, drag end…) need no change: they already end by
calling ``drawing_area.draw()``, which goes through ``drawElements``.

``Node.applyPosition`` as pass-through
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``Elements/Node.tsx`` — the parametric branch of ``applyPosition`` is
reduced to its minimum. The old walk
``nodeAbove → y = nodeAbove.y + nodeAbove.h + dy`` with its "nested
container bypass" early-return (a node that is both a container
parent and a container child would skip its parametric computation)
is gone. The method now only does:

1. the ``relative`` case (import/export nodes glued to a source /
   target), unchanged — it's a separate codepath;
2. the recursive ``applyPosition`` call on ``relative`` neighbours;
3. ``super.applyPosition()`` which emits the SVG ``transform`` from
   the current ``this.position_x`` / ``this.position_y``.

Three phases inside ``recomputeParametricLayout``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``Algorithms/NodePositioning.tsx`` — the method treats containers as
recursive sub-columns. The algorithm splits into three phases:

**Phase A — bottom-up sizing.** For each top-level container, walk
post-order into the nested containers. For each container visited,
sort its children by ``position_v`` (tie-break on ``position_y``),
then set ``shape_min_height`` to the total stack height
(``totalStackHeight(children) + margin_top + margin_bottom``) and
``shape_min_width`` to
``max(child width) + margin_left + margin_right``. No position is
written in this phase — only container sizes are updated. Containers
with no visible children are skipped (their intrinsic size is
preserved).

**Phase B — top-level column stacking.** Collect every visible
non-exchange node that is NOT a container child (no
``dimensions_as_child.some(d => d.container_mode)``). Group by
``position_u``. For each column, sort by ``position_v`` and call
``stackNodesVertically`` anchored on the lowest-V node's current
``position_y``. Top-level containers participate as normal nodes
with the correct height from phase A.

**Phase C — top-down positioning of container descendants.** Each
top-level container is descended into recursively. For each
container visited, its children are re-stacked at the anchor
``container.position_y + container.shape_margin_top``. Recursion
goes into nested containers. After phase B ``container.y`` may have
changed — phase C propagates the change to every descendant.

The scopes ``'column'`` and ``'subtree'`` are also available: the
former restricts phases B + C to a single column, the latter is
reserved for targeted treatments (local drag, see below — it is
implemented via a single-container phase C).

Parametric-mode drag
~~~~~~~~~~~~~~~~~~~~

``Elements/NodeEventsHandler.tsx`` — ``handleMouseDragEnd`` is now
explicit in parametric mode. The drag-end settle is a five-step
sequence:

1. ``inferPositionUFromX()`` to re-infer ``position_u`` from
   ``position_x`` on nodes whose horizontal position may have
   changed. The PR 3 version of this method *clusters* nodes by
   x proximity before computing ``u`` (see next section), avoiding
   the 1-2 px column jumps that plagued the old rounding-per-node
   approach.
2. Reset ``position_v`` to ``-1`` for non-``v_locked`` nodes — a
   latent bug where the reset ignored the lock is fixed here.
3. ``computeParametrization(false)`` which sorts each column by
   ``position_y`` and reassigns ``position_v``. **This is where the
   implicit neighbour-crossing swap happens**: if the drag carried
   the node above or below a neighbour, the sort-by-y gives a new
   order, and ``V`` is reassigned accordingly. No explicit crossing
   detection is needed — sorting is enough.
4. ``backCalculateShapePositionDyFromY`` which, for each column
   sorted by y, recomputes ``shape_position_dy`` of each node from
   the previous one (``dy_i = y_i - (y_{i-1} + h_{i-1})``), clamped
   to 0 on overlap. The canonical stack invariant is now consistent
   with the post-drag positions.
5. Explicit ``drawing_area.drawElements()`` — triggers
   ``recomputeParametricLayout`` (phases A/B/C) immediately, which
   re-stacks everything cleanly, including container descendants if
   the drag acted on a container child.

**Known limitation**: dragging the lowest-V child of a container
snaps it back to the container anchor
(``container.position_y + shape_margin_top``) on the phase C
re-stack. Phase C uses that fixed anchor and has no way to know the
first-V child has been moved. Dragging any other child works fine.
A proper fix would require either deriving phase C's anchor from
the first child's current y (propagating to ``container.y``) or
moving the container itself — out of scope until a real user flow
needs it.

Clustering in ``inferPositionUFromX``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``Algorithms/NodePositioning.tsx`` — the old implementation rounded
each node independently:

.. code-block:: typescript

   node.position_u = Math.round(node.position_x / dx)

Two visually-aligned nodes (1-2 px apart) could fall on opposite
sides of the ``x = (u + 0.5) * dx`` rounding boundary and end up in
different columns with the user never feeling they had done anything
to cause it. Observed for real on a diagram with ``dx = 200`` and
four nodes at ``x ≈ 1898.88 / 1900.18 / 1901.47``: two on each side
of 1900, two different ``u`` values (9 and 10).

The new implementation clusters nodes by x proximity first, then
computes one ``u`` per cluster:

1. Sort eligible nodes (visible, non-exchange) by ``position_x``
   ascending.
2. Sliding walk: a node joins the current cluster if its
   ``position_x`` is within ``tolerance`` of the cluster's running
   max-x, otherwise it starts a new cluster.
   ``tolerance = max(10, dx * 0.05)`` — large enough to absorb
   pixel noise / envelope drifts, small enough to never merge
   adjacent columns (5 % of a ``dx``).
3. For each cluster: if it contains a ``u_locked`` node, the cluster
   inherits its ``u`` (the lock defines the authoritative column).
   Otherwise, ``u = round(mean_x / dx)``.
4. The cluster's ``u`` is applied to every non-locked member.

Using the **cluster's running max-x** as the reference (not the
starting x) is important: a chain of nodes each within
``tolerance`` of the previous forms a single cluster even if the
head-to-tail distance exceeds ``tolerance``.

Dead container-stacking path removed
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

PR 3 drops the helpers that used to drive container layout:

- ``Class_NodeElement.restackContainerChildren`` — re-stacked the
  direct children of a container. Replaced by phase C.
- ``Class_NodeElement.restackAncestorContainers`` — walked up the
  container chain re-stacking each ancestor. Replaced by phase A
  (recursive bottom-up sizing).
- The ``setTimeout(0)`` hack in
  ``NodeDimension.setContainerMode``. It existed to defer the
  parent's envelope recompute until the browser had flushed the
  children's SVG so ``getBBox`` could read their real extents.
  Phase A reads **logical** geometry
  (``position + shape size + margins``) — no ``getBBox`` call —
  eliminating the race that motivated the hack.
  ``setContainerMode`` now finishes with a single
  ``drawing_area.drawElements()`` call.

Kept:

- ``propagateContainerEnvelopeToAncestors`` — still used by
  ``Class_NodeElement.eventMouseDrag`` for the drag path in
  absolute mode, where no parametric recompute fires.
- ``setContainerModeQuiet`` — still used by ``Algorithms/UpdateFrom``
  during view switches.

Invariants now holding (all PRs combined)
------------------------------------------

After all three PRs:

- ``shape_position_dy`` is the single source of truth for vertical
  spacing between nodes of the same column / container sub-column
  (no hard-coded ``gap`` anywhere in stacking paths);
- ``recomputeParametricLayout`` is the only path that writes
  ``position_y`` in parametric mode, called once per draw cycle
  from ``drawElements``;
- ``Node.applyPosition`` parametric is a pass-through that only
  emits the SVG ``transform`` from already-computed positions;
- containers are treated as recursive sub-columns at any nesting
  depth;
- the absolute → parametric switch preserves current
  ``position_y`` (except for overlaps, which are clamped);
- a data tag change refreshes parametric spacing, including inside
  nested containers;
- the parametric drag-end is explicit with an immediate post-drag
  redraw;
- ``position_u`` is derived from ``position_x`` via clustering, not
  independent rounding, eliminating the 1-2 px column jumps;
- no legacy container helper survives unless justified by another
  codepath (absolute drag, view switch).

Documented limitations
-----------------------

- Dragging a container's lowest-V child: snaps to the container
  anchor (see drag section).
- Default ``shape_position_dy`` is 20 px in ``elementStyleConfigs``
  (was 10 px hard-coded before PR 2): initial child spacing on
  container mode entry or disaggregation is therefore 20 px. To get
  10 px back, change the style rather than reintroducing a
  hard-coded value.

See also
--------

- PR 3 tracking issue: ``su-model/opensankey#1210``.
