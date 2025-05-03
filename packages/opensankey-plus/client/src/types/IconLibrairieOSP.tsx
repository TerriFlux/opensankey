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


import { faCopy, faDeleteLeft, faIcons, faListCheck, faRepeat } from '@fortawesome/free-solid-svg-icons'
import { Class_IconLibrary } from '../deps/OpenSankey/types/IconLibrairie'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { FaCaretSquareLeft, FaCaretSquareRight, FaFileImport, FaFilter, FaPalette, FaPause, FaPlay, FaRandom } from 'react-icons/fa'

// Hand made icon ===========================================================================
const logo_object = <svg
  width={26}
  height={22}
  viewBox="0 0 7.0103601 5.9491523"
  version="1.1"
  xmlns="http://www.w3.org/2000/svg"
>
  <g transform="translate(-542.76899,-305.59555)">
    <g transform="translate(26.240445,13.093667)">
      <g transform="translate(-0.04132755,-11.571715)">
        <g transform="translate(-185.96608,-222.38162)">
          <g transform="translate(0.23832951,0.0476659)" style={{ strokeWidth: 0.264583, }}>
            <g transform="matrix(0.18145656,0,0,0.18145656,702.11621,526.22609)" style={{ strokeWidth: 1.45811, strokeOpacity: 1 }}>
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M 23,4 C 23,2.34315 21.6569,1 20,1 H 4 C 2.34315,1 1,2.34315 1,4 v 16 c 0,1.6569 1.34315,3 3,3 h 16 c 1.6569,0 3,-1.3431 3,-3 z M 21,4 C 21,3.44772 20.5523,3 20,3 H 4 C 3.44772,3 3,3.44772 3,4 v 16 c 0,0.5523 0.44772,1 1,1 h 16 c 0.5523,0 1,-0.4477 1,-1 z"
                fill="#668ea5"
                style={{ fillOpacity: 1, strokeWidth: 1.45811, strokeOpacity: 1 }}
              />
              <path
                d="M 4.80665,17.5211 9.1221,9.60947 c 0.37902,-0.69486 1.3768,-0.69486 1.7558,0 l 3.1686,5.80913 1.0853,-1.8992 c 0.3839,-0.6718 1.3525,-0.6718 1.7364,0 l 2.2769,3.9845 C 19.526,18.1705 19.0446,19 18.2768,19 H 5.68454 C 4.92548,19 4.44317,18.1875 4.80665,17.5211 Z"
                fill="#668ea5"
                style={{ fillOpacity: 1, strokeWidth: 1.45811, strokeOpacity: 1 }}
              />
              <path
                d="m 18,8 c 0,1.10457 -0.8954,2 -2,2 -1.1046,0 -2,-0.89543 -2,-2 0,-1.10457 0.8954,-2 2,-2 1.1046,0 2,0.89543 2,2 z"
                fill="#668ea5"
                style={{ fillOpacity: 1, strokeWidth: 1.45811, strokeOpacity: 1 }}
              />
            </g>
            <g transform="matrix(0.21497396,0,0,0.21497396,704.87625,527.92495)" style={{ strokeWidth: 1.23077, strokeDasharray: 'none' }}>
              <path
                strokeLinejoin="round"
                strokeLinecap="round"
                style={{
                  // fill:'#fefeff',
                  fillOpacity: 1,
                  // stroke:'#668ea5',
                  strokeWidth: 1.23077,
                  strokeOpacity: 1
                }}
                d='m 8,8 h 8 m 0,4 H 8 m 0,4 h 4 m -6,4 h 12 c 1.1046,0 2,-0.8954 2,-2 V 6 C 20,4.89543 19.1046,4 18,4 H 6 C 4.89543,4 4,4.89543 4,6 v 12 c 0,1.1046 0.89543,2 2,2 z'
              />
            </g>
          </g>
        </g>
      </g>
    </g>
  </g>
</svg>

const logo_view = <svg
  width={42}
  height={30}
  viewBox="0 0 8 6"
  version="1.1"
  xmlns="http://www.w3.org/2000/svg"
