import React, { FunctionComponent} from 'react'

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

  return <Box layerStyle='welcome_license_row' background='gray.50'>
    <Box>
      <img
        src={logo_sankey_plus}
        alt='logo_OSP'
        style={{ 'objectFit': 'contain', 'width': '225px' }}
      />
    </Box>
    <Box layerStyle='welcome_license_desc'>
      {t('Register.presentation.text')}
    </Box>
  </Box>
}
