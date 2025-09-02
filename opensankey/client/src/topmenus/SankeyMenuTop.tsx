import * as d3 from 'd3'
import React, { ChangeEvent, FunctionComponent, useRef, useState, Ref } from 'react'
import { ChevronDownIcon } from '@chakra-ui/icons'

import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CloseButton,
  CreateToastFnReturn,
  Heading,
  Image,
  Input,
  InputGroup,
  Menu as ChakraMenu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Toast,
  Text,
  FormControl,
  Select,
  Link,
} from '@chakra-ui/react'
import {
  SankeyData,
  MenuTypes,
  applicationDataType,
  textForToastPromiseType
} from '../types/Types'

import {
  complete_sankey_data
} from '../configmenus/SankeyConvert'
import {
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from 'react-icons/fa'
import SankeyLoad from '../dialogs/SankeyPersistence'
import {
  SankeyConfigurationMenu
} from '../configmenus/SankeyMenuConfiguration'
import {
  ExcelModal,
  ApplyLayoutDialog
} from '../dialogs/SankeyMenuDialogs'
import {
  TFunction
} from 'i18next'
import {
  faFolderOpen,
  faDownload,
  faFileInvoice,
  faPenToSquare,
  faFile,
  faPlus,
  faCloudArrowUp,
  faExclamation,
  faCheck,
  faGears,
  faTable,
  faImage,
  faShareNodes,
  faShapes
} from '@fortawesome/free-solid-svg-icons'
import {
  FontAwesomeIcon
} from '@fortawesome/react-fontawesome'
import Draggable from 'react-draggable'
import {
  MenuDraggableFType,
  ModalTutoType,
  Modale_resolution_pngFType,
  OpenSankeyMenusFType,
  OpenSankeySaveButtonFType
} from './types/SankeyMenuTopTypes'
import {
  DefaultNode,
  DefaultLink,
  FindMaxLinkValue,
  OSTooltip
} from '../configmenus/SankeyUtils'
import {
  ClickSaveExcel
} from '../dialogs/SankeyPersistence'
import {
  UploadExemple
} from '../dialogs/SankeyPersistence'
import {
  UploadExcelImpl
} from '../dialogs/SankeyPersistence'
import {
  DownloadExamples
} from '../dialogs/SankeyPersistence'
import {
  RepositionneSidebar
} from '../draw/SankeyDrawFunction'
import {
  actualizeDrawAreaFrame
} from '../draw/SankeyDrawEventFunction'
import {
  faFileExport
} from '@fortawesome/free-solid-svg-icons'
import FileSaver from 'file-saver'
import {
  AddDrawNodesEvent
} from '../draw/SankeyDrawNodes'
import {
  Drawer,
  DrawerBody,
  DrawerContent
} from '@chakra-ui/react'
import {
  DataTagSelector
} from '../configmenus/SankeyMenuBanner'


declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      header?: string
      sous_filieres: { [key: string]: string }
      help: { [key: string]: string }
      excel: string
      structure: boolean,
      advanced: boolean
    } & { [key: string]: SankeyData }
  }
/**
 * Description placeholder
 *
 * @export
 * @typedef {selected_type}
 */
export type selected_type = { 'label': string; 'value': string }
export const menu_config_width = 450
/**
 * Variable that define the Menu element, it's variable and function
 *
 * @type {{ data: any; set_data: any; right_menu: any; settings_edition: any; settings_edition_node_tags: any; settings_edition_link_tags: any; settings_edition_data_tags: any; ... 39 more ...; launch: any; }}
 */



const GoToUserDoc = () => {
  const path = window.location.origin
  const url = path + '/doc'
  fetch(url, {
    method: 'GET'
  }).then((response) => {
    if (response.redirected) {
      return window.open(response.url, '_blank')
    }
  }).then(win => win?.focus())
}

// Logo for sub-nav 'aide'
const logo_home = <svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox='0 0 1000 1000'
  height='1.8rem'
  width='1.8rem'
>
  <path
    d='m 162.74,976.43485 -10.47133,-9.79617 V 766.1038 565.56892 h -45.83039 c -50.763748,0 -66.86203,-5.17542 -80.570758,-25.90272 C 13.167748,520.46444 10.955002,498.30818 19.718259,478.09335 30.219727,453.86882 469.64661,19.352705 487.72193,15.319776 c 26.45493,-5.9025653 35.08525,0.500299 137.16415,101.762594 54.73533,54.29743 100.44482,98.7226 101.5767,98.7226 1.13189,0 2.05795,-13.67075 2.05795,-30.37945 0,-27.18977 1.09936,-31.408 10.4713,-40.17559 9.19405,-8.60121 15.85948,-9.7778 54.64454,-9.64581 66.26282,0.2255 66.00422,-0.25812 66.10665,123.61063 l 0.075,91.29661 59.36176,58.38021 c 45.073,44.32769 60.43581,62.25057 63.82369,74.45937 5.39968,19.45846 2.1815,39.62415 -9.02804,56.57281 -13.53183,20.45968 -29.78886,25.64517 -80.40047,25.64517 H 847.74475 V 766.1038 966.63868 l -10.47131,9.79617 c -9.9428,9.30163 -15.35862,9.79606 -107.30211,9.79606 h -96.8303 v -145.7793 c 0,-142.54209 -0.20069,-146.23082 -9.04087,-166.11263 -15.83064,-35.6037 -23.26302,-37.87197 -124.09321,-37.87197 -100.83021,0 -108.26257,2.26827 -124.09319,37.87197 -8.84013,19.88181 -9.04089,23.57054 -9.04089,166.11263 v 145.7793 H 270.0421 c -91.94345,0 -97.35929,-0.49443 -107.3021,-9.79606 z'
  />
</svg>

const logo_tuto = <svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox='0 0 1000 1000'
  height='1.8rem'
  width='1.8rem'
>
  <path
    d='m 157.33319,886.51985 v -16.01023 l 16.97603,-16.89738 16.97603,-16.89737 H 313.68261 436.07997 V 802.89555 769.07623 L 251.70059,768.53613 67.321219,767.99604 56.674641,763.61283 C 34.844761,754.62541 18.748122,738.52877 9.7607064,716.69889 L 5.3774908,706.05232 4.8534663,440.05798 C 4.5089043,265.1623 5.0063898,170.35909 6.305737,163.24694 11.007769,137.51176 27.829518,116.02052 52.370849,104.39479 L 65.385477,98.229492 462.21248,97.6364 c 298.75308,-0.446517 399.45825,-0.03058 407.47358,1.683224 31.55142,6.745946 56.78277,33.138756 61.97135,64.824086 1.57151,9.59677 2.91788,175.10714 1.42418,175.07528 -0.26616,-0.006 -7.64273,-6.75659 -16.39238,-15.002 L 900.78076,309.22531 900.23541,236.635 c -0.53123,-70.71009 -0.65643,-72.79798 -4.83401,-80.6092 -5.36123,-10.02443 -18.44799,-21.3963 -27.52458,-23.91774 -4.45441,-1.23742 -146.57944,-1.90598 -400.82499,-1.88552 -377.912017,0.0304 -394.241158,0.17615 -401.741285,3.58294 -9.848569,4.47361 -22.73902,18.95834 -25.716848,28.89746 -3.263312,10.89194 -3.263312,431.2049 0,442.09686 2.977828,9.9391 15.868279,24.42383 25.716848,28.89746 7.447901,3.38314 19.283682,3.55323 250.089265,3.59372 l 242.27136,0.0426 8.26774,10.16264 c 39.81042,48.93466 86.73175,77.17761 148.88783,89.61872 12.97735,2.59753 23.22843,3.10065 48.51754,2.38121 l 32.06372,-0.91214 7.61898,13.72656 c 4.19044,7.54958 7.90932,14.38509 8.2642,15.18999 0.3549,0.80488 -69.11402,1.46344 -154.37538,1.46344 l -155.02062,-8e-5 v 33.87548 33.87548 h 122.39736 122.39734 l 16.97604,16.89737 16.97603,16.89738 v 16.01023 16.01022 H 468.98757 157.33319 Z m 768.76727,-10.5051 c -8.0362,-2.84054 -25.47372,-17.29199 -25.41455,-21.06245 0.0263,-1.67308 81.2109,-49.52544 86.0779,-50.73658 3.04952,-0.75887 6.85709,8.13021 8.14672,19.0192 4.32998,36.55983 -33.21802,65.36051 -68.81007,52.77983 z m -54.2842,-70.55702 c -9.94227,-17.19142 -25.2893,-43.68312 -34.10451,-58.87048 L 821.6841,718.97387 866.11556,693.4222 c 24.43733,-14.05342 44.70148,-25.23606 45.03147,-24.85033 4.45712,5.21009 66.89808,116.31638 66.09724,117.61219 -1.03829,1.67997 -84.66224,50.53081 -86.49978,50.53081 -0.46826,0 -8.98595,-14.0657 -18.92823,-31.25714 z M 716.58567,704.12296 c -41.47063,-7.82194 -80.1009,-28.93612 -110.08701,-60.17035 -40.72128,-42.41624 -60.25344,-94.37985 -57.42247,-152.7676 5.35255,-110.39429 94.89916,-196.47776 204.3821,-196.47776 76.22482,0 144.20386,38.9682 181.18546,103.86246 14.94672,26.22808 22.46947,50.1885 26.28077,83.7059 3.85981,33.94388 -3.22285,73.11675 -19.50015,107.8516 -25.3021,53.99326 -74.55712,94.65924 -134.64991,111.16984 -20.09526,5.5212 -67.94915,7.02063 -90.18879,2.82591 z m 77.36787,-34.92608 C 893.64301,646.51334 951.20766,541.83855 917.88501,443.84162 892.4106,368.92511 813.74876,319.69876 735.15203,329.4878 c -58.48961,7.28476 -108.53449,42.896 -135.23102,96.2285 -11.00488,21.9848 -15.0218,38.75281 -16.1851,67.56202 -1.2159,30.11203 2.01944,49.79719 12.00595,73.04935 9.77629,22.76271 17.83147,35.07943 34.58502,52.88192 27.34125,29.05306 60.6076,46.55456 100.95366,53.11193 13.91373,2.26137 46.04218,0.65956 62.673,-3.12464 z M 141.84726,493.12075 v -16.4538 h 159.69868 159.69867 v 16.4538 16.45381 H 301.54594 141.84726 Z m 0,-77.42965 v -16.45381 h 159.69868 159.69867 v 16.45381 16.4538 H 301.54594 141.84726 Z m 0,-77.42966 v -16.45381 h 159.69868 159.69867 v 16.45381 16.4538 H 301.54594 141.84726 Z m 0,-77.42967 v -16.4538 h 214.86731 214.8673 v 16.4538 16.4538 H 356.71457 141.84726 Z'
  />
