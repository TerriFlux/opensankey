Axis lock while dragging (Shift + drag)
========================================

Summary
-------

When moving a node with the mouse while holding the **Shift** key, the
drag is constrained to a single axis — either horizontal (U) or
vertical (V). The chosen axis is the one on which the initial motion
is dominant.

This is the standard behaviour from drawing tools such as SankeyMatic:
useful to align a node without perturbing its other coordinate.

Prerequisites
-------------

- Be in **Selection mode** in the toolbar on the left of the drawing
  area (Edition mode and Style paint mode do not enable node drag).
- Have one (or several) node(s) to move.

Access
------

1. Switch to Selection mode in the toolbar.
2. Hold the **Shift** key down.
3. Click-and-drag a node (or any node from the current selection).

Usage
-----

- The lock kicks in as soon as the accumulated motion exceeds a small
  threshold (~4 px). The chosen axis is the one whose component is
  dominant at that point — if the user initially moves right, the lock
  is horizontal; if they initially move down, it is vertical.
- While Shift is held, any component on the other axis is cancelled.
- **Releasing Shift** mid-drag releases the lock and free movement
  resumes immediately.
- **Re-pressing Shift** mid-drag resets the accumulator and lets a new
  axis be picked from the next motion.

Interactions with other features
---------------------------------

- **Multi-selection**: when several nodes are selected, the lock
  applies to the whole group — every node follows the same axis.
- **Magnetic (grid) mode**: the lock is applied *before* grid
  snapping, so nodes only step along the locked axis.
- **Enclosing mode**: when dragging a parent node whose children are
  enclosed, the children follow the locked motion on the same axis.
- **Undo / Redo**: a locked drag is recorded as a normal undo step
  (initial vs. final position), exactly like a free drag.

Known limitations
-----------------

- The lock only applies to dragging **nodes** and **containers** in
  Selection mode. Free label drags, drawing-area panning and Edition
  mode drags are not affected.
- The ~4 px threshold is not configurable in this version.

See also
--------

- :doc:`/dev/features/uv_position_lock` — technical description
