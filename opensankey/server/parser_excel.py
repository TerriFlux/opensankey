import pandas as pd
import numpy as np
import re
import webcolors
import math

def is_hex(s):
    return re.fullmatch(r"^\#?[0-9a-fA-F]+$", s or "") is not None

def parse_sankey_energie_csv(
    csv_file
):
    csv_data = pd.read_csv(
        csv_file,
        delimiter=';', encoding='utf-8'
    )
    sankey_dict = {}
    nodes_names = np.unique(np.hstack((csv_data['source'], csv_data['target']))).tolist()
    regions_names = csv_data['nom_territoire'].unique()
    sankey_dict = {
        'nodes'   : {},
        'links'   : {},
        'h_space' : 300,
        'display_style' : {
            'filter' : 1,
            'filter_label' : 20
        },

    }
    sankey_dict['tags_catalog'] = {
        'Regions' : {
            'group_name' : 'Regions',
            'tags'       : {},
            'banner'     : 'one'            
        },
        'Exchanges' : {
            'group_name'    : 'Echanges',
            'tags'          : {
                'Other' : {
                    'name'     : 'Intérieur',
                    'selected' : True,
                    'color'    : '',
                },
                'Echangesimport' : {
                    'name'     : 'Importations',
                    'selected' : True,
                    'color'    : ''
                },
                'Echangesexport' : {
                    'name'     : 'Exportations',
                    'selected' : True,
                    'color'    : ''
                }
            },
            'banner'     : 'multi'           
        }
    }
    for region_name in regions_names.tolist():
        sankey_dict['tags_catalog']['Regions']['tags'][region_name] = {
            'name'     : region_name,
            'selected' : region_name == regions_names[0],
            'color'    : ''            
        }

    for node_id, node_name in enumerate(nodes_names):
        if node_name == 'Importations' or node_name == 'Exportations':
            continue
        idNode = 'node' + str(node_id)
        sankey_dict['nodes'][idNode] = {
            'idNode'     : idNode,
            'color'      : webcolors.name_to_hex('grey'),
            'name'       : node_name,
            'type'       : 'sector',
            'orientation': 'vertical',
            'show_value' : 1,
            'tags'       : {
                'Exchanges' : ['Other']
            }
        }

    territory_data = csv_data[csv_data['nom_territoire'] == regions_names[0]]
    for k, row in territory_data.iterrows():
        source_name = row['source']
        target_name = row['target']
        if source_name == 'Importations':
            node_id = node_id + 1
            import_node_name = target_name + ' - Echanges - Importations'
            idNode = 'node' + str(node_id)
            sankey_dict['nodes'][idNode] = {
                'idNode': idNode,
                'color': webcolors.name_to_hex('grey'),
                'name': import_node_name,
                'type': 'sector',
                'orientation': 'vertical',
                'show_value' : 1,
                'tags': { 
                    'Exchanges' : ['Echangesimport']
                }
            }
            source_name = import_node_name

        if target_name == 'Exportations':
            node_id = node_id + 1
            export_node_name = source_name + ' - Echanges - Exportations'
            idNode = 'node' + str(node_id)
            sankey_dict['nodes'][idNode] = {
                'idNode': idNode,
                'color': webcolors.name_to_hex('grey'),
                'name': export_node_name,
                'type': 'sector',
                'orientation': 'vertical',
                'show_value' : 1,
                'tags': { 'Exchanges' : 
                    ['Echangesexport']
                }
            }
            target_name = export_node_name

        color = row['colors']
        if not is_hex(color):
          color = webcolors.name_to_hex(color)
        idLink = 'link' + str(k)
        for key,val in sankey_dict['nodes'].items():
            if val['name'] == source_name:
                idSource = key
                break
        for key,val in sankey_dict['nodes'].items():
            if val['name'] == target_name:
                idTarget = key
                break
        sankey_dict['links'][idLink] = {
            'idLink'     : idLink,
            'idSource'   : idSource,
            'idTarget'   : idTarget,
            'value': [],
            'label_visible': 0,
            'display_value': [],
            'color': color,
            'curvature' : 1,
            'label_position' : 'beginning',
            'left_horiz_shift' : 0.40,
            'right_horiz_shift': 0.50,
            'natural_unit'     : 'GWh',
            'conv'             : [1,1]
        }

    for region_name in regions_names:
      territory_data = csv_data[csv_data['nom_territoire'] == region_name]
      id = 0
      for k, row in territory_data.iterrows():
        if row['value'] < 1000:
            sankey_dict['links']['link' + str(id)]['value'].append(round(row['value'], 1))         
            sankey_dict['links']['link' + str(id)]['display_value'].append('default')
        else:
            sankey_dict['links']['link' + str(id)]['value'].append(500)         
            sankey_dict['links']['link' + str(id)]['display_value'].append(str(round(row['value']))+'*')            
        id = id + 1
    sankey_dict['units_names'] = ['GWh','GWh']
    sankey_dict['display_style'] = {
        'unit' : 1
    }
    return sankey_dict

