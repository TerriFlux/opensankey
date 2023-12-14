/* eslint @typescript-eslint/no-var-requires: "off" */
import * as d3 from 'd3'
import React, { ChangeEvent, FunctionComponent, useRef, useState, Ref, CSSProperties} from 'react'
import PropTypes, { InferProps, ReactElementLike } from 'prop-types'
import {
  Accordion,
  Button,
  ButtonGroup,
  Card,
  Col,
  Container,
  Dropdown,
  Form,
  FormCheck,
  FormGroup,
  FormLabel,
  Modal,
  Nav,
  Navbar,
  Offcanvas,
  OverlayTrigger,
  Pagination,
  Popover,
  Row,
  ToggleButton,
  Tooltip
} from 'react-bootstrap'
import {
  SankeyData,
  SankeyDataPropTypes,
  SankeyLink,
  SankeyLinkValue,
  SankeyNode,
  TagsCatalog,
  TagsGroup
} from './types'

import { complete_sankey_data } from './SankeyConvert'
import { FaAngleDoubleLeft,FaAngleDoubleRight} from 'react-icons/fa'
import * as SankeyUtils from './SankeyUtils'
import SankeyLoad from './SankeyLoad'
import { SankeyConfigurationMenu } from './SankeyMenuConfiguration'
import { ExcelModal,ApplyLayoutDialog,ApplySaveJSONDialog } from './SankeyMenuDialogs'
import { reorganize_node_inputLinksId,reorganize_node_outputLinksId } from './SankeyLayout'
import { TFunction } from 'i18next'
import { MultiSelect } from 'react-multi-select-component'
import { faFloppyDisk,faGears,faFolderOpen, faDownload, faFileInvoice, faPenToSquare,faUpRightFromSquare,faFile,faPlus} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { addAllDropDownNode } from './SankeyMenuBanner'
import { reorganize_inputLinksId } from './SankeyLayout'
import { handleUpLink,handleDownLink } from './SankeyMenuConfigurationLinksAppearence'
import { arrangeNodes, compute_auto_sankey } from './SankeyLayout'
import Draggable from 'react-draggable'
import CloseButton from 'react-bootstrap/CloseButton'
import { SelectVisualyLinks} from './SankeyDrawFunction'


declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      header?: string
      welcome_text: string
    }
  }
/**
 * Description placeholder
 *
 * @export
 * @typedef {selected_type}
 */
export type selected_type = {'label':string;'value':string}
export const menu_config_width=450
/**
 * Variable that define the Menu element, it's variable and function
 *
 * @type {{ data: any; set_data: any; right_menu: any; settings_edition: any; settings_edition_node_tags: any; settings_edition_link_tags: any; settings_edition_data_tags: any; ... 39 more ...; launch: any; }}
 */



const GoToUserDoc = () => {
  const path = window.location.href
  const url = path + 'doc'
  fetch(url, {
    method:'GET'
  }).then((response) => {
    if(response.redirected){
      return window.open(response.url, '_blank')
    }
  }).then( win => win?.focus() )
}


/**
 *
 *
 * @param {React.ChangeEvent<HTMLSelectElement>} evt
 * @param {TagsGroup} tags_group
 * @param {SankeyData} data
 * @param {(data: SankeyData) => void} set_data
 * @returns {(void) => void}
 */
const handleSimpleDropdown = (evt: React.ChangeEvent<HTMLSelectElement>, tags_group: TagsGroup, data: SankeyData, set_data: (data: SankeyData) => void) => {
  const val = evt.target.value
  Object.entries(tags_group.tags).forEach(tag => tag[1].selected = val === tag[0])
  set_data({ ...data })
}

/**
 *
 *
 * @param {[{ label: string, value: string }]} selected
 * @param {TagsGroup} tags_group
 * @param {SankeyData} data
 * @param {(data: SankeyData) => void} set_data
 * @returns {(void) => void}
 */
const HandleMultiDropdown = (selected: [{ label: string, value: string }], tags_group: TagsGroup, data: SankeyData, set_data: (data: SankeyData) => void) => {
  const tab_sel = selected.map((d) => {
    return d.value
  })
  Object.entries(tags_group.tags).forEach(tag => tag[1].selected = tab_sel.includes(tag[1].name))
  // Permet d'eviter de désélectionner tous les dataTags ce qui créerait une erreur
  if(tab_sel.length==0 && Object.values(data.dataTags).map(dt=>dt.group_name).includes(tags_group.group_name)){
    Object.entries(tags_group.tags)[0][1].selected=true
  }
  set_data({ ...data })
}

/**
 * Function that generate dropdown for each groupTag of linkTags
 *
 * @param {TagsCatalog} fluxTags
 * @param {SankeyData} data
 * @param {(data: SankeyData) => void} set_data
 * @returns {(void) => any}
 */
export const AddAllDropDownFlux = (
  t:TFunction,
  fluxTags: TagsCatalog,
  data: SankeyData,
  set_data: (data: SankeyData) => void) =>
{
  const banner_grouptag = Object.values(fluxTags).filter(tags_group => { return ((tags_group as TagsGroup).banner == 'one' || (tags_group as TagsGroup).banner == 'multi') })
  const allDD = banner_grouptag.map(tags_group => {
    const the_tags_group = tags_group as TagsGroup
    const tags_selected=Object.entries(data['fluxTags']).filter((k)=>{return k[1]==the_tags_group})[0]

    if (the_tags_group.banner == 'one') {
      return (
        <FormGroup as={Row}>
          <Row>
            <Col xs={10}>
              <FormLabel>{the_tags_group.group_name}</FormLabel>
            </Col>
          </Row>
          <Row>
            <OverlayTrigger
              key={'Banner.ndd_lst.1'}
              placement={'bottom'}
              delay={500}
              overlay={<Tooltip id={'Banner.ndd_lst.1'}>{t('Banner.ndd_lst')} </Tooltip>}>
              <Col xs={10}>
                {<Form.Select
                  key={the_tags_group.group_name}
                  placeholder='all'
                  onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                    handleSimpleDropdown(evt, the_tags_group, data, set_data) }}>{
                    Object.entries(the_tags_group.tags).map(([tag_key, tag],i) => {
                      return (<option key={i} value={tag_key}>{tag.name}</option>)
                    })}
                </Form.Select>}
              </Col>
            </OverlayTrigger>
            <Col xs={2} >
              <OverlayTrigger
                key={'Banner.ndd_chk.1'}
                placement={'bottom'}
                delay={500}
                overlay={<Tooltip id={'Banner.ndd_chk.1'}>{t('Banner.ndd_chk')} </Tooltip>}>
                <FormCheck
                  inline
                  type='switch'
                  checked={data.colorMap==tags_selected[0]}
                  onChange={evt => {
                    Object.values(data.nodeTags).forEach(tags_group => tags_group.show_legend = false)
                    Object.values(data.fluxTags).forEach(tags_group => tags_group.show_legend = false)
                    Object.values(data.dataTags).forEach(tags_group => tags_group.show_legend = false)

                    Object.values(data.nodes).forEach(el => {
                      el.colorParameter = 'local'
                      el.colorTag = 'no_colormap'
                    })

                    Object.values(data.links).forEach(el => {
                      el.colorTag = 'no_colormap'
                    })
                    data.colorMap = 'no_colormap'

                    if(evt.target.checked){
                      Object.values(data.nodes).forEach(el => {
                        el.colorParameter = 'groupTag'
                        el.colorTag = tags_selected[0]
                      })
                      Object.values(data.links).forEach(el => {
                        el.colorTag = tags_selected[0]
                      })
                      data.colorMap = tags_selected[0]
                      data.fluxTags[tags_selected[0]].show_legend = true
                    }

                    set_data({ ...data })
                  }}
                />
              </OverlayTrigger>
            </Col>
          </Row>
        </FormGroup>)
    }
    else if (the_tags_group.banner == 'multi') {
      const options = Object.entries(the_tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
      const selected = Object.entries(the_tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
      return (
        <FormGroup as={Row}>

          <Row>
            <Col xs={10}>
              <FormLabel>{the_tags_group.group_name}</FormLabel>
            </Col>
          </Row>

          {/* Liste déroulante des groupe de filtre  */}
          <Row>
            <OverlayTrigger
              key={'Banner.ndd_lst.2'}
              placement={'bottom'}
              delay={500}
              overlay={<Tooltip id={'Banner.ndd_lst.2'}>{t('Banner.ndd_lst')} </Tooltip>}>
              <Col xs={10}>
                <MultiSelect
                  className={'multidropdown_filter_node_link'}
                  style={{ color: 'black',width:'200px' }}
                  valueRenderer={(selected: selected_type[]) => {
                    return selected.length ? selected.map(({ label }) => label + ', ') : 'Aucun tag sélectionné'
                  }}
                  labelledBy={'dropdown_node_filter'}
                  overrideStrings={{
                    'selectAll': 'Tout sélectionner',
                  }}
                  value={selected}
                  options={options}
                  onChange={(selected: [{ label: string, value: string }]) => {
                    HandleMultiDropdown(selected, the_tags_group, data, set_data)
                  }}
                />
              </Col>
            </OverlayTrigger>

            {/* Appliquer le filtrage  */}
            <Col xs={2}>
              <OverlayTrigger
                key={'Banner.ndd_chk.2'}
                placement={'bottom'}
                delay={500}
                overlay={<Tooltip id={'Banner.ndd_chk.2'}>{t('Banner.ndd_chk')} </Tooltip>}>
                <FormCheck
                  inline
                  type='switch'
                  checked={data.colorMap==tags_selected[0]}
                  onChange={evt => {
                    Object.values(data.nodeTags).forEach(tags_group => tags_group.show_legend = false)
                    Object.values(data.fluxTags).forEach(tags_group => tags_group.show_legend = false)
                    Object.values(data.dataTags).forEach(tags_group => tags_group.show_legend = false)

                    Object.values(data.nodes).forEach(el => {
                      el.colorParameter = 'local'
                      el.colorTag = 'no_colormap'
                    })

                    Object.values(data.links).forEach(el => {
                      el.colorTag = 'no_colormap'
                    })
                    data.colorMap = 'no_colormap'
                    if(evt.target.checked){
                      Object.values(data.nodes).forEach(el => {
                        el.colorParameter = 'groupTag'
                        el.colorTag = tags_selected[0]
                      })
                      Object.values(data['links']).forEach(el => {
                        el.colorTag = tags_selected[0]
                      })
                      data.colorMap = tags_selected[0]
                      data['fluxTags'][tags_selected[0]].show_legend = true
                    }
                    set_data({ ...data })
                  }}
                />
              </OverlayTrigger>
            </Col>
          </Row>
        </FormGroup>)
    }
  })
  return (<>{allDD.map((c,i)=>{return <React.Fragment key={i}>{c}</React.Fragment>})}</>)
}

// Logo for sub-nav 'aide'
const logo_home=<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox='0 0 1000 1000'
  height='1.6rem'
  width='1.6rem'
><path 
    d='m 162.74,976.43485 -10.47133,-9.79617 V 766.1038 565.56892 h -45.83039 c -50.763748,0 -66.86203,-5.17542 -80.570758,-25.90272 C 13.167748,520.46444 10.955002,498.30818 19.718259,478.09335 30.219727,453.86882 469.64661,19.352705 487.72193,15.319776 c 26.45493,-5.9025653 35.08525,0.500299 137.16415,101.762594 54.73533,54.29743 100.44482,98.7226 101.5767,98.7226 1.13189,0 2.05795,-13.67075 2.05795,-30.37945 0,-27.18977 1.09936,-31.408 10.4713,-40.17559 9.19405,-8.60121 15.85948,-9.7778 54.64454,-9.64581 66.26282,0.2255 66.00422,-0.25812 66.10665,123.61063 l 0.075,91.29661 59.36176,58.38021 c 45.073,44.32769 60.43581,62.25057 63.82369,74.45937 5.39968,19.45846 2.1815,39.62415 -9.02804,56.57281 -13.53183,20.45968 -29.78886,25.64517 -80.40047,25.64517 H 847.74475 V 766.1038 966.63868 l -10.47131,9.79617 c -9.9428,9.30163 -15.35862,9.79606 -107.30211,9.79606 h -96.8303 v -145.7793 c 0,-142.54209 -0.20069,-146.23082 -9.04087,-166.11263 -15.83064,-35.6037 -23.26302,-37.87197 -124.09321,-37.87197 -100.83021,0 -108.26257,2.26827 -124.09319,37.87197 -8.84013,19.88181 -9.04089,23.57054 -9.04089,166.11263 v 145.7793 H 270.0421 c -91.94345,0 -97.35929,-0.49443 -107.3021,-9.79606 z'
  /></svg>

const logo_tuto=<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox='0 0 1000 1000'
  height='1.8rem'
  width='1.8rem'
