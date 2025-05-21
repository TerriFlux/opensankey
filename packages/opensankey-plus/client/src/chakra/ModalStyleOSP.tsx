import { modalAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
  createMultiStyleConfigHelpers(modalAnatomy.keys)

export const modal_reconciliation = definePartsStyle({
  header: {
    height: 'fit-content',
    textStyle: 'h1',
    color: 'white',
    background: 'primaire.2',
    borderRadius: '6px',
    paddingRight: '5rem'
  },
  closeButton: {
    right: '1rem',
    top: '1rem'
  },
  dialog: {
    width: '45vw',
    maxHeight: '75vh',
    height: 'unset',
    display: 'grid',
    gridGap: '1rem',
    padding: '0.25rem',
    gridTemplateRows: '3rem auto'
  },
  body: {
    display: 'block',
    width: '100%',
    height: 'unset',
    padding: '0.25rem',
  }
})