>
  <g
    style={{ display: 'inline' }}
  >
    <g
      transform="translate(-700.66813,-574.86483)"
    >
      <g
        style={{
          display: 'inline',
          strokeWidth: 1.33823
        }}
        transform="matrix(0.5603662,0,0,0.55836486,308.60551,254.37987)"
      >
        <rect
          style={{
            display: 'inline',
            opacity: 1,
            fill: '#ffffff',
            stroke: '#668ea5',
            strokeWidth: 0.354072,
          }}
          width="9.3688116"
          height="6.7537355"
          x="699.83136"
          y="574.14752"
          ry="2.0979242"
          rx="2.1826503" />
        <g
          transform="translate(-0.27263404,0.02870138)"
          style={{ strokeWidth: 1.33823 }}
        >
          <g
            style={{ strokeWidth: 1.33823 }}
            transform="translate(0,0.00847228)"
          >
            <g
              transform="translate(-0.0021209,-0.02411112)"
              style={{ strokeWidth: 1.33823 }}
            >
              <path
                style={{
                  display: 'inline',
                  fill: 'none',
                  fillOpacity: 1,
                  stroke: '#668ea5',
                  strokeWidth: 0.88518,
                  strokeMiterlimit: 4,

                  strokeDashoffset: 0,
                  strokeOpacity: 1
                }}
                d="m 705.32968,577.69382 c 0.80084,0.004 1.06083,-2e-5 1.38478,0.9278 0.21316,0.69107 0.49708,1.06651 1.39956,1.0518"
              />
              <path
                style={{
                  display: 'inline',
                  fill: 'none',
                  fillOpacity: 1,
                  stroke: '#668ea5',
                  strokeWidth: 0.531108,
                  strokeMiterlimit: 4,
                  strokeDashoffset: 0,
                  strokeOpacity: 1
                }}
                d="m 707.6205,576.12234 c -0.88183,0.007 -1.01211,-0.0731 -1.25954,0.46023 -0.21723,0.53034 -0.2587,0.58086 -0.99086,0.58423"
              />
            </g>
            <rect
              style={{
                display: 'inline',
                fill: '#ffffff',
                fillOpacity: 1,
                stroke: '#668ea5',
                strokeWidth: 0.35407,
                strokeMiterlimit: 4,
                strokeDashoffset: 0,
                strokeOpacity: 1
              }}
              width="0.87918907"
              height="0.87932533"
              x="-705.33875"
              y="577.05316"
              transform="scale(-1,1)" />
          </g>
          <g
            transform="translate(-0.00182644,-0.00913219)"
            style={{ strokeWidth: 1.33823 }}
          >
            <path
              style={{
                display: 'inline',
                fill: 'none',
                fillOpacity: 1,
                stroke: '#668ea5',
                strokeWidth: 1.06222,
                strokeMiterlimit: 4,

                strokeDashoffset: 0,
                strokeOpacity: 1
              }}
              d="m 701.47954,575.35168 c 0.83284,-0.0309 1.11039,-2e-5 1.44947,0.97116 0.22312,0.72337 0.52031,1.09444 1.46495,1.10096"
            />
            <path
              style={{
                display: 'inline',
                fill: 'none',
                fillOpacity: 1,
                stroke: '#668ea5',
                strokeWidth: 0.354072,
                strokeMiterlimit: 4,

                strokeDashoffset: 0,
                strokeOpacity: 1
              }}
              d="m 704.3418,577.95185 c -0.61149,0.002 -0.82666,-2e-5 -1.0791,0.72252 -0.1661,0.53816 -0.38735,0.83053 -1.09061,0.81907"
            />
          </g>
        </g>
      </g>
      <g
        transform="matrix(0.56036619,0,0,0.55836486,311.30604,256.35874)"
      >
        <rect
          style={{
            display: 'inline',
            opacity: 1,
            fill: '#ffffff',
            fillOpacity: 1,
            stroke: '#668ea5',
            strokeWidth: 0.354072,
          }}
          width="9.3688116"
          height="6.7537355"
          x="699.83136"
          y="574.14752"
          ry="2.097924"
          rx="2.1826503" />
        <g
          transform="translate(-0.2725993,0.02867509)"
          style={{ strokeWidth: 1.33823 }}
        >
          <g
            style={{ strokeWidth: 1.33823 }}
            transform="translate(0,0.00847228)"
          >
            <g
              transform="translate(-0.0021209,-0.02411112)"
              style={{ strokeWidth: 1.33823 }}
            >
              <path
                style={{
                  display: 'inline',
                  fill: 'none',
                  fillOpacity: 1,
                  stroke: '#668ea5',
                  strokeWidth: 0.88518,
                  strokeMiterlimit: 4,

                  strokeDashoffset: 0,
                  strokeOpacity: 1
                }}
                d="m 705.32968,577.69382 c 0.80084,0.004 1.06083,-2e-5 1.38478,0.9278 0.21316,0.69107 0.49708,1.06651 1.39956,1.0518"
              />
              <path
                style={{
                  display: 'inline',
                  fill: 'none',
                  fillOpacity: 1,
                  stroke: '#668ea5',
                  strokeWidth: 0.531108,
                  strokeMiterlimit: 4,

                  strokeDashoffset: 0,
                  strokeOpacity: 1
                }}
                d="m 707.6205,576.12234 c -0.88183,0.007 -1.01211,-0.0731 -1.25954,0.46023 -0.21723,0.53034 -0.2587,0.58086 -0.99086,0.58423"
              />
            </g>
            <rect
              style={{
                display: 'inline',
                fill: '#ffffff',
                fillOpacity: 1,
                stroke: '#668ea5',
                strokeWidth: 0.35407,
                strokeMiterlimit: 4,

                strokeDashoffset: 0,
                strokeOpacity: 1
              }}
              width="0.87918907"
              height="0.87932533"
              x="-705.33875"
              y="577.05316"
              transform="scale(-1,1)" />
          </g>
          <g
            transform="translate(-0.00182644,-0.00913219)"
            style={{ strokeWidth: 1.33823 }}
          >
            <path
              style={{
                display: 'inline',
                fill: 'none',
                fillOpacity: 1,
                stroke: '#668ea5',
                strokeWidth: 1.06222,
                strokeMiterlimit: 4,

                strokeDashoffset: 0,
                strokeOpacity: 1
              }}
              d="m 701.47954,575.35168 c 0.83284,-0.0309 1.11039,-2e-5 1.44947,0.97116 0.22312,0.72337 0.52031,1.09444 1.46495,1.10096"
            />
            <path
              style={{
                display: 'inline',
                fill: 'none',
                fillOpacity: 1,
                stroke: '#668ea5',
                strokeWidth: 0.354072,
                strokeMiterlimit: 4,

                strokeDashoffset: 0,
                strokeOpacity: 1
              }}
              d="m 704.3418,577.95185 c -0.61149,0.002 -0.82666,-2e-5 -1.0791,0.72252 -0.1661,0.53816 -0.38735,0.83053 -1.09061,0.81907"
            />
          </g>
        </g>
      </g>
    </g>
  </g>
