// Standard lib
import React, {
  FunctionComponent,
} from 'react'
import {
  Button,
  Box,
  Modal,
  ModalBody,
  ModalContent,
  ModalCloseButton,
  ModalFooter,
  ModalOverlay,
  Center,
  Checkbox
} from '@chakra-ui/react'
import { Type_GenericApplicationData } from '../../types/Types';
import { useTour } from '@reactour/tour'
import { OSTooltip } from '../../types/Utils';


type FCType_ModalDocumentation = {
  show_documentation: boolean
  set_show_documentation: (_: boolean) => void
  app_data: Type_GenericApplicationData
}

/**
 * Modal containing documentation
 *
 * @param {*} { new_data, additionalMenu, Reinitialization }
 * @return {*}
 */
export const ModalDocumentation: FunctionComponent<FCType_ModalDocumentation> = (
  { show_documentation, set_show_documentation, app_data }: FCType_ModalDocumentation
) => {
  const { never_see_again } = app_data.menu_configuration

  return <Modal
    isOpen={show_documentation && never_see_again.current == false}
    onClose={() => set_show_documentation(false)}
    scrollBehavior='inside'
    variant='modal_documentation'
    size={'sm'}>
    <ModalOverlay />
    <ModalContent>
      <ModalBody >
        <Center>
          <Box layerStyle='menuconfigpanel_grid'>
            <Box layerStyle='options_2cols' >
              <OSTooltip
                placement='top'
                label={'Commencer à tracer vos flux. Pour cela cliquez dans la zone de dessin, faites glisser sans relâcher, puis relâchez.'}
                isAlwaysOpen={show_documentation}>
                <Button size='lg' /*width='500px' height='200px'*/ variant='btn_lone_navigation_tertiary' onClick={() => {
                  set_show_documentation(false)
                }}>
                  {'Démarrer'}
                </Button></OSTooltip>
              <OSTooltip
                placement='bottom'
                label={'Diaporama présentant les différentes fonctionnalités de l\'outil des plus basiques aux plus avancées.'}
                isAlwaysOpen={show_documentation}>
                <Button size='lg' variant='btn_lone_navigation_tertiary' onClick={() => {
                  app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_welcome.current!(true)
                  set_show_documentation(false)
                }}>
                  {'Diaporama'}
                </Button>
              </OSTooltip>
            </Box>
            <Box layerStyle='box_footer_welcome' style={{ marginTop: '100px' }}>
              <Checkbox
                variant='checkbox_dont_show_again'
                isChecked={never_see_again.current} onChange={evt => {
                  never_see_again.current = evt.target.checked
                  localStorage.setItem('dontSeeAggainWelcome', '1')
                  set_show_documentation(false)
                }}
              >
                {app_data.t('dontSeeAgain')}
              </Checkbox>
            </Box>
          </Box>
        </Center>
      </ModalBody>
    </ModalContent>
  </Modal>
}