</svg>

const logo_doc = <svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox='0 0 1000 1000'
  height='1.8rem'
  width='1.8rem'
>
  <path
    d='m 3.014475,553.90339 v -295.3514 h 22.539401 22.539401 l 0.889917,-9.01103 c 0.938053,-9.49844 1.697873,-9.96018 27.159151,-16.50472 l 12.069649,-3.10235 v -13.88646 -13.88645 l 15.390076,-3.44414 c 20.94496,-4.68729 21.99646,-5.65706 22.97408,-21.18857 0.48926,-7.77285 2.52048,-14.51777 4.74737,-15.76398 2.14073,-1.19802 14.64756,-4.35751 27.79294,-7.0211 28.51362,-5.77761 76.82539,-4.54191 112.27019,2.87158 56.44782,11.80642 136.27023,45.20052 199.5978,83.5028 l 29.20273,17.66261 25.13289,-15.54656 c 114.20296,-70.64306 235.55834,-104.70156 315.41298,-88.52093 13.22816,2.68037 25.81246,5.85906 27.96512,7.06375 2.20113,1.23182 4.38724,8.19745 4.99553,15.91734 1.23968,15.73323 1.93222,16.37448 22.70423,21.02306 l 15.39008,3.44414 v 13.88645 13.88646 l 12.06965,3.10235 c 25.46127,6.54454 26.22109,7.00628 27.15916,16.50472 l 0.88991,9.01103 h 22.5394 22.5394 v 295.3514 295.3514 H 500 3.014475 Z M 387.82326,823.52662 C 278.65582,801.38742 131.21779,794.63196 57.682883,808.39997 l -9.229731,1.72809 V 544.27973 278.43141 h -9.939711 -9.93971 v 275.47198 275.47198 l 192.404389,-0.33267 192.4044,-0.33264 z M 971.42627,553.90339 V 278.43141 h -9.93971 -9.93971 v 265.88726 265.88726 l -9.22973,-1.85526 c -67.65746,-13.59969 -224.76983,-6.39638 -330.14039,15.1363 l -25.55926,5.22309 192.4044,0.33264 192.4044,0.33267 z m -482.78594,-6.8392 V 270.43281 l -20.5894,-13.18241 c -29.36086,-18.79838 -87.44168,-47.83 -125.31723,-62.6396 -45.56636,-17.81676 -84.59818,-26.90194 -124.1853,-28.90573 -32.42947,-1.6415 -68.84629,2.35551 -72.29452,7.93484 -0.83923,1.35791 -2.67248,78.84644 -4.07389,172.19677 -1.40142,93.3503 -3.32242,214.59222 -4.26891,269.42645 l -1.7209,99.69862 37.7791,1.59106 c 78.41327,3.3024 172.09513,32.48397 270.65233,84.30726 23.42932,12.31959 42.91825,22.4974 43.30874,22.61736 0.39049,0.11984 0.70998,-124.26601 0.70998,-276.41324 z M 319.98264,660.76934 c -56.29196,-14.00963 -59.73065,-15.25428 -67.34608,-24.37638 -14.52914,-17.40355 -13.63754,-42.87511 1.85614,-53.02696 6.39785,-4.19203 9.64796,-4.46767 22.13613,-1.87738 8.05048,1.66981 14.81585,2.85556 15.03412,2.63496 0.21839,-0.22067 0.85726,-36.7117 1.41996,-81.09134 l 1.02308,-80.69029 -14.19958,-4.73247 c -16.5737,-5.52369 -26.97922,-18.29034 -26.97922,-33.10114 0,-9.42676 7.97719,-20.87941 14.54325,-20.87941 1.75098,0 21.23991,5.26095 43.30874,11.69098 39.33174,11.4598 47.74133,15.57995 53.40674,26.16586 1.72593,3.22495 2.68344,43.48691 2.47383,104.02313 l -0.34196,98.76182 7.98821,1.59762 c 18.11114,3.62223 31.97673,22.39755 31.97673,43.29951 0,11.54355 -12.68731,27.03576 -21.79092,26.60846 -2.85355,-0.13404 -31.8827,-6.88708 -64.50917,-15.00697 z M 310.70165,356.5 c -30.63984,-18.36594 -42.18408,-64.73432 -21.13705,-84.89867 16.41341,-15.72505 40.97395,-11.70563 61.90579,10.13112 12.2808,12.81172 17.89342,27.42565 17.89342,46.59029 0,14.40355 -0.96058,16.95533 -9.65572,25.65047 -8.33905,8.33905 -11.5339,9.65206 -23.42932,9.62886 -9.5915,-0.0199 -17.35751,-2.17512 -25.57712,-7.10207 z m 332.71418,403.70529 c 71.92511,-28.47389 125.38833,-41.24275 182.8034,-43.65966 l 37.96763,-1.59828 -1.74333,-82.65193 c -0.95881,-45.45853 -2.40501,-138.24329 -3.21379,-206.18831 -1.63732,-137.55494 -4.27956,-250.38977 -5.92762,-253.13441 -0.59504,-0.99093 -9.58909,-3.4069 -19.98679,-5.3688 -27.10125,-5.11364 -77.70111,-1.99326 -114.20793,7.04296 -51.89509,12.84515 -125.75469,45.1696 -183.60844,80.35575 l -22.71934,13.8177 -0.72394,277.29177 -0.72393,277.29179 46.16261,-23.72935 c 25.38946,-13.05115 64.05411,-30.81231 85.92147,-39.46923 z M 611.96414,660.9378 c -6.35579,-5.46701 -7.5847,-8.77466 -7.36306,-19.81762 0.45737,-22.78506 12.52699,-38.35385 34.9394,-45.06875 l 10.97514,-3.28826 v -23.23308 c 0,-12.77821 -0.83533,-48.17471 -1.85626,-78.65892 l -1.85628,-55.42581 -12.82696,3.86035 c -11.2707,3.39197 -13.67023,3.30783 -19.7771,-0.69356 -6.23968,-4.08837 -6.80814,-6.03193 -5.5609,-19.01205 1.92535,-20.03775 8.16215,-24.47365 57.21629,-40.69483 55.16466,-18.24181 51.60707,-21.78531 53.95173,53.73845 3.83993,123.68848 4.74391,135.99305 9.84571,134.0182 13.95561,-5.40209 19.95539,-4.80244 27.50704,2.74921 6.80778,6.80779 7.48784,9.24856 6.36141,22.83183 -0.89296,10.76783 -3.48145,18.11995 -8.8642,25.17708 -7.00988,9.19046 -12.33766,11.53237 -68.30413,30.02401 -33.38567,11.0308 -62.06415,20.05603 -63.72996,20.05603 -1.66581,0 -6.46186,-2.95303 -10.65787,-6.56228 z m 35.71157,-302.28312 c -6.1835,-3.08901 -11.99874,-9.18364 -15.38832,-16.12767 -4.75953,-9.75057 -5.04861,-13.06921 -2.2858,-26.241 8.0103,-38.18939 44.93426,-64.44045 71.39408,-50.75753 33.96683,17.56491 13.52505,83.19123 -29.58067,94.96581 -14.21498,3.8829 -12.40845,4.02058 -24.13929,-1.83961 z M 389.24322,808.24783 c 0,-2.05292 -45.28981,-15.22991 -82.79086,-24.08786 -74.53076,-17.60454 -145.3032,-25.22173 -189.58268,-20.40464 -15.35668,1.67064 -30.08784,3.86891 -32.735921,4.88508 -4.498883,1.72639 -4.690095,-6.32708 -2.914891,-122.77425 4.938673,-323.95877 5.865764,-397.38914 5.039064,-399.11715 -0.490283,-1.02478 -5.363042,-0.49088 -10.828349,1.18646 l -9.936927,3.04973 v 270.76044 270.76042 l 16.329524,-2.15473 c 8.981238,-1.18513 47.63961,-2.08817 85.90749,-2.00675 71.03403,0.15109 124.09701,4.49571 187.43454,15.34649 16.40053,2.8097 30.77761,5.26521 31.94907,5.4567 1.17147,0.19141 2.12994,-0.21356 2.12994,-0.89994 z m 269.79215,-6.95246 c 21.08638,-3.10539 53.67443,-7.29429 72.41789,-9.30868 36.97958,-3.97426 156.62993,-5.07433 185.3046,-1.70372 l 17.74948,2.0864 V 521.32948 250.28962 l -10.07213,-1.88956 c -5.53966,-1.03924 -10.39112,-1.41664 -10.78098,-0.83866 -0.79731,1.18197 2.15746,234.07964 5.17972,408.27196 1.85663,107.01002 1.66806,114.58598 -2.80941,112.8678 -2.63982,-1.013 -16.82742,-3.18298 -31.52803,-4.82218 -44.98477,-5.01612 -122.82153,3.50517 -197.06197,21.57357 -35.61043,8.66678 -76.67777,20.97805 -76.67777,22.98666 0,0.79172 2.23644,0.77862 4.96986,-0.029 2.73342,-0.8077 22.22235,-4.00934 43.30874,-7.11473 z M 387.68127,789.80961 C 382.61014,784.83448 312.33065,758.1791 279.05321,748.60948 231.88474,735.04522 190.80988,729.17352 151.7621,730.41305 l -32.31102,1.0257 -0.0557,-25.57953 c -0.0307,-14.06873 1.47079,-131.32048 3.33645,-260.55943 1.86568,-129.23896 2.73694,-235.63513 1.93614,-236.43593 -0.80077,-0.8008 -5.32047,-0.10877 -10.04371,1.5377 l -8.58774,2.9937 -1.79682,90.0264 c -0.98826,49.51453 -2.45544,146.89575 -3.26042,216.40272 -0.805,69.50698 -2.206526,149.63905 -3.114532,178.07128 l -1.650901,51.69496 48.299893,0.11388 c 68.83167,0.16244 143.45592,11.8967 216.33028,34.01673 32.41754,9.83989 30.13303,9.32163 26.83722,6.08824 z m 316.79277,-22.70667 c 58.58866,-12.84239 97.08914,-17.24526 150.79981,-17.24526 h 48.36751 l -1.57081,-36.20894 c -0.86393,-19.91492 -2.23002,-102.66301 -3.03573,-183.88465 -0.80572,-81.22163 -2.28426,-185.6344 -3.28565,-232.02837 l -1.82072,-84.35264 -8.57025,-2.98759 c -4.71364,-1.64321 -9.2224,-2.33544 -10.01954,-1.53833 -0.79711,0.79714 0.0733,107.83226 1.93393,237.85588 1.86077,130.02363 3.35917,247.27839 3.32977,260.56613 l -0.0534,24.15958 -32.31102,-1.0257 c -39.04778,-1.23953 -80.12264,4.63217 -127.29111,18.19643 -32.60322,9.37574 -103.51518,36.18779 -108.4231,40.99518 -1.37113,1.34305 10.13053,-1.27959 25.55926,-5.82805 15.42871,-4.54847 45.30471,-12.05162 66.39111,-16.67367 z'
  />
