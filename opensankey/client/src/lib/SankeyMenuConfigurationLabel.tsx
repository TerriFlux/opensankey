import React, {useState } from 'react'
import { Row, Form, FormControl, FormLabel, Col, FormCheck,Button, ButtonGroup } from 'react-bootstrap'
import {  SankeyLabel,SankeyData} from './types'
import { MultiSelect } from 'react-multi-select-component'
import { FaAngleDown, FaAngleUp, FaMinus, FaPlus } from 'react-icons/fa'
import { selected_type } from './SankeyMenu'
import { TFunction } from 'i18next'



export const OpenSankeyMenuConfigurationFreeLabels = (
  data:SankeyData,
  set_data:React.Dispatch<React.SetStateAction<SankeyData>>,
  multi_selected_label:{current:SankeyLabel[]},
  t: TFunction

) => {

  const [forceUpdate, setForceUpdate] = useState(false)

  const tmplabel = Object.fromEntries(Object.entries(data.labels).sort(([, a], [, b]) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)))
  const INITIAL_OPTIONS_label = Object.values(tmplabel).map((d) => { return { 'label': d.name, 'value': d.idLabel } })
  const selected_label = multi_selected_label.current.map((d) => { return { 'label': d.name, 'value': d.idLabel } })
  
  //Dépalce la place des labels libres sélectionnés vers le debut dans le tableau de liens de data
  //Permet donc de les déssiner après 
  const handleUplabel = (i: string) => {
    const { labels } = data
    const listElmt = Object.keys(labels)
    const posElemt = listElmt.indexOf(i)
    listElmt.splice(posElemt, 1)
    listElmt.splice(posElemt - 1, 0, i)
    const new_cat: { [key: string]: SankeyLabel } = {}
    listElmt.forEach(elt => {
      new_cat[elt] = labels[elt]
    })
    for (const member in labels) delete labels[member]
    Object.assign(labels, new_cat)
    set_data({ ...data })
  }


  //Dépalce la place des labels libres sélectionnés vers la fin dans le tableau de liens de data
  //Permet donc de les déssiner après 
  const handleDownlabel = (i: string) => {
    const { labels } = data
    const listElmt = Object.keys(labels)
    const posElemt = listElmt.indexOf(i)
    listElmt.splice(posElemt, 1)
    listElmt.splice(posElemt + 1, 0, i)
    const new_cat: { [key: string]: SankeyLabel } = {}
    listElmt.forEach(elt => {
      new_cat[elt] = labels[elt]
    })
    for (const member in labels) delete labels[member]
    Object.assign(labels, new_cat)
    set_data({ ...data })
  }

  //Renvoie le menue déroulant pour la sélection des labels libres
  const dropdownMultiLabel = () => {
    const DD = (
      <div id='DD_multi_label'>


        <MultiSelect
          valueRenderer={(selected: selected_type[]) => {
            return selected.length ? selected.map(({ label }) => label + ', ') : 'Aucun label sélectionné'
          }}
          options={INITIAL_OPTIONS_label}
          value={selected_label}
          overrideStrings={{
            'selectAll': 'Tout sélectionner',
          }}
          onChange={(selected: [{ label: string, value: string }]) => {
            const new_sel = selected.map(d => d.value)
            const m_s = Object.values(data.labels).filter(d => (new_sel.includes(d.idLabel)))
            multi_selected_label.current = m_s
            setForceUpdate(!forceUpdate) 
          }}
          labelledBy={'hello'}
        />
      </div>)
    return DD
  }

  //=================FONCTION POUR TEST VALEUR MULTI SELECT LABEL===========================
  const allLabelHeight = () => {
    let display_size = true
    let size = 25
    if (multi_selected_label.current.length != 0) {
      size = multi_selected_label.current[0].label_height
    }
    multi_selected_label.current.map((d) => {
      display_size = (d.label_height == size) ? display_size : false
    })
    return (display_size) ? size : -1
  }

  const allLabelWidth = () => {
    let display_size = true
    let size = 25
    if (multi_selected_label.current.length != 0) {
      size = multi_selected_label.current[0].label_width
    }
    multi_selected_label.current.map((d) => {
      display_size = (d.label_width == size) ? display_size : false
    })
    return (display_size) ? size : -1
  }
  const allLabelAsHTML = () => {
    let isHTML = false

    multi_selected_label.current.map((d) => {
      isHTML = (d.isTextHTML) ? true : isHTML
    })
    return isHTML
  }
  const allLabelTransparent = () => {
    let transparent = false

    multi_selected_label.current.map((d) => {
      transparent = (d.transparent) ? true : transparent
    })
    return transparent
  }
  const allLabelBorderTransparent = () => {
    let transparent = false

    multi_selected_label.current.map((d) => {
      transparent = (d.transparent_border) ? true : transparent
    })
    return transparent
  }

  const allNodeLabelVert = (arg: string, pos: string) => {
    let all_same = true
    if (multi_selected_label.current.length > 0) {
      if (arg == 'vert') {
        multi_selected_label.current.map(d => all_same = (d.position_vert !== pos) ? false : all_same)
      } else if (arg == 'horiz') {
        multi_selected_label.current.map(d => all_same = (d.position_horiz !== pos) ? false : all_same)
      }
    } else {
      all_same = false
    }
    return all_same
  }


  const allLabelFontSize = () => {
    let display_size = true
    let size = 1
    if (multi_selected_label.current.length != 0) {
      size = multi_selected_label.current[0].font_size
    }
    multi_selected_label.current.map((d) => {
      display_size = (d.font_size == size) ? display_size : false
    })
    return (display_size) ? size : -1
  }

  const allLabelTextBold = () => {
    let bold = false

    multi_selected_label.current.map((d) => {
      bold = (d.font_weight) ? true : bold
    })
    return bold
  }

  const allLabelTextItalic = () => {
    let italic = false

    multi_selected_label.current.map((d) => {
      italic = (d.font_style) ? true : italic
    })
    return italic
  }

  const allLabelTextUpper = () => {
    let up = false

    multi_selected_label.current.map((d) => {
      up = (d.font_uppercase) ? true : up
    })
    return up
  }

  const label_libre_align_vert=()=>{
    multi_selected_label.current.map(d=>{
      switch(d.position_vert){
      case 'middle':
        d.y_label=d.label_height/2
        break
      case 'bottom':
        d.y_label=d.label_height-3
        break
      default:
        d.y_label=d.label_height-3
        break
      }
    })
  }
  const label_libre_align_horiz=()=>{
    multi_selected_label.current.map(d=>{
      switch(d.position_horiz){
      case 'middle':
        d.x_label=d.label_width/2
        break
      case 'right':
        d.x_label=d.label_width-3
        break
      default:
        d.x_label=d.label_width-3
        break
      }
    })
  }
    
   
  return [<Form.Group as={Row}>
    <Col xs={1}>
      <Button size="sm" onClick={() => {
        const new_label = {
          idLabel: 'label_' + String(new Date().getTime()),
          name: 'Text Label ...',
          label_width: 100,
          label_height: 25,
          color: 'white',
          color_border: 'black',
          transparent: false,
          transparent_border: false,
          position_vert: 'middle',
          position_horiz: 'left',
          font_size: 12,
          font_weight: false,
          font_style: false,
          font_uppercase: false,
          isTextHTML:false,
          x: 50,
          y: 50,
          x_label: 50,
          y_label: 12,
        }
        data.labels[new_label.idLabel] = new_label
        multi_selected_label.current = [new_label]
        set_data({ ...data })
      }
      }><FaPlus /></Button>
    </Col>
    <Col xs={7}>{dropdownMultiLabel()}</Col>
    <Col xs={1}>
      <Button size="sm" variant='danger' onClick={() => {
        data.labels = Object.fromEntries(Object.entries(data.labels).filter(d => !multi_selected_label.current.map(l => l.idLabel).includes(d[0])))
        multi_selected_label.current = []
        set_data({ ...data })
      }
      }><FaMinus /></Button>
    </Col>
    <Col xs={2}>
      {//Boutton pour monter le label sélctionné
      }
      <ButtonGroup>
        <Button variant='info' disabled={multi_selected_label.current.length != 1}
          onClick={() => {
            multi_selected_label.current.map(l => {
              handleDownlabel(l.idLabel)
            })


          }}><FaAngleUp /></Button>

        <Button variant='warning' disabled={multi_selected_label.current.length != 1}
          onClick={() => {
            multi_selected_label.current.map(l => {
              handleUplabel(l.idLabel)
            })


          }}><FaAngleDown /></Button>
      </ButtonGroup>
    </Col>
  </Form.Group>,
  <Form.Group as={Row}>
    <Row>
      <FormLabel column sm={1}>Text:</FormLabel>
      <Col sm={11}>
        <Form.Control
          as="textarea"
          rows={5}
          disabled={multi_selected_label.current.length != 1}
          value={multi_selected_label.current.length > 0 ? multi_selected_label.current[0].name : ''}
          onChange={
            (evt) => {
              multi_selected_label.current.map(label => label.name = evt.target.value)
              set_data({ ...data })
            }
          }
        />
      </Col>
    </Row>
  </Form.Group>,
  <Form.Group as={Row}>
    <Col xs={4}>
      <FormLabel >{t('LL.textAsHTML')}</FormLabel>
    </Col>
    <Col xs={8}>
      <Form.Check
        inline
        type='switch'
        checked={allLabelAsHTML()}
        onChange={evt => {
          multi_selected_label.current.map(d => d.isTextHTML = evt.target.checked)
          set_data({ ...data })
        }}
      />
    </Col>
  </Form.Group>,
  <Form.Group as={Row}>
    <Col xs={4}>
      <FormLabel >{t('LL.hl')}</FormLabel>
    </Col>
    <Col xs={8}>
      <FormControl size='sm'
        min={0}
        max={1000}
        type={'number'}
        value={allLabelHeight()}
        onChange={evt => {
          multi_selected_label.current.map(d => d.label_height = +evt.target.value)
          label_libre_align_vert()
          set_data({ ...data })
        }}
      />
    </Col>
  </Form.Group>,
  <Form.Group as={Row}>
    <Col xs={4}>
      <FormLabel >{t('LL.ll')}</FormLabel>
    </Col>
    <Col xs={8}>
      <FormControl size='sm'
        min={0}
        max={1000}
        type={'number'}
        value={allLabelWidth()}
        onChange={evt => {
          multi_selected_label.current.map(d => d.label_width = +evt.target.value)
          label_libre_align_horiz()
          set_data({ ...data })
        }}
      />
    </Col>
  </Form.Group>,
  <Form.Group as={Row}>
    <Col xs={4}>
      <FormLabel >{t('LL.ft')}</FormLabel>
    </Col>
    <Col xs={8}>
      <Form.Check
        inline
        type='switch'
        checked={allLabelTransparent()}
        onChange={evt => {
          multi_selected_label.current.map(d => d.transparent = evt.target.checked)
          set_data({ ...data })
        }}
      />
    </Col>
  </Form.Group>,
  <Form.Group as={Row}>
    <Col xs={4}>
      <FormLabel >{t('LL.cfl')}</FormLabel>
    </Col>
    <Col xs={8}>
      <FormControl size='sm'
        type='color'
        value={(multi_selected_label.current.length == 1) ? multi_selected_label.current[0].color : '#ffffff'}
        onChange={evt => {
          const val = evt.target.value
          multi_selected_label.current.map(d => d.color = val)
          set_data({ ...data })
        }}
      />
    </Col>
  </Form.Group>,
  <Form.Group as={Row}>
    <Col xs={4}>
      <FormLabel >{t('LL.bt')}</FormLabel>
    </Col>
    <Col xs={8}>
      <Form.Check
        inline
        type='switch'
        checked={allLabelBorderTransparent()}
        onChange={evt => {
          multi_selected_label.current.map(d => d.transparent_border = evt.target.checked)
          set_data({ ...data })
        }}
      />
    </Col>
  </Form.Group>,
  <Form.Group as={Row}>
    <Col xs={4}>
      <FormLabel >{t('LL.cbl')}</FormLabel>
    </Col>
    <Col xs={8}>
      <FormControl size='sm'
        type='color'
        value={(multi_selected_label.current.length == 1) ? multi_selected_label.current[0].color_border : '#ffffff'}
        onChange={evt => {
          const val = evt.target.value
          multi_selected_label.current.map(d => d.color_border = val)
          set_data({ ...data })
        }}
      />
    </Col>
  </Form.Group>,
  <Form.Group as={Row}>
    <Col xs={4}>
      <FormLabel style={{color:(!allLabelAsHTML())?'#555555':'#DADADA'}}  >{t('LL.pvt')}</FormLabel>
    </Col>
    <Col>
      <FormCheck
        disabled={allLabelAsHTML()}
        type='radio'
        label={t('Noeud.labels.haut')}
        checked={allNodeLabelVert('vert', 'top')}
        onChange={
          () => {
            multi_selected_label.current.map(d => {
              d.position_vert = 'top'
              // d.x_label = d.label_width / 2
              d.y_label = d.font_size + 3
            })

            set_data({ ...data })
          }
        }
      />
    </Col>
    <Col>
      <FormCheck
        disabled={allLabelAsHTML()}
        type='radio'
        label={t('Noeud.labels.Milieu')}
        checked={allNodeLabelVert('vert', 'middle')}
        onChange={
          () => {
            multi_selected_label.current.map(d => {
              d.position_vert = 'middle'
              // d.x_label = d.label_width / 2
              d.y_label = d.label_height / 2
            })
            set_data({ ...data })
          }
        }
      />
    </Col>
    <Col>
      <FormCheck
        disabled={allLabelAsHTML()}
        type='radio'
        label={t('Noeud.labels.Bas')}

        checked={allNodeLabelVert('vert', 'bottom')}
        onChange={
          () => {
            multi_selected_label.current.map(d => {
              d.position_vert = 'bottom'
              // d.x_label = d.label_width / 2
              d.y_label = d.label_height - 3
            })
            set_data({ ...data })
          }
        }
      />
    </Col>
  </Form.Group>,<Form.Group as={Row}>
    <Col xs={4}>
      <FormLabel style={{color:(!allLabelAsHTML())?'#555555':'#DADADA'}}  >{t('LL.at')}</FormLabel>
    </Col>
    <Col>
      <FormCheck
        disabled={allLabelAsHTML()}
        type='radio'
        label={t('Noeud.labels.gauche')}
        checked={allNodeLabelVert('horiz', 'left')}
        onChange={
          () => {
            multi_selected_label.current.map(d => {
              d.position_horiz = 'left'
            })

            set_data({ ...data })
          }
        }
      />
    </Col>
    <Col>
      <FormCheck
        disabled={allLabelAsHTML()}
        type='radio'
        label={t('LL.centre')}
        checked={allNodeLabelVert('horiz', 'centre')}
        onChange={
          () => {
            multi_selected_label.current.map(d => {
              d.position_horiz = 'centre'
            })
            set_data({ ...data })
          }
        }
      />
    </Col>
    <Col>
      <FormCheck
        disabled={allLabelAsHTML()}
        type='radio'
        label={t('Noeud.labels.droite')}

        checked={allNodeLabelVert('horiz', 'right')}
        onChange={
          () => {
            multi_selected_label.current.map(d => {
              d.position_horiz = 'right'
            })
            set_data({ ...data })
          }
        }
      />
    </Col>
  </Form.Group>,
  <Form.Group as={Row}>
    <Col xs={4}>
      <FormLabel style={{color:(!allLabelAsHTML())?'#555555':'#DADADA'}} >{t('Noeud.labels.tp')}</FormLabel>
    </Col>
    <Col xs={8}>
      <FormControl size='sm'
        disabled={allLabelAsHTML()}
        min={0}
        max={100}
        type={'number'}
        value={allLabelFontSize()}
        onChange={evt => {
          let val = +evt.target.value
          val = (val <= 0) ? 1 : val
          multi_selected_label.current.map(d => d.font_size = val)
          set_data({ ...data })
        }}
      />
    </Col>
  </Form.Group>,
  <Form.Group as={Row} >
    <Col>
      <FormLabel style={{color:(!allLabelAsHTML())?'#555555':'#DADADA'}}  >{t('LL.labels')}</FormLabel>
    </Col>
    <Col>
      <FormCheck
        disabled={allLabelAsHTML()}
        type='checkbox'
        label={t('LL.gras')}
        checked={allLabelTextBold()}
        onChange={
          evt => {
            multi_selected_label.current.map(d => d.font_weight = evt.target.checked)
            set_data({ ...data })
          }
        }
      />
    </Col>
    <Col>
      <FormCheck
        disabled={allLabelAsHTML()}
        type='checkbox'
        label={t('LL.maj')}
        checked={allLabelTextUpper()}
        onChange={
          evt => {
            multi_selected_label.current.map(d => d.font_uppercase = evt.target.checked)
            set_data({ ...data })
          }
        }
      />
    </Col>
    <Col>
      <FormCheck
        disabled={allLabelAsHTML()}
        type='checkbox'
        label={t('LL.ita')}
        checked={allLabelTextItalic()}
        onChange={
          evt => {
            multi_selected_label.current.map(d => d.font_style = evt.target.checked)
            set_data({ ...data })
          }
        }
      />
    </Col>
  </Form.Group>]
      
}
  