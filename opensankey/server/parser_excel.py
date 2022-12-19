import pandas as pd
import numpy as np
import re
import webcolors
import math
from mfa_problem.io_excel import *
from mfa_problem import mfa_problem_format_io

def is_hex(s):
    return re.fullmatch(r"^\#?[0-9a-fA-F]+$", s or "") is not None

def combine_data_tags(
    dataTags: dict,
    depth: int,
    currentDataTag: dict,
    combinaison: list,
    row: list  
):
    if depth == len(dataTags):
        for tag in currentDataTag['tags']:
            row_copy = copy.deepcopy(row)
            row_copy[depth-1] = tag
            combinaison.append(row_copy)
    else:
        for tag in currentDataTag['tags']:
            row_copy = copy.deepcopy(row)
            row_copy[depth-1] = tag
            combine_data_tags(dataTags,depth+1,list(dataTags.values())[depth],combinaison, row_copy)   
        

def set_value(
    row_data_tags:list,
    row_flux_tags:list,
    fluxTags:dict,
    depth: int,
    v: dict,
    value: float,
    display_value: str
):
    v_tags = {}
    for i,key in enumerate(fluxTags.keys()):
        tag_value = row_flux_tags[i]
        if key == 'Type de donnée':
            key = 'flux_types'
        if key == 'flux_types':
            if row_flux_tags[i] == 'Donnée calculée':
                tag_value = 'computed_data'
            else:
                tag_value = 'initial_data'
        v_tags[key]=tag_value
    if depth == len(row_data_tags):
        v['value'] = value
        v['display_value'] = display_value
        v['tags'] = v_tags
        v['extension'] = {}        
    else:
        data_tag = str(row_data_tags[depth])
        if data_tag not in v:
            v[data_tag] = {}
        set_value(row_data_tags,row_flux_tags,fluxTags,depth+1,v[data_tag],value,display_value)

def parse_excel(mfa_input):
    # if not NODES_SHEET in mfa_input:
    #     return
    dataTags = {}
    nodeTags = {}
    fluxTags = {}
    parse_tags(mfa_input, dataTags, nodeTags, fluxTags)
    nodes = {}
    parse_nodes(mfa_input, nodes, nodeTags)
    nodes = {node['idNode']:node for node in nodes.values()}
    links = {}
    parse_links(mfa_input, nodes, dataTags, fluxTags, links)
    return {
        'version'      : '0.8',
        
        'dataTags'     : dataTags,
        'nodeTags'     : nodeTags,
        'fluxTags'     : fluxTags,
        
        'nodes'        : nodes,
        'links'        : links,
        'labels'       : {}
    }

