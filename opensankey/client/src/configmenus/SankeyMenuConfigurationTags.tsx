import React, { useState, FunctionComponent } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

import { TagsGroup } from '../types/Types'
import { FaArrowAltCircleUp, FaArrowAltCircleDown, FaPlus, FaMinus,FaPalette,FaRandom } from 'react-icons/fa'
import colormap from 'colormap'
import * as d3 from 'd3'
import { AddTag,AddGroupTag, GetRandomInt, resetLinkValueAfterDeleteDTGrp } from './SankeyUtils'
import { FaEye,FaEyeSlash} from 'react-icons/fa'
import { SankeySettingsEditionElementTagsTypes } from './types/SankeyMenuConfigurationTagsTypes'
import { TableContainer,Table, Th, Thead, Tr,Button, Tbody, Td, Box, Input,InputGroup, Select } from '@chakra-ui/react'
const list_palette_color=[d3.interpolateBlues,d3.interpolateBrBG,d3.interpolateBuGn,d3.interpolatePiYG,d3.interpolatePuOr,
  d3.interpolatePuBu,d3.interpolateRdBu,d3.interpolateRdGy,d3.interpolateRdYlBu,d3.interpolateRdYlGn,d3.interpolateSpectral,
  d3.interpolateTurbo,d3.interpolateViridis,d3.interpolateInferno,d3.interpolateMagma,d3.interpolatePlasma,d3.interpolateCividis,
  d3.interpolateWarm,d3.interpolateCool,d3.interpolateCubehelixDefault,d3.interpolateRainbow,d3.interpolateSinebow]

