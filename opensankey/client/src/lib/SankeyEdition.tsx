import React, { FunctionComponent } from 'react'
import { Button,Row,Col,ButtonGroup } from 'react-bootstrap'
import { SankeyNode,SankeyLink,SankeyDataPropTypes } from './types'
import PropTypes,{InferProps} from 'prop-types'

const SankeyEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  set_selected_node: PropTypes.func.isRequired,
  set_selected_link: PropTypes.func.isRequired,
  set_show_link: PropTypes.func.isRequired,
  set_show_graphic_attributes: PropTypes.func.isRequired,
  default_link: PropTypes.func.isRequired,
  default_node: PropTypes.func.isRequired
}

type SankeyEditionTypes = InferProps<typeof SankeyEditionPropTypes>
const SankeyEdition : FunctionComponent<SankeyEditionTypes> = ({data,set_data,set_selected_node,set_selected_link,set_show_link,set_show_graphic_attributes,default_link,default_node}) => {
  const add_new_node = () => {
    const { nodes } = data

    const node : SankeyNode = default_node()
    node.id = nodes.length
    node.name = 'n'+nodes.length
    node.x = nodes.length*50
    nodes.push(node )
    set_selected_node(nodes.length-1)
    set_data({...data})
  }

  const add_new_link = () => {
    //const {data} = parent.state
    const {nodes,links} =data

    if (nodes.length < 2) {
      return
    }
    const region_names = Object.keys(data.links)
    const link : SankeyLink = default_link()
    const link_pos = links[region_names[0]].length

    region_names.forEach(
      region_name => {
        links[region_name].push(link)
        link.source_name = nodes[0].name    
        link.target_name = nodes[1].name
      }
    )

    nodes[0].output_links.push(link_pos)
    nodes[1].input_links.push(link_pos)

    set_selected_link(links[region_names[0]].length-1)
    set_data({...data})
    set_show_link(true)
  }

  return (
    <div className='herowrap' style={{ 'backgroundColor' : 'gainsboro','marginLeft' : '0' }}>
      <Row style={{ 'marginTop' : '10px','marginBottom' : '10px'}}>
        <Col sm={4}  >
          <ButtonGroup vertical style={{ 'marginLeft' : '10px' }}>
            <Button size="sm" style={{ 'marginBottom' : '3px'}} onClick={add_new_node}>
              Ajouter Noeud
            </Button>
            <Button size="sm" style={{ 'marginBottom' : '3px'}} onClick={add_new_link}>
              Ajouter Flux
            </Button>
            <Button size="sm" onClick={()=>set_show_graphic_attributes(true)}>
              Réglages
            </Button>
          </ButtonGroup>
        </Col>
      </Row>
    </div>
  )
}

SankeyEdition.propTypes = SankeyEditionPropTypes

export default SankeyEdition