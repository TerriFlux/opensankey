// #204 — Ré-ancrage d'un nœud en fin d'« Appliquer la mise en page » (updateFrom),
// mode coordonnées absolues.
//
// Contexte : depuis #1231 (≥ 1.1.5) la vérité de position d'un nœud est son CENTRE
// (posé par le bloc posNode via setStoredCenter). En fin d'updateFrom, l'ancien code
// appelait inconditionnellement `settleCenterAnchor()`, qui RECAPTURE le centre DEPUIS
// le coin (captureCenterFromCorner). Or `posFlux` s'exécute APRÈS posNode et peut
// reclasser le côté d'attache des flux d'un nœud-puits → cela PERMUTE largeur/hauteur ;
// le coin dérivé à posNode ne correspond alors plus à la taille courante, et recapturer
// le centre depuis ce coin le décale de (Δlargeur/2, Δhauteur/2) — décalage diagonal
// ∝ épaisseur de bande (cas « Eau » de la filière porcine SOCLE en vue désagrégée :
// nœud invisible dont le libellé suit la géométrie du nœud).
//
// Correctif : quand le centre est initialisé (fichiers ≥ 1.1.5 et nœuds transférés),
// on DÉRIVE le coin DEPUIS le centre autoritaire (forceDeriveFromCenter) — idempotent,
// à la taille courante, sans jamais réécrire le centre. Repli `settleCenterAnchor` pour
// les anciens fichiers coin-based (centre non encore initialisé), dont la vérité EST le
// coin.

export interface AnchorableNode {
  center_x: number | undefined
  center_y: number | undefined
  forceDeriveFromCenter(): void
  settleCenterAnchor(): void
}

export function settleNodeAnchorAfterLayout(node: AnchorableNode): void {
  if (node.center_x !== undefined && node.center_y !== undefined) {
    node.forceDeriveFromCenter()
  } else {
    node.settleCenterAnchor()
  }
}