</svg>

const logo_contact = <svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox='0 0 1000 1000'
  height='1.8rem'
  width='1.8rem'
>
  <path
    d='M 73.899976,875.90139 C 40.937168,869.42787 12.296795,840.1985 5.9081337,806.51127 c -2.7238299,-14.36281 -2.7238299,-598.39643 0,-612.75924 6.5424433,-34.49806 35.0100633,-62.96568 69.5081303,-69.50811 14.424371,-2.73553 834.743106,-2.73553 849.167476,0 34.49807,6.54243 62.96569,35.01005 69.50811,69.50811 2.72385,14.36281 2.72385,598.39643 0,612.75924 -6.54242,34.49807 -35.01004,62.96569 -69.50811,69.50811 -12.97147,2.46 -838.139611,2.34552 -850.683764,-0.11801 z M 757.27835,680.87137 618.28561,541.87862 568.34724,591.53493 c -41.79051,41.55444 -51.28209,50.05497 -58.17393,52.0997 -16.55644,4.91214 -19.12525,3.10924 -75.61314,-53.06836 L 383.65363,539.93937 243.69127,679.90173 103.72888,819.86411 H 499.99999 896.2711 Z M 204.56487,362.25953 C 129.15162,287.28205 66.237927,225.23952 64.756655,224.38723 c -2.2938,-1.3198 -2.693233,39.63262 -2.693233,276.13089 V 778.19865 L 201.87164,638.39044 341.67987,498.58221 Z M 937.93658,499.6489 V 222.06467 L 798.9048,361.09648 659.873,500.12826 798.41526,638.68068 c 76.19825,76.20385 138.76257,138.55244 139.0318,138.55244 0.26924,0 0.48952,-124.91291 0.48952,-277.58422 z M 699.59057,377.0831 896.26733,180.39919 H 500.48086 c -217.68253,0 -395.78644,0.30148 -395.78644,0.66997 0,1.39663 395.3274,392.69785 396.73839,392.69785 0.81457,0 89.98555,-88.50776 198.15776,-196.68391 z'
  />
</svg>

