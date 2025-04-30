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
    WebkitUserSelect: 'none',  /* Chrome all / Safari all */
    MozUserSelect: 'none',     /* Firefox all */
    msUserSelect: 'none',      /* IE 10+ */
    userSelect: 'none',
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