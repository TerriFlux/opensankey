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
import { ClassAbstract_ApplicationHistory } from './Abstract'
import { Class_MenuConfig } from './MenuConfig'

// SPECIFIC CONSTANTS ******************************************************************/

export const history_size: number = 10

// CLASS APPLICATION DATA **************************************************************/

/**
 * Class that contains all elements to make the application work
 *
 * @class Class_ApplicationData
 */
export class Class_ApplicationHistory extends ClassAbstract_ApplicationHistory {

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

  // CONSTRUCTOR ========================================================================

  /**
   * Create instance of Class_ApplicationHistory
   * @param application_data
   */
  constructor(menu_config: Class_MenuConfig) {
    super()
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
   * Save undo function
   * @param f
   */
  public saveUndo(
    f: () => void
  ) {
    this.increaseIndexes()
    this._transitions_table[this._index_table % history_size].toPrev = f
    this._menu_config.ref_to_menu_updater.current()
  }

  /**
   * Save redo function
   * @param f
   */
  public saveRedo(
    f: () => void
  ) {
    this._transitions_table[(this._index_table - 1) % history_size].toNext = f
    this._menu_config.ref_to_menu_updater.current()
  }

  /**
   * Go back
   */
  public applyUndo() {
    if (this.can_undo) {
      this._transitions_table[this._index_table % history_size].toPrev()
      this._index_table = this._index_table - 1
      this._menu_config.ref_to_menu_updater.current()
    }
  }

  /**
   * Go forward
   */
  public applyRedo() {
    if (this.can_redo) {
      this._transitions_table[this._index_table % history_size].toNext()
      this._index_table = this._index_table + 1
      this._menu_config.ref_to_menu_updater.current()
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