export const OpenSankeyMenus: OpenSankeyMenusFType = (
  t: TFunction,
  Reinitialization,
  get_default_data,
  dict_hook_ref_setter_show_dialog_components,
  never_see_again,
  data,
  set_data,
  external_edition_item,
  external_file_item,
  external_file_export_item,
  externale_save_item,
  externale_navbar_item,
  convert_data,
  setDiagram
) => {
  const _load_json = useRef<HTMLInputElement>(null)

  const { ref_setter_show_style_node, ref_setter_show_style_link } = dict_hook_ref_setter_show_dialog_components

  const logo_tempalte = <svg
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden='false'
    data-prefix='fas'
    className='svg-inline--fa'
    viewBox="0 0 1000 1000"
    height='1.8rem'
    width='1.8rem'
  >
    <path fill='currentColor' d="M10,7.5c0-.83,.67-1.5,1.5-1.5s1.5,.67,1.5,1.5-.67,1.5-1.5,1.5-1.5-.67-1.5-1.5Zm14-1v5c0,3.03-2.47,5.5-5.5,5.5H10.5c-3.03,0-5.5-2.47-5.5-5.5V6.5c0-3.03,2.47-5.5,5.5-5.5h8c3.03,0,5.5,2.47,5.5,5.5ZM8,11.5c0,1,.59,1.86,1.43,2.26l4.28-4.28c.62-.62,1.64-.62,2.26,0l1.04,1.04c.62,.62,1.64,.62,2.26,0l1.72-1.72v-2.29c0-1.38-1.12-2.5-2.5-2.5H10.5c-1.38,0-2.5,1.12-2.5,2.5v5Zm8.5,7.5H5.5c-1.38,0-2.5-1.12-2.5-2.5v-7c0-.83-.67-1.5-1.5-1.5s-1.5,.67-1.5,1.5v7c0,3.03,2.47,5.5,5.5,5.5h11c.83,0,1.5-.67,1.5-1.5s-.67-1.5-1.5-1.5Z" />
  </svg>

  const sous_filieres = window.sankey && window.sankey.sous_filieres ? window.sankey.sous_filieres : undefined

  let is_split = false
  const diagrams: { [keys: string]: string[] } = {}

  if (sous_filieres) {
    is_split = Object.keys(sous_filieres)[0].includes('/')
    if (is_split) {
      Object.keys(sous_filieres).forEach(s => {
        const path = s.split('/')
        if (!(path[0] in diagrams)) {
          diagrams[path[0]] = [path[1]]
        } else {
          diagrams[path[0]].push(path[1])
        }
      })
    } else {
      Object.keys(sous_filieres).forEach(s => diagrams[s] = [s])
    }
  }
  const [s_diagram, sDiagram] = useState(Object.keys(diagrams).length > 0 ? Object.keys(diagrams)[0] : '')
  const [s_diagram_2, sDiagram2] = useState(Object.keys(diagrams).length > 0 ? Object.values(diagrams)[0][0] : '')

  // OBJECT THAT CONTAIN DIFFERENT MENUS
  const ui: { [s: string]: JSX.Element[] } = {}
  let diagrams_element = window.SankeyToolsStatic && sous_filieres && !is_split ? <Box
    margin='0.25rem'
    alignSelf='center'
    justifySelf='center'
  ><FormControl key={'1'} >
      <Select style={{ width: '200px', color: 'black' }}
        onChange={evt => {
          sDiagram(evt.target.value)
          setDiagram(evt.target.value, set_data, convert_data, get_default_data)
        }}
        value={s_diagram}>
        {Object.keys(sous_filieres).map((name, i) => <option key={i} value={name} >{name}</option>)}
      </Select>
    </FormControl></Box> : <React.Fragment key={'1'} />

  if (window.SankeyToolsStatic && sous_filieres && is_split) {
    diagrams_element = <Box
      margin='0.25rem'
      alignSelf='center'
      justifySelf='center'
    >
      <FormControl key={'1'} >
        <Select style={{ width: '200px', color: 'black' }}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            sDiagram(evt.target.value)
            const diagram_path = evt.target.value + '/' + diagrams[evt.target.value][0]
            setDiagram(diagram_path, set_data, convert_data, get_default_data)
          }}
          value={s_diagram}>
          {Object.keys(diagrams).map((name, i) => <option key={i} value={name} >{name}</option>)}
        </Select>
      </FormControl>
      {is_split ?
        (<FormControl key={'2'} >
          <Select style={{ width: '200px', color: 'black' }}
            onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
              sDiagram2(evt.target.value)
              const diagram_path = s_diagram + '/' + evt.target.value
              setDiagram(diagram_path, set_data, convert_data, get_default_data)
            }}
            value={s_diagram_2}>
            {diagrams[s_diagram] ? (Object.values(diagrams[s_diagram]).map((name, i) => <option key={i} value={name} >{name}</option>)) : (<React.Fragment></React.Fragment>)}
          </Select></FormControl>) : (<React.Fragment />)
      }
    </Box>
  }

  if ((Object.keys(diagrams).length > 0)) ui['diagramme'] = [diagrams_element]


  if (!window.SankeyToolsStatic) {
    ui['file'] = [
      <ChakraMenu
        variant='menu_button_subnav_style'
        placement='bottom-start'
      >
        <OSTooltip
          placement='bottom'
          label={t('Menu.tooltips.new')}
        >
          <MenuButton>
            <Box
              gridColumn='1'
              gridColumnEnd="span 2"
              gridRow="1"
            >
              <FontAwesomeIcon
                style={{ 'height': '2rem', 'width': '2rem' }}
                icon={faPlus}
              />
            </Box>
            <Box
              gridColumn="1"
              gridRow="2"
            >
              {t('Menu.new')}
            </Box>
            <Box
              gridColumn="2"
              gridRow="2"
              height="1rem"
              width="1rem"
            >
              <ChevronDownIcon
                style={{ 'height': '1rem', 'width': '1rem' }}
              />
            </Box>
          </MenuButton>
        </OSTooltip>

        <MenuList>
          <MenuItem
            onClick={Reinitialization}
          >
            <FontAwesomeIcon
              style={{ 'height': '1rem', 'width': '1rem' }}
              icon={faFile}
            />
            {t('Menu.from_new')}
          </MenuItem>

          <MenuItem
            onClick={() => { dict_hook_ref_setter_show_dialog_components.ref_setter_show_modal_template.current!(true) }}
          >
            {logo_tempalte}
            {t('Menu.from_model')}
          </MenuItem>
        </MenuList>
      </ChakraMenu>,

      <Box>
        <ChakraMenu
          variant='menu_button_subnav_style'
          placement='bottom-start' id='ouvrir'
        >
          <OSTooltip placement='bottom' label={t('Menu.tooltips.ouvrir')}>
            <MenuButton>
              <Box
                gridColumn='1'
                gridColumnEnd="span 2"
                gridRow="1"
              >
                <FontAwesomeIcon
                  style={{ 'height': '2rem', 'width': '2rem' }}
                  icon={faFolderOpen}
                />
              </Box>
              <Box
                gridColumn="1"
                gridRow="2"
              >
                {t('Menu.ouvrir')}
              </Box>
              <Box
                gridColumn="2"
                gridRow="2"
                height="1rem"
                width="1rem"
              >
                <ChevronDownIcon
                  style={{ 'height': '1rem', 'width': '1rem' }}
                />
              </Box>
            </MenuButton>
          </OSTooltip>
          <MenuList>
            <MenuItem
              onClick={() => {
                if (_load_json.current) {
                  _load_json.current.name = ''
                  _load_json.current.click()
                }
              }}>
              <FontAwesomeIcon
                style={{ 'height': '1rem', 'width': '1rem' }}
                icon={faFile}
              />
              {t('Menu.open_json')}
            </MenuItem>
            <Input
              accept='.json'
              type="file"
              ref={_load_json}
              style={{ display: 'none' }}
              onChange={(evt: ChangeEvent) => {
                const files = (evt.target as HTMLFormElement).files
                const reader = new FileReader()
                reader.onload = (() => {
                  return (e: ProgressEvent<FileReader>) => {
                    Reinitialization()
                    const result = String((e.target as FileReader).result)
                    const new_data = get_default_data()
                    const result_data = JSON.parse(result)
                    Object.assign(new_data, result_data)
                    if (result_data.version === undefined) {
                      (new_data.version as unknown as undefined) = undefined
                    }
                    convert_data(new_data, get_default_data)
                    complete_sankey_data(new_data, get_default_data, DefaultNode, DefaultLink)

                    set_data(new_data)
                    const test = document.getElementsByClassName('navbar')
                    let margin_top = 0
                    if (test && test.length > 0) {
                      margin_top = test[0].getBoundingClientRect().height
                      d3.select(' .opensankey #svg-container').style('margin-top', margin_top + 'px')
                    }

                    // SplitTrade(new_data)
                    // applicationData.data = new_data
                    // ArrangeTrade(applicationData,true)
                    // set_data(new_data)
                  }
                })()
                reader.readAsText(files[0])
              }}
            />
            <MenuItem
              onClick={() => dict_hook_ref_setter_show_dialog_components.ref_setter_show_excel_dialog.current!(true)}
            >
              <FontAwesomeIcon
                style={{ 'height': '1rem', 'width': '1rem' }}
                icon={faTable}
              />
              {t('Menu.open_excel')}
            </MenuItem>
          </MenuList>
        </ChakraMenu>
      </Box>,

      <ChakraMenu
        placement='bottom-start'
        variant='menu_button_subnav_style'
        id='enregistrer'
      >
        <OSTooltip placement='bottom' label={t('Menu.tooltips.enregistrer')}>
          <MenuButton>
            <Box
              gridColumn='1'
              gridColumnEnd="span 2"
              gridRow="1"
            >
              <FontAwesomeIcon
                style={{ 'height': '2rem', 'width': '2rem' }}
                icon={faDownload}
              />
            </Box>
            <Box
              gridColumn="1"
              gridRow="2"
            >
              {t('Menu.enregistrer')}
            </Box>
            <Box
              gridColumn="2"
              gridRow="2"
              height="1rem"
              width="1rem"
            >
              <ChevronDownIcon
                style={{ 'height': '1rem', 'width': '1rem' }}
              />
            </Box>
          </MenuButton>
        </OSTooltip>
        <MenuList>
          <MenuItem onClick={() => {
            dict_hook_ref_setter_show_dialog_components.ref_setter_show_save_json.current!(true)
          }} >
            <FontAwesomeIcon
              style={{ 'height': '1rem', 'width': '1rem' }}
              icon={faFile}
            />
            {t('Menu.open_json')}
          </MenuItem>
          <MenuItem
            onClick={() => ClickSaveExcel('/opensankey/', data)}
          >
            <FontAwesomeIcon
              style={{ 'height': '1rem', 'width': '1rem' }}
              icon={faTable}
            />
            {t('Menu.open_excel')}
          </MenuItem>
          {externale_save_item}
        </MenuList>
      </ChakraMenu>,

      <ChakraMenu
        placement='bottom-start'
        variant='menu_button_subnav_style'
        id='exporter'
      >
        <OSTooltip placement='bottom' label={t('Menu.tooltips.export')}>
          <MenuButton>
            <Box
              gridColumn='1'
              gridColumnEnd="span 2"
              gridRow="1"
            >
              <FontAwesomeIcon
                style={{ 'height': '2rem', 'width': '2rem' }}
                icon={faFileExport}
              />
            </Box>
            <Box
              gridColumn="1"
              gridRow="2"
            >
              {t('Menu.exporter')}
            </Box>
            <Box
              gridColumn="2"
              gridRow="2"
              height="1rem"
              width="1rem"
            >
              <ChevronDownIcon
                style={{ 'height': '1rem', 'width': '1rem' }}
              />
            </Box>
          </MenuButton>
        </OSTooltip>
        <MenuList>
          <MenuItem onClick={() => {
            dict_hook_ref_setter_show_dialog_components.ref_setter_png_res_h.current(parseInt(String(data.width)))
            dict_hook_ref_setter_show_dialog_components.ref_setter_png_res_v.current(parseInt(String(data.height)))
            dict_hook_ref_setter_show_dialog_components.ref_setter_show_resolution_save_png.current!(true)
          }}>
            <FontAwesomeIcon
              style={{ 'height': '1rem', 'width': '1rem' }}
              icon={faImage}
            />
            PNG
          </MenuItem>
          <MenuItem
            onClick={() => clickSavePDF(data)}
          >
            <FontAwesomeIcon
              style={{ 'height': '1rem', 'width': '1rem' }}
              icon={faFile}
            />
            PDF
          </MenuItem>
          {external_file_export_item}
        </MenuList>
      </ChakraMenu>,

      <>{external_file_item}</>,
      <OSTooltip
        placement='bottom'
        label={t('Menu.tooltips.preference')}>
        <Box>
          <Button
            variant='menutop_button'
            onClick={() => {
              dict_hook_ref_setter_show_dialog_components.ref_setter_show_modal_preference.current!(true)
            }}
          >
            <Box
              layerStyle='menutop_button_style'
            >
              <Box
                gridRow="1"
                padding="0.1rem 0 0.1rem 0"
              >
                <FontAwesomeIcon
                  style={{ 'height': '2rem', 'width': '3rem' }}
                  icon={faGears}
                />
              </Box>
              <Box
                gridRow="2"
              >
                {t('Menu.preference')}
              </Box>
            </Box>
          </Button>
        </Box>
      </OSTooltip>
    ]

    ui['edition'] = [
      <OSTooltip
        placement='bottom'
        label={t('Menu.tooltips.amp')}
      >
        <Button
          variant='menutop_button'
          onClick={() => dict_hook_ref_setter_show_dialog_components.ref_setter_show_apply_layout.current!(true)}
        >
          <Box
            layerStyle='menutop_button_style'
          >
            <Box
              gridRow="1"
              padding="0.1rem 0 0.1rem 0"
            >
              <FontAwesomeIcon
                style={{ 'height': '2rem', 'width': '3rem' }}
                icon={faFileInvoice}
              />
            </Box>
            <Box
              gridRow="2"
            >
              {t('Menu.Transformation.amp_short')}
            </Box>
          </Box>
        </Button>
      </OSTooltip>,

      <ChakraMenu
        variant='menu_button_subnav_style'
        placement='bottom-start'
        id='exporter'
      >
        <OSTooltip
          placement='bottom'
          label={t('Menu.tooltips.style')}
        >
          <MenuButton>
            <Box
              gridColumn='1'
              gridColumnEnd="span 2"
              gridRow="1"
            >
              <FontAwesomeIcon
                style={{ 'height': '2rem', 'width': '2rem' }}
                icon={faPenToSquare}
              />
            </Box>
            <Box
              gridColumn="1"
              gridRow="2"
            >
              {t('Menu.style')}
            </Box>
            <Box
              gridColumn="2"
              gridRow="2"
              height="1rem"
              width="1rem"
            >
              <ChevronDownIcon
                style={{ 'height': '1rem', 'width': '1rem' }}
              />
            </Box>
          </MenuButton>
        </OSTooltip>

        <MenuList>
          <MenuItem onClick={() => { ref_setter_show_style_node.current(true) }}>
            <FontAwesomeIcon
              style={{ 'height': '1rem', 'width': '1rem' }}
              icon={faShapes}
            />
            {t('Menu.esn')}
          </MenuItem>
          <MenuItem onClick={() => { ref_setter_show_style_link.current(true) }}>
            <FontAwesomeIcon
              style={{ 'height': '1rem', 'width': '1rem' }}
              icon={faShareNodes}
            />
            {t('Menu.esf')}
          </MenuItem>
        </MenuList>
      </ChakraMenu>,

      <>{external_edition_item}</>
    ]

    ui['aide'] = [
      <OSTooltip
        placement='bottom'
        label={t('Menu.tooltips.DisplayWelcome')}
      >
        <Button
          variant='menutop_button'
          onClick={() => {
            dict_hook_ref_setter_show_dialog_components.ref_setter_show_modal_welcome.current!(true)
            never_see_again.current = false
            localStorage.setItem('dontSeeAggainWelcome', '0')
          }}>
          <Box
            layerStyle='menutop_button_style'
          >
            <Box
              gridRow="1"
              padding="0.1rem 0 0.1rem 0"
            >
              {logo_home}
            </Box>
            <Box
              gridRow="2"
            >
              {t('DisplayWelcome')}
            </Box>
          </Box>
        </Button>
      </OSTooltip>,

      <OSTooltip
        placement='bottom'
        label={t('Menu.tooltips.tuto')}
      >
        <Button
          variant='menutop_button'
          onClick={() => dict_hook_ref_setter_show_dialog_components.ref_setter_show_modale_tuto.current!(true)}
        >
          <Box
            layerStyle='menutop_button_style'
          >
            <Box
              gridRow="1"
              padding="0.1rem 0 0.1rem 0"
            >
              {logo_tuto}
            </Box>
            <Box
              gridRow="2"
            >
              {t('Menu.formation')}
            </Box>
          </Box>
        </Button>
      </OSTooltip>,

      <OSTooltip
        placement='bottom'
        label={t('Menu.tooltips.doc')}
      >
        <Button
          variant='menutop_button'
          onClick={() => GoToUserDoc()}
        >
          <Box
            layerStyle='menutop_button_style'
          >
            <Box
              gridRow="1"
              padding="0.1rem 0 0.1rem 0"
            >
              {logo_doc}
            </Box>
            <Box
              gridRow="2"
            >
              {t('Menu.doc')}
            </Box>
          </Box>
        </Button>
      </OSTooltip>,

      <OSTooltip
        placement='bottom'
        label={t('Menu.tooltips.support')}
      >
        <Button
          variant='menutop_button'
          onClick={() => dict_hook_ref_setter_show_dialog_components.ref_setter_show_modale_support.current!(true)}
        >
          <Box
            layerStyle='menutop_button_style'
          >
            <Box
              gridRow="1"
              padding="0.1rem 0 0.1rem 0"
            >
              {logo_contact}
            </Box>
            <Box
              gridRow="2"
            >
              {t('Menu.support')}
            </Box>
          </Box>
        </Button>
      </OSTooltip>
    ]
  }

  Object.entries(externale_navbar_item).forEach(ext_nav => {
    ui[ext_nav[0]] = [ext_nav[1]]
  })

  const excel_element = window.sankey && window.sankey.excel ? (
    <Box
      margin='0.25rem'
      alignSelf='center'
      justifySelf='center'
    >
      <Link href={window.sankey.excel}><Button
      >{t('Banner.tl')}</Button></Link>
    </Box>) : (<React.Fragment key={'3'}></React.Fragment>)

  if (window.sankey && window.sankey.excel) ui['excel'] = [(excel_element)]

  return ui
}