def parse_links(mfa_input, nodes, dataTags, fluxTags, links):
    # nb_data_tags = len(dataTags.keys())
    # nb_flux_tags = len(fluxTags.keys())
    sheet_name = DATA_SHEET
    if RESULTS_SHEET in mfa_input and len(mfa_input[RESULTS_SHEET]) > 1:
        sheet_name = RESULTS_SHEET
        
    if not NODES_SHEET in mfa_input:
        node_index = 0

    nb_links = 0
    if FLUX_SHEET in mfa_input:   
        for row in range(len(mfa_input[FLUX_SHEET])):
            source_name = mfa_input[FLUX_SHEET].iat[row,0]
            target_name =  mfa_input[FLUX_SHEET].iat[row,1]
            if NODES_SHEET in mfa_input:
                source_nodes = [node for node in nodes.values() if node['name'] == source_name]
                target_nodes = [node for node in nodes.values() if node['name'] == target_name]
                if len(source_nodes) == 0:
                    continue
                if len(target_nodes) == 0:
                    continue
                source_node = source_nodes[0]
                target_node = target_nodes[0]
            else:
                source_nodes = [node for node in nodes.values() if node['name'] == source_name]
                if len(source_nodes) == 0:
                    source_node = {
                        'idNode'        : 'node'+str(node_index),
                        'name'          : source_name,
                        'definition'    : '',
                        'display'       : 1,
                        'node_visible'  : 1,
                        'label_visible' : 1,
                        'shape_visible' : 1,
                        'color'         : color,
                        'tags'          : {}
                    }
                    node_index = node_index+1
                    nodes[source_name] = source_node
                else:
                   source_node = source_nodes[0] 
                target_nodes = [node for node in nodes.values() if node['name'] == target_name]
                if len(target_nodes) == 0:
                    target_node = {
                        'idNode'        : 'node'+str(node_index),
                        'name'          : target_name,
                        'definition'    : '',
                        'display'       : 1,
                        'node_visible'  : 1,
                        'label_visible' : 1,
                        'shape_visible' : 1,
                        'color'         : color,
                        'tags'          : {}
                    }
                    node_index = node_index+1
                    nodes[target_name] = target_node
                else:
                    target_node = target_nodes[0]
                
            color = source_node['color']
            if 'Type de noeud' in source_node['tags'] and 'produit' in source_node['tags']['Type de noeud']:
                color = source_node['color']
            elif 'Type de noeud' in target_node['tags'] and 'produit' in target_node['tags']['Type de noeud']:
                color = target_node['color']
            if not is_hex(color):
                try:
                    color = webcolors.name_to_hex(color)
                except Exception:
                    pass 
            row_data_tags= []
            
            combinaison_row = [None] * len(dataTags)
            combinaison = []
            if len(dataTags) > 0:
                combine_data_tags(dataTags,1,list(dataTags.values())[0],combinaison,combinaison_row)
            else:
                combinaison = [[]]
            for row_data_tags in combinaison:    
                row_flux_tags= []
                for fluxTag in fluxTags:
                    if fluxTag == 'flux_types':
                        fluxTag = DATA_TYPE_LABEL
                    row_flux_tags.append('')
                existing_links = [links[key] for key in links.keys() if nodes[links[key]['idSource']]['name'] == source_name and nodes[links[key]['idTarget']]['name'] == target_name]
                val = ''
                display_val = ''
                if len(existing_links) > 0:
                    new_link = existing_links[0]
                    set_value(row_data_tags,row_flux_tags,fluxTags,0,new_link['value'], val,display_val)
                else:
                    value = {}
                    set_value(row_data_tags,row_flux_tags,fluxTags,0,value, val, display_val)
                    new_link = {
                        'idLink'   : 'link'+str(nb_links),  
                        'idSource' : source_node['idNode'],
                        'idTarget' : target_node['idNode'],
                        'value'    : value,
                        'color'    : color,
                        'dashed'   : 1
                    }
                    nb_links = nb_links+1
                    links[new_link['idLink']] = new_link
    if not sheet_name in mfa_input:
        return
    columns =  mfa_input[sheet_name].columns.tolist()           
    for row in range(len(mfa_input[sheet_name])):
        source_name = mfa_input[sheet_name].iat[row,columns.index(DATA_ORIGIN)]
        target_name =  mfa_input[sheet_name].iat[row,columns.index(DATA_DESTINATION)]
        if NODES_SHEET in mfa_input:
            source_nodes = [node for node in nodes.values() if node['name'] == source_name]
            target_nodes = [node for node in nodes.values() if node['name'] == target_name]
            if len(source_nodes) == 0:
                continue
            if len(target_nodes) == 0:
                continue
            # if len(source_nodes) == 0:
            #     source_nodes = [nodes[key] for key in nodes.keys() if nodes[key]['name'] == (source_name + ' - Importations')]
            #     target_nodes = [nodes[key] for key in nodes.keys() if nodes[key]['name'] == target_name]
            #     if len(source_nodes) == 0 or len(target_nodes) == 0:            
            #         continue
            # if len(target_nodes) == 0:
            #     source_nodes = [nodes[key] for key in nodes.keys() if nodes[key]['name'] == source_name]
            #     target_nodes = [nodes[key] for key in nodes.keys() if nodes[key]['name'] == (target_name + ' - Exportations')]
            #     if len(source_nodes) == 0 or len(target_nodes) == 0:            
            #         continue
                
            source_node = source_nodes[0]
            target_node = target_nodes[0]        
        else:
            source_nodes = [node for node in nodes.values() if node['name'] == source_name]
            if len(source_nodes) == 0:
                source_node = {
                    'idNode'        : 'node'+str(node_index),
                    'name'          : source_name,
                    'definition'    : '',
                    'display'       : 1,
                    'node_visible'  : 1,
                    'label_visible' : 1,
                    'shape_visible' : 1,
                    'color'         : 'grey',
                    'tags'          : {}
                }
                node_index = node_index+1
                nodes[source_node['idNode']] = source_node
            else:
               source_node = source_nodes[0] 
            target_nodes = [node for node in nodes.values() if node['name'] == target_name]
            if len(target_nodes) == 0:
                target_node = {
                    'idNode'        : 'node'+str(node_index),
                    'name'          : target_name,
                    'definition'    : '',
                    'display'       : 1,
                    'node_visible'  : 1,
                    'label_visible' : 1,
                    'shape_visible' : 1,
                    'color'         : 'grey',
                    'tags'          : {}
                }
                node_index = node_index+1
                nodes[target_node['idNode']] = target_node        
            else:
                target_node = target_nodes[0] 
        color = source_node['color']
        if 'Type de noeud' in source_node['tags'] and 'produit' in source_node['tags']['Type de noeud']:
            color = source_node['color']
        elif 'Type de noeud' in target_node['tags'] and 'produit' in target_node['tags']['Type de noeud']:
            color = target_node['color']
        if not is_hex(color):
            try:
               color = webcolors.name_to_hex(color)
            except Exception:
                pass 
        row_data_tags= []
        for dataTag in dataTags:
            if dataTag in columns:
                row_data_tags.append(mfa_input[sheet_name].iat[row,columns.index(dataTag)])
        row_flux_tags= []
        for fluxTag in fluxTags:
            if fluxTag == 'flux_types':
                fluxTag = DATA_TYPE_LABEL
                if not fluxTag in columns:
                    #row_flux_tags.append('Donnée collectée')
                    row_flux_tags.append('')
                    continue
            row_flux_tags.append(mfa_input[sheet_name].iat[row,columns.index(fluxTag)])

        existing_links = [links[key] for key in links.keys() if nodes[links[key]['idSource']]['name'] == source_name and nodes[links[key]['idTarget']]['name'] == target_name]
        val = mfa_input[sheet_name].iat[row,columns.index(DATA_VALUE)]
        if val == None:
            val = ''
        else:
            val = float(val)
        display_val = ''
        is_existing_link = len(existing_links) > 0
        if is_existing_link:
            existing_link = existing_links[0]
            existing_v = existing_link['value']

            for row_data_tag in row_data_tags:                
                if not row_data_tag in existing_v:
                    break
                else:
                    existing_v = existing_v[row_data_tag]
            if 'tags' in existing_v:
                for i,row_flux_tag in enumerate(row_flux_tags):
                    if row_flux_tag == 'Donnée calculée' or row_flux_tag == 'Donnée collectée':
                        continue
                    if row_flux_tag != existing_v['tags'][list(fluxTags.keys())[i]] and existing_v['tags'][list(fluxTags.keys())[i]] != '':
                        is_existing_link = False
                                   
        if is_existing_link:
            if val != '':              
                existing_link['dashed'] = 0
            set_value(row_data_tags,row_flux_tags,fluxTags,0,existing_link['value'], val,display_val)
        else:
            value = {}
            set_value(row_data_tags,row_flux_tags,fluxTags,0,value, val, display_val)
            dashed = 1
            if val != '':
                dashed = 0
            new_link = {
                'idLink'   : 'link'+str(nb_links),  
                'idSource' : source_node['idNode'],
                'idTarget' : target_node['idNode'],
                'value'    : value,
                'color'    : color,
                'dashed'   : dashed
            }
            nb_links = nb_links+1
            links[new_link['idLink']] = new_link

