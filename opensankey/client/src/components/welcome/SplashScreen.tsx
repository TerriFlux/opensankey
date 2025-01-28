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
  Center
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

  return <Modal
    isOpen={show_documentation}
    onClose={() => set_show_documentation(false)}
    scrollBehavior='inside'
    variant='modal_documentation'
    size={'full'}>
    <ModalOverlay />
    <ModalContent>
      <ModalBody marginLeft='40vw' >
        <Center>
          <OSTooltip
            placement='left'
            label={'Pour tracer un flux, cliquez, faites glisser sans relâcher, puis relâchez.'}
            isAlwaysOpen={show_documentation}
          >
            <Button colorScheme='blue' mr={3} onClick={() => set_show_documentation(false)}>
              Démarrer
            </Button>
          </OSTooltip>
          <OSTooltip
            placement='right'
            label={'Diaporama de présentation'}
            isAlwaysOpen={show_documentation}
          >
            <Button colorScheme='blue' mr={3} onClick={() => {
              app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_welcome.current!(true)
              set_show_documentation(false)
            }}>
              Présentation
            </Button>
          </OSTooltip>
        </Center>
      </ModalBody>
    </ModalContent>
  </Modal>
}