def parse_simple_excel(
    filepath
):
    excel_file = pd.ExcelFile(filepath)
    nodes_cols = [
        'Level', 'Nodes', 'Color', 'Shape', 'Group'
    ]
    ws = pd.read_excel(excel_file, excel_file.sheet_names[0])

    nodes = []
    current_parent_level = 1
    previous_level = 1
    for i in range(ws.shape[0]):
        name = ws.iat[i, nodes_cols.index('Nodes')].strip()
        new_node = {
            'idNode'        : 'node'+str(i),
            'name'          : name,
            'type'          : 'sector',
            'dimensions'    : {'Primaire':{'parent_name': None}},
            'label_visible' : 1,
            'shape_visible' : 1
        }
        color = '#a9a9a9'
        shape = 'rectangle'
        try:
            color = ws.iat[i, nodes_cols.index('Color')]
            shape = ws.iat[i, nodes_cols.index('Shape')]
            if not is_hex(color):
              color = webcolors.name_to_hex(color)   
            new_node['color'] = color
            if shape == 'rectangle' :
                new_node['type'] = 'sector' 
            else:
                new_node['type'] = 'product'
        except Exception:
            pass
        level = ws.iat[i, nodes_cols.index('Level')]
        new_node['dimensions']['Primaire']['level'] = int(level)
        if level > previous_level:
            current_node_parent = nodes[i-1]
            current_parent_level = previous_level
        if level > current_parent_level:
            new_node['dimensions']['Primaire']['parent_name'] = current_node_parent['idNode']
        previous_level = level
        if level == 1:
          new_node['display'] = 1
          new_node['node_visible'] = 1
        else:
          new_node['display'] = 0
          new_node['node_visible'] = 0
        nodes.append(new_node)

    flux_ws = pd.read_excel(excel_file, excel_file.sheet_names[1])
    flux_cols = [
        'Origin', 'Destination', 'Value'
    ]
    links = []
    for row in range(flux_ws.shape[0]):
        source_name = flux_ws.iat[row, flux_cols.index('Origin')]
        target_name = flux_ws.iat[row, flux_cols.index('Destination')]
        source_node = [n for n in nodes if n['name'] == source_name][0]
        target_node = [n for n in nodes if n['name'] == target_name][0] 
        if source_node['type'] == 'product':
            color = source_node['color']
        elif target_node['type'] == 'product':
            color = target_node['color']
        if not is_hex(color):
          color = webcolors.name_to_hex(color)      
        links.append({
            'source_name' :  flux_ws.iat[row, flux_cols.index('Origin')],
            'target_name' :  flux_ws.iat[row, flux_cols.index('Destination')],
            'value'       : [flux_ws.iat[row, flux_cols.index('Value')]],
            'color'       : color
        })
    return nodes, links