</svg>


// Logo data tags ===================================
export const logo_data_tag_disabled = <svg
  width="32.49"
  height="22.51"
  viewBox="0 0 8.5972141 5.956064"
  xmlns="http://www.w3.org/2000/svg"
>
  <g transform="translate(-190.57036,-293.66663)">
    <g transform="translate(-363.46259,-185.77275)">
      <g transform="translate(-17.385133,14.462576)">
        <g transform="translate(-129.0212,-98.109567)">
          <g
            transform="matrix(0.41594363,0,0,0.55738269,499.40687,461.31282)"
            style={{ strokeWidth: 0.549502 }}
          >
            <rect
              width="13.145483"
              height="6.3073921"
              x="484.38855"
              y="182.86662" />
            <path d="m 488.82587,182.91184 v 6.37512" />
            <path d="m 484.47899,184.49997 h 13.02313" />
            <path d="m 484.35308,187.60234 h 13.17819 m -13.17819,-1.56639 h 13.17819" />
            <path d="m 492.99799,182.93433 v 6.33026" />
          </g>
          <path
            d="m 704.76122,565.43829 h 0.003 m 0.87433,-1.02574 h -0.68685 c -0.42555,0 -0.63833,0 -0.80087,0.0828 -0.14297,0.0728 -0.25923,0.18909 -0.33206,0.33206 -0.0828,0.16254 -0.0828,0.37532 -0.0828,0.80087 v 0.68685 c 0,0.18584 0,0.27877 0.021,0.36623 0.0186,0.0775 0.0493,0.15164 0.091,0.21964 0.047,0.0767 0.1127,0.14237 0.2441,0.2738 l 1.19043,1.19043 c 0.3009,0.3009 0.45138,0.45137 0.62486,0.50773 0.15263,0.0496 0.317,0.0496 0.46964,0 0.17346,-0.0564 0.32395,-0.20683 0.62485,-0.50773 l 0.68685,-0.68685 c 0.3009,-0.3009 0.45137,-0.45138 0.50773,-0.62485 0.0496,-0.15263 0.0496,-0.31701 0,-0.46964 -0.0564,-0.17347 -0.20683,-0.32395 -0.50773,-0.62485 l -1.19043,-1.19043 c -0.13143,-0.13141 -0.19713,-0.19712 -0.2738,-0.24411 -0.068,-0.0417 -0.14211,-0.0724 -0.21964,-0.091 -0.0875,-0.021 -0.18039,-0.021 -0.36623,-0.021 z"

            strokeWidth={0.264584}
            fill="#e7e7e7" />
        </g>
        <path
          d="m 571.68259,470.66621 8.06821,-5.05863"

          strokeWidth={0.529} />
      </g>
    </g>
  </g>
</svg>
// const logo_data_tag_selected = <svg
//   width={24}
//   height={24}
//   viewBox="0 0 7.5949982 5.956064"
//   version="1.1"
//   xmlns="http://www.w3.org/2000/svg"
// >
//   <g transform="translate(-222.16536,-293.33442)">
//     <g transform="translate(-363.46259,-185.77275)">
//       <g transform="translate(-112.84726,-98.030776)">
//         <g transform="translate(-2.2918162,14.506031)">
//           <g transform="translate(-0.0038836,-0.45446)" style={{ strokeOpacity: 1 }}>
//             <g
//               transform="matrix(0.41594363,0,0,0.55738269,499.40687,461.31282)"
//               style={{ strokeWidth: 0.549502, strokeOpacity: 1 }}
//             >
//               <rect
//                 width="13.145483"
//                 height="6.3073921"
//                 x="484.38855"
//                 y="182.86662"
//                 style={{ strokeWidth: 0.549502, strokeLinejoin: 'round', strokeOpacity: 1 }} />
//               <path d="m 488.82587,182.91184 v 6.37512" style={{ strokeWidth: 0.549502, strokeLinejoin: 'round', strokeOpacity: 1 }} />
//               <path d="m 484.47899,184.49997 h 13.02313" style={{ strokeWidth: 0.549502, strokeLinejoin: 'round', strokeOpacity: 1 }} />
//               <path d="m 484.35308,187.60234 h 13.17819 m -13.17819,-1.56639 h 13.17819" style={{ strokeWidth: 0.549502, strokeLinejoin: 'round', strokeOpacity: 1 }} />
//               <path d="m 492.99799,182.93433 v 6.33026" style={{ strokeWidth: 0.549502, strokeLinejoin: 'round', strokeOpacity: 1 }} />
//             </g>
//             <path
//               d="m 704.76122,565.43829 h 0.003 m 0.87433,-1.02574 h -0.68685 c -0.42555,0 -0.63833,0 -0.80087,0.0828 -0.14297,0.0728 -0.25923,0.18909 -0.33206,0.33206 -0.0828,0.16254 -0.0828,0.37532 -0.0828,0.80087 v 0.68685 c 0,0.18584 0,0.27877 0.021,0.36623 0.0186,0.0775 0.0493,0.15164 0.091,0.21964 0.047,0.0767 0.1127,0.14237 0.2441,0.2738 l 1.19043,1.19043 c 0.3009,0.3009 0.45138,0.45137 0.62486,0.50773 0.15263,0.0496 0.317,0.0496 0.46964,0 0.17346,-0.0564 0.32395,-0.20683 0.62485,-0.50773 l 0.68685,-0.68685 c 0.3009,-0.3009 0.45137,-0.45138 0.50773,-0.62485 0.0496,-0.15263 0.0496,-0.31701 0,-0.46964 -0.0564,-0.17347 -0.20683,-0.32395 -0.50773,-0.62485 l -1.19043,-1.19043 c -0.13143,-0.13141 -0.19713,-0.19712 -0.2738,-0.24411 -0.068,-0.0417 -0.14211,-0.0724 -0.21964,-0.091 -0.0875,-0.021 -0.18039,-0.021 -0.36623,-0.021 z m -0.75022,1.02574 c 0,0.0699 -0.0567,0.12664 -0.12664,0.12664 -0.0699,0 -0.12664,-0.0567 -0.12664,-0.12664 0,-0.0699 0.0567,-0.12664 0.12664,-0.12664 0.0699,0 0.12664,0.0567 0.12664,0.12664 z"