><path 
    d='m 157.33319,886.51985 v -16.01023 l 16.97603,-16.89738 16.97603,-16.89737 H 313.68261 436.07997 V 802.89555 769.07623 L 251.70059,768.53613 67.321219,767.99604 56.674641,763.61283 C 34.844761,754.62541 18.748122,738.52877 9.7607064,716.69889 L 5.3774908,706.05232 4.8534663,440.05798 C 4.5089043,265.1623 5.0063898,170.35909 6.305737,163.24694 11.007769,137.51176 27.829518,116.02052 52.370849,104.39479 L 65.385477,98.229492 462.21248,97.6364 c 298.75308,-0.446517 399.45825,-0.03058 407.47358,1.683224 31.55142,6.745946 56.78277,33.138756 61.97135,64.824086 1.57151,9.59677 2.91788,175.10714 1.42418,175.07528 -0.26616,-0.006 -7.64273,-6.75659 -16.39238,-15.002 L 900.78076,309.22531 900.23541,236.635 c -0.53123,-70.71009 -0.65643,-72.79798 -4.83401,-80.6092 -5.36123,-10.02443 -18.44799,-21.3963 -27.52458,-23.91774 -4.45441,-1.23742 -146.57944,-1.90598 -400.82499,-1.88552 -377.912017,0.0304 -394.241158,0.17615 -401.741285,3.58294 -9.848569,4.47361 -22.73902,18.95834 -25.716848,28.89746 -3.263312,10.89194 -3.263312,431.2049 0,442.09686 2.977828,9.9391 15.868279,24.42383 25.716848,28.89746 7.447901,3.38314 19.283682,3.55323 250.089265,3.59372 l 242.27136,0.0426 8.26774,10.16264 c 39.81042,48.93466 86.73175,77.17761 148.88783,89.61872 12.97735,2.59753 23.22843,3.10065 48.51754,2.38121 l 32.06372,-0.91214 7.61898,13.72656 c 4.19044,7.54958 7.90932,14.38509 8.2642,15.18999 0.3549,0.80488 -69.11402,1.46344 -154.37538,1.46344 l -155.02062,-8e-5 v 33.87548 33.87548 h 122.39736 122.39734 l 16.97604,16.89737 16.97603,16.89738 v 16.01023 16.01022 H 468.98757 157.33319 Z m 768.76727,-10.5051 c -8.0362,-2.84054 -25.47372,-17.29199 -25.41455,-21.06245 0.0263,-1.67308 81.2109,-49.52544 86.0779,-50.73658 3.04952,-0.75887 6.85709,8.13021 8.14672,19.0192 4.32998,36.55983 -33.21802,65.36051 -68.81007,52.77983 z m -54.2842,-70.55702 c -9.94227,-17.19142 -25.2893,-43.68312 -34.10451,-58.87048 L 821.6841,718.97387 866.11556,693.4222 c 24.43733,-14.05342 44.70148,-25.23606 45.03147,-24.85033 4.45712,5.21009 66.89808,116.31638 66.09724,117.61219 -1.03829,1.67997 -84.66224,50.53081 -86.49978,50.53081 -0.46826,0 -8.98595,-14.0657 -18.92823,-31.25714 z M 716.58567,704.12296 c -41.47063,-7.82194 -80.1009,-28.93612 -110.08701,-60.17035 -40.72128,-42.41624 -60.25344,-94.37985 -57.42247,-152.7676 5.35255,-110.39429 94.89916,-196.47776 204.3821,-196.47776 76.22482,0 144.20386,38.9682 181.18546,103.86246 14.94672,26.22808 22.46947,50.1885 26.28077,83.7059 3.85981,33.94388 -3.22285,73.11675 -19.50015,107.8516 -25.3021,53.99326 -74.55712,94.65924 -134.64991,111.16984 -20.09526,5.5212 -67.94915,7.02063 -90.18879,2.82591 z m 77.36787,-34.92608 C 893.64301,646.51334 951.20766,541.83855 917.88501,443.84162 892.4106,368.92511 813.74876,319.69876 735.15203,329.4878 c -58.48961,7.28476 -108.53449,42.896 -135.23102,96.2285 -11.00488,21.9848 -15.0218,38.75281 -16.1851,67.56202 -1.2159,30.11203 2.01944,49.79719 12.00595,73.04935 9.77629,22.76271 17.83147,35.07943 34.58502,52.88192 27.34125,29.05306 60.6076,46.55456 100.95366,53.11193 13.91373,2.26137 46.04218,0.65956 62.673,-3.12464 z M 141.84726,493.12075 v -16.4538 h 159.69868 159.69867 v 16.4538 16.45381 H 301.54594 141.84726 Z m 0,-77.42965 v -16.45381 h 159.69868 159.69867 v 16.45381 16.4538 H 301.54594 141.84726 Z m 0,-77.42966 v -16.45381 h 159.69868 159.69867 v 16.45381 16.4538 H 301.54594 141.84726 Z m 0,-77.42967 v -16.4538 h 214.86731 214.8673 v 16.4538 16.4538 H 356.71457 141.84726 Z'
  /></svg>

const logo_doc=<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox='0 0 1000 1000'
  height='1.8rem'
  width='1.8rem'
><path 
    d='m 3.014475,553.90339 v -295.3514 h 22.539401 22.539401 l 0.889917,-9.01103 c 0.938053,-9.49844 1.697873,-9.96018 27.159151,-16.50472 l 12.069649,-3.10235 v -13.88646 -13.88645 l 15.390076,-3.44414 c 20.94496,-4.68729 21.99646,-5.65706 22.97408,-21.18857 0.48926,-7.77285 2.52048,-14.51777 4.74737,-15.76398 2.14073,-1.19802 14.64756,-4.35751 27.79294,-7.0211 28.51362,-5.77761 76.82539,-4.54191 112.27019,2.87158 56.44782,11.80642 136.27023,45.20052 199.5978,83.5028 l 29.20273,17.66261 25.13289,-15.54656 c 114.20296,-70.64306 235.55834,-104.70156 315.41298,-88.52093 13.22816,2.68037 25.81246,5.85906 27.96512,7.06375 2.20113,1.23182 4.38724,8.19745 4.99553,15.91734 1.23968,15.73323 1.93222,16.37448 22.70423,21.02306 l 15.39008,3.44414 v 13.88645 13.88646 l 12.06965,3.10235 c 25.46127,6.54454 26.22109,7.00628 27.15916,16.50472 l 0.88991,9.01103 h 22.5394 22.5394 v 295.3514 295.3514 H 500 3.014475 Z M 387.82326,823.52662 C 278.65582,801.38742 131.21779,794.63196 57.682883,808.39997 l -9.229731,1.72809 V 544.27973 278.43141 h -9.939711 -9.93971 v 275.47198 275.47198 l 192.404389,-0.33267 192.4044,-0.33264 z M 971.42627,553.90339 V 278.43141 h -9.93971 -9.93971 v 265.88726 265.88726 l -9.22973,-1.85526 c -67.65746,-13.59969 -224.76983,-6.39638 -330.14039,15.1363 l -25.55926,5.22309 192.4044,0.33264 192.4044,0.33267 z m -482.78594,-6.8392 V 270.43281 l -20.5894,-13.18241 c -29.36086,-18.79838 -87.44168,-47.83 -125.31723,-62.6396 -45.56636,-17.81676 -84.59818,-26.90194 -124.1853,-28.90573 -32.42947,-1.6415 -68.84629,2.35551 -72.29452,7.93484 -0.83923,1.35791 -2.67248,78.84644 -4.07389,172.19677 -1.40142,93.3503 -3.32242,214.59222 -4.26891,269.42645 l -1.7209,99.69862 37.7791,1.59106 c 78.41327,3.3024 172.09513,32.48397 270.65233,84.30726 23.42932,12.31959 42.91825,22.4974 43.30874,22.61736 0.39049,0.11984 0.70998,-124.26601 0.70998,-276.41324 z M 319.98264,660.76934 c -56.29196,-14.00963 -59.73065,-15.25428 -67.34608,-24.37638 -14.52914,-17.40355 -13.63754,-42.87511 1.85614,-53.02696 6.39785,-4.19203 9.64796,-4.46767 22.13613,-1.87738 8.05048,1.66981 14.81585,2.85556 15.03412,2.63496 0.21839,-0.22067 0.85726,-36.7117 1.41996,-81.09134 l 1.02308,-80.69029 -14.19958,-4.73247 c -16.5737,-5.52369 -26.97922,-18.29034 -26.97922,-33.10114 0,-9.42676 7.97719,-20.87941 14.54325,-20.87941 1.75098,0 21.23991,5.26095 43.30874,11.69098 39.33174,11.4598 47.74133,15.57995 53.40674,26.16586 1.72593,3.22495 2.68344,43.48691 2.47383,104.02313 l -0.34196,98.76182 7.98821,1.59762 c 18.11114,3.62223 31.97673,22.39755 31.97673,43.29951 0,11.54355 -12.68731,27.03576 -21.79092,26.60846 -2.85355,-0.13404 -31.8827,-6.88708 -64.50917,-15.00697 z M 310.70165,356.5 c -30.63984,-18.36594 -42.18408,-64.73432 -21.13705,-84.89867 16.41341,-15.72505 40.97395,-11.70563 61.90579,10.13112 12.2808,12.81172 17.89342,27.42565 17.89342,46.59029 0,14.40355 -0.96058,16.95533 -9.65572,25.65047 -8.33905,8.33905 -11.5339,9.65206 -23.42932,9.62886 -9.5915,-0.0199 -17.35751,-2.17512 -25.57712,-7.10207 z m 332.71418,403.70529 c 71.92511,-28.47389 125.38833,-41.24275 182.8034,-43.65966 l 37.96763,-1.59828 -1.74333,-82.65193 c -0.95881,-45.45853 -2.40501,-138.24329 -3.21379,-206.18831 -1.63732,-137.55494 -4.27956,-250.38977 -5.92762,-253.13441 -0.59504,-0.99093 -9.58909,-3.4069 -19.98679,-5.3688 -27.10125,-5.11364 -77.70111,-1.99326 -114.20793,7.04296 -51.89509,12.84515 -125.75469,45.1696 -183.60844,80.35575 l -22.71934,13.8177 -0.72394,277.29177 -0.72393,277.29179 46.16261,-23.72935 c 25.38946,-13.05115 64.05411,-30.81231 85.92147,-39.46923 z M 611.96414,660.9378 c -6.35579,-5.46701 -7.5847,-8.77466 -7.36306,-19.81762 0.45737,-22.78506 12.52699,-38.35385 34.9394,-45.06875 l 10.97514,-3.28826 v -23.23308 c 0,-12.77821 -0.83533,-48.17471 -1.85626,-78.65892 l -1.85628,-55.42581 -12.82696,3.86035 c -11.2707,3.39197 -13.67023,3.30783 -19.7771,-0.69356 -6.23968,-4.08837 -6.80814,-6.03193 -5.5609,-19.01205 1.92535,-20.03775 8.16215,-24.47365 57.21629,-40.69483 55.16466,-18.24181 51.60707,-21.78531 53.95173,53.73845 3.83993,123.68848 4.74391,135.99305 9.84571,134.0182 13.95561,-5.40209 19.95539,-4.80244 27.50704,2.74921 6.80778,6.80779 7.48784,9.24856 6.36141,22.83183 -0.89296,10.76783 -3.48145,18.11995 -8.8642,25.17708 -7.00988,9.19046 -12.33766,11.53237 -68.30413,30.02401 -33.38567,11.0308 -62.06415,20.05603 -63.72996,20.05603 -1.66581,0 -6.46186,-2.95303 -10.65787,-6.56228 z m 35.71157,-302.28312 c -6.1835,-3.08901 -11.99874,-9.18364 -15.38832,-16.12767 -4.75953,-9.75057 -5.04861,-13.06921 -2.2858,-26.241 8.0103,-38.18939 44.93426,-64.44045 71.39408,-50.75753 33.96683,17.56491 13.52505,83.19123 -29.58067,94.96581 -14.21498,3.8829 -12.40845,4.02058 -24.13929,-1.83961 z M 389.24322,808.24783 c 0,-2.05292 -45.28981,-15.22991 -82.79086,-24.08786 -74.53076,-17.60454 -145.3032,-25.22173 -189.58268,-20.40464 -15.35668,1.67064 -30.08784,3.86891 -32.735921,4.88508 -4.498883,1.72639 -4.690095,-6.32708 -2.914891,-122.77425 4.938673,-323.95877 5.865764,-397.38914 5.039064,-399.11715 -0.490283,-1.02478 -5.363042,-0.49088 -10.828349,1.18646 l -9.936927,3.04973 v 270.76044 270.76042 l 16.329524,-2.15473 c 8.981238,-1.18513 47.63961,-2.08817 85.90749,-2.00675 71.03403,0.15109 124.09701,4.49571 187.43454,15.34649 16.40053,2.8097 30.77761,5.26521 31.94907,5.4567 1.17147,0.19141 2.12994,-0.21356 2.12994,-0.89994 z m 269.79215,-6.95246 c 21.08638,-3.10539 53.67443,-7.29429 72.41789,-9.30868 36.97958,-3.97426 156.62993,-5.07433 185.3046,-1.70372 l 17.74948,2.0864 V 521.32948 250.28962 l -10.07213,-1.88956 c -5.53966,-1.03924 -10.39112,-1.41664 -10.78098,-0.83866 -0.79731,1.18197 2.15746,234.07964 5.17972,408.27196 1.85663,107.01002 1.66806,114.58598 -2.80941,112.8678 -2.63982,-1.013 -16.82742,-3.18298 -31.52803,-4.82218 -44.98477,-5.01612 -122.82153,3.50517 -197.06197,21.57357 -35.61043,8.66678 -76.67777,20.97805 -76.67777,22.98666 0,0.79172 2.23644,0.77862 4.96986,-0.029 2.73342,-0.8077 22.22235,-4.00934 43.30874,-7.11473 z M 387.68127,789.80961 C 382.61014,784.83448 312.33065,758.1791 279.05321,748.60948 231.88474,735.04522 190.80988,729.17352 151.7621,730.41305 l -32.31102,1.0257 -0.0557,-25.57953 c -0.0307,-14.06873 1.47079,-131.32048 3.33645,-260.55943 1.86568,-129.23896 2.73694,-235.63513 1.93614,-236.43593 -0.80077,-0.8008 -5.32047,-0.10877 -10.04371,1.5377 l -8.58774,2.9937 -1.79682,90.0264 c -0.98826,49.51453 -2.45544,146.89575 -3.26042,216.40272 -0.805,69.50698 -2.206526,149.63905 -3.114532,178.07128 l -1.650901,51.69496 48.299893,0.11388 c 68.83167,0.16244 143.45592,11.8967 216.33028,34.01673 32.41754,9.83989 30.13303,9.32163 26.83722,6.08824 z m 316.79277,-22.70667 c 58.58866,-12.84239 97.08914,-17.24526 150.79981,-17.24526 h 48.36751 l -1.57081,-36.20894 c -0.86393,-19.91492 -2.23002,-102.66301 -3.03573,-183.88465 -0.80572,-81.22163 -2.28426,-185.6344 -3.28565,-232.02837 l -1.82072,-84.35264 -8.57025,-2.98759 c -4.71364,-1.64321 -9.2224,-2.33544 -10.01954,-1.53833 -0.79711,0.79714 0.0733,107.83226 1.93393,237.85588 1.86077,130.02363 3.35917,247.27839 3.32977,260.56613 l -0.0534,24.15958 -32.31102,-1.0257 c -39.04778,-1.23953 -80.12264,4.63217 -127.29111,18.19643 -32.60322,9.37574 -103.51518,36.18779 -108.4231,40.99518 -1.37113,1.34305 10.13053,-1.27959 25.55926,-5.82805 15.42871,-4.54847 45.30471,-12.05162 66.39111,-16.67367 z'
  /></svg>

const logo_contact=<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox='0 0 1000 1000'
  height='1.8rem'
  width='1.8rem'