export const Modale_resolution_png: Modale_resolution_pngFType = (
  t: TFunction,
  dict_hook_ref_setter_show_dialog_components,
  applicationData,
  pointer_pos
) => {
  const [h, set_h] = useState<number>()
  const [v, set_v] = useState<number>()
  const valid_input = (h === undefined && v === undefined) || (v !== undefined && h !== undefined && !isNaN(+v) && !isNaN(+h))
  dict_hook_ref_setter_show_dialog_components.ref_setter_png_res_h.current = set_h
  dict_hook_ref_setter_show_dialog_components.ref_setter_png_res_v.current = set_v
  const content = <>
    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Menu.larg')}
      </Box>
      <InputGroup
        variant='menuconfigpanel_option_input'
      >
        <NumberInput
          variant='menuconfigpanel_option_numberinput'
          allowMouseWheel
          min={0}
          step={1}
          value={h}
          onChange={
            (_, val) => {
              if (!isNaN(val)) {
                set_h(val)
              }
            }}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </InputGroup>
    </Box>

    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Menu.haut')}
      </Box>
      <InputGroup
        variant='menuconfigpanel_option_input'
      >
        <NumberInput
          variant='menuconfigpanel_option_numberinput'
          allowMouseWheel
          min={0}
          step={1}
          value={v}
          onChange={
            (_, val) => {
              if (!isNaN(val)) {
                set_v(val)
              }
            }}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </InputGroup>
    </Box>

    <Button
      disabled={!valid_input}
      onClick={() => {
        applicationData.function_on_wait.current = () => {
          clickSavePNG(h, v)
        }
        dict_hook_ref_setter_show_dialog_components.ref_lauchToast.current()
      }}
    >
      Save
    </Button>
  </>

  return MenuDraggable(
    dict_hook_ref_setter_show_dialog_components,
    'ref_setter_show_resolution_save_png',
    content,
    pointer_pos,
    t('Menu.setResolutionPNG')
  )
}

const clickSavePNG = (
  h: number | undefined,
  v: number | undefined,
) => {
  const svg = pre_process_export_svg()
  const html = ((svg.attr('title', 'test2')
    .attr('version', 1.1)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .node() as HTMLElement).parentNode as HTMLElement).innerHTML

  const blob = new Blob([html], { type: 'image/svg+xml' })
  const form_data = new FormData()
  form_data.append('html', blob)
  let size_to_send = ''
  if (h !== undefined && v !== undefined) {
    size_to_send = h + ' ' + v
  }

  form_data.append('size', size_to_send)

  post_process_export_svg()

  const path = window.location.origin
  let url = path + '/opensankey/sankey/save_png'
  const fetchData = {
    method: 'POST',
    body: form_data
  }

  const showFile = (blob: BlobPart) => {
    const newBlob = new Blob([blob], { type: 'application/png' })
    FileSaver.saveAs(newBlob, 'sankey_diagram.png')
  }

  const cleanFile = () => {
    const fetchData = {
      method: 'POST'
    }
    url = path + '/opensankey/sankey/clean_png'
    fetch(url, fetchData)
  }

  fetch(url, fetchData).then(
    r => r.blob()
  )
    .then(showFile).then(cleanFile)
}

