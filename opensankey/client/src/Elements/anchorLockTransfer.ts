// Pure transfer policy for a link's I/O anchor lock — the "cadenas" of the
// "Ordre des flux E/S" menu. No DOM / d3 / import-cycle deps, so it is
// unit-testable in isolation (cf. anchorLockTransfer.test.ts). The DOM-bound
// `Class_LinkElement.copyAnchorLockFrom` delegates here.
//
// When a layout is re-applied onto another diagram ("Appliquer la mise en page"
// → flux "Tailles et positions"), `Node.keepLinkOrderingFrom` copies the I/O
// ORDER but used to drop the lock that pins it. The destination links stayed
// "auto", so the first reorganize re-sorted them by relative node positions and
// the re-applied locked arrangement was lost (issue #202). Carrying the lock
// state alongside the order keeps the locked arrangement.

/**
 * The per-end anchor lock of a link, as transferred between diagrams. `frozen`
 * is the side captured when the user locked the anchor; it is only meaningful
 * while `locked` is true.
 */
export interface AnchorLockState<S> {
  source_side_locked: boolean
  source_side_frozen: S | undefined
  target_side_locked: boolean
  target_side_frozen: S | undefined
}

/**
 * Derive the lock state a destination link should take from its layout source.
 *
 * A faithful copy of both flags AND frozen sides — copying only the boolean
 * would let the destination recompute the frozen side from its own geometry,
 * defeating the lock. The frozen side is normalized away when the end is
 * unlocked, so transferring an unlocked source also clears a previously-locked
 * destination (the lock can be released by re-applying an "auto" layout).
 *
 * Generic over the side type so the test can use lightweight stand-ins.
 */
export function transferAnchorLock<S>(src: AnchorLockState<S>): AnchorLockState<S> {
  return {
    source_side_locked: src.source_side_locked,
    source_side_frozen: src.source_side_locked ? src.source_side_frozen : undefined,
    target_side_locked: src.target_side_locked,
    target_side_frozen: src.target_side_locked ? src.target_side_frozen : undefined,
  }
}
