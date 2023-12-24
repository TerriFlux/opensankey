import React, { useState, FunctionComponent } from 'react'
import { Button, FormControl, Form, FormLabel, Table, ButtonGroup,  OverlayTrigger, Tooltip, InputGroup } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { SankeyDataPropTypes,  TagsGroup } from '../../types/Types'
import { FaArrowAltCircleUp, FaArrowAltCircleDown, FaPlus, FaMinus,FaPalette,FaRandom } from 'react-icons/fa'
import colormap from 'colormap'
import * as d3 from 'd3'
import { AddTag,AddGroupTag, GetRandomInt } from './SankeyUtils'
import { FaEye,FaEyeSlash} from 'react-icons/fa'


const SankeySettingsEditionTagsPropTypes = {
  t: PropTypes.func.isRequired,
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  elementTagNameProp: PropTypes.oneOf(['nodeTags','fluxTags','dataTags']).isRequired,
  elementNameProp: PropTypes.oneOf(['nodes','links','none']).isRequired
}
type SankeySettingsEditionTagsTypes = InferProps<typeof SankeySettingsEditionTagsPropTypes>

const SankeySettingsEditionElementTags: FunctionComponent<SankeySettingsEditionTagsTypes> = ({ t,data, set_data,elementTagNameProp,elementNameProp }) => {
  const isNodeTags=elementTagNameProp === 'nodeTags' ? 'nodeTags' : 'fluxTags'
  const type_tag_name=elementTagNameProp === 'dataTags' ? 'dataTags' : isNodeTags
  const [tags_group_key, set_tags_group_key] = useState(Object.keys(data[type_tag_name]).length > 0 ? Object.keys(data[type_tag_name])[0] : '')
  const colormaps = [
    'custom',
    'jet', 'hsv', 'hot', 'cool', 'spring', 'summer', 'autumn', 'winter', 'bone',
    'copper', 'greys', 'YIGnBu', 'greens', 'YIOrRd', 'bluered', 'RdBu', 'picnic',
    'rainbow', 'portland', 'blackbody', 'earth', 'electric',
    'viridis', 'inferno', 'magma', 'plasma', 'warm', 'cool', 'rainbow-soft',
    'bathymetry', 'cdom', 'chlorophyll', 'density', 'freesurface-blue', 'freesurface-red', 'oxygen', 'par', 'phase', 'salinity', 'temperature', 'turbidity', 'velocity-blue', 'velocity-green',
    'cubehelix'
  ]
  const elementTagName = type_tag_name
  //Permet de modifier le type de bannier pour le groupTag (si ce non Aucun)
  const handleBanner = (tags_group_key: string, evt: React.ChangeEvent<HTMLSelectElement>) => {
    data[type_tag_name][tags_group_key].banner = evt.target.value
    set_data({ ...data })
  }
  // Couleur issu de : https://github.com/d3/d3-scale-chromatic
  const list_palette_color=[d3.interpolateBlues,d3.interpolateBrBG,d3.interpolateBuGn,d3.interpolatePiYG,d3.interpolatePuOr,
    d3.interpolatePuBu,d3.interpolateRdBu,d3.interpolateRdGy,d3.interpolateRdYlBu,d3.interpolateRdYlGn,d3.interpolateSpectral,
    d3.interpolateTurbo,d3.interpolateViridis,d3.interpolateInferno,d3.interpolateMagma,d3.interpolatePlasma,d3.interpolateCividis,
    d3.interpolateWarm,d3.interpolateCool,d3.interpolateCubehelixDefault,d3.interpolateRainbow,d3.interpolateSinebow]
  let element_tags : string [] = []
  if ( Object.keys(data[elementTagName]).length > 0 && tags_group_key !== '') {
    if (tags_group_key in data[elementTagName]) {
      element_tags = Object.keys(data[elementTagName][tags_group_key].tags)
    } else {
      console.log('tutu')
    }
  }

  // --------------------------------------------

  //add a tags to the selected groupTag
  const handleAddTagButton = () => {
    AddTag(data,type_tag_name,tags_group_key)
    set_data({ ...data })
  }

  //add a groupTag
  const handleAddTagGrpButton = () => {
    const k=AddGroupTag(data,type_tag_name,tags_group_key,elementNameProp)
    set_tags_group_key(k)
    set_data({ ...data })
  }

  // Delete a tag
  const handleDelTag = (n: string) => {
    const elementTagName = type_tag_name
    delete data[elementTagName][tags_group_key].tags[n]
    set_data({ ...data })
  }


  // Delete a groupTag
  const handleDelGroupTag = (tags_group_key: string) => {
    const elementTagName = type_tag_name
    const elementName = elementNameProp === 'nodes' ? 'nodes' : 'links'
    delete data[elementTagName][tags_group_key]
    Object.values(data[elementName]).forEach(
      n => {
        if (n.colorTag === tags_group_key) {
          n.colorTag = ''
        }
        if (elementNameProp === 'nodes') {
          delete n.tags[tags_group_key]
        }
      })
    if (Object.keys(data[elementTagName]).length > 0) {
      const lastElmt = Object.keys(data[elementTagName])[Object.keys(data[elementTagName]).length - 1]
      set_tags_group_key(lastElmt)
    }
    set_data({ ...data })
  }

  // Switch the position of the groupTag with the one before him on the list of grouptag
  const handleUpGrpTag = (i: string) => {
    const elementTagName = type_tag_name
    const listElmt = Object.keys(data[elementTagName])
    const posElemt = listElmt.indexOf(i)
    listElmt.splice(posElemt, 1)
    listElmt.splice(posElemt - 1, 0, i)
    const new_cat: { [key: string]: TagsGroup } = {}
    listElmt.forEach(elt => {
      new_cat[elt] = data[elementTagName][elt]
    })
    for (const member in data[elementTagName]) delete data[elementTagName][member]
    Object.assign(data[elementTagName], new_cat)
    set_data({ ...data })
  }

  // Switch the position of the groupTag with the one after him on the list of grouptag
  const handleDownGrpTag = (i: string) => {
    const elementTagName = type_tag_name
    const listElmt = Object.keys(data[elementTagName])
    const posElemt = listElmt.indexOf(i)
    listElmt.splice(posElemt, 1)
    listElmt.splice(posElemt + 1, 0, i)
    const new_cat: { [key: string]: TagsGroup } = {}
    listElmt.forEach(elt => {
      new_cat[elt] = data[elementTagName][elt]
    })
    for (const member in data[elementTagName]) delete data[elementTagName][member]
    Object.assign(data[elementTagName], new_cat)
    set_data({ ...data })
  }

  const tagSetting = (<>
    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
    <FormLabel>{t('Tags.GE')}:</FormLabel>
    <InputGroup>

      <Form.Select
        style={{width:'50%'}}
        onChange={
          (evt: React.ChangeEvent<HTMLSelectElement>) => {
            set_tags_group_key(evt.target.value)
            set_data({ ...data })
          }}
        value={tags_group_key}>
        {Object.keys(data[elementTagName]).map(
          (key, i) =>
            <option
              key={i}
              value={key}
            >
              {data[elementTagName][key].group_name}
            </option>
        )}
      </Form.Select>

      {/* Boutons des palettes de couleur  */}
      <ButtonGroup style={{width:'25%'}}>
        {/* Palette de couleur aléatoire  */}
        <OverlayTrigger
          key={'tags.tooltips.1'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tags.tooltips.1'}>{t('Tags.tooltips.pal')} </Tooltip>}>
          <Button variant="secondary" value='rand' 
            size='sm'
            onClick={()=>{
              const color_selected=list_palette_color[GetRandomInt(list_palette_color.length)]
              const size_color=Object.keys(data[elementTagName][tags_group_key].tags).length
              for(const i in d3.range(size_color)){
                data[elementTagName][tags_group_key].tags[element_tags[i]].color=d3.color(color_selected(+i/size_color))?.formatHex()
              }
              set_data({...data})
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
          <Button variant="dark" value='alea' 
            size='sm'
            onClick={()=>{
              const color=element_tags.map(d=>{
                return data[elementTagName][tags_group_key].tags[d].color
              })
              let size_color=color.length
              for(const i in d3.range(size_color)){
                size_color=color.length
                const color_to_select=GetRandomInt(size_color)
                const c=color.splice(color_to_select,1)
                if(c!=undefined && c!=null){
                  const v=c[0]
                  data[elementTagName][tags_group_key].tags[element_tags[i]].color=v
                }
              }
              set_data({...data})
            }}>
            <FaRandom/>
          </Button>
        </OverlayTrigger>
      </ButtonGroup>

      {/* Palettes des couleurs standard */}
      <OverlayTrigger
        key={'tags.tooltips.3'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'tags.tooltips.3'}>{t('Tags.tooltips.pal_std')} </Tooltip>}>
        <Form.Select
          style={{width:'25%'}}
          onChange={
            (evt: React.ChangeEvent<HTMLSelectElement>) => {
              data[elementTagName][tags_group_key].color_map = evt.target.value
              const nb_tags = Object.keys(data[elementTagName][tags_group_key].tags).length
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
              Object.keys(data[elementTagName][tags_group_key].tags).forEach(
                (tag_key, i) => data[elementTagName][tags_group_key].tags[tag_key].color = colors[i * step]
              )
              set_data({ ...data })
            }}
          value={(Object.keys(data[elementTagName]).length>0 && data[elementTagName][tags_group_key] &&  tags_group_key!='')? data[elementTagName][tags_group_key].color_map:''}
        >
          {colormaps.map(
            (cur_colormap, i) =>
              <option key={i} value={cur_colormap}>{cur_colormap}</option>
          )}
        </Form.Select>
      </OverlayTrigger>
    </InputGroup>

    {/* Entete du Tableau des étiquettes  */}
    <Table striped bordered hover responsive='sm' size='sm' className='node_tags_definition'>
      <thead>
        <tr>
          <th>
            {/* Bouton ajout d'une étiquette  */}
            <OverlayTrigger
              key={'tags.tooltips.4'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'tags.tooltips.4'}>{t('Tags.tooltips.add')} </Tooltip>}>
              <Button variant="success" value='+' onClick={handleAddTagButton}>
                <FaPlus />
              </Button>
            </OverlayTrigger>
          </th>
          {/* Nom de l'étqiuette  */}
          <th>
            {t('Tags.Nom')}
          </th>
          {/* Etiquette visible  */}
          { elementTagName !== 'dataTags' ?
            <th>
              {t('Tags.Visible')}
            </th>:<></>
          }
          <th>
            {t('Tags.Couleur')}
          </th>
          { elementNameProp === 'nodes' ?
            <th>
              {t('Tags.Forme')}
            </th>:<></>
          }
        </tr>
      </thead>

      {/* Tableau des étqiuettes du groupe  */}
      <tbody>
        {element_tags.length > 0 ? element_tags.map(
          (tag_key, i) => {
            const tag_visible=data[elementTagName][tags_group_key].tags[tag_key].selected
            return (
              <tr key={i.toString()}>
                {/* Supprimer une etiquette  */}
                <td style={{ 'width': '10%' }}>
                  <OverlayTrigger
                    key={'tags.tooltips.5'}
                    placement={'top'}
                    delay={500}
                    overlay={<Tooltip id={'tags.tooltips.5'}>{t('Tags.tooltips.rm')} </Tooltip>}>
                    <Button variant="danger" value='-' onClick={() => { handleDelTag(tag_key) }}>
                      <FaMinus />
                    </Button>
                  </OverlayTrigger>
                </td>
                {/* Renommer l'étiquette  */}
                {/* Met une largeur de cellue plus petite quand c'est les étiquettes de noeud car le tableau contient une colonne de plsu (forme) */}
                <td style={{ 'width': elementNameProp==='nodes'?'33%':'60%' }}>
                  <OverlayTrigger
                    key={'tags.tooltips.6'}
                    placement={'top'}
                    delay={500}
                    overlay={<Tooltip id={'tags.tooltips.6'}>{t('Tags.tooltips.nom')} </Tooltip>}>
                    <FormControl
                      id={i.toString()}
                      type="text"
                      value={data[elementTagName][tags_group_key].tags[tag_key].name}
                      onChange={
                        (evt: React.ChangeEvent) => {
                          const new_nb_element = evt.target as HTMLInputElement
                          const name = new_nb_element.value
                          data[elementTagName][tags_group_key].tags[tag_key].name = name
                          set_data({ ...data })
                        }
                      }/>
                  </OverlayTrigger>
                </td>
                {/* Rendre ou non visible  */}
                { elementTagName !== 'dataTags' ?
                  <td style={{ 'width': '20%' }}>
                    <OverlayTrigger
                      key={'tags.tooltips.7'}
                      placement={'top'}
                      delay={500}
                      overlay={<Tooltip id={'tags.tooltips.7'}>{t('Tags.tooltips.visible')} </Tooltip>}>
                      <Button
                        variant={tag_visible?'primary':'outline-primary'}
                        name={'element_visible' + tag_key}
                        id={tag_key}
                        onClick={
                          () => {
                            const visible = !tag_visible
                            data[elementTagName][tags_group_key].tags[tag_key].selected = visible
                            set_data({ ...data })
                          }}>{tag_visible?<FaEye/>:<FaEyeSlash/>}</Button>
                    </OverlayTrigger>
                  </td>:<></>
                }
                {/* Choix de la couleur*/}
                <td style={{'width':elementTagName !== 'dataTags'?'10%':'30%'}}>
                  <OverlayTrigger
                    key={'tags.tooltips.8'}
                    placement={'top'}
                    delay={500}
                    overlay={<Tooltip id={'tags.tooltips.8'}>{t('Tags.tooltips.couleur')} </Tooltip>}>
                    <Form.Control
                      type="color"
                      value={data[elementTagName][tags_group_key].tags[tag_key].color as string}
                      onChange={
                        evt => {
                          data[elementTagName][tags_group_key].tags[tag_key].color = evt.target.value
                          set_data({ ...data })
                        }}/>
                  </OverlayTrigger>
                </td>
                <td>
                  {/* Chosir la forme du noeud  */}
                  { elementNameProp === 'nodes' ? (
                    <OverlayTrigger
                      key={'tags.tooltips.9'}
                      placement={'top'}
                      delay={500}
                      overlay={<Tooltip id={'tags.tooltips.9'}>{t('Tags.tooltips.forme')} </Tooltip>}>
                      <Form.Select
                        onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                          data[elementTagName][tags_group_key].tags[tag_key].shape = evt.target.value
                          set_data({ ...data })
                        }}
                        value={data[elementTagName][tags_group_key].tags[tag_key].shape as string}
                      >
                        <option key={'rect' + i} id='rect' value='rect'>Rectangle</option>
                        <option key={'circle' + i} id='circle' value='ellipse'>Circle</option>
                      </Form.Select>
                    </OverlayTrigger>) :
                    (<></>)

                  }
                </td>
              </tr>
            )
          }) : (<></>)}
      </tbody>
    </Table>
  </>
  )

  return (
    <>
      {/* Groupe d'étiquette  */}
      <Table striped bordered hover className='node_group_tags_definition'>
        {/* Entete du tableau de grouep d'etiquette  */}
        <thead>
          <tr>
            {/* Ajouter un groupe */}
            <th>
              <OverlayTrigger
                key={'tags.tooltips.10'}
                placement={'top'}
                delay={500}
                overlay={<Tooltip id={'tags.tooltips.10'}>{t('Tags.tooltips.add_grp')} </Tooltip>}>
                <Button variant="success" onClick={handleAddTagGrpButton}>
                  <FaPlus/>
                </Button>
              </OverlayTrigger>
            </th>
            {/* Autre entetes  */}
            <th>{t('Tags.Nom')}</th>
            <th>{t('Tags.Bannière')}</th>
            {(elementTagName!='dataTags')?<th>{t('Tags.Position')}</th>:<></>}
          </tr>
        </thead>
        {/* Liste des groupes d'étiquettes  */}
        <tbody>
          {
            Object.keys(data[elementTagName]).map(
              (tags_group_key, i) => {
                return (
                  <tr key={i.toString()}>
                    {/* Suppression d'un groupe  */}
                    <td style={{ 'width': '10%' }}>
                      <OverlayTrigger
                        key={'tags.tooltips.11'}
                        placement={'top'}
                        delay={500}
                        overlay={<Tooltip id={'tags.tooltips.11'}>{t('Tags.tooltips.rm_grp')} </Tooltip>}>
                        <Button variant="danger" onClick={() => handleDelGroupTag(tags_group_key)}>
                          <FaMinus />
                        </Button>
                      </OverlayTrigger>
                    </td>
                    {/* Renommer le groupe d'étiquettes */}
                    <td>
                      <OverlayTrigger
                        key={'tags.tooltips.12'}
                        placement={'top'}
                        delay={500}
                        overlay={<Tooltip id={'tags.tooltips.12'}>{t('Tags.tooltips.nom_grp')} </Tooltip>}>
                        <FormControl
                          id={i.toString()}
                          type="text"
                          value={data[elementTagName][tags_group_key].group_name}
                          onChange={
                            (evt: React.ChangeEvent) => {
                              const new_name = (evt.target as HTMLInputElement).value
                              data[elementTagName][tags_group_key].group_name = new_name
                              set_data({ ...data })
                            }}/>
                      </OverlayTrigger>
                    </td>
                    {/* Banniere  */}
                    <td>
                      <OverlayTrigger
                        key={'tags.tooltips.14'}
                        placement={'top'}
                        delay={500}
                        overlay={<Tooltip id={'tags.tooltips.14'}>{t('Tags.tooltips.banner')} </Tooltip>}>
                        <Form.Select onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => handleBanner(tags_group_key, evt)}
                          value={data[type_tag_name][tags_group_key].banner}
                        >
                          {(elementTagName!='dataTags')?<option key={'none' + i} id='NoneBaner' value='none'>{t('Menu.Aucun')}</option>:<></>}
                          <option key={'one' + i} id='OneBaner'  value='one'>{t('Tags.Unique')}</option>
                          <option key={'multi' + i} id='MultipleBaner' value='multi'>{t('Tags.Multiple')}</option>
                        </Form.Select>
                      </OverlayTrigger>
                    </td>
                    {/* Monter ou descendre groupe d'étiquette  */}
                    {(elementTagName!='dataTags')?
                      <td style={{ 'width': '10%' }}>
                        <ButtonGroup className="button_position" size="sm">
                          {/* Monter le groupe d'étiquette */}
                          <OverlayTrigger
                            key={'tags.tooltips.15'}
                            placement={'top'}
                            delay={500}
                            overlay={<Tooltip id={'tags.tooltips.15'}>{t('Tags.tooltips.up')} </Tooltip>}>
                            <Button variant="info" onClick={() => handleUpGrpTag(tags_group_key)}>
                              <FaArrowAltCircleUp />
                            </Button>
                          </OverlayTrigger>
                          {/* Descendre le groupe d'étiquettes  */}
                          <OverlayTrigger
                            key={'tags.tooltips.16'}
                            placement={'top'}
                            delay={500}
                            overlay={<Tooltip id={'tags.tooltips.16'}>{t('Tags.tooltips.down')} </Tooltip>}>
                            <Button variant="info" onClick={() => handleDownGrpTag(tags_group_key)}>
                              <FaArrowAltCircleDown />
                            </Button>
                          </OverlayTrigger>
                        </ButtonGroup>
                      </td>:<></>
                    }
                  </tr>
                )
              })
          }
        </tbody>
      </Table>
      {Object.keys(data[elementTagName]).length > 0 ? tagSetting : <></>}
    </>
  )
}



SankeySettingsEditionElementTags.propTypes = SankeySettingsEditionTagsPropTypes

export default null

export { SankeySettingsEditionElementTags }