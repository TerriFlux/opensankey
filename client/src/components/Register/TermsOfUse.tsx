import React,{ FunctionComponent, useEffect, useRef } from 'react'
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
} from '@chakra-ui/react'

// Register : Modal for terms of use
export type TermsOfUseType = {
  isOpen: boolean,
  onClose: () => void,
  setOk: (value: boolean) => void
}

const TermsOfUse:FunctionComponent<TermsOfUseType>=({
  isOpen,
  onClose,
  setOk
})=>{

  // Initialise traduction function
  const {t} = useTranslation()

  const htmlContent = useRef('')

  useEffect(() => {
    // Fetch the HTML content from the public directory
    const path = window.location.origin+'/'+t('text', {ns: 'terms_of_uses'})
    fetch(path, {
      method:'GET'
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const text = response.text()
      return text
    })
      .then((html) => {
        htmlContent.current = html
      })
      .catch((error) => {
        console.error('Error fetching HTML content:', error)
      })
  }, [])

  return(
    <div>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay/>
        <ModalContent
          maxWidth='80vw'
          bg='white'
        >
          <ModalHeader>
            {t('title', {ns: 'terms_of_uses'})}
          </ModalHeader>
          <ModalCloseButton/>

          <ModalBody>
            <Box>
              <div dangerouslySetInnerHTML={{__html: htmlContent.current}}/>
            </Box>
          </ModalBody>

          <ModalFooter>
            <Button
              variant='menuconfigpanel_option_button'
              onClick={ () => {
                setOk(true)
                onClose()
              }}
            >
              {t('accept', {ns: 'terms_of_uses'})}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

export default TermsOfUse
