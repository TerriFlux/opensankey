import React, { FunctionComponent} from 'react'
import parse from 'html-react-parser'

import {
  Box,
} from '@chakra-ui/react'
import { Class_ApplicationDataSA } from '../../ApplicationData'

// Register : Modal for terms of use
export const Presentation: FunctionComponent<{
  new_data_app: Class_ApplicationDataSA
}> = ({
  new_data_app
}) => {

  const { t, logo_sankey_plus} = new_data_app
  const html_text = parse(t('Register.presentation.text'))
  return <Box>
    <Box as='span'>
      <center><img
        src={logo_sankey_plus}
        alt='logo_OSP'
        style={{ 'objectFit': 'contain', 'height': '100px', 'marginBottom': '10px' }}
      /></center>
    </Box>
    <Box as='span'>
    {html_text}
    </Box>
  </Box>
}
