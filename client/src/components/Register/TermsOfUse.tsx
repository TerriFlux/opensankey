import React, { FunctionComponent, useEffect, useState } from 'react'
import i18next from 'i18next'
import { useTranslation } from 'react-i18next'

import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Heading,
} from '@chakra-ui/react'

/**
 * Register : Modal for terms of use
 *
 * @param {*} {
 *   isOpen,
 *   onClose,
 *   setOk
 * }
 * @return {*}
 */
const TermsOfUse: FunctionComponent<{
  isOpen: boolean,
  onClose: () => void,
  setOk: (value: boolean) => void
}> = ({
  isOpen,
  onClose,
  setOk
}) => {

  // Initialise traduction function
  const { t } = useTranslation()

  const [htmlContent, setHtmlContent] = useState('')

  useEffect(() => {
    // Fetch the HTML content from the public directory
    const path = window.location.origin + '/terms_of_uses_' + i18next.language + '.html'
    fetch(path, {
      method: 'GET'
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const text = response.text()
      return text
    })
      .then((html) => {
        setHtmlContent(html)
      })
      .catch(error => {
        console.error('Error in TermsOfUse - ' + error.toString())
      })
  }, [])

  return (
    <div>
      <Modal
        variant='modal_welcome'
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent
          maxWidth='80vw'
          bg='white'
        >
          <ModalHeader >
            <Heading variant='heading_welcome_style' >
              {t('terms_of_uses.title')}
            </Heading>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Box
              padding='1rem'
            >
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </Box>
          </ModalBody>

          <ModalFooter>
            <Button
              variant='menuconfigpanel_option_button'
              onClick={() => {
                setOk(true)
                onClose()
              }}
            >
              {t('terms_of_uses.accept')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

export default TermsOfUse
