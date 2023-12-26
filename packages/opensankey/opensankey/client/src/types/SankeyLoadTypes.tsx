import { TFunction } from "i18next";

interface SankeyLoadProdTypes {
  t:TFunction
  url_prefix: string,
  successAction: () => void,
  show_dialog : boolean,
  /**
   * Function to change show_dialog value
   *
   * @type {(b:boolean)=>void}
   */
  set_show_dialog : (b:boolean)=>void,
  processing : boolean,
  /**
   * Function to change processing value
   *
   * @type {(b:boolean)=>void}
   */
  setProcessing : (b:boolean)=>void
  failure : boolean,
  /**
   *    * Function to change failure value
   *
   * @type {(b:boolean)=>void}
   */
  setFailure : (b:boolean)=>void
  /**
   * Function to change notStarted value
   *
   * @type {(b:boolean)=>void}
   */
  setNotStarted : (b:boolean)=>void
  result : string;
  setResult: (s:string)=>void,
  is_computing:boolean,
  setIsComputing:(b:boolean)=>void,
}

/**
 * Description placeholder
 *
 * @param {{url_prefix:string,finishReconciliation:(x:boolean)=>void,value:number[],result:string,setResult:(x:string)=>void}} {url_prefix,finishReconciliation,value,result,setResult}
 * @returns {void; value: {}; result: string; setResult: (x: string) => void; }) => any}
 */
export type CounterFType = (
  {url_prefix,finishReconciliation,value,result,setResult}:{url_prefix:string,finishReconciliation:(x:boolean)=>void,value:number[],result:string,setResult:(x:string)=>void}
) => JSX.Element

//export default SankeyLoad