><path 
    d='M 73.899976,875.90139 C 40.937168,869.42787 12.296795,840.1985 5.9081337,806.51127 c -2.7238299,-14.36281 -2.7238299,-598.39643 0,-612.75924 6.5424433,-34.49806 35.0100633,-62.96568 69.5081303,-69.50811 14.424371,-2.73553 834.743106,-2.73553 849.167476,0 34.49807,6.54243 62.96569,35.01005 69.50811,69.50811 2.72385,14.36281 2.72385,598.39643 0,612.75924 -6.54242,34.49807 -35.01004,62.96569 -69.50811,69.50811 -12.97147,2.46 -838.139611,2.34552 -850.683764,-0.11801 z M 757.27835,680.87137 618.28561,541.87862 568.34724,591.53493 c -41.79051,41.55444 -51.28209,50.05497 -58.17393,52.0997 -16.55644,4.91214 -19.12525,3.10924 -75.61314,-53.06836 L 383.65363,539.93937 243.69127,679.90173 103.72888,819.86411 H 499.99999 896.2711 Z M 204.56487,362.25953 C 129.15162,287.28205 66.237927,225.23952 64.756655,224.38723 c -2.2938,-1.3198 -2.693233,39.63262 -2.693233,276.13089 V 778.19865 L 201.87164,638.39044 341.67987,498.58221 Z M 937.93658,499.6489 V 222.06467 L 798.9048,361.09648 659.873,500.12826 798.41526,638.68068 c 76.19825,76.20385 138.76257,138.55244 139.0318,138.55244 0.26924,0 0.48952,-124.91291 0.48952,-277.58422 z M 699.59057,377.0831 896.26733,180.39919 H 500.48086 c -217.68253,0 -395.78644,0.30148 -395.78644,0.66997 0,1.39663 395.3274,392.69785 396.73839,392.69785 0.81457,0 89.98555,-88.50776 198.15776,-196.68391 z'
  /></svg>

export const OpenSankeyMenus = (
  t:TFunction,
  setShowPreference:(b:boolean)=>void,
  Reinitialization:()=>void,
  DefaultSankeyData:()=>SankeyData,
  set_show_apply_layout:(b:boolean)=>void,
  set_show_excel_dialog:(b:boolean)=>void,
  set_show_save_json:(b:boolean)=>void,
  showStyleEdition:()=>void,
  showStyleEditionLink:()=>void,
  set_show_welcome:(b:boolean)=>void,
  set_never_see_again:(b:boolean)=>void,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  set_show_modalTemplate:(b:boolean)=>void,
  set_show_modale_support:(b:boolean)=>void,
  external_edition_item:JSX.Element[],
  external_file_item:JSX.Element[],
  externale_save_item:JSX.Element[],
  set_tags_selected:(o:{[x:string]:string})=>void,
  convert_data:(d:SankeyData,DefaultSankeyData: ()=>SankeyData)=>void,
  set_show_modale_tuto:(b:boolean)=>void,
) => {
  const _load_json = useRef<HTMLInputElement>(null)
  const node_filter = Object.entries(data.nodeTags).filter(([, v]) => v.banner !== 'none' && v.banner !== 'level').length > 0
  const flux_filter = Object.entries(data.fluxTags).filter(([, v]) => v.banner !== 'none').length > 0
  const opacity_advanced =  !window.SankeyToolsStatic ? '0.3' : '0'
  const DT_length=Object.keys(data.dataTags).length




  // Function that return a simple or multiple dropdown of groupTag of data and links
  // This allow us to choose wich grouptag to select and wich tag of these group to display
  const addAllDropDownLinks = () => {
    const banner_grouptag = Object.entries(data.dataTags).filter(([, tags_group]) => { return (tags_group.banner == 'one' || tags_group.banner == 'multi') })
    const allDD = banner_grouptag.map(([, tags_group]) => {
      if (tags_group.banner == 'one') {
        let selected = ''
        if ( Object.entries(tags_group.tags).filter(([,v])=>v.selected).length>0 ) {
          selected = Object.entries(tags_group.tags).filter(([,v])=>v.selected)[0][0]
        }
        return (
          <>
            <FormLabel>{tags_group.group_name}</FormLabel>
            <FormGroup as={Row}>
              <Col xs={10}>
                {<Form.Select key={tags_group.group_name} placeholder='all' value={selected} onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                  const pl=Object.entries(data.links).map(l=>{
                    const suffixeStart= l[0].indexOf('_')
                    if(suffixeStart>=0){
                      l[0]=l[0].slice(0,suffixeStart)
                      l[1].idLink=l[0]
                      data.nodes[l[1].idSource].outputLinksId=data.nodes[l[1].idSource].outputLinksId.filter(nl=>nl.indexOf('_')==-1)
                      data.nodes[l[1].idTarget].inputLinksId=data.nodes[l[1].idTarget].inputLinksId.filter(nl=>nl.indexOf('_')==-1)

                      //Ajoute dans les noeuds source/target les id de flux
                      const ind_in_src=data.nodes[l[1].idSource].outputLinksId.indexOf(l[1].idLink)
                      if(ind_in_src==-1){
                        data.nodes[l[1].idSource].outputLinksId.push(l[0])
                      }
                      const ind_in_trgt=data.nodes[l[1].idTarget].inputLinksId.indexOf(l[1].idLink)
                      if(ind_in_trgt==-1){
                        data.nodes[l[1].idTarget].inputLinksId.push(l[0])
                      }
                    }
                    return l
                  })
                  // Reforme les flux originel (sans suffixe) et supprime les doublons par la méme occasions
                  const pureLinks=Object.fromEntries(pl)
                  data.links=pureLinks
                  handleSimpleDropdown(evt, tags_group,data,set_data)
                  const newEntries = new Map(Object.entries(data.dataTags).map(([dataTagKey, dataTag]) => {
                    return (Object.keys(dataTag.tags).length > 0) ? [
                      dataTagKey,
                      Object.entries(dataTag.tags).filter(tag => tag[1].selected).length > 0 ? Object.entries(dataTag.tags).filter(tag => tag[1].selected)[0][0] : Object.keys(dataTag.tags)[0]] : ['n', 'n']
                  }))
                  const dataTagsSelected = Object.fromEntries(newEntries)
                  set_tags_selected(dataTagsSelected)
                }}>
                  {
                    Object.entries(tags_group.tags).map(([tag_key, tag],i) => {
                      return (<option key={i} value={tag_key} >{tag.name}</option>)
                    })}
                </Form.Select>}
              </Col>
            </FormGroup>
          </>)
      }
      else if (tags_group.banner == 'multi') {
        const selected = Object.entries(tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
        const options = Object.entries(tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name ,'disabled':((selected.length<2 && tag[1].name==selected[0].label))} })
        return (
          <>
            <FormLabel>{tags_group.group_name}</FormLabel>
            <MultiSelect
              className={'multidropdown_filter_node_link'}
              style={{ color: 'black',width:'200px' }}
              labelledBy={'dropdown_link_filter'}
              overrideStrings={{
                'selectAll': 'Tout sélectionner',
              }}
              value={selected}
              options={options}
              onChange={(selected: [{ label: string, value: string }]) => {
                HandleMultiDropdown(selected, tags_group, data, set_data)

                //Multiplie les flux par le nombre de dataTags Sélectionné ( et si le lien à une valeur pour ce dataTags)
                if(Object.keys(data.dataTags).length>0){

                  const pl=Object.entries(data.links).map(l=>{
                    const suffixeStart= l[0].indexOf('_')
                    if(suffixeStart>=0){
                      l[0]=l[0].slice(0,suffixeStart)
                      l[1].idLink=l[0]
                      data.nodes[l[1].idSource].outputLinksId=data.nodes[l[1].idSource].outputLinksId.filter(nl=>nl.indexOf('_')==-1)
                      data.nodes[l[1].idTarget].inputLinksId=data.nodes[l[1].idTarget].inputLinksId.filter(nl=>nl.indexOf('_')==-1)
                    }
                    return l
                  })
                  // Reforme les flux originel (sans suffixe) et supprime les doublons par la méme occasions
                  const pureLinks=Object.fromEntries(pl)

                  const new_links={} as { [link_id: string]: SankeyLink }

                  Object.values(pureLinks).forEach(l=>{
                    const suffix=''
                    SankeyUtils.RecursionDataTag(data,data.dataTags,0,suffix,(l as SankeyLink),new_links)
                  })
                  data.links=new_links
                  set_data({...data})
                }
              }} />
          </>)
      }
    })
    return allDD
  }

  const legend_filter=<FormGroup as={Row}>
    <Col xs={9}>
      {t('Menu.group')}
    </Col>
    <Col xs={3}>
      {t('Menu.color')}
    </Col>
  </FormGroup>

  //Popover element to handle node tags
  // Its a list of dropdown for each groupNodeTag where we can choose wiche group to apply and wiche tag from these group to display when selected
  const filter_color_node=
  <Popover id='tooltip-link-color-filter' style={{maxWidth:'100%'}}>
    <Popover.Header as="h3">{t('Banner.fdn')}</Popover.Header>
    <Popover.Body style={{  marginLeft: '5px', width: menu_config_width+'px' }}>
      {legend_filter}
      <>{ (Object.entries(data.nodeTags).filter(([, v]) => v.banner !== 'none').length > 0) ? (<>
        {addAllDropDownNode(t,data,set_data,false)}</>
      ) : (<>
        <Form.Control placeholder="Pas de filtrage" style={{ opacity: opacity_advanced, color: '#6c757d' }} disabled /></>)
      }</>
    </Popover.Body>
  </Popover>

  //Popover element to handle the display of link tags
  const filter_color_link=
  <Popover id='tooltip-node-color-filter' style={{maxWidth:'100%'}}>
    <Popover.Header as="h3">{t('Banner.fdf')}</Popover.Header>
    <Popover.Body style={{  marginLeft: '5px', width: menu_config_width+'px' }}>
      {legend_filter}
      {AddAllDropDownFlux(t, data.fluxTags, data, set_data)}
    </Popover.Body>
  </Popover>

  //Popover element to handle the display of data tags
  const filter_data=
  <Popover id='tooltip-data-color-filter' style={{minWidth:'450px'}}>
    <Popover.Header as="h3">{t('Banner.sdd')}</Popover.Header>
    <Popover.Body>
      {legend_filter}
      <FormGroup as={Row}>
        <Col xs={10}>
          {addAllDropDownLinks()}
        </Col>
        <Col xs={2}>
          <FormCheck
            type='switch'
            style={{marginLeft: '-2em'}}
            checked={(DT_length>0)?(Object.values(data.dataTags).slice(DT_length-1,DT_length)[0].show_legend):false}
            onChange={evt=> {
              //Déselecitonne tous les type de tag
              Object.values(data.nodeTags).forEach(tags_group => tags_group.show_legend = false)
              Object.values(data.fluxTags).forEach(tags_group => tags_group.show_legend = false)
              Object.values(data.dataTags).forEach(tags_group => tags_group.show_legend = false)

              Object.values(data.nodes).forEach(el => {
                el.colorParameter = 'local'
                el.colorTag = 'no_colormap'
              })

              Object.values(data.links).forEach(el => {
                el.colorTag = 'no_colormap'
              })

              data.colorMap = 'no_colormap'

              //Met le dernier dataTag en tant que couleur a suivre pour les flux
              if(evt.target.checked){
                Object.values(data.nodes).forEach(el => {
                  el.colorParameter = 'groupTag'
                  el.colorTag = 'no_colormap'
                })
                Object.values(data.links).forEach(el => {
                  el.colorTag = 'no_colormap'
                })
                data.colorMap = 'dataTags_'+Object.keys(data.dataTags).slice(DT_length-1,DT_length)[0]
                Object.values(data.dataTags).slice(DT_length-1,DT_length)[0].show_legend=evt.target.checked
              }

              set_data({...data})
            }}
          />
        </Col>
      </FormGroup>
    </Popover.Body>
  </Popover>


  const item_dropdown_filter=<>
    {(node_filter)?
      <OverlayTrigger
        key={'tooltip-link-color-filter'}
        placement={'bottom'}
        trigger={'click'}
        rootClose
        overlay={filter_color_node}>
        <Button size='sm' variant='light' >
          {t('Menu.Noeuds')}
        </Button>
      </OverlayTrigger>
      :
      <></>
    }

    {(flux_filter)?
      <OverlayTrigger
        key={'tooltip-node-color-filter'}
        placement={'bottom'}
        trigger={'click'}
        rootClose
        overlay={filter_color_link}>
        <Button size='sm' variant='light' >{t('Menu.flux')}</Button>
      </OverlayTrigger>

      :
      <></>
    }
    {(Object.values(data.dataTags).length>0)?
      <OverlayTrigger
        key={'tooltip-data-filter'}
        placement={'bottom'}
        trigger={'click'}
        rootClose
        overlay={filter_data}>
        <Button size='sm' variant='light'>
          <>{t('Banner.data')}</>
        </Button>
      </OverlayTrigger>

      :
      <></>
    }
  </>


  const logo_tempalte=<svg xmlns="http://www.w3.org/2000/svg" aria-hidden='false' data-prefix='fas' className='svg-inline--fa' viewBox="0 0 24 24"><path fill='currentColor' d="M10,7.5c0-.83,.67-1.5,1.5-1.5s1.5,.67,1.5,1.5-.67,1.5-1.5,1.5-1.5-.67-1.5-1.5Zm14-1v5c0,3.03-2.47,5.5-5.5,5.5H10.5c-3.03,0-5.5-2.47-5.5-5.5V6.5c0-3.03,2.47-5.5,5.5-5.5h8c3.03,0,5.5,2.47,5.5,5.5ZM8,11.5c0,1,.59,1.86,1.43,2.26l4.28-4.28c.62-.62,1.64-.62,2.26,0l1.04,1.04c.62,.62,1.64,.62,2.26,0l1.72-1.72v-2.29c0-1.38-1.12-2.5-2.5-2.5H10.5c-1.38,0-2.5,1.12-2.5,2.5v5Zm8.5,7.5H5.5c-1.38,0-2.5-1.12-2.5-2.5v-7c0-.83-.67-1.5-1.5-1.5s-1.5,.67-1.5,1.5v7c0,3.03,2.47,5.5,5.5,5.5h11c.83,0,1.5-.67,1.5-1.5s-.67-1.5-1.5-1.5Z"/></svg>



  // OBJECT THAT CONTAIN DIFFERENT MENUS
  const ui :{[s:string] : JSX.Element[]}=  {}

  if(!window.SankeyToolsStatic){
    ui['file']=[
      <OverlayTrigger
        key={'file_new'}
        placement={'bottom'}
        rootClose
        overlay={<Tooltip id={'tooltip-file_new'}>{t('Menu.tooltips.new')} </Tooltip>}>
        <Dropdown className='buttonSubNav'  drop='end'  id='new'  >
          <Dropdown.Toggle size='sm' variant='light'><><Col><FontAwesomeIcon icon={faPlus} /></Col><Col className='textIcon'>{t('Menu.new')}</Col></></Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item
              onClick={Reinitialization} ><FontAwesomeIcon icon={faFile} style={{width:'24',height:'24'}}/> {t('Menu.from_new')} </Dropdown.Item>

            <Dropdown.Item
              onClick={() => { set_show_modalTemplate(true) }}
            >{logo_tempalte} {t('Menu.from_model')} </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown></OverlayTrigger>,

      <OverlayTrigger
        key={'file_open'}
        placement={'bottom'}
        rootClose
        overlay={<Tooltip id={'tooltip-file_open'}>{t('Menu.tooltips.ouvrir')} </Tooltip>}>
        <Dropdown className='buttonSubNav'  drop='end'  id='ouvrir'  >
          <Dropdown.Toggle size='sm' variant='light'><><Col><FontAwesomeIcon icon={faFolderOpen} /></Col><Col className='textIcon'>{t('Menu.ouvrir')}</Col></></Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item
              onClick={() => {
                if (_load_json.current) {
                  _load_json.current.name = ''
                  _load_json.current.click()
                }
              }} >{t('Menu.open_json')}</Dropdown.Item>
            <Form.Control
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
                    const new_data = DefaultSankeyData()
                    const result_data = JSON.parse(result)
                    Object.assign(new_data, result_data)
                    if (result_data.version === undefined) {
                      (new_data.version as unknown as undefined) = undefined
                    }
                    convert_data(new_data,DefaultSankeyData)
                    complete_sankey_data(new_data,DefaultSankeyData,SankeyUtils.DefaultNode,SankeyUtils.DefaultLink)
                    console.log('open json')

                    set_data(new_data)
                    const test = document.getElementsByClassName('navbar')
                    let margin_top = 0
                    if (test && test.length > 0) {
                      margin_top = test[0].getBoundingClientRect().height
                      d3.select(' .opensankey #svg-container').style('margin-top',margin_top+'px')
                    }
                  }
                })()
                reader.readAsText(files[0])
              }}
            />
            <Dropdown.Item
              onClick={() => set_show_excel_dialog(true)}
            >{t('Menu.open_excel')}</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown></OverlayTrigger>,

      <OverlayTrigger
        key={'file_save'}
        placement={'bottom'}
        rootClose
        overlay={<Tooltip id={'tooltip-file_save'}>{t('Menu.tooltips.enregistrer')} </Tooltip>}>
        <Dropdown className='buttonSubNav' drop='end'  id='enregistrer' >
          <Dropdown.Toggle size='sm' variant='light'><><Col><FontAwesomeIcon icon={faDownload} /></Col><Col className='textIcon'>{t('Menu.enregistrer')}</Col></></Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={()=>{
              set_show_save_json(true)
            }} >{t('Menu.open_json')}</Dropdown.Item>
            <Dropdown.Item onClick={()=>SankeyUtils.ClickSaveExcel('/opensankey/',data)} >{t('Menu.open_excel')}</Dropdown.Item>
            {externale_save_item}
          </Dropdown.Menu>
        </Dropdown></OverlayTrigger>,
      <>{external_file_item}</>,
      <OverlayTrigger
        key={'file_setting'}
        placement={'bottom'}
        rootClose
        overlay={<Tooltip id={'tooltip-file_setting'}>{t('Menu.tooltips.preference')} </Tooltip>}>
        <Button size='sm' variant='light' onClick={() => { setShowPreference(true) }}>{<><Col><FontAwesomeIcon icon={faGears} /></Col><Col className='textIcon'>{t('Menu.preference')}</Col></>}</Button>
      </OverlayTrigger>
    ]

    ui['edition']=[
      <OverlayTrigger
        key={'edition_layout'}
        placement={'bottom'}
        rootClose
        overlay={<Tooltip id={'tooltip-edition_layout'}>{t('Menu.tooltips.amp')} </Tooltip>}>
        <Button size='sm' variant='light' onClick={() => set_show_apply_layout(true)}>
          <><Col><FontAwesomeIcon icon={faFileInvoice} /></Col>
            <Col className='textIcon'>{t('Menu.Transformation.amp_short')}</Col></>
        </Button>
      </OverlayTrigger>,

      <OverlayTrigger
        key={'file_style'}
        placement={'bottom'}
        rootClose
        overlay={<Tooltip id={'tooltip-file_style'}>{t('Menu.tooltips.style')} </Tooltip>}>
        <Dropdown className='buttonSubNav' drop='end' id='exporter' >
          <Dropdown.Toggle size='sm' variant='light'><><Col><FontAwesomeIcon icon={faPenToSquare} /></Col><Col className='textIcon'>{t('Menu.style')}</Col></></Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={showStyleEdition}>{t('Menu.esn')}</Dropdown.Item>
            <Dropdown.Item onClick={showStyleEditionLink}>{t('Menu.esf')}</Dropdown.Item>
          </Dropdown.Menu></Dropdown></OverlayTrigger>,
      
      <>{external_edition_item}</>
    ]
        
    ui['aide']=[
      <OverlayTrigger
        key={'help_welcome'}
        placement={'bottom'}
        rootClose
        overlay={<Tooltip id={'tooltip-help_welcome'}>{t('Menu.tooltips.DisplayWelcome')} </Tooltip>}>
        <Button variant='light' onClick={() =>{
          set_show_welcome(true)
          set_never_see_again(false)
          localStorage.setItem('dontSeeAggainWelcome','0')
        }}>
          <Col>{logo_home}</Col>
          <Col className='textIcon'>{t('DisplayWelcome')}</Col>
        </Button></OverlayTrigger>,
          
      <OverlayTrigger
        key={'tuto'}
        placement={'bottom'}
        rootClose
        overlay={<Tooltip id={'tooltip-tuto'}>{t('Menu.tooltips.tuto')} </Tooltip>}>
        <Button variant='light' onClick={() => set_show_modale_tuto(true)} ><Col>{logo_tuto}</Col>
          <Col className='textIcon'>{t('Menu.formation')}</Col>
        </Button></OverlayTrigger>,

      <OverlayTrigger
        key={'doc'}
        placement={'bottom'}
        rootClose
        overlay={<Tooltip id={'tooltip-doc'}>{t('Menu.tooltips.doc')} </Tooltip>}>
        <Button variant='light' onClick={() => GoToUserDoc()} ><Col>{logo_doc}</Col>
          <Col className='textIcon'>{t('Menu.doc')}</Col>
        </Button></OverlayTrigger>,

      <OverlayTrigger
        key={'support'}
        placement={'bottom'}
        rootClose
        overlay={<Tooltip id={'tooltip-support'}>{t('Menu.tooltips.support')} </Tooltip>}>
        <Button variant='light' onClick={() => set_show_modale_support(true)}><Col>{logo_contact}</Col>
          <Col className='textIcon'>{t('Menu.support')}</Col>
        </Button>
      </OverlayTrigger>
    ]

  }

  if(node_filter || flux_filter || (Object.values(data.dataTags).length>0)){
    ui['filter']=[
      <OverlayTrigger
        key={'tooltip-filter'}
        placement={'bottom'}
        overlay={<Tooltip id={'tooltip-filter'}>{t('Banner.hlp_1_txt_9')} </Tooltip>}>

        {item_dropdown_filter}
      </OverlayTrigger>]
  }


  return ui


}




