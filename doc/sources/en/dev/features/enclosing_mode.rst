Enclosing mode — technical description
========================================

Goal
----

Add a display mode where the parent node of an aggregation dimension
and its children are rendered simultaneously, with the parent visually
surrounding its children. Two variants are offered for how flows are
split: inputs on the children with outputs from the parent, or the
reverse. Intra-group links (child to child within the same dimension)
remain visible in both variants.

All the code lives in the nested submodule
``submodules/OpenSankey+/submodules/OpenSankey`` — i.e. at the
OpenSankey base level, not in OpenSankey+ or SankeyApplication.

Data model
----------

``Class_NodeDimension`` — ``Elements/NodeDimension.tsx``
    New private field ``_container_mode`` of type ``Type_ContainerMode``,
    mutually exclusive with ``_force_show_parent`` and
    ``_force_show_children``:

    .. code-block:: typescript

       export type Type_ContainerMode =
         | null
         | 'in_children_out_parent'
         | 'in_parent_out_children'

    New public methods:

    - ``setContainerMode(mode)``: activates the enclosing mode, clears
      the other forcing flags, reorganizes the input/output links,
      and redraws parent and children.
    - ``unsetContainerMode()``: returns to a neutral state.
    - ``container_mode`` getter.

    The existing ``setForceToShowParent``, ``setForceToShowChildren``
    and ``unsetForcingToShow`` methods were updated to reset
    ``_container_mode`` to ``null`` — this guarantees mutual
    exclusivity.

Node visibility
---------------

``NodeDimensionsManager.checkIfRelatedDimensionsAreSelected`` — same
file.

As soon as one of the dimensions involving the node is in
``container_mode``, the method short-circuits and returns ``true``.
Both the parent and the children are therefore visible at the same
time, without interfering with other forcing flags that might exist
on other dimensions.

Per-side link visibility
------------------------

``Class_LinkElement`` — ``Elements/Link.tsx``.

New ``is_allowed_by_container_modes`` getter added to the
``is_visible`` computation. For each dimension in enclosing mode that
involves the link's source or target, the following rule applies:

=====================================  ==========================  ==========================
Case                                   ``in_children_out_parent``  ``in_parent_out_children``
=====================================  ==========================  ==========================
Source = parent (parent outgoing)      visible                     hidden
Target = parent (parent incoming)      hidden                      visible
Source = child (child outgoing)        hidden                      visible
Target = child (child incoming)        visible                     hidden
Source and target children of group    visible                     visible
Parent ↔ its own child                 hidden                      hidden
=====================================  ==========================  ==========================

If several dimensions in enclosing mode impact the same link, the
strictest rule wins: a single hidden flag is enough to make the link
invisible.

Rendering the enclosing parent
------------------------------

``Class_NodeElement`` — ``Elements/Node.tsx``.

New public method ``applyContainerEnvelopeIfNeeded()``:

1. Filters dimensions where this node is parent and
   ``container_mode`` is non-null.
2. Aggregates the list of relevant children (deduplicated).
3. Calls the shared utility ``_computeEnvelopeBBox`` to obtain the
   enclosing bounding box.
4. Calls ``_applyEnvelopeBBox`` to propagate it to ``position_x``,
   ``position_y``, ``shape_min_width`` and ``shape_min_height``.

The method is invoked at the very start of ``_draw()``, so the shape
is drawn with the enclosing geometry in the same draw pass — no
second pass is needed.

Shared utility on ``Class_NodeBase``
-------------------------------------

``Class_NodeBase`` — ``Elements/NodeBase.tsx``.

Two new protected methods:

- ``_computeEnvelopeBBox(nodes)``: computes the enclosing bounding
  box for a list of ``Class_NodeBase``. First tries ``getBBox()`` on
  the SVG DOM, and falls back to the logical geometry
  (``position_x/y`` + ``getShapeWidthToUse/HeightToUse``) if the node
  is not yet rendered. This allows a correct first draw, even before
  children are in the DOM.
- ``_applyEnvelopeBBox(bbox)``: applies the bbox to ``position_x/y``
  and ``shape_min_width/height``, honoring the ``shape_margin_*``
  attributes.

The existing
``Class_ContainerElement.computeSizeAndPositionFromAttachedNodes``
method was refactored to delegate to these two utilities.

Drag propagation
----------------

``eventMouseDrag`` is overridden in ``Class_NodeElement``:

- If the node is the **parent** of a dimension in enclosing mode and
  is part of the current drag selection, the ``dx/dy`` delta is
  propagated to the contained children. Children already present in
  the selection are skipped to avoid double movement (via an
  ``already_moved`` ``Set``).
- If the node is a **child** of a dimension in enclosing mode, the
  parent's envelope is recomputed and its shape redrawn after each
  drag frame.