/**
 * Description placeholder
 *
 * @param {{ data: any; set_data: any;right_menu: any; settings_edition: any; settings_edition_node_tags: any; settings_edition_link_tags: any; settings_edition_data_tags: any; ... 39 more ...; launch: any; }}
 *
 * @returns
 */
export const Menu: FunctionComponent<MenuTypes> = (
  {
    applicationContext,
    applicationData,
    applicationState,
    uiElementsRef,
    contextMenu,
    processFunctions,
    dict_hook_ref_setter_show_dialog_components,
    applicationDraw,
    configurations_menus,
    menus,
    cardsTemplate,
    external_modal,
    Reinitialization,
    additional_nav_item,
    convert_data,
    apply_transformation_additional_elements,
    DiagramSelector,
    formations_menu,
    ref_alt_key_pressed,
    accept_simple_click,
    link_function,
    ComponentUpdater,
    node_function
  }
) => {
  const { ref_setter_show_modale_tuto, ref_setter_show_modal_template } = dict_hook_ref_setter_show_dialog_components
  const { ref_setter_mode_selection } = applicationState
  const [show_nav, set_show_nav] = useState(false)
  const [show_tuto, set_show_tuto] = useState(false)
  const [show_template, set_show_template] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)
  ref_setter_show_modale_tuto.current = set_show_tuto
  ref_setter_show_modal_template.current = set_show_template
  const { updateComponentMenu } = ComponentUpdater

  updateComponentMenu.current = () => setForceUpdate(!forceUpdate)
  RepositionneSidebar(show_nav)

  const [update, setUpdate] = useState(false)
  let max_link_value = 0
  Object.values(applicationData.data.links).forEach(link => {
    const new_max_link_value = FindMaxLinkValue(
      applicationData.data,
      max_link_value,
      link.value,
      link
    )
    max_link_value = new_max_link_value > max_link_value ? new_max_link_value : max_link_value
  })
  max_link_value += 1

  //Switch the variable value that handle opening and closing the configuration menu
  const toggleShow = () => {
    set_show_nav(!show_nav)
    if (!show_nav) {
      actualizeDrawAreaFrame(applicationData, applicationDraw.GetSankeyMinWidthAndHeight)
    } else {
      d3.select('.scroll_zone').style('width', null)
    }
    setUpdate(!update)
  }

  const menuButton = () => {
    if (show_nav) {
      return <FaAngleDoubleRight />
    } else {
      return <FaAngleDoubleLeft />
    }
  }

  const ordered_menu: { [s: string]: JSX.Element[] | JSX.Element } = {}
  const ordered_key: string[] = [
    'file',
    'edition',
    'diagramme',
    'filter',
    'view',
    'unit',
    'afm',
    'demo',
    'aide']
  ordered_key.forEach(key => {
    if (Object.keys(menus).includes(key)) {
      ordered_menu[key] = menus[key]
    }
  })

  const modal_tuto = <ModalTuto
    applicationData={applicationData}
    applicationContext={applicationContext}
    processFunctions={processFunctions}
    formations_menu={formations_menu}
    show_tuto={show_tuto}
    set_show_tuto={set_show_tuto}
    Reinitialization={Reinitialization}
  />

  // Create the menu nav that can be slightly different if it in static
  const menu_nav = <Box>
    <Tabs variant={'tabs_navbar'}>
      <TabList>
        {Object.keys(ordered_menu).map(m => {
          return <Tab
            position='relative'
          >
            <Box layerStyle="menutop_tab_style">
              {
                ['demo', 'unit'].includes(m) ?
                  <Box
                    position='absolute'
                    zIndex='1'
                    top='0'
                    right='0'
                  >
                    <Badge>
                      Dev
                    </Badge>
                  </Box> :
                  <></>
              }
              {applicationContext.t('Menu.' + m)}
            </Box>
          </Tab>
        })}
      </TabList>
      <TabPanels>
        {Object.values(ordered_menu).map(m => {
          return <TabPanel>
            {m}
          </TabPanel>
        })}
      </TabPanels>
    </Tabs>

  </Box>


  const content_support = <>
    <Text
      fontStyle='h3'
    >
      {applicationContext.t('Menu.rth_support')}:
    </Text>
    <Text
      fontStyle='h4'
    >
      {applicationContext.t('Menu.support_explication').split('[]')[0]}
      <a href='mailto:support@open-sankey.fr	'>support@open-sankey.fr</a>
      {applicationContext.t('Menu.support_explication').split('[]')[1]}
    </Text>
  </>

  const modal_support = MenuDraggable(
    dict_hook_ref_setter_show_dialog_components,
    'ref_setter_show_modale_support',
    content_support,
    contextMenu.pointer_pos,
    applicationContext.t('Menu.c_support'))

  const data_tags = Object.assign({}, applicationData.data.dataTags)
  const show_data = Object.values(data_tags).length > 0

  const unit_rem = Object.keys(menus).includes('unité') ? '10fr' : '0fr'
  const excel_rem = Object.keys(menus).includes('excel') ? '10fr' : '0fr'
  const data_rem = show_data ? '10fr' : '0fr'
  let DDDT = <></>
  let menutop_grid_template = 'minmax(7vw, 150px) minmax(7vw, 150px) minmax(51rem, 70vw) auto auto 13rem'
  if (window.SankeyToolsStatic) {
    menutop_grid_template = '100px 30fr auto ' + data_rem + ' ' + unit_rem + ' ' + excel_rem
    // Cartofob menutop_grid_template = '400px 30fr auto '+ data_rem + ' ' + unit_rem + ' ' + excel_rem
  }
  if (show_data && Object.keys(data_tags).length <= 2) {
    DDDT = <DataTagSelector
      applicationData={applicationData}
      node_function={node_function}
      link_function={link_function}
      applicationDraw={applicationDraw}
      ComponentUpdater={ComponentUpdater}
      in_popover={false}
    />
  }
  const modal_resolution_png = Modale_resolution_png(applicationContext.t,
    dict_hook_ref_setter_show_dialog_components, applicationData, contextMenu.pointer_pos
  )
  return (
    <>
      {external_modal.map((c, i) => { return <React.Fragment key={i}>{c}</React.Fragment> })}
      {/* Top Navbar with navigation and edition elements */}
      <Box
        zIndex="1"
        position="fixed"
        top="0"
        width="100%"
      >
        <Box
          className='MenuNavigation'
          layerStyle='menutop_layout_style'
          gridTemplateColumns={menutop_grid_template}
          onClick={() => {
            contextMenu.ref_setter_contextualised_node.current!(undefined)
            contextMenu.ref_contextualised_node.current = undefined
            contextMenu.ref_setter_contextualised_link.current!(undefined)
            contextMenu.showContextZDDRef.current![1](false)
            contextMenu.tagContext.current![0][1](undefined)
            ref_setter_mode_selection.current('s')
            AddDrawNodesEvent(
              contextMenu,
              applicationData,
              uiElementsRef,
              applicationState,
              applicationContext,
              ref_alt_key_pressed,
              accept_simple_click,
              link_function,
              ComponentUpdater,
              dict_hook_ref_setter_show_dialog_components,
              node_function,
              applicationDraw.GetSankeyMinWidthAndHeight,
              applicationDraw.resizeCanvas
            )
          }} >

          {
            !window.SankeyToolsStatic ?
              <Box
                margin='0.25rem'
                alignSelf='center'
                justifySelf='center'
              >
                <Image
                  src={applicationContext.logo_terriflux}
                  onClick={() => { window.open('https://terriflux.com/', '_blank') }}
                />
              </Box> :
              <></>
          }
          {
            applicationContext.logo != '' ?
              <Box
                margin='0.25rem'
                alignSelf='center'
                justifySelf='center'
              >
                <Image
                  src={applicationContext.logo}
                />
              </Box> :
              <></>
          }
          {
            window.SankeyToolsStatic && window.sankey.header ?
              <Box
                margin='0.25rem'
                alignSelf='center'
                justifySelf='center'
                paddingTop='1.5rem'
              >
                <Text
                  fontStyle='h1'
                >
                  {window.sankey.header}
                </Text>
              </Box> :
              <></>
          }
          {
            !window.SankeyToolsStatic ?
              menu_nav :
              <></>
          }
          {
            window.SankeyToolsStatic ?
              <ButtonGroup>
                {Object.keys(ordered_menu).map(k => ordered_menu[k])}
              </ButtonGroup> :
              <></>
          }
          <Box
            margin='0.25rem'
            alignSelf='center'
            justifySelf='center'
          >
            {DDDT}
          </Box>
          <Box
            margin='0.25rem'
            alignSelf='center'
            justifySelf='center'
          >
            {Object.keys(menus).includes('unité') ? <>
              {menus['unité']}
            </> : <></>}
          </Box>
          {Object.keys(menus).includes('excel') ? <Box
            margin='0.25rem'
            alignSelf='center'
            justifySelf='center'
          >
            {menus['excel']}
          </Box> : <></>}

          <Box
            margin='0.25rem'
            alignSelf='center'
            justifySelf='end'
            display='grid'
            gridTemplateColumns='1fr 1fr'
            gridColumnGap='0.25rem'
          >
            {additional_nav_item}
          </Box>
        </Box>
      </Box>

      {/* Bottom Navbar with some more info */}
      {!window.SankeyToolsStatic || window.sankey.footer ? <Box
        zIndex="1"
        position="fixed"
        bottom="0"
        layerStyle="menubottom_layout_style"
      >
        <Box
          display="grid"
          gridTemplateColumns="1fr 1fr 1fr 1fr 30rem"
        >
          <Box
            layerStyle="menubottom_item_style"
            justifySelf='start'
          >
            ©<a href="https://terriflux.com/" >
              <img width={75} src={applicationContext.logo_terriflux} />
            </a> - {applicationContext.t('tdr')}
          </Box>
          <Box layerStyle="menubottom_item_style">
            {applicationContext.app_name}
          </Box>
          <Box layerStyle="menubottom_item_style">
            <a href='https://terriflux.com/mentions-legales/'>{applicationContext.t('legal')}</a>
          </Box>
          <Box layerStyle="menubottom_item_style">
            <a href='mailto:support@open-sankey.fr	'>support@terriflux.fr</a>
          </Box>
          <Box
            layerStyle="menubottom_item_style"
            justifySelf='end'
            paddingRight='1.5rem'
          >
            9 rue du Rocher de Lorzier, 38430 Moirans  +33 (0)4 56 47 00 71
          </Box>
        </Box>
      </Box> : <></>}

      {(!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)) ?
        <Drawer
          blockScrollOnMount={false}
          isOpen={show_nav}
          placement='right'
          onClose={() => set_show_nav(false)}
          variant='drawer_menu_config'
          trapFocus={false}
        >
          {/* We have to set the width of the component here (and not in the theme)
          because for some reason a style is directly applied to this component
          and we cannot override it in the theme */}
          <DrawerContent
            style={{
              width: menu_config_width,
              marginTop: document.getElementsByClassName('MenuNavigation')[0]?.getBoundingClientRect().y + document.getElementsByClassName('MenuNavigation')[0]?.getBoundingClientRect().height

            }}
          >
            <DrawerBody zIndex={2}>
              <SankeyConfigurationMenu
                configuration_menus={configurations_menus}
              />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
        : <></>}

      <ButtonGroup
        orientation='vertical'
        className='sideToolBar'
        isAttached
        //ButtonGroup don't have variants theming so we modify directly the style
        style={{
          right: 0,
          top: (window.innerHeight / 4),
          position: 'fixed',
          zIndex: 1
        }}
      >
        {menus['toolbar']}
        {!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false) ? (
          <Button
            ref={uiElementsRef.button_ref as Ref<HTMLButtonElement>}
            id="toggle-check"
            className='openMenu'
            variant="toolbar_main_button"
            onClick={toggleShow}
            value="menuConfigButton">{menuButton()}
          </Button>
        ) : (<></>)}
      </ButtonGroup>

      {
        processFunctions.ref_processing.current ? (
          <Toast >
            <Button className="btn btn-sm btn-warning col-md-12">
              <span className="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span> Processing...
            </Button></Toast>) : (<></>)
      }
      <ApplyLayoutDialog
        t={applicationContext.t}
        dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
        applicationData={applicationData}
        applicationDraw={applicationDraw}
        convert_data={convert_data}
        apply_transformation_additional_elements={apply_transformation_additional_elements}
        diagramSelector={DiagramSelector}
        DefaultSankeyData={applicationData.get_default_data}
        ComponentUpdater={ComponentUpdater}
      />

      <ExcelModal
        t={applicationContext.t}
        launch={processFunctions.launch}
        UploadExcelImpl={UploadExcelImpl}
        url_prefix={applicationContext.url_prefix}
        dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
        Reinitialization={Reinitialization}
        pointer_pos={contextMenu.pointer_pos}
      />

      <SankeyLoad
        applicationContext={applicationContext}
        applicationDraw={applicationDraw}
        applicationData={applicationData}
        successAction={() => DownloadExamples(
          processFunctions.path.current,
          applicationContext.url_prefix,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )}
        dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
        processFunctions={processFunctions}
        convert_data={convert_data}
      />

      {
        <Modal
          isOpen={show_template}
          onClose={() => set_show_template(false)}
          scrollBehavior='inside'
        >
          <ModalContent
            maxWidth='inherit'
          >
            <ModalHeader>{applicationContext.t('Banner.sdr')}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Box
                layerStyle='options_cards'
              >
                {cardsTemplate}
              </Box>
            </ModalBody>
          </ModalContent>
        </Modal>
      }
      {modal_tuto}
      {modal_support}
      {modal_resolution_png}
    </>
  )
}