const MenuPropTypes = {
  t:PropTypes.func.isRequired,
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  logo: PropTypes.string.isRequired,
  logo_terriflux: PropTypes.string.isRequired,
  logo_width: PropTypes.number,
  app_name: PropTypes.string.isRequired,

  button_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLLabelElement)}).isRequired,
  accordion_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLDivElement)}).isRequired,

  example_menu: PropTypes.element,
  formations_menu: PropTypes.object.isRequired,
  url_prefix: PropTypes.string.isRequired,


  nav_item_active: PropTypes.string.isRequired,

  mode_selection: PropTypes.shape({current:PropTypes.string.isRequired}).isRequired,

  style_to_apply: PropTypes.string.isRequired,
  set_style_to_apply: PropTypes.func.isRequired,

  callback:PropTypes.func.isRequired,

  show_load: PropTypes.bool.isRequired,
  set_show_load: PropTypes.func.isRequired,
  processing : PropTypes.bool.isRequired,
  setProcessing : PropTypes.func.isRequired,
  failure : PropTypes.bool.isRequired,
  setFailure : PropTypes.func.isRequired,
  not_started : PropTypes.bool.isRequired,
  setNotStarted : PropTypes.func.isRequired,
  result : PropTypes.string.isRequired,
  setResult : PropTypes.func.isRequired,
  path: PropTypes.string.isRequired,
  launch: PropTypes.func.isRequired,
  configurations_menus: PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,

  show_nav: PropTypes.bool.isRequired,
  set_show_nav: PropTypes.func.isRequired,
  show_excel_dialog: PropTypes.bool.isRequired,
  set_show_excel_dialog: PropTypes.func.isRequired,
  show_apply_layout: PropTypes.bool.isRequired,
  set_show_apply_layout: PropTypes.func.isRequired,
  show_save_json: PropTypes.bool.isRequired,
  set_show_save_json: PropTypes.func.isRequired,
  showPreference: PropTypes.bool.isRequired,
  setShowPreference: PropTypes.func.isRequired,
  show_publish_dialog:PropTypes.bool.isRequired,
  set_show_publish_dialog: PropTypes.func.isRequired,

  menus: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.element.isRequired).isRequired).isRequired,
  show_modalTemplate:PropTypes.bool.isRequired,
  set_show_modalTemplate:PropTypes.func.isRequired,
  cardsTemplate:PropTypes.element.isRequired,
  external_modal:PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,
  GetSankeyMinWidthAndHeight :PropTypes.func.isRequired,
  Reinitialization:PropTypes.func.isRequired,
  set_show_modale_tuto:PropTypes.func.isRequired,
  show_modale_tuto:PropTypes.bool.isRequired,
  show_modale_support:PropTypes.bool.isRequired,
  set_show_modale_support:PropTypes.func.isRequired,
  additional_nav_item:PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,

  set_contextualised_node:PropTypes.func.isRequired,
  set_contextualised_link:PropTypes.func.isRequired,
  set_tag_contextualised:PropTypes.func.isRequired,
  set_show_context_zdd:PropTypes.func.isRequired,
  updateLayout:PropTypes.func.isRequired,
  convert_data:PropTypes.func.isRequired,
  node_hspace:PropTypes.number.isRequired,
  set_node_hspace:PropTypes.func.isRequired,
  node_vspace:PropTypes.number.isRequired,
  set_node_vspace:PropTypes.func.isRequired, 
  elementToDispose:PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  apply_transformation_additional_elements: PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,
  DiagramSelector: PropTypes.func.isRequired,
  is_computing:PropTypes.bool.isRequired,
  setIsComputing:PropTypes.func.isRequired,
  set_tags_selected:PropTypes.func.isRequired,
  RetrieveExcelResults:PropTypes.func.isRequired,
  DefaultSankeyData: PropTypes.func.isRequired
}
/**
 * Description placeholder
 *
 * @typedef {MenuTypes}
 */
type MenuTypes = InferProps<typeof MenuPropTypes>




/**
 * Description placeholder
 *
 * @param {{ data: any; set_data: any;right_menu: any; settings_edition: any; settings_edition_node_tags: any; settings_edition_link_tags: any; settings_edition_data_tags: any; ... 39 more ...; launch: any; }}
 *
 * @returns
 */