def parse_nodes(mfa_input, nodes, nodeTags):
    # current_parent_level = 1
    # previous_level = 1
    if not NODES_SHEET in mfa_input:
        return
    nodes_cols = mfa_input[NODES_SHEET].columns.tolist()
    nodes_sheet = mfa_input[NODES_SHEET]
    has_sankey_col = NODES_SANKEY in nodes_cols and nodes_sheet[NODES_SANKEY].unique().shape[0] > 1

    node_index = 0
    for i in range(len(mfa_input[NODES_SHEET])):
        if NODES_SANKEY in nodes_cols:
            sankey_visible = mfa_input[NODES_SHEET].iat[i,nodes_cols.index(NODES_SANKEY)]
            if sankey_visible == 0:
                continue
             
        name  = mfa_input[NODES_SHEET].iat[i,nodes_cols.index(NODES_NODE)]
        if not name in nodes:
            if not has_sankey_col or mfa_input[NODES_SHEET].iat[i,nodes_cols.index(NODES_SANKEY)] == 1:
                # if sankey column is present and value is 1 node is displayed
                node_visible = 1
            else:
                node_visible = 0                
            color = 'grey'
            if NODES_SANKEY in nodes_cols:
                color = mfa_input[NODES_SHEET].iat[i,nodes_cols.index(NODES_COLOR)]
                if type(color) != str and math.isnan(color) or color == '':
                    color = 'grey'
                if not is_hex(color):
                    try:
                        color = webcolors.name_to_hex(color)
                    except Exception:
                        pass
            node_definition = None
            if NODES_DEFINITIONS in nodes_cols and type(mfa_input[NODES_SHEET].iat[i,nodes_cols.index(NODES_DEFINITIONS)]) == str:
                node_definition = mfa_input[NODES_SHEET].iat[i,nodes_cols.index(NODES_DEFINITIONS)]
            new_node = {
                'idNode'        : 'node'+str(node_index),
                'name'          : name,
                'definition'    : node_definition,
                'display'       : node_visible,
                'node_visible'  : node_visible,
                'label_visible' : 1,
                'shape_visible' : 1,
                'color'         : color,
                'tags'          : {}
            }
            node_index = node_index+1
            nodes[name] = new_node
        else:
            new_node = nodes[name]

        for _,node_tag_name in enumerate(nodeTags.keys()):
            tag_value = mfa_input[NODES_SHEET].iat[i,nodes_cols.index(node_tag_name)]
            if tag_value == None or tag_value == '':
                continue
            if type(tag_value) != str and math.isnan(tag_value):
                continue

            try:
                tag_value =  float(tag_value)
                tag_value = str(int(tag_value))
            except:
                pass
            if not node_tag_name in new_node['tags']:
                new_node['tags'][node_tag_name] = []
            new_node['tags'][node_tag_name] = new_node['tags'][node_tag_name] + tag_value.split(':')
            new_node['tags'][node_tag_name] = list(set(new_node['tags'][node_tag_name]))
            new_node['tags'][node_tag_name].sort()

        level = mfa_input[NODES_SHEET].iat[i,nodes_cols.index(NODES_LEVEL)]
        if not 'dimensions'  in new_node:
            new_node['dimensions'] = {}
        levelTags = [tags for tags in nodeTags.keys() if nodeTags[tags]['banner'] == 'level']
        if len(levelTags) == 0:       
            new_node['dimensions']['Primaire'] = {}
            #new_node['dimensions']['Primaire']['level'] = int(level)
            new_node['tags']['Primaire'] = [str(int(level))]
            if i != len(mfa_input[NODES_SHEET])-1 and mfa_input[NODES_SHEET].iat[i+1,nodes_cols.index(NODES_LEVEL)] <= mfa_input[NODES_SHEET].iat[i,nodes_cols.index(NODES_LEVEL)]:
                new_node['tags']['set_level'] = True
            elif level == 1 and i == len(mfa_input[NODES_SHEET])-1:
                new_node['tags']['set_level'] = True            
        if level == 1:
            for dim in levelTags:
                group_name = dim
                if mfa_input[NODES_SHEET].iat[i,nodes_cols.index(group_name)] != '' and group_name not in new_node['dimensions']:
                    new_node['dimensions'][group_name] = {}
        else:
            j = i
            found = False
            while not found:
                j = j-1
                if  mfa_input[NODES_SHEET].iat[j,nodes_cols.index(NODES_LEVEL)] <  mfa_input[NODES_SHEET].iat[i,nodes_cols.index(NODES_LEVEL)] :
                    parent_name =  mfa_input[NODES_SHEET].iat[j,nodes_cols.index(NODES_NODE)].strip()
                    if parent_name in nodes:
                        if len(levelTags) == 0:
                            new_node['dimensions']['Primaire']['parent_name'] = nodes[parent_name]['idNode']
                        for dim in levelTags:
                            group_name = dim
                            node_tags = new_node['tags']
                            parent_tags = nodes[parent_name]['tags']
                            if group_name not in parent_tags or group_name not in node_tags:
                                continue
                            if int(parent_tags[group_name][0]) == int(node_tags[group_name][0])-1:
                                if group_name not in new_node['dimensions']:
                                    new_node['dimensions'][group_name] = {}
                                new_node['dimensions'][group_name]['parent_name'] = nodes[parent_name]['idNode']
                                found = True
                                break
                if  mfa_input[NODES_SHEET].iat[j,nodes_cols.index(NODES_LEVEL)] == 1:
                    break
    if len(levelTags) == 0:
        max_level = 0
        for node in nodes.values():
            if int(node['tags']['Primaire'][0]) > max_level:
                max_level = int(node['tags']['Primaire'][0])
        for node in nodes.values():
            try:
                if 'set_level' in node['tags'] and node['tags']['set_level']:
                    node['tags']['Primaire'] = [str(lev) for lev in list(range(int(node['tags']['Primaire'][0]),max_level+1))]
                    del node['tags']['set_level']
            except Exception:
                pass
        if max_level > 1:
            nodeTags['Primaire'] = {
                'group_name' : 'Primaire',
                'show_legend' : 0,
                'tags'        : {},
                'banner'      : 'level',
                'activated'   : 1                    
            }
            for tag in range(1,max_level+1):
                selected = False
                if tag == 1:
                    selected = True
                nodeTags['Primaire']['tags'][str(tag)] = {
                    'name' : str(tag),
                    'selected' : selected,
                    'color' : ''
                }
                
                     
