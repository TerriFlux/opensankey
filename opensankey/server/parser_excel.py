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
