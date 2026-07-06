# Email of 6 July 2026: SankeyMATIC & STAN imports, layout, reliability (v1.2.0)

> **Status: draft.** Covers everything shipped since v1.1.7 (last email sent,
> 26 June): versions 1.1.8, 1.1.9 and 1.2.0. Review / amend (and date it on the
> day of sending) before distribution. English counterpart of
> `2026-07-06-opensankey.md`.

---

Subject: OpenSankey v1.2.0: SankeyMATIC & STAN imports, layout, reliability

Hello,

Lots of new features since our last email: version 1.2.0 (and the intermediate
releases 1.1.8 and 1.1.9) opens the application to **diagrams from other tools**
(SankeyMATIC and STAN now import natively), adds new layout controls, and brings
substantial groundwork on the **reliability of your files**.

## Import from SankeyMATIC and STAN

Your existing diagrams no longer need to be re-entered:

- **SankeyMATIC**: open a SankeyMATIC text file directly from the Open menu.
  Flows, colors and settings are preserved, and the original layout is
  reconstructed. SankeyMATIC templates are also available in the library.
- **STAN**: `.smfa` files from the STAN software now open directly. Nodes,
  flows and values are imported, ready to be styled and reconciled.

## Edit your diagram as text

The Spreadsheet panel gets a new **Text** mode: the diagram can be written and
edited in the SankeyMATIC text format (one line per flow), and each apply
updates the drawing. Great for quickly sketching a structure, or pasting from
another tool.

## More faithful flow rendering

A new "**Exact outline**" flow shape: flows leaving the same node are drawn as
parallel, contiguous ribbons, with no overlap or gap. While dragging, rendering
stays smooth and snaps back at the end of the gesture.

## Layout: more control over scale and thickness

- **Smart locked size**: when the diagram is at a fixed size and a dataset
  overflows, the drawing automatically shrinks to keep everything visible, then
  returns to its size as soon as possible.
- **Per-view maximum thickness**: each view can cap the scale thickness of
  flows, handy when very different orders of magnitude coexist in the same file.
- **Thin flows down to zero**: the flow thickness floor can go down to 0,
  letting small flows visually disappear instead of being artificially enlarged.
- **More accurate automatic positioning** of inputs/outputs: the algorithm now
  accounts for columns when placing import/export flows.
- **Generalized reference element**: the diagram scale can now be anchored to a
  stock node, not only to a flow.

## Views, labels and publishing

- **View generator** available from the top bar: derive a series of views from
  a diagram in a few clicks.
- **Dynamic tokens in text**: `{Scale}` inserts the current scale into a label
  or title, and the view-tag token displays the value of the view's active tag.
- **Exclude a node from a view** with the "0" anti-tag, without touching the
  structure.
- **Publishing portfolio**: customizable title and logo, full-screen button in
  the top bar, download menu fix.

## Multilingual application

Documentation and tutorials are now available in **French, English, Spanish,
German and Italian**, the chosen language is remembered across sessions, and the
spreadsheet is fully translated.

## Your files, more reliable, and a hardened platform

Significant groundwork on file saving:

- very old files (2022) that no longer loaded now open again;
- appearance settings that could get lost from one save to the next (font sizes,
  borders, label positions, z-order) are now preserved identically;
- every change to the software is now automatically checked against a collection
  of real files from every era: your diagrams keep reloading identically,
  release after release.

On the platform side, version 1.1.9 brought a full hardening of server-side
security (service authentication, daily off-site backups, monitoring of all
three environments).

---

As always, your feedback directly shapes our priorities: reply to this email or
drop us a line.

Happy exploring,

The TerriFlux team, open-sankey.fr