//               strokeWidth={25.3403}
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               style={{ fill: '#78a7c2', strokeWidth: 0.264584, strokeOpacity: 1 }} />
//           </g>
//         </g>
//       </g>
//     </g>
//   </g>
// </svg>
export const logo_data_tag_unselected = <svg
  width={24}
  height={24}
  viewBox="0 0 7.5949982 5.9560963"
  version="1.1"
  xmlns="http://www.w3.org/2000/svg"
>
  <g transform="translate(-205.96782,-293.7237)">
    <g transform="translate(-363.46259,-185.77275)">
      <g transform="translate(-129.04874,-98.029683)">
        <g transform="translate(-2.2917662,14.439781)">
          <g transform="matrix(0.41594363,0,0,0.55738269,499.40687,461.31282)" style={{ strokeWidth: 0.549502 }}>
            <rect
              width="13.145483"
              height="6.3073921"
              x="484.38855"
              y="182.86662"
              ry="0"
              style={{ strokeWidth: 0.549502 }} />
            <path d="m 488.82587,182.91184 v 6.37512" style={{ strokeWidth: 0.549502 }} />
            <path d="m 484.47899,184.49997 h 13.02313" style={{ strokeWidth: 0.549502 }} />
            <path d="m 484.35308,187.60234 h 13.17819 m -13.17819,-1.56639 h 13.17819" style={{ strokeWidth: 0.549502 }} />
            <path d="m 492.99799,182.93433 v 6.33026" style={{ strokeWidth: 0.549502 }} />
          </g>
          <path
            d="m 704.76122,565.43829 h 0.003 m 0.87433,-1.02574 h -0.68685 c -0.42555,0 -0.63833,0 -0.80087,0.0828 -0.14297,0.0728 -0.25923,0.18909 -0.33206,0.33206 -0.0828,0.16254 -0.0828,0.37532 -0.0828,0.80087 v 0.68685 c 0,0.18584 0,0.27877 0.021,0.36623 0.0186,0.0775 0.0493,0.15164 0.091,0.21964 0.047,0.0767 0.1127,0.14237 0.2441,0.2738 l 1.19043,1.19043 c 0.3009,0.3009 0.45138,0.45137 0.62486,0.50773 0.15263,0.0496 0.317,0.0496 0.46964,0 0.17346,-0.0564 0.32395,-0.20683 0.62485,-0.50773 l 0.68685,-0.68685 c 0.3009,-0.3009 0.45137,-0.45138 0.50773,-0.62485 0.0496,-0.15263 0.0496,-0.31701 0,-0.46964 -0.0564,-0.17347 -0.20683,-0.32395 -0.50773,-0.62485 l -1.19043,-1.19043 c -0.13143,-0.13141 -0.19713,-0.19712 -0.2738,-0.24411 -0.068,-0.0417 -0.14211,-0.0724 -0.21964,-0.091 -0.0875,-0.021 -0.18039,-0.021 -0.36623,-0.021 z m -0.75022,1.02574 c 0,0.0699 -0.0567,0.12664 -0.12664,0.12664 -0.0699,0 -0.12664,-0.0567 -0.12664,-0.12664 0,-0.0699 0.0567,-0.12664 0.12664,-0.12664 0.0699,0 0.12664,0.0567 0.12664,0.12664 z"
            style={{ fill: '#ffffff', strokeWidth: 0.264584 }} />
        </g>
      </g>
    </g>
  </g>
