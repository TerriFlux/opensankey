import React, {
  FunctionComponent,
  useEffect
} from 'react'
import * as d3 from 'd3'

import { Type_JSON } from './types/Utils'

import { initializeApplicationData } from './Modules'

/*************************************************************************************************/

export const ViewerOpenSankeyApp: FunctionComponent<{initial_data:Type_JSON}> = (
  {initial_data}
) => {
  // Initialize data
  const new_data = initializeApplicationData(initial_data)
  // If leveltags are present Primaire is desactivated
  new_data.drawing_area.sankey.triggerPrimaryLevelTagging()

  /*************************************************************************************************/

  useEffect(() => {
    // Delete potential duplicat
    d3.select('#draw_zoom').remove()
    new_data.draw()
  }, [new_data.language])

  /*************************************************************************************************/
  return <div id='sankey_app' style={{ 'backgroundColor': 'WhiteSmoke' }}/>
}

export default ViewerOpenSankeyApp


