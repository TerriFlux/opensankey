import * as d3 from 'd3'
import React, { FunctionComponent, useState } from 'react'
import { Dropdown, ButtonGroup, Button, Popover, Form } from 'react-bootstrap'
import { ContextMenuZddFType } from './types/SankeyMenuContextZDDTypes'
import { ComputeAutoSankey, arrangeNodes } from '../draw/SankeyDrawLayout'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { GetRandomInt, AssignNodeLocalAttribute } from '../configmenus/SankeyUtils'

const icon_open_modal=<FontAwesomeIcon style={{float:'right'}} icon={faUpRightFromSquare} />
const sep=<Button variant='light' disabled><hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></Button>
const checked=(b:boolean)=><span style={{float:'right'}}>{b?'✓':''}</span>

export const ContextMenuZdd : FunctionComponent<ContextMenuZddFType> =({
  applicationContext,
  dict_variable_application_data,
  contextMenu,
  dict_hook_ref_setter_show_dialog_components
}) => {

  const [ show_context_zdd, set_show_context_zdd ] = useState(false)
  if ( contextMenu.showContextZDDRef.current!.length === 0 ) {
    contextMenu.showContextZDDRef.current!.push([ show_context_zdd, set_show_context_zdd ])
  }
  const { data, set_data } = dict_variable_application_data
  const { t } = applicationContext
  const { pointer_pos } = contextMenu

  const [node_hspace,set_node_hspace] = useState(data.h_space)
  const [node_vspace,set_node_vspace] = useState(data.v_space) 

  const list_palette_color=[d3.interpolateBlues,d3.interpolateBrBG,d3.interpolateBuGn,d3.interpolatePiYG,d3.interpolatePuOr,
    d3.interpolatePuBu,d3.interpolateRdBu,d3.interpolateRdGy,d3.interpolateRdYlBu,d3.interpolateRdYlGn,d3.interpolateSpectral,
    d3.interpolateTurbo,d3.interpolateViridis,d3.interpolateInferno,d3.interpolateMagma,d3.interpolatePlasma,d3.interpolateCividis,
    d3.interpolateWarm,d3.interpolateCool,d3.interpolateCubehelixDefault,d3.interpolateRainbow,d3.interpolateSinebow]


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
      AssignNodeLocalAttribute(data.nodes[n_keys[i]],'color',(d3.color(color_selected(+i/size_color))?.formatHex() as string))
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
        ComputeAutoSankey(data, node_hspace)
        set_data({ ...data })
      }}>{t('MEP.PA_action')}</Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>


  const button_mask_leg=<Button variant='light'
    onClick={() => {
      data.mask_legend=!data.mask_legend
      set_data({ ...data })
    }}>
    {data.mask_legend?t('MEP.hide_leg'):t('MEP.show_leg')}
  </Button>

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
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_layout.current(true)
    set_show_context_zdd(false)

  }} variant='light'>{t('Menu.MEP')} {icon_open_modal}</Button>
  return show_context_zdd?<Popover id="context_zdd_pop_over" style={{maxWidth:'100%',position:'absolute',inset:style_c_zdd}}>
    <Popover.Body >
      <ButtonGroup vertical>
        {button_pa}
        {button_an}
        {sep}
        {button_assgn_rand_node_color}
        {sep}

        {button_bg_color}
        {button_bg_grid}
        {dropdown_c_zdd_scale}
        {button_mask_leg}
        {sep}
        {button_open_layout}
        {sep}
        {button_fullscreen}
        
      </ButtonGroup>
    </Popover.Body>
  </Popover>:<></>
}