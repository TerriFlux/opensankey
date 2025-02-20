import React, { FunctionComponent} from 'react'
import parse from 'html-react-parser'
import { TFunction } from 'i18next'

import {
  Box,
} from '@chakra-ui/react'

// Register : Modal for terms of use
export const Presentation: FunctionComponent<{
  t: TFunction,
  logo_sankey_plus: string
}> = ({
  t,logo_sankey_plus
}) => {
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