def updateLayout(
  data,
  new_layout
):
  max_vertical_offset = 0
  for node in data['nodes']:
      if node['node_visible'] == 1:
          max_vertical_offset = max(node['y'], max_vertical_offset)
  max_vertical_offset = max_vertical_offset + 200
  data['node_width'] = new_layout['node_width']

  # Apply nodes layout
  for node_layout_key in new_layout['nodes']:
    node_layout = new_layout['nodes'][node_layout_key]
    nodes = [node for node in data['nodes'] if node['name'] == node_layout['name'] ]
    if len(nodes) == 0:
      if len(node_layout['inputLinksId']) == 0 and len(node_layout['outputLinksId']) == 0 and node_layout['shape_visible'] == False and node_layout['label_visible'] == True:
        # Case of not a label
        node = node_layout
        node['idNode'] = 'node' + data['node_idx']
        data['node_idx'] = data['node_idx'] + 1
        data['nodes'][node['idNode']]
      else:
        continue

    node = nodes[0]
    if not node:
      continue
    if not node['node_visible']:
      continue
    node['name'] = node_layout['name']
    node['x'] = node_layout['x']
    node['y'] = node_layout['y']
    if node['y'] + 200 > max_vertical_offset:
      max_vertical_offset = node['y'] + 200

    #node.color = node_layout.color
    node['x_label'] = node_layout['x_label']
    node['y_label'] = node_layout['y_label']
    node['label_visible'] = node_layout['label_visible']

  # apply_input_outputLinksId(
  #   new_layout['nodes,
  #   new_layout['links,
  #   data
  # )

  for link_layout_key in new_layout['links']:
    link_layout = new_layout['links'][link_layout_key]
    links = [
        link for link in data['links']
        if data['nodes'][link['idSource']['name']] == new_layout['nodes'][link_layout['idSource']['name']] and
           data['nodes'][link['idTarget']['name']] == new_layout['nodes'][link_layout['idTarget']['name']]
    ]

    if len(links) == 0:
      continue

    link = links[0]
    # if ( link_layout.display_value !== 'default' && 
    #     !String(link_layout.display_value).includes('[') ) {
    #   link.value = link_layout.value
    # }
    # const node_source = Object.values(data.nodes).filter( n => n.name ===new_layout['nodes[link_layout.idSource].name)
    # const node_target = Object.values(data.nodes).filter( n => n.name ===new_layout['nodes[link_layout.idTarget].name)
    # if (node_source && node_target) {
    #   link.idSource = node_source.idNode
    #   link.idSource = node_target.idNode
    # }
    #x_label, y_label, label_position, label_visible, recycling, curved, curvature, arrow,orthogonal_label_position = link_layout
    link['curvature'] = link_layout['curvature']
    link['curved'] = link_layout['curved']
    link['arrow'] = link_layout['arrow']
    link['text_color'] = link_layout['link_layout.text_color']
    link['label_position'] = link_layout['label_position']
    link['label_visible'] = link_layout['label_visible']
    link['x_label'] = link_layout['x_label']
    link['y_label'] = link_layout['y_label']
    link['left_horiz_shift'] = link_layout['link_layout.left_horiz_shift']
    link['right_horiz_shift'] = link_layout['link_layout.right_horiz_shift']
    link['orientation'] = link_layout['link_layout.orientation']
    link['recycling'] = link_layout['recycling']
    link['orthogonal_label_position'] = link_layout['orthogonal_label_position']

    # if (String(link['display_value[0]).includes('*')) {
    #   link['value[0]'] = link_layout['link_layout.value[0]']
    # }

    if link_layout['vert_shift']:
      link['left_horiz_shift'] = link_layout['link_layout.left_horiz_shift']
      link['right_horiz_shift'] = link_layout['link_layout.right_horiz_shift']
      link['vert_shift'] = link_layout['link_layout.vert_shift']

  #data.animation_tooltips = new_layout['animation_tooltips
  data['user_scale'] = new_layout['user_scale']
  data['legend_position'] = new_layout['legend_position']
  data['welcome_text'] = new_layout['welcome_text']
  # if ('height' in new_layout) {
  #   data.height = new_layout['height
  # }
  if 'width' in new_layout:
    data['width'] = new_layout['width']

#   Object.keys(new_layout['display_style).forEach(
#     key => (data['display_style as any)[key] = (new_layout['display_style as any)[key]
#   )
  if 'filter' not in data['display_style']:
    data['display_style']['filter'] = 0
  if 'filter_label' not in data['display_style']:
    data['display_style']['filter_label'] = 0