def parse_tags(mfa_input, dataTags, nodeTags, fluxTags):
    if TAG_SHEET in mfa_input and len(mfa_input[TAG_SHEET]) != 0:
       for i in range(len(mfa_input[TAG_SHEET])):
           if mfa_input[TAG_SHEET].iat[i,1] == 'dataTags':
                tmp = mfa_input[TAG_SHEET].iat[i,2].split(':')
                tmp = [s.strip() for s in tmp]
                try:
                    color_tmp = [s.strip() for s in mfa_input[TAG_SHEET].iat[i,5].split(':')]
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
                dataTags[mfa_input[TAG_SHEET].iat[i,0]] = {
                    'group_name'  : mfa_input[TAG_SHEET].iat[i,0],
                    'show_legend' : 0,
                    'tags'        : tags,
                    'banner'      : 'one',
                    'activated'   : 1                      
                }
           elif mfa_input[TAG_SHEET].iat[i,1] == 'nodeTags' or mfa_input[TAG_SHEET].iat[i,1] == 'levelTags':
                if mfa_input[TAG_SHEET].iat[i,0] == 'Dimensions':
                    continue
                tag_group_names = mfa_input[TAG_SHEET].iat[i,0].split('/')
                tag_names = mfa_input[TAG_SHEET].iat[i,2].split('/')
                colors = mfa_input[TAG_SHEET].iat[i,5].split('/')
                for j,tag_group_name in enumerate(tag_group_names):
                    tmp2 = tag_names[j].split(':')
                    tmp2 = [s.strip() for s in tmp2]
                    try:
                        color_tmp = [s.strip() for s in colors[j].split(':')]
                        if len(color_tmp) != len(tmp2):
                            color_tmp = ['']
                    except Exception as excpt:
                        color_tmp = ['']
                    selected = 1
                    if mfa_input[TAG_SHEET].iat[i,1] == 'levelTags':
                        selected = 0
                    tags = { s : {'name':s,'selected': selected, 'color' : ''} for i,s in enumerate(tmp2)}
                    if mfa_input[TAG_SHEET].iat[i,1] == 'levelTags':
                        tags['1']['selected'] = 1
                    if color_tmp[0] != '':
                        for k,tag_key in enumerate(tags.keys()):
                            color = color_tmp[k]
                            if not is_hex(color):
                                color = webcolors.name_to_hex(color)
                            tags[tag_key]['color'] = color
                    banner = 'multi'
                    if tag_group_name == NODE_TYPE:
                        banner = 'none'                    
                    if mfa_input[TAG_SHEET].iat[i,1] == 'levelTags':
                        banner = 'level'
                    activated = 0
                    if j==0:    
                        activated = 1   
                    nodeTags[tag_group_name] = {
                        'group_name'  : tag_group_name,
                        'show_legend' : 0,
                        'tags'        : tags,
                        'banner'      : banner,
                        'activated'   : activated,
                        'siblings'    : [n for n in tag_group_names if n != tag_group_name]              
                    }              
           elif mfa_input[TAG_SHEET].iat[i,1] == 'fluxTags':
                tmp = mfa_input[TAG_SHEET].iat[i,2].split(':')
                tmp = [s.strip() for s in tmp]
                try:
                    color_tmp = [s.strip() for s in mfa_input[TAG_SHEET].iat[i,5].split(':')]
                except Exception as excpt:
                    color_tmp = ['']
                tags = { s : {'name':s,'selected': 1, 'color' : ''} for i,s in enumerate(tmp)}
                if color_tmp[0] != '':
                    for j,tag_key in enumerate(tags.keys()):
                        color = color_tmp[j]
                        if not is_hex(color):
                            color = webcolors.name_to_hex(color)
                        tags[tag_key]['color'] = color
                key = mfa_input[TAG_SHEET].iat[i,0]
                banner = 'multi'
                if key == 'Type de donnée':
                    key = 'flux_types'
                    tags['initial_data'] = tags.pop('Donnée collectée')
                    tags['computed_data'] = tags.pop('Donnée calculée')
                    banner = 'multi'
                fluxTags[key] = {
                    'group_name'  : mfa_input[TAG_SHEET].iat[i,0],
                    'show_legend' : 0,
                    'tags'        : tags,
                    'banner'      : banner,
                    'activated'   : 1                   
                }