const Menu: FunctionComponent<MenuTypes> = (
  { t,
    data, set_data,
    nav_item_active,
    show_nav,
    set_show_nav,
    logo,logo_terriflux, logo_width,app_name,
    button_ref,
    accordion_ref,
    url_prefix,
    callback,
    show_load,
    set_show_load,
    processing,setProcessing,
    failure,setFailure,
    not_started,setNotStarted,
    result,setResult,
    path,
    launch,
    configurations_menus,
    show_excel_dialog, set_show_excel_dialog,
    show_apply_layout, set_show_apply_layout,
    show_save_json, set_show_save_json,
    menus,
    show_modalTemplate,
    set_show_modalTemplate,
    cardsTemplate,

    external_modal,
    GetSankeyMinWidthAndHeight,
    formations_menu,Reinitialization,set_show_modale_tuto,show_modale_tuto,
    show_modale_support,set_show_modale_support,
    additional_nav_item,
    set_contextualised_node,
    set_contextualised_link,
    set_tag_contextualised,
    set_show_context_zdd,
    updateLayout,
    convert_data,
    node_hspace,set_node_hspace,
    node_vspace,set_node_vspace,
    elementToDispose,
    apply_transformation_additional_elements,
    DiagramSelector,
    is_computing, setIsComputing,
    set_tags_selected,
    RetrieveExcelResults,
    DefaultSankeyData
  }
) => {

  const [menu_acivated,set_menu_activated]=useState(Object.keys(menus)[0])
  const [modale_sub_tuto,set_modale_sub_tuto]=useState(Object.keys(formations_menu)[0]!==undefined?Object.keys(formations_menu)[0]:'')
  let max_link_value = 0
  Object.values(data.links).forEach(link => {
    const new_max_link_value = SankeyUtils.FindMaxLinkValue(
      max_link_value,
      link.value
    )
    max_link_value = new_max_link_value > max_link_value ? new_max_link_value : max_link_value
  })
  max_link_value += 1

  if (not_started == false && processing == false) {
    const path = window.location.href
    const url = path + url_prefix + 'loads_retrieves_result'
    const form_data = new FormData()
    const fetchData = {
      method: 'POST',
      body: form_data
    }
    fetch(url, fetchData).then(response => {
      response.text().then(text => {
        try {
          RetrieveExcelResults(text)
        } catch(err) {
          alert(err)
        }
      }).then(()=>{
        setIsComputing(false)
      })
    })
    setProcessing(false)
    setFailure(false)
    setNotStarted(true)
  }

  //Switch the variable value that handle opening and closing the configuration menu
  const toggleShow = () => {
    set_show_nav(!show_nav)

    if(!show_nav){
      [data.width, data.height] = GetSankeyMinWidthAndHeight(data)
      const transform=d3.select('.opensankey #svg').attr('transform')
      let scale_svg=1
      if(transform!==undefined && transform!==null){
        scale_svg=Number(transform.split('scale(')[1].replace(')',''))
      }
      d3.select('.scroll_zone').style('width',((data.width+600)*scale_svg-(600*(scale_svg-1.1)))+'px')
    }else{
      d3.select('.scroll_zone').style('width',null)
    }

  }
  const setChecked = useState(false)[1]


  const props = {
    scroll: true,
    backdrop: false,
  }

  const menuButton = () => {
    if (show_nav) {
      return <FaAngleDoubleRight />
    } else {
      return <FaAngleDoubleLeft />
    }

  }


  const ordered_menu: {[s: string]: ReactElementLike[]} = {}
  const ordered_key: string[] = [
    'file',
    'edition',
    'diagramme',
    'excel',
    'filter',
    'view',
    'unit',
    'afm',
    'demo',
    'aide']
  ordered_key.forEach(key=>{
    if(Object.keys(menus).includes(key)){
      ordered_menu[key] = menus[key]
    }
  })

  // Pré-traitement du menu tuto pour trier les groupes
  const n_a=new Array(50)

  Object.keys(formations_menu).map(d=>{
    return d.replace('_','__').split('__')
  }).forEach(element => {
    if(element.length>1){
      n_a[Number(element[0])]=element[0]+'_'+element[1]
    }else{
      n_a[n_a.length-1]=element[0]
    }
  })
  // Return l'objet formations_menu mais trier selon le numéro du groupe (quand il y en a un)
  const new_array_for_exemple=Object.fromEntries(n_a.filter(f=>f).map((d)=>{
    return [d,(formations_menu as {[k:string]:string})[d]]
  }))
  let modal_tuto=<></>
  const tuto_sub_nav:{[s:string]:JSX.Element}={}
  Object.entries(new_array_for_exemple).forEach(d=>{
    tuto_sub_nav[d[0]]=<>
      {(d[1] as {['Files']:string[]})['Files'].filter((f:string)=>!f.includes('.xlsx')).map((dd:string)=>{
        return <Card >
          <Card.Img className='img-card' variant="top" src={'/fm/userfiles/Formations/'+(d[0])+'/images/'+(dd.replace('_layout.json',''))+'.png'} style={{'objectFit':'contain'}} />
          <Card.Body>
            <Card.Title>{dd.replace('_layout.json','').replaceAll('_',' ')}</Card.Title>
            <Card.Text>

            </Card.Text>
            <ButtonGroup>
              <Button variant='primary'
                onClick={() => {
                  SankeyUtils.UploadExemple(
                    ('Formations/'+(d[0])+'/sankey/'+dd), url_prefix, data, set_data,Reinitialization,convert_data
                  )
                  set_data({...data})
                  set_show_modale_tuto(false)
                }}
              >{t('useTutoJSON')}</Button>
              {(d[1] as {['Files']:string[]})['Files'].includes(dd.replace('_layout.json','.xlsx'))?
                <Button variant='info'
                  onClick={() => {


                    launch('Formations/'+(d[0])+'/'+dd.replace('_layout.json','.xlsx'))

                    SankeyUtils.UploadExemple(
                      'Formations/'+(d[0])+'/'+dd.replace('_layout.json','.xlsx'), url_prefix, data, set_data,Reinitialization,convert_data
                    )
                    set_show_modale_tuto(false)

                  }
                  }
                >{t('useTutoExcel')}</Button>
                :<></>}
              {(d[1] as {['Files']:string[]})['Files'].includes(dd.replace('_layout.json','_reconciled.xlsx'))?
                <Button variant='info'
                  onClick={() => {


                    launch('Formations/'+(d[0])+'/'+dd.replace('_layout.json','_reconciled.xlsx'))

                    SankeyUtils.UploadExemple(
                      'Formations/'+(d[0])+'/'+dd.replace('_layout.json','_reconciled.xlsx'), url_prefix, data, set_data,Reinitialization,convert_data
                    )
                    set_show_modale_tuto(false)

                  }
                  }
                >{t('useTutoExcel')}</Button>
                :<></>}

            </ButtonGroup>
          </Card.Body>
        </Card>
      })}

    </>

  })

  modal_tuto=<Modal size={'xl'} fullscreen={true} id='modal_tutoriel' show={show_modale_tuto} onHide={() => set_show_modale_tuto(false)}>
    <Modal.Header closeButton>{t('Menu.formation')}</Modal.Header>
    <Modal.Body>
      <Row>
        <Nav variant="tabs" className='sub_nav' activeKey={modale_sub_tuto}>
          {Object.keys(tuto_sub_nav).map(m=>{
            return <Nav.Item>
              <Nav.Link eventKey={m} onClick={()=>set_modale_sub_tuto(m)}>
                {/*FORMAT THE TITLE OF TUTO */}
                {(m.split('_').length>1)?m.split('_').filter(s=>isNaN(+s)).join(' '):m}
              </Nav.Link>
            </Nav.Item>
          })}
        </Nav>
      </Row>
      <Row md={3}>
        {tuto_sub_nav[modale_sub_tuto]}
      </Row>
    </Modal.Body>
  </Modal>
  // Create the menu nav that can be slightly different if it in static
  const menu_nav=(!window.SankeyToolsStatic)?(<Col>
    <Row>
      <Nav variant="tabs" className='sub_nav' activeKey={menu_acivated}>
        {Object.keys(ordered_menu).map(m=>{

          

          // Nav item that open a subnav when clicked
          return <Nav.Item>
            <Nav.Link eventKey={m} onClick={()=>set_menu_activated(m)}>
              {t('Menu.'+m)}
            </Nav.Link>
          </Nav.Item>
          
        })}
      </Nav>
    </Row>
    <Row lg={'auto'}  style={{whiteSpace:'nowrap'}}>
      <ButtonGroup className={'subMenu '+menu_acivated}>
        {ordered_menu[menu_acivated]}
      </ButtonGroup>
    </Row>
  </Col> ): <ButtonGroup> {Object.keys(ordered_menu).map(k=><React.Fragment key={k}>{ordered_menu[k]}</React.Fragment>)}</ButtonGroup>


  const modal_support= <Modal size={'lg'} show={show_modale_support} onHide={() => set_show_modale_support(false)}>
    <Modal.Header closeButton><h2>{t('Menu.c_support')}</h2></Modal.Header>
    <Modal.Body>
      <h3>{t('Menu.rth_support')} :</h3>
      <p>{t('Menu.support_explication').split('[]')[0]}<a href='mailto:support@open-sankey.fr	'>support@open-sankey.fr</a>{t('Menu.support_explication').split('[]')[1]}</p>
    </Modal.Body>
  </Modal>

  const data_tags = Object.assign({},data.dataTags)
  const show_data=Object.values(data_tags).length>0
  let DDDT=[] as (JSX.Element|undefined)[]
  if(show_data){
    DDDT=DataTagsDDNavBar(data,set_data,set_tags_selected)
  }

  return (
    <>
      {external_modal.map((c,i)=>{return <React.Fragment key={i}>{c}</React.Fragment>})}
      {/* Top Navbar with navigation and edition elements */}
      <Navbar className='bg-light' fixed='top' style={{ 'display': 'block' }} onClick={()=>{
        set_contextualised_node(undefined)
        set_contextualised_link(undefined)
        set_show_context_zdd(false)
        set_tag_contextualised(undefined)
      }} >
        <Container className='MenuNavigation'>
          {!window.SankeyToolsStatic?<>
            <Navbar.Brand style={{marginRight:'0px'}} href="https://terriflux.com/" ><img src={logo_terriflux} width={100} /> </Navbar.Brand>
            <div style={{display:'inline-block',width:'0px',marginLeft:'5px',marginRight:'5px',height:'40px',borderRight:'solid 1px #ddd',borderLeft:'solid 1px #ddd',padding:'0'}}></div>
          </>:<></>
          }

          <Navbar.Brand /*onClick={()=>set_welcome_text(window.sankey.welcome_text)}*/><img src={logo} width={logo_width ? logo_width : 200} /> {window.SankeyToolsStatic?window.sankey.header:<></>} </Navbar.Brand>
          {menu_nav}
          {DDDT}

          {Object.keys(menus).includes('unité')?<>
            {menus['unité']}
          </>:<></>}
          {additional_nav_item}

        </Container>
      </Navbar>
      {/* Bottom Navbar with some more info */}
      <Navbar bg='light' fixed='bottom' style={{fontSize:'0.85em'}} >
        <Container className='sankeyFooter' >

          <span style={{display:'inline'}}>
        ©<a  href="https://terriflux.com/" ><img width={75} src={logo_terriflux} /></a> - {t('tdr')}
          </span>
          <span style={{display:'inline'}}>
            {app_name}
          </span>
          <span style={{display:'inline'}}><a href='https://terriflux.com/mentions-legales/'>{t('legal')}</a></span>
          <span style={{display:'inline'}}><a href='mailto:support@open-sankey.fr	'>support@open-sankey.fr</a></span>
          <span style={{display:'inline'}}>
          9 rue du Rocher de Lorzier, 38430 Moirans  +33 (0)6 21 83 56 76
          </span>

        </Container>
      </Navbar>

      {(!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)) ?<Offcanvas className='sankey-menu' show={show_nav} placement='end' {...props} style={{ 'width': menu_config_width+'px', 'marginTop':document.getElementsByClassName('MenuNavigation')[0]?.getBoundingClientRect().y+document.getElementsByClassName('MenuNavigation')[0]?.getBoundingClientRect().height }}>
        <Offcanvas.Body style={{ 'padding': '0px 0px 0px 0px' }}>
          <SankeyConfigurationMenu
            nav_item_active={nav_item_active}
            accordion_ref={accordion_ref}
            configuration_menus={configurations_menus} />
        </Offcanvas.Body>
      </Offcanvas>
        : <></>}

      <ButtonGroup vertical
        className='sideBar'
        style={{top:window.innerHeight/2-120,right:0}}
      >
        {menus['toolbar']}
        {!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false) ? (
          <ToggleButton
            ref={button_ref as Ref<HTMLLabelElement>}
            id="toggle-check"
            className='openMenu'
            type="checkbox"
            variant="primary"
            checked={show_nav}
            onChange={(e) => { setChecked(e.currentTarget.checked)}}
            onClick={toggleShow}
            value="menuConfigButton">{menuButton()}
          </ToggleButton>
        ) : (<></>)}
      </ButtonGroup>


      {
        processing ? (
          <Modal.Dialog >
            <Button className="btn btn-sm btn-warning col-md-12">
              <span className="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span> Processing...
            </Button></Modal.Dialog>) : (<></>)
      }
      <ApplySaveJSONDialog
        t={t}
        show_save_json={show_save_json}
        set_show_save_json={set_show_save_json}
        sankey_data={data}
        additionnal_button_option_save_json={[]}
        ClickSaveDiagram={SankeyUtils.ClickSaveDiagram}
      />
      <ApplyLayoutDialog
        t={t}
        show_apply_layout={show_apply_layout}
        set_show_apply_layout={set_show_apply_layout}
        sankey_data={data}
        set_sankey_data={set_data}
        updateLayout={updateLayout}
        convert_data={convert_data}
        node_hspace={node_hspace}
        set_node_hspace={set_node_hspace}
        node_vspace={node_vspace}
        set_node_vspace={set_node_vspace}
        elementToDispose={elementToDispose}
        apply_transformation_additional_elements={apply_transformation_additional_elements}
        diagramSelector={DiagramSelector}
        DefaultSankeyData={DefaultSankeyData}
      />

      <ExcelModal
        t={t}
        launch={launch}
        handleCloseDialog={() => set_show_excel_dialog(false)}
        UploadExcelImpl={SankeyUtils.UploadExcelImpl}
        show_excel_dialog={show_excel_dialog}
        set_show_excel_dialog={set_show_excel_dialog}
        url_prefix={url_prefix}
        callback={callback} />

      <SankeyLoad
        t={t}
        url_prefix={url_prefix}
        successAction={()=>SankeyUtils.DownloadExamples(path, url_prefix, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        show_dialog={show_load}
        set_show_dialog={set_show_load}
        processing={processing}
        setProcessing={setProcessing}
        failure={failure}
        setFailure={setFailure}
        setNotStarted={setNotStarted}
        result={result}
        setResult={setResult}
        is_computing={is_computing}
        setIsComputing={setIsComputing}
      />

      {
        <Modal size={'xl'}  show={show_modalTemplate} onHide={() => set_show_modalTemplate(false)}>
          <Modal.Header closeButton>{t('Banner.sdr')}</Modal.Header>
          <Modal.Body>
            <Row md={4}>
              {cardsTemplate}
            </Row>
          </Modal.Body>
        </Modal>
      }
      {modal_tuto}
      {modal_support}

    </>
  )
}

Menu.propTypes = MenuPropTypes

export default Menu