</svg>
// Logo flow tags ===================================
export const logo_flow_tag_disabled = <svg
  width="32.493408"
  height="23.9823"
  viewBox="0 0 8.5972141 6.3453167"
  xmlns="http://www.w3.org/2000/svg"
>
  <g transform="translate(-317.52976,-305.90818)">
    <g transform="translate(-181.7427,13.093667)">
      <g transform="translate(-202.53298,-233.56328)">
        <g
          transform="matrix(-0.66195766,0,0,0.6331514,1171.6728,192.71625)"
          style={{ strokeWidth: 1.54466 }}
        >
          <path
            d="m 708.11902,532.55363 c -1.73184,0.0673 -2.30897,3e-5 -3.01406,-2.11523 -0.46396,-1.57552 -1.08192,-2.43146 -3.04622,-2.39794"
            style={{
              strokeWidth: 2.10845,
              strokeMiterlimit: 4,

              strokeDashoffset: 0,
              strokeOpacity: 1,
            }} />
          <path
            d="m 703.94158,531.55581 h -0.004 m -1.32053,-1.55021 h 1.03737 c 0.64273,0 0.9641,0 1.20958,0.12516 0.21594,0.1101 0.39151,0.28578 0.50153,0.50186 0.12509,0.24564 0.12509,0.56722 0.12509,1.21036 v 1.03804 c 0,0.28085 0,0.4213 -0.0317,0.55347 -0.0281,0.11717 -0.0745,0.22918 -0.13741,0.33196 -0.071,0.11587 -0.17021,0.21516 -0.36869,0.41379 l -1.79795,1.7991 c -0.45446,0.45475 -0.68173,0.68216 -0.94373,0.76733 -0.23052,0.0749 -0.47879,0.0749 -0.7093,0 -0.26201,-0.0852 -0.48927,-0.31258 -0.94373,-0.76733 l -1.03738,-1.03804 c -0.45446,-0.45476 -0.68172,-0.68217 -0.76684,-0.94434 -0.0749,-0.23067 -0.0749,-0.4791 0,-0.70976 0.0851,-0.26217 0.31238,-0.48959 0.76684,-0.94434 l 1.79794,-1.7991 c 0.1985,-0.19862 0.29774,-0.29792 0.41353,-0.36894 0.10271,-0.063 0.21464,-0.10936 0.33174,-0.13749 0.13209,-0.0317 0.27245,-0.0317 0.55312,-0.0317 z m 1.13308,1.55021 c 0,0.10571 0.0856,0.1914 0.19127,0.1914 0.10564,0 0.19127,-0.0857 0.19127,-0.1914 0,-0.1057 -0.0856,-0.19139 -0.19127,-0.19139 -0.10564,0 -0.19127,0.0857 -0.19127,0.19139 z"

            strokeWidth={25.3403}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              fill: '#e7e7e7',

              strokeWidth: 0.40869,

              strokeOpacity: 1,
            }} />
        </g>
        <path
          d="m 702.06994,532.37405 8.06821,-5.05863"
          style={{
            strokeWidth: 0.529,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',

            strokeOpacity: 1,
          }} />
      </g>
    </g>
  </g>
</svg>
// const logo_flow_tag_selected = <svg
//   width={24}
//   height={24}
//   viewBox="0 0 6.3988659 6.3453167"
//   version="1.1"
//   xmlns="http://www.w3.org/2000/svg"
//   xmlSpace="preserve"
// >
//   <g transform="translate(-351.60917,-305.66883)">
//     <g transform="translate(-181.7427,13.093667)">
//       <g transform="translate(-146.11629,-288.59521)">
//         <g transform="translate(-23.432746,54.792559)">
//           <g transform="matrix(-0.66195766,0,0,0.6331514,1171.6728,192.71625)" strokeWidth={1.54466}>
//             <path
//               d="m 708.11902,532.55363 c -1.73184,0.0673 -2.30897,3e-5 -3.01406,-2.11523 -0.46396,-1.57552 -1.08192,-2.43146 -3.04622,-2.39794"

//               strokeWidth={2.10845}
//               strokeMiterlimit={4}
//               strokeOpacity={1} />
//             <path
//               d="m 703.94158,531.55581 h -0.004 m -1.32053,-1.55021 h 1.03737 c 0.64273,0 0.9641,0 1.20958,0.12516 0.21594,0.1101 0.39151,0.28578 0.50153,0.50186 0.12509,0.24564 0.12509,0.56722 0.12509,1.21036 v 1.03804 c 0,0.28085 0,0.4213 -0.0317,0.55347 -0.0281,0.11717 -0.0745,0.22918 -0.13741,0.33196 -0.071,0.11587 -0.17021,0.21516 -0.36869,0.41379 l -1.79795,1.7991 c -0.45446,0.45475 -0.68173,0.68216 -0.94373,0.76733 -0.23052,0.0749 -0.47879,0.0749 -0.7093,0 -0.26201,-0.0852 -0.48927,-0.31258 -0.94373,-0.76733 l -1.03738,-1.03804 c -0.45446,-0.45476 -0.68172,-0.68217 -0.76684,-0.94434 -0.0749,-0.23067 -0.0749,-0.4791 0,-0.70976 0.0851,-0.26217 0.31238,-0.48959 0.76684,-0.94434 l 1.79794,-1.7991 c 0.1985,-0.19862 0.29774,-0.29792 0.41353,-0.36894 0.10271,-0.063 0.21464,-0.10936 0.33174,-0.13749 0.13209,-0.0317 0.27245,-0.0317 0.55312,-0.0317 z m 1.13308,1.55021 c 0,0.10571 0.0856,0.1914 0.19127,0.1914 0.10564,0 0.19127,-0.0857 0.19127,-0.1914 0,-0.1057 -0.0856,-0.19139 -0.19127,-0.19139 -0.10564,0 -0.19127,0.0857 -0.19127,0.19139 z"
//               strokeWidth={25.3403}
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               fill="#78a7c2"
//               fillOpacity={1}
//               strokeOpacity={1} />
//           </g>
//         </g>
//       </g>
//     </g>
//   </g>
// </svg>
export const logo_flow_tag_unselected = <svg
  width={24}
  height={24}
  viewBox="0 0 6.3988659 6.3452844"
  version="1.1"
  xmlns="http://www.w3.org/2000/svg"
