Parametric positioning cleanup (PR 1 + PR 2)
=============================================

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

This page documents the first two cleanup PRs. They introduce no new
user-visible behavior: they set the stage for the centralized
parametric recompute refactor (PR 3) by removing the buggy paths and
unifying spacing onto a single variable.

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

What is still broken (PR 3 material)
-------------------------------------

The "nested container bypass" early-return in ``Node.applyPosition``
(parametric branch) is still in place: a node that is both a parent of
a container and a child of another container skips its parametric
calculation entirely. This is one of the motivations for the
``recomputeParametricLayout`` refactor (PR 3), which will turn
``Node.applyPosition`` into a simple "emit SVG transform from
already-computed ``position_x`` / ``position_y``" and recurse into
containers from a single entry point.

See also
--------

- PR 3 (upcoming): ``recomputeParametricLayout(scope)``, recursive
  containers, local-rearrangement drag algorithm.
