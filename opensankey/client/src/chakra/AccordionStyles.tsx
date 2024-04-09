import { accordionAnatomy } from '@chakra-ui/anatomy'
import {
  createMultiStyleConfigHelpers
} from '@chakra-ui/react'

const { definePartsStyle } = createMultiStyleConfigHelpers(accordionAnatomy.keys)

// The styles that all accordion have in common
export const accordion_base_style = definePartsStyle({
  root: {
    margin: '0',
    padding: '0',
    color: 'gray.500',
    bg: 'white',
    bgColor: 'white',
    '.chakra-collapse': {
      overflow: 'visible !important',
    },
  },
  container: {
    margin: '0',
    padding: '0',
    color: 'gray.500',
    bg: 'white',
    bgColor: 'white',
    width: '100%',
    border: '0',
    borderRadius: '0'
  },
  button: {
    margin: '0',
    padding: '1rem 1.25rem',
    color: 'gray.500',
    bg: 'white',
    bgColor: 'white',
    border: '0',
    borderRadius: '0',
    boxShadow: 'inset 0 -1px 0 rgba(0,0,0,.125)',
    width: '100%',
    height: '3.5rem',
    flex: '1',
    textAlign: 'left',
    textStyle: 'h2',

    _expanded: {
      color: 'openSankey.200',
      bg: 'openSankey.100',
      bgColor: 'openSankey.100',
      border: '1px',
      borderColor: 'openSankey.100',
    }
  },
  panel: {
    margin: '0',
    padding: '0.5rem 1.5rem',
    color: 'gray.500',
    bg: 'white',
    bgColor: 'white',
    border: '0',
    borderRadius: '0'
  },
  icon: {
    width: '2em',
    height: '1em',
    border: '1px solid',
    borderColor: 'openSankey.100',
    background: 'openSankey.100',
    borderRadius: 'full',
    color: 'gray.500',
    _active: {
      borderColor: 'white',
      background: 'white',
      color: 'opensankey.200'
    }
  }
})

// Variant for sublevel accordion
export const accordion_sublevel_style = definePartsStyle({
  root: {
    margin: '-0.5rem -1.5rem'
  },
  button: {
    height: '3rem',
    paddingLeft: '25px'
  }
})