def save_excel(
    sankey_data : dict,
    save_all : bool
):
    nodes_cols =  [NODES_LEVEL, NODES_NODE]
    #nodes_cols = mfa_input[NODES_SHEET][0]
    # tag_names are disposed between the column Dimensions and the column Définition
    tag_key_names = list(sankey_data['dataTags']) + list(sankey_data['nodeTags']) + list(sankey_data['fluxTags'])

    nodes = []
    tags_sheet =[]
    if len(tag_key_names) != 0:
        tags_sheet = [[""] * 6] * (len(tag_key_names)+1)
        tags_sheet[0] = [TAG_NAME,TAG_TYPE,TAG_TAGS,TAG_IS_PALETTE,TAG_COLORMAP,TAG_COLOR]

    row = 1
    skip = False
    has_level = False
    for tag_group_type in ['dataTags','nodeTags','fluxTags']:
        tag_key_names = list(sankey_data[tag_group_type])
        tag_group_names = [ tags_group['group_name'] for tags_group in sankey_data[tag_group_type].values()]
        for i in range(len(tag_key_names)):
            banner = sankey_data[tag_group_type][tag_key_names[i]]['banner']
            tags_colors = (':').join([ tag['color'] for tag in sankey_data[tag_group_type][tag_key_names[i]]['tags'].values() if 'color' in tag])
            the_tag_group_type = tag_group_type
            if tag_group_names[i] == 'Primaire':
                skip = True
                for j,node in enumerate(sankey_data['nodes'].values()):
                    if 'Primaire' in node['dimensions'] and 'parent_name' in node['dimensions']['Primaire']:
                        skip = False
                if skip:
                    del sankey_data['nodeTags']['Primaire']
                    continue
            if banner == 'level':
                the_tag_group_type = 'levelTags'
                has_level = True
            tags_sheet[row]=[tag_group_names[i],the_tag_group_type,(':').join([ tag['name'] for tag in sankey_data[tag_group_type][tag_key_names[i]]['tags'].values()]),'',sankey_data[tag_group_type][tag_key_names[i]]['color_map'],tags_colors]
            row = row+1
            
    if len(tags_sheet) == 2 and skip:
        tags_sheet =[]
    
    #nodes = [ [""] * nb_cols_nodes for i in range(len(sankey_data['nodes'].keys())+1) ] 
    nodeTags_group_names = [ tags_group['group_name'] for tags_group in sankey_data['nodeTags'].values()]
    nb_cols_nodes = len(nodes_cols) + len(nodeTags_group_names)
    nodes.append([NODES_LEVEL, NODES_NODE]+nodeTags_group_names)
    
    has_dimensions = len([node for node in sankey_data['nodes'].values() if len(node['dimensions'].keys())]) > 0 and has_level
    has_definitions = False
    for row,node in enumerate(sankey_data['nodes'].values()):
        if 'tooltip_text' in node and node['tooltip_text'] != None and node['tooltip_text'] != '':
            nb_cols_nodes = nb_cols_nodes+1
            nodes[0].append(NODES_DEFINITIONS)
            has_definitions = True
            break
    if not has_dimensions:
        for row,node in enumerate(sankey_data['nodes'].values()):
            nodes.append([""] * nb_cols_nodes)
            nodes[row+1][nodes_cols.index(NODES_LEVEL)] = 1
            nodes[row+1][nodes_cols.index(NODES_NODE)] = node['name']
            if 'tooltip_text' in node and node['tooltip_text'] != None and node['tooltip_text'] != '':
                nodes[row+1][nb_cols_nodes-1] = node['tooltip_text']
            col_num = 0           
            for j,tag_name in enumerate(sankey_data['nodeTags']):
                tags = sankey_data['nodeTags'][tag_name]['tags']
                if tag_name in node['tags']:
                    tags_names = [tags[node_tag]['name'] for node_tag in node['tags'][tag_name]]
                    nodes[row+1][len(nodes_cols)+col_num] = (':').join(tags_names)
                col_num = col_num+1
    else:
        levelTags = [tags for tags in sankey_data['nodeTags'].keys() if sankey_data['nodeTags'][tags]['banner'] == 'level']
        if len(levelTags) == 0:
            levelTags = ['Primaire']

        for i in range(len(levelTags)):
            levelTag = levelTags[i]
            dim_nodes = []
            row = 0
            for i,node in enumerate(sankey_data['nodes'].values()):
                skip = False
                for k in range(len(levelTags)):
                    if levelTags[k] in node['dimensions'] and 'parent_name' in node['dimensions'][levelTags[k]]:
                        skip = True
                if skip:
                    continue
                dim_nodes.append([""] * nb_cols_nodes)
                dim_nodes[row][nodes_cols.index(NODES_LEVEL)] = 1
                dim_nodes[row][nodes_cols.index(NODES_NODE)] = node['name']
                if 'tooltip_text' in node and node['tooltip_text'] != None:
                    dim_nodes[row][nb_cols_nodes-1] = node['tooltip_text']
                col_num = 0           
                for j,tag_name in enumerate(sankey_data['nodeTags']):
                    tags = sankey_data['nodeTags'][tag_name]['tags']
                    if tag_name in node['tags']:
                        tags_names = [tags[node_tag]['name'] for node_tag in node['tags'][tag_name] if tag_name in node['tags']]
                        dim_nodes[row][len(nodes_cols)+col_num] = (':').join(tags_names)
                    col_num = col_num+1
                #dim_nodes[row][nodes_cols.index(NODES_LEVEL)] = 1
                row = row+1
            
            for i,node in enumerate(sankey_data['nodes'].values()):
                if levelTag in node['dimensions'] and 'parent_name' in node['dimensions'][levelTag]:
                    #level = node['dimensions'][levelTag]['level']
                    parent_id = node['dimensions'][levelTag]['parent_name']
                    parent_name = [node['name'] for node in sankey_data['nodes'].values() if node['idNode'] == parent_id][0]
                else:
                    continue
                parent_rows = [j for j in range(len(dim_nodes)) if dim_nodes[j][nodes_cols.index(NODES_NODE)] == parent_name]
                if len(parent_rows) == 0:
                    continue
                parent_row = parent_rows[0]
                if dim_nodes[parent_row][0] != 1:
                    continue
                dim_nodes.insert(parent_row+1,[""] * nb_cols_nodes)
                row = parent_row+1
                dim_nodes[row][nodes_cols.index(NODES_LEVEL)] = dim_nodes[parent_row][0]+1
                dim_nodes[row][nodes_cols.index(NODES_NODE)] = node['name']
                if 'tooltip_text' in node and node['tooltip_text'] != None:
                    dim_nodes[row][nb_cols_nodes-1] = node['tooltip_text']
                col_num = 0           
                for j,tag_name in enumerate(sankey_data['nodeTags']):
                    if tag_name == 'Dimensions':
                        continue
                    tags = sankey_data['nodeTags'][tag_name]['tags'] 
                    if tag_name in node['tags']:
                        try:
                            tags_names = [tags[node_tag]['name'] for node_tag in node['tags'][tag_name]]
                            dim_nodes[row][len(nodes_cols)+col_num] = (':').join(tags_names)
                        except Exception:
                            print('tutu')
                    col_num = col_num+1 
            nodes = nodes+dim_nodes  
           
        for i,node in enumerate(sankey_data['nodes'].values()):
            for i in range(len(levelTags)):
                levelTag = levelTags[i]
                if levelTag in node['dimensions'] and 'parent_name' in node['dimensions'][levelTag]:
                    #level = node['dimensions'][levelTag]['level']
                    parent_id = node['dimensions'][levelTag]['parent_name']
                    parent_name = [node['name'] for node in sankey_data['nodes'].values() if node['idNode'] == parent_id][0]
                else:
                    continue
                parent_rows = [k for k in range(len(nodes)) if nodes[k][nodes_cols.index(NODES_NODE)] == parent_name]
                if len(parent_rows) == 0:
                    continue
                parent_row = parent_rows[0]
                if nodes[parent_row][0] != 2:
                    continue
                # if node['tags'][levelTag] == sankey_data['nodes'][parent_id]['tags'][levelTag]:
                #     continue
                nodes.insert(parent_row+1,[""] * nb_cols_nodes)
                row = parent_row+1
                nodes[row][nodes_cols.index(NODES_LEVEL)] = nodes[parent_row][0]+1
                nodes[row][nodes_cols.index(NODES_NODE)] = node['name']
                if 'definition' in node:
                    nodes[row][nb_cols_nodes-1] = node['definition']
                col_num = 0           
                for j,tag_name in enumerate(sankey_data['nodeTags']):
                    tags = sankey_data['nodeTags'][tag_name]['tags'] 
                    tags_names = ['']
                    if tag_name in node['tags']:
                        tags_names = [tags[node_tag]['name'] for node_tag in node['tags'][tag_name]]
                        nodes[row][len(nodes_cols)+col_num] = (':').join(tags_names)
                    col_num = col_num+1             
            
    flux_cols = [
        DATA_ORIGIN, DATA_DESTINATION, DATA_VALUE
    ]

    nb_cols_nodes = 3 + len(sankey_data['dataTags'].keys()) + len(sankey_data['fluxTags'].keys())
    nb_vals = 1
    for dataTag in sankey_data['dataTags']:
        if len(sankey_data['dataTags'][dataTag]['tags']) != 0:
            nb_vals = nb_vals * len(sankey_data['dataTags'][dataTag]['tags'])
    links = [ [""] * nb_cols_nodes for i in range(len(sankey_data['links'].keys())*nb_vals+1) ]
    dataTags_group_names = [ tags_group['group_name'] for tags_group in sankey_data['dataTags'].values()]
    fluxTags_group_names = [ tags_group['group_name'] for tags_group in sankey_data['fluxTags'].values()]
    links[0] = flux_cols + dataTags_group_names + fluxTags_group_names
    row=1
    for _,link in enumerate(sankey_data['links'].values()):
        val = link['value']            
        row = add_links(sankey_data, flux_cols, links, row, link, val,0)
        
    links = [link for link in links if link[0] != "" ]

    # products = [node['name'] for node in sankey_data['nodes'].values() if node['type'] == 'product']
    # sectors  = [node['name'] for node in sankey_data['nodes'].values() if node['type'] == 'sector']
    # nb_products = len(products)
    # nb_sectors  = len(sectors)

    # if nb_products == 0 or nb_sectors == 0:
    #     mfa_output = {
    #         'nodes' : nodes,
    #         'tags'  : tags,
    #         'data'  : links,
    #     }
    #     return mfa_output,products,sectors
    
    #param_sheet = pd.DataFrame([[VERSION_LABEL,0.8,VERSION_DOC]],columns=[PARAM_NAME,PARAM_VALUE,PARAM_DESC])
    
    nodes_names = list(OrderedDict.fromkeys([node[1] for node in nodes[1:]]))
    node_tag_keys = list(sankey_data['nodeTags'])
    if NODE_TYPE in node_tag_keys:
        mfa_output = {
            'nodes' : pd.DataFrame(nodes[1:],columns=nodes[0])
        }
        ter,sectors_names,products_names = mfa_problem_format_io.create_empty_ter(mfa_output)
        s_names2s_idx = {e: i for i, e in enumerate(sectors_names)}
        p_names2p_idx = {e: i for i, e in enumerate(products_names)}
        for row in range(1,len(links)):
            origin      = links[row][flux_cols.index(DATA_ORIGIN)]
            destination = links[row][flux_cols.index(DATA_DESTINATION)]
            if origin in sectors_names:
                sector_name = origin
                product_name = destination
                table_name = 'supply'
            else:
                sector_name = destination
                product_name = origin
                table_name = 'use'
            try:          
                col = s_names2s_idx[sector_name]
                row = p_names2p_idx[product_name]
                ter[table_name].iat[row,col] = 1
            except Exception as excpt:
                print('exception 1: '+str(excpt))
        mfa_output = {
            TAG_SHEET   : pd.DataFrame(tags_sheet[1:],columns=tags_sheet[0]),
            NODES_SHEET : pd.DataFrame(nodes[1:],columns=nodes[0]),
            DATA_SHEET  : pd.DataFrame(links[1:],columns=links[0]),
            TER_SHEET   : ter
        }
    else:
        io_table = [[None for x in range(len(nodes_names) + 1)] for y in range(len(nodes_names) + 1)]

        for i in range(len(nodes_names)):
            io_table[i+1][0] =nodes_names[i]
            #ter['use'][i+1][0] = nodes[i]
        for j in range(len(nodes_names)):
            io_table[0][j+1] = nodes_names[j]
        #     ter['use'][0][j+1] = sectors[j]
        for _,link in enumerate(sankey_data['links'].values()):
            origin      = sankey_data['nodes'][link['idSource']]['name']
            destination = sankey_data['nodes'][link['idTarget']]['name']
            try:
                origin_idx = nodes_names.index(origin)
                destination_idx = nodes_names.index(destination)
                io_table[origin_idx+1][destination_idx+1] = 1
            except Exception as excpt:
                print('exception 2: '+str(excpt))
        io_table = np.array(io_table)
        
        mfa_output = {}
        if len(tags_sheet) > 0:
            mfa_output[TAG_SHEET] = pd.DataFrame(tags_sheet[1:],columns=tags_sheet[0])
        if len(nodes) > 0:
            mfa_output[NODES_SHEET] = pd.DataFrame(nodes[1:],columns=nodes[0])
        if len(links) > 0:
            mfa_output[DATA_SHEET] = pd.DataFrame(links[1:],columns=links[0])
        if len(io_table) > 0:
            mfa_output[IO_SHEET] = pd.DataFrame(data=io_table[1:,1:],index=io_table[1:,0],columns=io_table[0,1:])

    return mfa_output,nodes_names