Context menu
------------

Three files are touched to wire the new menu entries:

``NodeActions.tsx``
    Three new methods ``containerInChildrenOutParent``,
    ``containerInParentOutChildren``, ``unsetContainerMode``.
    Registered in ``createModifier`` so they are accessible through
    the action dispatcher.

``ContextNodeConfig.tsx``
    ``actions`` entries with FR and EN labels, ``undoable: true``,
    ``closeMenuAfter: true``.

``SankeyMenuContext.tsx``
    The three entries are injected into both dynamic submenus of
    ``navHierarchy`` (``dimensions_as_child`` and
    ``dimensions_as_parent`` sides), alongside the existing
    ``aggregate``, ``disaggregate`` and left/right expansion entries.
    The "Exit enclosing mode" entry uses a ``customCheck`` to only
    appear when ``dim.container_mode`` is active.

Persistence
-----------

- ``NodeDimensionsManager.toJSON`` serializes ``container_mode`` when
  it is non-null.
- ``fromJSON`` replays the state via ``setContainerMode``, taking
  precedence over the ``force_show_children`` / ``force_show_parent``
  flags if they coexist in a legacy file.
- The legacy type ``SankeyNodeAttr.dimensions[*]`` in
  ``Persistence/LegacyType.tsx`` includes the optional
  ``container_mode`` field.

Files touched
-------------

============================================  =====================================
File                                          Main change
============================================  =====================================
``Elements/NodeDimension.tsx``                ``_container_mode`` + setters + JSON
``Elements/NodeBase.tsx``                     ``_computeEnvelopeBBox`` and ``_applyEnvelopeBBox`` utilities
``Elements/TextZone.tsx``                     delegated to the utilities
``Elements/Node.tsx``                         ``applyContainerEnvelopeIfNeeded`` + ``eventMouseDrag`` override
``Elements/Link.tsx``                         ``is_allowed_by_container_modes``
``components/dialogs/NodeActions.tsx``        3 actions + ``createModifier``
``components/dialogs/ContextNodeConfig.tsx``  FR/EN labels
``components/dialogs/SankeyMenuContext.tsx``  entries in the dynamic submenus
``Persistence/LegacyType.tsx``                ``container_mode`` type
============================================  =====================================

Decisions and rejected alternatives
------------------------------------

**Layout approach (envelope vs. pre-positioned parent)**
    Two approaches were on the table:

    - **A** — the parent is computed as the envelope of its children
      (which are themselves laid out by the normal Sankey layout);
    - **B** — the parent is laid out by Sankey as if it were alone,
      and children are then squeezed inside its rectangle in a
      post-pass.

    Approach A was chosen for this initial version because it
    directly reuses the mechanism already present in
    ``Class_ContainerElement`` (text zones), without touching the
    Sankey layout or introducing a post-pass. Approach B is left open
    as a future evolution; it would produce better visual results
    when the parent's natural column differs from the children's.

**Synthetic parent-side links**
    An early idea considered creating synthetic aggregated links on
    the parent (similar to what ``aggregationExpansion`` does). It
    was rejected: the parent already has its own links in the data
    model, they are just hidden in the standard disaggregated view.
    Enclosing mode makes them visible asymmetrically, without
    creating new links — simpler and more faithful to the model.

**Envelope utility lifted to ``Class_NodeBase``**
    Rather than duplicating the bbox logic between
    ``Class_ContainerElement`` and ``Class_NodeElement``, it was
    hoisted to the common base class ``Class_NodeBase``. This keeps a
    single source of truth and lets future features that need an
    envelope reuse it.

Known edge cases
----------------

- A node involved in several dimensions, some in enclosing mode and
  some under standard forcing: the visibility short-circuit in
  ``checkIfRelatedDimensionsAreSelected`` makes the node visible as
  soon as one dimension is in enclosing mode, without evaluating the
  others. Simple behavior, not validated on real-world cases.
- A parent whose children are in a different ``position_u`` column:
  the envelope follows the children; the Sankey layout is not
  recomputed. This is exactly what approach A plans; if that is not
  the desired behavior, approach B is the one to implement.
- Undo / redo: the three actions are marked ``undoable: true`` but do
  not yet record a history entry through ``executeWithUndo``. To be
  consolidated.

Possible evolutions
-------------------

- Implement approach B of the layout as a second variant, possibly
  controlled by an extra field on the dimension
  (``container_layout_strategy``).
- Full undo / redo on enabling and disabling the mode.
- Dedicated envelope styles (border, semi-transparent fill,
  configurable padding).
- Unit tests for the link visibility logic in
  ``is_allowed_by_container_modes``.

See also
--------

- :doc:`/user/features/enclosing_mode` — user documentation of
  enclosing mode