>
  <g transform="translate(-334.93885,-306.15186)">
    <g transform="translate(-181.7427,13.093667)">
      <g transform="translate(-0.04132755,-11.571715)">
        <g transform="translate(-186.17802,-221.7479)">
          <g transform="matrix(-0.66195766,0,0,0.6331514,1171.6728,192.71625)" style={{ strokeWidth: 1.54466 }}>
            <path
              style={{ strokeWidth: 2.10845, strokeMiterlimit: 4, }}
              d="m 708.11902,532.55363 c -1.73184,0.0673 -2.30897,3e-5 -3.01406,-2.11523 -0.46396,-1.57552 -1.08192,-2.43146 -3.04622,-2.39794" />
            <path
              d="m 703.94158,531.55581 h -0.004 m -1.32053,-1.55021 h 1.03737 c 0.64273,0 0.9641,0 1.20958,0.12516 0.21594,0.1101 0.39151,0.28578 0.50153,0.50186 0.12509,0.24564 0.12509,0.56722 0.12509,1.21036 v 1.03804 c 0,0.28085 0,0.4213 -0.0317,0.55347 -0.0281,0.11717 -0.0745,0.22918 -0.13741,0.33196 -0.071,0.11587 -0.17021,0.21516 -0.36869,0.41379 l -1.79795,1.7991 c -0.45446,0.45475 -0.68173,0.68216 -0.94373,0.76733 -0.23052,0.0749 -0.47879,0.0749 -0.7093,0 -0.26201,-0.0852 -0.48927,-0.31258 -0.94373,-0.76733 l -1.03738,-1.03804 c -0.45446,-0.45476 -0.68172,-0.68217 -0.76684,-0.94434 -0.0749,-0.23067 -0.0749,-0.4791 0,-0.70976 0.0851,-0.26217 0.31238,-0.48959 0.76684,-0.94434 l 1.79794,-1.7991 c 0.1985,-0.19862 0.29774,-0.29792 0.41353,-0.36894 0.10271,-0.063 0.21464,-0.10936 0.33174,-0.13749 0.13209,-0.0317 0.27245,-0.0317 0.55312,-0.0317 z m 1.13308,1.55021 c 0,0.10571 0.0856,0.1914 0.19127,0.1914 0.10564,0 0.19127,-0.0857 0.19127,-0.1914 0,-0.1057 -0.0856,-0.19139 -0.19127,-0.19139 -0.10564,0 -0.19127,0.0857 -0.19127,0.19139 z"
              strokeWidth="25.3403"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ fill: '#ffffff', strokeWidth: 0.40869, }} />
          </g>
        </g>
      </g>
    </g>
  </g>
</svg>
// Logo node tags ===================================
export const logo_node_tag_disabled = <svg
  width={32}
  height={24}
  viewBox="0 0 8.5972141 6.6100616"
  version="1.1"
  xmlns="http://www.w3.org/2000/svg"
