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

// Standard lib
import React, {
  FC,
  useState,
} from 'react'
import {
  Button,
  Box,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Center,
  Checkbox,
  ModalFooter
} from '@chakra-ui/react'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { OSTooltip } from '../configmenus/BaseComponents'


type FCType_ModalDocumentation = {
  app_data: Class_ApplicationData
}

/**
 * Modal containing documentation
 *
 * @param {*} { new_data, additionalMenu, Reinitialization }
 * @return {*}
 */
export const ModalDocumentation: FC<FCType_ModalDocumentation> = (
  {
    app_data
  }
) => {
  // Data -------------------------------------------------------------------------------
  const { never_see_again, show_splashscreen } = app_data.menu_configuration

  // Component updater ------------------------------------------------------------------
  const [, setCount] = useState(0)
  app_data.menu_configuration.ref_to_splashscreen_updater.current = () => setCount(a => a + 1)

  // Component --------------------------------------------------------------------------
  return <Modal
    isOpen={show_splashscreen}
    onClose={() => null}
    scrollBehavior='inside'
    variant='modal_documentation'
  >
    <ModalOverlay />
    <ModalContent>
      <ModalBody >
        <Center>
          <Box layerStyle='menuconfigpanel_grid'>
            <Box
              layerStyle='options_2cols'
              height='fit-content'
              gridColumnGap='0.5rem'
            >
              <OSTooltip
                placement='left-end'
                label={app_data.t('tooltip.start')}
                isAlwaysOpen={show_splashscreen}>
                <Button
                  variant='btn_documentation'
                  onClick={() => {
                    app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_templates_lib.current!(true)
                    app_data.menu_configuration.show_splashscreen = false
                  }}>
                  {app_data.t('start')}
                </Button>
              </OSTooltip>
              <OSTooltip
                placement='right-end'
                label={app_data.t('tooltip.diaporama')}
                isAlwaysOpen={show_splashscreen}>
                <Button
                  variant='btn_documentation'
                  onClick={() => {
                    app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_welcome.current!(true)
                    app_data.menu_configuration.show_splashscreen = false
                  }}>
                  {app_data.t('diaporama')}
                </Button>
              </OSTooltip>
            </Box>
          </Box>
        </Center>
      </ModalBody>
      <ModalFooter>
        <Checkbox
          variant='checkbox_dont_show_again'
          isChecked={never_see_again.current}
          onChange={evt => {
            never_see_again.current = evt.target.checked
            localStorage.setItem('dontSeeAgainWelcome', evt.target.checked ? '1' : '0')
            app_data.menu_configuration.show_splashscreen = !evt.target.checked
          }}
        >
          <OSTooltip
            placement='bottom'
            label={app_data.t('tooltip.dontSeeAgain')}>
            {app_data.t('dontSeeAgain')}
          </OSTooltip>
        </Checkbox>
      </ModalFooter>
    </ModalContent>
  </Modal>
}

