Axis lock while dragging — technical description
==================================================

Goal
----

Constrain a node's drag to a single axis (U or V) while the **Shift**
key is held, following the SankeyMatic shift+drag convention. The
chosen axis is the one whose component dominates during the first
frames of the drag, with a small engagement threshold to prevent
jitter from picking the wrong axis.

The code lives in the nested submodule
``submodules/OpenSankey+/submodules/OpenSankey`` — i.e. at the
OpenSankey base level.

Handler state
-------------

``NodeEventsHandler`` — ``Elements/NodeEventsHandler.tsx``.

Three new private fields track the lock over the lifetime of a drag:

.. code-block:: typescript

   private _shift_lock_axis: 'x' | 'y' | null = null
   private _shift_acc_dx: number = 0
   private _shift_acc_dy: number = 0

- ``_shift_lock_axis``: ``null`` while the axis is not yet committed,
  then ``'x'`` or ``'y'`` once the threshold has been crossed.
- ``_shift_acc_dx`` / ``_shift_acc_dy``: motion accumulated since
  Shift was pressed, used both to cross the threshold and to pick the
  dominant axis.

``handleMouseDragStart``
------------------------

Resets the three fields at the start of every drag so a new gesture
always starts free. The rest of the logic (position snapshot for
undo, bounding-box computation) runs as before, including when Shift
is held.

The previous ``if (event.sourceEvent.shiftKey) return`` short-circuit
has been removed: it silently broke undo for any shift+drag.

``handleMouseDrag``
-------------------

At the very top of the method, before any movement logic runs:

1. If ``event.sourceEvent.shiftKey`` is true:

   - ``event.dx`` and ``event.dy`` are accumulated into
     ``_shift_acc_dx`` / ``_shift_acc_dy``.
   - If ``_shift_lock_axis`` is ``null`` and the squared norm of the
     accumulator is ``>= threshold_sq = 16`` (≈ 4 px), the axis is
     committed: ``'x'`` if ``|acc_dx| >= |acc_dy|``, otherwise ``'y'``.
   - ``new_dx`` / ``new_dy`` are computed:

     - axis ``'x'``: ``new_dy = 0``
     - axis ``'y'``: ``new_dx = 0``
     - axis ``null`` (threshold not crossed yet): both are zeroed to
       prevent the first few px from leaking diagonally.

2. If ``shiftKey`` is false and the lock state is not pristine, the
   three fields are cleared: releasing Shift releases the lock
   immediately.

3. ``new_dx`` / ``new_dy`` are written back onto ``event`` via
   ``Object.defineProperty``:

   .. code-block:: typescript

      Object.defineProperty(event, 'dx', {
        value: new_dx, enumerable: true, configurable: true, writable: true
      })
      Object.defineProperty(event, 'dy', {
        value: new_dy, enumerable: true, configurable: true, writable: true
      })

   **Why not plain assignment?** In ``d3-drag``, ``DragEvent.dx`` and
   ``dy`` are defined by ``Object.defineProperties`` **without**
   ``writable: true`` (default ``false``) but with ``configurable:
   true``. A plain assignment throws ``TypeError: "dx" is read-only``
   in strict mode. Since the properties are configurable, however,
   they can be redefined via ``defineProperty``.

Downstream propagation
----------------------

Mutating ``event.dx`` / ``event.dy`` at the top of ``handleMouseDrag``
is enough to lock every displacement that depends on them:

- **Free node drag** (selection mode without magnetism) — the loop
  ``nodes_selected.forEach(n => n.setPosXY(... + event.dx, ... +
  event.dy))`` automatically picks up the modified values.
- **Magnetic mode** — ``moveMagneticNode(event, ...)`` reads
  ``event.dx`` / ``event.dy`` at line 597 to update
  ``_node_current_dx/dy`` before grid snapping: the lock is therefore
  applied upstream of the snap.
- **Container propagation** — ``Class_NodeElement.eventMouseDrag``
  (``Elements/Node.tsx``) calls ``super.eventMouseDrag(event)`` (which
  runs ``handleMouseDrag`` and mutates the event) and then itself
  reads ``event.dx`` / ``event.dy`` to move the enclosed children of
  enclosing-mode dimensions. The mutation is in place on the same
  reference, so children follow the lock as well.

``handleMouseDragEnd``
----------------------

The ``if (event.sourceEvent.shiftKey) return`` short-circuit has been
removed — the undo step and the automatic I/O reorganization now run
normally for a shift+drag. The three lock fields are cleared at the
end of the drag so they do not leak into the next gesture.

Modified files
--------------

- ``opensankey/client/src/Elements/NodeEventsHandler.tsx`` — ``_shift_*``
  fields, lock logic inside ``handleMouseDrag``, removal of the
  ``shiftKey`` short-circuits in ``handleMouseDragStart`` /
  ``handleMouseDragEnd``.

Decisions and rejected alternatives
-----------------------------------

**Lock location — handler vs. d3 layer**
    The lock is implemented in ``NodeEventsHandler``, not in a wrapper
    around the ``d3.drag()`` call in
    ``Element.setEventsListeners``. Reason: the handler is the single
    point through which every node and container drag flows, and
    already holds the necessary state (node reference, current
    selection). A d3-layer wrapper would have had to duplicate the
    knowledge of selection vs. edition mode.

**Engagement threshold — immediate vs. delayed**
    A first version picked the axis on the very first non-zero event.
    It sometimes produced a vertical lock on an initially horizontal
    gesture because of mouse jitter. The squared-norm threshold
    (``>= 16``, ≈ 4 px) removes this at the cost of a negligible
    delay; during that delay the node does not move at all, which
    looks cleaner than a node sliding 1 px diagonally then locking.

**Event mutation vs. local deltas**
    An alternative was to compute local ``effective_dx`` /
    ``effective_dy`` values and thread them through the downstream
    functions. That would have required refactoring
    ``moveMagneticNode`` and the ``Node.eventMouseDrag`` override to
    accept explicit deltas instead of reading the event. The
    ``defineProperty`` mutation is more invasive but strictly local
    and avoids a risky refactor.

See also
--------

- :doc:`/user/features/uv_position_lock` — user documentation
