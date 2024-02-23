import React,{useState} from 'react'
import { FormControl, Form, OverlayTrigger, Tooltip, Col, FormLabel, Row } from 'react-bootstrap'
import {
  Box,
  Checkbox
} from '@chakra-ui/react'

import { GetLinkValue, StyleTitleSubSectionMenuEditionElements, styleRowInput } from './SankeyUtils'
import { OpenSankeyMenuConfigurationLayoutFType} from './types/SankeyMenuConfigurationLayoutTypes'
import { DrawLegend } from '../draw/SankeyDrawLegend'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

export const OpenSankeyMenuConfigurationLayout : OpenSankeyMenuConfigurationLayoutFType = (
  applicationContext,
  dict_variable_application_data,
  contextMenu,
  dict_variable_elements_selected,
  legend_clicked,
  extra_background_element
) => {
  const { t } = applicationContext
  const { data, set_data} = dict_variable_application_data
  const { userScaleRef } = dict_variable_elements_selected
  //const { pointer_pos, set_tag_contextualised } = contextMenu

  const [legend_position,set_legend_position] = useState(data.legend_position)
  const [current_legend_bg_opacity,set_current_legend_bg_opacity]=useState(data.legend_bg_opacity)
  const [,set_user_scale]=useState(data.user_scale)
  const [minimum_flux,set_minimum_flux] = useState(data.minimum_flux)
  const [maximum_flux,set_maximum_flux] = useState(data.maximum_flux)

  if(data.maximum_flux && data.minimum_flux && data.minimum_flux>data.maximum_flux){
    data.maximum_flux=data.minimum_flux
    set_maximum_flux(data.minimum_flux)
  }
  return [
    <Box
      as='span'
      layerStyle='submenuconfig_part'>
      {t('Menu.background')}
    </Box>,

    /* Couleur du fond de la page */
    <Row>
      <Col><Form.Label>{t('Menu.BgC')}</Form.Label></Col>
      <Col>
        <OverlayTrigger
          key={'MEP.tooltips.BgC'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'MEP.tooltips.BgC'}>{t('MEP.tooltips.BgC')} </Tooltip>}>
          <Form.Control
            type='color'
            value={data.couleur_fond_sankey}
            id='form_color_zdd'
            name='form_color_zdd'
            className='btn_menu_config'
            onChange={evt=>{
              data.couleur_fond_sankey=evt.target.value
              set_data({...data})
            }}/>
        </OverlayTrigger></Col>
    </Row>,

    extra_background_element,

    /* Quadrillage */
    /* Afficher le quadrillage */
    <Row>
      <Col>
        <OverlayTrigger
          key={'MEP.tooltips.GV'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'MEP.tooltips.GV'}>{t('MEP.tooltips.GV')} </Tooltip>}>
          <Checkbox
            isChecked={data.grid_visible}
            iconColor={data.grid_visible?'#78C2AD':'white'}
            icon={data.grid_visible?<FaEye/>:<FaEyeSlash/>}
            onChange={(evt) => {
              data.grid_visible = evt.target.checked
              set_data({ ...data })
            }}
          >
            {t('MEP.TCG')}
          </Checkbox>
        </OverlayTrigger>
      </Col>
    </Row>,

    <Row style={{display:(data.grid_visible?'':'none')}}>
      <Col><Form.Label>{t('MEP.TCG_shift')}</Form.Label></Col>

      {/* Taille de la grille */}
      <Col>
        <OverlayTrigger
          key={'MEP.tooltips.TCG'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'MEP.tooltips.TCG'}>{t('MEP.tooltips.TCG')} </Tooltip>}>
          <FormControl
            type="number"
            min={1}
            max={100}
            step={1}
            className='btn_menu_config'
            value={data.grid_square_size}
            onChange={evt => {
              data.grid_square_size = (+evt.target.value >= 1) ? +evt.target.value : 10
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
    </Row>,

    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />,

    <span style={StyleTitleSubSectionMenuEditionElements({})}>{t('MEP.links_size')}</span>,

    <Row >
      <Col><FormLabel>{t('MEP.Echelle')}</FormLabel></Col>
      <Col><FormControl
        type="text"
        value={  userScaleRef.current }
        isInvalid={userScaleRef.current!=data.user_scale}
        className='btn_menu_config'
        onChange={evt => {
          userScaleRef.current =+evt.target.value
          set_user_scale(+evt.target.value)
        }}
        onBlur={() => {
          data.user_scale = userScaleRef.current
          set_data({ ...data })
        }}
      />
      <FormControl.Feedback type='invalid'>{t('MEP.onBlur')}</FormControl.Feedback></Col>

    </Row>,

    <Row >
      <Col><Form.Label>{t('MEP.link_size_limit')}</Form.Label></Col>
      {/* Taille minimale du flux */}
      <Col xs={6}>
        <Row>
          <Col><FormLabel >{t('MEP.MinFlux')}</FormLabel></Col>
          <Col><FormLabel >{t('MEP.MaxFlux')}</FormLabel></Col>
        </Row>

        <Row>
          <Col>
            <OverlayTrigger
              key={'MEP.tooltips.MinFlux'}
              placement={'top'}
              delay={500}
              rootClose
              overlay={<Tooltip id={'MEP.tooltips.MinFlux'}>{t('MEP.tooltips.MinFlux')} </Tooltip>}>

              <FormControl
                type="number"
                value={minimum_flux!}
                className='btn_menu_config'
                onChange={evt => {
                  set_minimum_flux(+evt.target.value)
                }}
                onBlur={() => {
                  data.minimum_flux = isNaN(Number(minimum_flux))?undefined:minimum_flux
                  set_data({ ...data })
                }}/>
            </OverlayTrigger>
          </Col>

          <Col>
            <OverlayTrigger
              key={'MEP.tooltips.MaxFlux'}
              placement={'top'}
              delay={500}
              rootClose
              overlay={<Tooltip id={'MEP.tooltips.MaxFlux'}>{t('MEP.tooltips.MaxFlux')} </Tooltip>}>
              <FormControl
                type="number"
                value={maximum_flux!}
                className='btn_menu_config'
                onChange={evt => {
                  set_maximum_flux(+evt.target.value)
                }}
                onBlur={() => {
                  data.maximum_flux = maximum_flux
                  set_data({ ...data })
                }}/>
            </OverlayTrigger>
          </Col>
        </Row>
      </Col>

    </Row>,

    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />,

    <Row>
      <Col>
        <Checkbox
          variant='checkbox_title_style'
          icon={data.mask_legend?<FaEye/>:<FaEyeSlash/>}
          isChecked={data.mask_legend}
          onChange={(evt) => {
            data.mask_legend = evt.target.checked
            set_data({ ...data })
          }}
        >
          {t('Menu.Leg')}
        </Checkbox>
      </Col>
    </Row>
    ,

    <div style={{display:(data.mask_legend?'':'none')}}>

      <Row><Col><b>{t('MEP.leg_layout')}</b></Col></Row>
      <Row><Col><span style={{fontStyle:'italic'}}>{t('MEP.leg_layout_text')}</span></Col></Row>
      {/* Font size de la legende*/}

      <Row style={styleRowInput()}>
        <Col><Form.Label>{t('Menu.fontSize')}</Form.Label></Col>
        <Col><OverlayTrigger
          key={'Menu.tooltips.fontSize'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'Menu.tooltips.fontSize'}>{t('Menu.tooltips.fontSize')} </Tooltip>}>
          <FormControl
            className='btn_menu_config'
            type="number"
            step={1}
            value={data.legend_police}
            onChange={evt =>{
              data.legend_police=+evt.target.value
              set_data({ ...data })
            }}/>
        </OverlayTrigger></Col>
      </Row>

      <Row><Col><span style={{fontStyle:'italic'}}>{t('MEP.leg_layout_background')}</span></Col></Row>
      {/* Couleur de fond de la légende */}
      <Row style={styleRowInput()}>
        <Col><Form.Label >{t('Menu.LegBgColor')}</Form.Label></Col>
        <Col><OverlayTrigger
          key={'Menu.tooltips.LegBgColor'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'Menu.tooltips.LegBgColor'}>{t('Menu.tooltips.LegBgColor')} </Tooltip>}>

          <FormControl
            className='btn_menu_config'
            type="color"
            id='form_color_leg'
            name='form_color_leg'
            value={data.legend_bg_color}
            onChange={evt => {
              data.legend_bg_color = evt.target.value
              set_data({ ...data })
            }}
          />
        </OverlayTrigger></Col>
      </Row>

      {/* Opacité du fond de la légende */}
      <Row style={styleRowInput()}>
        <Col><Form.Label >{t('Menu.LegBgOpacity')}</Form.Label></Col>
        <Col><OverlayTrigger
          key={'Menu.tooltips.LegBgOpacity'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'Menu.tooltips.LegBgOpacity'}>{t('Menu.tooltips.LegBgOpacity')} </Tooltip>}>
          <FormControl
            className='btn_menu_config'
            type="number"
            min={0}
            max={1}
            step={0.1}
            value={current_legend_bg_opacity}
            onChange={evt => set_current_legend_bg_opacity(+evt.target.value)}
            onBlur={() => {
              data.legend_bg_opacity = current_legend_bg_opacity
              set_data({ ...data })
            }}/>
        </OverlayTrigger></Col>
      </Row>

      {/* Affichage du bord de la légende */}
      <Row style={styleRowInput()}>
        <Col><OverlayTrigger
          key={'Menu.tooltips.LegBgBorder'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'Menu.tooltips.LegBgBorder'}>{t('Menu.tooltips.LegBgBorder')} </Tooltip>}>
          <Checkbox
            iconColor='white'
            isChecked={data.legend_bg_border}
            onChange={(evt) => {
              data.legend_bg_border = evt.target.checked
              set_data({ ...data })
            }}
          >
            {t('Menu.LegBgBorder')}
          </Checkbox>
        </OverlayTrigger></Col>
      </Row>

      <Row><Col><b>{t('MEP.leg_pos')}</b></Col></Row>

      <Row >
        <Col><Form.Label >{t('Menu.LegX')}</Form.Label></Col>
        <Col><OverlayTrigger
          key={'Menu.tooltips.LegX'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'Menu.tooltips.LegX'}>{t('Menu.tooltips.LegX')} </Tooltip>}>
          <FormControl
            className='btn_menu_config'
            type="text"
            value={Math.round(legend_position[0])}
            onChange={evt => set_legend_position([+evt.target.value, legend_position[1]])}
            onBlur={() => {
              data.legend_position = legend_position
              DrawLegend(dict_variable_application_data,applicationContext,contextMenu,GetLinkValue,legend_clicked)
            }}/>
        </OverlayTrigger></Col>
      </Row>

      {/* Position Y de la legende */}
      <Row >
        <Col><Form.Label>{t('Menu.LegY')}</Form.Label></Col>
        <Col><OverlayTrigger
          key={'Menu.tooltips.LegY'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'Menu.tooltips.LegY'}>{t('Menu.tooltips.LegY')} </Tooltip>}>
          <FormControl
            className='btn_menu_config'
            type="text"
            value={Math.round(legend_position[1])}
            onChange={evt => set_legend_position([legend_position[0], +evt.target.value])}
            onBlur={() => {
              data.legend_position = legend_position
              DrawLegend(dict_variable_application_data,applicationContext,contextMenu,GetLinkValue,legend_clicked)
            }}/>
        </OverlayTrigger></Col>
      </Row>

      {/* Largeur de la fenetre de legende */}
      <Row >
        <Col><Form.Label>{t('Menu.LegWidth')}</Form.Label></Col>
        <Col><OverlayTrigger
          key={'Menu.tooltips.LegWidth'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'Menu.tooltips.LegWidth'}>{t('Menu.tooltips.LegWidth')} </Tooltip>}>
          <FormControl
            className='btn_menu_config'
            type="number"
            step={1}
            value={data.legend_width}
            onChange={evt =>{
              data.legend_width=+evt.target.value
              set_data({ ...data })
            }}/>
        </OverlayTrigger></Col>
      </Row>

      <Row><Col><b>{t('MEP.leg_info')}</b></Col></Row>

      {/* Afficher l'échelle sur le graphe*/}
      <Row>
        <Col>
          <Checkbox
            isChecked={data.display_legend_scale}
            iconColor='white'
            checked={data.display_legend_scale}
            onChange={(evt) => {
              data.display_legend_scale = evt.target.checked
              set_data({ ...data })
            }}
          >
            {t('Menu.display_scale')}
          </Checkbox>
        </Col>
      </Row>

      {/* Afficher les dataTags dans la légende*/}
      <Row>
        <Col>
          <Checkbox
            isChecked={data.legend_show_dataTags}
            iconColor='white'
            checked={data.legend_show_dataTags}
            onChange={(evt) => {
              data.legend_show_dataTags = evt.target.checked
              set_data({ ...data })
            }}
          >
            {t('MEP.leg_show_dataTags')}
          </Checkbox>
        </Col>
      </Row>
    </div>
  ]
}