export const MenuDraggable: MenuDraggableFType = (
  dict_hook_ref_setter_show_dialog_components,
  dialog_name,
  content: JSX.Element | JSX.Element[],
  pointer_pos: { current: number[] },
  title: string,
) => {
  const [display_menu, set_display_menu] = useState(false)
  dict_hook_ref_setter_show_dialog_components[dialog_name].current = set_display_menu

  return <Draggable
    handle='.title_menu'
    defaultPosition={{ x: pointer_pos.current[0], y: pointer_pos.current[1] }}
    bounds={{ left: 0, top: 0 }}
  >
    <Box
      layerStyle='menucontext_layout'
      hidden={!display_menu}
      position='absolute'
      zIndex='3'
    >
      <Box
        className='title_menu'
        layerStyle='menucontext_title_layout'
      >
        <Text
          justifySelf='start'
          fontStyle='h2'
          margin='0'
        >
          {title}
        </Text>
        <CloseButton
          justifySelf='end'
          onClick={() => { set_display_menu(false) }}
        />
      </Box>
      <Box layerStyle='menucontext_entries_layout'>
        {content}
      </Box>
    </Box>
  </Draggable>
}

export const OpenSankeySaveButton: FunctionComponent<OpenSankeySaveButtonFType> = ({
  ComponentUpdater,
  applicationContext
}) => {
  const last_save = localStorage.getItem('last_save')
  const has_save_in_cache = last_save !== undefined && last_save !== null

  const [forceUpdate, setForceUpdate] = useState(true)
  ComponentUpdater.updateComponenSaveInCache.current = (b: boolean) => setForceUpdate(b)
  let indicator_saved_data = <></>
  if (has_save_in_cache) {
    const color_icon = forceUpdate ? 'tertiaire.3' : 'tertiaire.1'
    indicator_saved_data = <Box
      color={color_icon}
    >
      <FontAwesomeIcon
        style={{ 'height': '0.75em', 'width': '0.75rem' }}
        icon={forceUpdate ? faCheck : faExclamation}
      />
    </Box>

  }
  return <OSTooltip
    placement='bottom'
    label={applicationContext.t('Menu.tooltips.checkpoint')}
  >
    <Button
      variant='menutop_button_save_in_cache'
      onClick={() => {
        const ev = document; const tmp = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
        if (ev.onkeydown) {
          ev.onkeydown(tmp)
        }
      }}
    >
      <Box
        display='grid'
        gridTemplateColumns='3fr 1fr'
        gridTemplateRows='1fr'
      >
        <Box
          gridColumn='1'
          alignSelf='center'
          justifySelf='end'
        >
          <FontAwesomeIcon
            style={{ 'height': '2.5rem', 'width': '2rem' }}
            icon={faCloudArrowUp}
          />
        </Box>
        <Box
          gridColumn='2'
          alignSelf='end'
          justifySelf='start'
        >
          {indicator_saved_data}
        </Box>
      </Box>
    </Button>
  </OSTooltip>
}

const clickSavePDF = (data: SankeyData) => {
  const svg = pre_process_export_svg()
  const html = ((svg.attr('title', 'test2')
    .attr('version', 1.1)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .node() as HTMLElement).parentNode as HTMLElement).innerHTML

  const blob = new Blob([html], { type: 'image/svg+xml' })
  const form_data = new FormData()
  form_data.append('html', blob)
  form_data.append('width', data.width.toString())
  form_data.append('height', data.height.toString())

  post_process_export_svg()

  const path = window.location.origin
  let url = path + '/opensankey/sankey/save_pdf'
  const fetchData = {
    method: 'POST',
    body: form_data
  }

  const showFile = (blob: BlobPart) => {
    const newBlob = new Blob([blob], { type: 'application/pdf' })
    FileSaver.saveAs(newBlob, 'sankey_diagram.pdf')
  }
  const cleanFile = () => {
    const fetchData = {
      method: 'POST'
    }
    url = path + '/opensankey/sankey/clean_pdf'
    fetch(url, fetchData)
  }

  fetch(url, fetchData).then(
    r => r.blob()
  )
    .then(showFile).then(cleanFile)
}

