import React from 'react'
import { FormControl, Form, OverlayTrigger, Tooltip,InputGroup, Button } from 'react-bootstrap'
import { SankeyData } from './types'
import { TFunction } from 'i18next'

import { FaEye, FaEyeSlash,FaCheck} from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

export const OpenSankeyMenuConfigurationLayout = (
  t:TFunction,
  data: SankeyData,
  set_data:(d:SankeyData)=>void,
  user_scale:number,
  set_user_scale:(n:number)=>void,
  legend_position:number[],
  set_legend_position:(n:number[])=>void
) => {



 
  return [
    <h5>{t('Menu.background')}</h5>,
    /* Couleur du fond de la page */
    <InputGroup>
      <InputGroup.Text style={{width:'60%'}}>{t('Menu.BgC')}</InputGroup.Text>
      <Form.Label for="form_color_zdd" style={{width:'40%',
        'background':data.couleur_fond_sankey,
        border:'1px solid #ced4da',
        borderTopRightRadius:'4px',
        borderBottomRightRadius:'4px',
      }}/>
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
          style={{display:'none'}}
          onChange={evt=>{
            // const c=evt.target.checkeds
            data.couleur_fond_sankey=evt.target.value
            set_data({...data})
          }}/>

      </OverlayTrigger>
    </InputGroup>,
    /* Quadrillage */
    <InputGroup>
      
      <InputGroup.Text style={{width:'60%'}} >{t('MEP.TCG')}</InputGroup.Text>
      
      {/* Taille de la grille */}
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
          value={data.grid_square_size}
          onChange={evt => {
            data.grid_square_size = (+evt.target.value >= 1) ? +evt.target.value : 10
            set_data({ ...data })
          }}/>
      </OverlayTrigger>
      
      {/* Afficher le quadrillage */}
      <OverlayTrigger
        key={'MEP.tooltips.GV'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'MEP.tooltips.GV'}>{t('MEP.tooltips.GV')} </Tooltip>}>
        <Button
          style={{width:'10%'}}
          variant={data.grid_visible?'primary':'outline-primary'}
          onClick={() => {
            data.grid_visible = !data.grid_visible
            set_data({ ...data })
          }}>{data.grid_visible?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
      </OverlayTrigger>
      
    </InputGroup>,
    /* Echelle du Sankey */
    <InputGroup>
      
      <InputGroup.Text style={{width:'60%'}} >{t('MEP.Echelle')} ({t('MEP.vp100')})</InputGroup.Text>
      
      
      <OverlayTrigger
        key={'MEP.tooltips.Echelle'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'MEP.tooltips.Echelle'}>{t('MEP.tooltips.Echelle')} </Tooltip>}>
        <FormControl
          type="text"
          value={user_scale}
          isInvalid={user_scale!=data.user_scale}
          onChange={evt => {
            set_user_scale(+evt.target.value)
          }}
          onBlur={() => {
            data.user_scale = user_scale
            set_data({ ...data })
          }}/>
      </OverlayTrigger>
      <FormControl.Feedback type='invalid'>{t('MEP.onBlur')}</FormControl.Feedback>
     
    </InputGroup>,

    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />,

    <h5>{t('Menu.Leg')}</h5>,
    /* Position X de la legende  */
    <InputGroup>
      
      <InputGroup.Text style={{width:'60%'}} >{t('Menu.LegX')}</InputGroup.Text>
      
      
      <OverlayTrigger
        key={'Menu.tooltips.LegX'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'Menu.tooltips.LegX'}>{t('Menu.tooltips.LegX')} </Tooltip>}>
        <FormControl
          type="text"
          value={legend_position[0]}
          onChange={evt => set_legend_position([+evt.target.value, legend_position[1]])}
          onBlur={() => {
            data.legend_position = legend_position
            set_data({ ...data })
          }}/>
      </OverlayTrigger>
      
    </InputGroup>,
    /* Position Y de la legende */
    <InputGroup>
      
      <InputGroup.Text style={{width:'60%'}}>{t('Menu.LegY')}</InputGroup.Text>
      
      
      <OverlayTrigger
        key={'Menu.tooltips.LegY'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'Menu.tooltips.LegY'}>{t('Menu.tooltips.LegY')} </Tooltip>}>
        <FormControl
          type="text"
          value={legend_position[1]}
          onChange={evt => set_legend_position([legend_position[0], +evt.target.value])}
          onBlur={() => {
            data.legend_position = legend_position
            set_data({ ...data })
          }}/>
      </OverlayTrigger>
      
    </InputGroup>,
    /* Largeur de la fenetre de legende */
    <InputGroup>
      
      <InputGroup.Text style={{width:'60%'}}>{t('Menu.LegWidth')}</InputGroup.Text>
      
      
      <OverlayTrigger
        key={'Menu.tooltips.LegWidth'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'Menu.tooltips.LegWidth'}>{t('Menu.tooltips.LegWidth')} </Tooltip>}>
        <FormControl
          type="number"
          step={1}
          value={data.legend_width}
          onChange={evt =>{
            data.legend_width=+evt.target.value
            set_data({ ...data })
          }}/>
      </OverlayTrigger>
      
    </InputGroup>,
    // Afficher l'échelle sur le graphe
    <InputGroup>
      
      <InputGroup.Text style={{width:'60%'}}>{t('Menu.display_scale')}</InputGroup.Text>
      
      
      <Button
        variant={data.display_legend_scale?'primary':'outline-primary'}
        style={{width:'40%'}}
        onClick={() => {
          data.display_legend_scale = !data.display_legend_scale
          set_data({ ...data })
        }}>{data.display_legend_scale?<FaEye/>:<FaEyeSlash/>}</Button>
      
    </InputGroup>,
    /* Font size de la legende*/
    <InputGroup>
      
      <InputGroup.Text style={{width:'60%'}}>{t('Menu.fontSize')}</InputGroup.Text>
      
      
      <OverlayTrigger
        key={'Menu.tooltips.fontSize'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'Menu.tooltips.fontSize'}>{t('Menu.tooltips.fontSize')} </Tooltip>}>
        <FormControl
          type="number"
          step={1}
          value={data.legend_police}
          onChange={evt =>{
            data.legend_police=+evt.target.value
            set_data({ ...data })
          }}/>
      </OverlayTrigger>
      
    </InputGroup>,


   
  ]
}
