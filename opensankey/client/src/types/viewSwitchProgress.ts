/**
 * os#1368 — Ordonnancement du changement de vue : céder la main au navigateur avant le travail.
 *
 * `ViewsReader.applyViewChange` est entièrement SYNCHRONE : `unDraw` → reconstruction
 * (`extractViewFromJSON` sur le chemin heavy) → `sortNodes` → `draw` → cadrage → `orderElementOnDA`
 * → `resetHistory` → `updateViewMenus`, le tout dans un seul tour de boucle JS. Sur CARTOFOB
 * (194 nœuds, 1608 liens) cela fige l'interface plusieurs secondes. Un indicateur posé juste avant
 * l'appel ne serait JAMAIS peint : le thread principal ne repeint pas entre l'affichage et la fin
 * du travail. **Le point de cession est donc le cœur du correctif, pas l'indicateur.**
 *
 * Ce module porte la DÉCISION et l'ORDONNANCEMENT, sans une ligne de rendu : il ne connaît de
 * l'indicateur que deux gestes (`show` / `hide`). Aucune suite jest du dépôt ne pouvant charger
 * `@chakra-ui/react`, c'est la seule façon de rendre cette mécanique testable — même choix que
 * `ui/positionModeHost.ts` (os#1366). Le dessin de l'indicateur vit dans `viewSwitchOverlay.ts`.
 */

/** Ce que l'ordonnanceur attend d'un indicateur : deux gestes, rien de plus. */
export type Type_ViewSwitchIndicator = {
  show: () => void
  hide: () => void
}

/**
 * Les deux chemins du switch, tels que les distingue `applyViewChange` :
 * - `light` : le maître, ou une vue sans géométrie propre — AUCUNE reconstruction
 *   (`extractViewFromJSON` n'est pas appelé), seule la sélection de visibilité change ;
 * - `heavy` : une vue à snapshot — la DA est reconstruite intégralement depuis son gzip.
 */
export type Type_ViewSwitchPath = 'light' | 'heavy'

/** Ce que la décision a besoin de savoir des vues (typage structurel : testable sans diagramme). */
export type Type_ViewSwitchEntries = { [view_id: string]: { is_light?: boolean } | undefined }

/**
 * Chemin qu'empruntera `applyViewChange` pour cet id — même arbitrage, à la lettre :
 * `id == MASTER_VIEW_ID || is_light` réutilise la DA maître, tout le reste reconstruit.
 */
export const viewSwitchPath = (
  id: string,
  master_view_id: string,
  views: Type_ViewSwitchEntries
): Type_ViewSwitchPath =>
  (id === master_view_id || !!views[id]?.is_light) ? 'light' : 'heavy'

/**
 * Cession au navigateur : deux `requestAnimationFrame` imbriqués.
 *
 * UN SEUL rAF ne suffit pas — son callback s'exécute AVANT la peinture de la frame : le travail
 * lourd repartirait dans le même tour, et l'indicateur ne serait toujours pas visible. Le second
 * rAF n'est appelé qu'à la frame SUIVANTE, donc après que la première a été peinte.
 *
 * Idiome déjà en usage dans le dépôt (`waitForNextFrame`, SankeyExportsOSP), repris ici parce
 * qu'OpenSankey ne peut rien importer d'OpenSankey+ à l'exécution. Repli `setTimeout` hors
 * navigateur (node), où `requestAnimationFrame` n'existe pas.
 */
export const yieldToBrowser = (): Promise<void> => new Promise<void>((resolve) => {
  const raf = (typeof requestAnimationFrame === 'function') ? requestAnimationFrame : undefined
  if (!raf) { setTimeout(() => resolve(), 0); return }
  raf(() => { raf(() => resolve()) })
})

/**
 * Enchaîne un geste APRÈS le switch, que celui-ci ait été cédé ou non.
 *
 * Les hôtes du sélecteur rafraîchissent leurs composants juste après avoir demandé la bascule.
 * Sur le chemin cédé, ce rafraîchissement tomberait AVANT que `current_view_id` ait changé : le
 * sélecteur reviendrait une frame sur l'ancienne vue avant d'afficher la nouvelle. Un switch qui
 * échoue rafraîchit quand même (l'UI doit refléter l'état réel), puis laisse l'erreur remonter.
 */