export const OpenSankeyModalWelcome=(t:TFunction,
  active_page:string,
  set_active_page:(s:string)=>void,
  show_modal_welcome:boolean,
  set_show_modal_welcome:(b:boolean)=>void,
  never_see_again:boolean,
  set_never_see_again:(b:boolean)=>void,
  additional_shortcut_item:JSX.Element[],
  external_pagination:JSX.Element[],
  external_content:{[s:string]:JSX.Element},
  exemple_menu: object,
)=>{




  const content_rc_static=<>
    <h4 style={{textAlign:'center'}}>{t('Menu.rcc_titre_princ')}</h4>
    <p><b>{t('Menu.rcc_cdn_bold')}</b>{t('Menu.rcc_cdn')}</p>
    <p><b>{t('Menu.rcc_ctrl_scrll_bold')}</b>{t('Menu.rcc_ctrl_scrll')}</p>

    <p><b>{t('Menu.rcc_F7_bold')}</b>{t('Menu.rcc_F7')}</p>
    <p><b>{t('Menu.rcc_F8_bold')}</b>{t('Menu.rcc_F8')}</p>
    <p><b>{t('Menu.rcc_F9_bold')}</b>{t('Menu.rcc_F9')}</p>

  </>

  const content_rc_not_static=<Accordion className='accordion_new_welcome' defaultActiveKey={'OS'}>
    <Accordion.Item eventKey='OS'>
      <Accordion.Header>
        <h2>{t('Menu.rcc_titre_princ')}</h2>
      </Accordion.Header>
      <Accordion.Body>
        <h5>{t('Menu.rcc_titre_select')}:</h5>
        <p><b>{t('Menu.rcc_cn_bold')}</b>{t('Menu.rcc_cn')}</p>
        <p><b>{t('Menu.rcc_ctrl_cn_bold')}</b>{t('Menu.rcc_ctrl_cn')}</p>
        <p><b>{t('Menu.rcc_cf_bold')}</b>{t('Menu.rcc_cf')}</p>
        <p><b>{t('Menu.rcc_ctrl_cf_bold')}</b>{t('Menu.rcc_ctrl_cf')}</p>
        <p><b>{t('Menu.rcc_cs_bold')}</b>{t('Menu.rcc_cs')}</p>
        <p><b>{t('Menu.rcc_click_and_drag_bold')}</b>{t('Menu.rcc_click_and_drag')}</p>
        <p><b>{t('Menu.rcc_cdn_bold')}</b>{t('Menu.rcc_cdn')}</p>
        <p><b>{t('Menu.rcc_ad_bold')}</b>{t('Menu.rcc_ad')}</p>

        <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

        <h5>{t('Menu.rcc_titre_edi')} :</h5>

        <p><b>{t('Menu.rcc_e_cn_bold')}</b>{t('Menu.rcc_e_cn')}</p>
        <p><b>{t('Menu.rcc_e_ds_bold')}</b>{t('Menu.rcc_e_ds')}</p>
        <p><b>{t('Menu.rcc_e_dn_bold')}</b>{t('Menu.rcc_e_dn')}</p>

        <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

        <h5>{t('Menu.rcc_titre_autre')} :</h5>

        <p><b>{t('Menu.rcc_a_s_bold')}</b>{t('Menu.rcc_a_s')}</p>
        <p><b>{t('Menu.rcc_a_fc_bold')}</b>{t('Menu.rcc_a_fc')}</p>
        <p><b>{t('Menu.rcc_a_dbm_bold')}</b>{t('Menu.rcc_a_dbm')}</p>
        <p><b>{t('Menu.rcc_a_ech_bold')}</b>{t('Menu.rcc_a_ech')}</p>
        <p><b>{t('Menu.rcc_ctrl_scrll_bold')}</b>{t('Menu.rcc_ctrl_scrll')}</p>
        <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
      </Accordion.Body>
    </Accordion.Item>


    {additional_shortcut_item}
  </Accordion>
  external_content['rc']=window.SankeyToolsStatic?content_rc_static:content_rc_not_static

  const tmp=JSON.parse(JSON.stringify(exemple_menu))
  let list_template_data=[] as string[]
  // Si exemple_menu contient OpenSankey et que ce sous dossier contient les templates simple alors remple la liste des templates avec les modèle simples
  if(Object.keys(tmp).length!==0 && Object.keys(tmp).includes('OpenSankey') && Object.keys(tmp['OpenSankey']).includes('easy_template') ){
    list_template_data=tmp['OpenSankey']['easy_template'].filter((f:string)=>!f.includes('.xlsx'))
    // Si l'un des sous dossier d'OpenSankey dans exemple_menu est expert_template alors ajoute les modèles expert à la liste des modèles
    if( Object.keys(tmp['OpenSankey']).includes('expert_template') ){
      list_template_data.push(tmp['OpenSankey']['expert_template'])
      list_template_data=list_template_data.flat()
    }
  }






  return <Modal scrollable size='xl' show={show_modal_welcome && !never_see_again} onHide={()=>{
    set_show_modal_welcome(false)
  }}>
    <Modal.Header closeButton>
      <Modal.Title>{t('welcome.'+active_page)}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {external_content[active_page]}
    </Modal.Body>

    <Modal.Footer style={{justifyContent:'center'}}>
      <Pagination >
        {external_pagination.map((c,i)=>{return <React.Fragment key={i}>{c}</React.Fragment>})}

        <Pagination.Item active={active_page==='rc'} key={'rc'} onClick={()=>{
          set_active_page('rc')
        }}>
          {t('welcome.rc')}
        </Pagination.Item>

      </Pagination>
      <FormCheck type='checkbox' label={t('dontSeeAgain')} checked={never_see_again} onChange={evt=>{
        set_never_see_again(evt.target.checked)
        localStorage.setItem('dontSeeAggainWelcome','1')
      }}/>
    </Modal.Footer>
  </Modal>
}

const style_menu_draggable={'display':'flex',width:'25%', 'paddingLeft':'0.75rem','paddingRight':'0.75rem',
  'position': 'fixed',
  'flexDirection': 'column',
  'backgroundColor': '#fff',
  'backgroundClip': 'padding-box',
  'border': '1px solid rgba(0, 0, 0, 0.2)',
  'borderRadius':' 0.6rem',
  'zIndex':'1031',
  maxHeight:'700px',
  overflowY:'auto'
} as CSSProperties

export const MenuDraggable=(content:JSX.Element|JSX.Element[],pointer_pos:{current:number[]},title:string,set_display_menu:(b:boolean)=>void,width_menu=25)=>{
  const class_name=title.replaceAll('/','').replaceAll('.','').split(' ').join('_')
  const n_style_menu_draggable=JSON.parse(JSON.stringify(style_menu_draggable)) as CSSProperties
  n_style_menu_draggable.width=width_menu+'%'
  return <Draggable  handle='.title_menu'
    defaultPosition={{x:pointer_pos.current[0],y:pointer_pos.current[1]}}
    bounds={{left:0,top:0}}
    onStart={()=>{d3.selectAll('.menu_conf').style('z-index','1')
      d3.select('.menu_conf.'+class_name).style('z-index','1031')
    }}
  >
    <div className={'menu_conf '+class_name}
      style={n_style_menu_draggable}
    >
      <Row className='title_menu' style={{'borderBottom':' 1px solid #eceeef','lineHeight':'1.5rem','zIndex':'3','backgroundColor':'white','position':'sticky','top':'0','padding':'1rem'}}>
        <Col><h3>{title}</h3></Col>
        <Col className='text-end'>{<CloseButton onClick={()=>{set_display_menu(false)}}/>}</Col>
      </Row>
      <div className='sankey-menu'>
        {content}
      </div>
    </div>
  </Draggable>
}


const icon_open_modal=<FontAwesomeIcon style={{float:'right'}} icon={faUpRightFromSquare} />
const sep=<Button variant='light' disabled><hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></Button>
const checked=(b:boolean)=><span style={{float:'right'}}>{b?'✓':''}</span>

export const ContextMenuNode=(
  contextualised_node:SankeyNode|undefined,set_contextualised_node:(n:SankeyNode|undefined)=>void,
  data:SankeyData,set_data:(d:SankeyData)=>void,
  display_nodes:{[id:string]:SankeyNode},
  display_links:{[id:string]:SankeyLink},
  multi_selected_nodes:{current:SankeyNode[]},
  multi_selected_links:{current:SankeyLink[]},
  t:TFunction,
  set_show_menu_node_apparence:React.Dispatch<React.SetStateAction<boolean>>,
  set_show_menu_node_io:React.Dispatch<React.SetStateAction<boolean>>,
  set_agregation_node:React.Dispatch<React.SetStateAction<string>>,
  set_is_agregation:React.Dispatch<React.SetStateAction<boolean>>,
  set_show_agregation:React.Dispatch<React.SetStateAction<boolean>>,
  set_display_link_opacity:React.Dispatch<React.SetStateAction<string>>,
  pointer_pos:{current:number[]},
  additional_context_element_menu:JSX.Element[],
  additional_context_element_other:JSX.Element[]
)=>{
  let style_c_n='0px 0px auto auto'
  if(contextualised_node!==undefined){
    style_c_n=(pointer_pos.current[1]-20)+'px auto auto '+(pointer_pos.current[0]+10)+'px'
  }

  // b:before,m:middle,a:after
  const align_node=(ref:'min'|'max',attr:'x'|'y',pos:'b'|'m'|'a')=>{
    const node_ref=multi_selected_nodes.current.filter(nf=>nf.position!='relative').sort((n1,n2)=>{
      return ref=='min'?n1[attr]-n2[attr]:n2[attr]-n1[attr]
    })[0]
    const pos_ref=node_ref[attr]
    const wORh=(attr=='x')?'width':'height'
    const is_circle=d3.select('#shape_'+node_ref.idNode).attr('rx')!==null

    const wORh_ref=is_circle?Number(d3.select('#shape_'+node_ref.idNode).attr('r'+attr)):Number(d3.select('#shape_'+node_ref.idNode).attr(wORh))
    let center_ref=0

    if (pos==='m'){
      center_ref=pos_ref+(wORh_ref/2)
    }

    multi_selected_nodes.current.filter(n=>n!=node_ref && n.position!='relative').forEach(n=>{

      const is_circle_to_shift=d3.select('#shape_'+n.idNode).attr('rx')!==null
      const wORh_to_shift=is_circle_to_shift?Number(d3.select('#shape_'+n.idNode).attr('r'+attr)):Number(d3.select('#shape_'+n.idNode).attr(wORh))

      if (pos==='m'){
        n[attr]=center_ref-((wORh_to_shift)/2)
      }else if(pos==='b'){
        n[attr]=pos_ref
      }else if(pos==='a'){
        n[attr]=(pos_ref+wORh_ref)-wORh_to_shift

      }
    })
  }

  // Dropdown to change some pararmeter concerning the appearence of the node
  const has_node_tags=Object.values(data.nodeTags).filter(nt=>nt.group_name!=='Type de noeud').length>0
  const dropdown_c_n_tag=(contextualised_node!==undefined && has_node_tags) ?<Dropdown as={ButtonGroup} variant='light' autoClose='outside' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Menu.Transformation.tagNode_assign')}
    </Dropdown.Toggle>
    <Dropdown.Menu  variant='light'>
      {Object.entries(data.nodeTags).filter(nt=>Object.keys(nt[1].tags).length>0).map(nt=>{
        return <Dropdown autoClose='outside' drop='end'>
          <Dropdown.Toggle variant="light" id="dropdown-basic">
            {nt[1].group_name}
          </Dropdown.Toggle>
          <Dropdown.Menu  variant='light'>
            {Object.keys(nt[1].tags).map(t=>{
              return <Dropdown.Item as={Button} variant='light' onClick={()=>{
                // Contextualised node
                if(!Object.keys(contextualised_node.tags).includes(nt[0])){
                  contextualised_node.tags[nt[0]]=[]
                }
                if(!contextualised_node.tags[nt[0]].includes(t)){
                  contextualised_node.tags[nt[0]].push(t)
                }else{
                  contextualised_node.tags[nt[0]].splice(contextualised_node.tags[nt[0]].indexOf(t))
                }
                //Selected nodes
                multi_selected_nodes.current.filter(n=>n!=contextualised_node).forEach(n=>{
                  if(!Object.keys(n.tags).includes(nt[0])){
                    n.tags[nt[0]]=[]
                  }
                  if(!n.tags[nt[0]].includes(t)){
                    n.tags[nt[0]].push(t)
                  }else{
                    n.tags[nt[0]].splice(n.tags[nt[0]].indexOf(t))
                  }
                })

                set_data({...data})
              }}>
                {nt[1].tags[t].name}{checked(contextualised_node.tags[nt[0]] &&contextualised_node.tags[nt[0]].includes(t))}
              </Dropdown.Item>
            })}
          </Dropdown.Menu>
        </Dropdown>
      })}

    </Dropdown.Menu>
  </Dropdown>:<></>






  const dropdown_c_n_apparence=contextualised_node!==undefined?<Button onClick={()=>{
    set_show_menu_node_apparence(true)
    set_contextualised_node(undefined)
  }} variant='light'>{t('Noeud.apparence.apparence')} {icon_open_modal}</Button>:<></>


  // Dropdown to change some pararmeter concerning the style of the node
  const dropdown_c_n_style_select=contextualised_node!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.SelectStyle')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      {
        Object.values(data.style_node).map(sn=>{
          return <Dropdown.Item onClick={()=>{
            contextualised_node.style=sn.idNode
            multi_selected_nodes.current.filter(n=>n!=contextualised_node).forEach(n=>n.style=sn.idNode)

            set_data({...data})
          }}>{sn.name}{checked(contextualised_node.style==sn.idNode)}</Dropdown.Item>
        })
      }
    </Dropdown.Menu>
  </Dropdown>:<></>

  const dropdown_c_n_style=contextualised_node!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.Style')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      <Dropdown.Item  as={Button} variant='light' onClick={()=>{
        delete contextualised_node.local
        multi_selected_nodes.current.filter(n=>n!=contextualised_node).forEach(n=>delete n.local)
        set_data({...data})
      }}>{t('Noeud.AS')}</Dropdown.Item>
      {dropdown_c_n_style_select}
    </Dropdown.Menu>
  </Dropdown>:<></>

  const dropdown_c_n_io=contextualised_node!==undefined?<Button onClick={()=>{
    set_show_menu_node_io(true)
    set_contextualised_node(undefined)
  }} variant='light'>{t('Noeud.PF.PFM')}{icon_open_modal}</Button>:<></>

  const dropdown_c_n_align_h_min_ori=contextualised_node!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.align_horiz_min')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      <Dropdown.Item onClick={()=>{
        align_node('min','x','b')
        set_data({...data})
      }}>{t('Noeud.align_horiz_left')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('min','x','m')
        set_data({...data})
      }}>{t('Noeud.align_horiz_center')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('min','x','a')
        set_data({...data})
      }}>{t('Noeud.align_horiz_right')}
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>:<></>

  const dropdown_c_n_align_h_max_ori=contextualised_node!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.align_horiz_max')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      <Dropdown.Item onClick={()=>{
        align_node('max','x','b')
        set_data({...data})
      }}>{t('Noeud.align_horiz_left')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('max','x','m')
        set_data({...data})
      }}>{t('Noeud.align_horiz_center')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('max','x','a')
        set_data({...data})
      }}>{t('Noeud.align_horiz_right')}
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>:<></>


  const dropdown_c_n_align_h=contextualised_node!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.align_horiz')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      {dropdown_c_n_align_h_min_ori}
      {dropdown_c_n_align_h_max_ori}
    </Dropdown.Menu>
  </Dropdown>:<></>





  // ===============ALIGNEMENT VERTICAL DES NOEUDS=======================================

  const dropdown_c_n_align_v_min_ori=contextualised_node!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.align_vert_min')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      <Dropdown.Item onClick={()=>{
        align_node('min','y','b')
        set_data({...data})
      }}>{t('Noeud.align_vert_top')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('min','y','m')
        set_data({...data})
      }}>{t('Noeud.align_horiz_center')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('min','y','a')
        set_data({...data})
      }}>{t('Noeud.align_vert_bottom')}
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>:<></>

  const dropdown_c_n_align_v_max_ori=contextualised_node!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.align_vert_max')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      <Dropdown.Item onClick={()=>{
        align_node('max','y','b')
        set_data({...data})
      }}>{t('Noeud.align_vert_top')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('max','y','m')
        set_data({...data})
      }}>{t('Noeud.align_horiz_center')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('max','y','a')
        set_data({...data})
      }}>{t('Noeud.align_vert_bottom')}
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>:<></>

  const dropdown_c_n_align_v=contextualised_node!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.align_vert')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      {dropdown_c_n_align_v_min_ori}
      {dropdown_c_n_align_v_max_ori}
    </Dropdown.Menu>
  </Dropdown>:<></>

  const button_edit_label_node=contextualised_node!==undefined?<Button variant='light'
    onClick={()=>{
      const label_x=document.getElementById('text_'+contextualised_node.idNode)?.getBoundingClientRect().x??0
      const label_y=document.getElementById('text_'+contextualised_node.idNode)?.getBoundingClientRect().y??0
      const node_x=document.getElementById('shape_'+contextualised_node.idNode)?.getBoundingClientRect().x??0
      const node_y=document.getElementById('shape_'+contextualised_node.idNode)?.getBoundingClientRect().y??0

      d3.select('#fo_input_label_'+contextualised_node.idNode).style('display','inline-block')
      d3.select('#fo_input_label_'+contextualised_node.idNode).attr('x',(label_x-node_x)).attr('y',label_y-node_y)
      d3.select('#text_'+contextualised_node.idNode).style('display','none')
      document.getElementById('input_label_'+contextualised_node.idNode)?.focus()

      set_contextualised_node(undefined)

    }}
  >
    {t('Noeud.labels.edit_node_label')}
  </Button>:<></>


  // Pop over that serve as context menu
  return contextualised_node!==undefined?<Popover  id="context_node_pop_over" style={{maxWidth:'100%',position:'absolute',inset:style_c_n}}>
    <Popover.Body>
      <ButtonGroup vertical>
        {multi_selected_nodes.current.filter(n=>n!=contextualised_node).length==0 && SankeyUtils.NodeContextHasAggregate(contextualised_node,data)?<Button variant='light' onClick={()=>{
          SankeyUtils.Aggregate(contextualised_node,data,set_agregation_node,set_is_agregation,set_show_agregation)
          multi_selected_nodes.current =[]
          set_data({...data})
          set_contextualised_node(undefined)
        }}>Agrégation</Button>:<></>}
        {multi_selected_nodes.current.filter(n=>n!=contextualised_node).length==0 && SankeyUtils.NodeContextHasDesaggregate(contextualised_node,data)?<Button variant='light' onClick={()=>{
          SankeyUtils.Desaggregate(contextualised_node,data,display_nodes,display_links,set_agregation_node,set_is_agregation,set_show_agregation)
          multi_selected_nodes.current =[]
          set_data({...data})
          set_contextualised_node(undefined)
        }}>Désagrégation</Button>:<></>}
        {sep}
        {button_edit_label_node}
        {sep}
        <Button
          variant='light'
          onClick={() => {
            multi_selected_nodes.current.map(d => SankeyUtils.DeleteNode(data, d))
            multi_selected_nodes.current = []
            set_contextualised_node(undefined)
            set_data({ ...data })

          }}>
          {t('Menu.suppr')}
        </Button>
        {sep}
        <Button
          variant='light'
          onClick={() => {
            Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
              multi_selected_links.current = multi_selected_links.current.concat(Object.values(data.links).filter(l=>  d.outputLinksId.includes(l.idLink)))
              const opacity=SankeyUtils.ReturnValueLink(data,multi_selected_links.current[0],'opacity') as string
              set_display_link_opacity(opacity)
            })
            multi_selected_links.current.forEach(l=>SelectVisualyLinks(l))
          }}>
          {t('Noeud.SlctOutLink')}
        </Button>
        <Button
          variant='light'
          onClick={() => {
            Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
              multi_selected_links.current = multi_selected_links.current.concat(Object.values(data.links).filter(l=>  d.inputLinksId.includes(l.idLink)))
              const opacity=SankeyUtils.ReturnValueLink(data,multi_selected_links.current[0],'opacity') as string
              set_display_link_opacity(opacity)
            })
            multi_selected_links.current.forEach(l=>SelectVisualyLinks(l))
          }}>
          {t('Noeud.SlctInLink')}
        </Button>
        <Button
          variant='light'
          onClick={() => {
            reorganize_node_inputLinksId(data,contextualised_node, data.nodes, data.links)
            reorganize_node_outputLinksId(data,contextualised_node, data.nodes, data.links)
            multi_selected_nodes.current.filter(n=>n!=contextualised_node).forEach(n=>{
              reorganize_node_inputLinksId(data,n, data.nodes, data.links)
              reorganize_node_outputLinksId(data,n, data.nodes, data.links)
            })
            set_contextualised_node(undefined)
            set_data({ ...data })
          }}>
          {t('Noeud.Reorg')}
        </Button>
        {multi_selected_nodes.current.length==1?dropdown_c_n_io:<></>}
        {sep}
        {dropdown_c_n_align_h}
        {dropdown_c_n_align_v}
        {has_node_tags?sep:<></>}
        {dropdown_c_n_tag}
        {sep}

        {dropdown_c_n_apparence}
        {additional_context_element_menu}
        {sep}
        {dropdown_c_n_style}
        {additional_context_element_other}

      </ButtonGroup>
    </Popover.Body>
  </Popover>:<></>
}

