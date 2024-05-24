import React, { FunctionComponent, useState, useRef, ChangeEvent } from 'react'
import { Box, Card, CardBody, Divider, Heading, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react'
import * as d3 from 'd3'
import { TFunction } from 'i18next'
import { FaPlus } from 'react-icons/fa'
import { OSPApplicationDataType, OSPElementsSelectedType, OSPShowMenuComponentsType, OSPNodeFuntionType, OSPNode } from '../types/Types'
import SankeyListIcons from './icons/lib_of_icons.json'

export type ModalSelectionIconsType={
  t:TFunction,
  applicationData:OSPApplicationDataType,
  applicationState:OSPElementsSelectedType,
  dict_hook_ref_setter_show_dialog_components:OSPShowMenuComponentsType,
  node_function:OSPNodeFuntionType
}

type KeysOfIcon = keyof typeof SankeyListIcons

export const ModalSelectionIcon:FunctionComponent<ModalSelectionIconsType>=({
  t,
  applicationData,
  applicationState,
  dict_hook_ref_setter_show_dialog_components,
  node_function
}
)=>{
  const {data}=applicationData
  const {multi_selected_nodes }=applicationState
  const imported_icon=localStorage.getItem('icon_imported')
  const init_imported_svg:{[s:string]:{path:string,Vb:string}}=imported_icon != null && imported_icon!=='' ? JSON.parse(imported_icon) : {}
  const plus_multi_selected_nodes=(multi_selected_nodes as {[x:string]:OSPNode[]})
  const [filter_name,set_filter_name]=useState('')
  const _load_svg = useRef<HTMLInputElement>(null)
  const import_svg=useRef<{[s:string]:{path:string,Vb:string}}>(init_imported_svg)
  const [s_show_modal,sShowModal]=useState(false)
  const [forceUpdate,setForceUpdate]=useState(false)

  dict_hook_ref_setter_show_dialog_components.ref_setter_show_modal_import_icons.current=sShowModal


  const isAllIconVisible = () => {
    let selected_icon = ''
    if(plus_multi_selected_nodes.current.length>0){
      selected_icon=plus_multi_selected_nodes.current[0].iconName
    }

    plus_multi_selected_nodes.current.map(d => selected_icon = (d.iconName===selected_icon) ? selected_icon : '')
    return selected_icon
  }
  const allSelectedNodeHasSameicon=isAllIconVisible()

  plus_multi_selected_nodes.current.length>0?plus_multi_selected_nodes.current[0].iconName:'None'

  // Create object containing list of card elements regrouped by the icon themes
  const tuto_sub_nav:{[s:string]:JSX.Element}={}
  {Object.keys(SankeyListIcons).map((cki)=>{
    const ki=cki as KeysOfIcon

    tuto_sub_nav[ki]=<>{Object.entries(SankeyListIcons[ki]).filter(ic=>{
      return filter_name===''?true:t(ki+'.'+ic[0]).includes(filter_name)
    }).sort(([a,], [b,]) => (t(ki+'.'+a) > t(ki+'.'+b)) ? 1 : ((t(ki+'.'+b) > t(ki+'.'+a)) ? -1 : 0)).map(icon=>{
      // icon[0]:Name of the icon
      // icon[1]:Path of the icon
      return <Card 
        variant={allSelectedNodeHasSameicon===ki+'_'+icon[0]?'card_icon_selected':'card_icon_not_selected'}
        onClick={()=>{
          data.icon_catalog[ki+'_'+icon[0]]=icon[1]
          Object.values(data.nodes).filter(f => plus_multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
            d.iconName = ki+'_'+icon[0]
            if(!d.iconColor)d.iconColor='#000000'
            delete d.iconViewBox

          })
          node_function.reDrawIllustration(plus_multi_selected_nodes.current as OSPNode[])
          sShowModal(false)
        }}
      >
        <CardBody>

          <Heading>{t(ki+'.'+icon[0])}</Heading>
          <Divider/>
          <svg viewBox='0 0 1000 1000' width={50} height={50}><g><path fill='black' d={icon[1]}></path></g></svg>
        </CardBody>
      </Card>
    })}</>
  })}


  // File reader that can process multiple files
  // If the svg contains multiple path, we concat all of them into one big path
  // The icon name is the file name
  const file_import=<Input
    accept='.svg'
    type="file"
    multiple
    ref={_load_svg}
    style={{ display: 'none' }}
    onChange={(evt: ChangeEvent) => {
      const files = (evt.target as HTMLFormElement).files
      for(const i in files){
        const reader = new FileReader()
        reader.onload = (() => {
          return (e: ProgressEvent<FileReader>) => {
            const result = String((e.target as FileReader).result)
            const placeholder = document.createElement('div')
            placeholder.innerHTML = result
            const path=d3.select(placeholder).selectAll('path')
            const attr_d=path.nodes().map(path_to_concat=>
              d3.select(path_to_concat).attr('d')
            ).join(' ')
            import_svg.current[(files[i].name).replace('.svg','')]={
              path:attr_d,
              Vb:d3.select(placeholder).select('svg').attr('viewBox')
            }
            setForceUpdate(!forceUpdate)

          }
        })()
        if(Number(i)===files.length-1){
          reader.onloadend=(()=>{
            return () => {
              // import_svg.current=import_svg
              localStorage.setItem('icon_imported',JSON.stringify(import_svg.current))
            }
          })()
        }
        // Permet d'executer la transformation des blob en vues tout en evitant la var length
        //   files : {0:Blob,1:Blob,2:...,n:Blob, length:n-1}
        if(!isNaN(+i)){
          reader.readAsText(files[i])
        }
      }

    }}
  />

  // Card used as a button to open a filereader and import a svg
  const card_add_svg=<Card variant='card_import_icon'
    onClick={()=>{
      if (_load_svg.current) {
        _load_svg.current.name = ''
        _load_svg.current.click()
      }
    }}
  >
    <CardBody>

      <Heading>{t('Import')}</Heading>
      <Divider/>
      <FaPlus style={{ width:'5em', height:'5em'}} />
    </CardBody>
  </Card>

  // List of all imported svg icon
  // WARNING : Those icon disappear whe nwe reload the application (but the icon are still present in the catalog), so
  const card_imported=Object.keys(import_svg.current).sort(([a,], [b,]) => (a > b) ? 1 : ((b > a) ? -1 : 0)).map((ki)=>{
    return <Card 
      variant={allSelectedNodeHasSameicon==='icon_imported_'+ki?'card_icon_selected':'card_icon_not_selected'}
      onClick={()=>{
        data.icon_catalog['icon_imported_'+ki]=import_svg.current[ki].path
        Object.values(data.nodes).filter(f => plus_multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
          d.iconName = 'icon_imported_'+ki
          d.iconViewBox=import_svg.current[ki].Vb
          d.iconColor='#000000'
        })
        node_function.reDrawIllustration(plus_multi_selected_nodes.current as OSPNode[])
        sShowModal(false)
      }}
    >
      <CardBody>
        <Heading>{ki}</Heading>
        <Divider/>
        <svg viewBox={import_svg.current[ki].Vb}  width={50} height={50}><g><path fill='black' d={import_svg.current[ki].path}></path></g></svg>
      </CardBody>
    </Card>

  })

  tuto_sub_nav['import']=<>
    {card_imported}
    {card_add_svg}
  </>


  return <><Modal isOpen={s_show_modal} onClose={()=>sShowModal(false)} size='full'>
    <ModalContent style={{overflowY:'auto'}}>
      <ModalHeader>{t(('Menu.import_icon'))}</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        {/* {modale_sub_icon!=='import'?<InputGroup><InputGroup.Text>{t('Menu.filter_by_name')}</InputGroup.Text><Form.Control type='text' value={filter_name} onChange={(evt)=>set_filter_name(evt.target.value)}></Form.Control></InputGroup>:<></>} */}
        
        <Tabs variant='tabs_variant_lib_cion'>
          <TabList>
            {
              Object.keys(tuto_sub_nav).map(m=>{
                return <Tab> {t(m+'.'+m)}</Tab>
              })
            }
          </TabList>
          <TabPanels>
            {Object.keys(tuto_sub_nav).map(modale_sub_icon=>{
              
              return <TabPanel>
                {modale_sub_icon!=='import'?<Box
                  as='span'
                  layerStyle='menuconfigpanel_row_2cols'
                >
                  <Box
                    layerStyle='menuconfigpanel_option_name'
                  >
                    {t('Menu.filter_by_name')}
                  </Box>
                  <Input
                    placeholder='start typing to filter displayed icon'
                    variant='menuconfigpanel_option_input'
                    value={filter_name}
                    onChange={evt => set_filter_name(evt.target.value)}
                  />
                </Box>:<></>}
                <Box layerStyle='options_4cols' >
                  {tuto_sub_nav[modale_sub_icon]}
                </Box>
              </TabPanel>
            })}
          
          </TabPanels>
        </Tabs>

      </ModalBody>
    </ModalContent>
  </Modal>
  {file_import}
  </>
}

export default ModalSelectionIcon