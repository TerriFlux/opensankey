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

import { defineStyle } from '@chakra-ui/react'


export const badge_base_style = defineStyle({
  display: 'inline',
  padding: '0',
  height: '0.75rem',
  width: '1.75rem',
  color: 'white',
  bgColor: 'primaire.3',
  bb: 'primaire.3',
  border: '0px',
  borderRadius: '3px',
  fontSize: '0.5rem'
})

export const badge_on_template_img = defineStyle({
  display: 'inline-grid',
  justifyContent: 'center',
  alignContent: 'center',
  position: 'absolute',
  width: 'fit-content',
  height: 'fit-content',
  margin: '0.5rem',
  padding: '0.5rem',
  textStyle: 'h3',
  bgColor: 'primaire.2',
  bb: 'primaire.2',
})