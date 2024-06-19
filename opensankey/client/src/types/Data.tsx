// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Local types
import { Class_Link } from './Link'
import { Class_Tag } from './Tag'


export class Class_Data {

  // PRIVATE ATTRIBUTES ===============================================================

  /**
     * Link on which data relates
     * @private
     * @type {Class_Link}
     * @memberof Class_Data
     */
  private related_link: Class_Link

  /**
     * Value of the data
     * @private
     * @type {number}
     * @memberof Class_Data
     */
  private value: number = 0

  /**
     * Unit in which given data is expressed
     * @private
     * @type {string}
     * @memberof Class_Data
     */
  private unit: string = ''

  // Tags
  private tags: {[_: string] : Class_Tag[]} = {}


  // CONSTRUCTOR ========================================================================

  /**
     * Creates an instance of Class_Data.
     * @param {Class_Link} link
     * @memberof Class_Data
     */
  constructor(
    link: Class_Link
  ) {
    this.related_link = link
  }

  // GETTERS / SETTERS ==================================================================

  // Value
  public getValue() { return this.value }
  public setValue(_: number) { this.value = _ }

  // Unit
  public getUnit() { return this.unit }
  public setUnit(_: string) { this.unit = _ }
}
