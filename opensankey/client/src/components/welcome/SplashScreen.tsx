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
  ModalOverlay,
  Center
} from '@chakra-ui/react'
import { Type_GenericApplicationData } from '../../types/Types';
import { useTour } from '@reactour/tour'

export type FCType_SplashScreen = {
  new_data: Type_GenericApplicationData
  show_splashscreen: boolean
}

export const SplashScreen: FunctionComponent<FCType_SplashScreen> = ({ 
  new_data,
  show_splashscreen,
}:FCType_SplashScreen) => {
  /* eslint-disable */
  let video_accueil = require('../../media/catch_phrase_OpenSankey.webm')
  const path = window.location.origin
  if (!path.includes('localhost')) {
    video_accueil = video_accueil.replace('static/', new_data.static_path)
  }
  /* eslint-enable */

  // Introduction to application
  return <Modal
    variant='modal_welcome'
    isOpen={show_splashscreen}
    onClose={() => null}
  >
    <ModalContent
      maxWidth='inherit'
    >
      <ModalBody>
        <video
          style={{
            'display': 'grid',
            'width': '60vw',
            'height': '60vh'
          }}
          id="Catch phrase OpenSankey"
          autoPlay
          muted
          playsInline
          loop
        >
          <source src={video_accueil} type="video/webm" />
          Your browser does not support the video tag.
        </video>
      </ModalBody>
    </ModalContent>
  </Modal>
}

type FCType_ModalDocumentation = {
  show_documentation: boolean
  set_show_documentation:(_:boolean)=>void
}

/**
 * Modal containing documentation
 *
 * @param {*} { new_data, additionalMenu, Reinitialization }
 * @return {*}
 */
export const ModalDocumentation: FunctionComponent<FCType_ModalDocumentation> = (
  { show_documentation,set_show_documentation } : FCType_ModalDocumentation
) => {
  const { setIsOpen } = useTour()
  return <Modal
    isOpen={show_documentation}
    onClose={() => set_show_documentation(false)}
    scrollBehavior='inside'
    variant='modal_documentation'
    size={'full'}
  >
    <ModalOverlay />
    <ModalContent>
      <ModalBody marginLeft='40vw' >
      <Center>
        <Box layerStyle='menuconfigpanel_row_2cols' >
    <Button style={{opacity:1}}
      onClick={() => set_show_documentation(false)}
    >
      {'Démarrer de Scratch'}
    </Button>
    <Button
      onClick={() => set_show_documentation(false)}
    >
      {'Utiliser un Modéle'}
    </Button>
    <Button
      onClick={() => { set_show_documentation(false);setIsOpen(true)}}
    >
      {'Tour de l\'application'}
    </Button></Box></Center>
    </ModalBody>
    </ModalContent>
  </Modal>
}