export const afterViewChange = (result: void | Promise<void>, then: () => void): void => {
  if (!result) { then(); return }
  void result.then(then, (err) => {
    then()
    // eslint-disable-next-line no-console
    console.error('[OpenSankey] changement de vue en échec', err)
  })
}

export type Type_ViewSwitchProgressDeps = {
  /** Indicateur à poser / retirer. Absent (tests, node) => tout reste synchrone. */
  indicator?: Type_ViewSwitchIndicator
  /** Point de cession, injectable pour les tests. */
  yield_to_browser?: () => Promise<void>
}

/**
 * Ordonnanceur du changement de vue : décide s'il faut céder la main, pose l'indicateur, cède,
 * travaille, et le retire — Y COMPRIS SI LE TRAVAIL ÉCHOUE (`finally`).
 *
 * Deux invariants tiennent les enchaînements (`setCurrentViewToNext/Prev` en rafale, clic pendant
 * un switch) :
 *  1. l'indicateur est compté (`_pending`) : il n'est retiré qu'au retour du DERNIER travail en
 *     vol, jamais au retour du premier ;
 *  2. tant qu'un travail est en vol, TOUT switch suivant passe par la file différée, même léger —
 *     sans quoi un switch light synchrone s'appliquerait AVANT le heavy déjà cédé, et le
 *     diagramme finirait sur la mauvaise vue.
 */
export class Class_ViewSwitchProgress {
  private readonly _yield: () => Promise<void>
  private _indicator: Type_ViewSwitchIndicator | undefined
  private _pending = 0
  private _shown = false

  constructor(deps: Type_ViewSwitchProgressDeps = {}) {
    this._indicator = deps.indicator
    this._yield = deps.yield_to_browser ?? yieldToBrowser
  }

  public get indicator(): Type_ViewSwitchIndicator | undefined { return this._indicator }
  public set indicator(_: Type_ViewSwitchIndicator | undefined) { this._indicator = _ }

  /** Vrai tant qu'un travail cédé n'est pas revenu. */
  public get is_busy(): boolean { return this._pending > 0 }

  /** Vrai tant que l'indicateur est posé (miroir de l'état visible). */
  public get is_indicator_shown(): boolean { return this._shown }

  /**
   * Ce switch-ci mérite-t-il d'être cédé ?
   *
   * SEUL le chemin heavy. Une vue light ne reconstruit rien et se pose en quelques dizaines de
   * millisecondes : la différer coûterait une frame de latence au cas MAJORITAIRE (11 des 12 vues
   * de CARTOFOB) pour faire clignoter un indicateur — pire que rien. Elle reste donc exactement
   * aussi synchrone qu'avant ce lot.
   */
  public shouldDefer(path: Type_ViewSwitchPath): boolean {
    if (this._pending > 0) return true // invariant 2 : préserver l'ordre des switches
    return path === 'heavy' && this._indicator !== undefined
  }

  /**
   * Exécute le corps du switch, cédé ou non selon `shouldDefer`.
   *
   * Retourne `undefined` sur le chemin synchrone (comportement d'avant ce lot, à la lettre) et une
   * promesse sur le chemin cédé. Un appelant qui n'a rien à attendre peut ignorer le retour.
   */
  public run(path: Type_ViewSwitchPath, work: () => void): void | Promise<void> {
    if (!this.shouldDefer(path)) { work(); return }
    return this._runDeferred(work)
  }

  private async _runDeferred(work: () => void): Promise<void> {
    this._pending += 1
    if (!this._shown) {
      this._shown = true
      this._indicator?.show()
    }
    try {
      // LE point de cession : sans lui, l'indicateur posé ci-dessus ne serait jamais peint.
      await this._yield()
      work()
    } finally {
      this._pending -= 1
      if (this._pending === 0 && this._shown) {
        this._shown = false
        this._indicator?.hide()
      }
    }
  }
}