const SankeySettingsEditionElementTags: FunctionComponent<SankeySettingsEditionElementTagsTypes> = ({ 
  applicationContext,dict_variable_application_data,elementTagNameProp,elementNameProp,node_function,link_function,ComponentUpdater,reDrawLegend
}) => {
  const {data}=dict_variable_application_data
  const {t}=applicationContext
  const isNodeTags=elementTagNameProp === 'nodeTags' ? 'nodeTags' : 'fluxTags'
  const type_tag_name=elementTagNameProp === 'dataTags' ? 'dataTags' : isNodeTags
  const [tags_group_key, set_tags_group_key] = useState(Object.keys(data[type_tag_name]).length > 0 ? Object.keys(data[type_tag_name])[0] : '')
  const {updateComponentToolbar,updateComponenSaveInCache}= ComponentUpdater
  const [forceUpdate,setForceUpdate]=useState(false)
  const colormaps = [
    'custom',
    'jet', 'hsv', 'hot', 'cool', 'spring', 'summer', 'autumn', 'winter', 'bone',
    'copper', 'greys', 'YIGnBu', 'greens', 'YIOrRd', 'bluered', 'RdBu', 'picnic',
    'rainbow', 'portland', 'blackbody', 'earth', 'electric',
    'viridis', 'inferno', 'magma', 'plasma', 'warm', 'cool', 'rainbow-soft',
    'bathymetry', 'cdom', 'chlorophyll', 'density', 'freesurface-blue', 'freesurface-red', 'oxygen', 'par', 'phase', 'salinity', 'temperature', 'turbidity', 'velocity-blue', 'velocity-green',
    'cubehelix'
  ]

  const redrawGenereal=()=>{
    node_function.RedrawNodes(Object.values(dict_variable_application_data.display_nodes))
    link_function.RedrawLinks(Object.values(dict_variable_application_data.display_links))
    updateComponentToolbar.current()
    updateComponenSaveInCache.current(false)
    reDrawLegend()
  }

  //Permet de modifier le type de bannier pour le groupTag (si ce non Aucun)
  const handleBanner = (tags_group_key: string, evt: React.ChangeEvent<HTMLSelectElement>) => {
    data[type_tag_name][tags_group_key].banner = evt.target.value
    setForceUpdate(!forceUpdate)
    redrawGenereal()
  }
  // Couleur issu de : https://github.com/d3/d3-scale-chromatic

  let element_tags : string [] = []
  if ( Object.keys(data[type_tag_name]).length > 0 && tags_group_key !== '') {
    if (tags_group_key in data[type_tag_name]) {
      element_tags = Object.keys(data[type_tag_name][tags_group_key].tags)
    } else {
      console.log('tutu')
    }
  }

  // --------------------------------------------

  //add a tags to the selected groupTag
  const handleAddTagButton = () => {
    AddTag(data,type_tag_name,tags_group_key)
    setForceUpdate(!forceUpdate)
    redrawGenereal()
  }

  //add a groupTag
  const handleAddTagGrpButton = () => {
    const k=AddGroupTag(data,type_tag_name,tags_group_key,elementNameProp)
    set_tags_group_key(k)
    setForceUpdate(!forceUpdate)
    redrawGenereal()
  }

  // Delete a tag
  const handleDelTag = (n: string) => {
    
    delete data[type_tag_name][tags_group_key].tags[n]
    setForceUpdate(!forceUpdate)
    redrawGenereal()
  }


  // Delete a groupTag
  const handleDelGroupTag = (tags_group_key: string) => {
    
    const elementName = elementNameProp === 'nodes' ? 'nodes' : 'links'
    delete data[type_tag_name][tags_group_key]
    Object.values(data[elementName]).forEach(
      n => {
        if (n.colorTag === tags_group_key) {
          n.colorTag = ''
        }
        if (elementNameProp === 'nodes') {
          delete n.tags[tags_group_key]
        }
      })
    if (Object.keys(data[type_tag_name]).length > 0) {
      const lastElmt = Object.keys(data[type_tag_name])[Object.keys(data[type_tag_name]).length - 1]
      set_tags_group_key(lastElmt)
    }
    // If we delete a group data tag then we have to reset links value since the link value tree structure change drastically
    if(type_tag_name==='dataTags'){
      resetLinkValueAfterDeleteDTGrp(data)
    }
    setForceUpdate(!forceUpdate)
    redrawGenereal()
  }

  // Switch the position of the groupTag with the one before him on the list of grouptag
  const handleUpGrpTag = (i: string) => {
    
    const listElmt = Object.keys(data[type_tag_name])
    const posElemt = listElmt.indexOf(i)
    listElmt.splice(posElemt, 1)
    listElmt.splice(posElemt - 1, 0, i)
    const new_cat: { [key: string]: TagsGroup } = {}
    listElmt.forEach(elt => {
      new_cat[elt] = data[type_tag_name][elt]
    })
    for (const member in data[type_tag_name]) delete data[type_tag_name][member]
    Object.assign(data[type_tag_name], new_cat)
    setForceUpdate(!forceUpdate)
  }

  // Switch the position of the groupTag with the one after him on the list of grouptag
  const handleDownGrpTag = (i: string) => {
    
    const listElmt = Object.keys(data[type_tag_name])
    const posElemt = listElmt.indexOf(i)
    listElmt.splice(posElemt, 1)
    listElmt.splice(posElemt + 1, 0, i)
    const new_cat: { [key: string]: TagsGroup } = {}
    listElmt.forEach(elt => {
      new_cat[elt] = data[type_tag_name][elt]
    })
    for (const member in data[type_tag_name]) delete data[type_tag_name][member]
    Object.assign(data[type_tag_name], new_cat)
    setForceUpdate(!forceUpdate)

  }
  let variant_table_edit_tag='table_edit_tag_node'
  if(type_tag_name=='fluxTags')variant_table_edit_tag='table_edit_tag_link'
  if(type_tag_name=='dataTags')variant_table_edit_tag='table_edit_tag_data'
  const tagSetting = (<>
    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
    {t('Tags.GE')}:
    <Box display='grid' gridTemplateColumns='2fr 1fr 1fr 1fr'>
      <Select
        variant='menuconfigpanel_option_select'
        onChange={
          (evt: React.ChangeEvent<HTMLSelectElement>) => {
            set_tags_group_key(evt.target.value)
            setForceUpdate(!forceUpdate)
          }}
        value={tags_group_key}>
        {Object.keys(data[type_tag_name]).map(
          (key, i) =>
            <option
              key={i}
              value={key}
            >
              {data[type_tag_name][key].group_name}
            </option>
        )}
      </Select>

      {/* Boutons des palettes de couleur  */}
      {/* Palette de couleur aléatoire  */}
      <OverlayTrigger
        key={'tags.tooltips.1'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'tags.tooltips.1'}>{t('Tags.tooltips.pal')} </Tooltip>}>
        <Button
          backgroundColor='#9E9CFB'
          value='rand' 
          size='sm'
          onClick={()=>{
            const color_selected=list_palette_color[GetRandomInt(list_palette_color.length)]
            const size_color=Object.keys(data[type_tag_name][tags_group_key].tags).length
            for(const i in d3.range(size_color)){
              data[type_tag_name][tags_group_key].tags[element_tags[i]].color=d3.color(color_selected(+i/size_color))?.formatHex()
            }
            redrawGenereal()
            setForceUpdate(!forceUpdate)
          }}>
          <FaPalette/>
        </Button>
      </OverlayTrigger>
      {/* Melanger les couleur  */}
      <OverlayTrigger
        key={'tags.tooltips.2'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'tags.tooltips.2'}>{t('Tags.tooltips.pal_shuffle')} </Tooltip>}>
        <Button 
          backgroundColor='#9CFBC5'
          value='alea' 
          size='sm'
          onClick={()=>{
            const color=element_tags.map(d=>{
              return data[type_tag_name][tags_group_key].tags[d].color
            })
            let size_color=color.length
            for(const i in d3.range(size_color)){
              size_color=color.length
              const color_to_select=GetRandomInt(size_color)
              const c=color.splice(color_to_select,1)
              if(c!=undefined && c!=null){
                const v=c[0]
                data[type_tag_name][tags_group_key].tags[element_tags[i]].color=v
              }
            }
            redrawGenereal()
            setForceUpdate(!forceUpdate)
          }}>
          <FaRandom/>
        </Button>
      </OverlayTrigger>

      {/* Palettes des couleurs standard */}
      <OverlayTrigger
        key={'tags.tooltips.3'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'tags.tooltips.3'}>{t('Tags.tooltips.pal_std')} </Tooltip>}>
        <Select
          variant='menuconfigpanel_option_select'
          onChange={
            (evt: React.ChangeEvent<HTMLSelectElement>) => {
              data[type_tag_name][tags_group_key].color_map = evt.target.value
              const nb_tags = Object.keys(data[type_tag_name][tags_group_key].tags).length
              if (evt.target.value === 'custom') {
                return
              }
              const colors = colormap({
                colormap: evt.target.value,
                nshades: Math.max(11, nb_tags),
                format: 'hex',
                alpha: 1
              })
              let step = 1
              if (nb_tags < 11) {
                step = Math.round(11 / nb_tags)
              }
              Object.keys(data[type_tag_name][tags_group_key].tags).forEach(
                (tag_key, i) => data[type_tag_name][tags_group_key].tags[tag_key].color = colors[i * step]
              )
              redrawGenereal()
              setForceUpdate(!forceUpdate)
            }}
          value={(Object.keys(data[type_tag_name]).length>0 && data[type_tag_name][tags_group_key] &&  tags_group_key!='')? data[type_tag_name][tags_group_key].color_map:''}
        >
          {colormaps.map(
            (cur_colormap, i) =>
              <option key={i} value={cur_colormap}>{cur_colormap}</option>
          )}
        </Select>
      </OverlayTrigger>
    </Box>

    {/* Entete du Tableau des étiquettes  */}
    <TableContainer>
      <Table variant={variant_table_edit_tag} >
        <Thead>
          <Tr >
            <Th>
              {/* Bouton ajout d'une étiquette  */}
              <OverlayTrigger
                key={'tags.tooltips.4'}
                placement={'top'}
                delay={500}
                overlay={<Tooltip id={'tags.tooltips.4'}>{t('Tags.tooltips.add')} </Tooltip>}>
                <Button
                  variant='menuconfigpanel_add_button'
                  value='+' onClick={handleAddTagButton}>
                  <FaPlus />
                </Button>
              </OverlayTrigger>
            </Th>
            {/* Nom de l'étqiuette  */}
            <Th>
              {t('Tags.Nom')}
            </Th>
            {/* Etiquette visible  */}
            { type_tag_name !== 'dataTags' ?
              <Th>
                {t('Tags.Visible')}
              </Th>:<></>
            }
            <Th>
              {t('Tags.Couleur')}
            </Th>
            { elementNameProp === 'nodes' ?
              <Th>
                {t('Tags.Forme')}
              </Th>:<></>
            }
          </Tr>
        </Thead>

        {/* Tableau des étqiuettes du groupe  */}
        <Tbody>
          {element_tags.length > 0 ? element_tags.map(
            (tag_key, i) => {
              const tag_visible=data[type_tag_name][tags_group_key].tags[tag_key].selected
              return (
                <Tr key={i.toString()} > 
                  {/* Supprimer une etiquette  */}
                  <Td >
                    <OverlayTrigger
                      key={'tags.tooltips.5'}
                      placement={'top'}
                      delay={500}
                      overlay={<Tooltip id={'tags.tooltips.5'}>{t('Tags.tooltips.rm')} </Tooltip>}>
                      <Button size={'sm'}
                        variant='menuconfigpanel_del_button_in_table' 
                        value='-' onClick={() => { handleDelTag(tag_key) }}>
                        <FaMinus />
                      </Button>
                    </OverlayTrigger>
                  </Td>
                  {/* Renommer l'étiquette  */}
                  {/* Met une largeur de cellue plus petite quand c'est les étiquettes de noeud car le tableau contient une colonne de plsu (forme) */}
                  <Td >
                    <OverlayTrigger
                      key={'tags.tooltips.6'}
                      placement={'top'}
                      delay={500}
                      overlay={<Tooltip id={'tags.tooltips.6'}>{t('Tags.tooltips.nom')} </Tooltip>}>
                      <InputGroup variant='menuconfigpanel_option_input_table' >
                        <Input
                          variant='menuconfigpanel_option_input_table'
                          id={i.toString()}
                          type="text"
                          value={data[type_tag_name][tags_group_key].tags[tag_key].name}
                          onChange={
                            (evt: React.ChangeEvent) => {
                              const new_nb_element = evt.target as HTMLInputElement
                              const name = new_nb_element.value
                              data[type_tag_name][tags_group_key].tags[tag_key].name = name
                              redrawGenereal()
                              setForceUpdate(!forceUpdate)
                            }
                          }/>
                      </InputGroup>
                    </OverlayTrigger>
                  </Td>
                  {/* Rendre ou non visible  */}
                  { type_tag_name !== 'dataTags' ?
                    <Td >
                      <OverlayTrigger
                        key={'tags.tooltips.7'}
                        placement={'top'}
                        delay={500}
                        overlay={<Tooltip id={'tags.tooltips.7'}>{t('Tags.tooltips.visible')} </Tooltip>}>
                        <Button
                          variant='menuconfigpanel_option_btn_in_table'
                          name={'element_visible' + tag_key}
                          id={tag_key}
                          onClick={
                            () => {
                              const visible = !tag_visible
                              data[type_tag_name][tags_group_key].tags[tag_key].selected = visible
                              redrawGenereal()
                              setForceUpdate(!forceUpdate)
                            }}>{tag_visible?<FaEye/>:<FaEyeSlash/>}</Button>
                      </OverlayTrigger>

                    </Td>:<></>
                  }
                  {/* Choix de la couleur*/}
                  <Td >
                    <OverlayTrigger
                      key={'tags.tooltips.8'}
                      placement={'top'}
                      delay={500}
                      overlay={<Tooltip id={'tags.tooltips.8'}>{t('Tags.tooltips.couleur')} </Tooltip>}>
                      <Input padding= '0.25rem' width='revert' height='revert'
                        type='color'
                        value={data[type_tag_name][tags_group_key].tags[tag_key].color as string}
                        onChange={
                          evt => {
                            data[type_tag_name][tags_group_key].tags[tag_key].color = evt.target.value
                            redrawGenereal()
                            setForceUpdate(!forceUpdate)
                          }}/>
                    </OverlayTrigger>
                  </Td>
                  {/* Chosir la forme du noeud  */}
                  { elementNameProp === 'nodes' ? (
                    <Td>
                      <OverlayTrigger
                        key={'tags.tooltips.9'}
                        placement={'top'}
                        delay={500}
                        overlay={<Tooltip id={'tags.tooltips.9'}>{t('Tags.tooltips.forme')} </Tooltip>}>
                        <Select variant='menuconfigpanel_option_select_table'
                          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                            data[type_tag_name][tags_group_key].tags[tag_key].shape = evt.target.value
                            redrawGenereal()
                            setForceUpdate(!forceUpdate)
                          }}
                          value={data[type_tag_name][tags_group_key].tags[tag_key].shape as string}
                        >
                          <option key={'rect' + i} id='rect' value='rect'>Rectangle</option>
                          <option key={'circle' + i} id='circle' value='ellipse'>Circle</option>
                        </Select>
                      </OverlayTrigger>
                    </Td>
                  ) :
                    (<></>)

                  }
                </Tr>
              )
            }) : (<></>)}
        </Tbody>
      </Table>
    </TableContainer>
  </>
  )

  return (
    <Box layerStyle='menuconfigpanel_grid'>
      {/* Groupe d'étiquette  */}
      <TableContainer>
        <Table variant='table_edit_grp_tag_node_link'>
          {/* Entete du tableau de grouep d'etiquette  */}
          <Thead>
            <Tr>
              {/* Ajouter un groupe */}
              <Th>
                <OverlayTrigger
                  key={'tags.tooltips.10'}
                  placement={'top'}
                  delay={500}
                  overlay={<Tooltip id={'tags.tooltips.10'}>{t('Tags.tooltips.add_grp')} </Tooltip>}>
                  <Button
                    variant='menuconfigpanel_add_button'
                    onClick={handleAddTagGrpButton}>
                    <FaPlus/>
                  </Button>
                </OverlayTrigger>
              </Th>
              {/* Autre entetes  */}
              <Th>{t('Tags.Nom')}</Th>
              <Th>{t('Tags.Bannière')}</Th>
              {(type_tag_name!='dataTags')?<Th>{t('Tags.Position')}</Th>:<></>}
            </Tr>
          </Thead>
          {/* Liste des groupes d'étiquettes  */}
          <Tbody>
            {
              Object.keys(data[type_tag_name]).map(
                (tags_group_key, i) => {
                  return (
                    <Tr key={i.toString()}>
                      {/* Suppression d'un groupe  */}
                      <Td>
                        <OverlayTrigger
                          key={'tags.tooltips.11'}
                          placement={'top'}
                          delay={500}
                          overlay={<Tooltip id={'tags.tooltips.11'}>{t('Tags.tooltips.rm_grp')} </Tooltip>}>
                          <Button
                            size={'sm'}
                            variant='menuconfigpanel_del_button_in_table'
                            onClick={() => handleDelGroupTag(tags_group_key)}>
                            <FaMinus />
                          </Button>
                        </OverlayTrigger>
                      </Td>
                      {/* Renommer le groupe d'étiquettes */}
                      <Td>
                        <OverlayTrigger
                          key={'tags.tooltips.12'}
                          placement={'top'}
                          delay={500}
                          overlay={<Tooltip id={'tags.tooltips.12'}>{t('Tags.tooltips.nom_grp')} </Tooltip>}>
                          <InputGroup variant='menuconfigpanel_option_input_table' >
                            <Input
                              variant='menuconfigpanel_option_input_table'
                              id={i.toString()}
                              type="text"
                              value={data[type_tag_name][tags_group_key].group_name}
                              onChange={
                                (evt: React.ChangeEvent) => {
                                  const new_name = (evt.target as HTMLInputElement).value
                                  data[type_tag_name][tags_group_key].group_name = new_name
                                  setForceUpdate(!forceUpdate)
                                }}/>
                          </InputGroup>
                        </OverlayTrigger>
                      </Td>
                      {/* Banniere  */}
                      <Td>
                        <OverlayTrigger
                          key={'tags.tooltips.14'}
                          placement={'top'}
                          delay={500}
                          overlay={<Tooltip id={'tags.tooltips.14'}>{t('Tags.tooltips.banner')} </Tooltip>}>
                          <Select
                            variant='menuconfigpanel_option_select_table'
                            onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => handleBanner(tags_group_key, evt)}
                            value={data[type_tag_name][tags_group_key].banner}
                          >
                            {(type_tag_name!='dataTags')?<option key={'none' + i} id='NoneBaner' value='none'>{t('Menu.Aucun')}</option>:<></>}
                            <option key={'one' + i} id='OneBaner'  value='one'>{t('Tags.Unique')}</option>
                            <option key={'multi' + i} id='MultipleBaner' value='multi'>{t('Tags.Multiple')}</option>
                          </Select>
                        </OverlayTrigger>
                      </Td>
                      {/* Monter ou descendre groupe d'étiquette  */}
                      {(type_tag_name!='dataTags')?
                        <Td>
                          {/* Monter le groupe d'étiquette */}
                          <OverlayTrigger
                            key={'tags.tooltips.15'}
                            placement={'top'}
                            delay={500}
                            overlay={<Tooltip id={'tags.tooltips.15'}>{t('Tags.tooltips.up')} </Tooltip>}>
                            <Button
                              variant='menuconfigpanel_option_btn_in_table'
                              borderRadius='6px 0px 0px 6px'        
                              onClick={() => handleUpGrpTag(tags_group_key)}>
                              <FaArrowAltCircleUp />
                            </Button>
                          </OverlayTrigger>
                          {/* Descendre le groupe d'étiquettes  */}
                          <OverlayTrigger
                            key={'tags.tooltips.16'}
                            placement={'top'}
                            delay={500}
                            overlay={<Tooltip id={'tags.tooltips.16'}>{t('Tags.tooltips.down')} </Tooltip>}>
                            <Button 
                              variant='menuconfigpanel_option_btn_in_table'
                              borderRadius='0px 6px 6px 0px'        
                              onClick={() => handleDownGrpTag(tags_group_key)}>
                              <FaArrowAltCircleDown />
                            </Button>
                          </OverlayTrigger>
                        </Td>:<></>
                      }
                    </Tr>
                  )
                })
            }
          </Tbody>
        </Table></TableContainer>
      {Object.keys(data[type_tag_name]).length > 0 ? tagSetting : <></>}
    </Box>
  )
}

export default null

export { SankeySettingsEditionElementTags }