>
  <g transform="translate(-317.52161,-320.52485)">
    <g transform="translate(-181.7427,13.093667)">
      <g transform="translate(-202.49975,-218.68186)">
        <g transform="matrix(-0.66195766,0,0,0.6331514,1171.6728,192.71625)" style={{ strokeWidth: 1.54466 }}>
          <ellipse
            cx="704.47333"
            cy="528.63928"
            rx="1.8677084"
            ry="1.8677086"
            style={{ fill: '#e7e7e7', strokeWidth: 0.408689 }} />
          <rect
            width="3.2354169"
            height="3.2354169"
            x="705.05493"
            y="529.06427"
            style={{ fill: '#e7e7e7', strokeWidth: 0.408687 }} />
          <path
            d="m 703.94158,531.55581 h -0.004 m -1.32053,-1.55021 h 1.03737 c 0.64273,0 0.9641,0 1.20958,0.12516 0.21594,0.1101 0.39151,0.28578 0.50153,0.50186 0.12509,0.24564 0.12509,0.56722 0.12509,1.21036 v 1.03804 c 0,0.28085 0,0.4213 -0.0317,0.55347 -0.0281,0.11717 -0.0745,0.22918 -0.13741,0.33196 -0.071,0.11587 -0.17021,0.21516 -0.36869,0.41379 l -1.79795,1.7991 c -0.45446,0.45475 -0.68173,0.68216 -0.94373,0.76733 -0.23052,0.0749 -0.47879,0.0749 -0.7093,0 -0.26201,-0.0852 -0.48927,-0.31258 -0.94373,-0.76733 l -1.03738,-1.03804 c -0.45446,-0.45476 -0.68172,-0.68217 -0.76684,-0.94434 -0.0749,-0.23067 -0.0749,-0.4791 0,-0.70976 0.0851,-0.26217 0.31238,-0.48959 0.76684,-0.94434 l 1.79794,-1.7991 c 0.1985,-0.19862 0.29774,-0.29792 0.41353,-0.36894 0.10271,-0.063 0.21464,-0.10936 0.33174,-0.13749 0.13209,-0.0317 0.27245,-0.0317 0.55312,-0.0317 z m 1.13308,1.55021 c 0,0.10571 0.0856,0.1914 0.19127,0.1914 0.10564,0 0.19127,-0.0857 0.19127,-0.1914 0,-0.1057 -0.0856,-0.19139 -0.19127,-0.19139 -0.10564,0 -0.19127,0.0857 -0.19127,0.19139 z"
            strokeWidth="0.40869"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ fill: '#e7e7e7' }} />
        </g>
        <path
          d="m 702.02855,532.20726 8.06821,-5.05863"
          style={{ strokeWidth: 0.529, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
      </g>
    </g>
  </g>
</svg>
// const logo_node_tag_selected = <svg
//   width={25}
//   height={25}
//   viewBox="0 0 6.6204614 6.6100939"
//   version="1.1"
//   xmlns="http://www.w3.org/2000/svg"
// >
//   <g transform="translate(-351.38758,-319.92643)">
//     <g transform="translate(-181.7427,13.093667)">
//       <g transform="translate(-146.11629,-288.59521)">
//         <g transform="translate(-23.432746,69.314962)">
//           <g transform="matrix(-0.66195766,0,0,0.6331514,1171.6728,192.71625)" style={{ strokeWidth: 1.54466 }}>
//             <ellipse
//               style={{ fill: '#78a7c2', strokeWidth: 0.408689 }}
//               cx="704.47333"
//               cy="528.63928"
//               rx="1.8677084"
//               ry="1.8677086" />
//             <rect
//               style={{ fill: '#78a7c2', strokeWidth: 0.408687 }}
//               width="3.2354169"
//               height="3.2354169"
//               x="705.05493"
//               y="529.06427" />
//             <path
//               d="m 703.94158,531.55581 h -0.004 m -1.32053,-1.55021 h 1.03737 c 0.64273,0 0.9641,0 1.20958,0.12516 0.21594,0.1101 0.39151,0.28578 0.50153,0.50186 0.12509,0.24564 0.12509,0.56722 0.12509,1.21036 v 1.03804 c 0,0.28085 0,0.4213 -0.0317,0.55347 -0.0281,0.11717 -0.0745,0.22918 -0.13741,0.33196 -0.071,0.11587 -0.17021,0.21516 -0.36869,0.41379 l -1.79795,1.7991 c -0.45446,0.45475 -0.68173,0.68216 -0.94373,0.76733 -0.23052,0.0749 -0.47879,0.0749 -0.7093,0 -0.26201,-0.0852 -0.48927,-0.31258 -0.94373,-0.76733 l -1.03738,-1.03804 c -0.45446,-0.45476 -0.68172,-0.68217 -0.76684,-0.94434 -0.0749,-0.23067 -0.0749,-0.4791 0,-0.70976 0.0851,-0.26217 0.31238,-0.48959 0.76684,-0.94434 l 1.79794,-1.7991 c 0.1985,-0.19862 0.29774,-0.29792 0.41353,-0.36894 0.10271,-0.063 0.21464,-0.10936 0.33174,-0.13749 0.13209,-0.0317 0.27245,-0.0317 0.55312,-0.0317 z m 1.13308,1.55021 c 0,0.10571 0.0856,0.1914 0.19127,0.1914 0.10564,0 0.19127,-0.0857 0.19127,-0.1914 0,-0.1057 -0.0856,-0.19139 -0.19127,-0.19139 -0.10564,0 -0.19127,0.0857 -0.19127,0.19139 z"
//               style={{ fill: '#78a7c2', strokeWidth: 0.40869 }} />
//           </g>
//         </g>
//       </g>
//     </g>
//   </g>
// </svg>
export const logo_node_tag_unselected = <svg
  width={25}
  height={25}
  viewBox="0 0 6.6204614 6.6100939"
  version="1.1"
  xmlns="http://www.w3.org/2000/svg"
>
  <g transform="translate(-334.72528,-319.98954)">
    <g transform="translate(-181.7427,13.093667)">
      <g transform="translate(-0.04132755,-11.571715)">
        <g transform="translate(-186.17,-207.64542)">
          <g transform="matrix(-0.66195766,0,0,0.6331514,1171.6728,192.71625)" style={{ strokeWidth: 1.54466 }}>
            <ellipse
              cx="704.47333"
              cy="528.63928"
              rx="1.8677084"
              ry="1.8677086"
              style={{ fill: '#ffffff', strokeWidth: 0.408689 }} />
            <rect
              width="3.2354169"
              height="3.2354169"
              x="705.05493"
              y="529.06427"
              style={{ fill: '#ffffff', strokeWidth: 0.408687 }} />
            <path
              d="m 703.94158,531.55581 h -0.004 m -1.32053,-1.55021 h 1.03737 c 0.64273,0 0.9641,0 1.20958,0.12516 0.21594,0.1101 0.39151,0.28578 0.50153,0.50186 0.12509,0.24564 0.12509,0.56722 0.12509,1.21036 v 1.03804 c 0,0.28085 0,0.4213 -0.0317,0.55347 -0.0281,0.11717 -0.0745,0.22918 -0.13741,0.33196 -0.071,0.11587 -0.17021,0.21516 -0.36869,0.41379 l -1.79795,1.7991 c -0.45446,0.45475 -0.68173,0.68216 -0.94373,0.76733 -0.23052,0.0749 -0.47879,0.0749 -0.7093,0 -0.26201,-0.0852 -0.48927,-0.31258 -0.94373,-0.76733 l -1.03738,-1.03804 c -0.45446,-0.45476 -0.68172,-0.68217 -0.76684,-0.94434 -0.0749,-0.23067 -0.0749,-0.4791 0,-0.70976 0.0851,-0.26217 0.31238,-0.48959 0.76684,-0.94434 l 1.79794,-1.7991 c 0.1985,-0.19862 0.29774,-0.29792 0.41353,-0.36894 0.10271,-0.063 0.21464,-0.10936 0.33174,-0.13749 0.13209,-0.0317 0.27245,-0.0317 0.55312,-0.0317 z m 1.13308,1.55021 c 0,0.10571 0.0856,0.1914 0.19127,0.1914 0.10564,0 0.19127,-0.0857 0.19127,-0.1914 0,-0.1057 -0.0856,-0.19139 -0.19127,-0.19139 -0.10564,0 -0.19127,0.0857 -0.19127,0.19139 z"
              strokeWidth="25.3403"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ fill: '#ffffff', strokeWidth: 0.40869 }} />
          </g>
        </g>
      </g>
    </g>
  </g>