export const pre_process_export_svg = () => {
  // Resize the svg scale to be the scale by default
  const svg = d3.select(' .opensankey#svg-container svg')
  // svg.attr('transform','scale(1)')
  // svg.select('#g_legend').attr('transform','scale(1)')

  // Get size of g elements that contain visual content
  // const g_nodes=document.getElementById('g_nodes')
  // const size_nodes = (g_nodes) ? [(g_nodes.getBoundingClientRect().width+g_nodes.getBoundingClientRect().x),(g_nodes.getBoundingClientRect().height+g_nodes.getBoundingClientRect().y)] : [0,0]

  // const g_links=document.getElementById('g_links')
  // const size_links = (g_links) ? [(g_links.getBoundingClientRect().width+g_links.getBoundingClientRect().x),(g_links.getBoundingClientRect().height+g_links.getBoundingClientRect().y)] : [0,0]

  // const g_label=document.getElementById('g_label')
  // const size_label = (g_label) ? [(g_label.getBoundingClientRect().width+g_label.getBoundingClientRect().x),(g_label.getBoundingClientRect().height+g_label.getBoundingClientRect().y)] : [0,0]

  // Search the element that go to the most bottom right of the sankey
  // const export_dim_unscaled=[Math.max(size_nodes[0],size_links[0],size_label[0]),Math.max(size_nodes[1],size_links[1],size_label[1])]
  // Resize the svg width and height with the minimum value it require to display the elements
  // svg.style('width',export_dim_unscaled[0]+'px')
  // svg.style('height',export_dim_unscaled[1]+'px')

  // Hidde non-essential visual elements
  svg.selectAll('.sankey-tooltip').remove()
  svg.selectAll('text[visibility=hidden]').remove()
  svg.style('border', '0px')
  svg.select('#grid').style('opacity', '0')
  svg.selectAll('.box_width_threshold').remove()
  d3.selectAll('.gg_nodes .node_shape').style('stroke-width', null)
  d3.selectAll('.gg_nodes .node_shape').style('stroke', null)
  d3.selectAll(' .opensankey .gg_link_handles rect.handle').attr('display', 'none')
  d3.selectAll(' .opensankey .gg_link_handles .drag_zone').attr('cursor', 'pointer').attr('stroke-opacity', '0')
  d3.selectAll(' .opensankey .gg_link_handles .center_handle').attr('display', 'none').attr('fill-opacity', '0')
  d3.selectAll('.opensankey .gg_label rect').attr('stroke-width', '1')
  d3.selectAll('.opensankey .fo_input_label').remove()

  // To hide handles from OpenSankey+ zdt
  d3.selectAll(' .opensankey .g_label_handles .zdt_handles').attr('stroke-opacity', '0').attr('fill-opacity', '0')

  return svg
}

export const post_process_export_svg = () => {
  d3.select(' .opensankey#svg-container svg').select('#grid').style('opacity', '1')
  d3.select(' .opensankey#svg-container svg').style('border', '2px')
}

// export const ToastWaitFunc=({
//   applicationData,
//   dict_hook_ref_setter_show_dialog_components,
//   applicationContext}:ToastWaitFuncFType
// )=>{
//   const [show_toast_wait,set_show_toast_wait]=useState(false)
//   dict_hook_ref_setter_show_dialog_components.ref_setter_show_waiting.current=set_show_toast_wait

//   return     <Toast onEntered={()=>{
//     setTimeout(()=>{
//       applicationData.function_on_wait.current()
//       applicationData.function_on_wait.current=()=>null
//       set_show_toast_wait(false)
//     },50
//     )
//   }} className='toast_waiting' show={show_toast_wait} onClose={()=>set_show_toast_wait(false)} bg='info' style={{ 'width':'auto', 'position': 'fixed', 'right':'0','top':window.innerHeight-150, 'zIndex': 4 }}>
//     <Toast.Body>
//       <Spinner/>
//       {applicationContext.t('Menu.waiting')}</Toast.Body>
//   </Toast>
// }

export const launchToastConstructor = (
  applicationData: applicationDataType,
  toast: CreateToastFnReturn,
  intake?: textForToastPromiseType
) => {
  intake?.success
  const defaultToastText = {
    success: { title: (intake?.success) ? intake?.success : 'Terminé', description: '' },
    error: { title: 'Echec de la sauvegarde', description: '' },
    loading: { title: (intake?.loading) ? intake?.loading : 'Sauvegarde', description: 'Veuillez patienter' },
  }
  const tmp = new Promise((resole) => {
    setTimeout(() => {
      applicationData.function_on_wait.current()
      resole(200)
    }, 50)
  })

  toast.promise(tmp, defaultToastText)
}


export const ModalTuto: FunctionComponent<ModalTutoType> = ({
  applicationData,
  applicationContext,
  processFunctions,
  formations_menu,
  show_tuto,
  set_show_tuto,
  Reinitialization
}) => {
  const { convert_data } = applicationData

  // Pré-traitement du menu tuto pour trier les groupes
  const n_a = new Array(50)

  Object.keys(formations_menu).map(d => {
    return d.replace('_', '__').split('__')
  }).forEach(element => {
    if (element.length > 1) {
      n_a[Number(element[0])] = element[0] + '_' + element[1]
    } else {
      n_a[n_a.length - 1] = element[0]
    }
  })

  // Return l'objet formations_menu mais trier selon le numéro du groupe (quand il y en a un)
  const new_array_for_exemple = Object.fromEntries(n_a.filter(f => f).map((d) => {
    return [d, (formations_menu as { [k: string]: string })[d]]
  }))

  const tuto_sub_nav: { [s: string]: JSX.Element } = {}

  Object.entries(new_array_for_exemple).forEach(d => {
    if ((d[1] as { ['Files']: string[] })['Files'] == undefined) {
      return <></>
    }
    tuto_sub_nav[d[0]] = <>
      {(d[1] as { ['Files']: string[] })['Files'].filter((f: string) => !f.includes('.xlsx')).map((dd: string) => {
        return <Card variant='card_icon_not_selected'>
          <CardBody>
            <Stack>
              <Image className='img-card'
                src={'/fm/userfiles/Formations/Tutoriels/' + (d[0]) + '/images/' + (dd.replace('.json', '')) + '.png'}
                style={{ 'objectFit': 'contain' }}
              />
              <Heading>{dd.replace('.json', '').replaceAll('_', ' ')}</Heading>
            </Stack>
          </CardBody>
          <CardFooter>
            <ButtonGroup>
              {/* Button to open directly the JSON file */}
              <Button variant='toolbar_button_6'
                onClick={() => {
                  UploadExemple(
                    ('Formations/Tutoriels/' + (d[0]) + '/' + dd), applicationContext.url_prefix, applicationData.data, applicationData.set_data, Reinitialization, convert_data, applicationData.get_default_data
                  )
                  applicationData.set_data({ ...applicationData.data })
                  set_show_tuto(false)
                }}
              >{applicationContext.t('useTutoJSON')}</Button>

              {/* Button to open the Excel file */}
              {(d[1] as { ['Files']: string[] })['Files'].includes(dd.replace('.json', '.xlsx')) ?
                <Button variant='toolbar_button_6'
                  onClick={() => {
                    processFunctions.launch('Formations/Tutoriels/' + (d[0]) + '/' + dd.replace('.json', '.xlsx'))
                    UploadExemple(
                      'Formations/Tutoriels/' + (d[0]) + '/' + dd.replace('.json', '.xlsx'), applicationContext.url_prefix, applicationData.data, applicationData.set_data, Reinitialization, convert_data, applicationData.get_default_data
                    )
                    set_show_tuto(false)
                  }
                  }
                >{applicationContext.t('useTutoExcel')}</Button>
                : <></>}

              {/* Button to open the Excel file reconcilied */}
              {(d[1] as { ['Files']: string[] })['Files'].includes(dd.replace('.json', '_reconciled.xlsx')) ?
                <Button variant='toolbar_button_6'
                  onClick={() => {
                    processFunctions.launch('Formations/' + (d[0]) + '/' + dd.replace('.json', '_reconciled.xlsx'))
                    UploadExemple(
                      'Formations/Tutoriels/' + (d[0]) + '/' + dd.replace('.json', '_reconciled.xlsx'), applicationContext.url_prefix, applicationData.data, applicationData.set_data, Reinitialization, convert_data, applicationData.get_default_data
                    )
                    set_show_tuto(false)
                  }
                  }
                >{applicationContext.t('useTutoExcel')}</Button>
                : <></>}

            </ButtonGroup>
          </CardFooter>
        </Card>
      })}

    </>

  })

  return <Modal size='full' id='modal_tutoriel' isOpen={show_tuto} onClose={() => set_show_tuto(false)}>
    <ModalContent
      maxWidth='inherit'
      display='flex'
    >
      <ModalHeader>{applicationContext.t('Menu.formation')}</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Tabs variant='tabs_navbar'>
          <TabList>
            {Object.keys(tuto_sub_nav).map(m => {
              return <Tab>
                {(m.split('_').length > 1) ? m.split('_').filter(s => isNaN(+s)).join(' ') : m}
              </Tab>
            })}
          </TabList>
          <TabPanels>
            {Object.keys(tuto_sub_nav).map(m => {
              return <TabPanel>
                <Box layerStyle='options_4cols' >
                  {tuto_sub_nav[m]}
                </Box>
              </TabPanel>
            })}
          </TabPanels>
        </Tabs>
      </ModalBody>
    </ModalContent>
  </Modal>
}
