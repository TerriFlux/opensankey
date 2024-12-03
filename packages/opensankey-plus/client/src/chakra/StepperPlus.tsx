import { stepperAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'


const { definePartsStyle } =
  createMultiStyleConfigHelpers(stepperAnatomy.keys)

export const baseStyleStepper = {
  // select the indicator part
}

export const sequenceStepper = definePartsStyle({
  stepper:{
    gap:'0.5rem'
  },
  step: {
    '-webkit-user-select': 'none',  /* Chrome all / Safari all */
    '-moz-user-select': 'none',     /* Firefox all */
    '-ms-user-select': 'none',      /* IE 10+ */
    'user-select': 'none',
  },
  separator: {
    margin: '0'
  },

  indicator: {
  },
  title:{
    fontSize:'0.8rem'
  }
})