export const ContextMenuLink=(contextualised_link:SankeyLink|undefined,set_contextualised_node:(n:SankeyLink|undefined)=>void,
  set_show_menu_link_data:(b:boolean)=>void,
  set_show_menu_link_appearence:(b:boolean)=>void,
  data:SankeyData,set_data:(d:SankeyData)=>void,
  tags_selected:{[k: string]: string},
  multi_selected_links:{current:SankeyLink[]},
  t:TFunction,
  pointer_pos:{current:number[]}
)=>{
  let style_c_l='0px 0px auto auto'
  if(contextualised_link!==undefined){
    style_c_l=(pointer_pos.current[1]-20)+'px auto auto '+(pointer_pos.current[0]+10)+'px'
  }

  const invert_flux=(l:SankeyLink,nodes_to_reorganize: SankeyNode[])=>{

    const tmp = l.idSource
    const previous_node_s = data.nodes[l.idSource]
    previous_node_s.outputLinksId.splice(previous_node_s.outputLinksId.indexOf(l.idLink), 1)
    const source_node = data.nodes[l.idTarget]
    l.idSource = source_node.idNode
    source_node.outputLinksId.push(l.idLink)
    nodes_to_reorganize.push(source_node)
    const previous_node_t = data.nodes[l.idTarget]
    previous_node_t.inputLinksId.splice(previous_node_t.inputLinksId.indexOf(l.idLink), 1)
    const target_node = data.nodes[tmp]
    l.idTarget = target_node.idNode
    target_node.inputLinksId.push(l.idLink)
    nodes_to_reorganize.push(target_node)


  }

  const value_selected_parameter_contextualised_link = (): SankeyLinkValue => {
    if(contextualised_link===undefined){
      return ({} as SankeyLinkValue)
    }else{
      if ( Object.keys(data.links).length === 0 || !(contextualised_link.idLink in data.links) ) {
        let val = JSON.parse(JSON.stringify(Object(contextualised_link.value)))
        Object.values(tags_selected).map(tag_selected => {
          if (val[tag_selected] === undefined) {
            val[tag_selected] = {}
          }
          val = val[tag_selected]
        })
        return val
      }
      let val = JSON.parse(JSON.stringify(Object(data.links[contextualised_link.idLink].value)))
      Object.values(tags_selected).map(tag_selected => {
        if (val[tag_selected] === undefined) {
          val[tag_selected] = {'display_value': '',tags:{},value:0}
        }
        val = val[tag_selected]
      })
      return val
    }

  }
  const has_flux_tags=Object.values(data.fluxTags).length>0
  // Dropdown to change some pararmeter concerning the appearence of the node
  const dropdown_c_l_tag=(contextualised_link!==undefined && has_flux_tags) && Object.entries(data.nodeTags).length>0?<Dropdown as={ButtonGroup} variant='light' autoClose='outside' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Menu.Transformation.tagFlux_assign')}
    </Dropdown.Toggle>

    <Dropdown.Menu  variant='light'>
      {Object.entries(data.fluxTags).filter(nt=>Object.keys(nt[1].tags).length>0).map(nt=>{
        return <Dropdown as={Button} variant='light' autoClose='outside' drop='end'>
          <Dropdown.Toggle variant="light" id="dropdown-basic">
            {nt[1].group_name}
          </Dropdown.Toggle>
          <Dropdown.Menu  variant='light'>
            {Object.keys(nt[1].tags).map(t=>{
              return <Dropdown.Item onClick={()=>{
                // Assign tag to selected links
                multi_selected_links.current.filter(l=>l!==contextualised_link).forEach(l=>{
                  let val = Object(l.value)
                  Object.values(tags_selected).forEach(tag => {
                    if (val[tag] === undefined) {
                      val[tag] = {}
                    }
                    val = val[tag]
                  })
                  if(!Object.keys(val.tags).includes(nt[0])){
                    val.tags[nt[0]]=[]
                  }
                  if(!val.tags[nt[0]].includes(t)){
                    val.tags[nt[0]].push(t)
                  }else{
                    val.tags[nt[0]].splice(val.tags[nt[0]].indexOf(t))
                  }
                })

                // Assign tag to contextualised link
                let val = Object(contextualised_link.value)
                Object.values(tags_selected).forEach(tag => {
                  if (val[tag] === undefined) {
                    val[tag] = {}
                  }
                  val = val[tag]
                })
                if(!Object.keys(val.tags).includes(nt[0])){
                  val.tags[nt[0]]=[]
                }
                if(!val.tags[nt[0]].includes(t)){
                  val.tags[nt[0]].push(t)
                }else{
                  val.tags[nt[0]].splice(val.tags[nt[0]].indexOf(t))
                }


                set_data({...data})
              }}>
                {nt[1].tags[t].name}{checked(value_selected_parameter_contextualised_link().tags[nt[0]].includes(t))}
              </Dropdown.Item>
            })}
          </Dropdown.Menu>
        </Dropdown>
      })}

    </Dropdown.Menu>
  </Dropdown>:<></>


  const button_open_link_appearence=contextualised_link!==undefined?<Button onClick={()=>{
    set_show_menu_link_appearence(true)
    set_contextualised_node(undefined)
  }} variant='light'>{t('Flux.apparence.apparence')} {icon_open_modal}</Button>:<></>

  // Dropdown to change some pararmeter concerning the style of the node
  const dropdown_c_l_style_select=contextualised_link!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.SelectStyle')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      {
        Object.values(data.style_node).map(sn=>{
          return <Dropdown.Item onClick={()=>{
            contextualised_link.style=sn.idNode
            multi_selected_links.current.filter(n=>n!=contextualised_link).forEach(n=>n.style=sn.idNode)

            set_data({...data})
          }}>{sn.name}{checked(contextualised_link.style==sn.idNode)}</Dropdown.Item>
        })
      }
    </Dropdown.Menu>
  </Dropdown>:<></>
  const dropdown_c_l_style=contextualised_link!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.Style')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      <Dropdown.Item as={Button} variant='light' onClick={()=>{
        delete contextualised_link.local
        multi_selected_links.current.filter(n=>n!=contextualised_link).forEach(n=>delete n.local)
        set_data({...data})
      }}>{t('Noeud.AS')}</Dropdown.Item>
      {dropdown_c_l_style_select}
    </Dropdown.Menu>
  </Dropdown>:<></>

  const dropdown_c_l_layout=contextualised_link!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Flux.layout')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      <Dropdown.Item onClick={()=>{
        multi_selected_links.current.forEach(n=>handleDownLink(data,n.idLink))
        set_data({...data})
      }}>{t('Flux.layoutUp')}</Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        multi_selected_links.current.map(l => {
          const i = l.idLink
          const { links } = data
          const listElmt = Object.keys(links)
          const posElemt = listElmt.indexOf(i)
          listElmt.splice(posElemt, 1)
          listElmt.splice(listElmt.length, 0, i)
          const new_cat: { [key: string]: SankeyLink } = {}
          listElmt.forEach(elt => {
            new_cat[elt] = links[elt]
          })
          for (const member in links) delete links[member]
          Object.assign(links, new_cat)
        })
        set_data({...data})
      }}>{t('Flux.layoutTop')}</Dropdown.Item>





      <Dropdown.Item onClick={()=>{
        multi_selected_links.current.forEach(n=>handleUpLink(data,n.idLink))
        set_data({...data})
      }}>{t('Flux.layoutDown')}</Dropdown.Item>

      <Dropdown.Item onClick={()=>{
        multi_selected_links.current.map(l => {
          const i = l.idLink
          const { links } = data
          const listElmt = Object.keys(links)
          const posElemt = listElmt.indexOf(i)
          listElmt.splice(posElemt, 1)
          listElmt.splice(0, 0, i)
          const new_cat: { [key: string]: SankeyLink } = {}
          listElmt.forEach(elt => {
            new_cat[elt] = links[elt]
          })
          for (const member in links) delete links[member]
          Object.assign(links, new_cat)
        })
        set_data({...data})
      }}>{t('Flux.layoutBottom')}</Dropdown.Item>

    </Dropdown.Menu>
  </Dropdown>:<></>

  const button_open_link_data=contextualised_link!==undefined?<Button onClick={()=>{
    set_show_menu_link_data(true)
    set_contextualised_node(undefined)
  }} variant='light'>{t('Flux.data.données')} {icon_open_modal}</Button>:<></>



  // Pop over that serve as context menu
  return contextualised_link!==undefined?<Popover id="context_link_pop_over" style={{maxWidth:'100%',position:'absolute',inset:style_c_l}}>
    <Popover.Body >
      <ButtonGroup vertical>
        <Button variant='light' onClick={()=>{
          const nodes_to_reorganize: SankeyNode[] = []
          invert_flux(contextualised_link,nodes_to_reorganize)
          multi_selected_links.current.filter(l=>l!==contextualised_link).forEach(l => {
            invert_flux(l,nodes_to_reorganize)
          })
          nodes_to_reorganize.forEach(n => {
            reorganize_inputLinksId(data,n, true, true, data.nodes, data.links)
          })
          set_data({ ...data })
        }}>{t('Flux.if')}</Button>

        {sep}
        {dropdown_c_l_layout}
        {has_flux_tags && sep}
        {dropdown_c_l_tag}
        {sep}
        {button_open_link_data}
        {button_open_link_appearence}
        {sep}
        {dropdown_c_l_style}

      </ButtonGroup>
    </Popover.Body>
  </Popover>:<></>
}

