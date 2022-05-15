import pandas as pd
import numpy as np
import re
import webcolors
import math
import mfa_problem.io_excel as io_excel

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
    sankey_dict['nodeTags'] = {
        'Exchanges' : {
            'group_name'    : 'Echanges',
            'tags'          : {
                'interior' : {
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
    sankey_dict['dataTags'] = {
        'Regions' : {
            'group_name' : 'Regions',
            'tags'       : {},
            'banner'     : 'one'            
        }
    }
    for region_name in regions_names.tolist():
        sankey_dict['dataTags']['Regions']['tags'][region_name] = {
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
                'Exchanges' : ['interior']
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
                'trade_close': 1,
                'position'   : 'relative',
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
                'trade_close': 1,
                'position'   : 'relative',
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
            'value': {},
            'label_visible': 0,
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
            sankey_dict['links']['link' + str(id)]['value'][region_name] = {
                'value'         : round(row['value'], 1),        
                'display_value' : 'default'
            }
        else:
            sankey_dict['links']['link' + str(id)]['value'][region_name] = {
                'value'         : 500,
                'display_value' : str(round(row['value']))+'*'  
            }          
        id = id + 1
    sankey_dict['units_names'] = ['GWh','GWh']
    sankey_dict['display_style'] = {
        'unit' : 1
    }
    return sankey_dict

def set_value(
    link_data_tags:list,
    link_flux_tags:list,
    fluxTags:dict,
    depth: int,
    v: dict,
    value: float,
    display_value: str
):
    v_tags = {}
    for i,key in enumerate(fluxTags.keys()):
        v_tags[key]=link_flux_tags[i]
    if depth == len(link_data_tags):
        v['value'] = value
        v['display_value'] = display_value
        v['tags'] = v_tags
        v['extension'] = {}        
    else:
        data_tag = link_data_tags[depth]
        if data_tag not in v:
            v[data_tag] = {}
        set_value(link_data_tags,link_flux_tags,fluxTags,depth+1,v[data_tag],value,display_value)



def parse_excel(mfa_input):
    nodes_cols = mfa_input['nodes'][0]

    previous_level = 1
    nb_cols = len(nodes_cols)
    has_definition_col = False
    # if nb_cols > len(base_cols):
    #     for i in range(len(base_cols),len(nodes_cols)):
    #         if nodes_cols[i] == 'Définition':
    #             has_definition_col = True
    #             break
    #         node_tag_names.append(nodes_cols[i])

    dataTags = {}
    nodeTags = {}
    fluxTags = {}
    parse_tags(mfa_input, dataTags, nodeTags, fluxTags)
    nodes = {}
    parse_nodes(mfa_input, nodes_cols, nodes, previous_level, nb_cols, has_definition_col, nodeTags)
    links = {}
    parse_links(mfa_input, nodes, dataTags, fluxTags, links)
    return {
        'version'      : '0.8',
        'dataTags'     : dataTags,
        'nodeTags'     : nodeTags,
        'fluxTags'     : fluxTags,
        'nodes'        : nodes,
        'links'        : links
    }

def parse_links(mfa_input, nodes, dataTags, fluxTags, links):
    nb_data_tags = len(dataTags.keys())
    nb_flux_tags = len(dataTags.keys())
    sheet_name = 'data'
    if 'results' in mfa_input and len(mfa_input['results']) > 1:
        sheet_name = 'results'        
    for row in range(1,len(mfa_input[sheet_name])):
        source_name = mfa_input[sheet_name][row][mfa_input[sheet_name][0].index('origin')]
        target_name =  mfa_input[sheet_name][row][mfa_input[sheet_name][0].index('destination')]
        source_nodes = [nodes[key] for key in nodes.keys() if nodes[key]['name'] == source_name]
        target_nodes = [nodes[key] for key in nodes.keys() if nodes[key]['name'] == target_name]
        if len(source_nodes) == 0 or len(target_nodes) == 0:
            continue
        source_node = source_nodes[0]
        target_node = target_nodes[0]
        if source_node['type'] == 'product':
            color = source_node['color']
        elif target_node['type'] == 'product':
            color = target_node['color']
        if not is_hex(color):
          color = webcolors.name_to_hex(color)
        link_data_tags= []
        for i in range(nb_data_tags):
            if len(mfa_input[sheet_name][row]) > 3+i:
                link_data_tags.append(mfa_input[sheet_name][row][3+i])
        link_flux_tags= []
        for i in range(nb_flux_tags):
            if len(mfa_input[sheet_name][row]) > 3+i+nb_data_tags:
                link_flux_tags.append(mfa_input[sheet_name][row][3+i+nb_data_tags])

        existing_links = [links[key] for key in links.keys() if nodes[links[key]['idSource']]['name'] == source_name and nodes[links[key]['idTarget']]['name'] == target_name]
        if len(existing_links) > 0:
            new_link = existing_links[0]
            set_value(link_data_tags,link_flux_tags,fluxTags,0,new_link['value'], mfa_input[sheet_name][row][mfa_input[sheet_name][0].index('value')],'default')
        else:
            value = {}
            set_value(link_data_tags,link_flux_tags,fluxTags,0,value, mfa_input[sheet_name][row][mfa_input[sheet_name][0].index('value')],'default')
            new_link = {
                'idLink'   : 'link'+str(row-1),  
                'idSource' : source_node['idNode'],
                'idTarget' : target_node['idNode'],
                'value'    : value,
                'color'    : color
            }
            links[new_link['idLink']] = new_link

def parse_nodes(mfa_input, nodes_cols, nodes, previous_level, nb_cols, has_definition_col, nodeTags):
    current_parent_level = 1
    for i in range(1,len(mfa_input['nodes'])):
        name  = mfa_input['nodes'][i][nodes_cols.index('Element')]
        shape = mfa_input['nodes'][i][nodes_cols.index('Forme')]
        if shape == 'rectangle' :
            shape = 'sector' 
        else:
            shape = 'product'
        color =mfa_input['nodes'][i][nodes_cols.index('Couleur')]
        if type(color) != str and math.isnan(color) or color == '':
            color = 'grey'
        if not is_hex(color):
            color = webcolors.name_to_hex(color)
        node_definition = None
        if has_definition_col and type(mfa_input['nodes'][i][nb_cols-1]) == str:
            node_definition = mfa_input['nodes'][i][nb_cols-1]
        node_tags = {}
        for _,node_tag_name in enumerate(nodeTags.keys()):
            tag_value = mfa_input['nodes'][i][mfa_input['nodes'][0].index(node_tag_name)]
            if type(tag_value) != str and math.isnan(tag_value):
                continue
            node_tags[node_tag_name] = tag_value.split(':')

        level = mfa_input['nodes'][i][nodes_cols.index('Level')]
        #new_node['dimensions']['Primaire']['level'] = int(level)
        parent_name = None
        if level > previous_level:
            current_node_parent = nodes['node'+str(i-2)]
            current_parent_level = previous_level
        if level > current_parent_level:
            parent_name = current_node_parent['idNode']
        previous_level = level
        display = 1
        node_visible = 1
        if level != 1:
          display = 0
          node_visible = 0
        new_node = {
            'idNode'        : 'node'+str(i-1),
            'name'          : name,
            'definition'    : node_definition,
            'type'          : shape,
            'tags'          : node_tags,
            'dimensions'    : {
                'Primaire':{
                    'parent_name': parent_name,
                    'level'      : int(level)
                }
            },
            'label_visible' : 1,
            'shape_visible' : 1,
            'display'       : display,
            'node_visible'  : node_visible,
            'color'         : color
        }
        nodes[new_node['idNode']] = new_node

def parse_tags(mfa_input, dataTags, nodeTags, fluxTags):
    if 'tags' in mfa_input and len(mfa_input['tags']) != 0:
       for i in range(len(mfa_input['tags'])):
           if mfa_input['tags'][i][1] == 'dataTags':
                tmp = mfa_input['tags'][i][2].split(':')
                tmp = [s.strip() for s in tmp]
                try:
                    color_tmp = [s.strip() for s in mfa_input['tags'][i][5].split(':')]
                except Exception as excpt:
                    color_tmp = ['']
                tags = { s : {'name':s,'selected': 0, 'color' : ''} for i,s in enumerate(tmp)}
                tags[tmp[0]]['selected'] = 1
                if color_tmp[0] != '':
                    for j,tag_key in enumerate(tags.keys()):
                        color = color_tmp[j]
                        if not is_hex(color):
                            color = webcolors.name_to_hex(color)
                        tags[tag_key]['color'] = color
                dataTags[mfa_input['tags'][i][0]] = {
                    'group_name'  : mfa_input['tags'][i][0],
                    'show_legend' : 0,
                    'tags'        : tags,
                    'banner'      : 'one'                   
                }
           elif mfa_input['tags'][i][1] == 'nodeTags':
                tmp = mfa_input['tags'][i][2].split(':')
                tmp = [s.strip() for s in tmp]
                try:
                    color_tmp = [s.strip() for s in mfa_input['tags'][i][5].split(':')]
                except Exception as excpt:
                    color_tmp = ['']
                tags = { s : {'name':s,'selected': 1, 'color' : ''} for i,s in enumerate(tmp)}
                if color_tmp[0] != '':
                    for j,tag_key in enumerate(tags.keys()):
                        color = color_tmp[j]
                        if not is_hex(color):
                            color = webcolors.name_to_hex(color)
                        tags[tag_key]['color'] = color
                nodeTags[mfa_input['tags'][i][0]] = {
                    'group_name'  : mfa_input['tags'][i][0],
                    'show_legend' : 0,
                    'tags'        : tags,
                    'banner'      : 'multi'                   
                }              
           elif mfa_input['tags'][i][1] == 'fluxTags':
                tmp = mfa_input['tags'][i][2].split(':')
                tmp = [s.strip() for s in tmp]
                try:
                    color_tmp = [s.strip() for s in mfa_input['tags'][i][5].split(':')]
                except Exception as excpt:
                    color_tmp = ['']
                tags = { s : {'name':s,'selected': 1, 'color' : ''} for i,s in enumerate(tmp)}
                if color_tmp[0] != '':
                    for j,tag_key in enumerate(tags.keys()):
                        color = color_tmp[j]
                        if not is_hex(color):
                            color = webcolors.name_to_hex(color)
                        tags[tag_key]['color'] = color
                fluxTags[mfa_input['tags'][i][0]] = {
                    'group_name'  : mfa_input['tags'][i][0],
                    'show_legend' : 0,
                    'tags'        : tags,
                    'banner'      : 'multi'                   
                }

def save_simple_excel(
    sankey_data : dict
):
    nodes_cols =  ['Level', 'Element','Couleur', 'Forme']
    #nodes_cols = mfa_input['nodes'][0]
    # tag_names are disposed between the column Dimensions and the column Définition
    tag_key_names = list(sankey_data['dataTags']) + list(sankey_data['nodeTags']) + list(sankey_data['fluxTags'])
    tag_group_names = [ tags_group['group_name'] for tags_group in sankey_data['dataTags'].values()] +\
                      [ tags_group['group_name'] for tags_group in sankey_data['nodeTags'].values()] +\
                      [ tags_group['group_name'] for tags_group in sankey_data['fluxTags'].values()]
    nodes = {}
    tags =[]
    if len(tag_group_names) != 0:
        tags = [[""] * 6] * (len(tag_group_names)+1)
        tags[0] = ["Name","Type","Tags","isPalette","Colormap","Color"]
        for i in range(len(tag_key_names)):
            if tag_key_names[i] in sankey_data['dataTags']:
                tags_colors = (':').join([ tag['color'] for tag in sankey_data['dataTags'][tag_key_names[i]]['tags'].values()])
                tags[i+1]=[tag_key_names[i],'dataTags',(':').join([ tag['name'] for tag in sankey_data['dataTags'][tag_key_names[i]]['tags'].values()]),'',sankey_data['dataTags'][tag_key_names[i]]['color_map'],tags_colors]
            elif tag_key_names[i] in sankey_data['nodeTags']:
                tags_colors = (':').join([ tag['color'] for tag in sankey_data['nodeTags'][tag_key_names[i]]['tags'].values()])
                tags[i+1]=[tag_key_names[i],'nodeTags',(':').join([ tag['name'] for tag in sankey_data['nodeTags'][tag_key_names[i]]['tags'].values()]),'',sankey_data['nodeTags'][tag_key_names[i]]['color_map'],tags_colors]
            elif tag_key_names[i] in sankey_data['fluxTags']:
                tags_colors = (':').join([ tag['color'] for tag in sankey_data['fluxTags'][tag_key_names[i]]['tags'].values()])
                tags[i+1]=[tag_key_names[i],'fluxTags',(':').join([ tag['name'] for tag in sankey_data['fluxTags'][tag_key_names[i]]['tags'].values()]),'',sankey_data['fluxTags'][tag_key_names[i]]['color_map'],tags_colors]

    nb_cols_nodes = 4 + len(sankey_data['nodeTags'].keys()) + 1

    nodes = [ [""] * nb_cols_nodes for i in range(len(sankey_data['nodes'].keys())+1) ] 
    nodes[0] = ["Level","Element","Couleur","Forme"]+list(sankey_data['nodeTags'])

    for i,node in enumerate(sankey_data['nodes'].values()):
        nodes[i+1][nodes_cols.index('Element')] = node['name']
        shape   = node['type']
        if shape == 'sector' :
            nodes[i+1][nodes_cols.index('Forme')] = 'rectangle' 
        else:
            nodes[i+1][nodes_cols.index('Forme')] = 'circle'
        nodes[i+1][nodes_cols.index('Couleur')] = node['color']
        if 'definition' in node:
            nodes[i+1][nb_cols_nodes-1] = node['definition']             
        for j,tag_name in enumerate(sankey_data['nodeTags']):
            nodes[i+1][4+j] = (':').join(node['tags'][tag_name])
        nodes[i+1][nodes_cols.index('Level')] = 1
        if 'Primaire' in node['dimensions'] and 'level' in node['dimensions']['Primaire']:
            nodes[i+1][nodes_cols.index('Level')] = node['dimensions']['Primaire']['level']

    flux_cols = [
        'Origin', 'Destination', 'Value'
    ]

    nb_cols_nodes = 3 + len(sankey_data['dataTags'].keys()) + len(sankey_data['fluxTags'].keys())
    nb_vals = 1
    for dataTag in sankey_data['dataTags']:
        if len(sankey_data['dataTags'][dataTag]['tags']) != 0:
            nb_vals = nb_vals * len(sankey_data['dataTags'][dataTag]['tags'])
    links = [ [""] * nb_cols_nodes for i in range(len(sankey_data['links'].keys())*nb_vals+1) ]
    links[0] = flux_cols + list(sankey_data['dataTags']) + list(sankey_data['fluxTags'])
    row=1
    for _,link in enumerate(sankey_data['links'].values()):
        val = link['value']
        row = add_links(sankey_data, flux_cols, links, row, link, val,0)

    products = [node['name'] for node in sankey_data['nodes'].values() if node['type'] == 'product']
    sectors  = [node['name'] for node in sankey_data['nodes'].values() if node['type'] == 'sector']
    nb_products = len(products)
    nb_sectors  = len(sectors)

    if nb_products == 0 or nb_sectors == 0:
        mfa_output = {
            'nodes' : nodes,
            'tags'  : tags,
            'data'  : links,
        }
        return mfa_output,products,sectors

    ter = {
        'use': [[None for x in range(nb_sectors + 1)] for y in range(nb_products + 1)],
        'supply': [[None for x in range(nb_sectors + 1)] for y in range(nb_products + 1)]
    }

    for i in range(0, nb_products):
        ter['supply'][i+1][0] = products[i]
        ter['use'][i+1][0] = products[i]
    for j in range(0, nb_sectors):
        ter['supply'][0][j+1] = sectors[j]
        ter['use'][0][j+1] = sectors[j]
    for row in range(1,len(links)):
        origin      = links[row][flux_cols.index('Origin')]
        destination = links[row][flux_cols.index('Destination')]
        if origin in products:
            product_idx = products.index(origin)
            sector_idx = sectors.index(destination)
            ter['use'][product_idx+1][sector_idx+1] = 1
        else:
            product_idx = products.index(destination)
            sector_idx = sectors.index(origin)
            ter['supply'][product_idx+1][sector_idx+1] = 1           
    mfa_output = {
        'nodes' : nodes,
        'tags'  : tags,
        'data'  : links,
        'ter_base'   : ter
    }

    return mfa_output,products,sectors

def add_links(sankey_data, flux_cols, links, row, link, val,depth):
    if ( 'value' in val):
        links[row][flux_cols.index('Origin')] = sankey_data['nodes'][link['idSource']]['name']
        links[row][flux_cols.index('Destination')] = sankey_data['nodes'][link['idTarget']]['name']
        links[row][flux_cols.index('Value')] = val['value']
        for i,flux_tag_key in enumerate(sankey_data['fluxTags'].keys()):
            if flux_tag_key in val['tags']:
                links[row][3+depth+i] = val['tags'][flux_tag_key]
            else:
                links[row][3+depth+i] = ''
        return row+1
    for i,data_tag_name in enumerate(val.keys()):
        links[row][3+depth] = data_tag_name
        new_row = add_links(sankey_data, flux_cols, links, row, link, val[data_tag_name],depth+1)
        for i in range(row,new_row):
            links[i][3+depth] = data_tag_name
        row = new_row
    return row