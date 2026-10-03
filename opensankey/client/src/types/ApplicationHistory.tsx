// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// External imports
// Nothing ...

// Local imports
import { Class_MenuConfig } from './MenuConfig'
import { HISTORY_TOPIC } from './EventBus'

// SPECIFIC CONSTANTS ******************************************************************/

export const history_size: number = 10

/**
 * sa#568 — OÙ UN GESTE A ÉTÉ FAIT, pour l'annuler (ou le rétablir) LÀ OÙ il a été fait.
 *
 * Alexandre (03/10) : « les boutons annuler / rétablir s'appliquent tout le temps à toutes les
 * actions effectuées dans le fichier, quel que soit le volet et sa synchronisation avec les
 * autres ». Un document n'a qu'un dessin vivant, qui passe d'un volet Sankey à l'autre avec la
 * mise en page de chacun (sa#581) : un geste fait dans le volet A, annulé pendant que B est le
 * vivant, s'appliquerait à la mise en page de B. L'historique retient donc, pour chaque entrée, le
 * contexte du geste (`capture`), et le rétablit (`restore`) avant de la rejouer — le volet A
 * redevient le vivant, puis le geste est défait.
 */
export type Type_HistoryContext = {
  capture: () => unknown
  restore: (context: unknown) => void
}

// CLASS APPLICATION DATA **************************************************************/

/**
 * Class that contains all elements to make the application work
 *
 * @class Class_ApplicationData
 */
export class Class_ApplicationHistory {

  // PROTECTED ATTRIBUTES ==============================================================

  /**
   * Table that contains function to go Forward or Backward
   * @protected
   * @memberof Class_ApplicationHistory
   */
  protected _transitions_table: {
    toNext: () => void,
    toPrev: () => void
  }[] = []

  /**
   * Current index for transition table
   *
   * @protected
   * @type {number}
   * @memberof Class_ApplicationHistory
   */
  protected _index_table: number = 0

  /**
   * Min index for transition table - cannot undo if index = index_min
   * @protected
   * @type {number}
   * @memberof Class_ApplicationHistory
   */
  protected _index_table_min: number = 0

  /**
   * Max index for transition table - cannot redo if index = index max
   *
   * @protected
   * @type {number}
   * @memberof Class_ApplicationHistory
   */
  protected _index_table_max: number = 0

  /**
   * True if we can undo action
   * @protected
   * @type {boolean}
   * @memberof Class_ApplicationHistory
   */
  protected _can_undo: boolean = false

  /**
   * True if we can redo action
   * @protected
   * @type {boolean}
   * @memberof Class_ApplicationHistory
   */
  protected _can_redo: boolean = false

  // PRIVATE ATTRIBUTES =================================================================

  private _menu_config: Class_MenuConfig

  /** sa#568 — le contexte des gestes, posé par le document principal (cf. `Type_HistoryContext`). */
  public context: Type_HistoryContext | null = null

  /**
   * sa#568 — avance à chaque entrée posée, annulée ou rétablie. Deux lectures égales disent « rien
   * ne s'est passé entre les deux » : c'est ce qui permet de fondre un geste continu (un curseur
   * qu'on fait glisser) en UNE entrée, en remplaçant son rétablissement au lieu d'en empiler une.
   */
  protected _stamp = 0
  public get stamp(): number { return this._stamp }

  /** `f`, précédé du retour au contexte où le geste a été fait. */
  protected _inContext(f: () => void): () => void {
    const context = this.context
    if (!context) return f
    const captured = context.capture()
    return () => {
      context.restore(captured)
      f()
    }
  }

  // CONSTRUCTOR ========================================================================

  /**
   * Create instance of Class_ApplicationHistory
   * @param application_data
   */
  constructor(menu_config: Class_MenuConfig) {
    this._menu_config = menu_config
    // Init transition table
    for (let i=0; i<history_size; i=i+1) {
      this._transitions_table.push({
        toNext: () => {},
        toPrev: () => {},
      })
    }
  }

  // PUBLIC METHODS ===================================================================

  /**
   * os#1385 (lot 2) — Le slot ET le topic, à chaque mouvement de la pile.
   *
   * Le slot `ref_to_menu_updater` garde son titulaire unique, le squelette de menus, qui se
   * re-rend et re-rend ses enfants avec lui : c'est ce qui rafraîchissait les boutons
   * annuler/rétablir jusqu'ici, par ricochet. Ce ricochet ne suffit plus dès que les boutons
   * regardent l'historique de l'ACTIF et non plus celui du document principal — le squelette
   * est celui de l'hôte, il ne se re-rend pas parce que le document B a empilé une action.
   * D'où le topic, qui accepte N abonnés et n'enlève son emplacement à personne.
   */
  protected _notifyMenus() {
    this._menu_config.ref_to_menu_updater.current()
    this._menu_config.notify(HISTORY_TOPIC)
  }

  /**
   * Save undo function
   * @param f
   */
  public saveUndo(
    f: () => void,
    // sa#568 — `false` : l'entrée vise elle-même ce qu'elle défait (un volet, une figure) et n'a pas
    // à ramener d'abord le volet où le geste a été fait (cf. `Type_HistoryContext`).
    in_context: boolean = true
  ) {
    this.increaseIndexes()
    this._transitions_table[this._index_table % history_size].toPrev = in_context ? this._inContext(f) : f
    this._stamp += 1
    this._notifyMenus()
  }

  /**
   * Save redo function
   * @param f
   */
  public saveRedo(
    f: () => void,
    in_context: boolean = true
  ) {
    this._transitions_table[(this._index_table - 1) % history_size].toNext = in_context ? this._inContext(f) : f
    this._notifyMenus()
  }

  /**
   * Go back
   */
  public applyUndo() {
    if (this.can_undo) {
      this._transitions_table[this._index_table % history_size].toPrev()
      this._index_table = this._index_table - 1
      this._stamp += 1
      this._notifyMenus()
    }
  }

  /**
   * Go forward
   */
  public applyRedo() {
    if (this.can_redo) {
      this._transitions_table[this._index_table % history_size].toNext()
      this._index_table = this._index_table + 1
      this._stamp += 1
      this._notifyMenus()
    }
  }

  // PROTECTED METHODS =================================================================

  protected increaseIndexes() {
    // Update all indexs
    this._index_table = (this._index_table + 1)
    this._index_table_max = this._index_table
    this._index_table_min = Math.max(this._index_table_min, this._index_table - history_size)
    // Protection - When increasing to much number, numbers may return to zero
    if (this._index_table > history_size*3) {
      this._index_table = (this._index_table - history_size)
      this._index_table_max = (this._index_table_max - history_size)
      this._index_table_min = (this._index_table_min - history_size)
    }
  }

  // GETTER ============================================================================

  public get can_undo() {
    return (this._index_table > this._index_table_min)
  }

  public get can_redo() {
    return (this._index_table < this._index_table_max)
  }
}