// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

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
    color: 'primaire.5',
    bg: 'white',
    bgColor: 'white',
    '.chakra-collapse': {
      overflow: 'visible !important',
    },
  },
  container: {
    margin: '0',
    padding: '0',
    color: 'primaire.5',
    bg: 'white',
    bgColor: 'white',
    width: '100%',
    border: '0',
    borderRadius: '0'
  },
  button: {
    margin: '0',
    padding: '1rem 1.25rem',
    color: 'primaire.5',
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
      color: 'white',
      bg: 'primaire.5',
      bgColor: 'primaire.5',
      border: '1px',
      borderColor: 'primaire.5',
    }
  },
  panel: {
    margin: '0',
    padding: '0.5rem 1.5rem',
    color: 'primaire.5',
    bg: 'white',
    bgColor: 'white',
    border: '0',
    borderRadius: '0'
  },
  icon: {
    width: '2em',
    height: '1em',
    border: '1px solid',
    borderColor: 'primaire.5',
    background: 'primaire.5',
    borderRadius: 'full',
    color: 'white',
    _active: {
      borderColor: 'white',
      background: 'white',
      color: 'primaire.5'
    }
  }
})



