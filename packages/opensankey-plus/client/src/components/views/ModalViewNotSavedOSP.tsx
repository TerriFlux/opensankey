// Standard libs
import React, { FC, useState } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react'

// OpenSankey Libs
import { BaseComponentPropsPlus } from './viewsShared'

/**
 * Modal to ask user if he want to save unsaved view change before switching view
 *
 * @param {*} {app_data}
 * @return {*}
 */
export const ModalViewNotSavedOSP: FC<BaseComponentPropsPlus> = (
  { app_data }
) => {

  const { t } = app_data
  const [show_modal, setShowModal] = useState(false)
  app_data.menu_configuration_osp.dict_setter_show_dialog_plus.ref_setter_show_menu_view_not_saved.current = setShowModal

  return (
    <Modal
      isCentered
      isOpen={show_modal}
      onClose={() => null}
      variant='modal_dialog'
    >
      <ModalOverlay />
      <ModalContent
        maxWidth='inherit'
      >
        <ModalHeader>
          {t('view.ns')}
        </ModalHeader>
        <ModalBody
          textStyle='h4'
        >
          {t('view.warn_ns')}
          <Box fontSize='sm' color='gray.500' mt='0.5rem'>
            {t('view.never_ask_hint')}
          </Box>
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button
              variant='menuconfigpanel_del_button'
              onClick={() => {
                // Discard this view's changes AND remember the choice for the
                // session: subsequent view switches discard silently (no modal),
                // until the cache cloud icon re-enables this dialog.
                app_data.menu_configuration.ref_to_never_save_view_session.current(true)
                app_data.resetViewWithOriginal()
                setShowModal(false)
              }}
            >
              {t('view.never_ask')}
            </Button>
            <Button
              variant='menuconfigpanel_del_button'
              onClick={() => {
                app_data.resetViewWithOriginal()
                setShowModal(false)
              }}
            >
              {t('view.dont_save')}
            </Button>
            <Button
              variant='menuconfigpanel_add_button'
              onClick={() => {
                app_data.saveBeforeChangingView()
                setShowModal(false)
              }}
            >
              {t('view.save')}
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>)
}