export const ContextZdd=(show_context_zdd:boolean,set_show_context_zdd:(b:boolean)=>void,
  data:SankeyData,set_data:(d:SankeyData)=>void,
  pointer_pos:{current:number[]},
  node_hspace:number,
  set_node_hspace:(n:number)=>void,
  node_vspace:number,
  set_node_vspace:(n:number)=>void,
  t:TFunction,
  set_show_menu_layout:(b:boolean)=>void,

)=>{
  const list_palette_color=[d3.interpolateBlues,d3.interpolateBrBG,d3.interpolateBuGn,d3.interpolatePiYG,d3.interpolatePuOr,
    d3.interpolatePuBu,d3.interpolateRdBu,d3.interpolateRdGy,d3.interpolateRdYlBu,d3.interpolateRdYlGn,d3.interpolateSpectral,
    d3.interpolateTurbo,d3.interpolateViridis,d3.interpolateInferno,d3.interpolateMagma,d3.interpolatePlasma,d3.interpolateCividis,
    d3.interpolateWarm,d3.interpolateCool,d3.interpolateCubehelixDefault,d3.interpolateRainbow,d3.interpolateSinebow]

  const GetRandomInt=(max:number) =>{
    return Math.floor(Math.random() * max)
  }

  let style_c_zdd='0px 0px auto auto'
  if(show_context_zdd){
    style_c_zdd=(pointer_pos.current[1]-20)+'px auto auto '+(pointer_pos.current[0]+10)+'px'
  }

  const button_bg_color=<Form as={Button} variant='light'><Form.Control hidden type='color' id='color_bg_zdd' name='color_bg_zdd' onChange={(evt)=>{
    data.couleur_fond_sankey=evt.target.value
    set_data({...data})
  }}></Form.Control>
  <Form.Label htmlFor='color_bg_zdd'>{t('Menu.BgC')}</Form.Label>
  </Form>

  const button_bg_grid=<><Button variant='light' onClick={()=>{
    data.grid_visible = !data.grid_visible
    set_data({...data})
  }}>{t('MEP.TCG')}{checked(data.grid_visible)}</Button>
  </>
  const button_assgn_rand_node_color=<><Button variant='light' onClick={()=>{
    const color_selected=list_palette_color[GetRandomInt(list_palette_color.length)]
    const n_keys=Object.keys(data.nodes)
    const size_color=n_keys.length

    for(const i in d3.range(size_color)){
      // data[elementTagName][tags_group_key].tags[element_tags[i]].color=d3.color(color_selected(+i/size_color))?.formatHex()
      SankeyUtils.AssignNodeLocalAttribute(data.nodes[n_keys[i]],'color',(d3.color(color_selected(+i/size_color))?.formatHex() as string))
    }
    set_data({...data})
  }}>{t('Menu.rand_node_color')}</Button>
  </>


  const dropdown_c_zdd_scale=<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('MEP.Echelle')}
    </Dropdown.Toggle>

    <Dropdown.Menu variant='light'>
      <Dropdown.Item as={Button} variant='light'>
        <Form.Control
          type="text"
          value={data.user_scale}
          onChange={evt => {
            data.user_scale = +evt.target.value
            set_data({ ...data })
          }}
        />
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>

  const dropdown_c_zdd_max_size_link=<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('MEP.MaxFlux')}
    </Dropdown.Toggle>

    <Dropdown.Menu variant='light'>
      <Dropdown.Item as={Button} variant='light'>
        <Form.Control
          type="text"
          value={data.maximum_flux == null ? undefined :data.maximum_flux}
          onChange={(evt) => {
            const maximum_flux =isNaN(+evt.target.value)?null:+evt.target.value
            data.maximum_flux = maximum_flux
            set_data({ ...data })
          }}
        />
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>

  const dropdown_c_zdd_min_size_link=<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('MEP.MinFlux')}
    </Dropdown.Toggle>

    <Dropdown.Menu variant='light'>
      <Dropdown.Item as={Button} variant='light'>
        <Form.Control
          type="text"
          value={data.minimum_flux == null ? undefined :data.minimum_flux}
          onChange={(evt) => {
            const minimum_flux =isNaN(+evt.target.value)?null:+evt.target.value
            data.minimum_flux = minimum_flux
            set_data({ ...data })
          }}
        />
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>

  const button_pa=<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('MEP.PA')}
    </Dropdown.Toggle>

    <Dropdown.Menu variant='light'>

      {/* Set vertical value for automatic positionning */}
      <Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
        <Dropdown.Toggle variant="light" id="dropdown-basic">
          {t('MEP.Horizontal')}
        </Dropdown.Toggle>
        <Dropdown.Menu variant='light'>
          <Dropdown.Item as={Button} variant='light'>
            <Form.Control
              type="text"
              value={node_hspace}
              onChange={evt => {
                set_node_hspace(+evt.target.value)
                data.h_space = +evt.target.value
              }}
            /></Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      {/* Set vertical value for automatic positionning */}
      <Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
        <Dropdown.Toggle variant="light" id="dropdown-basic">
          {t('MEP.Vertical')}
        </Dropdown.Toggle>
        <Dropdown.Menu variant='light'>
          <Dropdown.Item as={Button} variant='light'>
            <Form.Control
              type="text"
              value={node_vspace}
              onChange={evt => {
                set_node_vspace(+evt.target.value)
                data.h_space = +evt.target.value
              }}
            /></Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      <Dropdown.Item as={Button} variant='light' onClick={() => {
        compute_auto_sankey(data, node_hspace)
        set_data({ ...data })
      }}>{t('MEP.PA_action')}</Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>



  const button_an=<Button variant='light'
    onClick={() => {
      arrangeNodes(data)
      set_data({ ...data })
    }}>
    {t('MEP.AN')}
  </Button>


  let full=t('fullscreen')
  if (!document.fullscreenElement) {
    full=t('fullscreen')
  } else {
    full=t('exitFullscreen')
  }

  const button_fullscreen=<Button variant='light'
    onClick={()=>{
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
      } else if (document.exitFullscreen) {
        document.exitFullscreen()
      }
      set_show_context_zdd(false)
    }}
  >
    {full}
  </Button>

  const button_open_layout=<Button onClick={()=>{
    set_show_menu_layout(true)
    set_show_context_zdd(false)

  }} variant='light'>{t('Menu.MEP')} {icon_open_modal}</Button>
  return show_context_zdd?<Popover id="context_zdd_pop_over" style={{maxWidth:'100%',position:'absolute',inset:style_c_zdd}}>
    <Popover.Body >
      <ButtonGroup vertical>
        {button_fullscreen}
        {sep}
        {button_open_layout}
        {sep}
        {button_assgn_rand_node_color}
        {button_bg_color}
        {button_bg_grid}
        {dropdown_c_zdd_scale}
        {dropdown_c_zdd_min_size_link}
        {dropdown_c_zdd_max_size_link}
        {sep}
        {button_pa}
        {button_an}
      </ButtonGroup>
    </Popover.Body>
  </Popover>:<></>
}

const  DataTagsDDNavBar = (data:SankeyData,set_data:(d:SankeyData)=>void,set_tags_selected:(o:{[x:string]:string})=>void) => {
  const banner_grouptag = Object.entries(data.dataTags).filter(([, tags_group]) => { return (tags_group.banner == 'one' || tags_group.banner == 'multi') })
  const allDD = banner_grouptag.map(([, tags_group]) => {
    if (tags_group.banner == 'one') {
      let selected = ''
      if ( Object.entries(tags_group.tags).filter(([,v])=>v.selected).length>0 ) {
        selected = Object.entries(tags_group.tags).filter(([,v])=>v.selected)[0][0]
      }
      return (
        <><Form.Group>
          <Col><FormLabel style={{justifyContent: 'center',fontWeight:'bold'}}>{tags_group.group_name}</FormLabel></Col>
          <Col>
            {<Form.Select key={tags_group.group_name} 
              style={{ color:'black' }}
              placeholder='all' value={selected} 
              onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                let has_suffix=false
                const pl=Object.entries(data.links).map(l=>{
                  const suffixeStart= l[0].indexOf('_')
                  if(suffixeStart>=0){
                    has_suffix=true
                    l[0]=l[0].slice(0,suffixeStart)
                    l[1].idLink=l[0]
                    data.nodes[l[1].idSource].outputLinksId=data.nodes[l[1].idSource].outputLinksId.filter(nl=>nl.indexOf('_')==-1)
                    data.nodes[l[1].idTarget].inputLinksId=data.nodes[l[1].idTarget].inputLinksId.filter(nl=>nl.indexOf('_')==-1)

                    //Ajoute dans les noeuds source/target les id de flux
                    const ind_in_src=data.nodes[l[1].idSource].outputLinksId.indexOf(l[1].idLink)
                    if(ind_in_src==-1){
                      data.nodes[l[1].idSource].outputLinksId.push(l[0])
                    }
                    const ind_in_trgt=data.nodes[l[1].idTarget].inputLinksId.indexOf(l[1].idLink)
                    if(ind_in_trgt==-1){
                      data.nodes[l[1].idTarget].inputLinksId.push(l[0])
                    }
                  }
                  return l
                })
                // Reforme les flux originel (sans suffixe) et supprime les doublons par la méme occasions
                const pureLinks=Object.fromEntries(pl)

                // Check si on avait des flux avec suffixes, si c'est le cas : reforme linksZIndex
                if(has_suffix){
                  data.linkZIndex=Object.keys(pureLinks)
                }

                data.links=pureLinks
                handleSimpleDropdown(evt, tags_group,data,set_data)
                const newEntries = new Map(Object.entries(data.dataTags).map(([dataTagKey, dataTag]) => {
                  return (Object.keys(dataTag.tags).length > 0) ? [
                    dataTagKey,
                    Object.entries(dataTag.tags).filter(tag => tag[1].selected).length > 0 ? Object.entries(dataTag.tags).filter(tag => tag[1].selected)[0][0] : Object.keys(dataTag.tags)[0]] : ['n', 'n']
                }))
                const dataTagsSelected = Object.fromEntries(newEntries)
                set_tags_selected(dataTagsSelected)
              }}>
              {
                Object.entries(tags_group.tags).map(([tag_key, tag],i) => {
                  return (<option key={i} value={tag_key} >{tag.name}</option>)
                })}
            </Form.Select>}
          </Col>
        </Form.Group>
        </>)
    }
    else if (tags_group.banner == 'multi') {
      const selected = Object.entries(tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
      const options = Object.entries(tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name ,'disabled':((selected.length<2 && tag[1].name==selected[0].label))} })
      return (
        <>
          <Form.Group>
            <Col><FormLabel style={{justifyContent: 'center',fontWeight:'bold'}}>{tags_group.group_name}</FormLabel></Col>
            <Col><MultiSelect
              className={'multidropdown_filter_node_link'}
              style={{ color: 'black'}}
              labelledBy={'dropdown_link_filter'}
              overrideStrings={{
                'selectAll': 'Tout sélectionner',
              }}
              value={selected}
              options={options}
              onChange={(selected: [{ label: string, value: string }]) => {
                HandleMultiDropdown(selected, tags_group, data, set_data)

                //Multiplie les flux par le nombre de dataTags Sélectionné ( et si le lien à une valeur pour ce dataTags)
                if(Object.keys(data.dataTags).length>0){

                  const pl=Object.entries(data.links).map(l=>{
                    const suffixeStart= l[0].indexOf('_')
                    if(suffixeStart>=0){
                      l[0]=l[0].slice(0,suffixeStart)
                      l[1].idLink=l[0]
                      data.nodes[l[1].idSource].outputLinksId=data.nodes[l[1].idSource].outputLinksId.filter(nl=>nl.indexOf('_')==-1)
                      data.nodes[l[1].idTarget].inputLinksId=data.nodes[l[1].idTarget].inputLinksId.filter(nl=>nl.indexOf('_')==-1)
                    }
                    return l
                  })
                  // Reforme les flux originel (sans suffixe) et supprime les doublons par la méme occasions
                  const pureLinks=Object.fromEntries(pl)

                  const new_links={} as { [link_id: string]: SankeyLink }

                  Object.values(pureLinks).forEach(l=>{
                    const suffix=''
                    SankeyUtils.RecursionDataTag(data,data.dataTags,0,suffix,(l as SankeyLink),new_links)
                  })
                  data.links=new_links
                  data.linkZIndex=Object.keys(new_links)
                  set_data({...data})
                }
              }} /></Col>
          </Form.Group>
        </>)
    }
  })
  return allDD
}
export const OpenSankeySaveButton=(t:TFunction)=>{
  return <>
    <OverlayTrigger
      key={'buttonCheckpoint'}
      placement={'left'}
      delay={500}
      overlay={(<Tooltip id={'buttonCheckpoint'}>{t('Menu.tooltips.checkpoint')} </Tooltip>)}
    >
      <Button variant='light' onClick={() => {const ev = document;const tmp = new KeyboardEvent('keydown',{key:'s',ctrlKey:true})
        if (ev.onkeydown) {
          ev.onkeydown(tmp)
        }
      }}  ><FontAwesomeIcon style={{width:'2rem',height:'2rem'}} icon={faFloppyDisk} /></Button></OverlayTrigger></>
}
export const LastCheckpointTime=(t:TFunction)=>{
  const last_save=localStorage.getItem('last_save')
  let l_s_c=''
  const has_save=last_save!==undefined && last_save!==null
  if(last_save!==undefined && last_save!==null){
    l_s_c=last_save
  }
  return has_save?<Form.Label style={{marginTop:'auto',marginBottom:'auto',fontSize:'10px'}}>{t('Menu.last_save')+' : ' + l_s_c}</Form.Label>:<></>

}