</svg>

// Class ===========================================================================

export class Class_IconLibraryOSP extends Class_IconLibrary {


  // Define icon ===================================

  protected _icon_open_modal_icon = <FontAwesomeIcon icon={faIcons} />
  protected _icon_import_file_image = <FaFileImport />

  protected _icon_previous = <FaCaretSquareLeft />
  protected _icon_next = <FaCaretSquareRight />

  protected _icon_attr_view = <FontAwesomeIcon icon={faListCheck} />
  protected _icon_copy = <FontAwesomeIcon icon={faCopy} />

  protected _icon_repeat_sequence = <FontAwesomeIcon icon={faRepeat} />

  protected _icon_delete = <FontAwesomeIcon icon={faDeleteLeft} />

  protected _icon_filter_tags = <FaFilter />

  protected _icon_palette_color = <FaPalette />
  protected _icon_random = <FaRandom />

  protected _icon_play = <FaPlay />
  protected _icon_pause = <FaPause />
  protected _icon_object = logo_object
  protected _icon_view = logo_view


  protected _icon_data_tag_diabled = logo_data_tag_disabled
  protected _icon_data_tag_unselected = logo_data_tag_unselected

  protected _icon_flow_tag_diabled = logo_flow_tag_disabled
  protected _icon_flow_tag = logo_flow_tag_unselected

  protected _icon_node_tag_diabled = logo_node_tag_disabled
  protected _icon_node_tag = logo_node_tag_unselected

  protected _icon_level_tag_diabled = logo_node_tag_disabled
  protected _icon_level_tag = logo_node_tag_unselected

  // Constructor ===================================
  constructor() {
    super()
  }

  // Getters ===================================
  public get icon_open_modal_icon() { return this._icon_open_modal_icon }
  public get icon_import_file_image() { return this._icon_import_file_image }
  public get icon_previous() { return this._icon_previous }
  public get icon_next() { return this._icon_next }
  public get icon_attr_view() { return this._icon_attr_view }
  public get icon_copy() { return this._icon_copy }
  public get icon_repeat_sequence() { return this._icon_repeat_sequence }
  public get icon_delete() { return this._icon_delete }
  public get icon_filter_tags() { return this._icon_filter_tags }
  public get icon_palette_color() { return this._icon_palette_color }
  public get icon_random() { return this._icon_random }
  public get icon_play() { return this._icon_play }
  public get icon_pause() { return this._icon_pause }
  public get icon_object() { return this._icon_object }
  public get icon_view() { return this._icon_view }
  public get icon_data_tag_diabled() { return this._icon_data_tag_diabled }
  public get icon_data_tag_unselected() { return this._icon_data_tag_unselected }
  public get icon_flow_tag_diabled() { return this._icon_flow_tag_diabled }
  public get icon_flow_tag() { return this._icon_flow_tag }
  public get icon_node_tag_diabled() { return this._icon_node_tag_diabled }
  public get icon_node_tag() { return this._icon_node_tag }
  public get icon_level_tag_diabled() { return this._icon_level_tag_diabled }
  public get icon_level_tag() { return this._icon_level_tag }


}