def add_links(sankey_data, flux_cols, links, row, link, val,depth):
    if len(sankey_data['dataTags'].keys()) == depth:
        #display_val = val['display_value']
        links[row][flux_cols.index(DATA_ORIGIN)] = sankey_data['nodes'][link['idSource']]['name']
        links[row][flux_cols.index(DATA_DESTINATION)] = sankey_data['nodes'][link['idTarget']]['name']
        if val['value'] != '':
            links[row][flux_cols.index(DATA_VALUE)] = float(val['value'])
        for i,flux_tag_key in enumerate(sankey_data['fluxTags'].keys()):
            if flux_tag_key in val['tags']:
                try:
                    links[row][3+depth+i] = sankey_data['fluxTags'][flux_tag_key]['tags'][val['tags'][flux_tag_key]]['name']
                except Exception as expt:
                    print(str(expt))
                    pass
            else:
                links[row][3+depth+i] = ''
        return row+1
    dataTagGroup = list(sankey_data['dataTags'].keys())[depth]
    data_tags = list(sankey_data['dataTags'][dataTagGroup]['tags'].keys())
    for i,data_tag_key in enumerate(data_tags):
        links[row][3+depth] = sankey_data['dataTags'][dataTagGroup]['tags'][data_tag_key]['name']
        if not data_tag_key in val:
            continue
        new_row = add_links(sankey_data, flux_cols, links, row, link, val[data_tag_key],depth+1)
        for i in range(row,new_row):
            links[i][3+depth] = sankey_data['dataTags'][dataTagGroup]['tags'][data_tag_key]['name']
        row = new_row
    return row