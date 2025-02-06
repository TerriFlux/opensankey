import { modalAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
  createMultiStyleConfigHelpers(modalAnatomy.keys)

export const modal_base_style = definePartsStyle({
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
    width: '75vw',
    height: '75vh',
    display: 'grid',
    gridGap: '1rem',
    padding: '0.25rem',
    gridTemplateRows: '3rem auto'
  },
  body: {
    display: 'block',
    width: '100%',
    height: 'calc(75vh - 5rem)',
    padding: '0.25rem',
  }
})

export const modal_dialog = definePartsStyle({
  dialog:{
    width: 'fit-content',
    height: 'fit-content',
  },
  body:{
    width: 'fit-content',
    height: 'fit-content',
    margin: '1rem'
  },
  header: {
    width: '100%'
  },
  footer: {
    justifyContent: 'center',
  }
})

export const modal_welcome = definePartsStyle({
  closeButton: {
    right: '0.65rem',
    top: '0.65rem'
  },
  footer: {
    height: '3rem',
  }
})

export const modal_documentation = definePartsStyle({
  overlay: {
    opacity: 0.3
  },
  // dialogContainer: {
  //   background: 'blackAlpha.500'
  // },
  dialog:{
    width:'max-content',
    height:'max-content',
    alignSelf: 'center',
  },
  body: {
    width:'max-content',
    height:'max-content',
    minWidth: 0,
  },
  footer: {
    height: 'fit-content',
    padding: '0'
  }
})

export const modal_select_unit_from_data = definePartsStyle({
  body :{
    '.rd3t-tree-container':{
      height:'80vh'
    }
  }
})
export const modal_select_unit_from_excel = definePartsStyle({
  body :{
    '.rd3t-tree-container':{
      height:'50vh'
    }
  }
})