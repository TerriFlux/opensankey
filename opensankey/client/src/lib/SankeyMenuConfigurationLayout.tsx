import React,{useState} from 'react'
import { FormControl, Form, OverlayTrigger, Tooltip,InputGroup, Button } from 'react-bootstrap'
import { FaCheck} from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { Checkbox } from '@chakra-ui/react'

import { GetLinkValue, SmoothClasses } from './SankeyUtils'
import { OpenSankeyMenuConfigurationLayoutFType} from '../types/SankeyMenuConfigurationLayoutTypes'
import { DrawLegend } from './SankeyDrawLegend'

export const OpenSankeyMenuConfigurationLayout : OpenSankeyMenuConfigurationLayoutFType = (
  applicationContext,
  applicationData,
  contextMenu,
  userScaleRef,
  legend_clicked,
  extra_background_element
) => {
  const { t } = applicationContext
  const { data, set_data} = applicationData
  //const { pointer_pos, set_tag_contextualised } = contextMenu

  const [legend_position,set_legend_position] = useState(data.legend_position)
  const [current_legend_bg_opacity,set_current_legend_bg_opacity]=useState(data.legend_bg_opacity)
  const [,set_user_scale]=useState(data.user_scale)
  return [
    <h5>{t('Menu.background')}</h5>,
    /* Couleur du fond de la page */
    <InputGroup>
      <InputGroup.Text style={{width:'60%'}}>{t('Menu.BgC')}</InputGroup.Text>
      <Form.Label htmlFor="form_color_zdd" style={{width:'40%',
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
          value={userScaleRef.current }
          isInvalid={userScaleRef.current!=data.user_scale}
          onChange={evt => {
            userScaleRef.current = +evt.target.value
            set_user_scale(+evt.target.value)
          }}
          onBlur={() => {
            data.user_scale = userScaleRef.current
            set_data({ ...data })
          }}/>
      </OverlayTrigger>
      <FormControl.Feedback type='invalid'>{t('MEP.onBlur')}</FormControl.Feedback>
     
    </InputGroup>,

    extra_background_element,

    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />,

    <h5>{t('Menu.Leg')}</h5>,

    <Checkbox 
      sx={SmoothClasses({})}
      iconColor='white'
      maxW={'50%'}
      isChecked={data.mask_legend}
      onChange={(evt) => {
        data.mask_legend = evt.target.checked
        set_data({ ...data })
      }}
    >
      {t('MEP.SLIP')}
    </Checkbox>
    ,

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
          value={Math.round(legend_position[0])}
          onChange={evt => set_legend_position([+evt.target.value, legend_position[1]])}
          onBlur={() => {
            data.legend_position = legend_position
            DrawLegend(applicationData,applicationContext,contextMenu,GetLinkValue,legend_clicked)
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
          value={Math.round(legend_position[1])}
          onChange={evt => set_legend_position([legend_position[0], +evt.target.value])}
          onBlur={() => {
            data.legend_position = legend_position
            DrawLegend(applicationData,applicationContext,contextMenu,GetLinkValue,legend_clicked)
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

    /* Couleur de fond de la légende */
    <InputGroup>
      <InputGroup.Text style={{width:'60%'}} >{t('Menu.LegBgColor')}</InputGroup.Text>      
      <OverlayTrigger
        key={'Menu.tooltips.LegBgColor'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'Menu.tooltips.LegBgColor'}>{t('Menu.tooltips.LegBgColor')} </Tooltip>}>

        <Form.Label htmlFor="form_color_leg" style={{width:'40%',
          'background':data.legend_bg_color,
          border:'1px solid #ced4da',
          borderTopRightRadius:'4px',
          borderBottomRightRadius:'4px',
        }}/>
      </OverlayTrigger>
      <FormControl
        type="color"
        id='form_color_leg'
        name='form_color_leg'
        value={data.legend_bg_color}
        style={{display:'none'}}
        onChange={evt => {
          data.legend_bg_color = evt.target.value
          set_data({ ...data })
        }}
      />
    </InputGroup>,

    /* Opacité du fond de la légende */
    <InputGroup>
      <InputGroup.Text style={{width:'60%'}} >{t('Menu.LegBgOpacity')}</InputGroup.Text>      
      <OverlayTrigger
        key={'Menu.tooltips.LegBgOpacity'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'Menu.tooltips.LegBgOpacity'}>{t('Menu.tooltips.LegBgOpacity')} </Tooltip>}>
        <FormControl
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
      </OverlayTrigger>
    </InputGroup>,

    /* Affichage du bord de la légende */
    <InputGroup>
      <OverlayTrigger
        key={'Menu.tooltips.LegBgBorder'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'Menu.tooltips.LegBgBorder'}>{t('Menu.tooltips.LegBgBorder')} </Tooltip>}>
        <Checkbox 
          sx={SmoothClasses({})}
          iconColor='white'
          maxW={'60%'}
          isChecked={data.legend_bg_border}
          onChange={(evt) => {
            data.legend_bg_border = evt.target.checked
            set_data({ ...data })
          }}
        >
          {t('Menu.LegBgBorder')}
        </Checkbox>
      </OverlayTrigger>
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

    // Afficher l'échelle sur le graphe
    <Checkbox defaultChecked={data.mask_legend}
      sx={SmoothClasses({})}
      iconColor='white'
      maxW={'50%'}
      checked={data.display_legend_scale}
      onClick={() => {
        data.display_legend_scale = !data.display_legend_scale
        set_data({ ...data })
      }}
    >
      {t('Menu.display_scale')}
    </Checkbox>



  ]
}
