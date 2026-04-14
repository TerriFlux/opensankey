Enclosing mode (simultaneous parent/children display)
=======================================================

Summary
-------

Enclosing mode displays an aggregated node (parent) and its
disaggregated nodes (children) at the same time. The parent is
rendered as an envelope visually surrounding its children, and the
graph's flows are split between parent and children according to a
chosen variant.

It is a third display mode, in addition to the standard aggregated
display (only the parent is visible) and the standard disaggregated
display (only the children are visible).

Prerequisites
-------------

The node must belong to a parent/child dimension — that is, an
aggregation hierarchy must already exist on the diagram, with a parent
node and one or more child nodes.

Access
------

1. Right-click on a parent node or one of its children.
2. Open the **Hierarchy Navigation** submenu.
3. Open the submenu for the relevant dimension (one submenu per
   existing dimension).
4. Choose one of the two "Enclose" entries.

Variants
--------

Two variants are available, depending on how flows should be split
between parent and children:

**Enclose (inputs → children, outputs ← parent)**
    Incoming links connect to each child individually. Outgoing links
    leave the enclosing parent as a single bundle. Useful when you
    want to show the detailed origin of the flows but their aggregate
    output.

**Enclose (inputs → parent, outputs ← children)**
    Symmetric variant: incoming links converge on the parent, while
    outgoing links leave from each child individually. Useful for the
    reverse case: aggregated inputs, detailed outputs.

In both variants, **links internal to the group** (child to child
within the same dimension) remain visible inside the envelope.

Interactions
------------

- **Dragging the enclosing parent**: the contained children follow as
  a block, similar to dragging a geometric frame containing nodes.
- **Dragging a child**: the parent envelope automatically adjusts to
  keep containing it.

Exiting the mode
----------------

From the same **Hierarchy Navigation** submenu, choose **Exit
enclosing mode** (the entry only appears when the mode is active on
that dimension).

You can also switch directly to another display mode (standard
aggregate, standard disaggregate, or the other enclosing variant)
without going through the "Exit" button: the new mode replaces the
previous one automatically.

Known limitations
-----------------

- The parent's layout is driven by its children's geometry (the
  parent is the envelope computed around them). A variant where the
  parent would be pre-positioned by the Sankey layout as a normal
  node and children would be forced inside it is planned for a
  future evolution.
- Cases involving multiple conflicting dimensions (the same child
  node involved in several dimensions, some in enclosing mode and
  some with standard parent/child forcing) have not been specifically
  validated.
- Undo / redo on enabling and disabling enclosing mode is partial in
  this initial version.

See also
--------

- :doc:`/dev/features/enclosing_mode` — technical description of the
  enclosing mode
